const BASE_URL = 'http://localhost:8000/api';

export const fetchHotStocks = async () => {
    try {
        const response = await fetch(`${BASE_URL}/stocks/hot`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error("Error fetching hot stocks:", error);
        return { leaderboard: [] };
    }
};

export const fetchStockDetails = async (ticker) => {
    try {
        const response = await fetch(`${BASE_URL}/stocks/${ticker}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error(`Error fetching details for ${ticker}:`, error);
        return null;
    }
};