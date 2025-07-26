# RSS Feed Aggregator

A lightweight Node.js service that aggregates multiple RSS feeds, sorts posts by most recent, and provides a clean API for WordPress integration. Designed for free hosting on Render with automatic hourly updates.

## Features

- 📡 **Multi-source aggregation** - Combines RSS feeds from multiple sources
- ⏰ **Auto-updates** - Fetches new content every hour via cron job
- 🔄 **Smart sorting** - Orders posts by publication date (most recent first)
- 🌐 **CORS enabled** - Ready for cross-origin requests from WordPress
- 🚀 **Render ready** - Configured for free Render.com deployment
- ⚡ **Lightweight** - Minimal dependencies and fast response times

## API Endpoints

### `GET /api/feeds`

Returns aggregated RSS feed data sorted by most recent posts.

**Query Parameters:**
- `limit` (optional) - Number of posts to return (default: 20, max: 50)

**Example Request:**
```bash
curl "http://localhost:3000/api/feeds?limit=10"
```

**Response Format:**
```json
{
  "success": true,
  "count": 10,
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "feeds": [
    {
      "title": "Article Title",
      "link": "https://example.com/article",
      "pubDate": "2024-01-15T09:45:00.000Z",
      "description": "Article summary or excerpt...",
      "source": "Source Publication Name",
      "guid": "unique-article-identifier"
    }
  ]
}
```

### `GET /health`

Health check endpoint that returns service status and feed statistics.

**Example Request:**
```bash
curl "http://localhost:3000/health"
```

**Response Format:**
```json
{
  "status": "healthy",
  "feedCount": 47,
  "lastUpdated": "2024-01-15T09:45:00.000Z"
}
```

## Local Development

### Prerequisites
- Node.js 18+ 
- npm

### Setup
```bash
# Install dependencies
npm install

# Start development server (with auto-restart)
npm run dev

# Or start production server
npm start
```

The server will run on `http://localhost:3000` by default.

## Configuration

### Adding RSS Sources
Edit the `RSS_FEEDS` array in `server.js`:

```javascript
const RSS_FEEDS = [
  'https://feeds.feedburner.com/TechCrunch',
  'https://rss.cnn.com/rss/edition.rss',
  'https://feeds.bbci.co.uk/news/rss.xml',
  'https://your-custom-feed.com/rss'
];
```

### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (production/development)

## Deployment

This service is configured for Render.com deployment via `render.yaml`. Simply:

1. Push to GitHub
2. Connect repository to Render
3. Deploy automatically

## WordPress Integration

See `wordpress-integration.md` for detailed setup instructions and embed code.

## Data Flow

1. **Startup**: Fetches all RSS feeds immediately
2. **Scheduled Updates**: Cron job runs every hour (`0 * * * *`)
3. **Processing**: Combines feeds, sorts by date, keeps 50 most recent
4. **API Serving**: Provides data via `/api/feeds` endpoint
5. **WordPress**: Fetches and displays via JavaScript embed

## Error Handling

- Individual feed failures don't crash the service
- Malformed dates are filtered out
- CORS errors are handled gracefully
- Service continues running even if some feeds are unavailable