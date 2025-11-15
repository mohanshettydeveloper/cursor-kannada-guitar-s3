const fs = require('fs/promises');
const path = require('path');

/**
 * Loads the contents of a text file inside the ./newposts directory.
 *
 * @param {string} filename - Name of the text file (e.g. "sample-post.txt").
 * @returns {Promise<string>} Resolves to the text content.
 */
async function loadNewPostContent(filename) {
  const filePath = path.resolve(__dirname, 'newposts', filename);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (err) {
    throw new Error(`Failed to read ${filePath}: ${err.message}`);
  }
}

// Example usage:
(async () => {
  try {
    const content = await loadNewPostContent('example-post.txt');
    console.log('Loaded content:', content);
    // Use `content` as needed (save to JSON, render template, etc.)
  } catch (error) {
    console.error(error.message);
  }
})();

module.exports = { loadNewPostContent };