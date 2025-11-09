// Comments Management System for Kannada Guitar Community

class CommentsManager {
    constructor() {
        this.comments = this.loadComments();
    }

    // Load all comments from localStorage
    loadComments() {
        try {
            const saved = localStorage.getItem('blogComments');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading comments:', error);
            return {};
        }
    }

    // Save comments to localStorage
    saveComments() {
        try {
            localStorage.setItem('blogComments', JSON.stringify(this.comments));
        } catch (error) {
            console.error('Error saving comments:', error);
        }
    }

    // Get comments for a specific post
    getCommentsForPost(postId) {
        return this.comments[postId] || [];
    }

    // Add a comment to a post
    addComment(postId, commentText, userId, userName, userEmail) {
        if (!postId || !commentText || !userId) {
            throw new Error('Missing required comment data');
        }

        // Initialize comments array for post if it doesn't exist
        if (!this.comments[postId]) {
            this.comments[postId] = [];
        }

        const comment = {
            id: Date.now().toString(),
            postId: postId,
            text: commentText.trim(),
            userId: userId,
            userName: userName,
            userEmail: userEmail,
            date: new Date().toISOString(),
            edited: false,
            editedAt: null
        };

        // Add comment to the beginning of the array (newest first)
        this.comments[postId].unshift(comment);
        this.saveComments();

        return comment;
    }

    // Delete a comment (only by the user who created it)
    deleteComment(postId, commentId, userId) {
        if (!this.comments[postId]) {
            return false;
        }

        const commentIndex = this.comments[postId].findIndex(
            c => c.id === commentId && c.userId === userId
        );

        if (commentIndex !== -1) {
            this.comments[postId].splice(commentIndex, 1);
            this.saveComments();
            return true;
        }

        return false;
    }

    // Get comment count for a post
    getCommentCount(postId) {
        return this.comments[postId] ? this.comments[postId].length : 0;
    }

    // Get total comments across all posts
    getTotalComments() {
        let total = 0;
        for (const postId in this.comments) {
            total += this.comments[postId].length;
        }
        return total;
    }
}

// Initialize comments manager
let commentsManager;
if (typeof window !== 'undefined') {
    commentsManager = new CommentsManager();
    window.commentsManager = commentsManager;
}

// Render comments for a post
function renderComments(postId) {
    const commentsContainer = document.getElementById(`comments-container-${postId}`);
    if (!commentsContainer) return;

    const comments = commentsManager.getCommentsForPost(postId);
    const currentUser = getCurrentUser ? getCurrentUser() : null;

    if (comments.length === 0) {
        commentsContainer.innerHTML = `
            <div class="comments-empty">
                <p>No comments yet. Be the first to comment!</p>
            </div>
        `;
        return;
    }

    const commentsHTML = comments.map(comment => {
        const commentDate = new Date(comment.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const isOwnComment = currentUser && (currentUser.id === comment.userId || currentUser.username === comment.userId);

        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <div class="comment-avatar">${comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U'}</div>
                        <div class="comment-author-info">
                            <strong class="comment-author-name">${escapeHtml(comment.userName || 'Anonymous')}</strong>
                            <span class="comment-date">${commentDate}${comment.edited ? ' (edited)' : ''}</span>
                        </div>
                    </div>
                    ${isOwnComment ? `
                    <button class="comment-delete-btn" onclick="deleteComment('${postId}', '${comment.id}')" title="Delete comment">🗑️</button>
                    ` : ''}
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
            </div>
        `;
    }).join('');

    commentsContainer.innerHTML = commentsHTML;
}

// Render comment form for a post
function renderCommentForm(postId) {
    const formContainer = document.getElementById(`comment-form-container-${postId}`);
    if (!formContainer) return;

    const currentUser = getCurrentUser ? getCurrentUser() : null;

    if (!currentUser) {
        formContainer.innerHTML = `
            <div class="comment-login-prompt">
                <p>Please <a href="login.html">login</a> to add a comment.</p>
            </div>
        `;
        return;
    }

    formContainer.innerHTML = `
        <form class="comment-form" id="comment-form-${postId}" onsubmit="submitComment(event, '${postId}')">
            <div class="comment-form-header">
                <strong>Add a Comment</strong>
                <span class="comment-as-user">as ${escapeHtml(currentUser.fullName || currentUser.username || 'User')}</span>
            </div>
            <div class="form-group">
                <textarea 
                    id="comment-text-${postId}" 
                    name="comment" 
                    rows="3" 
                    placeholder="Write your comment here..." 
                    required
                    maxlength="1000"
                    class="comment-textarea"></textarea>
                <small class="comment-help">Maximum 1000 characters</small>
            </div>
            <div class="comment-form-actions">
                <button type="submit" class="btn-primary comment-submit-btn">Post Comment</button>
                <span class="comment-count-badge">${commentsManager.getCommentCount(postId)} ${commentsManager.getCommentCount(postId) === 1 ? 'comment' : 'comments'}</span>
            </div>
        </form>
    `;
}

// Submit a comment
async function submitComment(event, postId) {
    event.preventDefault();

    // Check if user is logged in
    const currentUser = getCurrentUser ? getCurrentUser() : null;
    if (!currentUser) {
        showCommentMessage('Please login to add a comment.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    // Rate limiting check
    if (!checkCommentRateLimit()) {
        return;
    }

    const commentTextarea = document.getElementById(`comment-text-${postId}`);
    const commentText = commentTextarea.value.trim();

    if (!commentText) {
        showCommentMessage('Please enter a comment.', 'error');
        return;
    }

    if (commentText.length < 3) {
        showCommentMessage('Comment must be at least 3 characters long.', 'error');
        return;
    }

    if (commentText.length > 1000) {
        showCommentMessage('Comment must be less than 1000 characters.', 'error');
        return;
    }

    // Check for spam keywords
    const spamKeywords = ['viagra', 'casino', 'lottery', 'winner', 'congratulations', 'click here', 'free money', 'bitcoin', 'crypto', 'buy now'];
    const commentLower = commentText.toLowerCase();
    if (spamKeywords.some(keyword => commentLower.includes(keyword))) {
        showCommentMessage('Comment contains inappropriate content.', 'error');
        return;
    }

    try {
        const userId = currentUser.id || currentUser.sub || currentUser.username;
        const userName = currentUser.fullName || currentUser.username || 'User';
        const userEmail = currentUser.email || '';

        commentsManager.addComment(postId, commentText, userId, userName, userEmail);

        // Clear form
        commentTextarea.value = '';

        // Re-render comments
        renderComments(postId);
        renderCommentForm(postId);

        // Update comment count in post actions
        updateCommentCount(postId);

        showCommentMessage('Comment posted successfully!', 'success');

        // Update rate limiting
        updateCommentRateLimit();
    } catch (error) {
        console.error('Error adding comment:', error);
        showCommentMessage('Error posting comment. Please try again.', 'error');
    }
}

// Delete a comment
async function deleteComment(postId, commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }

    const currentUser = getCurrentUser ? getCurrentUser() : null;
    if (!currentUser) {
        showCommentMessage('Please login to delete comments.', 'error');
        return;
    }

    const userId = currentUser.id || currentUser.sub || currentUser.username;
    const deleted = commentsManager.deleteComment(postId, commentId, userId);

    if (deleted) {
        renderComments(postId);
        renderCommentForm(postId);
        updateCommentCount(postId);
        showCommentMessage('Comment deleted successfully.', 'success');
    } else {
        showCommentMessage('You can only delete your own comments.', 'error');
    }
}

// Update comment count display
function updateCommentCount(postId) {
    const count = commentsManager.getCommentCount(postId);
    const countBadges = document.querySelectorAll(`[data-comment-count="${postId}"]`);
    countBadges.forEach(badge => {
        badge.textContent = `${count} ${count === 1 ? 'comment' : 'comments'}`;
    });
}

// Comment rate limiting
let commentSubmissionCount = 0;
let lastCommentSubmissionTime = 0;
const COMMENT_RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_COMMENTS_PER_WINDOW = 5; // 5 comments per minute

function checkCommentRateLimit() {
    const now = Date.now();

    if (now - lastCommentSubmissionTime > COMMENT_RATE_LIMIT_WINDOW) {
        commentSubmissionCount = 0;
    }

    if (commentSubmissionCount >= MAX_COMMENTS_PER_WINDOW) {
        const remainingTime = Math.ceil((COMMENT_RATE_LIMIT_WINDOW - (now - lastCommentSubmissionTime)) / 1000);
        showCommentMessage(`Too many comments. Please wait ${remainingTime} seconds before commenting again.`, 'error');
        return false;
    }

    return true;
}

function updateCommentRateLimit() {
    commentSubmissionCount++;
    lastCommentSubmissionTime = Date.now();
}

// Show comment messages
function showCommentMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `comment-message comment-message-${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 10);

    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize comments when page loads
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a bit to ensure auth.js is loaded
        setTimeout(() => {
            // Render comments for all posts on the page
            const postCards = document.querySelectorAll('.post-card[data-id]');
            postCards.forEach(card => {
                const postId = card.getAttribute('data-id');
                if (postId) {
                    renderComments(postId);
                    renderCommentForm(postId);
                }
            });
        }, 100);
    });

    // Re-render comment forms when auth state changes (if auth.js updates navigation)
    // This is a workaround - ideally auth.js would dispatch an event
    const originalUpdateNavigation = window.updateNavigation;
    if (originalUpdateNavigation) {
        window.updateNavigation = function() {
            originalUpdateNavigation();
            // Re-render all comment forms after auth state change
            setTimeout(() => {
                const postCards = document.querySelectorAll('.post-card[data-id]');
                postCards.forEach(card => {
                    const postId = card.getAttribute('data-id');
                    if (postId) {
                        renderCommentForm(postId);
                    }
                });
            }, 100);
        };
    }
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.renderComments = renderComments;
    window.renderCommentForm = renderCommentForm;
    window.submitComment = submitComment;
    window.deleteComment = deleteComment;
    window.updateCommentCount = updateCommentCount;
}

