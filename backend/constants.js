// Trading API Configuration
// Free APIs for live trading data
// 
// Environment Variables Required:
// - ALPHA_VANTAGE_API_KEY: Get from https://www.alphavantage.co/support/#api-key
// - TWELVE_DATA_API_KEY: Get from https://twelvedata.com/
//
// Add these to your .env file:
// ALPHA_VANTAGE_API_KEY=your_key_here
// TWELVE_DATA_API_KEY=your_key_here

module.exports = {
  // CoinGecko API (free, no API key needed for basic use)
  // Rate limit: 50 calls/minute
  COINGECKO_API_URL: 'https://api.coingecko.com/api/v3',
  
  // ExchangeRate-API (free tier: 1500 requests/month)
  // No API key needed for free tier
  EXCHANGERATE_API_URL: 'https://api.exchangerate-api.com/v4',
  
  // Alpha Vantage API (free tier: 5 API calls per minute, 500 calls per day)
  // Get free API key from: https://www.alphavantage.co/support/#api-key
  // Set in environment: ALPHA_VANTAGE_API_KEY
  ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY || '',
  ALPHA_VANTAGE_API_URL: 'https://www.alphavantage.co/query',
  
  // Twelve Data API (free tier: 800 requests/day)
  // Get free API key from: https://twelvedata.com/
  // Set in environment: TWELVE_DATA_API_KEY
  TWELVE_DATA_API_KEY: process.env.TWELVE_DATA_API_KEY || '',
  TWELVE_DATA_API_URL: 'https://api.twelvedata.com',
  
  // Trading symbols configuration
  TRADING_SYMBOLS: {
    BTC: 'bitcoin',
    'GOLD/USD': 'XAUUSD', // Gold vs USD
    'SILVER/USD': 'XAGUSD', // Silver vs USD
    'BTC/USD': 'BTCUSD',
    USOIL: 'CL', // Crude Oil WTI
    UKOIL: 'BZ' // Brent Crude Oil
  },
  
  // Refresh interval in milliseconds (30 seconds)
  REFRESH_INTERVAL: 30000
}

