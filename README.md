# Polymarket Trader Search

A professional web application to search and analyze Polymarket traders, view their trading statistics, P&L history, and live positions.

## Features

- 🔍 **Search Traders** - Find Polymarket traders by username
- 📊 **Detailed Analytics** - View comprehensive trading metrics including:
  - Win Rate & Total Wins/Losses
  - Total Trading Volume
  - Realized & Unrealized P&L
  - Biggest Win
  - Live Position Values
- 📈 **Interactive P&L Graph** - Dynamic chart showing profit/loss history over time
- 💼 **Live Positions** - View active market positions
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, TypeScript
- **Database**: Prisma with SQLite
- **APIs**: Polymarket API, Gamma API

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd poly
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Generate Prisma client:
```bash
npm run db:generate
```

5. Push database schema:
```bash
npm run db:push
```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Production Build

Build for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Project Structure

```
poly/
├── src/
│   ├── client/          # Frontend React application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── ...
│   │   └── index.html
│   ├── server/          # Backend Express API
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.ts
│   └── shared/          # Shared types and utilities
├── prisma/              # Database schema
└── ...
```

## API Endpoints

- `GET /api/profiles/search?q=<username>` - Search for traders
- `GET /api/profiles/:wallet/stats` - Get trader statistics
- `GET /api/markets` - Get market data

## Deployment

### Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will automatically detect the configuration
4. Deploy!

## Credits

Made by **daybot** • Follow on X: [@hashvalue](https://x.com/hashvalue)

## License

ISC
