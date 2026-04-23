import { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, Flame, ArrowLeft, Tag, Calendar, BarChart2, PieChart, Minus, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, ReferenceLine } from 'recharts'
import { fetchHotStocks, fetchStockDetails, fetchStockTrend } from './api'

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

  const todayString = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchHotStocks()
      setHotStocks(data.leaderboard || [])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleStockClick = async (ticker) => {
    setSelectedTicker(ticker)
    setSelectedDate(null)
    setDetailsLoading(true)
    
    const [detailsData, trendData] = await Promise.all([
      fetchStockDetails(ticker, null),
      fetchStockTrend(ticker)
    ]);
    
    setStockDetails(detailsData)
    setStockTrend(trendData?.trend || [])
    setDetailsLoading(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold text-slate-500">Loading Market Data...</div>

  // ==========================================
  // RENDER: DETAIL VIEW
  // ==========================================
  if (selectedTicker) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => setSelectedTicker(null)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mb-6">
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* 7-Day Trend Chart (Takes up 2/3 of space) */}
            <div className="lg:col-span-2 min-w-0 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" /> 7-Day Sentiment Trend ({selectedTicker})
               </h2>
               <div className="h-56 w-full min-w-0">
                 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
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

            {/* Daily Stats Card (Takes up 1/3 of space) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center border-t-4 border-t-blue-500">
               <h1 className="text-4xl font-extrabold text-slate-800 mb-2">{stockDetails?.ticker}</h1>
               <div className="text-sm text-slate-500 mb-4">
                 {stockDetails?.total_articles} articles analyzed on <br/>
                 <span className="font-bold text-slate-700">{stockDetails?.resolved_date}</span>
               </div>
               <div className="pt-4 border-t border-slate-100 mt-auto">
                 <div className="text-sm text-slate-500">Daily Sentiment Score</div>
                 <div className={`text-3xl font-bold ${stockDetails?.average_sentiment > 0 ? 'text-green-600' : stockDetails?.average_sentiment < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                   {stockDetails?.average_sentiment > 0 ? '+' : ''}{stockDetails?.average_sentiment?.toFixed(2)}
                 </div>
               </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Historical Article Intelligence</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {availableDates.map(date => {
                const isActive = stockDetails?.resolved_date === date;
                return (
                  <button 
                    key={date}
                    onClick={async () => {
                      setSelectedDate(date);
                      setDetailsLoading(true);
                      const data = await fetchStockDetails(selectedTicker, date);
                      setStockDetails(data);
                      setDetailsLoading(false);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                      isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {date === availableDates[0] ? 'Today' : date}
                  </button>
                )
              })}
            </div>
          </div>

          {detailsLoading ? (
            <div className="text-center py-20 text-xl font-bold text-slate-500 animate-pulse">Updating Data...</div>
          ) : (
            <div className="space-y-4 lg:columns-2 gap-4">
              {stockDetails?.recent_news.length === 0 && (
                 <div className="text-center text-slate-500 py-10 w-full col-span-2">No news articles scraped for this date.</div>
              )}
              {stockDetails?.recent_news.map((article, index) => {
                const isBullish = article.sentiment_score > 0;
                const isBearish = article.sentiment_score < 0;

                return (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 break-inside-avoid mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <a href={article.url} target="_blank" rel="noreferrer" className="text-lg font-bold text-slate-800 hover:text-blue-600 leading-tight">{article.title}</a>
                      <span className={`px-2 py-1 ml-2 rounded text-[10px] uppercase font-bold whitespace-nowrap ${isBullish ? 'bg-green-100 text-green-700' : isBearish ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                        {article.sentiment_label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(article.published_at).toLocaleDateString()}</span>
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
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {article.keywords.map((kw, i) => (
                          <span key={i} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-medium border border-slate-200">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: GLOBAL OVERVIEW
  // ==========================================
  
  // Calculate Market Summary Stats
  const bullishCount = hotStocks.filter(s => s.average_sentiment >= 0.05).length;
  const bearishCount = hotStocks.filter(s => s.average_sentiment <= -0.05).length;
  const neutralCount = hotStocks.length - bullishCount - bearishCount;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="mb-8 flex justify-between items-end">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Stock Intelligence Platform</h1>
            <p className="text-slate-500 mt-1 font-medium">{todayString}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        
        {/* TOP ROW: Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><PieChart className="w-6 h-6" /></div>
              <div>
                <div className="text-sm text-slate-500 font-semibold">Tracked Stocks</div>
                <div className="text-2xl font-bold text-slate-800">{hotStocks.length}</div>
              </div>
           </div>
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg"><TrendingUp className="w-6 h-6" /></div>
              <div>
                <div className="text-sm text-slate-500 font-semibold">Bullish Sentiment</div>
                <div className="text-2xl font-bold text-green-600">{bullishCount}</div>
              </div>
           </div>
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-lg"><TrendingDown className="w-6 h-6" /></div>
              <div>
                <div className="text-sm text-slate-500 font-semibold">Bearish Sentiment</div>
                <div className="text-2xl font-bold text-red-600">{bearishCount}</div>
              </div>
           </div>
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
              <div className="p-3 bg-slate-100 text-slate-600 rounded-lg"><Minus className="w-6 h-6" /></div>
              <div>
                <div className="text-sm text-slate-500 font-semibold">Neutral Sentiment</div>
                <div className="text-2xl font-bold text-slate-700">{neutralCount}</div>
              </div>
           </div>
        </div>

        {/* MIDDLE ROW: 2-Column Grid (Chart + Hotness Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Mentions Chart */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
               <BarChart2 className="w-5 h-5 text-indigo-500" />
               <h2 className="text-lg font-bold text-slate-800">News Volume</h2>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hotStocks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
                  <XAxis type="number" tick={{fontSize: 12, fill: '#64748b'}} />
                  <YAxis dataKey="ticker" type="category" tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} width={60}/>
                  <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                  <Bar dataKey="mention_count" fill="#6366f1" radius={[0, 4, 4, 0]} name="News Articles" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Right Column: Mini Watchlist Grid */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold text-slate-800">Sentiment Rank</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-grow pr-2">
              {hotStocks.map((stock) => {
                const isBullish = stock.average_sentiment > 0;
                return (
                  <div 
                    key={stock.ticker} 
                    onClick={() => handleStockClick(stock.ticker)}
                    className="p-3 border border-slate-100 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer bg-slate-50"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-lg font-extrabold text-slate-800">{stock.ticker}</span>
                      {isBullish ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="text-xs text-slate-500">
                      Score: <span className={`font-bold ${isBullish ? 'text-green-600' : 'text-red-600'}`}>{stock.average_sentiment.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

        </div>

        {/* BOTTOM ROW: Data Table */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-5 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
             <DollarSign className="w-5 h-5 text-emerald-600" />
             <h2 className="text-lg font-bold text-slate-800">Market Data Summary</h2>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-600">
               <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-xs font-bold">
                 <tr>
                   <th className="px-6 py-4">Stock Ticker</th>
                   <th className="px-6 py-4">Last Price</th>
                   <th className="px-6 py-4">Open Price</th>
                   <th className="px-6 py-4">Change (%)</th>
                   <th className="px-6 py-4">Volume</th>
                   <th className="px-6 py-4 text-right">Action</th>
                 </tr>
               </thead>
               <tbody>
                 {hotStocks.map((stock, idx) => {
                   const isPositive = stock.price_change_pct > 0;
                   return (
                     <tr key={stock.ticker} className={`border-b border-slate-100 hover:bg-slate-50 ${idx === hotStocks.length - 1 ? 'border-none' : ''}`}>
                       <td className="px-6 py-4 font-bold text-slate-800">{stock.ticker}</td>
                       <td className="px-6 py-4">${stock.current_price?.toLocaleString() || '-'}</td>
                       <td className="px-6 py-4">${stock.open_price?.toLocaleString() || '-'}</td>
                       <td className={`px-6 py-4 font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                         {isPositive ? '+' : ''}{stock.price_change_pct || 0}%
                       </td>
                       <td className="px-6 py-4">{stock.volume?.toLocaleString() || '-'}</td>
                       <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => handleStockClick(stock.ticker)}
                           className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors"
                         >
                           View News
                         </button>
                       </td>
                     </tr>
                   )
                 })}
               </tbody>
             </table>
           </div>
        </section>

      </main>
    </div>
  )
}

export default App