import { useState, useRef, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { BACKEND_URL } from '../constants'
import './PDFEditor.css'

// Configure PDF.js worker - use https for better compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const PDFEditor = () => {
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfText, setPdfText] = useState(null)
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('hi')
  const [availableLanguages, setAvailableLanguages] = useState([])
  const [speechRate, setSpeechRate] = useState(1)
  const fileInputRef = useRef(null)
  const audioRef = useRef(null)
  const speechQueueRef = useRef([])
  const currentChunkRef = useRef(0)

  // File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      setPdfFile(file)
      setPdfText(null) // Reset previous text
      setError(null) // Reset error
    } else {
      alert('कृपया एक वैध PDF file अपलोड करें')
    }
  }

  const handleDragDrop = async (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      setPdfFile(file)
      setPdfText(null) // Reset previous text
      setError(null) // Reset error
    } else {
      alert('कृपया एक वैध PDF file अपलोड करें')
    }
  }

  // Read PDF and extract text
  const readPdf = async () => {
    if (!pdfFile) {
      alert('कृपया पहले PDF file upload करें')
      return
    }

    setIsReading(true)
    setError(null)
    setPdfText(null)
    
    try {
      const arrayBuffer = await pdfFile.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      const numPages = pdf.numPages
      
      let extractedText = ''
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // Better text extraction - preserve line breaks
        const pageText = textContent.items
          .map(item => item.str || '')
          .join(' ')
        
        extractedText += `\n--- Page ${pageNum} of ${numPages} ---\n${pageText}\n`
      }
      
      if (extractedText.trim() === '') {
        setError('PDF में कोई text नहीं मिला। यह PDF scanned image हो सकता है।')
      } else {
        setPdfText(extractedText)
      }
      
      setIsReading(false)
    } catch (error) {
      console.error('Error reading PDF:', error)
      setError(`PDF पढ़ने में त्रुटि हुई: ${error.message}`)
      setIsReading(false)
    }
  }

  // Load available languages
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/tts/languages`)
        const data = await response.json()
        if (data.success && data.languages) {
          setAvailableLanguages(data.languages)
          // Set default to Hindi if available
          const hindiLang = data.languages.find(l => l.code === 'hi')
          if (hindiLang) {
            setSelectedLanguage('hi')
          }
        }
      } catch (error) {
        console.error('Failed to load languages:', error)
        // Fallback languages
        setAvailableLanguages([
          { code: 'hi', name: 'Hindi' },
          { code: 'en', name: 'English' },
          { code: 'en-IN', name: 'English (India)' }
        ])
      }
    }
    loadLanguages()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeech()
    }
  }, [])

  // Split text into chunks (Google TTS has ~200 char limit per request)
  const splitTextIntoChunks = (text, maxLength = 200) => {
    const chunks = []
    const sentences = text.split(/[.!?।\n]+/).filter(s => s.trim())
    
    let currentChunk = ''
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += sentence + '. '
      } else {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim())
        }
        currentChunk = sentence + '. '
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim())
    }
    
    return chunks.length > 0 ? chunks : [text.substring(0, maxLength)]
  }

  // Speak text using backend TTS service
  const speakText = async () => {
    if (!pdfText || pdfText.trim() === '') {
      alert('कृपया पहले PDF से text extract करें')
      return
    }

    // Stop any ongoing speech
    stopSpeech()

    setIsSpeaking(true)
    setIsPaused(false)
    setError(null)

    try {
      const textToSpeak = pdfText.trim()
      const chunks = splitTextIntoChunks(textToSpeak)
      speechQueueRef.current = chunks
      currentChunkRef.current = 0

      // Play chunks sequentially
      await playNextChunk()
    } catch (error) {
      console.error('Speech error:', error)
      setError('Speech में त्रुटि हुई: ' + error.message)
      setIsSpeaking(false)
      setIsPaused(false)
    }
  }

  // Play next chunk in queue
  const playNextChunk = async () => {
    if (isPaused || currentChunkRef.current >= speechQueueRef.current.length) {
      if (currentChunkRef.current >= speechQueueRef.current.length) {
        setIsSpeaking(false)
        setIsPaused(false)
        speechQueueRef.current = []
        currentChunkRef.current = 0
      }
      return
    }

    const chunk = speechQueueRef.current[currentChunkRef.current]
    
    try {
      // Fetch audio from backend
      const response = await fetch(`${BACKEND_URL}/api/tts/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: chunk,
          lang: selectedLanguage
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch audio')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      // Create audio element
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      // Play audio
      audio.playbackRate = speechRate

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        currentChunkRef.current++
        playNextChunk()
      }

      audio.onerror = (error) => {
        console.error('Audio playback error:', error)
        URL.revokeObjectURL(audioUrl)
        setIsSpeaking(false)
        setIsPaused(false)
        setError('Audio playback में त्रुटि हुई')
      }

      await audio.play()
    } catch (error) {
      console.error('Error playing chunk:', error)
      setIsSpeaking(false)
      setIsPaused(false)
      setError('Speech में त्रुटि हुई: ' + error.message)
    }
  }

  // Pause speech
  const pauseSpeech = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
      setIsPaused(true)
    }
  }

  // Resume speech
  const resumeSpeech = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play()
      setIsPaused(false)
    } else if (isPaused && currentChunkRef.current < speechQueueRef.current.length) {
      playNextChunk()
    }
  }

  // Stop speech
  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsSpeaking(false)
    setIsPaused(false)
    speechQueueRef.current = []
    currentChunkRef.current = 0
  }

  const reset = () => {
    // Stop any ongoing speech
    stopSpeech()
    setPdfFile(null)
    setPdfText(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
            <h2>PDF Upload करें</h2>
            <p className="upload-description">
              अपना PDF file अपलोड करें
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
              <h2>PDF Reader</h2>
              <p className="header-subtitle">{pdfFile.name}</p>
            </div>
            <button onClick={reset} className="reset-btn">
              🔄 New PDF
            </button>
          </div>

          <div className="reader-main">
            <div className="read-button-section">
              <button 
                onClick={readPdf}
                className="read-btn"
                disabled={isReading}
              >
                {isReading ? '🔄 Reading PDF...' : '📖 Read PDF'}
              </button>
            </div>

            {error && (
              <div className="error-message">
                <p>⚠️ {error}</p>
              </div>
            )}

            {pdfText && (
              <div className="text-content-section">
                <div className="text-header">
                  <h3>Extracted Text:</h3>
                  <div className="tts-controls">
                    <div className="voice-selector">
                      <label>Language:</label>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="voice-select"
                        disabled={isSpeaking}
                      >
                        {availableLanguages.map((lang, index) => (
                          <option key={index} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="speech-params">
                      <div className="param-group">
                        <label>Speed:</label>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={speechRate}
                          onChange={(e) => {
                            const newRate = parseFloat(e.target.value)
                            setSpeechRate(newRate)
                            if (audioRef.current) {
                              audioRef.current.playbackRate = newRate
                            }
                          }}
                          disabled={isSpeaking}
                          className="param-slider"
                        />
                        <span>{speechRate.toFixed(1)}x</span>
                      </div>
                    </div>
                    
                    <div className="speech-buttons">
                      {!isSpeaking ? (
                        <button onClick={speakText} className="speak-btn">
                          🔊 Speak Text
                        </button>
                      ) : (
                        <>
                          {isPaused ? (
                            <button onClick={resumeSpeech} className="resume-btn">
                              ▶️ Resume
                            </button>
                          ) : (
                            <button onClick={pauseSpeech} className="pause-btn">
                              ⏸️ Pause
                            </button>
                          )}
                          <button onClick={stopSpeech} className="stop-btn">
                            ⏹️ Stop
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-display">
                  <pre>{pdfText}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PDFEditor

