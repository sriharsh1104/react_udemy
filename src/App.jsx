import { useState } from 'react'
import Header from './components/Header'
import VideoConverter from './components/VideoConverter'
import ImageConverter from './components/ImageConverter'
import PDFEditor from './components/PDFEditor'
import SocialDownload from './components/SocialDownload'
import ERC20Contract from './components/ERC20Contract'
import OTTLinks from './components/OTTLinks'
import Esports from './components/Esports'
import AIChat from './components/AIChat'
import TradeChart from './components/TradeChart'
import GlobalChat from './components/GlobalChat'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('video')

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  return (
    <div className="app">
      <div className="container">
        <Header activeTab={activeTab} onTabChange={handleTabChange} />
        
        <div className="tab-content">
          {activeTab === 'video' && <VideoConverter />}
          {activeTab === 'image' && <ImageConverter />}
          {activeTab === 'pdf' && <PDFEditor />}
          {activeTab === 'social' && <SocialDownload />}
          {activeTab === 'ott' && <OTTLinks />}
          {activeTab === 'esports' && <Esports />}
          {activeTab === 'ai' && <AIChat />}
          {activeTab === 'trade' && <TradeChart />}
          {activeTab === 'contract' && <ERC20Contract />}
        </div>
      </div>
      <GlobalChat />
    </div>
  )
}

export default App
