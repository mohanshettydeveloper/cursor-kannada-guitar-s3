#!/usr/bin/env node

/**
 * Node.js script to automatically generate HTML files for posts in the guitartabs folder
 * This script reads posts from localStorage export or a JSON file and creates HTML files
 * 
 * Usage:
 *   1. Export posts from browser: blogApp.exportPosts() (saves as blog-posts.json)
 *   2. Run this script: node generate-posts.js blog-posts.json
 */

const fs = require('fs');
const path = require('path');

// Ensure guitartabs folder exists
const guitartabsDir = path.join(__dirname, 'guitartabs');
if (!fs.existsSync(guitartabsDir)) {
    fs.mkdirSync(guitartabsDir, { recursive: true });
    console.log('Created guitartabs folder');
}

// Function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Extract YouTube video ID
function extractYouTubeVideoId(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }
    
    url = url.trim();
    
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

// Get post template
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
        "headline": {{POST_TITLE_JSON}},
        "description": {{POST_DESCRIPTION_JSON}},
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
                                <li><a href="#" class="dropdown-link" onclick="openAddPostModal()">Add New Post</a></li>
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

// Generate HTML file for a post
function generatePostHTMLFile(postData) {
    // Create safe filename
    const safeTitle = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
    
    const filename = `post-${postData.id}-${safeTitle}.html`;
    const filepath = path.join(guitartabsDir, filename);
    
    // Format date
    const postDate = new Date(postData.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const isoDate = new Date(postData.date).toISOString();
    
    // Generate video HTML
    let videoHTML = '';
    if (postData.youtubeUrl) {
        const videoId = extractYouTubeVideoId(postData.youtubeUrl);
        if (videoId && videoId.length === 11) {
            videoHTML = `
                <div class="post-video">
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}" 
                        title="YouTube video player" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                        allowfullscreen>
                    </iframe>
                </div>
            `;
        }
    }
    
    // Generate tags HTML
    let tagsHTML = '';
    if (postData.tags) {
        const tags = postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        if (tags.length > 0) {
            const tagsHTMLContent = tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
            tagsHTML = `<div class="post-tags">${tagsHTMLContent}</div>`;
        }
    }
    
    // Generate SEO content
    const postDescription = postData.content.length > 160 
        ? postData.content.substring(0, 157).trim() + '...'
        : postData.content;
    
    const postTags = postData.tags ? postData.tags.split(',').map(t => t.trim()).join(', ') : '';
    const seoKeywords = `kannada guitar, ಕನ್ನಡ ಗಿಟಾರ್, ${postTags}, guitar lessons in kannada, kannada music, guitar tutorials kannada, learn guitar kannada, kannada guitar songs, guitar tabs kannada, kannada guitar community, guitar classes bangalore, kannada guitar teacher, guitar learning kannada, kannada guitar chords, guitar lessons bangalore, kannada music lessons`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '');
    
    const canonicalUrl = `https://kannadaguitar.com/guitartabs/post-${postData.id}-${safeTitle}.html`;
    
    // Generate video structured data
    const videoId = postData.youtubeUrl ? extractYouTubeVideoId(postData.youtubeUrl) : null;
    const ogVideoTags = videoId ? `
    <meta property="og:video" content="https://www.youtube.com/watch?v=${videoId}">
    <meta property="og:video:url" content="https://www.youtube.com/watch?v=${videoId}">
    <meta property="og:video:type" content="text/html">
    <meta property="og:video:width" content="1280">
    <meta property="og:video:height" content="720">` : '';
    
    const videoStructuredData = videoId ? `,
        "video": {
            "@type": "VideoObject",
            "name": ${JSON.stringify(postData.title)},
            "description": ${JSON.stringify(postDescription)},
            "thumbnailUrl": "https://img.youtube.com/vi/${videoId}/maxresdefault.jpg",
            "uploadDate": "${isoDate}",
            "contentUrl": "https://www.youtube.com/watch?v=${videoId}",
            "embedUrl": "https://www.youtube.com/embed/${videoId}"
        }` : '';
    
    // Get template
    const templateContent = getPostTemplate();
    
    // Replace placeholders
    const authorName = postData.authorName || postData.authorUsername || 'Anonymous';

    const htmlContent = templateContent
        .replace(/\{\{POST_TITLE\}\}/g, escapeHtml(postData.title))
        .replace(/\{\{POST_TITLE_JSON\}\}/g, JSON.stringify(postData.title))
        .replace(/\{\{POST_DATE\}\}/g, postDate)
        .replace(/\{\{POST_DATE_ISO\}\}/g, isoDate)
        .replace(/\{\{POST_CONTENT\}\}/g, escapeHtml(postData.content))
        .replace(/\{\{POST_VIDEO\}\}/g, videoHTML)
        .replace(/\{\{POST_TAGS\}\}/g, tagsHTML)
        .replace(/\{\{POST_DESCRIPTION\}\}/g, escapeHtml(postDescription))
        .replace(/\{\{POST_DESCRIPTION_JSON\}\}/g, JSON.stringify(postDescription))
        .replace(/\{\{POST_KEYWORDS\}\}/g, escapeHtml(seoKeywords))
        .replace(/\{\{POST_CANONICAL_URL\}\}/g, canonicalUrl)
        .replace(/\{\{POST_OG_VIDEO\}\}/g, ogVideoTags)
        .replace(/\{\{POST_VIDEO_STRUCTURED_DATA\}\}/g, videoStructuredData)
        .replace(/\{\{POST_ID\}\}/g, postData.id)
        .replace(/\{\{POST_AUTHOR\}\}/g, escapeHtml(authorName));
    
    // Write file
    fs.writeFileSync(filepath, htmlContent, 'utf8');
    console.log(`✓ Generated: ${filename}`);
    
    return filename;
}

// Main function
function main() {
    const args = process.argv.slice(2);
    let postsFile = args[0] || 'blog-posts.json';
    
    // If no file specified, try to read from common locations
    if (!fs.existsSync(postsFile)) {
        postsFile = path.join(__dirname, 'blog-posts.json');
        if (!fs.existsSync(postsFile)) {
            console.error('Error: blog-posts.json file not found.');
            console.log('\nUsage:');
            console.log('  1. In browser console, run: blogApp.exportPosts()');
            console.log('  2. Save the downloaded blog-posts.json file to this directory');
            console.log('  3. Run: node generate-posts.js\n');
            process.exit(1);
        }
    }
    
    console.log(`Reading posts from: ${postsFile}`);
    
    try {
        const postsData = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
        const posts = Array.isArray(postsData) ? postsData : [];
        
        if (posts.length === 0) {
            console.log('No posts found in the file.');
            return;
        }
        
        console.log(`Found ${posts.length} post(s). Generating HTML files...\n`);
        
        let generated = 0;
        posts.forEach(post => {
            try {
                generatePostHTMLFile(post);
                generated++;
            } catch (error) {
                console.error(`Error generating file for post "${post.title}":`, error.message);
            }
        });
        
        console.log(`\n✓ Successfully generated ${generated} HTML file(s) in guitartabs folder!`);
    } catch (error) {
        console.error('Error reading or processing posts file:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { generatePostHTMLFile, extractYouTubeVideoId, escapeHtml };








