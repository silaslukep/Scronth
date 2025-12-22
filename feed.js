// Feed display and interaction

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    const isIndex = path.includes('index.html') || path === '/' || path.endsWith('/');
    
    if (isIndex) {
        loadFeed();
        setupPostForm();
        updateNav();
    }
});

function updateNav() {
    if (isLoggedIn()) {
        const currentUser = getCurrentUser();
        const nav = document.querySelector('nav');
        if (nav) {
            const adminLink = isAdmin(currentUser) ? `<a href="admin.html" class="nav-link">admin</a>` : '';
            nav.innerHTML = `
                <a href="profile.html?user=${currentUser}" class="nav-link">${currentUser}</a>
                <a href="settings.html" class="nav-link">settings</a>
                ${adminLink}
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
    } else {
        const nav = document.querySelector('nav');
        if (nav) {
            nav.innerHTML = `
                <a href="login.html" class="nav-link">log in</a>
                <a href="signup.html" class="nav-link">sign up</a>
            `;
        }
    }
}

function setupPostForm() {
    if (!isLoggedIn()) {
        document.getElementById('not-logged-in').style.display = 'block';
        return;
    }
    
    // Check if user is banned - prevent posting
    const currentUser = getCurrentUser();
    if (isBanned(currentUser)) {
        document.getElementById('not-logged-in').innerHTML = '<p style="color: #cc0000; font-weight: bold;">Your account has been banned. You cannot create posts.</p>';
        document.getElementById('not-logged-in').style.display = 'block';
        document.getElementById('post-form-container').style.display = 'none';
        // Force logout banned users
        logout();
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        return;
    }
    
    document.getElementById('not-logged-in').style.display = 'none';
    document.getElementById('post-form-container').style.display = 'block';
    
    const form = document.getElementById('post-form');
    const imageInput = document.getElementById('post-image');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeImageBtn = document.getElementById('remove-image');
    let imageData = null;
    
    // Handle image selection
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image is too large. Maximum size is 5MB.');
                imageInput.value = '';
                return;
            }
            
            // Check file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.');
                imageInput.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                imageData = e.target.result;
                previewImg.src = imageData;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Remove image
    removeImageBtn.addEventListener('click', function() {
        imageInput.value = '';
        imageData = null;
        imagePreview.style.display = 'none';
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const content = document.getElementById('post-content').value.trim();
        const errorDiv = document.getElementById('post-error');
        
        if (content.length > 500) {
            errorDiv.textContent = 'Post is too long (max 500 characters)';
            errorDiv.style.display = 'block';
            return;
        }
        
        const result = createPost(getCurrentUser(), content, imageData);
        
        if (result.success) {
            document.getElementById('post-content').value = '';
            imageInput.value = '';
            imageData = null;
            imagePreview.style.display = 'none';
            errorDiv.style.display = 'none';
            loadFeed();
        } else {
            errorDiv.textContent = result.message;
            errorDiv.style.display = 'block';
        }
    });
}

function loadFeed() {
    const feed = document.getElementById('posts-feed');
    if (!feed) return;
    
    // Load feed for everyone - posts are public!
    const allPosts = getAllPosts();
    const visiblePosts = allPosts.filter(post => !post.blocked);
    
    if (visiblePosts.length === 0) {
        feed.innerHTML = '<p class="no-posts">No posts yet. Be the first to post!</p>';
        return;
    }
    
    const currentUser = isLoggedIn() ? getCurrentUser() : null;
    const isCurrentUserAdmin = currentUser && isAdmin(currentUser);
    
    feed.innerHTML = visiblePosts.map(post => {
        const timestamp = formatTimestamp(post.timestamp);
        const imageHtml = post.image ? `<div class="post-image-container"><img src="${post.image}" alt="Post image" class="post-image"></div>` : '';
        const contentHtml = post.content ? `<div class="post-content">${escapeHtml(post.content)}</div>` : '';
        const pfp = getProfilePicture(post.username);
        const pfpHtml = pfp ? `<img src="${pfp}" alt="${post.username}" class="post-pfp">` : '<div class="post-pfp default-pfp"></div>';
        const adminControls = isCurrentUserAdmin ? `<button class="ban-post-btn" data-post-id="${post.id}" title="Ban this post">×</button>` : '';
        return `
            <div class="post-item">
                <div class="post-header">
                    <div class="post-user-info">
                        ${pfpHtml}
                        <a href="profile.html?user=${post.username}" class="post-username">${post.username}</a>
                    </div>
                    <div class="post-header-right">
                        <span class="post-time">${timestamp}</span>
                        ${adminControls}
                    </div>
                </div>
                ${contentHtml}
                ${imageHtml}
            </div>
        `;
    }).join('');
    
    // Setup admin ban post buttons
    if (isCurrentUserAdmin) {
        document.querySelectorAll('.ban-post-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.dataset.postId;
                if (confirm('Are you sure you want to ban this post?')) {
                    if (banPost(postId)) {
                        loadFeed();
                    }
                }
            });
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

