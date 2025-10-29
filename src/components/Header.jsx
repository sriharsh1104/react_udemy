import './Header.css'

const Header = ({ activeTab, onTabChange }) => {
  return (
    <div className="header">
      <div className="header-content">
        <h1 className="header-title">Media Converter</h1>
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => onTabChange('video')}
          >
            📹 Video Converter
          </button>
          <button
            className={`tab ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => onTabChange('image')}
          >
            🖼️ Image Converter & Crop
          </button>
          <button
            className={`tab ${activeTab === 'pdf' ? 'active' : ''}`}
            onClick={() => onTabChange('pdf')}
          >
            📄 PDF Editor
          </button>
          <button
            className={`tab ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => onTabChange('social')}
          >
            🎬 Social Download
          </button>
          <button
            className={`tab ${activeTab === 'contract' ? 'active' : ''}`}
            onClick={() => onTabChange('contract')}
          >
            🔗 ERC20 Contract
          </button>
          <button
            className={`tab ${activeTab === 'stripe' ? 'active' : ''}`}
            onClick={() => onTabChange('stripe')}
          >
            💳 Stripe Payment
          </button>
        </nav>
      </div>
    </div>
  )
}

export default Header
