import { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, Flame, ArrowLeft, Tag, Calendar, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, ReferenceLine } from 'recharts'
import { fetchHotStocks, fetchStockDetails, fetchStockTrend } from './api'

// Helper to get last 7 days in YYYY-MM-DD format
const getLast7Days = () => {
  return Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
};

function App() {
  const [hotStocks, setHotStocks] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [selectedTicker, setSelectedTicker] = useState(null)
  const [stockDetails, setStockDetails] = useState(null)
  const [stockTrend, setStockTrend] = useState([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  
  const availableDates = getLast7Days();
  const [selectedDate, setSelectedDate] = useState(null);

  // Current Date String for Header
  const todayString = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchHotStocks()
      setHotStocks(data.leaderboard || [])
      setLoading(false)
    }
    loadData()
  }, [])

  // Load details and trend when a stock OR date is clicked
  useEffect(() => {
    if (selectedTicker) {
      const loadDetails = async () => {
        setDetailsLoading(true)
        const [detailsData, trendData] = await Promise.all([
          fetchStockDetails(selectedTicker, selectedDate),
          fetchStockTrend(selectedTicker)
        ]);
        setStockDetails(detailsData)
        setStockTrend(trendData.trend || [])
        setDetailsLoading(false)
      }
      loadDetails()
    }
  }, [selectedTicker, selectedDate])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold text-slate-500">Loading Market Data...</div>

  // ==========================================
  // RENDER: DETAIL VIEW
  // ==========================================
  if (selectedTicker) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setSelectedTicker(null)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mb-6">
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </button>

          {/* 7-Day Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
             <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> 7-Day Sentiment Trend ({selectedTicker})
             </h2>
             <div className="h-48 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={stockTrend}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} />
                   <YAxis domain={[-1, 1]} tick={{fontSize: 12, fill: '#64748b'}} />
                   <RechartsTooltip />
                   <ReferenceLine y={0} stroke="#94a3b8" />
                   <Line type="monotone" dataKey="average_sentiment" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* Date Selector */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Select Date</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {availableDates.map(date => {
                // Highlight the button based on what the backend actually resolved!
                const isActive = stockDetails?.resolved_date === date;
                
                return (
                  <button 
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                      isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {date === availableDates[0] ? 'Today' : date}
                  </button>
                )
              })}
            </div>
            
            {/* Helpful indicator if the backend had to look back further than 7 days */}
            {stockDetails && !availableDates.includes(stockDetails.resolved_date) && (
              <div className="mt-2 text-sm text-amber-600 font-medium bg-amber-50 p-2 rounded-md border border-amber-200">
                ⚠️ Showing latest available data from {stockDetails.resolved_date}
              </div>
            )}
          </div>

          {detailsLoading || !stockDetails ? (
            <div className="text-center py-20 text-xl font-bold text-slate-500 animate-pulse">Updating Data...</div>
          ) : (
            <>
              {/* Daily Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 flex justify-between items-center border-l-4 border-l-blue-500">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-800">{stockDetails.ticker}</h1>
                  <p className="text-slate-500 text-sm mt-1">
                    {stockDetails.total_articles} articles processed on <span className="font-bold text-slate-700">{stockDetails.resolved_date}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">Daily Sentiment</div>
                  <div className={`text-2xl font-bold ${stockDetails.average_sentiment > 0 ? 'text-green-600' : stockDetails.average_sentiment < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                    {stockDetails.average_sentiment > 0 ? '+' : ''}{stockDetails.average_sentiment.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* News List */}
              <div className="space-y-6">
                {stockDetails.recent_news.length === 0 && (
                   <div className="text-center text-slate-500 py-10">No news articles scraped for this date.</div>
                )}
                {stockDetails.recent_news.map((article, index) => {
                  const isBullish = article.sentiment_score > 0;
                  const isBearish = article.sentiment_score < 0;

                  return (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <div className="flex justify-between items-start mb-3">
                        <a href={article.url} target="_blank" rel="noreferrer" className="text-lg font-bold text-slate-800 hover:text-blue-600">{article.title}</a>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isBullish ? 'bg-green-100 text-green-700' : isBearish ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                          {article.sentiment_label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(article.published_at).toLocaleString()}</span>
                        <span>Source: {article.source}</span>
                      </div>
                      {article.bullets && article.bullets.length > 0 ? (
                        <ul className="mb-4 space-y-2">
                          {article.bullets.map((bullet, i) => (
                            <li key={i} className="flex gap-2 text-sm text-slate-700"><span className="text-blue-500 font-bold">•</span> {bullet}</li>
                          ))}
                        </ul>
                      ) : <p className="text-sm text-slate-600 mb-4">{article.summary}</p>}
                      {article.keywords && article.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50 border-dashed">
                          <Tag className="w-4 h-4 text-slate-400 mt-0.5" />
                          {article.keywords.map((kw, i) => (
                            <span key={i} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">{kw}</span>
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
  // RENDER: GLOBAL OVERVIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="mb-8 flex justify-between items-end">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Stock Intelligence Platform</h1>
            <p className="text-slate-500 mt-1 font-medium">{todayString} • Current Trend Window: 3 Days</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        
        {/* Mentions Bar Chart */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
             <BarChart2 className="w-6 h-6 text-indigo-500" />
             <h2 className="text-xl font-bold text-slate-800">Tech Stock Stocks</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hotStocks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                <XAxis dataKey="ticker" tick={{fontSize: 12, fill: '#64748b'}}/>
                <YAxis tick={{fontSize: 12, fill: '#64748b'}}/>
                <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="mention_count" fill="#6366f1" radius={[4, 4, 0, 0]} name="News Articles" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Hot Stocks Grid */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-slate-800">Hottest Stocks (Sentiment x Volume)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hotStocks.map((stock) => {
              const isBullish = stock.average_sentiment > 0;
              return (
                <div 
                  key={stock.ticker} 
                  onClick={() => { setSelectedTicker(stock.ticker); setSelectedDate(null); }}
                  className="p-4 border border-slate-100 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer bg-slate-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-slate-800">{stock.ticker}</span>
                    {isBullish ? <TrendingUp className="w-6 h-6 text-green-500" /> : <TrendingDown className="w-6 h-6 text-red-500" />}
                  </div>
                  <div className="text-sm text-slate-500 mb-1">News Mentions: <span className="font-bold text-slate-700">{stock.mention_count}</span></div>
                  <div className="text-sm text-slate-500">Sentiment: <span className={`ml-1 font-bold ${isBullish ? 'text-green-600' : 'text-red-600'}`}>{stock.average_sentiment.toFixed(2)}</span></div>
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