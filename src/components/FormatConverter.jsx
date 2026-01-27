import { useState, useRef, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import './FormatConverter.css'
import PremiumDropdown from './PremiumDropdown'
import { BACKEND_URL } from '../constants'

const FORMATS = [
  // Video formats
  { value: 'mp4', label: 'MP4 (video)', codec: 'libx264', type: 'video', audioCodec: 'aac' },
  { value: 'webm', label: 'WebM (video)', codec: 'libvpx-vp9', type: 'video', audioCodec: 'libopus' },
  { value: 'avi', label: 'AVI (video)', codec: 'libx264', type: 'video', audioCodec: 'aac' },
  { value: 'mov', label: 'MOV (video)', codec: 'libx264', type: 'video', audioCodec: 'aac' },
  { value: 'mkv', label: 'MKV (video)', codec: 'libx264', type: 'video', audioCodec: 'aac' },
  { value: 'flv', label: 'FLV (video)', codec: 'libx264', type: 'video', audioCodec: 'aac' },
  { value: 'wmv', label: 'WMV (video)', codec: 'msmpeg4', type: 'video', audioCodec: 'wmav2' },
  { value: 'm4v', label: 'M4V (video)', codec: 'libx264', type: 'video', audioCodec: 'aac' },
  { value: '3gp', label: '3GP (video)', codec: 'libx264', type: 'video', audioCodec: 'aac' },
  { value: 'ogv', label: 'OGV (video)', codec: 'libtheora', type: 'video', audioCodec: 'libvorbis' },
  // Audio formats
  { value: 'mp3', label: 'MP3 (audio)', codec: 'libmp3lame', type: 'audio' },
  { value: 'wav', label: 'WAV (audio)', codec: 'pcm_s16le', type: 'audio' },
  { value: 'ogg', label: 'OGG (audio)', codec: 'libvorbis', type: 'audio' },
  { value: 'aac', label: 'AAC (audio)', codec: 'aac', type: 'audio' },
  { value: 'm4a', label: 'M4A (audio)', codec: 'aac', type: 'audio' },
  { value: 'wma', label: 'WMA (audio)', codec: 'wmav2', type: 'audio' },
  { value: 'flac', label: 'FLAC (audio)', codec: 'flac', type: 'audio' }
]

const FormatConverter = ({ videoUrl, videoFile, onReset }) => {
  const [selectedFormat, setSelectedFormat] = useState('mp4')
  const [isConverting, setIsConverting] = useState(false)
  const [convertedVideo, setConvertedVideo] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [convertedBytes, setConvertedBytes] = useState(0)
  const ffmpegRef = useRef(new FFmpeg())
  const mediaRef = useRef(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [timeRanges, setTimeRanges] = useState([]) // Array of {start, end} objects
  const [useMultipleRanges, setUseMultipleRanges] = useState(false)
  const [isExtractingAudio, setIsExtractingAudio] = useState(false)
  const [isSeparating, setIsSeparating] = useState(false)
  const [extractedAudioUrl, setExtractedAudioUrl] = useState(null)
  const [separatedAudioUrl, setSeparatedAudioUrl] = useState(null)
  const [separationMode, setSeparationMode] = useState('voice') // 'voice' or 'music'
  const [audioExtractFormat, setAudioExtractFormat] = useState('mp3')
  const [customFilename, setCustomFilename] = useState('')
  const [customExtractedFilename, setCustomExtractedFilename] = useState('')
  const [customSeparatedFilename, setCustomSeparatedFilename] = useState('')

  const inputIsAudio = !!videoFile?.type?.startsWith('audio/')
  const availableFormats = inputIsAudio ? FORMATS.filter(f => f.type === 'audio') : FORMATS

  const originalBytes = videoFile?.size || 0

  useEffect(() => {
    // Ensure selected format is valid for the current input type
    const stillValid = availableFormats.some(f => f.value === selectedFormat)
    if (!stillValid) {
      setSelectedFormat(availableFormats[0]?.value || 'mp3')
    }
  }, [inputIsAudio])

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

  const toSeconds = (t) => {
    if (!t) return null
    const parts = t.split(':').map(Number)
    if (parts.some(isNaN)) return NaN
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 1) return parts[0]
    return NaN
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
      
      const duration = mediaRef.current?.duration || null

      // Handle multiple time ranges
      if (useMultipleRanges) {
        if (timeRanges.length === 0) {
          throw new Error('Please add at least one time range.')
        }
        
        // Filter out empty ranges
        const nonEmptyRanges = timeRanges.filter(r => r.start && r.end && r.start.trim() && r.end.trim())
        if (nonEmptyRanges.length === 0) {
          throw new Error('Please fill in at least one time range.')
        }
        // Validate all ranges
        const validRanges = []
        for (const range of nonEmptyRanges) {
          const startSec = toSeconds(range.start)
          const endSec = toSeconds(range.end)
          
          if (isNaN(startSec) || isNaN(endSec)) {
            throw new Error(`Invalid time format in range ${range.start} - ${range.end}. Use HH:MM:SS, MM:SS, or seconds.`)
          }
          if (endSec <= startSec) {
            throw new Error(`End time must be greater than start time in range ${range.start} - ${range.end}.`)
          }
          if (duration) {
            if (startSec >= duration) {
              throw new Error(`Start time exceeds duration in range ${range.start} - ${range.end}.`)
            }
            if (endSec > duration + 0.01) {
              throw new Error(`End time exceeds duration in range ${range.start} - ${range.end}.`)
            }
          }
          validRanges.push({ start: startSec, end: endSec })
        }

        // Sort ranges by start time
        validRanges.sort((a, b) => a.start - b.start)

        // Build filter_complex for trimming and concatenating
        const filterParts = []
        const concatParts = []
        
        validRanges.forEach((range, index) => {
          if (isAudioOnly) {
            // atrim=start=SECONDS:end=SECONDS format
            filterParts.push(`[0:a]atrim=start=${range.start}:end=${range.end},asetpts=PTS-STARTPTS[a${index}]`)
            concatParts.push(`[a${index}]`)
          } else {
            // For video: trim=start=SECONDS:end=SECONDS format
            filterParts.push(`[0:v]trim=start=${range.start}:end=${range.end},setpts=PTS-STARTPTS[v${index}]`)
            filterParts.push(`[0:a]atrim=start=${range.start}:end=${range.end},asetpts=PTS-STARTPTS[a${index}]`)
            concatParts.push(`[v${index}][a${index}]`)
          }
        })

        const concatFilter = isAudioOnly 
          ? `${concatParts.join('')}concat=n=${validRanges.length}:v=0:a=1[outa]`
          : `${concatParts.join('')}concat=n=${validRanges.length}:v=1:a=1[outv][outa]`

        const filterComplex = [...filterParts, concatFilter].join(';')

        let execArgs = ['-i', inputFileName, '-filter_complex', filterComplex]
        
        if (isAudioOnly) {
          execArgs.push('-map', '[outa]', '-acodec', format.codec, '-ab', '192k', '-ar', '44100')
        } else {
          execArgs.push('-map', '[outv]', '-map', '[outa]', '-c:v', format.codec)
          if (format.audioCodec) {
            execArgs.push('-c:a', format.audioCodec)
          } else {
            execArgs.push('-c:a', 'aac')
          }
        }
        
        execArgs.push(outputFileName)
        
        await ffmpeg.exec(execArgs)
      } else {
        // Original single range logic
        let execArgs = ['-i', inputFileName]

        const hasStart = startTime && startTime.trim().length > 0
        const hasEnd = endTime && endTime.trim().length > 0

        const startSec = hasStart ? toSeconds(startTime.trim()) : null
        const endSec = hasEnd ? toSeconds(endTime.trim()) : null

        if ((hasStart && isNaN(startSec)) || (hasEnd && isNaN(endSec))) {
          throw new Error('Invalid time format. Use HH:MM:SS, MM:SS, or seconds.')
        }
        if (hasStart && hasEnd && endSec <= startSec) {
          throw new Error('End time must be greater than start time.')
        }
        if (duration) {
          if (hasStart && startSec >= duration) {
            throw new Error('Start time must be within the video duration.')
          }
          if (hasEnd && endSec > duration + 0.01) {
            throw new Error('End time exceeds the video duration.')
          }
        }

        if (hasStart) {
          execArgs.push('-ss', startTime.trim())
        }
        if (hasEnd) {
          execArgs.push('-to', endTime.trim())
        }
        
        if (isAudioOnly) {
          execArgs.push('-vn', '-acodec', format.codec, '-ab', '192k', '-ar', '44100')
        } else {
          execArgs.push('-c:v', format.codec)
          if (format.audioCodec) {
            execArgs.push('-c:a', format.audioCodec)
          } else {
            execArgs.push('-c:a', 'aac')
          }
        }
        
        execArgs.push(outputFileName)
        await ffmpeg.exec(execArgs)
      }
      
      // Read the output file
      const data = await ffmpeg.readFile(outputFileName)
      
      // Create blob and URL for download
      const mimeType = getMimeType(selectedFormat, isAudioOnly)
      
      const blob = new Blob([data.buffer], { type: mimeType })
      const url = URL.createObjectURL(blob)
      
      setDownloadUrl(url)
      setConvertedBytes(data.length || data.byteLength || 0)
      
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

  const quickCompress = async () => {
    try {
      setIsConverting(true)
      setConvertedVideo(null)
      const ffmpeg = await loadFFmpeg()
      const inputFileName = `input.${getFileExtension(videoFile.name)}`
      const outputFileName = `output_compressed.${selectedFormat}`
      const inputData = await fetchFile(videoUrl)
      await ffmpeg.writeFile(inputFileName, inputData)

      const format = FORMATS.find(f => f.value === selectedFormat)
      const isAudioOnly = format.type === 'audio'

      let execArgs = ['-i', inputFileName]

      // Basic compression presets
      if (isAudioOnly) {
        execArgs.push('-vn', '-c:a', format.codec || 'aac', '-b:a', '128k')
      } else {
        execArgs.push(
          '-c:v', format.codec || 'libx264',
          '-crf', '28',
          '-preset', 'veryfast',
          '-c:a', format.audioCodec || 'aac',
          '-b:a', '128k'
        )
      }
      execArgs.push(outputFileName)

      await ffmpeg.exec(execArgs)
      const data = await ffmpeg.readFile(outputFileName)
      const mimeType = getMimeType(selectedFormat, isAudioOnly)
      const blob = new Blob([data.buffer], { type: mimeType })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      setConvertedBytes(data.length || data.byteLength || 0)
      if (!isAudioOnly) {
        setConvertedVideo(url)
      } else {
        setConvertedVideo('audio')
      }
      await ffmpeg.deleteFile(inputFileName)
    } catch (error) {
      console.error('Compression error:', error)
      alert(`Compression failed: ${error.message}`)
    } finally {
      setIsConverting(false)
    }
  }

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase()
  }

  const getMimeType = (format, isAudioOnly) => {
    if (isAudioOnly) {
      const audioMimeTypes = {
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'aac': 'audio/aac',
        'm4a': 'audio/mp4',
        'wma': 'audio/x-ms-wma',
        'flac': 'audio/flac'
      }
      return audioMimeTypes[format] || 'audio/mpeg'
    } else {
      const videoMimeTypes = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'mkv': 'video/x-matroska',
        'flv': 'video/x-flv',
        'wmv': 'video/x-ms-wmv',
        'm4v': 'video/x-m4v',
        '3gp': 'video/3gpp',
        'ogv': 'video/ogg'
      }
      return videoMimeTypes[format] || 'video/mp4'
    }
  }

  const getDownloadFilename = (customName, defaultName, extension) => {
    if (customName && customName.trim()) {
      // Remove extension if user added it
      const nameWithoutExt = customName.trim().replace(/\.[^/.]+$/, '')
      return `${nameWithoutExt}.${extension}`
    }
    return `${defaultName}.${extension}`
  }

  const handleDownload = () => {
    if (downloadUrl) {
      const filename = getDownloadFilename(customFilename, 'converted', selectedFormat)
      // Check if it's a blob URL (local) or external URL
      if (downloadUrl.startsWith('blob:')) {
        // Blob URL - direct download
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = filename
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          document.body.removeChild(a)
        }, 100)
      } else {
        // External URL - fetch and download as blob
        fetch(downloadUrl)
          .then(response => response.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()
            setTimeout(() => {
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }, 100)
          })
          .catch(error => {
            console.error('Download error:', error)
            // Fallback: open in new tab
            window.open(downloadUrl, '_blank')
          })
      }
    }
  }

  const getSelectedFormatType = () => {
    return FORMATS.find(f => f.value === selectedFormat)?.type || 'video'
  }

  // Extract audio from video using backend API
  const extractAudioFromVideo = async () => {
    try {
      setIsExtractingAudio(true)
      setExtractedAudioUrl(null)

      const formData = new FormData()
      formData.append('file', videoFile)
      formData.append('format', audioExtractFormat)

      const response = await fetch(`${BACKEND_URL}/api/audio/extract`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        let errMsg = 'Failed to extract audio'
        try {
          const errorData = await response.json()
          if (errorData && errorData.error) errMsg = errorData.error
        } catch (_) { /* non-JSON response */ }
        throw new Error(errMsg)
      }

      const data = await response.json()
      if (!data || !data.downloadUrl) throw new Error('Invalid response: missing downloadUrl')
      setExtractedAudioUrl(data.downloadUrl)
    } catch (error) {
      console.error('Audio extraction error:', error)
      alert(`Audio extraction failed: ${error.message}`)
    } finally {
      setIsExtractingAudio(false)
    }
  }

  // Separate voice from music using backend API
  const separateVoiceMusic = async () => {
    try {
      setIsSeparating(true)
      setSeparatedAudioUrl(null)

      const formData = new FormData()
      formData.append('file', videoFile)
      formData.append('mode', separationMode)

      const response = await fetch(`${BACKEND_URL}/api/audio/separate`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        let errMsg = 'Failed to separate audio'
        try {
          const errorData = await response.json()
          if (errorData && errorData.error) errMsg = errorData.error
        } catch (_) { /* non-JSON response */ }
        throw new Error(errMsg)
      }

      const data = await response.json()
      if (!data || !data.downloadUrl) throw new Error('Invalid response: missing downloadUrl')
      setSeparatedAudioUrl(data.downloadUrl)
    } catch (error) {
      console.error('Separation error:', error)
      alert(`Audio separation failed: ${error.message}`)
    } finally {
      setIsSeparating(false)
    }
  }

  const handleDownloadExtracted = () => {
    if (extractedAudioUrl) {
      const filename = getDownloadFilename(customExtractedFilename, 'extracted_audio', audioExtractFormat)
      // External URL - fetch and download as blob
      fetch(extractedAudioUrl)
        .then(response => response.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          a.style.display = 'none'
          document.body.appendChild(a)
          a.click()
          setTimeout(() => {
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }, 100)
        })
        .catch(error => {
          console.error('Download error:', error)
          // Fallback: open in new tab
          window.open(extractedAudioUrl, '_blank')
        })
    }
  }

  const handleDownloadSeparated = () => {
    if (separatedAudioUrl) {
      const filename = getDownloadFilename(customSeparatedFilename, `separated_${separationMode}`, 'mp3')
      // External URL - fetch and download as blob
      fetch(separatedAudioUrl)
        .then(response => response.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          a.style.display = 'none'
          document.body.appendChild(a)
          a.click()
          setTimeout(() => {
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }, 100)
        })
        .catch(error => {
          console.error('Download error:', error)
          // Fallback: open in new tab
          window.open(separatedAudioUrl, '_blank')
        })
    }
  }

  const handleRemoveFile = () => {
    // Clean up blob URL if it exists
    if (videoUrl && videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoUrl)
    }
    // Clean up converted video URL if exists
    if (downloadUrl && downloadUrl.startsWith('blob:')) {
      URL.revokeObjectURL(downloadUrl)
    }
    // Clean up extracted audio URL if exists
    if (extractedAudioUrl && extractedAudioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(extractedAudioUrl)
    }
    // Clean up separated audio URL if exists
    if (separatedAudioUrl && separatedAudioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(separatedAudioUrl)
    }
    // Reset custom filenames
    setCustomFilename('')
    setCustomExtractedFilename('')
    setCustomSeparatedFilename('')
    // Reset to upload screen
    onReset()
  }

  return (
    <div className="converter-container">
      {/* Step 1: Original file */}
      <section className="step-card step-1">
        <div className="step-badge">Step 1</div>
        <h3 className="step-title">Your {inputIsAudio ? 'Audio' : 'Video'}</h3>
        <p className="step-desc">Preview your file. Remove it to upload a new one.</p>
        {inputIsAudio ? (
          <div className="media-wrapper media-audio">
            <audio ref={mediaRef} src={videoUrl} controls className="audio-player" />
            <button onClick={handleRemoveFile} className="remove-file-btn" type="button" title="Remove and upload new">
              Remove file
            </button>
          </div>
        ) : (
          <div className="media-wrapper media-video">
            <video ref={mediaRef} src={videoUrl} controls className="video-player" />
            <button onClick={handleRemoveFile} className="remove-file-btn" type="button" title="Remove and upload new">
              Remove file
            </button>
          </div>
        )}
      </section>

      {/* Step 2: Convert / Trim */}
      <section className="step-card step-2">
        <div className="step-badge">Step 2</div>
        <h3 className="step-title">Convert or Trim</h3>
        <p className="step-desc">Pick output format, optional time range, then convert or compress.</p>

        <div className="step-block">
          <label className="step-label">Output format</label>
          <PremiumDropdown
            id="format-select"
            label=""
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            options={availableFormats.map(f => ({ value: f.value, label: f.label }))}
            className="format-select format-select-full"
          />
        </div>

        <div className="step-block trim-block">
          <label className="step-label">Time range (optional)</label>
          <div className="trim-mode-selector">
            <label className="trim-option">
              <input type="radio" checked={!useMultipleRanges} onChange={() => setUseMultipleRanges(false)} />
              <span>Single range</span>
            </label>
            <label className="trim-option">
              <input type="radio" checked={useMultipleRanges} onChange={() => setUseMultipleRanges(true)} />
              <span>Multiple ranges</span>
            </label>
          </div>

          {!useMultipleRanges ? (
            <div className="trim-fields-row">
              <div className="trim-field-wrap">
                <label htmlFor="start-time">Start</label>
                <input
                  id="start-time"
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="00:00:05"
                  className="trim-input"
                />
              </div>
              <div className="trim-field-wrap">
                <label htmlFor="end-time">End</label>
                <input
                  id="end-time"
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="00:00:15"
                  className="trim-input"
                />
              </div>
            </div>
          ) : (
            <div className="multiple-ranges-block">
              {timeRanges.map((range, index) => (
                <div key={index} className="time-range-row">
                  <div className="trim-field-wrap">
                    <label>Start {index + 1}</label>
                    <input
                      type="text"
                      value={range.start}
                      onChange={(e) => {
                        const r = [...timeRanges]
                        r[index].start = e.target.value
                        setTimeRanges(r)
                      }}
                      placeholder="00:00:20"
                      className="trim-input"
                    />
                  </div>
                  <div className="trim-field-wrap">
                    <label>End {index + 1}</label>
                    <input
                      type="text"
                      value={range.end}
                      onChange={(e) => {
                        const r = [...timeRanges]
                        r[index].end = e.target.value
                        setTimeRanges(r)
                      }}
                      placeholder="00:00:40"
                      className="trim-input"
                    />
                  </div>
                  <button type="button" onClick={() => setTimeRanges(timeRanges.filter((_, i) => i !== index))} className="btn-remove-range">
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setTimeRanges([...timeRanges, { start: '', end: '' }])} className="btn-add-range">
                + Add range
              </button>
            </div>
          )}
          <p className="trim-hint-text">Use HH:MM:SS, MM:SS or seconds. Leave blank for full length.</p>
        </div>

        <div className="action-row">
          <button onClick={convertVideo} disabled={isConverting} className="btn-convert">
            {isConverting ? 'Processing…' : `Convert to ${selectedFormat.toUpperCase()}`}
          </button>
          <button onClick={quickCompress} disabled={isConverting} className="btn-compress">
            {isConverting ? 'Processing…' : 'Quick compress'}
          </button>
        </div>

        {downloadUrl && (
          <div className="result-block result-converted">
            <h4 className="result-heading">Converted output</h4>
            <div className="stat-row">
              <span className="stat-item"><em>Original</em> {(originalBytes / 1024 / 1024).toFixed(2)} MB</span>
              <span className="stat-item"><em>Output</em> {(convertedBytes / 1024 / 1024).toFixed(2)} MB</span>
              <span className="stat-item"><em>Saved</em> {originalBytes > 0 ? Math.max(0, (1 - convertedBytes / originalBytes) * 100).toFixed(0) : 0}%</span>
            </div>
            {getSelectedFormatType() === 'audio' ? (
              <div className="preview-audio">
                <audio src={downloadUrl} controls className="audio-player" />
              </div>
            ) : (
              <video src={convertedVideo} controls className="video-player video-preview-sm" />
            )}
            <div className="filename-row">
              <label htmlFor="converted-filename">File name (optional)</label>
              <input
                id="converted-filename"
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder={`converted.${selectedFormat}`}
                className="filename-input"
              />
            </div>
            <button onClick={handleDownload} className="btn-download">Download converted {getSelectedFormatType() === 'audio' ? 'audio' : 'video'}</button>
          </div>
        )}
      </section>

      {/* Step 3: Extract audio (video only) */}
      {!inputIsAudio && (
        <section className="step-card step-3">
          <div className="step-badge">Step 3</div>
          <h3 className="step-title">Extract audio</h3>
          <p className="step-desc">Get only the audio track from your video.</p>
          <div className="step-block extract-block">
            <label className="step-label">Audio format</label>
            <PremiumDropdown
              id="audio-extract-format"
              label=""
              value={audioExtractFormat}
              onChange={(e) => setAudioExtractFormat(e.target.value)}
              options={[
                { value: 'mp3', label: 'MP3' },
                { value: 'wav', label: 'WAV' },
                { value: 'aac', label: 'AAC' }
              ]}
              className="format-select format-select-full"
            />
            <button onClick={extractAudioFromVideo} disabled={isExtractingAudio} className="btn-extract">
              {isExtractingAudio ? 'Extracting…' : 'Extract audio'}
            </button>
          </div>
          {extractedAudioUrl && (
            <div className="result-block">
              <h4 className="result-heading">Extracted audio</h4>
              <audio src={extractedAudioUrl} controls className="audio-player" />
              <div className="filename-row">
                <label htmlFor="extracted-filename">File name (optional)</label>
                <input
                  id="extracted-filename"
                  type="text"
                  value={customExtractedFilename}
                  onChange={(e) => setCustomExtractedFilename(e.target.value)}
                  placeholder={`extracted.${audioExtractFormat}`}
                  className="filename-input"
                />
              </div>
              <button onClick={handleDownloadExtracted} className="btn-download">Download extracted audio</button>
            </div>
          )}
        </section>
      )}

      {/* Step 4: Voice / Music separation (video only when step 3 exists; else step 3) */}
      {!inputIsAudio && (
        <section className="step-card step-4">
          <div className="step-badge">Step 4</div>
          <h3 className="step-title">Separate voice & music</h3>
          <p className="step-desc">Get only voice or only music from the track.</p>
          <div className="step-block separation-block">
            <label className="step-label">Extract</label>
            <div className="mode-options">
              <label className="mode-option">
                <input type="radio" value="voice" checked={separationMode === 'voice'} onChange={(e) => setSeparationMode(e.target.value)} />
                <span>Voice only</span>
              </label>
              <label className="mode-option">
                <input type="radio" value="music" checked={separationMode === 'music'} onChange={(e) => setSeparationMode(e.target.value)} />
                <span>Music only</span>
              </label>
            </div>
            <button onClick={separateVoiceMusic} disabled={isSeparating} className="btn-separate">
              {isSeparating ? 'Separating…' : `Extract ${separationMode}`}
            </button>
          </div>
          {separatedAudioUrl && (
            <div className="result-block">
              <h4 className="result-heading">Separated track</h4>
              <audio src={separatedAudioUrl} controls className="audio-player" />
              <div className="filename-row">
                <label htmlFor="separated-filename">File name (optional)</label>
                <input
                  id="separated-filename"
                  type="text"
                  value={customSeparatedFilename}
                  onChange={(e) => setCustomSeparatedFilename(e.target.value)}
                  placeholder={`separated_${separationMode}.mp3`}
                  className="filename-input"
                />
              </div>
              <button onClick={handleDownloadSeparated} className="btn-download">Download {separationMode}</button>
            </div>
          )}
        </section>
      )}

      <div className="converter-footer">
        <button onClick={onReset} className="btn-reset" type="button">Upload another file</button>
      </div>
    </div>
  )
}

export default FormatConverter
