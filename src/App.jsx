import { useState } from 'react'
import VideoUploader from './components/VideoUploader'
import FormatConverter from './components/FormatConverter'
import './App.css'

function App() {
  const [uploadedVideo, setUploadedVideo] = useState(null)
  const [videoFile, setVideoFile] = useState(null)

  const handleVideoUpload = (file) => {
    const videoUrl = URL.createObjectURL(file)
    setUploadedVideo(videoUrl)
    setVideoFile(file)
  }

  const handleReset = () => {
    setUploadedVideo(null)
    setVideoFile(null)
  }

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">Video Format Converter</h1>
        <p className="subtitle">Upload your video and convert it to any format, or extract audio as MP3</p>
        
        {!uploadedVideo ? (
          <VideoUploader onVideoUpload={handleVideoUpload} />
        ) : (
          <FormatConverter 
            videoUrl={uploadedVideo}
            videoFile={videoFile}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  )
}

export default App
