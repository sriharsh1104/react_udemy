import { useState, useEffect } from 'react'
import './PingDisplay.css'

const PingDisplay = () => {
  const [ping, setPing] = useState(null)
  const [status, setStatus] = useState('checking') // checking, good, medium, slow, very-slow, error
  const [networkSpeed, setNetworkSpeed] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Measure ping using image loading (no backend, no CORS issues)
  const measurePing = () => {
    return new Promise((resolve) => {
      const startTime = performance.now()
      const img = new Image()
      
      // Use multiple CDN sources for reliability
      const cdns = [
        'https://www.google.com/favicon.ico',
        'https://cdn.jsdelivr.net/favicon.ico',
        'https://www.cloudflare.com/favicon.ico'
      ]
      
      let attempts = 0
      
      const tryCDN = (index) => {
        if (index >= cdns.length) {
          resolve(null)
          return
        }
        
        img.onload = () => {
          const endTime = performance.now()
          resolve(Math.round(endTime - startTime))
        }
        
        img.onerror = () => {
          attempts++
          if (attempts < cdns.length) {
            tryCDN(index + 1)
          } else {
            resolve(null)
          }
        }
        
        // Add cache busting
        img.src = cdns[index] + '?t=' + Date.now()
        
        // Timeout after 3 seconds
        setTimeout(() => {
          if (img.complete === false) {
            attempts++
            if (attempts < cdns.length) {
              tryCDN(index + 1)
            } else {
              resolve(null)
            }
          }
        }, 3000)
      }
      
      tryCDN(0)
    })
  }

  // Get network speed from browser's Network Information API
  const getNetworkSpeed = () => {
    // Try different browser APIs
    const connection = navigator.connection || 
                      navigator.mozConnection || 
                      navigator.webkitConnection ||
                      navigator.connection
    
    if (connection) {
      const downlink = connection.downlink // Speed in Mbps
      const effectiveType = connection.effectiveType // '4g', '3g', etc
      const rtt = connection.rtt // Round trip time
      
      return {
        speed: downlink,
        type: effectiveType,
        rtt: rtt
      }
    }
    
    return null
  }

  // Measure network speed using browser APIs only
  const measureNetworkSpeed = async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true)
    }
    
    setStatus('checking')
    
    // Get network speed from browser's Network Information API
    const networkInfo = getNetworkSpeed()
    if (networkInfo && networkInfo.speed) {
      setNetworkSpeed(`${networkInfo.speed.toFixed(1)} Mbps`)
    } else {
      setNetworkSpeed(null)
    }
    
    // Measure ping using image loading (no backend needed)
    if (navigator.onLine) {
      const pingTime = await measurePing()
      
      if (pingTime !== null) {
        setPing(pingTime)
        
        // Set status based on ping
        if (pingTime < 100) {
          setStatus('good')
        } else if (pingTime < 200) {
          setStatus('good')
        } else if (pingTime < 500) {
          setStatus('medium')
        } else if (pingTime < 1000) {
          setStatus('slow')
        } else {
          setStatus('very-slow')
        }
      } else {
        // Can't measure ping, but check if online
        if (!navigator.onLine) {
          setStatus('error')
          setPing(null)
        } else {
          // Online but slow/no response
          setStatus('checking')
          setPing(null)
        }
      }
    } else {
      setStatus('error')
      setPing(null)
    }
    
    if (showRefreshing) {
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    measureNetworkSpeed(true)
  }

  useEffect(() => {
    // Measure immediately
    measureNetworkSpeed()

    // Then measure every 10 seconds
    const interval = setInterval(measureNetworkSpeed, 10000)

    // Also listen for online/offline events
    const handleOnline = () => {
      measureNetworkSpeed()
    }
    
    const handleOffline = () => {
      setStatus('error')
      setPing(null)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getStatusIcon = () => {
    switch (status) {
      case 'good':
        return '🟢'
      case 'medium':
        return '🟡'
      case 'slow':
        return '🟠'
      case 'very-slow':
        return '🔴'
      case 'error':
        return '❌'
      default:
        return '⏳'
    }
  }

  return (
    <div className="ping-display">
      <span className="ping-icon">{getStatusIcon()}</span>
      <div className="ping-info">
        {ping !== null ? (
          <>
            <span className="ping-value">{ping}ms</span>
            {networkSpeed && (
              <span className="network-speed">{networkSpeed}</span>
            )}
          </>
        ) : status === 'error' ? (
          <span className="ping-value">Offline</span>
        ) : (
          <span className="ping-value">...</span>
        )}
      </div>
      <button 
        className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
        onClick={handleRefresh}
        disabled={isRefreshing}
        title="Refresh ping"
        aria-label="Refresh network speed"
      >
        🔄
      </button>
    </div>
  )
}

export default PingDisplay

