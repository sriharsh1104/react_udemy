import { useState } from 'react'
import VideoUploader from './VideoUploader'
import FormatConverter from './FormatConverter'

const VideoConverter = () => {
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
    <div className="video-converter-tab">
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
  )
}

export default VideoConverter
