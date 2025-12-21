// Simple authentication system using localStorage

// Initialize default admin account
function initializeUsers() {
    const users = getUsers();
    // Always set/reset scronth account password
    users['scronth'] = 'owneraccount135';
    saveUsers(users);
}

// Get all users from localStorage
function getUsers() {
    const users = localStorage.getItem('scronth_users');
    return users ? JSON.parse(users) : {};
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem('scronth_users', JSON.stringify(users));
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('scronth_logged_in') === 'true';
}

// Get current logged in username
function getCurrentUser() {
    return localStorage.getItem('scronth_current_user');
}

// Log in user
function login(username, password) {
    const users = getUsers();
    
    // Check if account is banned (need to check posts.js function)
    // We'll check this in the login form handler
    
    if (users[username] && users[username] === password) {
        localStorage.setItem('scronth_logged_in', 'true');
        localStorage.setItem('scronth_current_user', username);
        return true;
    }
    return false;
}

// Sign up new user
function signup(username, password) {
    const users = getUsers();
    
    if (users[username]) {
        return { success: false, message: 'Username already exists' };
    }
    
    if (username.length < 3) {
        return { success: false, message: 'Username must be at least 3 characters' };
    }
    
    if (password.length < 4) {
        return { success: false, message: 'Password must be at least 4 characters' };
    }
    
    users[username] = password;
    saveUsers(users);
    
    // Auto-login after signup
    localStorage.setItem('scronth_logged_in', 'true');
    localStorage.setItem('scronth_current_user', username);
    
    return { success: true };
}

// Log out user
function logout() {
    localStorage.removeItem('scronth_logged_in');
    localStorage.removeItem('scronth_current_user');
}

// Initialize users on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize default admin account
    initializeUsers();
});

// Handle login form - wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.auth-form');
    if (!form) return;
    
    const isSignup = form.querySelector('#new-username');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (isSignup) {
            // Sign up
            const username = document.getElementById('new-username').value.trim();
            const password = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Remove existing error message
            const existingError = form.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            if (password !== confirmPassword) {
                showError(form, 'Passwords do not match');
                return;
            }
            
            const result = signup(username, password);
            if (result.success) {
                window.location.href = 'index.html';
            } else {
                showError(form, result.message);
            }
        } else {
            // Log in
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            // Remove existing error message
            const existingError = form.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            if (login(username, password)) {
                // Check if account is banned
                if (typeof isBanned !== 'undefined' && isBanned(username)) {
                    showError(form, 'This account has been banned');
                    logout();
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                showError(form, 'Invalid username or password');
            }
        }
    });
});

// Show error message
function showError(form, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = '#cc0000';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.marginTop = '10px';
    errorDiv.style.padding = '8px';
    errorDiv.style.backgroundColor = '#ffe6e6';
    errorDiv.style.border = '1px solid #cc0000';
    errorDiv.style.borderRadius = '4px';
    form.appendChild(errorDiv);
}

// Update index page if logged in - wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    const isIndex = path.includes('index.html') || path === '/' || path.endsWith('/');
    
    if (isIndex && isLoggedIn()) {
        const currentUser = getCurrentUser();
        const infoText = document.querySelector('.info-text');
        const enterText = document.querySelector('.enter-text');
        
        if (infoText) {
            infoText.innerHTML = `<p>Welcome, ${currentUser}!</p>`;
        }
        
        if (enterText) {
            enterText.textContent = 'enter text here';
        }
        
        // Update nav to show logout
        const nav = document.querySelector('nav');
        if (nav) {
            nav.innerHTML = `
                <span class="nav-user">${currentUser}</span>
                <a href="#" class="nav-link" id="logout-link">log out</a>
            `;
            
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    logout();
                    window.location.reload();
                });
            }
        }
    }
});

