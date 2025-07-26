// RSS Feed Aggregator WordPress Embed
// Replace 'YOUR_RENDER_URL' with your actual Render deployment URL
const RSS_API_URL = 'YOUR_RENDER_URL/api/feeds';

// Configuration options
const CONFIG = {
  containerId: 'rss-feed-container',
  maxPosts: 10,
  showDate: true,
  showSource: true,
  refreshInterval: 60000, // 1 minute
  dateFormat: 'short' // 'short', 'long', or 'relative'
};

// Main RSS Feed Display Class
class RSSFeedDisplay {
  constructor(config = {}) {
    this.config = { ...CONFIG, ...config };
    this.container = null;
    this.feeds = [];
    this.lastUpdate = null;
    
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.container = document.getElementById(this.config.containerId);
    if (!this.container) {
      console.error(`RSS Feed container with ID '${this.config.containerId}' not found`);
      return;
    }

    // Add CSS styles
    this.addStyles();
    
    // Initial load
    this.loadFeeds();
    
    // Set up refresh interval
    setInterval(() => this.loadFeeds(), this.config.refreshInterval);
  }

  async loadFeeds() {
    try {
      const response = await fetch(`${RSS_API_URL}?limit=${this.config.maxPosts}`);
      const data = await response.json();
      
      if (data.success) {
        this.feeds = data.feeds;
        this.lastUpdate = new Date(data.lastUpdated);
        this.render();
      } else {
        throw new Error('API returned error');
      }
    } catch (error) {
      console.error('Error loading RSS feeds:', error);
      this.renderError();
    }
  }

  render() {
    if (!this.container) return;

    const html = `
      <div class="rss-feed-wrapper">
        <div class="rss-feed-header">
          <h3>Latest News</h3>
          ${this.lastUpdate ? `<small>Updated: ${this.formatDate(this.lastUpdate)}</small>` : ''}
        </div>
        <div class="rss-feed-list">
          ${this.feeds.map(feed => this.renderFeedItem(feed)).join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  renderFeedItem(feed) {
    const date = new Date(feed.pubDate);
    return `
      <article class="rss-feed-item">
        <h4 class="rss-feed-title">
          <a href="${feed.link}" target="_blank" rel="noopener noreferrer">
            ${feed.title}
          </a>
        </h4>
        <p class="rss-feed-description">${this.truncateText(feed.description, 150)}</p>
        <div class="rss-feed-meta">
          ${this.config.showSource ? `<span class="rss-feed-source">${feed.source}</span>` : ''}
          ${this.config.showDate ? `<span class="rss-feed-date">${this.formatDate(date)}</span>` : ''}
        </div>
      </article>
    `;
  }

  renderError() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="rss-feed-wrapper">
        <div class="rss-feed-error">
          <p>Unable to load RSS feeds at this time. Please try again later.</p>
        </div>
      </div>
    `;
  }

  formatDate(date) {
    switch (this.config.dateFormat) {
      case 'long':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'relative':
        return this.getRelativeTime(date);
      default:
        return date.toLocaleDateString();
    }
  }

  getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substr(0, maxLength) + '...' : text;
  }

  addStyles() {
    if (document.getElementById('rss-feed-styles')) return;

    const styles = `
      <style id="rss-feed-styles">
        .rss-feed-wrapper {
          max-width: 100%;
          margin: 20px 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .rss-feed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #eee;
        }
        
        .rss-feed-header h3 {
          margin: 0;
          color: #333;
        }
        
        .rss-feed-header small {
          color: #666;
          font-size: 12px;
        }
        
        .rss-feed-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .rss-feed-item {
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 8px;
          background: #fff;
          transition: box-shadow 0.2s ease;
        }
        
        .rss-feed-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .rss-feed-title {
          margin: 0 0 10px 0;
          font-size: 16px;
          line-height: 1.4;
        }
        
        .rss-feed-title a {
          color: #2c5282;
          text-decoration: none;
        }
        
        .rss-feed-title a:hover {
          text-decoration: underline;
        }
        
        .rss-feed-description {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .rss-feed-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #999;
        }
        
        .rss-feed-source {
          font-weight: 600;
          color: #4a5568;
        }
        
        .rss-feed-error {
          padding: 20px;
          text-align: center;
          color: #666;
          background: #f7fafc;
          border-radius: 8px;
        }
        
        @media (max-width: 768px) {
          .rss-feed-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
          
          .rss-feed-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// Initialize the RSS feed display
document.addEventListener('DOMContentLoaded', function() {
  new RSSFeedDisplay();
});