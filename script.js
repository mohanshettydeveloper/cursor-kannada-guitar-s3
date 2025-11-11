// Blog Application JavaScript
const NEW_POSTS_DIR = 'newposts/';

function isFacebookVideoUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    
    const normalizedUrl = url.trim().toLowerCase();
    const facebookPatterns = [
        /facebook\.com\/watch\/?\?v=[\w-]+/,
        /facebook\.com\/.+\/videos\/[\w-]+/,
        /facebook\.com\/video\.php\?v=[\w-]+/,
        /facebook\.com\/story\.php\?story_fbid=[\w-]+/,
        /fb\.watch\/[\w-]+/
    ];
    
    return facebookPatterns.some(pattern => pattern.test(normalizedUrl));
}

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


    // Detect video platform type
    getVideoType(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }
        
        url = url.trim();
        const lowerUrl = url.toLowerCase();
        
        if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
            return 'youtube';
        } else if (lowerUrl.includes('instagram.com') && (lowerUrl.includes('/p/') || lowerUrl.includes('/reel/') || lowerUrl.includes('/tv/'))) {
            return 'instagram';
        } else if (isFacebookVideoUrl(lowerUrl)) {
            return 'facebook';
        }
        
        return null;
    }

    // Validate video URL (supports YouTube, Instagram, Facebook)
    isValidVideoUrl(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }
        
        const videoType = this.getVideoType(url);
        
        switch (videoType) {
            case 'youtube':
                return !!this.extractYouTubeVideoId(url);
            case 'instagram':
                return !!this.extractInstagramId(url);
            case 'facebook':
                return isFacebookVideoUrl(url);
            default:
                return false;
        }
    }

    isValidYouTubeUrl(url) {
        return this.getVideoType(url) === 'youtube';
    }

    extractYouTubeVideoId(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }
        
        // Clean the URL
        url = url.trim();
        
        // Various YouTube URL patterns
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1] && match[1].length === 11) {
                return match[1];
            }
        }
        
        return null;
    }

    // Extract Instagram post/reel ID
    extractInstagramId(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }
        
        url = url.trim();
        
        // Instagram URL patterns: instagram.com/p/CODE, instagram.com/reel/CODE, instagram.com/tv/CODE
        const patterns = [
            /instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/,
            /instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)\/?/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    }

    addPost(postData) {
        try {
            console.log('BlogApp.addPost called with:', postData);
            
            // Add post to beginning of array
            this.posts.unshift(postData);
            console.log('Post added to array, total posts:', this.posts.length);
            
            // Save to localStorage
            this.savePosts();
            console.log('Posts saved to localStorage');
            
            // Render posts
            this.renderPosts();
            console.log('Posts rendered');
            
            // Update footer stats
            this.updateFooterStats();
            console.log('Footer stats updated');
            
            // Success message removed - no popup shown
        } catch (error) {
            console.error('Error in addPost:', error);
            this.showSuccessMessage('Error adding post: ' + error.message);
        }
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
        if (!container) return;
        
        const sortedPosts = Array.isArray(this.posts) ? [...this.posts] : [];
        sortedPosts.sort((a, b) => {
            const dateA = new Date(a.date || 0).getTime();
            const dateB = new Date(b.date || 0).getTime();
            return dateB - dateA;
        });
        
        if (sortedPosts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No posts yet</h3>
                    <p>Create your first post using the form above!</p>
                </div>
            `;
            this.renderArchives([]);
            return;
        }

        const visiblePosts = sortedPosts.slice(0, 3);
        const postsHtml = visiblePosts.map(post => this.createPostHTML(post)).join('');
        const archiveNote = sortedPosts.length > visiblePosts.length
            ? `<div class="more-posts-note">Looking for older posts? Browse the archive by month to find the rest.</div>`
            : '';

        container.innerHTML = `${postsHtml}${archiveNote}`;
        
        // Bind delete events
        this.bindDeleteEvents();
        this.renderArchives(sortedPosts);
        
        // Initialize comments for all posts
        if (window.commentsManager && window.renderComments && window.renderCommentForm) {
            visiblePosts.forEach(post => {
                window.renderComments(post.id);
                window.renderCommentForm(post.id);
            });
        }
    }

    createPostHTML(post) {
        const date = new Date(post.date || Date.now()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const authorName = this.escapeHtml(
            (post.authorName && post.authorName.trim()) ||
            (post.authorUsername && post.authorUsername.trim()) ||
            'Anonymous'
        );

        const videoHTML = post.youtubeUrl ? this.createVideoHTML(post.youtubeUrl) : '';
        const tagsHTML = post.tags ? this.createTagsHTML(post.tags) : '';
        
        // Create link to individual post HTML file if it exists
        const postLink = post.htmlFile ? `<a href="${post.htmlFile}" class="post-link" target="_blank">📄 View Full Post</a>` : '';

        // Get comment count
        const commentCount = window.commentsManager ? window.commentsManager.getCommentCount(post.id) : 0;

        return `
            <article class="post-card" data-id="${post.id}">
                <div class="post-header">
                    <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
                    <div class="post-meta">
                        <span class="post-author">👤 ${authorName}</span>
                        <span class="post-meta-dot">•</span>
                        <span class="post-date">${date}</span>
                    </div>
                </div>
                
                ${videoHTML}
                
                ${post.content ? `<div class="post-content">${this.escapeHtml(post.content)}</div>` : ''}
                
                ${tagsHTML}
                
                <div class="post-actions">
                    ${postLink}
                    <button class="comment-toggle-btn" onclick="toggleComments('${post.id}')" aria-label="Toggle comments">
                        💬 <span data-comment-count="${post.id}">${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}</span>
                    </button>
                </div>
                
                <div class="comments-section" id="comments-section-${post.id}" style="display: none;">
                    <div class="comment-form-container" id="comment-form-container-${post.id}"></div>
                    <div class="comments-container" id="comments-container-${post.id}"></div>
                </div>
            </article>
        `;
    }

    createVideoHTML(videoUrl) {
        if (!videoUrl || typeof videoUrl !== 'string') {
            return '';
        }
        
        const videoType = this.getVideoType(videoUrl);
        
        if (!videoType) {
            console.warn('Unsupported video URL:', videoUrl);
            return '';
        }
        
        switch (videoType) {
            case 'youtube':
                return this.createYouTubeEmbed(videoUrl);
            case 'instagram':
                return this.createInstagramEmbed(videoUrl);
            case 'facebook':
                return this.createFacebookEmbed(videoUrl);
            default:
                return '';
        }
    }

    createYouTubeEmbed(url) {
        const videoId = this.extractYouTubeVideoId(url);
        if (!videoId || videoId.length !== 11) {
            console.warn('Invalid YouTube video ID:', videoId);
            return '';
        }

        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        
        return `
            <div class="post-video">
                <iframe 
                    src="${embedUrl}" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                    allowfullscreen>
                </iframe>
            </div>
        `;
    }

    createInstagramEmbed(url) {
        const postId = this.extractInstagramId(url);
        if (!postId) {
            console.warn('Invalid Instagram post ID:', postId);
            return '';
        }

        // Clean URL and construct embed URL
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http')) {
            cleanUrl = 'https://' + cleanUrl;
        }
        
        // Extract the type (p, reel, tv) and code
        const match = cleanUrl.match(/instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/);
        if (!match) {
            return '';
        }
        
        const type = match[1];
        const code = match[2];
        const embedUrl = `https://www.instagram.com/${type}/${code}/embed/`;
        
        // Use Instagram's official embed iframe
        return `
            <div class="post-video instagram-video">
                <iframe 
                    src="${embedUrl}"
                    title="Instagram post"
                    frameborder="0"
                    allow="encrypted-media"
                    scrolling="no"
                    style="max-width: 540px; width: 100%; min-width: 326px; margin: 0 auto; display: block;">
                </iframe>
            </div>
        `;
    }

    createFacebookEmbed(url) {
        if (!isFacebookVideoUrl(url)) {
            console.warn('Invalid Facebook video URL:', url);
            return '';
        }

        // Clean and encode the Facebook video URL
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http')) {
            cleanUrl = 'https://' + cleanUrl;
        }
        
        // Facebook video embed URL format using their plugin
        // This works for all Facebook video URL formats
        const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}&show_text=0&width=500&height=281`;
        
        return `
            <div class="post-video facebook-video">
                <iframe 
                    src="${embedUrl}" 
                    title="Facebook video player" 
                    frameborder="0" 
                    allow="encrypted-media" 
                    allowfullscreen
                    scrolling="no"
                    style="max-width: 100%; width: 100%; border: none; overflow: hidden;">
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
        
        // Show instructions
        setTimeout(() => {
            alert('Posts exported! To generate HTML files in guitartabs folder:\n\n' +
                  '1. Save the downloaded blog-posts.json to your project folder\n' +
                  '2. Run: npm run generate-posts\n' +
                  '   OR: node generate-posts.js blog-posts.json\n\n' +
                  'This will automatically create all post HTML files in the guitartabs folder!');
        }, 500);
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
        if (!container) return;

        const sortedPosts = Array.isArray(posts) ? [...posts] : [];
        sortedPosts.sort((a, b) => {
            const dateA = new Date(a.date || 0).getTime();
            const dateB = new Date(b.date || 0).getTime();
            return dateB - dateA;
        });
        
        if (sortedPosts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No posts found</h3>
                    <p>Try adjusting your search terms or create a new post!</p>
                </div>
            `;
            this.renderArchives([]);
            return;
        }

        container.innerHTML = sortedPosts.map(post => this.createPostHTML(post)).join('');
        this.bindDeleteEvents();
        this.renderArchives(sortedPosts);
    }

    renderArchives(posts = this.posts) {
        const archivesContainer = document.getElementById('archivesList');
        if (!archivesContainer) return;

        if (!Array.isArray(posts) || posts.length === 0) {
            archivesContainer.innerHTML = `<p class="archive-empty">No posts yet.</p>`;
            return;
        }

        const archivesMap = new Map();
        posts.forEach(post => {
            const postDate = new Date(post.date || Date.now());
            if (Number.isNaN(postDate.getTime())) {
                return;
            }
            const key = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}`;
            if (!archivesMap.has(key)) {
                archivesMap.set(key, []);
            }
            archivesMap.get(key).push(post);
        });

        if (archivesMap.size === 0) {
            archivesContainer.innerHTML = `<p class="archive-empty">No posts yet.</p>`;
            return;
        }

        const sortedKeys = Array.from(archivesMap.keys()).sort((a, b) => b.localeCompare(a));

        const archiveMarkup = sortedKeys.map(key => {
            const [yearStr, monthStr] = key.split('-');
            const monthDate = new Date(Number(yearStr), Number(monthStr) - 1, 1);
            const label = Number.isNaN(monthDate.getTime())
                ? key
                : monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

            const postsForMonth = archivesMap.get(key).slice().sort((a, b) => {
                const dateA = new Date(a.date || 0).getTime();
                const dateB = new Date(b.date || 0).getTime();
                return dateB - dateA;
            });

            const postsHtml = postsForMonth.map(post => `
                <a href="#" class="archive-post-link" data-post-id="${post.id}">
                    ${this.escapeHtml(post.title)}
                </a>
            `).join('');

            return `
                <div class="archive-month">
                    <div class="archive-month-title">${this.escapeHtml(label)}<span>${postsForMonth.length}</span></div>
                    <div class="archive-posts">
                        ${postsHtml}
                    </div>
                </div>
            `;
        }).join('');

        archivesContainer.innerHTML = archiveMarkup;
    }

    scrollToPost(postId) {
        if (!postId) return;
        const postElement = document.querySelector(`.post-card[data-id="${postId}"]`);

        if (postElement) {
            postElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

            if (postElement._highlightTimeout) {
                clearTimeout(postElement._highlightTimeout);
            }
            postElement.classList.add('highlight');
            postElement._highlightTimeout = setTimeout(() => {
                postElement.classList.remove('highlight');
                postElement._highlightTimeout = null;
            }, 2000);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
        const totalVideos = this.posts.filter(post => post.youtubeUrl && this.isValidVideoUrl(post.youtubeUrl)).length;
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
// Toggle comments section for a post
function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-section-${postId}`);
    if (!commentsSection) return;
    
    const isVisible = commentsSection.style.display !== 'none';
    commentsSection.style.display = isVisible ? 'none' : 'block';
    
    // If opening comments, scroll to comments section
    if (!isVisible) {
        setTimeout(() => {
            commentsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// Make toggleComments globally available
if (typeof window !== 'undefined') {
    window.toggleComments = toggleComments;
}

document.addEventListener('DOMContentLoaded', () => {
    blogApp = new BlogApp();
    
    // Make blogApp available globally
    window.blogApp = blogApp;
    
    // Load post navigation from localStorage
    loadPostNavigation();
    loadNewPostsFromFolder();
    setupArchiveInteractions();
    
    // If no posts exist, leave the interface empty so the user can start fresh.
});


// Secure Post Modal functionality
let secureCaptchaCode = '';
let secureFormSubmissionCount = 0;
let secureLastSubmissionTime = 0;
const SECURE_RATE_LIMIT_WINDOW = 300000; // 5 minutes
const SECURE_MAX_SUBMISSIONS_PER_WINDOW = 2;

// Video URL validation for secure form (supports YouTube, Instagram, Facebook)
function isValidSecureVideoUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    
    url = url.trim().toLowerCase();
    
    // Check for YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/.test(url);
    }
    
    // Check for Instagram (posts, reels, TV)
    if (url.includes('instagram.com') && (url.includes('/p/') || url.includes('/reel/') || url.includes('/tv/'))) {
        return /instagram\.com\/(p|reel|tv)\/[a-zA-Z0-9_-]+/.test(url);
    }
    
    // Check for Facebook videos
    if (isFacebookVideoUrl(url)) {
        return true;
    }
    
    return false;
}

// Backward compatibility
function isValidSecureYouTubeUrl(url) {
    return isValidSecureVideoUrl(url);
}

// Standalone function to extract YouTube video ID (used in generatePostHTMLFile)
function extractYouTubeVideoId(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }
    
    // Clean the URL
    url = url.trim();
    
    // Various YouTube URL patterns
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1] && match[1].length === 11) {
            return match[1];
        }
    }
    
    return null;
}

// Standalone function to escape HTML (used in generatePostHTMLFile)
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Generate HTML file for individual posts
async function generatePostHTMLFile(postData) {
    // Create a safe filename from the post title
    const safeTitle = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
    
    const filename = `guitartabs/post-${postData.id}-${safeTitle}.html`;
    const filenameOnly = `post-${postData.id}-${safeTitle}.html`;
    
    // Format the date
    const postDate = new Date(postData.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Generate video HTML if video URL exists (YouTube, Instagram, or Facebook)
    let videoHTML = '';
    if (postData.youtubeUrl) {
        // Create a temporary blog app instance to use its video embedding methods
        const tempApp = new BlogApp();
        videoHTML = tempApp.createVideoHTML(postData.youtubeUrl);
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
    
    // Generate SEO-friendly description from post content
    const postDescription = postData.content.length > 160 
        ? postData.content.substring(0, 157).trim() + '...'
        : postData.content;
    
    // Generate keywords - combine post tags with Kannada Guitar keywords
    const postTags = postData.tags ? postData.tags.split(',').map(t => t.trim()).join(', ') : '';
    const seoKeywords = `kannada guitar, ಕನ್ನಡ ಗಿಟಾರ್, ${postTags}, guitar lessons in kannada, kannada music, guitar tutorials kannada, learn guitar kannada, kannada guitar songs, guitar tabs kannada, kannada guitar community, guitar classes bangalore, kannada guitar teacher, guitar learning kannada, kannada guitar chords, guitar lessons bangalore, kannada music lessons`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '');
    
    // Generate canonical URL (reuse safeTitle from above) - in guitartabs folder
    const canonicalUrl = `https://kannadaguitar.com/guitartabs/post-${postData.id}-${safeTitle}.html`;
    
    // Generate video URL for Open Graph if YouTube video exists
    const videoId = postData.youtubeUrl ? extractYouTubeVideoId(postData.youtubeUrl) : null;
    const ogVideoTags = videoId ? `
    <meta property="og:video" content="https://www.youtube.com/watch?v=${videoId}">
    <meta property="og:video:url" content="https://www.youtube.com/watch?v=${videoId}">
    <meta property="og:video:type" content="text/html">
    <meta property="og:video:width" content="1280">
    <meta property="og:video:height" content="720">` : '';
    
    // Generate video structured data if video exists
    // Use JSON.stringify for proper escaping in JSON-LD
    const videoStructuredData = videoId ? `,
        "video": {
            "@type": "VideoObject",
            "name": ${JSON.stringify(postData.title)},
            "description": ${JSON.stringify(postDescription)},
            "thumbnailUrl": "https://img.youtube.com/vi/${videoId}/maxresdefault.jpg",
            "uploadDate": "${new Date(postData.date).toISOString()}",
            "contentUrl": "https://www.youtube.com/watch?v=${videoId}",
            "embedUrl": "https://www.youtube.com/embed/${videoId}"
        }` : '';
    
    // Format date for structured data (ISO format)
    const isoDate = new Date(postData.date).toISOString();
    
    // Read the template file content (we'll create this as a string for now)
    const templateContent = getPostTemplate();
    
    const authorName = postData.authorName || postData.authorUsername || 'Anonymous';
    
    // Replace placeholders with actual content
    const htmlContent = templateContent
        .replace(/\{\{POST_TITLE\}\}/g, escapeHtml(postData.title))
        .replace(/\{\{POST_DATE\}\}/g, postDate)
        .replace(/\{\{POST_DATE_ISO\}\}/g, isoDate)
        .replace(/\{\{POST_CONTENT\}\}/g, escapeHtml(postData.content))
        .replace(/\{\{POST_VIDEO\}\}/g, videoHTML)
        .replace(/\{\{POST_TAGS\}\}/g, tagsHTML)
        .replace(/\{\{POST_DESCRIPTION\}\}/g, escapeHtml(postDescription))
        .replace(/\{\{POST_KEYWORDS\}\}/g, escapeHtml(seoKeywords))
        .replace(/\{\{POST_CANONICAL_URL\}\}/g, canonicalUrl)
        .replace(/\{\{POST_OG_VIDEO\}\}/g, ogVideoTags)
        .replace(/\{\{POST_VIDEO_STRUCTURED_DATA\}\}/g, videoStructuredData)
        .replace(/\{\{POST_ID\}\}/g, postData.id)
        .replace(/\{\{POST_AUTHOR\}\}/g, escapeHtml(authorName));
    
    // Create and save the HTML file to guitartabs folder
    try {
        console.log('Generating HTML file in guitartabs folder:', filename);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        
        // Store the filename in the post data for future reference (relative path)
        postData.htmlFile = filename;
        
        // Create URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Add navigation link for this post
        addPostToNavigation(postData);
        
        // Try to use File System Access API (Chrome/Edge) to save directly to guitartabs folder
        if ('showSaveFilePicker' in window) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: filenameOnly,
                    types: [{
                        description: 'HTML files',
                        accept: { 'text/html': ['.html'] }
                    }]
                });
                
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                
                console.log('File saved using File System Access API:', filenameOnly);
                
                // Open the file in a new tab for preview
                const newWindow = window.open(url, '_blank');
                if (!newWindow) {
                    console.warn('Popup blocked, file saved but not opened');
                }
                
                // Clean up URL
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 2000);
                
                return true;
            } catch (fsError) {
                // User cancelled or File System API failed, fall through to download
                if (fsError.name !== 'AbortError') {
                    console.log('File System API error:', fsError);
                }
                // Continue to download fallback
            }
        }
        
        // Fallback: Download the file (user can save to guitartabs folder manually)
        // Also show a message about where to save it
        const link = document.createElement('a');
        link.href = url;
        link.download = filenameOnly; // Just the filename
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('File download initiated. Please save to guitartabs folder:', filename);
        // Popup message removed - instructions available in console
        
        // Also open in new tab for preview
        const newWindow = window.open(url, '_blank');
        
        // Clean up the URL after a delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 2000);
        
        return true;
    } catch (error) {
        console.error('Error creating HTML file:', error);
        alert('Error creating HTML page: ' + error.message);
        return false;
    }
}

// Get the post template content
function getPostTemplate() {
    return `<!DOCTYPE html>
<html lang="en-IN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{POST_TITLE}} - Kannada Guitar | ಕನ್ನಡ ಗಿಟಾರ್</title>
    <link rel="icon" type="image/png" href="../guitar_black.PNG">
    <link rel="apple-touch-icon" href="../guitar_black.PNG">
    <link rel="stylesheet" href="../styles.css">
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="{{POST_DESCRIPTION}} - Kannada Guitar community for learning guitar in Kannada language. ಕನ್ನಡ ಗಿಟಾರ್ ಸಮುದಾಯ.">
    <meta name="keywords" content="{{POST_KEYWORDS}}">
    <meta name="author" content="{{POST_AUTHOR}}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="googlebot" content="index, follow">
    <meta name="bingbot" content="index, follow">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="{{POST_TITLE}} - Kannada Guitar | ಕನ್ನಡ ಗಿಟಾರ್">
    <meta property="og:description" content="{{POST_DESCRIPTION}} - Join the Kannada Guitar community and learn guitar in Kannada language.">
    <meta property="og:type" content="article">
    <meta property="og:url" content="{{POST_CANONICAL_URL}}">
    <meta property="og:image" content="https://kannadaguitar.com/images/kannada-guitar-og.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Kannada Guitar">
    <meta property="og:locale" content="en_IN">
    <meta property="og:locale:alternate" content="kn_IN">
    {{POST_OG_VIDEO}}
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{POST_TITLE}} - Kannada Guitar">
    <meta name="twitter:description" content="{{POST_DESCRIPTION}}">
    <meta name="twitter:image" content="https://kannadaguitar.com/images/kannada-guitar-twitter.jpg">
    
    <!-- Additional SEO Meta Tags -->
    <meta name="theme-color" content="#d7263d">
    <meta name="msapplication-TileColor" content="#d7263d">
    <meta name="application-name" content="Kannada Guitar">
    <meta name="apple-mobile-web-app-title" content="Kannada Guitar">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="{{POST_CANONICAL_URL}}">
    
    <!-- Language and Region -->
    <meta name="language" content="en-IN">
    <meta name="geo.region" content="IN-KA">
    <meta name="geo.placename" content="Karnataka, India">
    
    <!-- Article Meta Tags -->
    <meta property="article:published_time" content="{{POST_DATE_ISO}}">
    <meta property="article:author" content="{{POST_AUTHOR}}">
    <meta property="article:section" content="Guitar Lessons">
    <meta property="article:tag" content="Kannada Guitar">
    <meta property="article:tag" content="ಕನ್ನಡ ಗಿಟಾರ್">
    
    <!-- Structured Data for SEO (JSON-LD) -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "{{POST_TITLE}}",
        "description": "{{POST_DESCRIPTION}}",
        "image": "https://kannadaguitar.com/images/kannada-guitar-og.jpg",
        "datePublished": "{{POST_DATE_ISO}}",
        "dateModified": "{{POST_DATE_ISO}}",
        "author": {
            "@type": "Person",
            "name": "{{POST_AUTHOR}}"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Kannada Guitar",
            "alternateName": "ಕನ್ನಡ ಗಿಟಾರ್ ಸಮುದಾಯ",
            "url": "https://kannadaguitar.com",
            "logo": {
                "@type": "ImageObject",
                "url": "https://kannadaguitar.com/images/kannada-guitar-logo.png"
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "{{POST_CANONICAL_URL}}"
        },
        "keywords": "{{POST_KEYWORDS}}",
        "inLanguage": ["en-IN", "kn-IN"],
        "about": {
            "@type": "Thing",
            "name": "Kannada Guitar Lessons"
        },
        "audience": {
            "@type": "Audience",
            "audienceType": "Kannada Guitar Enthusiasts"
        }{{POST_VIDEO_STRUCTURED_DATA}}
    }
    </script>
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
        .post-header-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e9ecef;
        }
        .post-meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
            font-size: 0.95rem;
            color: #6c757d;
        }
        .post-author {
            font-weight: 600;
            color: #d7263d;
        }
        .post-meta-dot {
            color: #adb5bd;
        }
        .post-date {
            color: #6c757d;
            font-size: 0.95rem;
        }
        .back-link {
            color: #d7263d;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
        }
        .back-link:hover {
            color: #ffd447;
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
            background: linear-gradient(135deg, #d7263d 0%, #ffd447 100%);
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
            background: linear-gradient(135deg, #d7263d 0%, #ffd447 100%);
            color: white;
        }
        .action-btn.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(215, 38, 61, 0.38);
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
        .dark-theme .post-header-bar {
            border-bottom-color: #555;
        }
        .dark-theme .post-date {
            color: #adb5bd;
        }
        .dark-theme .post-meta {
            color: #adb5bd;
        }
        .dark-theme .post-author {
            color: #ffd447;
        }
        .dark-theme .post-meta-dot {
            color: #666;
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
            .post-header-bar {
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
                        <li><a href="../index.html" class="nav-link">Home</a></li>
                        <li class="nav-dropdown">
                            <a href="../index.html#posts" class="nav-link">Posts ▼</a>
                            <ul class="dropdown-menu">
                                <li><a href="../index.html#posts" class="dropdown-link">View All Posts</a></li>
                            </ul>
                        </li>
                        <li><a href="../about.html" class="nav-link">About</a></li>
                        <li><a href="../contact.html" class="nav-link">Contact</a></li>
                    </ul>
                </nav>
                
                <div class="header-actions">
                    <div class="search-container">
                        <input type="text" id="searchInput" placeholder="Search posts..." class="search-input">
                        <button class="search-btn" onclick="window.location.href='../index.html'">🔍</button>
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
                    <div class="post-header-bar">
                        <a href="../index.html" class="back-link">← Back to All Posts</a>
                        <div class="post-meta">
                            <span class="post-author">👤 {{POST_AUTHOR}}</span>
                            <span class="post-meta-dot">•</span>
                            <span class="post-date">{{POST_DATE}}</span>
                        </div>
                    </div>
                    
                    <h1 class="post-title">{{POST_TITLE}} - Kannada Guitar</h1>
                    
                    {{POST_VIDEO}}
                    
                    <div class="post-content">{{POST_CONTENT}}</div>
                    
                    {{POST_TAGS}}
                    
                    <div class="post-actions">
                        <a href="../index.html" class="action-btn primary">View All Posts</a>
                        <a href="../contact.html" class="action-btn secondary">Contact Us</a>
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
                        <li><a href="../index.html">Home</a></li>
                        <li><a href="../index.html#posts">All Posts</a></li>
                        <li><a href="../about.html">About</a></li>
                        <li><a href="../contact.html">Contact</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h4>Features</h4>
                    <ul class="footer-links">
                        <li><a href="../index.html#create">Create Post</a></li>
                        <li><a href="../index.html#videos">Video Posts</a></li>
                        <li><a href="../index.html#tags">Browse by Tags</a></li>
                        <li><a href="../index.html#search">Search</a></li>
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
                    <a href="../index.html" class="footer-btn">Back to Home</a>
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
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Store in both local and window variables for compatibility
    secureCaptchaCode = code;
    window.secureCaptchaCode = code;
    
    const captchaDisplay = document.getElementById('secureCaptchaDisplay');
    if (captchaDisplay) {
        captchaDisplay.textContent = code;
        captchaDisplay.style.background = `linear-gradient(45deg, #${Math.floor(Math.random()*16777215).toString(16)}, #${Math.floor(Math.random()*16777215).toString(16)})`;
        captchaDisplay.style.color = '#fff';
        captchaDisplay.style.fontWeight = 'bold';
        captchaDisplay.style.letterSpacing = '3px';
        captchaDisplay.style.padding = '0.5rem';
        captchaDisplay.style.borderRadius = '5px';
        captchaDisplay.style.minWidth = '120px';
        captchaDisplay.style.textAlign = 'center';
    } else {
        console.error('CAPTCHA display element not found: secureCaptchaDisplay');
    }
}

// Open Add Post Modal
function openAddPostModal() {
    try {
        const modal = document.getElementById('addPostModal');
        if (modal) {
            // Make sure modal is visible
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            // Generate CAPTCHA
            generateSecureCaptcha();
            
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
            
            // Focus on first input for better UX
            setTimeout(() => {
                const firstInput = document.getElementById('securePostTitle');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        } else {
            console.error('Modal not found: addPostModal');
            alert('Error: Modal not found. Please refresh the page.');
        }
    } catch (error) {
        console.error('Error opening modal:', error);
        alert('Error opening modal: ' + error.message);
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
            modal.style.display = 'none';
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

    // Validate video URL if provided (YouTube, Instagram, or Facebook)
    if (youtubeUrl && !isValidSecureVideoUrl(youtubeUrl)) {
        showSecureErrorMessage('Please enter a valid YouTube, Instagram, or Facebook video URL.');
        return false;
    }

    // Validate tags if provided
    if (tags && !/^[a-zA-Z0-9\s,]{0,200}$/.test(tags)) {
        showSecureErrorMessage('Tags can only contain letters, numbers, spaces, and commas.');
        return false;
    }

    // Validate CAPTCHA - check both local and window variables
    const currentCaptchaCode = secureCaptchaCode || window.secureCaptchaCode || '';
    if (captcha.toUpperCase() !== currentCaptchaCode) {
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
                console.log('Form submitted');
                
                // Check if user is logged in
                const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
                if (!currentUser) {
                    showSecureErrorMessage('You must be logged in to create a post. Please login and try again.');
                    closeAddPostModal();
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                    return;
                }
                
                // Check rate limit
                if (!checkSecureRateLimit()) {
                    console.log('Rate limit exceeded');
                    return;
                }

                const formData = new FormData(this);
                console.log('Form data collected');
                
                // Validate form
                if (!validateSecureForm(formData)) {
                    console.log('Form validation failed');
                    return;
                }
                console.log('Form validation passed');

                // Disable submit button to prevent double submission
                const submitBtn = document.getElementById('secureSubmitBtn');
                if (!submitBtn) {
                    showSecureErrorMessage('Error: Submit button not found. Please refresh the page.');
                    return;
                }
                submitBtn.disabled = true;
                submitBtn.textContent = 'Publishing...';

                // DON'T close modal yet - wait until post is saved
                // closeAddPostModal();

                // Update rate limiting
                secureFormSubmissionCount++;
                secureLastSubmissionTime = Date.now();

                // Create post data
                const authorName = (currentUser.fullName && currentUser.fullName.trim()) ||
                    (currentUser.username && currentUser.username.trim()) ||
                    (currentUser.email && currentUser.email.trim()) ||
                    'Anonymous';
                const postData = {
                    id: Date.now().toString(),
                    title: formData.get('title').trim(),
                    content: formData.get('content').trim(),
                    youtubeUrl: formData.get('youtubeUrl').trim(),
                    tags: formData.get('tags').trim(),
                    date: new Date().toISOString(),
                    authorId: currentUser.id || currentUser.userId || currentUser.sub || null,
                    authorUsername: currentUser.username || currentUser.email || null,
                    authorName: authorName
                };

                // Add post using existing blog app functionality
                console.log('Attempting to add post:', postData);
                console.log('blogApp available:', !!window.blogApp);
                
                if (window.blogApp) {
                    try {
                        // Add post (this saves to localStorage and renders)
                        window.blogApp.addPost(postData);
                        console.log('Post added successfully via blogApp');
                        
                        // Close modal (no success message popup)
                        closeAddPostModal();
                    } catch (error) {
                        console.error('Error adding post:', error);
                        showSecureErrorMessage('Error adding post: ' + error.message);
                        // Re-enable button on error
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Publish Post';
                        }
                    }
                } else {
                    console.warn('blogApp not available, waiting...');
                    // Try to wait a bit for blogApp to be available
                    let retries = 0;
                    const maxRetries = 10;
                    const checkBlogApp = setInterval(() => {
                        retries++;
                        if (window.blogApp) {
                            clearInterval(checkBlogApp);
                            try {
                                window.blogApp.addPost(postData);
                                closeAddPostModal();
                                // No success message popup
                            } catch (error) {
                                console.error('Error adding post after retry:', error);
                                showSecureErrorMessage('Error adding post: ' + error.message);
                            }
                        } else if (retries >= maxRetries) {
                            clearInterval(checkBlogApp);
                            console.error('blogApp not available after retries');
                            showSecureErrorMessage('Error: Blog app not available. Please refresh the page and try again.');
                        }
                    }, 100);
                }

                // Re-enable button
                setTimeout(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Publish Post';
                    }
                }, 2000);
            });
        } else {
            console.error('Form not found: securePostForm');
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
        // Skip rendering if dropdown was removed
        if (!postsDropdown) {
            return;
        }
    });
    
    console.log(`Loaded ${navigationData.length} posts to navigation menu`);
}

async function fetchNewPostsFileList() {
    if (Array.isArray(window.NEW_POST_FILES) && window.NEW_POST_FILES.length > 0) {
        return window.NEW_POST_FILES;
    }

    const manifestCandidates = [
        `${NEW_POSTS_DIR}newposts-index.json`,
        `${NEW_POSTS_DIR}manifest.json`,
        `${NEW_POSTS_DIR}posts.json`
    ];

    for (const manifestUrl of manifestCandidates) {
        try {
            const manifestResponse = await fetch(manifestUrl, { cache: 'no-store' });
            if (manifestResponse.ok) {
                const manifestData = await manifestResponse.json();
                if (Array.isArray(manifestData)) {
                    return manifestData;
                }
                if (manifestData && Array.isArray(manifestData.files)) {
                    return manifestData.files;
                }
            }
        } catch (error) {
            if (error?.name !== 'TypeError') {
                console.warn(`Unable to load newposts manifest ${manifestUrl}:`, error);
            }
        }
    }

    try {
        const directoryResponse = await fetch(NEW_POSTS_DIR, { cache: 'no-store' });
        if (directoryResponse.ok) {
            const directoryHtml = await directoryResponse.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(directoryHtml, 'text/html');
            const linkHrefs = Array.from(doc.querySelectorAll('a[href]'))
                .map(link => link.getAttribute('href'))
                .filter(href => href && href.toLowerCase().endsWith('.txt'));

            if (linkHrefs.length > 0) {
                return linkHrefs.map(href => {
                    if (href.startsWith('http://') || href.startsWith('https://')) {
                        return href;
                    }
                    if (href.startsWith('/')) {
                        return `${NEW_POSTS_DIR}${href.slice(1)}`;
                    }
                    return `${NEW_POSTS_DIR}${href}`;
                });
            }
        }
    } catch (error) {
        console.warn('Unable to list newposts directory:', error);
    }

    return [];
}

async function loadPostFromFile(fileEntry) {
    try {
        const entryPath = typeof fileEntry === 'string'
            ? fileEntry
            : fileEntry?.path || fileEntry?.file || '';

        if (!entryPath) {
            return null;
        }

        const normalizedPath = entryPath.startsWith('http://') || entryPath.startsWith('https://')
            ? entryPath
            : `${NEW_POSTS_DIR}${entryPath.replace(/^\.?\/?newposts\/?/, '')}`;

        const response = await fetch(normalizedPath, { cache: 'no-store' });
        if (!response.ok) {
            console.warn(`Failed to load post file ${normalizedPath}: ${response.status}`);
            return null;
        }

        const rawText = (await response.text()).trim();
        if (!rawText) {
            return null;
        }

        const parsed = JSON.parse(rawText);
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        if (!parsed.title || !parsed.content) {
            console.warn(`Post missing required fields in ${normalizedPath}.`);
            return null;
        }

        if (!parsed.id) {
            parsed.id = `newpost-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        }

        parsed.date = parsed.date ? new Date(parsed.date).toISOString() : new Date().toISOString();

        return parsed;
    } catch (error) {
        console.error('Error loading post file:', fileEntry, error);
        return null;
    }
}

async function loadNewPostsFromFolder() {
    if (!window.blogApp) {
        return;
    }

    try {
        const fileEntries = await fetchNewPostsFileList();
        if (!fileEntries || fileEntries.length === 0) {
            console.log('No newposts files detected.');
            return;
        }

        const loadedPosts = [];
        for (const entry of fileEntries) {
            const post = await loadPostFromFile(entry);
            if (post) {
                loadedPosts.push(post);
            }
        }

        if (loadedPosts.length === 0) {
            console.log('No valid JSON posts loaded from newposts directory.');
            return;
        }

        blogApp.posts = Array.isArray(blogApp.posts) ? blogApp.posts : [];
        const existingIds = new Set(blogApp.posts.map(post => post.id));
        let addedCount = 0;

        loadedPosts.forEach(post => {
            if (!existingIds.has(post.id)) {
                blogApp.posts.unshift(post);
                existingIds.add(post.id);
                addedCount += 1;
            }
        });

        if (addedCount > 0) {
            blogApp.savePosts();
            blogApp.renderPosts();
            blogApp.updateFooterStats();
            console.log(`Loaded ${addedCount} post(s) from newposts directory.`);
        } else {
            console.log('All posts from newposts directory were already present.');
        }
    } catch (error) {
        console.error('Unable to load posts from newposts directory:', error);
    }
}

function setupArchiveInteractions() {
    const archivesList = document.getElementById('archivesList');
    if (!archivesList || archivesList.dataset.bound === 'true') {
        return;
    }

    archivesList.addEventListener('click', (event) => {
        const link = event.target.closest('.archive-post-link');
        if (!link) return;

        event.preventDefault();
        const postId = link.dataset.postId;
        if (window.blogApp && typeof window.blogApp.scrollToPost === 'function') {
            window.blogApp.scrollToPost(postId);
        }
    });

    archivesList.dataset.bound = 'true';
}

// Expose functions to window object for inline onclick handlers
// This ensures functions are available globally
window.openAddPostModal = openAddPostModal;
window.closeAddPostModal = closeAddPostModal;
window.generateSecureCaptcha = generateSecureCaptcha;
window.showPostTerms = showPostTerms;


// Search functionality
window.focusSearchInput = focusSearchInput;
window.scrollToPosts = scrollToPosts;

// Navigation management
window.addPostToNavigation = addPostToNavigation;
window.scrollToPost = (postId) => {
    if (window.blogApp && typeof window.blogApp.scrollToPost === 'function') {
        window.blogApp.scrollToPost(postId);
    }
};

console.log('Blog app loaded! Available commands:');
console.log('- blogApp.clearAllPosts() - Clear all posts');
console.log('- blogApp.exportPosts() - Export posts as JSON');
console.log('- blogApp.importPosts(file) - Import posts from JSON file');
console.log('- openAddPostModal() - Open secure post creation modal');
