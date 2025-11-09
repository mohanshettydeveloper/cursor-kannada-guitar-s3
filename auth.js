// Authentication Management for Kannada Guitar Community

// Get current logged-in user
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) return null;
        
        const user = JSON.parse(userStr);
        
        // Check if session has expired (for remember me)
        if (user.expiryTime) {
            const expiryDate = new Date(user.expiryTime);
            if (new Date() > expiryDate) {
                logout();
                return null;
            }
        }
        
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Check if user is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Logout user
function logout() {
    localStorage.removeItem('currentUser');
    // Update navigation to reflect logout
    updateNavigation();
    // Redirect to home page if not already there
    if (window.location.pathname !== '/index.html' && !window.location.pathname.endsWith('/')) {
        window.location.href = 'index.html';
    }
}

// Update navigation based on login status
function updateNavigation() {
    const accountDropdown = document.querySelector('.nav-dropdown.account-dropdown');
    if (!accountDropdown) return;
    
    const dropdownMenu = accountDropdown.querySelector('.dropdown-menu');
    if (!dropdownMenu) return;
    
    const user = getCurrentUser();
    
    if (user) {
        // User is logged in - show Logout and Profile
        dropdownMenu.innerHTML = `
            <li><a href="profile.html" class="dropdown-link">👤 Profile</a></li>
            <li><a href="#" class="dropdown-link" onclick="event.preventDefault(); logout(); return false;">🚪 Logout</a></li>
        `;
        
        // Update dropdown trigger text
        const dropdownTrigger = accountDropdown.querySelector('.nav-link');
        if (dropdownTrigger) {
            dropdownTrigger.innerHTML = `👤 ${user.username} ▼`;
        }
    } else {
        // User is not logged in - show Login and Register
        dropdownMenu.innerHTML = `
            <li><a href="login.html" class="dropdown-link">🔐 Login</a></li>
            <li><a href="register.html" class="dropdown-link">📝 Register</a></li>
        `;
        
        // Update dropdown trigger text
        const dropdownTrigger = accountDropdown.querySelector('.nav-link');
        if (dropdownTrigger) {
            dropdownTrigger.innerHTML = `Account ▼`;
        }
    }
    
    // Show/hide "Add New Post" and "Create Post" links based on login status
    const addPostLinks = document.querySelectorAll('a[onclick*="openAddPostModal"]');
    addPostLinks.forEach(link => {
        if (user) {
            // Show link for logged-in users
            link.style.display = '';
            const parentLi = link.closest('li');
            if (parentLi) {
                parentLi.style.display = '';
            }
        } else {
            // Hide link for non-logged-in users
            link.style.display = 'none';
            // Keep parent visible if it has other content, but hide just the link
            const parentLi = link.closest('li');
            // Only hide parent if it only contains this link (or has minimal content)
            if (parentLi && parentLi.children.length === 1 && parentLi.textContent.trim() === link.textContent.trim()) {
                parentLi.style.display = 'none';
            }
        }
    });
}

// Show user profile - redirect to profile page
function showUserProfile() {
    const user = getCurrentUser();
    if (!user) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }
    
    // Redirect to profile page
    window.location.href = 'profile.html';
}

// Make functions available globally
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.logout = logout;
window.updateNavigation = updateNavigation;
window.showUserProfile = showUserProfile;

// Update navigation when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for DOM to be fully ready
    setTimeout(() => {
        updateNavigation();
    }, 100);
});

