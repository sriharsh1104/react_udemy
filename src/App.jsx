import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
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
import MathsGames from './components/MathsGames'
import GlobalChat from './components/GlobalChat'
import InstallPrompt from './components/InstallPrompt'
import './App.css'

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Game Mode state - load from localStorage
  const [gameMode, setGameMode] = useState(() => {
    const saved = localStorage.getItem('gameMode')
    return saved === 'true'
  })
  
  // Determine active tab from location
  const getActiveTab = () => {
    if (location.pathname === '/maths-games') return 'maths'
    if (location.pathname === '/video' || location.pathname === '/') return 'video'
    if (location.pathname === '/image') return 'image'
    if (location.pathname === '/pdf') return 'pdf'
    if (location.pathname === '/social') return 'social'
    if (location.pathname === '/ott') return 'ott'
    if (location.pathname === '/esports') return 'esports'
    if (location.pathname === '/ai') return 'ai'
    if (location.pathname === '/trade') return 'trade'
    if (location.pathname === '/contract') return 'contract'
    return 'video'
  }

  const [activeTab, setActiveTab] = useState(getActiveTab())

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    // Navigate based on tab
    const routes = {
      video: '/',
      image: '/image',
      pdf: '/pdf',
      social: '/social',
      ott: '/ott',
      esports: '/esports',
      ai: '/ai',
      trade: '/trade',
      contract: '/contract',
      maths: '/maths-games'
    }
    navigate(routes[tab] || '/')
  }

  // Handle Game Mode toggle
  const handleGameModeToggle = (enabled) => {
    setGameMode(enabled)
    localStorage.setItem('gameMode', enabled.toString())
    
    if (enabled) {
      // Navigate to Maths Games when Game Mode is enabled
      navigate('/maths-games')
      setActiveTab('maths')
    }
  }

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTab())
  }, [location.pathname])

  return (
    <div className="app">
      <div className="container">
        <Header 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          gameMode={gameMode}
          onGameModeToggle={handleGameModeToggle}
        />
        
        <div className="tab-content">
          <Routes>
            <Route path="/maths-games" element={<MathsGames />} />
            <Route path="/video" element={<VideoConverter />} />
            <Route path="/image" element={<ImageConverter />} />
            <Route path="/pdf" element={<PDFEditor />} />
            <Route path="/social" element={<SocialDownload />} />
            <Route path="/ott" element={<OTTLinks />} />
            <Route path="/esports" element={<Esports />} />
            <Route path="/ai" element={<AIChat />} />
            <Route path="/trade" element={<TradeChart />} />
            <Route path="/contract" element={<ERC20Contract />} />
            <Route path="/" element={<VideoConverter />} />
          </Routes>
        </div>
      </div>
      <GlobalChat />
      <InstallPrompt />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
