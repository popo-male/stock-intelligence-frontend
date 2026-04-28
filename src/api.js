const BASE_URL = import.meta.env.API_BASE_URL.replace(/\/$/, "");

export const fetchHotStocks = async (date = null) => {
    try {
        const url = date ? `${BASE_URL}/stocks/hot?target_date=${date}` : `${BASE_URL}/stocks/hot`;
        const response = await fetch(url);
        return await response.json();
    } catch (e) { 
        return { leaderboard: [] }; 
    }
};

// Added date parameter
export const fetchStockDetails = async (ticker, date = null) => {
    try {
        const url = date ? `${BASE_URL}/stocks/${ticker}?target_date=${date}` : `${BASE_URL}/stocks/${ticker}`;
        const response = await fetch(url);
        return await response.json();
    } catch (e) { return null; }
};

// New trend fetcher
export const fetchStockTrend = async (ticker) => {
    try {
        const response = await fetch(`${BASE_URL}/stocks/${ticker}/trend`);
        return await response.json();
    } catch (e) { return { trend: [] }; }
};