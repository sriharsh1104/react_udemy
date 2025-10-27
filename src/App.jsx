import { useState } from 'react'
import Header from './components/Header'
import VideoConverter from './components/VideoConverter'
import ImageConverter from './components/ImageConverter'
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
          {activeTab === 'video' ? (
            <VideoConverter />
          ) : (
            <ImageConverter />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
