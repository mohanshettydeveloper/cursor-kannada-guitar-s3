// Blog Application JavaScript

class BlogApp {
    constructor() {
        this.posts = this.loadPosts();
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderPosts();
        this.updateFooterStats();
        this.loadTheme();
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchPosts();
                }
            });
        }
        
        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link, .dropdown-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });
        
        // Dropdown menu functionality
        this.setupDropdownMenu();
    }


    isValidYouTubeUrl(url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
        return youtubeRegex.test(url);
    }

    extractYouTubeVideoId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    addPost(postData) {
        this.posts.unshift(postData);
        this.savePosts();
        this.renderPosts();
        this.updateFooterStats();
        
        // Generate HTML file for the new post
        generatePostHTMLFile(postData);
        
        this.showSuccessMessage('🎉 Post added successfully! Thank you for sharing your guitar journey with the Kannada community! Your post has been added to the blog and a new HTML page has been opened in a new tab. ಧನ್ಯವಾದಗಳು!');
    }

    deletePost(postId) {
        if (confirm('Are you sure you want to delete this post?')) {
            this.posts = this.posts.filter(post => post.id !== postId);
            this.savePosts();
            this.renderPosts();
            this.updateFooterStats();
            this.showSuccessMessage('Post deleted successfully!');
        }
    }

    renderPosts() {
        const container = document.getElementById('postsContainer');
        
        if (this.posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No posts yet</h3>
                    <p>Create your first post using the form above!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.posts.map(post => this.createPostHTML(post)).join('');
        
        // Bind delete events
        this.bindDeleteEvents();
    }

    createPostHTML(post) {
        const date = new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const videoHTML = post.youtubeUrl ? this.createVideoHTML(post.youtubeUrl) : '';
        const tagsHTML = post.tags ? this.createTagsHTML(post.tags) : '';
        
        // Create link to individual post HTML file if it exists
        const postLink = post.htmlFile ? `<a href="${post.htmlFile}" class="post-link" target="_blank">📄 View Full Post</a>` : '';

        return `
            <article class="post-card" data-id="${post.id}">
                <div class="post-header">
                    <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
                    <span class="post-date">${date}</span>
                </div>
                
                ${post.content ? `<div class="post-content">${this.escapeHtml(post.content)}</div>` : ''}
                
                ${videoHTML}
                
                ${tagsHTML}
                
                <div class="post-actions">
                    ${postLink}
                </div>
            </article>
        `;
    }

    createVideoHTML(youtubeUrl) {
        const videoId = this.extractYouTubeVideoId(youtubeUrl);
        if (!videoId) return '';

        return `
            <div class="post-video">
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>
        `;
    }

    createTagsHTML(tagsString) {
        const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
        if (tags.length === 0) return '';

        const tagsHTML = tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('');
        return `<div class="post-tags">${tagsHTML}</div>`;
    }

    bindDeleteEvents() {
        // Events are bound via onclick in the HTML for simplicity
        // In a larger app, you might want to use event delegation
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccessMessage(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    // Local Storage Methods
    savePosts() {
        try {
            localStorage.setItem('blogPosts', JSON.stringify(this.posts));
        } catch (error) {
            console.error('Error saving posts to localStorage:', error);
            this.showSuccessMessage('Error saving post. Please try again.');
        }
    }

    loadPosts() {
        try {
            const saved = localStorage.getItem('blogPosts');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading posts from localStorage:', error);
            return [];
        }
    }

    // Utility method to clear all posts (for testing)
    clearAllPosts() {
        if (confirm('Are you sure you want to delete ALL posts? This cannot be undone.')) {
            this.posts = [];
            this.savePosts();
            this.renderPosts();
            this.showSuccessMessage('All posts cleared!');
        }
    }

    // Method to export posts as JSON
    exportPosts() {
        const dataStr = JSON.stringify(this.posts, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'blog-posts.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    // Method to import posts from JSON
    importPosts(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedPosts = JSON.parse(e.target.result);
                if (Array.isArray(importedPosts)) {
                    this.posts = importedPosts;
                    this.savePosts();
                    this.renderPosts();
                    this.updateFooterStats();
                    this.showSuccessMessage('Posts imported successfully!');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                alert('Error importing posts. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }

    // Search functionality
    handleSearch(query) {
        if (!query.trim()) {
            this.renderPosts();
            return;
        }
        
        const filteredPosts = this.posts.filter(post => 
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            post.content.toLowerCase().includes(query.toLowerCase()) ||
            (post.tags && post.tags.toLowerCase().includes(query.toLowerCase()))
        );
        
        this.renderFilteredPosts(filteredPosts);
    }

    searchPosts() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            this.handleSearch(searchInput.value);
        }
    }

    renderFilteredPosts(posts) {
        const container = document.getElementById('postsContainer');
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No posts found</h3>
                    <p>Try adjusting your search terms or create a new post!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = posts.map(post => this.createPostHTML(post)).join('');
        this.bindDeleteEvents();
    }

    // Navigation handling
    handleNavClick(e) {
        const target = e.target.getAttribute('href');
        
        // If it's an external link (like about.html), don't prevent default
        if (target && !target.startsWith('#')) {
            return; // Let the browser handle the navigation
        }
        
        e.preventDefault();
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Handle navigation
        switch(target) {
            case '#home':
                this.renderPosts();
                document.getElementById('searchInput').value = '';
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case '#contact':
                window.location.href = 'contact.html';
                break;
        }
    }

    // Setup dropdown menu functionality
    setupDropdownMenu() {
        const dropdown = document.querySelector('.nav-dropdown');
        const dropdownMenu = document.querySelector('.dropdown-menu');
        
        if (dropdown && dropdownMenu) {
            let timeout;
            
            // Show dropdown on mouse enter
            dropdown.addEventListener('mouseenter', () => {
                clearTimeout(timeout);
                dropdownMenu.style.display = 'block';
            });
            
            // Hide dropdown on mouse leave with delay
            dropdown.addEventListener('mouseleave', () => {
                timeout = setTimeout(() => {
                    dropdownMenu.style.display = 'none';
                }, 200);
            });
            
            // Keep dropdown open when hovering over menu
            dropdownMenu.addEventListener('mouseenter', () => {
                clearTimeout(timeout);
            });
            
            // Hide dropdown when leaving menu
            dropdownMenu.addEventListener('mouseleave', () => {
                timeout = setTimeout(() => {
                    dropdownMenu.style.display = 'none';
                }, 200);
            });
            
            // Toggle dropdown on click (for mobile)
            const dropdownToggle = dropdown.querySelector('.nav-link');
            dropdownToggle.addEventListener('click', (e) => {
                e.preventDefault();
                const isVisible = dropdownMenu.style.display === 'block';
                dropdownMenu.style.display = isVisible ? 'none' : 'block';
                dropdown.classList.toggle('active', !isVisible);
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdownMenu.style.display = 'none';
                    dropdown.classList.remove('active');
                }
            });
        }
    }

    // Theme toggle functionality
    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        
        if (isDark) {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            document.querySelector('.theme-toggle').textContent = '🌙';
        } else {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            document.querySelector('.theme-toggle').textContent = '☀️';
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const themeToggle = document.querySelector('.theme-toggle');
        
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.textContent = '☀️';
        } else {
            themeToggle.textContent = '🌙';
        }
    }

    // Footer stats
    updateFooterStats() {
        const totalPosts = this.posts.length;
        const totalVideos = this.posts.filter(post => post.youtubeUrl).length;
        const allTags = new Set();
        
        this.posts.forEach(post => {
            if (post.tags) {
                post.tags.split(',').forEach(tag => {
                    allTags.add(tag.trim());
                });
            }
        });
        
        const totalTags = allTags.size;
        
        // Update DOM elements
        const postsElement = document.getElementById('totalPosts');
        const videosElement = document.getElementById('totalVideos');
        const tagsElement = document.getElementById('totalTags');
        
        if (postsElement) postsElement.textContent = totalPosts;
        if (videosElement) videosElement.textContent = totalVideos;
        if (tagsElement) tagsElement.textContent = totalTags;
    }

    // Modal functions
    showAboutModal() {
        const aboutContent = `
Kannada Guitar - About Us

I wanted one place for all Kannadigas to share their guitar talent. After searching, didn't find one. So, I have created this website where Kannadigas can share their talent and contribute to grow Kannada. Thanks for helping me out on this pursuit.

You can visit the Guitar TABS above. Become a member through Free Registration, show your talent at kannadaguitar.com

Please share the word with your friends and other guitar enthusiasts.

ಧನ್ಯವಾದಗಳು , ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ

Kannada Guitar – kannadaguitar.com

---
Features of this platform:
• Create posts with text and YouTube videos
• Search functionality
• Dark/Light theme toggle
• Local storage
• Responsive design

Built with ❤️ for the Kannada guitar community!
        `;
        alert(aboutContent);
    }

    showContactModal() {
        alert('Contact Information\n\n📧 Email: your-email@example.com\n🐦 Twitter: @yourusername\n📘 Facebook: Your Page\n📷 Instagram: @yourusername\n\nFeel free to reach out with any questions or suggestions!');
    }
}

// Initialize the blog app when the page loads
let blogApp;
document.addEventListener('DOMContentLoaded', () => {
    blogApp = new BlogApp();
    
    // Make blogApp available globally
    window.blogApp = blogApp;
    
    // Load post navigation from localStorage
    loadPostNavigation();
    
    // Add some sample posts if none exist
    if (blogApp.posts.length === 0) {
        const samplePosts = [
            {
                id: 'sample1',
                title: 'Welcome to Kannada Guitar!',
                content: 'Welcome to Kannada Guitar! ಸ್ವಾಗತ! 🎸\n\nThis is your first blog post where you can share your guitar journey, music videos, and musical thoughts with fellow Kannadigas.\n\nYou can add text content and YouTube videos to document your musical progress and share your passion for guitar with the Kannada community.\n\nJoin us in growing Kannada music and guitar culture. Try adding a new post using the form above!',
                youtubeUrl: '',
                tags: 'welcome, introduction, guitar, music, kannada, community',
                date: new Date().toISOString()
            }
        ];
        
        blogApp.posts = samplePosts;
        blogApp.savePosts();
        blogApp.renderPosts();
    }
});


// Secure Post Modal functionality
let secureCaptchaCode = '';
let secureFormSubmissionCount = 0;
let secureLastSubmissionTime = 0;
const SECURE_RATE_LIMIT_WINDOW = 300000; // 5 minutes
const SECURE_MAX_SUBMISSIONS_PER_WINDOW = 2;

// YouTube URL validation for secure form
function isValidSecureYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
}

// Generate HTML file for individual posts
function generatePostHTMLFile(postData) {
    // Create a safe filename from the post title
    const safeTitle = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
    
    const filename = `post-${postData.id}-${safeTitle}.html`;
    
    // Format the date
    const postDate = new Date(postData.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Generate video HTML if YouTube URL exists
    let videoHTML = '';
    if (postData.youtubeUrl) {
        const videoId = extractYouTubeVideoId(postData.youtubeUrl);
        if (videoId) {
            videoHTML = `
                <div class="post-video">
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}" 
                        title="YouTube video player" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            `;
        }
    }
    
    // Generate tags HTML if tags exist
    let tagsHTML = '';
    if (postData.tags) {
        const tags = postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        if (tags.length > 0) {
            const tagsHTMLContent = tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
            tagsHTML = `<div class="post-tags">${tagsHTMLContent}</div>`;
        }
    }
    
    // Read the template file content (we'll create this as a string for now)
    const templateContent = getPostTemplate();
    
    // Replace placeholders with actual content
    const htmlContent = templateContent
        .replace(/\{\{POST_TITLE\}\}/g, escapeHtml(postData.title))
        .replace(/\{\{POST_DATE\}\}/g, postDate)
        .replace(/\{\{POST_CONTENT\}\}/g, escapeHtml(postData.content))
        .replace(/\{\{POST_VIDEO\}\}/g, videoHTML)
        .replace(/\{\{POST_TAGS\}\}/g, tagsHTML);
    
    // Create and open the HTML file in a new tab
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in new tab instead of downloading
    const newWindow = window.open(url, '_blank');
    
    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        // Fallback: download the file if popup is blocked
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Popup blocked, file downloaded instead');
    }
    
    // Clean up the URL after a short delay to allow the page to load
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
    
    // Store the filename in the post data for future reference
    postData.htmlFile = filename;
    
    // Add navigation link for this post
    addPostToNavigation(postData);
    
    console.log(`HTML page opened in new tab: ${filename}`);
}

// Get the post template content
function getPostTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{POST_TITLE}} - Kannada Guitar</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .post-page {
            padding: 2rem 0;
        }
        .post-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            padding: 3rem;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            border: 1px solid #e9ecef;
        }
        .post-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e9ecef;
        }
        .post-date {
            color: #6c757d;
            font-size: 0.9rem;
        }
        .back-link {
            color: #ff6b35;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
        }
        .back-link:hover {
            color: #f7931e;
        }
        .post-content {
            line-height: 1.8;
            font-size: 1.1rem;
            margin-bottom: 2rem;
            white-space: pre-wrap;
        }
        .post-video {
            margin: 2rem 0;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 3px 15px rgba(0,0,0,0.2);
        }
        .post-video iframe {
            width: 100%;
            height: 400px;
            border: none;
        }
        .post-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 2rem;
        }
        .tag {
            background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        .post-actions {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 2px solid #e9ecef;
            display: flex;
            gap: 1rem;
            justify-content: center;
        }
        .action-btn {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            display: inline-block;
        }
        .action-btn.primary {
            background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
            color: white;
        }
        .action-btn.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 107, 53, 0.4);
        }
        .action-btn.secondary {
            background: #6c757d;
            color: white;
        }
        .action-btn.secondary:hover {
            background: #5a6268;
            transform: translateY(-2px);
        }
        
        /* Dark theme for post pages */
        .dark-theme .post-container {
            background: #2d2d2d;
            border-color: #404040;
            color: #e0e0e0;
        }
        .dark-theme .post-meta {
            border-bottom-color: #555;
        }
        .dark-theme .post-date {
            color: #999;
        }
        .dark-theme .post-content {
            color: #d0d0d0;
        }
        .dark-theme .post-actions {
            border-top-color: #555;
        }
        
        @media (max-width: 768px) {
            .post-container {
                padding: 2rem;
                margin: 1rem;
            }
            .post-meta {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
            .post-video iframe {
                height: 250px;
            }
            .post-actions {
                flex-direction: column;
            }
            .action-btn {
                width: 100%;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="header-content">
                <div class="logo-section">
                    <h1 class="blog-title">Kannada Guitar</h1>
                    <p class="blog-subtitle">ಕನ್ನಡ ಗಿಟಾರ್</p>
                </div>
                
                <nav class="main-nav">
                    <ul class="nav-list">
                        <li><a href="index.html" class="nav-link">Home</a></li>
                        <li class="nav-dropdown">
                            <a href="index.html#posts" class="nav-link">Posts ▼</a>
                            <ul class="dropdown-menu">
                                <li><a href="index.html#posts" class="dropdown-link">View All Posts</a></li>
                                <li><a href="#" class="dropdown-link" onclick="openAddPostModal()">Add New Post</a></li>
                            </ul>
                        </li>
                        <li><a href="about.html" class="nav-link">About</a></li>
                        <li><a href="contact.html" class="nav-link">Contact</a></li>
                    </ul>
                </nav>
                
                <div class="header-actions">
                    <div class="search-container">
                        <input type="text" id="searchInput" placeholder="Search posts..." class="search-input">
                        <button class="search-btn" onclick="window.location.href='index.html'">🔍</button>
                    </div>
                    <button class="theme-toggle" onclick="toggleTheme()" title="Toggle Dark Mode">🌙</button>
                </div>
            </div>
        </div>
    </header>

    <main class="main">
        <div class="container">
            <section class="post-page">
                <div class="post-container">
                    <div class="post-meta">
                        <a href="index.html" class="back-link">← Back to All Posts</a>
                        <span class="post-date">{{POST_DATE}}</span>
                    </div>
                    
                    <h1 class="post-title">{{POST_TITLE}}</h1>
                    
                    <div class="post-content">{{POST_CONTENT}}</div>
                    
                    {{POST_VIDEO}}
                    
                    {{POST_TAGS}}
                    
                    <div class="post-actions">
                        <a href="index.html" class="action-btn primary">View All Posts</a>
                        <a href="contact.html" class="action-btn secondary">Contact Us</a>
                    </div>
                </div>
            </section>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>Kannada Guitar</h3>
                    <p>A platform for all Kannadigas to share their guitar talent and contribute to growing Kannada music. Share your guitar journey, music videos, and musical thoughts with the community.</p>
                    <div class="social-links">
                        <a href="#" class="social-link" title="Twitter">🐦</a>
                        <a href="#" class="social-link" title="Facebook">📘</a>
                        <a href="#" class="social-link" title="Instagram">📷</a>
                        <a href="#" class="social-link" title="YouTube">📺</a>
                    </div>
                </div>
                
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul class="footer-links">
                        <li><a href="index.html">Home</a></li>
                        <li><a href="index.html#posts">All Posts</a></li>
                        <li><a href="about.html">About</a></li>
                        <li><a href="contact.html">Contact</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h4>Features</h4>
                    <ul class="footer-links">
                        <li><a href="index.html#create">Create Post</a></li>
                        <li><a href="index.html#videos">Video Posts</a></li>
                        <li><a href="index.html#tags">Browse by Tags</a></li>
                        <li><a href="index.html#search">Search</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h4>Community</h4>
                    <div class="community-info">
                        <p><strong>Join us at:</strong></p>
                        <p>kannadaguitar.com</p>
                        <p>Share your talent with fellow Kannadigas!</p>
                    </div>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2024 Kannada Guitar. All rights reserved. Built with ❤️ using HTML, CSS & JavaScript.</p>
                <div class="footer-actions">
                    <a href="index.html" class="footer-btn">Back to Home</a>
                </div>
            </div>
        </div>
    </footer>

    <script>
        // Theme toggle functionality
        function toggleTheme() {
            const body = document.body;
            const isDark = body.classList.contains('dark-theme');
            
            if (isDark) {
                body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
                document.querySelector('.theme-toggle').textContent = '🌙';
            } else {
                body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
                document.querySelector('.theme-toggle').textContent = '☀️';
            }
        }

        // Load saved theme
        document.addEventListener('DOMContentLoaded', () => {
            const savedTheme = localStorage.getItem('theme');
            const themeToggle = document.querySelector('.theme-toggle');
            
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
                themeToggle.textContent = '☀️';
            } else {
                themeToggle.textContent = '🌙';
            }
        });
    </script>
</body>
</html>`;
}

// Generate secure CAPTCHA
function generateSecureCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    secureCaptchaCode = '';
    for (let i = 0; i < 6; i++) {
        secureCaptchaCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const captchaDisplay = document.getElementById('secureCaptchaDisplay');
    if (captchaDisplay) {
        captchaDisplay.textContent = secureCaptchaCode;
        captchaDisplay.style.background = `linear-gradient(45deg, #${Math.floor(Math.random()*16777215).toString(16)}, #${Math.floor(Math.random()*16777215).toString(16)})`;
        captchaDisplay.style.color = '#fff';
        captchaDisplay.style.fontWeight = 'bold';
        captchaDisplay.style.letterSpacing = '3px';
    }
}

// Open Add Post Modal
function openAddPostModal() {
    const modal = document.getElementById('addPostModal');
    if (modal) {
        modal.classList.add('active');
        generateSecureCaptcha();
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

// Close Add Post Modal
function closeAddPostModal() {
    const modal = document.getElementById('addPostModal');
    if (modal) {
        // Add closing animation
        modal.style.animation = 'fadeOut 0.3s ease-in';
        
        setTimeout(() => {
            modal.classList.remove('active');
            modal.style.animation = '';
            document.body.style.overflow = 'auto'; // Restore scrolling
            
            // Reset form
            const form = document.getElementById('securePostForm');
            if (form) {
                form.reset();
                // Reset CAPTCHA
                generateSecureCaptcha();
            }
        }, 300);
    }
}

// Secure rate limiting check
function checkSecureRateLimit() {
    const now = Date.now();
    
    // Reset counter if outside the time window
    if (now - secureLastSubmissionTime > SECURE_RATE_LIMIT_WINDOW) {
        secureFormSubmissionCount = 0;
    }
    
    if (secureFormSubmissionCount >= SECURE_MAX_SUBMISSIONS_PER_WINDOW) {
        const remainingTime = Math.ceil((SECURE_RATE_LIMIT_WINDOW - (now - secureLastSubmissionTime)) / 60000);
        showSecureErrorMessage(`Too many post submissions. Please wait ${remainingTime} minutes before trying again.`);
        return false;
    }
    
    return true;
}

// Enhanced secure form validation
function validateSecureForm(formData) {
    const title = formData.get('title').trim();
    const content = formData.get('content').trim();
    const youtubeUrl = formData.get('youtubeUrl').trim();
    const tags = formData.get('tags').trim();
    const captcha = formData.get('captcha').trim();
    const website = formData.get('website'); // Honeypot
    const terms = formData.get('terms');

    // Check honeypot (should be empty)
    if (website) {
        console.log('Bot detected via honeypot in post form');
        showSecureErrorMessage('Invalid submission detected.');
        return false;
    }

    // Check required fields
    if (!title || !content || !captcha || !terms) {
        showSecureErrorMessage('Please fill in all required fields and accept the terms.');
        return false;
    }

    // Validate title (no excessive special chars)
    if (!/^[a-zA-Z0-9\s\-_.,!?]{3,100}$/.test(title)) {
        showSecureErrorMessage('Please enter a valid title (3-100 characters, letters, numbers, and basic punctuation only).');
        return false;
    }

    // Validate content length
    if (content.length < 20 || content.length > 2000) {
        showSecureErrorMessage('Content must be between 20 and 2000 characters.');
        return false;
    }

    // Check for spam keywords in content
    const spamKeywords = ['viagra', 'casino', 'lottery', 'winner', 'congratulations', 'click here', 'free money', 'bitcoin', 'crypto', 'buy now', 'limited time'];
    const contentLower = content.toLowerCase();
    if (spamKeywords.some(keyword => contentLower.includes(keyword))) {
        showSecureErrorMessage('Content contains inappropriate or spam-like content.');
        return false;
    }

    // Validate YouTube URL if provided
    if (youtubeUrl && !isValidSecureYouTubeUrl(youtubeUrl)) {
        showSecureErrorMessage('Please enter a valid YouTube URL.');
        return false;
    }

    // Validate tags if provided
    if (tags && !/^[a-zA-Z0-9\s,]{0,200}$/.test(tags)) {
        showSecureErrorMessage('Tags can only contain letters, numbers, spaces, and commas.');
        return false;
    }

    // Validate CAPTCHA
    if (captcha.toUpperCase() !== secureCaptchaCode) {
        showSecureErrorMessage('Invalid security code. Please try again.');
        generateSecureCaptcha(); // Generate new CAPTCHA
        return false;
    }

    return true;
}

// Show secure post terms
function showPostTerms() {
    const termsContent = `
Kannada Guitar Post Creation - Terms and Conditions

1. CONTENT GUIDELINES
   - Posts must be related to guitar, music, or Kannada culture
   - No spam, advertisements, or promotional content
   - Respectful and appropriate language is required
   - Original content is encouraged

2. COPYRIGHT
   - You must own the rights to any content you post
   - YouTube videos must be your own or properly attributed
   - No copyrighted material without permission

3. COMMUNITY STANDARDS
   - Be respectful to other community members
   - No harassment, hate speech, or inappropriate content
   - Constructive feedback and support encouraged

4. SECURITY
   - This form includes anti-spam protection
   - Rate limiting applies to prevent abuse
   - All submissions are monitored for security

5. MODERATION
   - Posts may be reviewed before publication
   - Inappropriate content will be removed
   - Repeat violations may result in restrictions

By creating a post, you agree to these terms and confirm your content is appropriate for the Kannada Guitar community.
    `;
    alert(termsContent);
}

// Show secure error message
function showSecureErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        z-index: 3000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Show secure success message
function showSecureSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        padding: 2rem 3rem;
        border-radius: 15px;
        z-index: 3000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: successPopup 0.5s ease-out;
        max-width: 500px;
        text-align: center;
        font-size: 1.1rem;
        line-height: 1.6;
        border: 3px solid #fff;
        cursor: pointer;
    `;
    successDiv.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">🎸✨🎵</div>
        <div style="font-weight: 700; margin-bottom: 1rem; font-size: 1.5rem; color: #fff;">Thank You!</div>
        <div style="font-weight: 600; margin-bottom: 0.5rem;">Success!</div>
        <div>${message}</div>
    `;
    document.body.appendChild(successDiv);

    // Add click to close functionality
    successDiv.addEventListener('click', () => {
        successDiv.style.animation = 'successPopup 0.3s ease-in reverse';
        setTimeout(() => {
            successDiv.remove();
            style.remove();
        }, 300);
    });

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes successPopup {
            0% { 
                opacity: 0; 
                transform: translate(-50%, -50%) scale(0.8); 
            }
            50% { 
                transform: translate(-50%, -50%) scale(1.05); 
            }
            100% { 
                opacity: 1; 
                transform: translate(-50%, -50%) scale(1); 
            }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        successDiv.style.animation = 'successPopup 0.3s ease-in reverse';
        setTimeout(() => {
            successDiv.remove();
            style.remove();
        }, 300);
    }, 6000);
}

// Initialize secure post form when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure blogApp is initialized
    setTimeout(() => {
        const secureForm = document.getElementById('securePostForm');
        if (secureForm) {
        secureForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Check rate limit
            if (!checkSecureRateLimit()) {
                return;
            }

            const formData = new FormData(this);
            
            // Validate form
            if (!validateSecureForm(formData)) {
                return;
            }

            // Disable submit button to prevent double submission
            const submitBtn = document.getElementById('secureSubmitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Publishing...';

            // Close modal immediately after validation passes
            closeAddPostModal();

            // Update rate limiting
            secureFormSubmissionCount++;
            secureLastSubmissionTime = Date.now();

            // Create post data
            const postData = {
                id: Date.now().toString(),
                title: formData.get('title').trim(),
                content: formData.get('content').trim(),
                youtubeUrl: formData.get('youtubeUrl').trim(),
                tags: formData.get('tags').trim(),
                date: new Date().toISOString()
            };

            // Add post using existing blog app functionality
            if (window.blogApp) {
                window.blogApp.addPost(postData);
                
                // Generate HTML file for the new post
                generatePostHTMLFile(postData);
                
                // Show success message after modal has closed (with delay for animation)
                setTimeout(() => {
                    showSecureSuccessMessage('🎉 Post published successfully! Thank you for sharing your guitar journey with the Kannada community! Your post has been added to the blog and a new HTML page has been opened in a new tab. We appreciate your contribution to growing Kannada music culture! ಧನ್ಯವಾದಗಳು! 🙏');
                }, 400);
            } else {
                // Try to wait a bit for blogApp to be available
                setTimeout(() => {
                    if (window.blogApp) {
                        window.blogApp.addPost(postData);
                        generatePostHTMLFile(postData);
                        
                        // Show success message after modal has closed
                        setTimeout(() => {
                            showSecureSuccessMessage('🎉 Post published successfully! Thank you for sharing your guitar journey with the Kannada community! Your post has been added to the blog and a new HTML page has been opened in a new tab. We appreciate your contribution to growing Kannada music culture! ಧನ್ಯವಾದಗಳು! 🙏');
                        }, 400);
                    } else {
                        showSecureErrorMessage('Error: Blog app not available. Please refresh the page and try again.');
                    }
                }, 500);
            }

            // Re-enable button
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Publish Post';
            }, 2000);
        });
        }
    }, 100); // Small delay to ensure blogApp is initialized

    // Close modal when clicking outside
    const modal = document.getElementById('addPostModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAddPostModal();
            }
        });
    }
});

// Revenue and Monetization Functions

// Donation Modal Functions
function openDonationModal() {
    const modal = document.getElementById('donationModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeDonationModal() {
    const modal = document.getElementById('donationModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}


// Donation Processing
function processDonation(amount) {
    if (amount === 0) {
        // Custom amount
        const customAmount = prompt('Enter donation amount (₹):');
        if (customAmount && !isNaN(customAmount) && customAmount > 0) {
            amount = parseFloat(customAmount);
        } else {
            return;
        }
    }
    
    // Track donation attempt
    trackRevenueEvent('donation_attempt', { amount: amount });
    
    // Show payment options
    showPaymentOptions(amount);
}

function showPaymentOptions(amount) {
    const message = `Donation Amount: ₹${amount}\n\nChoose your payment method:`;
    const choice = confirm(message + '\n\nClick OK for UPI, Cancel for other options');
    
    if (choice) {
        openUPI(amount);
    } else {
        // Show other payment options
        const bankChoice = confirm('Click OK for Bank Transfer, Cancel for PayPal');
        if (bankChoice) {
            openBankTransfer(amount);
        } else {
            openPayPal(amount);
        }
    }
}

// Payment Methods
function openUPI(amount = 0) {
    // UPI ID - Replace with your actual UPI ID
    const upiId = 'kannadaguitar@paytm'; // Replace with your UPI ID
    const upiUrl = `upi://pay?pa=${upiId}&pn=Kannada%20Guitar&am=${amount}&cu=INR&tn=Donation%20for%20Kannada%20Guitar%20Community`;
    
    // Try to open UPI app
    window.open(upiUrl, '_blank');
    
    // Fallback - show UPI details
    setTimeout(() => {
        alert(`UPI Payment Details:\n\nUPI ID: ${upiId}\nAmount: ₹${amount}\n\nPlease send the payment and we'll confirm it within 24 hours.`);
    }, 1000);
    
    trackRevenueEvent('upi_payment_initiated', { amount: amount });
}

function openBankTransfer(amount = 0) {
    // Bank details - Replace with your actual bank details
    const bankDetails = `
Bank Transfer Details:

Bank Name: State Bank of India
Account Name: Kannada Guitar Community
Account Number: 1234567890123456
IFSC Code: SBIN0001234
Branch: Bangalore Main Branch

Amount: ₹${amount}
Reference: KG-DONATION-${Date.now()}

Please transfer the amount and email the transaction details to kannadaguitarcom@gmail.com
    `;
    
    alert(bankDetails);
    trackRevenueEvent('bank_transfer_initiated', { amount: amount });
}

function openPayPal(amount = 0) {
    // PayPal link - Replace with your actual PayPal link
    const paypalUrl = `https://www.paypal.com/donate/?hosted_button_id=YOUR_PAYPAL_BUTTON_ID&amount=${amount}`;
    window.open(paypalUrl, '_blank');
    
    trackRevenueEvent('paypal_payment_initiated', { amount: amount });
}


// Search Functionality
function focusSearchInput() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Focus on search input after a short delay
        setTimeout(() => {
            searchInput.focus();
            searchInput.select(); // Select any existing text
        }, 500);
    }
}

function scrollToPosts() {
    const postsSection = document.getElementById('home');
    if (postsSection) {
        postsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Add post to navigation menu
function addPostToNavigation(postData) {
    // Get or create the posts navigation dropdown
    const postsDropdown = document.querySelector('.nav-dropdown .dropdown-menu');
    if (!postsDropdown) return;
    
    // Create navigation link for the new post
    const postLink = document.createElement('li');
    postLink.innerHTML = `
        <a href="${postData.htmlFile}" class="dropdown-link" target="_blank">
            📄 ${postData.title}
        </a>
    `;
    
    // Insert after the "Recent Posts" section title
    const sectionTitle = postsDropdown.querySelector('.dropdown-section-title');
    
    if (sectionTitle) {
        // Insert after the section title
        postsDropdown.insertBefore(postLink, sectionTitle.nextSibling);
    } else {
        // Fallback: append to the end
        postsDropdown.appendChild(postLink);
    }
    
    // Store navigation data in localStorage for persistence
    savePostNavigation(postData);
    
    console.log(`Added "${postData.title}" to navigation menu`);
}

// Save post navigation to localStorage
function savePostNavigation(postData) {
    const navigationData = JSON.parse(localStorage.getItem('kannadaGuitarNavigation') || '[]');
    
    // Check if post already exists in navigation
    const existingIndex = navigationData.findIndex(item => item.id === postData.id);
    
    if (existingIndex >= 0) {
        // Update existing entry
        navigationData[existingIndex] = {
            id: postData.id,
            title: postData.title,
            htmlFile: postData.htmlFile,
            date: postData.date
        };
    } else {
        // Add new entry
        navigationData.push({
            id: postData.id,
            title: postData.title,
            htmlFile: postData.htmlFile,
            date: postData.date
        });
    }
    
    // Sort by date (newest first)
    navigationData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Keep only the latest 10 posts in navigation
    const limitedNavigation = navigationData.slice(0, 10);
    
    localStorage.setItem('kannadaGuitarNavigation', JSON.stringify(limitedNavigation));
}

// Load post navigation from localStorage
function loadPostNavigation() {
    const navigationData = JSON.parse(localStorage.getItem('kannadaGuitarNavigation') || '[]');
    const postsDropdown = document.querySelector('.nav-dropdown .dropdown-menu');
    
    if (!postsDropdown || navigationData.length === 0) return;
    
    // Clear existing post links (keep main navigation items and section title)
    const existingPostLinks = postsDropdown.querySelectorAll('li:not(:first-child):not(:nth-child(2)):not(.dropdown-separator):not(.dropdown-section-title)');
    existingPostLinks.forEach(link => link.remove());
    
    // Add saved post links
    navigationData.forEach(postData => {
        const postLink = document.createElement('li');
        postLink.innerHTML = `
            <a href="${postData.htmlFile}" class="dropdown-link" target="_blank">
                📄 ${postData.title}
            </a>
        `;
        
        // Insert after the "Recent Posts" section title
        const sectionTitle = postsDropdown.querySelector('.dropdown-section-title');
        if (sectionTitle) {
            postsDropdown.insertBefore(postLink, sectionTitle.nextSibling);
        } else {
            postsDropdown.appendChild(postLink);
        }
    });
    
    console.log(`Loaded ${navigationData.length} posts to navigation menu`);
}

// Revenue Tracking
function trackRevenueEvent(eventName, data = {}) {
    // Track revenue events for analytics
    const eventData = {
        event: eventName,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...data
    };
    
    // Store in localStorage for now (in production, send to analytics service)
    const revenueEvents = JSON.parse(localStorage.getItem('kannadaGuitarRevenueEvents') || '[]');
    revenueEvents.push(eventData);
    localStorage.setItem('kannadaGuitarRevenueEvents', JSON.stringify(revenueEvents));
    
    // Log to console for development
    console.log('Revenue Event:', eventData);
    
    // In production, send to your analytics service
    // Example: gtag('event', eventName, data);
}


// Add some helpful console commands for development
window.openAddPostModal = openAddPostModal;
window.closeAddPostModal = closeAddPostModal;
window.generateSecureCaptcha = generateSecureCaptcha;
window.showPostTerms = showPostTerms;

// Revenue and monetization functions
window.openDonationModal = openDonationModal;
window.closeDonationModal = closeDonationModal;
window.processDonation = processDonation;
window.openUPI = openUPI;
window.openBankTransfer = openBankTransfer;
window.openPayPal = openPayPal;

// Search functionality
window.focusSearchInput = focusSearchInput;
window.scrollToPosts = scrollToPosts;

// Navigation management
window.addPostToNavigation = addPostToNavigation;

console.log('Blog app loaded! Available commands:');
console.log('- blogApp.clearAllPosts() - Clear all posts');
console.log('- blogApp.exportPosts() - Export posts as JSON');
console.log('- blogApp.importPosts(file) - Import posts from JSON file');
console.log('- openAddPostModal() - Open secure post creation modal');
