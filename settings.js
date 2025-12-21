// Account settings page

document.addEventListener('DOMContentLoaded', function() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    loadSettings();
    updateNav();
    setupAdminPanel();
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

function loadSettings() {
    const currentUser = getCurrentUser();
    const profile = getUserProfile(currentUser);
    const profilePicture = profile.profilePicture || null;
    
    const settingsContent = document.getElementById('settings-content');
    settingsContent.innerHTML = `
        <div class="settings-section">
            <h3 class="section-title">Profile Picture</h3>
            <div class="pfp-section">
                <div class="pfp-preview">
                    <img id="pfp-preview-img" src="${profilePicture || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2QzZDNkMyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+8J+RiDwvdGV4dD48L3N2Zz4='}" alt="Profile Picture" class="pfp-display">
                </div>
                <div class="pfp-upload">
                    <label for="pfp-upload-input" class="image-upload-label">
                        <span class="upload-icon">📷</span> Change Profile Picture
                    </label>
                    <input type="file" id="pfp-upload-input" accept="image/*" style="display: none;">
                    <button type="button" id="remove-pfp-btn" class="submit-btn remove-pfp-btn" style="display: ${profilePicture ? 'inline-block' : 'none'};">Remove Picture</button>
                </div>
                <div id="pfp-message" class="settings-message" style="display: none;"></div>
            </div>
        </div>
    `;
    
    setupPfpUpload();
    
    // Show admin panel if user is admin
    if (isAdmin(currentUser)) {
        document.getElementById('admin-panel').style.display = 'block';
    }
}

function setupPfpUpload() {
    const pfpInput = document.getElementById('pfp-upload-input');
    const pfpPreview = document.getElementById('pfp-preview-img');
    const removePfpBtn = document.getElementById('remove-pfp-btn');
    const pfpMessage = document.getElementById('pfp-message');
    
    if (!pfpInput) return;
    
    pfpInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 2MB for profile pictures)
            if (file.size > 2 * 1024 * 1024) {
                showPfpMessage('Image is too large. Maximum size is 2MB.', 'error');
                pfpInput.value = '';
                return;
            }
            
            // Check file type
            if (!file.type.startsWith('image/')) {
                showPfpMessage('Please select an image file.', 'error');
                pfpInput.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = e.target.result;
                saveProfilePicture(getCurrentUser(), imageData);
                pfpPreview.src = imageData;
                removePfpBtn.style.display = 'inline-block';
                showPfpMessage('Profile picture updated!', 'success');
            };
            reader.readAsDataURL(file);
        }
    });
    
    removePfpBtn.addEventListener('click', function() {
        removeProfilePicture(getCurrentUser());
        pfpPreview.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2QzZDNkMyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+8J+RiDwvdGV4dD48L3N2Zz4=';
        removePfpBtn.style.display = 'none';
        showPfpMessage('Profile picture removed!', 'success');
    });
}

function showPfpMessage(message, type) {
    const pfpMessage = document.getElementById('pfp-message');
    if (!pfpMessage) return;
    
    pfpMessage.textContent = message;
    pfpMessage.className = `settings-message ${type}`;
    pfpMessage.style.display = 'block';
    
    setTimeout(() => {
        pfpMessage.style.display = 'none';
    }, 3000);
}

function saveProfilePicture(username, imageData) {
    const profiles = localStorage.getItem('scronth_profiles');
    const allProfiles = profiles ? JSON.parse(profiles) : {};
    
    if (!allProfiles[username]) {
        allProfiles[username] = getUserProfile(username);
    }
    
    allProfiles[username].profilePicture = imageData;
    localStorage.setItem('scronth_profiles', JSON.stringify(allProfiles));
}

function removeProfilePicture(username) {
    const profiles = localStorage.getItem('scronth_profiles');
    const allProfiles = profiles ? JSON.parse(profiles) : {};
    
    if (allProfiles[username]) {
        allProfiles[username].profilePicture = null;
        localStorage.setItem('scronth_profiles', JSON.stringify(allProfiles));
    }
}

function setupAdminPanel() {
    const currentUser = getCurrentUser();
    if (!isAdmin(currentUser)) return;
    
    // Ban account
    document.getElementById('ban-btn').addEventListener('click', function() {
        const username = document.getElementById('ban-username').value.trim();
        if (!username) {
            showAdminMessage('Please enter a username', 'error');
            return;
        }
        if (username === 'silas.palmer') {
            showAdminMessage('Cannot ban silas.palmer', 'error');
            return;
        }
        if (banAccount(username)) {
            showAdminMessage(`Account "${username}" has been banned`, 'success');
            document.getElementById('ban-username').value = '';
        }
    });
    
    // Unban account
    document.getElementById('unban-btn').addEventListener('click', function() {
        const username = document.getElementById('unban-username').value.trim();
        if (!username) {
            showAdminMessage('Please enter a username', 'error');
            return;
        }
        if (unbanAccount(username)) {
            showAdminMessage(`Account "${username}" has been unbanned`, 'success');
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
    
    // Give admin
    document.getElementById('give-admin-btn').addEventListener('click', function() {
        const username = document.getElementById('admin-username').value.trim();
        if (!username) {
            showAdminMessage('Please enter a username', 'error');
            return;
        }
        if (setAdminStatus(username, true)) {
            showAdminMessage(`"${username}" is now an admin`, 'success');
            document.getElementById('admin-username').value = '';
        }
    });
    
    // Remove admin
    document.getElementById('remove-admin-btn').addEventListener('click', function() {
        const username = document.getElementById('remove-admin-username').value.trim();
        if (!username) {
            showAdminMessage('Please enter a username', 'error');
            return;
        }
        if (username === 'silas.palmer') {
            showAdminMessage('Cannot remove silas.palmer admin status', 'error');
            return;
        }
        if (setAdminStatus(username, false)) {
            showAdminMessage(`"${username}" is no longer an admin`, 'success');
            document.getElementById('remove-admin-username').value = '';
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
