import { useRef } from 'react'
import './VideoUploader.css'

// Extensions allowed for video/audio. Used when file.type is empty/wrong (common on mobile).
const ALLOWED_EXTENSIONS = [
  '.mp4', '.webm', '.mov', '.avi', '.mkv',
  '.mp3', '.wav', '.ogg', '.aac', '.m4a', '.wma', '.flac'
]

const isAllowedFile = (file) => {
  if (!file) return false
  const typeOk = file.type && (file.type.startsWith('video/') || file.type.startsWith('audio/'))
  if (typeOk) return true
  // Mobile often sends empty or wrong file.type — fallback to extension
  const name = (file.name || '').toLowerCase()
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

const VideoUploader = ({ onVideoUpload }) => {
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (isAllowedFile(file)) {
      onVideoUpload(file)
    } else {
      alert('Please upload a valid video or audio file')
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (isAllowedFile(file)) {
      onVideoUpload(file)
    } else {
      alert('Please upload a valid video or audio file')
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="uploader-container">
      <div
        className="upload-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="upload-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor"/>
            <path d="M12 12L9 15H13L10 12H12Z" fill="currentColor"/>
          </svg>
        </div>
        <h3>Drag & Drop your file here</h3>
        <p>or click to browse</p>
        <p className="formats">Supported: Video (MP4, WebM, MOV, AVI, MKV) and Audio (MP3, WAV, OGG, AAC, M4A, WMA, FLAC)</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default VideoUploader
