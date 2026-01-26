import './AZMP3Download.css'

const AZMP3Download = () => {
  const handleRedirect = () => {
    window.open('https://azmp3.cc/pro1/', '_blank', 'noopener,noreferrer')
  }

  const handleVocalRemoverRedirect = () => {
    window.open('https://vocalremover.org/', '_blank', 'noopener,noreferrer')
  }

  const handleRemusicRedirect = () => {
    window.open('https://remusic.ai/ai-vocal-remover', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="azmp3-download-container">
      <div className="azmp3-section">
        <h3>🎵 AZMP3 - YouTube Downloader</h3>
        <p className="description">
          Download YouTube videos and audio in high quality formats
        </p>

        <div className="redirect-button-container">
          <button 
            onClick={handleRedirect}
            className="redirect-btn"
          >
            🚀 AZMP3 Par Jao (Go to AZMP3)
          </button>
        </div>

        <div className="info-box">
          <h4>ℹ️ Kaise Use Karein (How to Use):</h4>
          <ol>
            <li>Button par click karein aur AZMP3 site par jao</li>
            <li>YouTube video ka URL copy karein</li>
            <li>URL ko search box mein paste karein</li>
            <li>Audio ya Video format select karein</li>
            <li>Download button par click karein</li>
          </ol>
          
          <div className="vocal-remover-suggestion">
            <h5 className="suggestion-title">🎤 To separate music or vocal use below site:</h5>
            <ol start="6">
              <li>Downloaded audio file ko 
                <button 
                  onClick={handleVocalRemoverRedirect}
                  className="inline-link-btn"
                >
                  VocalRemover.org
                </button>
                ya 
                <button 
                  onClick={handleRemusicRedirect}
                  className="inline-link-btn"
                >
                  Remusic.ai
                </button>
                par upload karein
              </li>
              <li>Process button par click karein</li>
              <li>Vocals remove (karaoke) ya Music remove (sirf vocals) select karein</li>
              <li>Processed audio download karein</li>
            </ol>
            <div className="alternative-sites">
              <button 
                onClick={handleVocalRemoverRedirect}
                className="suggestion-btn"
              >
                🎤 Vocal Remover Par Jao
              </button>
              <p className="alternative-text">Agar yeh fail ho to try karein:</p>
              <button 
                onClick={handleRemusicRedirect}
                className="suggestion-btn alternative-btn"
              >
                🎵 Remusic.ai Par Jao (Alternative)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AZMP3Download
