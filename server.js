const express = require('express');
const RSSParser = require('rss-parser');
const cron = require('node-cron');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const parser = new RSSParser({
  customFields: {
    item: ['itunes:image']
  }
});
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['https://mindframesfilm.com', 'http://localhost:3000', 'https://cic-rss-feed.onrender.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Load RSS feeds from external configuration
let feedConfig;
try {
  const configPath = path.join(__dirname, 'feeds.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  feedConfig = JSON.parse(configData);
} catch (error) {
  console.error('Error loading feeds.json:', error.message);
  // Fallback to hardcoded feeds if config file is missing
  feedConfig = {
    feeds: [
      {
        url: 'https://feeds.libsyn.com/136565/rss',
        name: 'Mindframe(s)',
        description: 'Film and social commentary discussions'
      },
      {
        url: 'https://cinemajaw.com/wordpress/feed/',
        name: 'CinemaJaw',
        description: 'The Greatest Movies Podcast Ever'
      }
    ],
    settings: {
      maxPostsToKeep: 50,
      updateIntervalHours: 1
    }
  };
}

const RSS_FEEDS = feedConfig.feeds.map(feed => feed.url);
const MAX_POSTS = feedConfig.settings.maxPostsToKeep;

let aggregatedFeed = [];

// Function to extract image URL from RSS item
function extractImageUrl(item) {
  // Try iTunes image first (common in podcast feeds)
  if (item.itunes && item.itunes.image) {
    return item.itunes.image;
  }
  
  if (item['itunes:image'] && item['itunes:image']['$'] && item['itunes:image']['$'].href) {
    return item['itunes:image']['$'].href;
  }
  
  if (item['itunes:image'] && typeof item['itunes:image'] === 'string') {
    return item['itunes:image'];
  }
  
  // Try different RSS image fields in order of preference
  if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
    return item.enclosure.url;
  }
  
  if (item['media:thumbnail'] && item['media:thumbnail']['$'] && item['media:thumbnail']['$'].url) {
    return item['media:thumbnail']['$'].url;
  }
  
  if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url && 
      item['media:content']['$'].type && item['media:content']['$'].type.startsWith('image/')) {
    return item['media:content']['$'].url;
  }
  
  if (item.image && item.image.url) {
    return item.image.url;
  }
  
  if (item.image && typeof item.image === 'string') {
    return item.image;
  }
  
  // Try to extract image from content/description using regex
  const content = item.content || item.description || '';
  const imgMatch = content.match(/<img[^>]+src=['"](https?:\/\/[^'"]+)['"]/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  
  return null;
}

// Function to fetch and parse RSS feeds
async function fetchRSSFeeds() {
  try {
    console.log('Fetching RSS feeds...');
    const feedPromises = RSS_FEEDS.map(async (feedUrl) => {
      try {
        const feed = await parser.parseURL(feedUrl);
        const sourceLogoUrl = feed.image && feed.image.url ? feed.image.url : null;
        
        return feed.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: new Date(item.pubDate || item.isoDate),
          description: item.contentSnippet || item.content || item.description,
          source: feed.title,
          sourceLogoUrl: sourceLogoUrl,
          imageUrl: extractImageUrl(item),
          guid: item.guid || item.link
        }));
      } catch (error) {
        console.error(`Error fetching feed ${feedUrl}:`, error.message);
        return [];
      }
    });

    const allFeeds = await Promise.all(feedPromises);
    
    // Flatten and sort by most recent
    aggregatedFeed = allFeeds
      .flat()
      .filter(item => item.pubDate && !isNaN(item.pubDate))
      .sort((a, b) => b.pubDate - a.pubDate)
      .slice(0, MAX_POSTS); // Keep only the most recent posts as configured

    console.log(`Successfully aggregated ${aggregatedFeed.length} posts`);
  } catch (error) {
    console.error('Error in fetchRSSFeeds:', error);
  }
}

// API endpoint to get aggregated feeds
app.get('/api/feeds', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const limitedFeed = aggregatedFeed.slice(0, limit);
  
  res.json({
    success: true,
    count: limitedFeed.length,
    lastUpdated: new Date().toISOString(),
    feeds: limitedFeed
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    feedCount: aggregatedFeed.length,
    lastUpdated: aggregatedFeed.length > 0 ? aggregatedFeed[0].pubDate : null
  });
});

// Configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    feeds: feedConfig.feeds,
    settings: feedConfig.settings,
    totalConfiguredFeeds: feedConfig.feeds.length
  });
});

// Schedule feed updates every hour
cron.schedule('0 * * * *', () => {
  console.log('Running scheduled feed update...');
  fetchRSSFeeds();
});

// Initial feed fetch on startup
fetchRSSFeeds();

app.listen(PORT, () => {
  console.log(`RSS Feed Aggregator running on port ${PORT}`);
});