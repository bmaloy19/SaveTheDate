import AVFoundation
import Foundation

// Transcode HEVC -> H.264 (High profile) + AAC, MP4, faststart.
let src = URL(fileURLWithPath: CommandLine.arguments[1])
let dst = URL(fileURLWithPath: CommandLine.arguments[2])
let targetBitrate = Int(CommandLine.arguments[3]) ?? 2_200_000
let maxW = CGFloat(Int(CommandLine.arguments[4]) ?? 1280)

try? FileManager.default.removeItem(at: dst)
let sem = DispatchSemaphore(value: 0)

Task {
  do {
    let asset = AVURLAsset(url: src)
    let vTrack = try await asset.loadTracks(withMediaType: .video).first!
    let aTrack = try await asset.loadTracks(withMediaType: .audio).first
    let natural = try await vTrack.load(.naturalSize)
    let fps = try await vTrack.load(.nominalFrameRate)

    // scale to fit maxW, keep even dimensions (H.264 requires even)
    var w = natural.width, h = natural.height
    if w > maxW { let s = maxW / w; w = (w*s).rounded(); h = (h*s).rounded() }
    w = (w/2).rounded()*2; h = (h/2).rounded()*2

    let reader = try AVAssetReader(asset: asset)
    let writer = try AVAssetWriter(outputURL: dst, fileType: .mp4)
    writer.shouldOptimizeForNetworkUse = true   // moov atom first == progressive streaming

    let vOut = AVAssetReaderTrackOutput(track: vTrack,
      outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange])
    vOut.alwaysCopiesSampleData = false
    reader.add(vOut)

    let vIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: Int(w), AVVideoHeightKey: Int(h),
      AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: targetBitrate,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoAllowFrameReorderingKey: true,
        AVVideoH264EntropyModeKey: AVVideoH264EntropyModeCABAC,
        AVVideoMaxKeyFrameIntervalKey: Int(fps.rounded()) * 2,
        AVVideoExpectedSourceFrameRateKey: Int(fps.rounded()),
      ],
      AVVideoColorPropertiesKey: [
        AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
        AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
        AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
      ],
    ])
    vIn.expectsMediaDataInRealTime = false
    vIn.transform = try await vTrack.load(.preferredTransform)
    writer.add(vIn)

    var aOut: AVAssetReaderTrackOutput?
    var aIn: AVAssetWriterInput?
    if let aTrack {
      let o = AVAssetReaderTrackOutput(track: aTrack, outputSettings: [
        AVFormatIDKey: kAudioFormatLinearPCM,
        AVLinearPCMBitDepthKey: 16, AVLinearPCMIsFloatKey: false,
        AVLinearPCMIsBigEndianKey: false, AVLinearPCMIsNonInterleaved: false,
      ])
      reader.add(o); aOut = o
      var ch = AudioChannelLayout(); ch.mChannelLayoutTag = kAudioChannelLayoutTag_Stereo
      let i = AVAssetWriterInput(mediaType: .audio, outputSettings: [
        AVFormatIDKey: kAudioFormatMPEG4AAC, AVNumberOfChannelsKey: 2,
        AVSampleRateKey: 44100, AVEncoderBitRateKey: 128_000,
        AVChannelLayoutKey: Data(bytes: &ch, count: MemoryLayout<AudioChannelLayout>.size),
      ])
      i.expectsMediaDataInRealTime = false
      writer.add(i); aIn = i
    }

    guard reader.startReading(), writer.startWriting() else {
      print("ERR start: \(reader.error?.localizedDescription ?? "")\(writer.error?.localizedDescription ?? "")"); sem.signal(); return
    }
    writer.startSession(atSourceTime: .zero)

    let group = DispatchGroup()
    func pump(_ input: AVAssetWriterInput, _ output: AVAssetReaderTrackOutput, _ label: String) {
      group.enter()
      input.requestMediaDataWhenReady(on: DispatchQueue(label: label)) {
        while input.isReadyForMoreMediaData {
          guard let buf = output.copyNextSampleBuffer() else { input.markAsFinished(); group.leave(); return }
          if !input.append(buf) { input.markAsFinished(); group.leave(); return }
        }
      }
    }
    pump(vIn, vOut, "v")
    if let aIn, let aOut { pump(aIn, aOut, "a") }
    group.wait()

    await writer.finishWriting()
    if writer.status == .completed {
      let sz = (try! FileManager.default.attributesOfItem(atPath: dst.path)[.size] as! NSNumber).intValue
      print("OK \(Int(w))x\(Int(h)) -> \(dst.lastPathComponent)  \(String(format: "%.2f", Double(sz)/1_048_576)) MB")
    } else {
      print("FAIL \(writer.error?.localizedDescription ?? "unknown")")
    }
  } catch { print("ERR \(error)") }
  sem.signal()
}
sem.wait()
