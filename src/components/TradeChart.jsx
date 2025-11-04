import { useState, useEffect } from 'react'
import { BACKEND_URL } from '../constants'
import './TradeChart.css'

const TradeChart = () => {
  const [tradingData, setTradingData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchTradingData = async () => {
    try {
      setError(null)
      const response = await fetch(`${BACKEND_URL}/api/trading/data`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setTradingData(result.data)
        setLastUpdate(result.timestamp)
        
        // Show message if some pairs are missing
        if (result.missingPairs && result.missingPairs.length > 0) {
          console.log('Missing pairs:', result.missingPairs)
        }
      } else {
        setError(result.message || 'Failed to fetch trading data')
      }
    } catch (err) {
      console.error('Error fetching trading data:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTradingData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchTradingData, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const formatChange = (change) => {
    if (change === null || change === undefined) return null
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  const getChangeColor = (change) => {
    if (change === null || change === undefined) return 'var(--text-secondary)'
    return change >= 0 ? '#10b981' : '#ef4444'
  }

  const tradingPairs = [
    { key: 'GOLD/USD', label: 'Gold vs USD', icon: '🥇' },
    { key: 'SILVER/USD', label: 'Silver vs USD', icon: '🥈' },
    { key: 'BTC', label: 'Bitcoin', icon: '₿' },
    { key: 'BTC/USD', label: 'BTC vs USD', icon: '₿' },
    { key: 'USOIL', label: 'US Oil (WTI)', icon: '🛢️' },
    { key: 'UKOIL', label: 'UK Oil (Brent)', icon: '🛢️' }
  ]

  return (
    <div className="trade-chart">
      <div className="trade-chart-header">
        <h2 className="trade-chart-title">📈 Live Trading Charts</h2>
        <div className="trade-chart-controls">
          <button 
            className="refresh-btn" 
            onClick={fetchTradingData}
            disabled={loading}
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
          {lastUpdate && (
            <span className="last-update">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="trade-error">
          <p>⚠️ {error}</p>
          <p className="trade-error-note">
            Gold, Silver, and Oil data requires API keys. Add them to <code>backend/.env</code>:
            <br />
            • <strong>ALPHA_VANTAGE_API_KEY</strong> - Get free key from <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer">alphavantage.co</a>
            <br />
            • <strong>TWELVE_DATA_API_KEY</strong> - Get free key from <a href="https://twelvedata.com/" target="_blank" rel="noopener noreferrer">twelvedata.com</a>
            <br />
            BTC works without API keys ✅
          </p>
        </div>
      )}

      {loading && tradingData && Object.keys(tradingData).length === 0 ? (
        <div className="trade-loading">
          <p>Loading trading data...</p>
        </div>
      ) : (
        <div className="trade-grid">
          {tradingPairs.map((pair) => {
            const data = tradingData[pair.key]
            if (!data) return null

            return (
              <div key={pair.key} className="trade-card">
                <div className="trade-card-header">
                  <span className="trade-icon">{pair.icon}</span>
                  <div className="trade-card-title">
                    <h3>{pair.label}</h3>
                    <span className="trade-symbol">{data.symbol}</span>
                  </div>
                </div>
                <div className="trade-card-body">
                  <div className="trade-price">
                    <span className="price-value">${formatPrice(data.price)}</span>
                    <span className="price-currency">{data.currency}</span>
                  </div>
                  {data.change !== null && (
                    <div 
                      className="trade-change"
                      style={{ color: getChangeColor(data.change) }}
                    >
                      {formatChange(data.change)}
                    </div>
                  )}
                  <div className="trade-meta">
                    <small>Updated: {new Date(data.lastUpdate).toLocaleTimeString()}</small>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && tradingData && Object.keys(tradingData).length === 0 && !error && (
        <div className="trade-empty">
          <p>No trading data available.</p>
          <p className="trade-empty-note">
            To enable full trading data, configure API keys in backend/constants.js:
            <br />
            • Alpha Vantage API key (for Gold/Silver)
            <br />
            • Twelve Data API key (for Oil)
            <br />
            • BTC works without any API key
          </p>
        </div>
      )}
    </div>
  )
}

export default TradeChart

