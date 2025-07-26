# RSS Feed Aggregator

A lightweight Node.js service that aggregates multiple RSS feeds, sorts posts by most recent, and provides a clean API for WordPress integration. Designed for free hosting on Render with automatic hourly updates.

## Features

- 📡 **Multi-source aggregation** - Combines RSS feeds from multiple sources
- ⏰ **Auto-updates** - Fetches new content every hour via cron job
- 🔄 **Smart sorting** - Orders posts by publication date (most recent first)
- 🖼️ **Image extraction** - Automatically extracts post thumbnails and source logos
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
      "sourceLogoUrl": "https://example.com/logo.png",
      "imageUrl": "https://example.com/article-image.jpg",
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

### `GET /api/config`

Returns the current RSS feed configuration and settings.

**Example Request:**
```bash
curl "http://localhost:3000/api/config"
```

**Response Format:**
```json
{
  "success": true,
  "feeds": [
    {
      "url": "https://feeds.libsyn.com/136565/rss",
      "name": "Mindframe(s)",
      "description": "Film and social commentary discussions"
    }
  ],
  "settings": {
    "maxPostsToKeep": 50,
    "updateIntervalHours": 1
  },
  "totalConfiguredFeeds": 2
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

### Managing RSS Sources
RSS feeds are configured in the external `feeds.json` file:

```json
{
  "feeds": [
    {
      "url": "https://feeds.libsyn.com/136565/rss",
      "name": "Mindframe(s)",
      "description": "Film and social commentary discussions"
    },
    {
      "url": "https://cinemajaw.com/wordpress/feed/",
      "name": "CinemaJaw",
      "description": "The Greatest Movies Podcast Ever"
    }
  ],
  "settings": {
    "maxPostsToKeep": 50,
    "updateIntervalHours": 1
  }
}
```

**Benefits of External Configuration:**
- Easy to modify feeds without code changes
- Descriptive metadata for each feed
- Configurable settings (max posts, update frequency)
- Fallback to hardcoded feeds if config file is missing

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