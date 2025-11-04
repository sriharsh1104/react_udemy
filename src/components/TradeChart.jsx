import { useState, useEffect } from 'react'
import { BACKEND_URL } from '../constants'
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets'
import './TradeChart.css'

const TradeChart = () => {
  const [tradingData, setTradingData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [selectedChart, setSelectedChart] = useState(null)

  // TradingView symbol mapping
  const getTradingViewSymbol = (pairKey) => {
    const symbolMap = {
      'BTC': 'BINANCE:BTCUSDT',
      'BTC/USD': 'COINBASE:BTC-USD',
      'GOLD/USD': 'OANDA:XAUUSD',
      'SILVER/USD': 'OANDA:XAGUSD',
      'USOIL': 'NYMEX:CL',
      'UKOIL': 'NYMEX:BZ'
    }
    return symbolMap[pairKey] || 'BINANCE:BTCUSDT'
  }

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

  const closeChart = () => {
    setSelectedChart(null)
  }

  useEffect(() => {
    fetchTradingData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchTradingData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Cleanup TradingView widgets when component unmounts or chart changes
  useEffect(() => {
    return () => {
      if (!selectedChart) {
        // Clean up old TradingView containers when modal closes
        setTimeout(() => {
          const containers = document.querySelectorAll('[id^="tradingview_"]')
          containers.forEach(container => {
            if (container && container.parentNode) {
              container.innerHTML = ''
            }
          })
        }, 500)
      }
    }
  }, [selectedChart])

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

  const handleCardClick = (pairKey) => {
    setSelectedChart({
      symbol: getTradingViewSymbol(pairKey),
      pairKey: pairKey
    })
  }

  const closeChart = () => {
    setSelectedChart(null)
    // Clear TradingView container on close
    setTimeout(() => {
      const containers = document.querySelectorAll('[id^="tradingview_chart_"]')
      containers.forEach(container => {
        if (container) {
          container.innerHTML = ''
        }
      })
    }, 100)
  }

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
            const hasData = !!data

            return (
              <div 
                key={pair.key} 
                className={`trade-card ${hasData ? '' : 'no-data'}`}
                onClick={() => handleCardClick(pair.key)}
                style={{ cursor: 'pointer' }}
                title={hasData ? 'Click to view chart' : 'Click to view chart (Price data not available)'}
              >
                <div className="trade-card-header">
                  <span className="trade-icon">{pair.icon}</span>
                  <div className="trade-card-title">
                    <h3>{pair.label}</h3>
                    <span className="trade-symbol">{pair.key}</span>
                  </div>
                </div>
                {hasData ? (
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
                ) : (
                  <div className="trade-card-body">
                    <div className="trade-price">
                      <span className="price-value" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Price data not available
                      </span>
                    </div>
                    <div className="trade-meta">
                      <small>Click to view chart</small>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Chart Modal */}
      {selectedChart && (
        <div className="chart-modal-overlay" onClick={closeChart}>
          <div className="chart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chart-modal-header">
              <h3>
                {tradingPairs.find(p => p.key === selectedChart.pairKey)?.label || selectedChart.pairKey}
              </h3>
              <button className="chart-close-btn" onClick={closeChart}>✕</button>
            </div>
            <div className="chart-container">
              <AdvancedRealTimeChart
                key={`chart_${selectedChart.pairKey.replace('/', '_')}`}
                symbol={selectedChart.symbol}
                theme="dark"
                autosize={true}
                style="1"
                locale="en"
                toolbar_bg="#1a1a1a"
                enable_publishing={false}
                hide_top_toolbar={false}
                hide_legend={false}
                save_image={false}
                container_id={`tradingview_${selectedChart.pairKey.replace('/', '_').replace(' ', '_')}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradeChart

