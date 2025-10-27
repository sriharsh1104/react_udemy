import { useState, useRef } from 'react'
import * as pdfLib from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import './PDFEditor.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const PDFEditor = () => {
  const [pdfFile, setPdfFile] = useState(null)
  const [textContent, setTextContent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [editedPdfUrl, setEditedPdfUrl] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      await extractTextFromPdf(file)
    } else {
      alert('Please upload a valid PDF file')
    }
  }

  const handleDragDrop = async (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      await extractTextFromPdf(file)
    }
  }

  const extractTextFromPdf = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      
      let fullText = ''
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        
        const pageText = textContent.items.map(item => item.str).join(' ')
        fullText += `\n\n--- Page ${i} ---\n\n` + pageText + '\n'
      }
      
      setTextContent(fullText)
      setShowPreview(true)
    } catch (error) {
      console.error('Error extracting text:', error)
      alert('Error reading PDF content')
    }
  }

  const createEditedPdf = async () => {
    setIsProcessing(true)
    try {
      if (!textContent.trim()) {
        alert('Please enter some content')
        setIsProcessing(false)
        return
      }

      // Create completely NEW clean PDF (no overlapping)
      const pdfDoc = await pdfLib.PDFDocument.create()
      
      // Parse edited content (remove page markers)
      const lines = textContent.split('\n').filter(line => !line.includes('--- Page'))
      
      // Filter out emojis and special characters
      const sanitizeText = (text) => {
        return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
                   .replace(/[^\x00-\x7F]/g, '')
                   .trim()
      }
      
      let currentPage = null
      let yPos = 742 // A4 height - margin
      const lineHeight = 22
      const maxLines = 35
      
      lines.forEach((line) => {
        const cleanLine = sanitizeText(line)
        
        if (cleanLine) {
          // Create new page if needed
          if (!currentPage || yPos < 50) {
            currentPage = pdfDoc.addPage([612, 792]) // A4 size
            yPos = 742
          }
          
          currentPage.drawText(cleanLine, {
            x: 50,
            y: yPos,
            size: 12,
            color: pdfLib.rgb(0, 0, 0),
          })
          
          yPos -= lineHeight
        }
      })
      
      // Ensure at least one page
      if (!currentPage) {
        currentPage = pdfDoc.addPage([612, 792])
      }
      
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setEditedPdfUrl(url)
      
      alert('✅ PDF updated successfully!')
      setIsProcessing(false)
    } catch (error) {
      console.error('Error creating PDF:', error)
      alert('Error: ' + error.message)
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (editedPdfUrl) {
      const a = document.createElement('a')
      a.href = editedPdfUrl
      a.download = 'edited_document.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const reset = () => {
    setPdfFile(null)
    setTextContent('')
    setEditedPdfUrl(null)
    setShowPreview(false)
  }

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
            <h3>Upload PDF to Edit</h3>
            <p>Extract text content for editing</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="upload-button">
              Select PDF
            </label>
          </div>
        </div>
      ) : (
        <div className="editor-view">
          <div className="editor-header">
            <h3>✏️ Document Editor Mode</h3>
            <button onClick={reset} className="reset-btn">Upload New PDF</button>
          </div>

          {!showPreview ? (
            <div className="loading-panel">
              <div className="spinner"></div>
              <p>Extracting text from PDF...</p>
            </div>
          ) : (
            <div className="editor-content">
              <div className="editor-panel">
                <h4>📝 Edit Content (Live Preview)</h4>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="editor-textarea"
                  placeholder="Edit your content here..."
                  rows={30}
                />
                
                <div className="editor-actions">
                  <button 
                    onClick={createEditedPdf}
                    className="apply-btn"
                    disabled={isProcessing}
                  >
                    {isProcessing ? '🔄 Creating PDF...' : '✅ Apply Changes & Create PDF'}
                  </button>
                </div>
              </div>

              {editedPdfUrl && (
                <div className="preview-panel">
                  <h4>📄 Preview</h4>
                  <iframe
                    src={editedPdfUrl}
                    title="PDF Preview"
                    className="pdf-preview-iframe"
                  />
                  
                  <div className="download-section">
                    <button onClick={handleDownload} className="download-btn">
                      💾 Download Edited PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PDFEditor