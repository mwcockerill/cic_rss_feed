# WordPress Integration Guide

## Quick Setup

1. **Deploy to Render:**
   - Push this code to GitHub
   - Connect your GitHub repo to Render
   - Render will automatically use the `render.yaml` configuration
   - Note your deployed URL (e.g., `https://your-app-name.onrender.com`)

2. **WordPress Integration:**

### Option 1: Direct HTML/JS Embed (Recommended)
Add this HTML to your WordPress page/post:

```html
<div id="rss-feed-container"></div>
<script>
// Replace with your actual Render URL
const RSS_API_URL = 'https://your-app-name.onrender.com/api/feeds';
</script>
<script src="https://your-app-name.onrender.com/wordpress-embed.js"></script>
```

### Option 2: Custom WordPress Plugin/Theme Function
Add to your theme's `functions.php`:

```php
function enqueue_rss_feed_script() {
    wp_enqueue_script(
        'rss-feed-aggregator',
        'https://your-app-name.onrender.com/wordpress-embed.js',
        array(),
        '1.0.0',
        true
    );
    
    wp_localize_script('rss-feed-aggregator', 'rssConfig', array(
        'apiUrl' => 'https://your-app-name.onrender.com/api/feeds'
    ));
}
add_action('wp_enqueue_scripts', 'enqueue_rss_feed_script');

function display_rss_feed_shortcode($atts) {
    $atts = shortcode_atts(array(
        'max_posts' => 10,
        'show_date' => true,
        'show_source' => true
    ), $atts);
    
    return '<div id="rss-feed-container" data-max-posts="' . $atts['max_posts'] . '" data-show-date="' . $atts['show_date'] . '" data-show-source="' . $atts['show_source'] . '"></div>';
}
add_shortcode('rss_feed', 'display_rss_feed_shortcode');
```

Then use the shortcode: `[rss_feed max_posts="15" show_date="true"]`

## Configuration Options

You can customize the display by modifying the `CONFIG` object in `wordpress-embed.js`:

```javascript
const CONFIG = {
  containerId: 'rss-feed-container',    // HTML element ID
  maxPosts: 10,                         // Number of posts to display
  showDate: true,                       // Show publication date
  showSource: true,                     // Show feed source
  showImages: true,                     // Show post thumbnails
  refreshInterval: 60000,               // Refresh every 60 seconds
  dateFormat: 'short'                   // 'short', 'long', or 'relative'
};
```

## Customizing RSS Sources

Edit the `RSS_FEEDS` array in `server.js` to add your preferred RSS sources:

```javascript
const RSS_FEEDS = [
  'https://your-feed-1.com/rss',
  'https://your-feed-2.com/feed',
  'https://your-feed-3.com/rss.xml'
];
```

## API Endpoints

- `GET /api/feeds?limit=20` - Get aggregated feeds (default limit: 20)
- `GET /health` - Service health check

## Features

- ✅ Automatic feed aggregation from multiple sources
- ✅ Sorting by most recent posts
- ✅ Hourly automatic updates via cron job
- ✅ Image extraction from RSS feeds (post thumbnails and source logos)
- ✅ CORS enabled for WordPress integration
- ✅ Responsive design with mobile-optimized image layout
- ✅ Error handling and fallbacks
- ✅ Free Render hosting
- ✅ Easy WordPress integration