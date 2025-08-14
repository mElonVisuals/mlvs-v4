/*!
 * MLVS Dashboard V5.0 - Ultimate Bot Dashboard JavaScript
 * Advanced Real-Time Analytics & Modern Interactions
 * Built with performance and user experience in mind
 */

console.log('🚀 MLVS Dashboard V5.0 Loading...');

class MLVSDashboard {
  constructor() {
    this.config = {
      updateIntervals: {
        status: 5000,     // 5 seconds
        metrics: 10000,   // 10 seconds
        activity: 15000,  // 15 seconds
        charts: 30000     // 30 seconds
      },
      animations: {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      api: {
        base: '/api',
        endpoints: {
          status: '/status',
          metrics: '/metrics',
          commands: '/commands',
          activity: '/activity',
          system: '/system'
        }
      }
    };
    
    this.state = {
      isOnline: false,
      lastUpdate: null,
      updateTimers: {},
      chartData: {
        latency: [],
        memory: [],
        cpu: [],
        users: [],
        guilds: []
      }
    };

    this.init();
  }

  // ==================== INITIALIZATION ====================
  async init() {
    console.log('🔧 Initializing Dashboard Systems...');
    
    try {
      this.setupDOM();
      this.setupEventListeners();
      this.setupAnimations();
      
      // Initial data load
      await this.loadInitialData();
      
      // Start update cycles
      this.startUpdateCycles();
      
      // Setup mobile responsive features
      this.setupMobileFeatures();
      
      console.log('✅ Dashboard initialization complete!');
    } catch (error) {
      console.error('❌ Dashboard initialization failed:', error);
      this.showError('Failed to initialize dashboard');
    }
  }

  setupDOM() {
    this.elements = {
      // Navigation
      sidebar: document.querySelector('.sidebar'),
      mobileToggle: document.querySelector('.mobile-toggle'),
      
      // Status indicators
      statusDot: document.querySelector('.status-dot'),
      statusText: document.querySelector('.status-text'),
      
      // Metrics
      botStatus: document.querySelector('#bot-status'),
      guildCount: document.querySelector('#guild-count'),
      userCount: document.querySelector('#user-count'),
      latency: document.querySelector('#latency'),
      uptime: document.querySelector('#uptime'),
      memory: document.querySelector('#memory-usage'),
      cpu: document.querySelector('#cpu-usage'),
      
      // Charts
      latencyChart: document.querySelector('#latency-chart'),
      metricsChart: document.querySelector('#metrics-chart'),
      activityChart: document.querySelector('#activity-chart'),
      
      // Activity feed
      activityFeed: document.querySelector('#activity-feed'),
      
      // Loading states
      loadingSpinners: document.querySelectorAll('.loading-spinner')
    };
  }

  setupEventListeners() {
    // Mobile menu toggle
    if (this.elements.mobileToggle) {
      this.elements.mobileToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
    }

    // Refresh buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-refresh]')) {
        e.preventDefault();
        const type = e.target.dataset.refresh;
        this.refreshData(type);
      }
    });

    // Window resize handler
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboard.bind(this));

    // Visibility change (pause updates when tab is hidden)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  setupAnimations() {
    // Intersection Observer for cards
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.animationPlayState = 'running';
            }
          });
        },
        { threshold: 0.1 }
      );

      document.querySelectorAll('.card').forEach(card => {
        observer.observe(card);
      });
    }
  }

  // ==================== DATA MANAGEMENT ====================
  async loadInitialData() {
    console.log('📊 Loading initial dashboard data...');
    
    const loadPromises = [
      this.updateStatus(),
      this.updateMetrics(),
      this.updateActivity(),
      this.updateSystemInfo()
    ];

    await Promise.allSettled(loadPromises);
  }

  async fetchAPI(endpoint) {
    try {
      const response = await fetch(this.config.api.base + endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return null;
    }
  }

  async updateStatus() {
    console.log('📡 Updating bot status...');
    
    try {
      const data = await this.fetchAPI(this.config.api.endpoints.status);
      
      if (data) {
        this.state.isOnline = data.online || false;
        this.state.lastUpdate = new Date();

        // Update UI elements
        this.updateStatusIndicator(this.state.isOnline);
        this.updateElement('#bot-status', this.state.isOnline ? 'Online' : 'Offline');
        this.updateElement('#guild-count', data.guilds || 0);
        this.updateElement('#user-count', data.users || 0);
        this.updateElement('#latency', data.latency ? `${data.latency}ms` : 'N/A');
        
        // Update charts
        if (data.latency) {
          this.addChartData('latency', data.latency);
          this.updateChart('latency');
        }

        // Add to chart data
        this.addChartData('guilds', data.guilds || 0);
        this.addChartData('users', data.users || 0);
      }
    } catch (error) {
      console.error('Status update failed:', error);
      this.state.isOnline = false;
      this.updateStatusIndicator(false);
    }
  }

  async updateMetrics() {
    console.log('📈 Updating system metrics...');
    
    try {
      const data = await this.fetchAPI(this.config.api.endpoints.metrics);
      
      if (data) {
        // Memory usage
        if (data.memory) {
          const memoryMB = Math.round(data.memory.used / 1024 / 1024);
          this.updateElement('#memory-usage', `${memoryMB}MB`);
          this.addChartData('memory', memoryMB);
        }

        // CPU usage
        if (data.cpu) {
          this.updateElement('#cpu-usage', `${data.cpu.toFixed(1)}%`);
          this.addChartData('cpu', data.cpu);
        }

        // Update metrics chart
        this.updateChart('metrics');
      }
    } catch (error) {
      console.error('Metrics update failed:', error);
    }
  }

  async updateActivity() {
    console.log('🎯 Updating activity feed...');
    
    try {
      const data = await this.fetchAPI(this.config.api.endpoints.activity);
      
      if (data && data.activities) {
        this.renderActivityFeed(data.activities);
      }
    } catch (error) {
      console.error('Activity update failed:', error);
    }
  }

  async updateSystemInfo() {
    console.log('⚙️ Updating system information...');
    
    try {
      const data = await this.fetchAPI(this.config.api.endpoints.system);
      
      if (data) {
        // Uptime
        if (data.uptime) {
          const uptimeFormatted = this.formatUptime(data.uptime);
          this.updateElement('#uptime', uptimeFormatted);
        }

        // Additional system metrics
        if (data.version) {
          this.updateElement('#bot-version', data.version);
        }
      }
    } catch (error) {
      console.error('System info update failed:', error);
    }
  }

  // ==================== UI UPDATES ====================
  updateElement(selector, value, animate = true) {
    const element = document.querySelector(selector);
    if (!element) return;

    if (animate) {
      element.classList.add('updating');
      setTimeout(() => {
        element.textContent = value;
        element.classList.remove('updating');
        element.classList.add('updated');
        setTimeout(() => element.classList.remove('updated'), 1000);
      }, 150);
    } else {
      element.textContent = value;
    }
  }

  updateStatusIndicator(isOnline) {
    if (this.elements.statusDot) {
      this.elements.statusDot.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
    }
    
    if (this.elements.statusText) {
      this.elements.statusText.textContent = isOnline ? 'Bot Online' : 'Bot Offline';
    }

    // Update favicon
    this.updateFavicon(isOnline);
  }

  updateFavicon(isOnline) {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      // You could switch between different favicon images here
      // For now, we'll just update the title to reflect status
      document.title = `MLVS Dashboard - ${isOnline ? 'Online' : 'Offline'}`;
    }
  }

  renderActivityFeed(activities) {
    if (!this.elements.activityFeed) return;

    const fragment = document.createDocumentFragment();

    activities.slice(-10).reverse().forEach((activity, index) => {
      const item = this.createActivityItem(activity, index);
      fragment.appendChild(item);
    });

    // Replace content with animation
    this.elements.activityFeed.style.opacity = '0';
    setTimeout(() => {
      this.elements.activityFeed.innerHTML = '';
      this.elements.activityFeed.appendChild(fragment);
      this.elements.activityFeed.style.opacity = '1';
    }, 150);
  }

  createActivityItem(activity, index) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.style.animationDelay = `${index * 0.05}s`;

    const avatar = document.createElement('div');
    avatar.className = 'activity-avatar';
    avatar.textContent = activity.type?.charAt(0) || '?';

    const content = document.createElement('div');
    content.className = 'activity-content';

    const text = document.createElement('div');
    text.className = 'activity-text';
    text.textContent = activity.message || 'Unknown activity';

    const time = document.createElement('div');
    time.className = 'activity-time';
    time.textContent = this.formatTime(activity.timestamp);

    content.appendChild(text);
    content.appendChild(time);
    item.appendChild(avatar);
    item.appendChild(content);

    return item;
  }

  // ==================== CHART MANAGEMENT ====================
  addChartData(type, value) {
    if (!this.state.chartData[type]) {
      this.state.chartData[type] = [];
    }

    this.state.chartData[type].push({
      value: value,
      timestamp: Date.now()
    });

    // Keep only last 50 data points
    if (this.state.chartData[type].length > 50) {
      this.state.chartData[type] = this.state.chartData[type].slice(-50);
    }
  }

  updateChart(type) {
    const chartElement = document.querySelector(`#${type}-chart`);
    if (!chartElement) return;

    const data = this.state.chartData[type] || [];
    if (data.length < 2) return;

    this.renderSparkline(chartElement, data);
  }

  renderSparkline(element, data) {
    if (!data || data.length < 2) return;

    const svg = element.querySelector('svg') || this.createSVG();
    element.innerHTML = '';
    element.appendChild(svg);

    const width = 200;
    const height = 60;
    const padding = 4;

    // Create path
    const values = data.map(d => typeof d === 'object' ? d.value : d);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const points = values.map((value, index) => {
      const x = padding + (index / (values.length - 1)) * (width - 2 * padding);
      const y = padding + (1 - (value - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });

    const pathD = `M${points.join(' L')}`;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('stroke', 'var(--neon-primary)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.style.filter = 'drop-shadow(0 0 6px var(--neon-primary))';

    svg.appendChild(path);

    // Animate path
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    path.animate([
      { strokeDashoffset: length },
      { strokeDashoffset: 0 }
    ], {
      duration: 1000,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
  }

  createSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 60');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.width = '100%';
    svg.style.height = '100%';
    return svg;
  }

  // ==================== UPDATE CYCLES ====================
  startUpdateCycles() {
    console.log('⏰ Starting update cycles...');

    // Clear existing timers
    Object.values(this.state.updateTimers).forEach(timer => clearInterval(timer));

    // Status updates
    this.state.updateTimers.status = setInterval(
      () => this.updateStatus(),
      this.config.updateIntervals.status
    );

    // Metrics updates
    this.state.updateTimers.metrics = setInterval(
      () => this.updateMetrics(),
      this.config.updateIntervals.metrics
    );

    // Activity updates
    this.state.updateTimers.activity = setInterval(
      () => this.updateActivity(),
      this.config.updateIntervals.activity
    );
  }

  stopUpdateCycles() {
    console.log('⏸️ Stopping update cycles...');
    Object.values(this.state.updateTimers).forEach(timer => clearInterval(timer));
    this.state.updateTimers = {};
  }

  // ==================== MOBILE & RESPONSIVE ====================
  setupMobileFeatures() {
    // Touch gestures for mobile
    if ('ontouchstart' in window) {
      this.setupTouchGestures();
    }

    // Handle initial screen size
    this.handleResize();
  }

  setupTouchGestures() {
    let startX = 0;
    let startY = 0;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    document.addEventListener('touchmove', (e) => {
      if (!startX || !startY) return;

      const deltaX = e.touches[0].clientX - startX;
      const deltaY = e.touches[0].clientY - startY;

      // Horizontal swipe to toggle sidebar
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0 && startX < 50) {
          // Swipe right from left edge
          this.openMobileMenu();
        } else if (deltaX < 0 && this.elements.sidebar?.classList.contains('open')) {
          // Swipe left when sidebar is open
          this.closeMobileMenu();
        }
      }
    });
  }

  toggleMobileMenu() {
    if (this.elements.sidebar) {
      this.elements.sidebar.classList.toggle('open');
    }
  }

  openMobileMenu() {
    if (this.elements.sidebar) {
      this.elements.sidebar.classList.add('open');
    }
  }

  closeMobileMenu() {
    if (this.elements.sidebar) {
      this.elements.sidebar.classList.remove('open');
    }
  }

  handleResize() {
    // Auto-close mobile menu on desktop
    if (window.innerWidth > 768) {
      this.closeMobileMenu();
    }

    // Update chart dimensions
    this.redrawCharts();
  }

  redrawCharts() {
    ['latency', 'metrics', 'activity'].forEach(type => {
      this.updateChart(type);
    });
  }

  // ==================== EVENT HANDLERS ====================
  handleKeyboard(e) {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'r':
          e.preventDefault();
          this.refreshAllData();
          break;
        case 'm':
          e.preventDefault();
          this.toggleMobileMenu();
          break;
      }
    }

    // ESC to close mobile menu
    if (e.key === 'Escape') {
      this.closeMobileMenu();
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      console.log('📱 Tab hidden - pausing updates');
      this.stopUpdateCycles();
    } else {
      console.log('👁️ Tab visible - resuming updates');
      this.startUpdateCycles();
      // Immediate refresh when coming back
      this.refreshAllData();
    }
  }

  // ==================== UTILITY METHODS ====================
  async refreshData(type) {
    console.log(`🔄 Manual refresh: ${type}`);
    
    const refreshMap = {
      status: () => this.updateStatus(),
      metrics: () => this.updateMetrics(),
      activity: () => this.updateActivity(),
      system: () => this.updateSystemInfo(),
      all: () => this.refreshAllData()
    };

    if (refreshMap[type]) {
      await refreshMap[type]();
      this.showNotification(`${type} refreshed`, 'success');
    }
  }

  async refreshAllData() {
    console.log('🔄 Refreshing all data...');
    await this.loadInitialData();
    this.showNotification('Dashboard refreshed', 'success');
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      color: white;
      font-size: 14px;
      z-index: 9999;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }

  showError(message) {
    console.error('❌', message);
    this.showNotification(message, 'error');
  }

  // ==================== PUBLIC API ====================
  // Methods exposed globally for console access and debugging
  getState() {
    return { ...this.state };
  }

  getConfig() {
    return { ...this.config };
  }

  async forceRefresh() {
    await this.refreshAllData();
  }

  toggleDebugMode() {
    document.body.classList.toggle('debug-mode');
    console.log('Debug mode:', document.body.classList.contains('debug-mode') ? 'ON' : 'OFF');
  }
}

// ==================== INITIALIZATION ====================
// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}

function initDashboard() {
  // Create global instance
  window.dashboard = new MLVSDashboard();
  
  // Expose methods for console access
  window.refreshDashboard = () => window.dashboard.forceRefresh();
  window.toggleDebug = () => window.dashboard.toggleDebugMode();
  
  console.log('🎉 MLVS Dashboard V5.0 Ready!');
  console.log('💡 Available commands: refreshDashboard(), toggleDebug()');
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MLVSDashboard;
}
