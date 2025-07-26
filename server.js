const express = require('express');
const RSSParser = require('rss-parser');
const cron = require('node-cron');
const cors = require('cors');

const app = express();
const parser = new RSSParser();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// RSS feed URLs to aggregate
const RSS_FEEDS = [
  'https://feeds.libsyn.com/136565/rss',
  'https://cinemajaw.com/wordpress/feed/'
];

let aggregatedFeed = [];

// Function to extract image URL from RSS item
function extractImageUrl(item) {
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
      .slice(0, 50); // Keep only the 50 most recent posts

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