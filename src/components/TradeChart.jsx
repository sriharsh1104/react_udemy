import { useState, useEffect } from 'react'
import { BACKEND_URL } from '../constants'
import { io } from 'socket.io-client'
import './TradeChart.css'

function TradeChart() {
  const [indiaStocks, setIndiaStocks] = useState([])
  const [americanStocks, setAmericanStocks] = useState([])
  const [commodities, setCommodities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [socket, setSocket] = useState(null)

  const fetchStockData = async () => {
    try {
      setError(null)

      // Fetch all data in parallel
      const [indiaRes, americanRes, commoditiesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/stocks/india`).catch(() => ({ ok: false })),
        fetch(`${BACKEND_URL}/api/stocks/american`).catch(() => ({ ok: false })),
        fetch(`${BACKEND_URL}/api/commodities`).catch(() => ({ ok: false }))
      ])

      // India stocks
      if (indiaRes.ok) {
        const indiaData = await indiaRes.json()
        if (indiaData.success && indiaData.stocks) {
          setIndiaStocks(indiaData.stocks.filter(s => s.price > 0))
        }
      }

      // American stocks
      if (americanRes.ok) {
        const americanData = await americanRes.json()
        if (americanData.success && americanData.stocks) {
          setAmericanStocks(americanData.stocks.filter(s => s.price > 0))
        }
      }

      // Commodities
      if (commoditiesRes.ok) {
        const commoditiesData = await commoditiesRes.json()
        if (commoditiesData.success && commoditiesData.commodities) {
          setCommodities(commoditiesData.commodities.filter(c => c.price > 0))
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching stock data:', err)
      setError('Failed to load stock data. Please try again later.')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial HTTP fetch
    fetchStockData()

    // Setup WebSocket for real-time updates
    const socketConnection = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    })

    socketConnection.on('connect', () => {
      console.log('Connected to stock data socket')
      socketConnection.emit('subscribeStockUpdates')
    })

    socketConnection.on('stockDataUpdate', (data) => {
      if (data && data.india) {
        setIndiaStocks(data.india.filter(s => s.price > 0))
      }
      if (data && data.american) {
        setAmericanStocks(data.american.filter(s => s.price > 0))
      }
      if (data && data.commodities) {
        setCommodities(data.commodities.filter(c => c.price > 0))
      }
      setLoading(false)
    })

    socketConnection.on('disconnect', () => {
      console.log('Disconnected from stock data socket')
    })

    setSocket(socketConnection)

    // Fallback HTTP polling (every 30 seconds) in case WebSocket fails
    const interval = setInterval(() => {
      fetchStockData()
    }, 30000)

    return () => {
      socketConnection.disconnect()
      clearInterval(interval)
    }
  }, [])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const formatChange = (change) => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}`
  }

  const StockCard = ({ stock, isAmerican = false }) => {
    const isPositive = stock.change >= 0
    const currencySymbol = isAmerican ? '$' : '₹'
    return (
      <div className="trade-card stock-card">
        <div className="trade-card-header">
          <span className="trade-symbol">{stock.symbol}</span>
          <span className={`trade-change ${isPositive ? 'positive' : 'negative'}`}>
            {formatChange(stock.change)} ({formatChange(stock.changePercent)}%)
          </span>
        </div>
        <div className="trade-price">{currencySymbol}{formatPrice(stock.price)}</div>
      </div>
    )
  }

  const CommodityCard = ({ commodity }) => {
    const isPositive = commodity.change >= 0
    return (
      <div className="trade-card commodity-card">
        <div className="trade-card-header">
          <div>
            <span className="trade-name">{commodity.name}</span>
            <span className="trade-symbol-small">{commodity.symbol}</span>
          </div>
          <span className={`trade-change ${isPositive ? 'positive' : 'negative'}`}>
            {formatChange(commodity.change)} ({formatChange(commodity.changePercent)}%)
          </span>
        </div>
        <div className="trade-price">
          {commodity.symbol.includes('BTC') || commodity.symbol.includes('XAU') || commodity.symbol.includes('XAG') 
            ? `$${formatPrice(commodity.price)}`
            : `$${formatPrice(commodity.price)}`
          }
        </div>
      </div>
    )
  }

  if (loading && indiaStocks.length === 0 && americanStocks.length === 0 && commodities.length === 0) {
    return (
      <div className="trade-chart">
        <h2 className="trade-chart-title">Trade Chart</h2>
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.7)' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading market data...</div>
          <div style={{ fontSize: '14px' }}>Fetching real-time prices</div>
        </div>
      </div>
    )
  }

  return (
    <div className="trade-chart">
      <h2 className="trade-chart-title">Trade Chart {loading && <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Updating...</span>}</h2>
      {error && (
        <div style={{ 
          padding: '12px 16px', 
          background: 'rgba(239, 68, 68, 0.15)', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#ef4444',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* India Stocks Section */}
      <section className="trade-section">
        <h3 className="trade-section-title">🇮🇳 India - Top 10 Trending Stocks</h3>
        {indiaStocks.length > 0 ? (
          <div className="trade-grid">
            {indiaStocks.map((stock, index) => (
              <StockCard key={`india-${stock.symbol}-${index}`} stock={stock} isAmerican={false} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            No data available. Market may be closed or data is loading...
          </div>
        )}
      </section>

      {/* American Stocks Section */}
      <section className="trade-section">
        <h3 className="trade-section-title">🇺🇸 American - Top 10 Trending Stocks</h3>
        {americanStocks.length > 0 ? (
          <div className="trade-grid">
            {americanStocks.map((stock, index) => (
              <StockCard key={`us-${stock.symbol}-${index}`} stock={stock} isAmerican={true} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            No data available. Market may be closed or data is loading...
          </div>
        )}
      </section>

      {/* Commodities Section */}
      <section className="trade-section">
        <h3 className="trade-section-title">💎 Commodities</h3>
        {commodities.length > 0 ? (
          <div className="trade-grid commodity-grid">
            {commodities.map((commodity, index) => (
              <CommodityCard key={`commodity-${commodity.symbol}-${index}`} commodity={commodity} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            No data available. Please wait while data loads...
          </div>
        )}
      </section>
    </div>
  )
}

export default TradeChart

