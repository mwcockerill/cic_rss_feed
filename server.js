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
  'https://feeds.feedburner.com/TechCrunch',
  'https://feeds.bbci.co.uk/news/rss.xml'
];

let aggregatedFeed = [];

// Function to fetch and parse RSS feeds
async function fetchRSSFeeds() {
  try {
    console.log('Fetching RSS feeds...');
    const feedPromises = RSS_FEEDS.map(async (feedUrl) => {
      try {
        const feed = await parser.parseURL(feedUrl);
        return feed.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: new Date(item.pubDate || item.isoDate),
          description: item.contentSnippet || item.content || item.description,
          source: feed.title,
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