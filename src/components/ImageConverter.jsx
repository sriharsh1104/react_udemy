import { useState, useRef, useEffect } from 'react'
import './ImageConverter.css'
import PremiumDropdown from './PremiumDropdown'

const ImageConverter = () => {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [selectedFormat, setSelectedFormat] = useState('jpeg')
  const [isConverting, setIsConverting] = useState(false)
  const [croppedImage, setCroppedImage] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [isSvgInput, setIsSvgInput] = useState(false)
  const [svgRaw, setSvgRaw] = useState('')
  const [svgCode, setSvgCode] = useState('')
  const [isCropMode, setIsCropMode] = useState(false)
  const [cropData, setCropData] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeHandle, setResizeHandle] = useState(null) // 'tl', 'tr', 'bl', 'br', 't', 'r', 'b', 'l'
  const [isCreatingSelection, setIsCreatingSelection] = useState(false)
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 })
  const [resizeWidth, setResizeWidth] = useState('')
  const [resizeHeight, setResizeHeight] = useState('')
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [iconSize, setIconSize] = useState(24)
  const canvasRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const imageRef = useRef(null)
  const containerRef = useRef(null)

  const FORMATS = [
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' },
    { value: 'bmp', label: 'BMP' },
    { value: 'svg', label: 'SVG' }
  ]

  const normalizeSvgForIcon = (svgText, sizePx, fallbackViewBox) => {
    try {
      const size = Math.max(8, Math.min(512, Number(sizePx) || 24))
      let text = svgText
      if (!/<svg[\s\S]*?>/i.test(text)) return svgText
      const widthMatch = text.match(/\bwidth\s*=\s*"(\d+(?:\.\d+)?)"/i)
      const heightMatch = text.match(/\bheight\s*=\s*"(\d+(?:\.\d+)?)"/i)
      const viewBoxMatch = text.match(/\bviewBox\s*=\s*"([^"]+)"/i)
      let viewBox = viewBoxMatch ? viewBoxMatch[1] : ''
      if (!viewBox) {
        const w = Number(widthMatch?.[1] || fallbackViewBox?.w || 24)
        const h = Number(heightMatch?.[1] || fallbackViewBox?.h || 24)
        viewBox = `0 0 ${Math.max(1, Math.round(w))} ${Math.max(1, Math.round(h))}`
        text = text.replace(/<svg(\s[^>]*)?>/i, (m) => m.replace('>', ` viewBox="${viewBox}">`))
      }
      if (/\bwidth\s*=/.test(text)) {
        text = text.replace(/\bwidth\s*=\s*"[^"]*"/i, `width="${size}"`)
      } else {
        text = text.replace(/<svg(\s[^>]*)?>/i, (m) => m.replace('>', ` width="${size}">`))
      }
      if (/\bheight\s*=/.test(text)) {
        text = text.replace(/\bheight\s*=\s*"[^"]*"/i, `height="${size}` + `"`)
      } else {
        text = text.replace(/<svg(\s[^>]*)?>/i, (m) => m.replace('>', ` height="${size}">`))
      }
      return text
    } catch {
      return svgText
    }
  }

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

      if (file.type === 'image/svg+xml') {
        setIsSvgInput(true)
        const textReader = new FileReader()
        textReader.onload = (ev) => {
          const raw = String(ev.target.result || '')
          setSvgRaw(raw)
          setSvgCode(normalizeSvgForIcon(raw, iconSize, { w: originalDimensions.width, h: originalDimensions.height }))
        }
        textReader.readAsText(file)
      } else {
        setIsSvgInput(false)
        setSvgRaw('')
        setSvgCode('')
      }
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
      if (file.type === 'image/svg+xml') {
        setIsSvgInput(true)
        const textReader = new FileReader()
        textReader.onload = (ev) => {
          const raw = String(ev.target.result || '')
          setSvgRaw(raw)
          setSvgCode(normalizeSvgForIcon(raw, iconSize, { w: originalDimensions.width, h: originalDimensions.height }))
        }
        textReader.readAsText(file)
      } else {
        setIsSvgInput(false)
        setSvgRaw('')
        setSvgCode('')
      }
    }
  }

  useEffect(() => {
    if (isSvgInput && svgRaw) {
      setSvgCode(normalizeSvgForIcon(svgRaw, iconSize, { w: originalDimensions.width, h: originalDimensions.height }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iconSize])

  const convertImage = () => {
    if (!uploadedImage) return

    setIsConverting(true)
    
    // SVG output handling
    if (selectedFormat === 'svg') {
      const img = new Image()
      img.onload = () => {
        const width = img.width
        const height = img.height
        let outSvg = ''

        if (isSvgInput && svgCode) {
          outSvg = normalizeSvgForIcon(svgCode, iconSize, { w: width, h: height })
        } else {
          // Wrap raster as embedded image inside SVG
          const href = uploadedImage
          const baseSvg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  <image href="${href}" width="${width}" height="${height}" />\n</svg>`
          outSvg = normalizeSvgForIcon(baseSvg, iconSize, { w: width, h: height })
        }

        const blob = new Blob([outSvg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        setSvgCode(outSvg)
        setDownloadUrl(url)
        setCroppedImage(url)
        setIsConverting(false)
      }
      img.src = uploadedImage
      return
    }

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
    // Reset crop data - user will draw their own selection
    setCropData({ x: 0, y: 0, width: 0, height: 0 })
  }

  const getResizeHandle = (x, y, cropData, tolerance = 15) => {
    const { x: cx, y: cy, width: cw, height: ch } = cropData
    
    // Check corners first
    if (Math.abs(x - cx) < tolerance && Math.abs(y - cy) < tolerance) return 'tl'
    if (Math.abs(x - (cx + cw)) < tolerance && Math.abs(y - cy) < tolerance) return 'tr'
    if (Math.abs(x - cx) < tolerance && Math.abs(y - (cy + ch)) < tolerance) return 'bl'
    if (Math.abs(x - (cx + cw)) < tolerance && Math.abs(y - (cy + ch)) < tolerance) return 'br'
    
    // Check edges
    if (Math.abs(y - cy) < tolerance && x >= cx && x <= cx + cw) return 't'
    if (Math.abs(y - (cy + ch)) < tolerance && x >= cx && x <= cx + cw) return 'b'
    if (Math.abs(x - cx) < tolerance && y >= cy && y <= cy + ch) return 'l'
    if (Math.abs(x - (cx + cw)) < tolerance && y >= cy && y <= cy + ch) return 'r'
    
    return null
  }

  const handleMouseDown = (e) => {
    if (!isCropMode || !imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // If crop box doesn't exist or is empty, start creating new selection
    if (cropData.width === 0 || cropData.height === 0) {
      setCropData({ x, y, width: 0, height: 0 })
      setIsDragging(true)
      setIsCreatingSelection(true)
      setDragStart({ x, y })
      setResizeHandle(null)
      return
    }

    // Check if clicking on resize handle
    const handle = getResizeHandle(x, y, cropData)
    if (handle) {
      setResizeHandle(handle)
      setIsDragging(true)
      setDragStart({ x, y, ...cropData })
      return
    }

    // Check if clicking inside crop box (to move it)
    if (x >= cropData.x && x <= cropData.x + cropData.width &&
        y >= cropData.y && y <= cropData.y + cropData.height) {
      setIsDragging(true)
      setDragStart({
        x: x - cropData.x,
        y: y - cropData.y
      })
      setResizeHandle(null)
      setIsCreatingSelection(false)
    } else {
      // Clicking outside existing crop box - start new selection
      setCropData({ x, y, width: 0, height: 0 })
      setIsDragging(true)
      setIsCreatingSelection(true)
      setDragStart({ x, y })
      setResizeHandle(null)
    }
  }

  const handleMouseMove = (e) => {
    if (!isCropMode || !imageRef.current) return
    
    const rect = imageRef.current.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    // Update cursor based on hover position
    if (!isDragging && cropData.width > 0 && cropData.height > 0) {
      const handle = getResizeHandle(currentX, currentY, cropData)
      if (handle) {
        const cursorMap = {
          'tl': 'nw-resize', 'tr': 'ne-resize', 'bl': 'sw-resize', 'br': 'se-resize',
          't': 'n-resize', 'b': 's-resize', 'l': 'w-resize', 'r': 'e-resize'
        }
        e.currentTarget.style.cursor = cursorMap[handle] || 'default'
      } else if (currentX >= cropData.x && currentX <= cropData.x + cropData.width &&
                 currentY >= cropData.y && currentY <= cropData.y + cropData.height) {
        e.currentTarget.style.cursor = 'move'
      } else {
        e.currentTarget.style.cursor = 'crosshair'
      }
    }

    if (!isDragging) return

    // Resize mode
    if (resizeHandle) {
      const { x: startX, y: startY, width: startWidth, height: startHeight } = dragStart
      let newCropData = { ...cropData }

      switch (resizeHandle) {
        case 'tl':
          newCropData = {
            x: Math.max(0, Math.min(currentX, cropData.x + cropData.width - 10)),
            y: Math.max(0, Math.min(currentY, cropData.y + cropData.height - 10)),
            width: Math.max(10, cropData.x + cropData.width - currentX),
            height: Math.max(10, cropData.y + cropData.height - currentY)
          }
          break
        case 'tr':
          newCropData = {
            x: cropData.x,
            y: Math.max(0, Math.min(currentY, cropData.y + cropData.height - 10)),
            width: Math.max(10, currentX - cropData.x),
            height: Math.max(10, cropData.y + cropData.height - currentY)
          }
          break
        case 'bl':
          newCropData = {
            x: Math.max(0, Math.min(currentX, cropData.x + cropData.width - 10)),
            y: cropData.y,
            width: Math.max(10, cropData.x + cropData.width - currentX),
            height: Math.max(10, currentY - cropData.y)
          }
          break
        case 'br':
          newCropData = {
            x: cropData.x,
            y: cropData.y,
            width: Math.max(10, currentX - cropData.x),
            height: Math.max(10, currentY - cropData.y)
          }
          break
        case 't':
          newCropData = {
            ...cropData,
            y: Math.max(0, Math.min(currentY, cropData.y + cropData.height - 10)),
            height: Math.max(10, cropData.y + cropData.height - currentY)
          }
          break
        case 'b':
          newCropData = {
            ...cropData,
            height: Math.max(10, currentY - cropData.y)
          }
          break
        case 'l':
          newCropData = {
            ...cropData,
            x: Math.max(0, Math.min(currentX, cropData.x + cropData.width - 10)),
            width: Math.max(10, cropData.x + cropData.width - currentX)
          }
          break
        case 'r':
          newCropData = {
            ...cropData,
            width: Math.max(10, currentX - cropData.x)
          }
          break
      }

      // Ensure crop box stays within image bounds
      newCropData.x = Math.max(0, Math.min(newCropData.x, rect.width - newCropData.width))
      newCropData.y = Math.max(0, Math.min(newCropData.y, rect.height - newCropData.height))
      newCropData.width = Math.min(newCropData.width, rect.width - newCropData.x)
      newCropData.height = Math.min(newCropData.height, rect.height - newCropData.y)

      setCropData(newCropData)
      return
    }

    // Creating new selection
    if (isCreatingSelection) {
      const newWidth = currentX - dragStart.x
      const newHeight = currentY - dragStart.y
      const newX = newWidth < 0 ? currentX : dragStart.x
      const newY = newHeight < 0 ? currentY : dragStart.y
      
      setCropData({
        x: Math.max(0, Math.min(newX, rect.width)),
        y: Math.max(0, Math.min(newY, rect.height)),
        width: Math.max(0, Math.abs(newWidth)),
        height: Math.max(0, Math.abs(newHeight))
      })
      return
    }

    // Moving crop box
    const x = currentX - dragStart.x
    const y = currentY - dragStart.y
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
    setResizeHandle(null)
    setIsCreatingSelection(false)
    if (imageRef.current) {
      imageRef.current.parentElement.style.cursor = 'default'
    }
  }

  const handleCancelCrop = () => {
    setIsCropMode(false)
    setIsDragging(false)
    setResizeHandle(null)
    setIsCreatingSelection(false)
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

      if (selectedFormat === 'svg') {
        const dataUrl = canvas.toDataURL('image/png')
        const baseSvg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  <image href="${dataUrl}" width="${width}" height="${height}" />\n</svg>`
        const outSvg = normalizeSvgForIcon(baseSvg, iconSize, { w: width, h: height })
        const blob = new Blob([outSvg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        setSvgCode(outSvg)
        setDownloadUrl(url)
        setCroppedImage(url)
        setIsConverting(false)
        return
      }

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
    
    // Validate crop data
    if (!cropData.width || !cropData.height || cropData.width < 10 || cropData.height < 10) {
      alert('Please select a valid crop area first')
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      const imgEl = imageRef.current
      // Get displayed container dimensions
      const displayedRect = imgEl.getBoundingClientRect()
      const containerWidth = displayedRect.width
      const containerHeight = displayedRect.height
      const naturalWidth = img.naturalWidth || img.width
      const naturalHeight = img.naturalHeight || img.height

      // Calculate actual rendered image dimensions with object-fit: contain
      const imageAspect = naturalWidth / naturalHeight
      const containerAspect = containerWidth / containerHeight
      
      let renderedWidth, renderedHeight, offsetX, offsetY
      if (imageAspect > containerAspect) {
        // Image is wider - fit to width, letterbox on top/bottom
        renderedWidth = containerWidth
        renderedHeight = containerWidth / imageAspect
        offsetX = 0
        offsetY = (containerHeight - renderedHeight) / 2
      } else {
        // Image is taller - fit to height, letterbox on sides
        renderedWidth = containerHeight * imageAspect
        renderedHeight = containerHeight
        offsetX = (containerWidth - renderedWidth) / 2
        offsetY = 0
      }

      // Scale factors from rendered pixels -> natural pixels (should be same in both dimensions with contain)
      const scale = naturalWidth / renderedWidth

      // Adjust crop coordinates to account for letterboxing offset
      const adjustedX = cropData.x - offsetX
      const adjustedY = cropData.y - offsetY

      // Clamp to actual rendered image bounds
      const clampedX = Math.max(0, Math.min(adjustedX, renderedWidth))
      const clampedY = Math.max(0, Math.min(adjustedY, renderedHeight))
      const clampedW = Math.max(1, Math.min(cropData.width, renderedWidth - clampedX))
      const clampedH = Math.max(1, Math.min(cropData.height, renderedHeight - clampedY))

      // Convert to natural pixel coordinates (rounded for pixel-perfect cropping)
      const cropX = Math.round(clampedX * scale)
      const cropY = Math.round(clampedY * scale)
      const cropWidth = Math.round(clampedW * scale)
      const cropHeight = Math.round(clampedH * scale)
      
      canvas.width = cropWidth
      canvas.height = cropHeight
      
      ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
      
      if (selectedFormat === 'svg') {
        const dataUrl = canvas.toDataURL('image/png')
        const baseSvg = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${cropWidth}\" height=\"${cropHeight}\" viewBox=\"0 0 ${cropWidth} ${cropHeight}\">\n  <image href=\"${dataUrl}\" width=\"${cropWidth}\" height=\"${cropHeight}\" />\n</svg>`
        const outSvg = normalizeSvgForIcon(baseSvg, iconSize, { w: cropWidth, h: cropHeight })
        const blob = new Blob([outSvg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        setSvgCode(outSvg)
        setDownloadUrl(url)
        setCroppedImage(url)
        setIsCropMode(false)
        return
      }

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
    setIsSvgInput(false)
    setSvgRaw('')
    setSvgCode('')
    setIconSize(24)
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
                {isSvgInput && !isCropMode && (
                  <div className="svg-code-panel">
                    <h4>SVG Code</h4>
                    <textarea
                      value={svgCode}
                      readOnly
                      className="svg-code-textarea"
                      rows={8}
                    />
                    <div className="svg-actions">
                      <button
                        onClick={async () => { try { await navigator.clipboard.writeText(svgCode) } catch {} }}
                        className="action-button"
                      >Copy Code</button>
                      <button
                        onClick={() => {
                          const blob = new Blob([svgCode], { type: 'image/svg+xml' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'image.svg'
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        }}
                        className="download-button"
                      >Download SVG</button>
                    </div>
                  </div>
                )}
                {isCropMode && (
                  <div className="crop-controls">
                    <button 
                      onClick={applyCrop} 
                      className="apply-crop-btn"
                      disabled={!cropData.width || !cropData.height || cropData.width < 10 || cropData.height < 10}
                    >
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
                  {isCropMode && cropData.width > 0 && cropData.height > 0 && (
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
                      <div className="crop-edge crop-edge-t"></div>
                      <div className="crop-edge crop-edge-b"></div>
                      <div className="crop-edge crop-edge-l"></div>
                      <div className="crop-edge crop-edge-r"></div>
                    </div>
                  )}
                </div>
                {isCropMode && (
                  <p className="crop-info">
                    {cropData.width > 0 && cropData.height > 0 ? (
                      <>Selected: {Math.round(cropData.width)} × {Math.round(cropData.height)} pixels</>
                    ) : (
                      <>Click and drag to select crop area</>
                    )}
                  </p>
                )}
              </div>
              
              {!isCropMode && (
              <div className="controls-section">
                {(selectedFormat === 'svg' || isSvgInput) && (
                  <div className="icon-size-section">
                    <h4>Icon Size</h4>
                    <div className="resize-inputs">
                      <div className="input-group">
                        <label htmlFor="icon-size">Size (px):</label>
                        <input
                          id="icon-size"
                          type="number"
                          min="8"
                          max="512"
                          value={iconSize}
                          onChange={(e) => setIconSize(parseInt(e.target.value) || 24)}
                          className="dimension-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                    <PremiumDropdown
                      id="format-select"
                      label="Select Output Format:"
                      value={selectedFormat}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      options={FORMATS.map(f => ({ value: f.value, label: f.label }))}
                      className="format-select"
                    />
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
              {selectedFormat === 'svg' && svgCode && (
                <div className="svg-code-panel">
                  <h4>SVG Code</h4>
                  <textarea
                    value={svgCode}
                    readOnly
                    className="svg-code-textarea"
                    rows={10}
                  />
                  <div className="svg-actions">
                    <button
                      onClick={async () => { try { await navigator.clipboard.writeText(svgCode) } catch {} }}
                      className="action-button"
                    >Copy Code</button>
                    <button onClick={handleDownload} className="download-button">Download SVG</button>
                  </div>
                </div>
              )}
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
