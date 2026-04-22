import { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, Flame, ArrowLeft, Tag, Calendar } from 'lucide-react'
import { fetchHotStocks, fetchStockDetails } from './api'

function App() {
  const [hotStocks, setHotStocks] = useState([])
  const [loading, setLoading] = useState(true)
  
  // New states for the Detail View
  const [selectedTicker, setSelectedTicker] = useState(null)
  const [stockDetails, setStockDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Load Global Overview on mount
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchHotStocks()
      setHotStocks(data.leaderboard || [])
      setLoading(false)
    }
    loadData()
  }, [])

  // Handle clicking a stock card
  const handleStockClick = async (ticker) => {
    setSelectedTicker(ticker)
    setDetailsLoading(true)
    const data = await fetchStockDetails(ticker)
    setStockDetails(data)
    setDetailsLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl font-bold text-slate-500">Loading Market Data...</div>
  }

  // ==========================================
  // RENDER: DETAIL VIEW
  // ==========================================
  if (selectedTicker) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button & Header */}
          <button 
            onClick={() => setSelectedTicker(null)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </button>

          {detailsLoading || !stockDetails ? (
            <div className="text-center py-20 text-xl font-bold text-slate-500 animate-pulse">
              Analyzing Intelligence for {selectedTicker}...
            </div>
          ) : (
            <>
              {/* Ticker Title & Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 flex justify-between items-center">
                <h1 className="text-4xl font-extrabold text-slate-800">{stockDetails.ticker}</h1>
                <div className="text-right">
                  <div className="text-sm text-slate-500">Average Sentiment</div>
                  <div className={`text-2xl font-bold ${stockDetails.average_sentiment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stockDetails.average_sentiment > 0 ? '+' : ''}{stockDetails.average_sentiment.toFixed(2)}
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" /> Latest News & Analysis
              </h2>

              {/* News Timeline */}
              <div className="space-y-6">
                {stockDetails.recent_news.map((article, index) => {
                  const isBullish = article.sentiment_score > 0;
                  const isBearish = article.sentiment_score < 0;

                  return (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      {/* Article Header */}
                      <div className="flex justify-between items-start mb-3">
                        <a href={article.url} target="_blank" rel="noreferrer" className="text-lg font-bold text-slate-800 hover:text-blue-600">
                          {article.title}
                        </a>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isBullish ? 'bg-green-100 text-green-700' : 
                          isBearish ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {article.sentiment_label}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(article.published_at).toLocaleString()}</span>
                        <span>Source: {article.source}</span>
                      </div>

                      {/* LLM Bullet Points */}
                      {article.bullets && article.bullets.length > 0 ? (
                        <ul className="mb-4 space-y-2">
                          {article.bullets.map((bullet, i) => (
                            <li key={i} className="flex gap-2 text-sm text-slate-700">
                              <span className="text-blue-500 font-bold">•</span> {bullet}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-600 mb-4">{article.summary}</p>
                      )}

                      {/* LLM Keywords */}
                      {article.keywords && article.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50 border-dashed">
                          <Tag className="w-4 h-4 text-slate-400 mt-0.5" />
                          {article.keywords.map((kw, i) => (
                            <span key={i} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: GLOBAL OVERVIEW (Leaderboard)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="mb-8 flex items-center gap-3">
        <Activity className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-slate-800">Stock Intelligence Platform</h1>
      </header>

      <main className="max-w-6xl mx-auto">
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-slate-800">Tech Stock Watchlist</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hotStocks.map((stock) => {
              const isBullish = stock.average_sentiment > 0;
              
              return (
                <div 
                  key={stock.ticker} 
                  onClick={() => handleStockClick(stock.ticker)} 
                  className="p-4 border border-slate-100 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer bg-slate-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-slate-800">{stock.ticker}</span>
                    {isBullish ? <TrendingUp className="w-6 h-6 text-green-500" /> : <TrendingDown className="w-6 h-6 text-red-500" />}
                  </div>
                  
                  <div className="text-sm text-slate-500 mb-1">
                    News Mentions: <span className="font-bold text-slate-700">{stock.mention_count}</span>
                  </div>
                  
                  <div className="text-sm text-slate-500">
                    Sentiment: 
                    <span className={`ml-1 font-bold ${isBullish ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.average_sentiment.toFixed(2)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App