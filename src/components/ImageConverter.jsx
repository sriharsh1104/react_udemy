import { useState, useRef, useEffect } from 'react'
import './ImageConverter.css'

const ImageConverter = () => {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [selectedFormat, setSelectedFormat] = useState('jpeg')
  const [isConverting, setIsConverting] = useState(false)
  const [croppedImage, setCroppedImage] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [isCropMode, setIsCropMode] = useState(false)
  const [cropData, setCropData] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 })
  const [resizeWidth, setResizeWidth] = useState('')
  const [resizeHeight, setResizeHeight] = useState('')
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true)
  const [previewUrl, setPreviewUrl] = useState(null)
  const canvasRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const imageRef = useRef(null)
  const containerRef = useRef(null)

  const FORMATS = [
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' },
    { value: 'bmp', label: 'BMP' }
  ]

  // Live preview when dimensions change
  useEffect(() => {
    if (!uploadedImage || !resizeWidth || !resizeHeight) {
      setPreviewUrl(null)
      return
    }

    const width = parseInt(resizeWidth) || originalDimensions.width
    const height = parseInt(resizeHeight) || originalDimensions.height

    if (width <= 0 || height <= 0 || width > originalDimensions.width * 2 || height > originalDimensions.height * 2) {
      setPreviewUrl(null)
      return
    }

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = width
      canvas.height = height

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      const url = canvas.toDataURL('image/jpeg', 0.9)
      setPreviewUrl(url)
    }

    img.src = uploadedImage
  }, [uploadedImage, resizeWidth, resizeHeight])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target.result)
        const img = new Image()
        img.onload = () => {
          setOriginalDimensions({ width: img.width, height: img.height })
          setResizeWidth(img.width)
          setResizeHeight(img.height)
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    } else {
      alert('Please upload a valid image file')
    }
  }

  const handleDragDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target.result)
        const img = new Image()
        img.onload = () => {
          setOriginalDimensions({ width: img.width, height: img.height })
          setResizeWidth(img.width)
          setResizeHeight(img.height)
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  const convertImage = () => {
    if (!uploadedImage) return

    setIsConverting(true)
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Set canvas size
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw image
      ctx.drawImage(img, 0, 0)
      
      // Convert to selected format
      const mimeType = getMimeType(selectedFormat)
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
        setCroppedImage(url)
        setIsConverting(false)
      }, mimeType, 0.95)
    }
    
    img.src = uploadedImage
  }

  const startCrop = () => {
    setIsCropMode(true)
    // Initialize crop box
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      const initialSize = Math.min(rect.width, rect.height) * 0.5
      setCropData({
        x: (rect.width - initialSize) / 2,
        y: (rect.height - initialSize) / 2,
        width: initialSize,
        height: initialSize
      })
    }
  }

  const handleMouseDown = (e) => {
    if (!isCropMode || !imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicking inside crop box
    if (x >= cropData.x && x <= cropData.x + cropData.width &&
        y >= cropData.y && y <= cropData.y + cropData.height) {
      setIsDragging(true)
      setDragStart({
        x: x - cropData.x,
        y: y - cropData.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (!isCropMode || !isDragging || !imageRef.current) return
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - dragStart.x
    const y = e.clientY - rect.top - dragStart.y

    const maxX = rect.width - cropData.width
    const maxY = rect.height - cropData.height

    setCropData({
      ...cropData,
      x: Math.max(0, Math.min(maxX, x)),
      y: Math.max(0, Math.min(maxY, y))
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCancelCrop = () => {
    setIsCropMode(false)
    setIsDragging(false)
  }

  const resizeImage = () => {
    if (!uploadedImage) return

    const width = parseInt(resizeWidth) || originalDimensions.width
    const height = parseInt(resizeHeight) || originalDimensions.height

    if (width <= 0 || height <= 0) {
      alert('Please enter valid dimensions')
      return
    }

    setIsConverting(true)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = width
      canvas.height = height

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      const mimeType = getMimeType(selectedFormat)
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
        setCroppedImage(url)
        setIsConverting(false)
      }, mimeType, 0.95)
    }

    img.src = uploadedImage
  }

  const applyCrop = () => {
    if (!uploadedImage) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      const scaleX = img.width / imageRef.current.offsetWidth
      const scaleY = img.height / imageRef.current.offsetHeight
      
      const cropX = cropData.x * scaleX
      const cropY = cropData.y * scaleY
      const cropWidth = cropData.width * scaleX
      const cropHeight = cropData.height * scaleY
      
      canvas.width = cropWidth
      canvas.height = cropHeight
      
      ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
      
      const mimeType = getMimeType(selectedFormat)
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
        setCroppedImage(url)
        setIsCropMode(false)
      }, mimeType, 0.95)
    }
    
    img.src = uploadedImage
  }

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `converted.${selectedFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const getMimeType = (format) => {
    const types = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      bmp: 'image/bmp'
    }
    return types[format] || 'image/jpeg'
  }

  const handleWidthChange = (e) => {
    const newWidth = parseInt(e.target.value) || 0
    setResizeWidth(e.target.value)
    
    if (maintainAspectRatio && originalDimensions.width > 0) {
      const ratio = originalDimensions.height / originalDimensions.width
      const newHeight = Math.round(newWidth * ratio)
      setResizeHeight(newHeight)
    }
  }

  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value) || 0
    setResizeHeight(e.target.value)
    
    if (maintainAspectRatio && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height
      const newWidth = Math.round(newHeight * ratio)
      setResizeWidth(newWidth)
    }
  }

  const handleReset = () => {
    setUploadedImage(null)
    setImageFile(null)
    setCroppedImage(null)
    setDownloadUrl(null)
    setIsCropMode(false)
    setResizeWidth('')
    setResizeHeight('')
  }

  return (
    <div className="image-converter-container">
      {!uploadedImage ? (
        <div className="upload-section">
          <div
            className="upload-area"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDragDrop}
          >
            <div className="upload-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Drag & Drop your image here</h3>
            <p>or click to browse</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload" className="upload-button">
              Select Image
            </label>
          </div>
        </div>
      ) : (
        <div className="converter-view">
          {!croppedImage ? (
            <>
              <div className="image-preview-section" ref={containerRef}>
                <h3>{isCropMode ? 'Crop Mode - Drag to Select Area' : 'Original Image'}</h3>
                {originalDimensions.width > 0 && (
                  <p className="image-dimensions">
                    Size: {originalDimensions.width} × {originalDimensions.height} pixels
                  </p>
                )}
                {isCropMode && (
                  <div className="crop-controls">
                    <button onClick={applyCrop} className="apply-crop-btn">
                      ✓ Apply Crop
                    </button>
                    <button onClick={handleCancelCrop} className="cancel-crop-btn">
                      ✗ Cancel
                    </button>
                  </div>
                )}
                <div 
                  className={`preview-container ${isCropMode ? 'crop-mode' : ''}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    ref={imageRef}
                    src={uploadedImage}
                    alt="Preview"
                    className="preview-image"
                    draggable={false}
                    onLoad={() => {
                      if (imageRef.current && !isCropMode) {
                        const rect = imageRef.current.getBoundingClientRect()
                        setCropData({ x: 0, y: 0, width: rect.width, height: rect.height })
                      }
                    }}
                  />
                  {isCropMode && (
                    <div 
                      className="crop-box"
                      style={{
                        left: `${cropData.x}px`,
                        top: `${cropData.y}px`,
                        width: `${cropData.width}px`,
                        height: `${cropData.height}px`
                      }}
                    >
                      <div className="crop-corner crop-corner-tl"></div>
                      <div className="crop-corner crop-corner-tr"></div>
                      <div className="crop-corner crop-corner-bl"></div>
                      <div className="crop-corner crop-corner-br"></div>
                    </div>
                  )}
                </div>
                {isCropMode && (
                  <p className="crop-info">
                    Selected: {Math.round(cropData.width)} × {Math.round(cropData.height)} pixels
                  </p>
                )}
              </div>
              
              {!isCropMode && (
              <div className="controls-section">
                <div className="resize-section">
                  <h4>Resize Image (Pixels)</h4>
                  <div className="resize-inputs">
                    <div className="input-group">
                      <label htmlFor="width">Width:</label>
                      <input
                        id="width"
                        type="number"
                        min="1"
                        max={originalDimensions.width}
                        value={resizeWidth}
                        onChange={handleWidthChange}
                        placeholder="Width in px"
                        className="dimension-input"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="height">Height:</label>
                      <input
                        id="height"
                        type="number"
                        min="1"
                        max={originalDimensions.height}
                        value={resizeHeight}
                        onChange={handleHeightChange}
                        placeholder="Height in px"
                        className="dimension-input"
                      />
                    </div>
                  </div>
                  <div className="aspect-ratio-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={maintainAspectRatio}
                        onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      />
                      Maintain Aspect Ratio
                    </label>
                  </div>
                  <button
                    onClick={resizeImage}
                    disabled={isConverting}
                    className="action-button resize-btn"
                  >
                    {isConverting ? 'Resizing...' : '📏 Resize Image'}
                  </button>
                  
                  {previewUrl && (
                    <div className="live-preview">
                      <h5>Live Preview</h5>
                      <p className="preview-dimensions">
                        {resizeWidth} × {resizeHeight} pixels
                      </p>
                      <img src={previewUrl} alt="Live Preview" className="preview-image-small" />
                    </div>
                  )}
                </div>

                <div className="divider">OR</div>
                <div className="format-section">
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

                  <div className="button-group">
                    <button onClick={startCrop} className="action-button">
                      🖼️ Crop Image
                    </button>
                    <button
                      onClick={convertImage}
                      disabled={isConverting}
                      className="action-button primary"
                    >
                      {isConverting ? 'Converting...' : `Convert to ${selectedFormat.toUpperCase()}`}
                    </button>
                  </div>
                </div>
              </div>
              )}
            </>
          ) : (
            <div className="result-section">
              <div className="result-image">
                <h3>Converted/Cropped Image</h3>
                <img src={croppedImage} alt="Converted" className="preview-image" />
                <button onClick={handleDownload} className="download-button">
                  Download Image
                </button>
              </div>
              <button onClick={handleReset} className="reset-button">
                Upload Another Image
              </button>
            </div>
          )}
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default ImageConverter
