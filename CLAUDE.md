# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Starting the service
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### Testing the API
```bash
# Test main endpoint
curl "http://localhost:3000/api/feeds?limit=10"

# Health check
curl "http://localhost:3000/health"

# Configuration check
curl "http://localhost:3000/api/config"
```

## Architecture Overview

This is a lightweight RSS feed aggregator service designed for WordPress integration. The core architecture consists of:

**Server (`server.js`)**: Express.js application that:
- Fetches RSS feeds from sources configured in `feeds.json`
- Aggregates and sorts posts by publication date
- Provides REST API endpoints for consumption
- Runs scheduled updates every hour via node-cron
- Handles image extraction from various RSS formats (iTunes, media tags, content parsing)

**Configuration (`feeds.json`)**: External JSON file containing:
- RSS feed URLs and metadata
- Service settings (maxPostsToKeep, updateIntervalHours)
- Allows runtime configuration changes without code deployment

**WordPress Integration**: Multiple embed options available:
- Direct HTML/JS embed via `wordpress-embed.js` 
- WordPress shortcode integration
- Three layout templates: ready, detailed, and grid versions
- Client-side caching with localStorage for performance

## Key Components

### Feed Processing
- RSS parsing with custom iTunes image field support
- Smart image extraction from multiple RSS formats
- Error handling for individual feed failures
- Date normalization and validation

### API Endpoints
- `/api/feeds` - Main aggregated feed data with pagination support
- `/health` - Service status and statistics
- `/api/config` - Current RSS sources and settings

### Deployment
- Configured for Render.com via `render.yaml`
- CORS configured for specific WordPress domains
- Node.js 18+ requirement specified in package.json

## WordPress Integration Files

- `wordpress-embed.js` - Main JavaScript embed library with caching
- `wordpress-embed-*.html` - Three different layout templates
- `wordpress-integration.md` - Complete setup documentation

## Configuration Management

RSS feeds are managed through `feeds.json`, not hardcoded in the application. This allows:
- Easy feed management without deployment
- Descriptive metadata per feed
- Configurable service settings
- Fallback to hardcoded feeds if config file missing

The service maintains a maximum of 50 posts (configurable) and updates every hour automatically.