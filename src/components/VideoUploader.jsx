import { useState, useRef } from 'react'
import './VideoUploader.css'

const VideoUploader = ({ onVideoUpload }) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      onVideoUpload(file)
    } else {
      alert('Please upload a valid video file')
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('video/')) {
      onVideoUpload(file)
    } else {
      alert('Please upload a valid video file')
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="uploader-container">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="upload-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor"/>
            <path d="M12 12L9 15H13L10 12H12Z" fill="currentColor"/>
          </svg>
        </div>
        <h3>Drag & Drop your video here</h3>
        <p>or click to browse</p>
        <p className="formats">Supported formats: MP4, WebM, MOV, AVI, MKV</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default VideoUploader
