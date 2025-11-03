// Stock Market API Endpoints
const STOCK_APIS = {
  // Yahoo Finance Screener APIs (for top gainers/trending stocks)
  YAHOO_SCREENER_INDIA: 'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=true&lang=en-US&region=IN&scrIds=top_gainers_india&count=10',
  YAHOO_SCREENER_US: 'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=true&lang=en-US&region=US&scrIds=top_gainers&count=10',
  YAHOO_SCREENER_US_MOST_ACTIVE: 'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=true&lang=en-US&region=US&scrIds=most_actives&count=20',
  
  // Yahoo Finance Chart API base
  YAHOO_CHART_BASE: 'https://query1.finance.yahoo.com/v8/finance/chart',
  
  // Commodities Futures Symbols
  COMMODITIES: {
    GOLD: 'GC=F',
    SILVER: 'SI=F',
    US_OIL: 'CL=F',
    UK_OIL: 'BZ=F'
  },
  
  // CoinGecko API
  COINGECKO_BTC: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
  
  // NSE API (fallback)
  NSE_INDICES: 'https://www.nseindia.com/api/live-equity-stock-indices?index=NIFTY%2050',
  
  // API Headers
  HEADERS: {
    YAHOO: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    NSE: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json'
    }
  },
  
  // Timeouts
  TIMEOUT: {
    SCREENER: 8000,
    CHART: 5000,
    COINGECKO: 5000
  }
}

// Top NSE Stocks (fallback list)
const TOP_NSE_STOCKS = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 
  'BHARTIARTL.NS', 'SBIN.NS', 'BAJFINANCE.NS', 'LICI.NS', 'ITC.NS',
  'HINDUNILVR.NS', 'KOTAKBANK.NS', 'ASIANPAINT.NS', 'AXISBANK.NS'
]

// Top US Stocks (S&P 500 - fallback list)
const TOP_US_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX', 'AMD', 'INTC',
  'JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'DIS', 'UNH', 'HD', 'PYPL'
]

module.exports = {
  STOCK_APIS,
  TOP_NSE_STOCKS,
  TOP_US_STOCKS
}

