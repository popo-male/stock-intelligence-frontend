# Stock Intelligence Frontend

## Overview

Stock Intelligence Frontend is a React application for exploring market sentiment from news-driven analysis.

It provides two primary experiences:

- A global watchlist/leaderboard of hot tech stocks
- A ticker detail view with recent articles, sentiment labels, extracted bullets, and keywords

The UI is powered by a backend API currently expected at `http://localhost:8000/api`.

## Resources

- Product/functional documentation: TBD
- Design references: TBD
- Backend service repository: TBD

## Architecture Overview

### Tech Stack

- React 19
- Vite 8
- Tailwind CSS 4 (via Vite plugin)
- Lucide React (icons)
- Recharts (available for charting)

### App Flow

1. On load, the app requests hot stocks from `GET /api/stocks/hot`.
2. The dashboard renders cards for each ticker with mention count and average sentiment.
3. When a card is clicked, the app requests details from `GET /api/stocks/:ticker`.
4. The detail page renders article timeline cards with sentiment, metadata, bullets/summary, and keywords.

### Current API Contract

- Hot stocks endpoint should return:
	- `{ "leaderboard": [{ "ticker", "mention_count", "average_sentiment" }] }`
- Stock detail endpoint should return an object with at least:
	- `ticker`
	- `average_sentiment`
	- `recent_news[]` where each item can include:
		- `title`, `url`, `published_at`, `source`
		- `sentiment_score`, `sentiment_label`
		- `bullets[]`, `summary`, `keywords[]`

## Development Setup

### Prerequisites

- Node.js 20+ (recommended)
- npm 10+ (recommended)
- A running backend API on `http://localhost:8000`

### Install Dependencies

```bash
npm install
```

## Running the Application

### Start Development Server

```bash
npm run dev
```

Default local URL:

- Frontend: `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```text
frontend/
	public/
	src/
		api.js         # API calls for hot stocks and ticker details
		App.jsx        # Dashboard + detail views
		main.jsx       # React entry point
		index.css
		App.css
```

## Configuration Notes

- API base URL is currently hardcoded in `src/api.js` as `http://localhost:8000/api`.
- For multi-environment deployments, consider migrating this to a Vite env variable (for example `VITE_API_BASE_URL`).

## Troubleshooting

- Empty dashboard:
	- Confirm backend is running and accessible at `http://localhost:8000/api/stocks/hot`.
- Detail page does not load:
	- Confirm `GET /api/stocks/:ticker` returns valid JSON.
- CORS issues:
	- Ensure backend allows requests from the frontend origin (for local dev, usually `http://localhost:5173`).

## Deployment and CI/CD

- CI/CD pipeline: TBD
- Deployment target(s): TBD

If you want, this README can be expanded with environment-specific deploy steps once the target platform is finalized.
