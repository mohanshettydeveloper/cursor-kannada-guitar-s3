# Automatic Post HTML Generation

This guide explains how to automatically generate HTML files for your posts in the `guitartabs` folder.

## Why This is Needed

Browser JavaScript cannot directly write files to your server's file system for security reasons. However, you can use the Node.js script provided to automatically generate all post HTML files.

## Quick Start

### Method 1: Using npm script (Recommended)

1. **Export your posts from the browser:**
   - Open the browser console (F12)
   - Run: `blogApp.exportPosts()`
   - This will download `blog-posts.json`

2. **Save the JSON file:**
   - Save `blog-posts.json` to your project root directory

3. **Generate HTML files:**
   ```bash
   npm run generate-posts
   ```

All post HTML files will be automatically created in the `guitartabs` folder!

### Method 2: Using Node.js directly

```bash
node generate-posts.js blog-posts.json
```

## What Gets Generated

For each post, the script creates:
- `guitartabs/post-{id}-{title}.html` - Individual post page with full SEO meta tags
- All files include proper relative paths (`../styles.css`, `../index.html`, etc.)
- Complete SEO optimization with "Kannada Guitar" keywords

## Features

- ✅ Automatic file generation in `guitartabs` folder
- ✅ SEO-optimized with Kannada Guitar meta tags
- ✅ Proper relative paths for CSS and images
- ✅ YouTube video embedding support
- ✅ Structured data (JSON-LD) for search engines
- ✅ Open Graph and Twitter Card meta tags

## Troubleshooting

If you get an error that `blog-posts.json` is not found:
1. Make sure you exported posts using `blogApp.exportPosts()`
2. Save the downloaded file to the project root directory
3. Run the script again

## Manual Alternative

If you prefer to save files manually:
1. When creating a post, the file will download automatically
2. Save the downloaded HTML file to the `guitartabs` folder
3. The file is already configured with correct paths



