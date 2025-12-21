// Admin panel functionality

document.addEventListener('DOMContentLoaded', function() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    const currentUser = getCurrentUser();
    if (!isAdmin(currentUser)) {
        window.location.href = 'index.html';
        return;
    }
    
    loadAdminPanel();
    updateNav();
});

function updateNav() {
    const currentUser = getCurrentUser();
    const navUser = document.getElementById('nav-user');
    const logoutLink = document.getElementById('logout-link');
    
    if (navUser) {
        navUser.innerHTML = `<a href="profile.html?user=${currentUser}" class="nav-link">${currentUser}</a>`;
    }
    if (logoutLink) {
        logoutLink.style.display = 'inline';
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
            window.location.href = 'index.html';
        });
    }
}

function loadAdminPanel() {
    const adminContent = document.getElementById('admin-content');
    adminContent.innerHTML = `
        <div class="admin-section">
            <h3 class="section-title">Give Admin</h3>
            <div class="admin-form">
                <input type="text" id="give-admin-username" placeholder="Username">
                <button type="button" class="submit-btn admin-btn" id="give-admin-btn">Give Admin</button>
            </div>
        </div>
        
        <div class="admin-section">
            <h3 class="section-title">Remove Admin</h3>
            <div class="admin-form">
                <input type="text" id="remove-admin-username" placeholder="Username">
                <button type="button" class="submit-btn admin-btn" id="remove-admin-btn">Remove Admin</button>
            </div>
        </div>
        
        <div class="admin-section">
            <h3 class="section-title">Ban User</h3>
            <div class="admin-form">
                <input type="text" id="ban-username" placeholder="Username">
                <button type="button" class="submit-btn admin-btn ban-btn" id="ban-btn">Ban User</button>
            </div>
        </div>
        
        <div class="admin-section">
            <h3 class="section-title">Unban User</h3>
            <div class="admin-form">
                <input type="text" id="unban-username" placeholder="Username">
                <button type="button" class="submit-btn admin-btn" id="unban-btn">Unban User</button>
            </div>
        </div>
        
        <div class="admin-section">
            <h3 class="section-title">Ban Post</h3>
            <div class="admin-form">
                <input type="text" id="ban-post-id" placeholder="Post ID">
                <button type="button" class="submit-btn admin-btn ban-btn" id="ban-post-btn">Ban Post</button>
            </div>
        </div>
        
        <div class="admin-section">
            <h3 class="section-title">Profile Message</h3>
            <div class="admin-form-vertical">
                <input type="text" id="message-username" placeholder="Username" style="margin-bottom: 10px;">
                <textarea id="profile-message" placeholder="Message to display on profile (leave empty to remove)" rows="3" style="margin-bottom: 10px;"></textarea>
                <button type="button" class="submit-btn admin-btn" id="set-message-btn">Set Message</button>
            </div>
        </div>
        
        <div id="admin-message" class="admin-message" style="display: none;"></div>
    `;
    
    setupAdminButtons();
}

function setupAdminButtons() {
    // Give admin
    document.getElementById('give-admin-btn').addEventListener('click', function() {
        const username = document.getElementById('give-admin-username').value.trim();
        if (!username) {
            showAdminMessage('Please enter a username', 'error');
            return;
        }
        if (setAdminStatus(username, true)) {
            showAdminMessage(`"${username}" is now an admin`, 'success');
            document.getElementById('give-admin-username').value = '';
        }
    });
    
    // Remove admin
    document.getElementById('remove-admin-btn').addEventListener('click', function() {
        const username = document.getElementById('remove-admin-username').value.trim();
        if (!username) {
            showAdminMessage('Please enter a username', 'error');
            return;
        }
        if (username === 'silas.palmer' || username === 'scronth') {
            showAdminMessage('Cannot remove admin status from this user', 'error');
            return;
        }
        if (setAdminStatus(username, false)) {
            showAdminMessage(`"${username}" is no longer an admin`, 'success');
            document.getElementById('remove-admin-username').value = '';
        }
    });
    
    // Ban user
    document.getElementById('ban-btn').addEventListener('click', function() {
        const username = document.getElementById('ban-username').value.trim();
        if (!username) {
            showAdminMessage('Please enter a username', 'error');
            return;
        }
        if (username === 'silas.palmer' || username === 'scronth') {
            showAdminMessage('Cannot ban this user', 'error');
            return;
        }
        if (banAccount(username)) {
            showAdminMessage(`"${username}" has been banned`, 'success');
            document.getElementById('ban-username').value = '';
        }
    });
    
    // Unban user
    document.getElementById('unban-btn').addEventListener('click', function() {
        const username = document.getElementById('unban-username').value.trim();
        if (!username) {
            showAdminMessage('Please enter a username', 'error');
            return;
        }
        if (unbanAccount(username)) {
            showAdminMessage(`"${username}" has been unbanned`, 'success');
            document.getElementById('unban-username').value = '';
        }
    });
    
    // Ban post
    document.getElementById('ban-post-btn').addEventListener('click', function() {
        const postId = document.getElementById('ban-post-id').value.trim();
        if (!postId) {
            showAdminMessage('Please enter a post ID', 'error');
            return;
        }
        if (banPost(postId)) {
            showAdminMessage(`Post "${postId}" has been banned`, 'success');
            document.getElementById('ban-post-id').value = '';
        } else {
            showAdminMessage('Post not found', 'error');
        }
    });
    
    // Set profile message
    document.getElementById('set-message-btn').addEventListener('click', function() {
        const username = document.getElementById('message-username').value.trim();
        const message = document.getElementById('profile-message').value.trim();
        
        if (!username) {
            showAdminMessage('Please enter a username', 'error');
            return;
        }
        
        if (setProfileMessage(username, message)) {
            if (message) {
                showAdminMessage(`Message set for "${username}"`, 'success');
            } else {
                showAdminMessage(`Message removed for "${username}"`, 'success');
            }
            document.getElementById('message-username').value = '';
            document.getElementById('profile-message').value = '';
        }
    });
}

function showAdminMessage(message, type) {
    const adminMessage = document.getElementById('admin-message');
    if (!adminMessage) return;
    
    adminMessage.textContent = message;
    adminMessage.className = `admin-message ${type}`;
    adminMessage.style.display = 'block';
    
    setTimeout(() => {
        adminMessage.style.display = 'none';
    }, 3000);
}

