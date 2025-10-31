import { useState, useRef, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { BACKEND_URL } from '../constants'
import './PDFEditor.css'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const PDFEditor = () => {
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [textFields, setTextFields] = useState([]) // [{ id, page, x, y, text, originalText, fontSize, color, boxWidth, boxHeight, isExisting }]
  const [selectedField, setSelectedField] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [editedPdfUrl, setEditedPdfUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  // Load PDF and extract existing text
  const loadPdf = async (file) => {
    setIsLoading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      setPdfDoc(pdf)
      setNumPages(pdf.numPages)
      setCurrentPage(1)
      
      // Extract existing text from all pages
      await extractExistingText(pdf)
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading PDF:', error)
      alert('PDF load करने में त्रुटि हुई')
      setIsLoading(false)
    }
  }

  // Extract existing text from PDF pages
  const extractExistingText = async (pdf) => {
    const fields = []
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // Group text items by line (similar Y position)
      const lines = {}
      textContent.items.forEach(item => {
        if (item.str && item.str.trim()) {
          const y = item.transform[5] // Y coordinate from transform matrix
          const lineKey = Math.round(y / 5) * 5 // Group by 5pt intervals
          
          if (!lines[lineKey]) {
            lines[lineKey] = []
          }
          
          lines[lineKey].push({
            text: item.str,
            x: item.transform[4], // X coordinate
            y: y,
            width: item.width || 0,
            height: item.height || 12,
            fontSize: item.height || 12
          })
        }
      })
      
      // Create editable fields for each line
      Object.entries(lines).forEach(([yKey, items]) => {
        const sortedItems = items.sort((a, b) => a.x - b.x)
        const combinedText = sortedItems.map(i => i.text).join(' ')
        const firstItem = sortedItems[0]
        const lastItem = sortedItems[sortedItems.length - 1]
        
        // Calculate bounding box
        const boxWidth = (lastItem.x + lastItem.width) - firstItem.x
        const boxHeight = Math.max(...sortedItems.map(i => i.height))
        
        fields.push({
          id: `page${pageNum}_${yKey}_${Date.now()}`,
          page: pageNum,
          x: firstItem.x,
          y: firstItem.y,
          text: combinedText,
          originalText: combinedText,
          fontSize: firstItem.fontSize || 12,
          color: '#000000',
          boxWidth,
          boxHeight,
          isExisting: true
        })
      })
    }
    
    setTextFields(fields)
    renderPage(currentPage, pdf)
  }

  // Render PDF page on canvas
  const renderPage = async (pageNum, pdf = pdfDoc) => {
    if (!pdf || !canvasRef.current) return
    
    try {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.0 })
      
      // Calculate scale to fit container width
      const container = containerRef.current
      const containerWidth = container ? container.offsetWidth - 40 : 800
      const scale = containerWidth / viewport.width
      const scaledViewport = page.getViewport({ scale })
      
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      canvas.height = scaledViewport.height
      canvas.width = scaledViewport.width
      
      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport: scaledViewport
      }).promise
      
      // Draw editable text fields on top
      drawTextFields(pageNum, context, scaledViewport)
    } catch (error) {
      console.error('Error rendering page:', error)
    }
  }

  // Draw text fields on canvas
  const drawTextFields = (pageNum, context, viewport) => {
    const fields = textFields.filter(f => f.page === pageNum)

    fields.forEach(field => {
      if (!field.text || !field.text.trim()) return
      
      context.font = `${field.fontSize || 12}px Arial`
      
      // Convert PDF coordinates to canvas coordinates
      const canvasX = (field.x / 612) * viewport.width
      const canvasY = viewport.height - (field.y / 792) * viewport.height
      
      // Estimate text box size
      const width = Math.max(
        field.boxWidth ? (field.boxWidth / 612) * viewport.width : context.measureText(field.text || '').width,
        4
      )
      const height = field.boxHeight ? (field.boxHeight / 792) * viewport.height : (field.fontSize || 12) * 1.2

      // MASK ORIGINAL TEXT - White rectangle to hide original PDF text
      if (field.isExisting && field.text.trim()) {
        context.fillStyle = '#FFFFFF'
        context.fillRect(canvasX - 3, canvasY - height, width + 6, height + 3)
      }

      // Highlight when selected
      if (selectedField && selectedField.id === field.id) {
        context.fillStyle = 'rgba(102, 126, 234, 0.2)'
        context.fillRect(canvasX - 2, canvasY - height + 2, width + 4, height + 4)
      }

      // Draw text on top
      context.fillStyle = field.color || '#000000'
      context.fillText(field.text, canvasX, canvasY)

      // Draw selection border
      if (selectedField && selectedField.page === pageNum && selectedField.id === field.id) {
        context.strokeStyle = '#667eea'
        context.lineWidth = 2
        context.strokeRect(canvasX - 2, canvasY - height + 2, width + 4, height + 4)
      }
    })
  }

  // Handle canvas click to select/edit text
  const handleCanvasClick = async (e) => {
    if (!pdfDoc) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    
    // Get page viewport for coordinate conversion
    const page = await pdfDoc.getPage(currentPage)
    const viewport = page.getViewport({ scale: 1.0 })
    const container = containerRef.current
    const containerWidth = container ? container.offsetWidth - 40 : 800
    const scale = containerWidth / viewport.width
    const scaledViewport = page.getViewport({ scale })
    
    // Convert canvas coordinates to PDF coordinates
    const pdfX = (clickX / scaledViewport.width) * 612
    const pdfY = 792 - ((clickY / scaledViewport.height) * 792)
    
    // Find closest text field
    const clickedField = findTextAtPosition(currentPage, pdfX, pdfY, scaledViewport)
    
    if (clickedField) {
      setSelectedField(clickedField)
      // Focus the text input
      setTimeout(() => {
        const textInput = document.querySelector('.edit-text-input')
        if (textInput) textInput.focus()
      }, 100)
    }
  }

  // Find text field at given position
  const findTextAtPosition = (pageNum, pdfX, pdfY, viewport) => {
    const pageFields = textFields.filter(f => f.page === pageNum)
    
    for (const field of pageFields) {
      const canvasX = (field.x / 612) * viewport.width
      const canvasY = viewport.height - (field.y / 792) * viewport.height
      
      const width = field.boxWidth ? (field.boxWidth / 612) * viewport.width : 100
      const height = field.boxHeight ? (field.boxHeight / 792) * viewport.height : 20
      
      // Check if click is within field bounds
      if (
        pdfX >= field.x - 5 &&
        pdfX <= field.x + (field.boxWidth || 100) + 5 &&
        pdfY >= field.y - 10 &&
        pdfY <= field.y + 10
      ) {
        return field
      }
    }
    
    return null
  }

  // Update text field
  const updateField = (id, updates) => {
    setTextFields(fields => fields.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ))
    
    if (selectedField && selectedField.id === id) {
      setSelectedField({ ...selectedField, ...updates })
    }
    
    // Re-render page
    setTimeout(() => renderPage(currentPage), 50)
  }

  // Add new text field
  const addNewText = () => {
    const newField = {
      id: `new_${Date.now()}`,
      page: currentPage,
      x: 50,
      y: 750,
      text: '',
      originalText: '',
      fontSize: 12,
      color: '#000000',
      boxWidth: 0,
      boxHeight: 12,
      isExisting: false
    }
    
    setTextFields([...textFields, newField])
    setSelectedField(newField)
  }

  // Delete text field
  const deleteField = (id) => {
    setTextFields(fields => fields.filter(f => f.id !== id))
    if (selectedField && selectedField.id === id) {
      setSelectedField(null)
    }
    setTimeout(() => renderPage(currentPage), 50)
  }

  // File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setTextFields([])
      setSelectedField(null)
      setEditedPdfUrl(null)
      await loadPdf(file)
    } else {
      alert('कृपया एक वैध PDF file अपलोड करें')
    }
  }

  const handleDragDrop = async (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setTextFields([])
      setSelectedField(null)
      setEditedPdfUrl(null)
      await loadPdf(file)
    }
  }

  // Save PDF via backend
  const savePdf = async () => {
    if (!pdfFile) {
      alert('कृपया पहले PDF file upload करें')
      return
    }

    const fieldsWithText = textFields.filter(f => f.text && f.text.trim())
    if (fieldsWithText.length === 0) {
      alert('कृपया कम से कम एक text field में content दर्ज करें')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Prepare edits for backend
      const edits = fieldsWithText.map(field => {
        const editObj = {
          page: field.page,
          x: field.x,
          y: 792 - field.y, // Flip Y coordinate for PDF (PDF origin is bottom-left)
          text: field.text.trim(),
          fontSize: field.fontSize || 12,
          color: field.color || '#000000'
        }

        // Add mask for existing fields to prevent overlap
        if (field.isExisting) {
          const originalBoxWidth = field.boxWidth || 0
          const estimatedTextWidth = (field.text.trim().length * (field.fontSize || 12) * 0.6)
          
          const maskWidth = Math.max(
            originalBoxWidth || 0,
            estimatedTextWidth,
            Math.min(612 - field.x, 500)
          )
          
          editObj.mask = {
            width: maskWidth + 30,
            height: (field.boxHeight || (field.fontSize || 12) * 1.5) + 8
          }
        }

        return editObj
      })

      // Create FormData
      const formData = new FormData()
      formData.append('file', pdfFile)
      formData.append('edits', JSON.stringify(edits))
      
      // Call backend API
      const response = await fetch(`${BACKEND_URL}/api/pdf/edit`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error' }))
        throw new Error(errorData.error || 'PDF edit failed')
      }

      const data = await response.json()
      
      if (data.success && data.downloadUrl) {
        setEditedPdfUrl(data.downloadUrl)
        alert('✅ PDF सफलतापूर्वक edit हो गया है! अब आप download कर सकते हैं।')
      } else {
        throw new Error('Backend response invalid')
      }
      
      setIsProcessing(false)
    } catch (error) {
      console.error('Error saving PDF:', error)
      let errorMessage = 'PDF save करने में त्रुटि: '
      
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage += `\nBackend server चल रहा है? ${BACKEND_URL} check करें`
      } else {
        errorMessage += error.message
      }
      
      alert(errorMessage)
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (editedPdfUrl) {
      window.open(editedPdfUrl, '_blank')
    }
  }

  const reset = () => {
    setPdfFile(null)
    setPdfDoc(null)
    setNumPages(0)
    setCurrentPage(1)
    setTextFields([])
    setSelectedField(null)
    setEditedPdfUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Re-render when page changes or fields update
  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage)
    }
  }, [currentPage, textFields.length])

  // Re-render when selected field changes
  useEffect(() => {
    if (pdfDoc && selectedField) {
      renderPage(currentPage)
    }
  }, [selectedField?.text, selectedField?.fontSize, selectedField?.color])

  return (
    <div className="pdf-editor-container">
      {!pdfFile ? (
        <div className="upload-section">
          <div
            className="upload-area"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDragDrop}
          >
            <div className="upload-icon">📄</div>
            <h2>PDF Upload करें</h2>
            <p className="upload-description">
              अपना Resume या PDF file अपलोड करें और edit करें
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="upload-button">
              📁 PDF File चुनें
            </label>
            <p className="upload-hint">या यहाँ PDF खींचें और छोड़ें</p>
          </div>
        </div>
      ) : (
        <div className="editor-view">
          <div className="editor-header">
            <div className="header-left">
              <h2>PDF Editor</h2>
              <p className="header-subtitle">{pdfFile.name}</p>
            </div>
            <button onClick={reset} className="reset-btn">
              🔄 New PDF
            </button>
          </div>

          {isLoading ? (
            <div className="loading-section">
              <div className="spinner"></div>
              <p>PDF लोड हो रहा है और text extract किया जा रहा है...</p>
            </div>
          ) : (
            <div className="editor-main">
              <div className="pdf-viewer-section">
                <div className="viewer-header">
                  <div className="page-controls">
                    <button
                      onClick={() => {
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1)
                        }
                      }}
                      disabled={currentPage === 1}
                      className="page-btn"
                    >
                      ← पिछला
                    </button>
                    <span className="page-info">
                      Page {currentPage} of {numPages}
                    </span>
                    <button
                      onClick={() => {
                        if (currentPage < numPages) {
                          setCurrentPage(currentPage + 1)
                        }
                      }}
                      disabled={currentPage === numPages}
                      className="page-btn"
                    >
                      अगला →
                    </button>
                  </div>
                  <button onClick={addNewText} className="add-text-btn">
                    ➕ Add New Text
                  </button>
                </div>
                
                <div className="pdf-viewer-container" ref={containerRef}>
                  <div className="canvas-wrapper" onClick={handleCanvasClick}>
                    <canvas ref={canvasRef} className="pdf-canvas" />
                  </div>
                </div>
                
                <p className="canvas-hint">
                  💡 PDF पर किसी text पर click करें उसे edit करने के लिए
                </p>
              </div>

              <div className="editor-sidebar">
                {selectedField ? (
                  <div className="edit-form">
                    <div className="form-header">
                      <h3>✏️ Edit Text</h3>
                      <button
                        onClick={() => setSelectedField(null)}
                        className="close-btn"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="form-group">
                      <label>Text Content:</label>
                      <textarea
                        className="edit-text-input"
                        placeholder="Text यहाँ type करें..."
                        value={selectedField.text || ''}
                        onChange={(e) => updateField(selectedField.id, { text: e.target.value })}
                        rows={4}
                      />
                      {selectedField.isExisting && (
                        <p className="original-text-hint">
                          Original: {selectedField.originalText}
                        </p>
                      )}
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Font Size:</label>
                        <input
                          type="number"
                          min="8"
                          max="72"
                          value={selectedField.fontSize || 12}
                          onChange={(e) => updateField(selectedField.id, { fontSize: parseInt(e.target.value) || 12 })}
                          className="number-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Color:</label>
                        <input
                          type="color"
                          value={selectedField.color || '#000000'}
                          onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                          className="color-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Position (PDF Coordinates):</label>
                      <div className="form-row">
                        <input
                          type="number"
                          value={Math.round(selectedField.x)}
                          onChange={(e) => updateField(selectedField.id, { x: parseFloat(e.target.value) || 0 })}
                          className="number-input"
                          placeholder="X"
                        />
                        <input
                          type="number"
                          value={Math.round(selectedField.y)}
                          onChange={(e) => updateField(selectedField.id, { y: parseFloat(e.target.value) || 0 })}
                          className="number-input"
                          placeholder="Y"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => deleteField(selectedField.id)}
                      className="delete-field-btn"
                    >
                      🗑️ Delete This Text
                    </button>
                  </div>
                ) : (
                  <div className="empty-state">
                    <h3>✏️ Text Edits</h3>
                    <p>PDF पर text पर click करें या "Add New Text" button से नया text add करें</p>
                  </div>
                )}

                <div className="edits-summary">
                  <h4>Total Edits: {textFields.filter(f => f.text?.trim()).length}</h4>
                  <p className="summary-hint">
                    {textFields.filter(f => f.isExisting && f.text !== f.originalText).length} text fields edited
                  </p>
                </div>

                <div className="actions-section">
                  <button 
                    onClick={savePdf}
                    className="save-btn"
                    disabled={isProcessing || textFields.filter(f => f.text?.trim()).length === 0}
                  >
                    {isProcessing ? '🔄 Processing...' : '💾 Save PDF'}
                  </button>

                  {editedPdfUrl && (
                    <button onClick={handleDownload} className="download-btn">
                      💾 Download Edited PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PDFEditor
