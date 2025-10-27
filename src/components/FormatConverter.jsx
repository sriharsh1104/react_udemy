import { useState, useRef } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import './FormatConverter.css'

const FORMATS = [
  { value: 'mp4', label: 'MP4', codec: 'libx264', type: 'video' },
  { value: 'webm', label: 'WebM', codec: 'libvpx-vp9', type: 'video' },
  { value: 'avi', label: 'AVI', codec: 'libx264', type: 'video' },
  { value: 'mov', label: 'MOV', codec: 'libx264', type: 'video' },
  { value: 'mkv', label: 'MKV', codec: 'libx264', type: 'video' },
  { value: 'mp3', label: 'MP3', codec: 'libmp3lame', type: 'audio' }
]

const FormatConverter = ({ videoUrl, videoFile, onReset }) => {
  const [selectedFormat, setSelectedFormat] = useState('mp4')
  const [isConverting, setIsConverting] = useState(false)
  const [convertedVideo, setConvertedVideo] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const ffmpegRef = useRef(new FFmpeg())
  const videoRef = useRef(null)

  const loadFFmpeg = async () => {
    const ffmpeg = ffmpegRef.current
    if (!ffmpeg.loaded) {
      ffmpeg.on('log', ({ message }) => {
        console.log(message)
      })
      await ffmpeg.load()
    }
    return ffmpeg
  }

  const convertVideo = async () => {
    try {
      setIsConverting(true)
      setConvertedVideo(null)
      
      const ffmpeg = await loadFFmpeg()
      
      const inputFileName = `input.${getFileExtension(videoFile.name)}`
      const outputFileName = `output.${selectedFormat}`
      
      // Write the input file
      const inputData = await fetchFile(videoUrl)
      await ffmpeg.writeFile(inputFileName, inputData)
      
      // Get the format configuration
      const format = FORMATS.find(f => f.value === selectedFormat)
      const isAudioOnly = format.type === 'audio'
      
      let execArgs = ['-i', inputFileName]
      
      if (isAudioOnly) {
        // For MP3, extract audio only
        execArgs.push(
          '-vn',           // No video
          '-acodec', format.codec,
          '-ab', '192k',   // Bitrate
          '-ar', '44100'   // Sample rate
        )
      } else {
        // For video formats
        const codecArgs = selectedFormat === 'webm' 
          ? ['-c:v', format.codec, '-c:a', 'libopus']
          : ['-c:v', format.codec, '-c:a', 'aac']
        execArgs.push(...codecArgs)
      }
      
      execArgs.push(outputFileName)
      
      // Convert the video/audio
      await ffmpeg.exec(execArgs)
      
      // Read the output file
      const data = await ffmpeg.readFile(outputFileName)
      
      // Create blob and URL for download
      const mimeType = isAudioOnly 
        ? 'audio/mpeg' 
        : `video/${selectedFormat === 'webm' ? 'webm' : 'mp4'}`
      
      const blob = new Blob([data.buffer], { type: mimeType })
      const url = URL.createObjectURL(blob)
      
      setDownloadUrl(url)
      
      // Only show video preview for video formats
      if (!isAudioOnly) {
        setConvertedVideo(url)
      } else {
        setConvertedVideo('audio') // Special flag for audio
      }
      
      // Clean up input file
      await ffmpeg.deleteFile(inputFileName)
      
    } catch (error) {
      console.error('Conversion error:', error)
      alert(`Conversion failed: ${error.message}. Please try a different format.`)
    } finally {
      setIsConverting(false)
    }
  }

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase()
  }

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement('a')
      a.href = downloadUrl
      const fileExtension = selectedFormat
      a.download = `converted.${fileExtension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const getSelectedFormatType = () => {
    return FORMATS.find(f => f.value === selectedFormat)?.type || 'video'
  }

  return (
    <div className="converter-container">
      <div className="video-preview">
        <h3>Original Video</h3>
        <video ref={videoRef} src={videoUrl} controls className="video-player" />
      </div>

      <div className="converter-controls">
        <div className="format-selector">
          <label htmlFor="format-select">Select Output Format:</label>
          <select
            id="format-select"
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="format-select"
          >
            {FORMATS.map(format => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={convertVideo}
          disabled={isConverting}
          className="convert-button"
        >
          {isConverting ? 'Converting...' : `Convert to ${selectedFormat.toUpperCase()}`}
        </button>

        {convertedVideo && (
          <div className="converted-video">
            <h3>Converted {getSelectedFormatType() === 'audio' ? 'Audio' : 'Video'} Preview</h3>
            {getSelectedFormatType() === 'audio' ? (
              <div className="audio-preview">
                <audio src={downloadUrl} controls className="audio-player" />
                <p className="audio-info">🎵 Audio extracted successfully</p>
              </div>
            ) : (
              <video src={convertedVideo} controls className="video-player" />
            )}
            <button onClick={handleDownload} className="download-button">
              Download Converted {getSelectedFormatType() === 'audio' ? 'Audio' : 'Video'}
            </button>
          </div>
        )}
      </div>

      <button onClick={onReset} className="reset-button">
        Upload Another Video
      </button>
    </div>
  )
}

export default FormatConverter
