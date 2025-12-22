// Profile page functionality

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const profileUser = urlParams.get('user');
    
    if (!profileUser) {
        window.location.href = 'index.html';
        return;
    }
    
    loadProfile(profileUser).then(() => {
        loadUserPosts(profileUser);
    });
    updateNav();
});

function updateNav() {
    if (isLoggedIn()) {
        const currentUser = getCurrentUser();
        const nav = document.querySelector('nav');
        if (nav) {
            nav.innerHTML = `
                <a href="index.html" class="nav-link">home</a>
                <a href="profile.html?user=${currentUser}" class="nav-link">${currentUser}</a>
                <a href="settings.html" class="nav-link">settings</a>
                <a href="#" class="nav-link" id="logout-link">log out</a>
            `;
            
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    logout();
                    window.location.href = 'index.html';
                });
            }
        }
    }
}

async function loadProfile(username) {
    // Check if user is banned
    if (isBanned(username)) {
        document.getElementById('profile-content').innerHTML = '<p class="banned-message">This account has been banned.</p>';
        document.getElementById('profile-posts').innerHTML = '';
        return;
    }
    
    const profile = await getUserProfile(username);
    const currentUser = isLoggedIn() ? getCurrentUser() : null;
    const isOwnProfile = isLoggedIn() && currentUser === username;
    const isFollowing = isLoggedIn() && profile.followers.includes(currentUser);
    const pfp = getProfilePicture(username);
    const pfpHtml = pfp ? `<img src="${pfp}" alt="${username}" class="profile-pfp-large">` : '<div class="profile-pfp-large default-pfp"></div>';
    const adminBadge = isAdmin(username) ? '<span class="admin-badge">ADMIN</span>' : '';
    const banButton = isLoggedIn() && isAdmin(currentUser) && !isOwnProfile ? `<button id="ban-user-btn" class="submit-btn ban-btn">Ban User</button>` : '';
    const adminMessage = getProfileMessage(username);
    const adminMessageHtml = adminMessage ? `<div class="profile-admin-message">${escapeHtml(adminMessage)}</div>` : '';
    
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `
        <div class="profile-header">
            <div class="profile-pfp-section">
                ${pfpHtml}
            </div>
            <div class="profile-info">
                <h2 class="profile-username">${username} ${adminBadge}</h2>
                ${adminMessageHtml}
                <div class="profile-actions">
                    ${!isOwnProfile && isLoggedIn() ? `
                        <button id="follow-btn" class="submit-btn follow-btn" data-following="${isFollowing}">
                            ${isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                    ` : ''}
                    ${banButton}
                </div>
            </div>
        </div>
        <div class="profile-stats">
            <div class="stat-item">
                <div class="stat-number">${profile.posts}</div>
                <div class="stat-label">Posts</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${profile.followers.length}</div>
                <div class="stat-label">Followers</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${profile.following.length}</div>
                <div class="stat-label">Following</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${profile.friends.length}</div>
                <div class="stat-label">Friends</div>
            </div>
        </div>
    `;
    
    // Setup ban button
    const banBtn = document.getElementById('ban-user-btn');
    if (banBtn) {
        banBtn.addEventListener('click', function() {
            if (confirm(`Are you sure you want to ban ${username}?`)) {
                if (banAccount(username)) {
                    alert(`${username} has been banned.`);
                    window.location.href = 'index.html';
                }
            }
        });
    }
    
    // Setup follow button
    const followBtn = document.getElementById('follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', function() {
            const isFollowing = followBtn.dataset.following === 'true';
            if (isFollowing) {
                unfollowUser(currentUser, username);
                followBtn.textContent = 'Follow';
                followBtn.dataset.following = 'false';
            } else {
                followUser(currentUser, username);
                followBtn.textContent = 'Unfollow';
                followBtn.dataset.following = 'true';
            }
            loadProfile(username).then(() => {
                loadUserPosts(username);
            }); // Reload to update stats
        });
    }
    
    // Load user's posts
    loadUserPosts(username);
}

async function loadUserPosts(username) {
    const postsContainer = document.getElementById('profile-posts');
    const posts = await getPostsByUser(username);
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<p class="no-posts">No posts yet.</p>';
        return;
    }
    
    const postPromises = posts.map(async (post) => {
        const timestamp = formatTimestamp(post.timestamp);
        const imageHtml = post.image ? `<div class="post-image-container"><img src="${post.image}" alt="Post image" class="post-image"></div>` : '';
        const contentHtml = post.content ? `<div class="post-content">${escapeHtml(post.content)}</div>` : '';
        const pfp = await getProfilePicture(post.username);
        const pfpHtml = pfp ? `<img src="${pfp}" alt="${post.username}" class="post-pfp">` : '<div class="post-pfp default-pfp"></div>';
        
        // Initialize post data if needed
        if (!post.likes) post.likes = [];
        if (!post.replies) post.replies = [];
        if (!post.views) post.views = 0;
        return `
            <div class="post-item">
                <div class="post-header">
                    <div class="post-user-info">
                        ${pfpHtml}
                        <a href="profile.html?user=${post.username}" class="post-username">${post.username}</a>
                    </div>
                    <span class="post-time">${timestamp}</span>
                </div>
                ${contentHtml}
                ${imageHtml}
            </div>
        `;
    });
    
    const postHtmls = await Promise.all(postPromises);
    postsContainer.innerHTML = postHtmls.join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

