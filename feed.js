// Feed display and interaction

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    const isIndex = path.includes('index.html') || path === '/' || path.endsWith('/');
    
    if (isIndex) {
        setupPostForm();
        loadFeed().catch(err => console.error('Error loading feed:', err));
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
    const postFormContainer = document.getElementById('post-form-container');
    const notLoggedIn = document.getElementById('not-logged-in');
    
    if (!postFormContainer) return;
    
    if (!isLoggedIn()) {
        if (notLoggedIn) {
            notLoggedIn.style.display = 'block';
        }
        postFormContainer.style.display = 'none';
        return;
    }
    
    // Check if user is banned - prevent posting
    const currentUser = getCurrentUser();
    if (isBanned(currentUser)) {
        if (notLoggedIn) {
            notLoggedIn.innerHTML = '<p style="color: #cc0000; font-weight: bold;">Your account has been banned. You cannot create posts.</p>';
            notLoggedIn.style.display = 'block';
        }
        postFormContainer.style.display = 'none';
        // Force logout banned users
        logout();
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        return;
    }
    
    // User is logged in and not banned - show post form
    if (notLoggedIn) {
        notLoggedIn.style.display = 'none';
    }
    postFormContainer.style.display = 'block';
    
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
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const content = document.getElementById('post-content').value.trim();
        const errorDiv = document.getElementById('post-error');
        
        if (content.length > 500) {
            errorDiv.textContent = 'Post is too long (max 500 characters)';
            errorDiv.style.display = 'block';
            return;
        }
        
        const result = await createPost(getCurrentUser(), content, imageData);
        
        if (result.success) {
            document.getElementById('post-content').value = '';
            imageInput.value = '';
            imageData = null;
            imagePreview.style.display = 'none';
            errorDiv.style.display = 'none';
            
            // Immediately reload feed to show new post
            console.log('Post created! Reloading feed...');
            await loadFeed();
        } else {
            errorDiv.textContent = result.message;
            errorDiv.style.display = 'block';
        }
    });
}

async function loadFeed() {
    const feed = document.getElementById('posts-feed');
    if (!feed) {
        console.error('Posts feed element not found!');
        return;
    }
    
    // Load feed for EVERYONE - posts are 100% PUBLIC!
    // No login required to view posts - THIS IS A REAL PUBLIC SYSTEM
    // Posts are stored in Firebase cloud - visible to ALL users across all devices!
    try {
        const allPosts = await getAllPosts();
        console.log('ALL POSTS FROM STORAGE:', allPosts);
        
        const visiblePosts = allPosts.filter(post => {
            if (!post) return false;
            if (post.blocked === true) return false;
            return true;
        });
        
        console.log('PUBLIC FEED LOADING - Total posts:', allPosts.length, 'Visible posts:', visiblePosts.length);
        console.log('Posts are PUBLIC - visible to everyone, no login required!');
        console.log('Posts stored in cloud - visible across all devices and browsers!');
        console.log('Visible posts:', visiblePosts);
        
        if (visiblePosts.length === 0) {
            feed.innerHTML = '<p class="no-posts">No posts yet. Be the first to post!</p>';
            return;
        }
        
        const currentUser = isLoggedIn() ? getCurrentUser() : null;
        const isCurrentUserAdmin = currentUser && isAdmin(currentUser);
        
        // Process posts asynchronously
        const postPromises = visiblePosts.map(async (post) => {
            // Track view for everyone
            if (post && post.id) {
                try {
                    await incrementViews(post.id);
                } catch (e) {
                    console.error('Error incrementing views:', e);
                }
            }
        
            const timestamp = post.timestamp ? formatTimestamp(post.timestamp) : 'recently';
            const imageHtml = post.image ? `<div class="post-image-container"><img src="${post.image}" alt="Post image" class="post-image"></div>` : '';
            const pfp = await getProfilePicture(post.username);
            const pfpHtml = pfp ? `<img src="${pfp}" alt="${post.username}" class="post-pfp">` : '<div class="post-pfp default-pfp"></div>';
            
            // Split content into title and body if it has multiple lines
            const contentLines = post.content ? post.content.split('\n') : [];
            const title = contentLines[0] || '';
            const body = contentLines.slice(1).join('\n') || '';
            
            // Get engagement counts
            const likes = post.likes ? post.likes.length : 0;
            const replies = post.replies ? post.replies.length : 0;
            const views = post.views || 0;
            const hasLikedPost = currentUser && await hasLiked(post.id, currentUser);
        
            const adminControls = isCurrentUserAdmin ? `
                <div class="admin-controls">
                    <button class="admin-delete-post-btn" data-post-id="${post.id}" title="Delete this post">🗑️</button>
                    <button class="admin-delete-user-btn" data-username="${post.username}" title="Delete this user">👤🗑️</button>
                </div>
            ` : '';
            
            const likeClass = hasLikedPost ? 'liked' : '';
            const likeButton = currentUser ? `<button class="like-btn ${likeClass}" data-post-id="${post.id}">👍</button>` : '<span class="engagement-icon">👍</span>';
            const replyButton = currentUser ? `<button class="reply-btn" data-post-id="${post.id}">💬</button>` : '<span class="engagement-icon">💬</span>';
            
            return `
                <div class="post-card" data-post-id="${post.id}">
                    <div class="post-header-new">
                        ${pfpHtml}
                        <div class="post-user-details">
                            <a href="profile.html?user=${post.username}" class="post-username-new">${post.username}</a>
                            ${title ? `<div class="post-title">${escapeHtml(title)}</div>` : ''}
                        </div>
                        ${adminControls}
                    </div>
                    ${body ? `<div class="post-body-text">${escapeHtml(body)}</div>` : ''}
                    ${imageHtml}
                    <div class="post-engagement">
                        <div class="engagement-item like-item">
                            ${likeButton}
                            <span class="engagement-count like-count">${formatNumber(likes)}</span>
                        </div>
                        <div class="engagement-item reply-item">
                            ${replyButton}
                            <span class="engagement-count reply-count">${formatNumber(replies)}</span>
                        </div>
                        <div class="engagement-item">
                            <span class="engagement-count">${formatNumber(views)}</span>
                            <span class="engagement-icon">👁</span>
                        </div>
                    </div>
                    <div class="replies-container" id="replies-${post.id}" style="display: none;"></div>
                    ${currentUser ? `
                        <div class="reply-form-container" id="reply-form-${post.id}" style="display: none;">
                            <textarea class="reply-input" placeholder="Write a reply..." rows="2"></textarea>
                            <button class="reply-submit-btn" data-post-id="${post.id}">Reply</button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        const postHtmls = await Promise.all(postPromises);
        feed.innerHTML = postHtmls.join('');
    
    // Setup admin delete post buttons
    if (isCurrentUserAdmin) {
        document.querySelectorAll('.admin-delete-post-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const postId = this.dataset.postId;
                if (confirm('Are you sure you want to DELETE this post permanently? This cannot be undone.')) {
                    if (await deletePost(postId)) {
                        await loadFeed();
                    }
                }
            });
        });
        
        // Setup admin delete user buttons
        document.querySelectorAll('.admin-delete-user-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const username = this.dataset.username;
                if (username === 'silas.palmer' || username === 'Scronth') {
                    alert('Cannot delete admin accounts');
                    return;
                }
                if (confirm(`Are you sure you want to DELETE the user "${username}" permanently? This will delete their account, all their posts, and cannot be undone.`)) {
                    if (await deleteUser(username)) {
                        alert(`User "${username}" has been deleted.`);
                        await loadFeed();
                    }
                }
            });
        });
    }
    
    // Setup like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const postId = this.dataset.postId;
            const currentUser = getCurrentUser();
            if (await toggleLike(postId, currentUser)) {
                await loadFeed();
            }
        });
    });
    
    // Setup reply buttons
    document.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const postId = this.dataset.postId;
            const replyForm = document.getElementById(`reply-form-${postId}`);
            const repliesContainer = document.getElementById(`replies-${postId}`);
            
            if (replyForm.style.display === 'none') {
                replyForm.style.display = 'block';
                await loadReplies(postId);
                repliesContainer.style.display = 'block';
            } else {
                replyForm.style.display = 'none';
                repliesContainer.style.display = 'none';
            }
        });
    });
    
    // Setup reply submit buttons
    document.querySelectorAll('.reply-submit-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const postId = this.dataset.postId;
            const replyInput = this.previousElementSibling;
            const content = replyInput.value.trim();
            
            if (!content) return;
            
            const currentUser = getCurrentUser();
            if (await addReply(postId, currentUser, content)) {
                replyInput.value = '';
                await loadFeed();
            }
        });
    });
    
    } catch (error) {
        console.error('Error loading feed:', error);
        feed.innerHTML = '<p class="no-posts">Error loading posts. Please refresh the page.</p>';
    }
}

async function loadReplies(postId) {
    const repliesContainer = document.getElementById(`replies-${postId}`);
    if (!repliesContainer) return;
    
    const replies = await getReplies(postId);
    if (replies.length === 0) {
        repliesContainer.innerHTML = '<div class="no-replies">No replies yet.</div>';
        return;
    }
    
    const replyPromises = replies.map(async (reply) => {
        const timestamp = formatTimestamp(reply.timestamp);
        const pfp = await getProfilePicture(reply.username);
        const pfpHtml = pfp ? `<img src="${pfp}" alt="${reply.username}" class="reply-pfp">` : '<div class="reply-pfp default-pfp"></div>';
        
        return `
            <div class="reply-item">
                ${pfpHtml}
                <div class="reply-content">
                    <a href="profile.html?user=${reply.username}" class="reply-username">${reply.username}</a>
                    <div class="reply-text">${escapeHtml(reply.content)}</div>
                    <div class="reply-time">${timestamp}</div>
                </div>
            </div>
        `;
    });
    
    const replyHtmls = await Promise.all(replyPromises);
    repliesContainer.innerHTML = replyHtmls.join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

