// Posts and content filtering system

// Content filter - AI-like detection for mean, violent, or swear words
const blockedWords = [
    // Swear words (as whole words only)
    'damn', 'hell', 'crap', 'piss', 'ass', 'bitch', 'bastard', 'dick', 'fuck', 'shit',
    // Mean/violent words
    'kill', 'murder', 'die', 'hate', 'stupid', 'idiot', 'moron', 'dumb', 'ugly', 'fat',
    'attack', 'fight', 'hurt', 'destroy', 'violence', 'weapon', 'gun', 'knife', 'bomb', 'gng', 'sybau'
];

function filterContent(text) {
    const lowerText = text.toLowerCase();
    
    // Use word boundaries to match whole words only
    // This prevents "hell" from matching "hello", "shell", etc.
    for (let word of blockedWords) {
        // Create regex pattern with word boundaries
        // \b matches word boundaries (start/end of word)
        const wordPattern = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        if (wordPattern.test(lowerText)) {
            return { blocked: true, reason: 'Content contains inappropriate language' };
        }
    }
    return { blocked: false };
}

// Get all posts from localStorage
function getAllPosts() {
    const posts = localStorage.getItem('scronth_posts');
    return posts ? JSON.parse(posts) : [];
}

// Save posts to localStorage
function savePosts(posts) {
    localStorage.setItem('scronth_posts', JSON.stringify(posts));
}

// Create a new post
function createPost(username, content, imageData = null) {
    // Only filter text content if there is text
    if (content && content.trim()) {
        const filterResult = filterContent(content);
        if (filterResult.blocked) {
            return { success: false, message: filterResult.reason };
        }
    }
    
    // Must have either text or image
    if (!content.trim() && !imageData) {
        return { success: false, message: 'Please enter text or attach a photo' };
    }
    
    const posts = getAllPosts();
    const newPost = {
        id: Date.now().toString(),
        username: username,
        content: content || '',
        image: imageData || null,
        timestamp: new Date().toISOString(),
        blocked: false,
        likes: [],
        replies: [],
        views: 0
    };
    
    posts.unshift(newPost); // Add to beginning
    savePosts(posts);
    
    // Update user's post count
    updateUserPostCount(username);
    
    return { success: true, post: newPost };
}

// Get posts by username
function getPostsByUser(username) {
    const posts = getAllPosts();
    return posts.filter(post => post.username === username && !post.blocked);
}

// Get profile picture
function getProfilePicture(username) {
    const profile = getUserProfile(username);
    return profile.profilePicture || null;
}

// Check if user is admin
function isAdmin(username) {
    if (username === 'silas.palmer' || username === 'Scronth') return true; // Always admin
    const admins = localStorage.getItem('scronth_admins');
    const adminList = admins ? JSON.parse(admins) : [];
    return adminList.includes(username);
}

// Set admin status
function setAdminStatus(username, adminStatus) {
    const admins = localStorage.getItem('scronth_admins');
    let adminList = admins ? JSON.parse(admins) : [];
    
    if (adminStatus) {
        if (!adminList.includes(username)) {
            adminList.push(username);
        }
    } else {
        // Can't remove silas.palmer's or Scronth's admin status
        if (username === 'silas.palmer' || username === 'Scronth') return false;
        adminList = adminList.filter(u => u !== username);
    }
    
    localStorage.setItem('scronth_admins', JSON.stringify(adminList));
    return true;
}

// Check if account is banned
function isBanned(username) {
    const banned = localStorage.getItem('scronth_banned');
    const bannedList = banned ? JSON.parse(banned) : [];
    return bannedList.includes(username);
}

// Ban an account
function banAccount(username) {
    if (username === 'silas.palmer' || username === 'Scronth') return false; // Can't ban admins
    const banned = localStorage.getItem('scronth_banned');
    const bannedList = banned ? JSON.parse(banned) : [];
    
    if (!bannedList.includes(username)) {
        bannedList.push(username);
        localStorage.setItem('scronth_banned', JSON.stringify(bannedList));
        
        // Log out the banned user if they're currently logged in
        if (getCurrentUser() === username) {
            logout();
        }
    }
    return true;
}

// Unban an account
function unbanAccount(username) {
    const banned = localStorage.getItem('scronth_banned');
    const bannedList = banned ? JSON.parse(banned) : [];
    
    const newList = bannedList.filter(u => u !== username);
    localStorage.setItem('scronth_banned', JSON.stringify(newList));
    return true;
}

// Ban a post
function banPost(postId) {
    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) return false;
    
    post.blocked = true;
    savePosts(posts);
    return true;
}

// Get user profile data
function getUserProfile(username) {
    const profiles = localStorage.getItem('scronth_profiles');
    const allProfiles = profiles ? JSON.parse(profiles) : {};
    
    if (!allProfiles[username]) {
        allProfiles[username] = {
            username: username,
            followers: [],
            following: [],
            friends: [],
            posts: 0,
            profilePicture: null,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('scronth_profiles', JSON.stringify(allProfiles));
    }
    
    // Update post count
    const userPosts = getPostsByUser(username);
    allProfiles[username].posts = userPosts.length;
    localStorage.setItem('scronth_profiles', JSON.stringify(allProfiles));
    
    return allProfiles[username];
}

// Update user post count
function updateUserPostCount(username) {
    const profiles = localStorage.getItem('scronth_profiles');
    const allProfiles = profiles ? JSON.parse(profiles) : {};
    
    if (!allProfiles[username]) {
        allProfiles[username] = {
            username: username,
            followers: [],
            following: [],
            friends: [],
            posts: 0,
            createdAt: new Date().toISOString()
        };
    }
    
    const userPosts = getPostsByUser(username);
    allProfiles[username].posts = userPosts.length;
    localStorage.setItem('scronth_profiles', JSON.stringify(allProfiles));
}

// Follow a user
function followUser(follower, following) {
    if (follower === following) return { success: false, message: 'Cannot follow yourself' };
    
    const profiles = localStorage.getItem('scronth_profiles');
    const allProfiles = profiles ? JSON.parse(profiles) : {};
    
    // Initialize profiles if needed
    if (!allProfiles[follower]) {
        allProfiles[follower] = {
            username: follower,
            followers: [],
            following: [],
            friends: [],
            posts: 0,
            createdAt: new Date().toISOString()
        };
    }
    if (!allProfiles[following]) {
        allProfiles[following] = {
            username: following,
            followers: [],
            following: [],
            friends: [],
            posts: 0,
            createdAt: new Date().toISOString()
        };
    }
    
    // Add to following list
    if (!allProfiles[follower].following.includes(following)) {
        allProfiles[follower].following.push(following);
    }
    
    // Add to followers list
    if (!allProfiles[following].followers.includes(follower)) {
        allProfiles[following].followers.push(follower);
    }
    
    // Check if mutual follow (friends)
    if (allProfiles[following].following.includes(follower)) {
        if (!allProfiles[follower].friends.includes(following)) {
            allProfiles[follower].friends.push(following);
        }
        if (!allProfiles[following].friends.includes(follower)) {
            allProfiles[following].friends.push(follower);
        }
    }
    
    localStorage.setItem('scronth_profiles', JSON.stringify(allProfiles));
    return { success: true };
}

// Unfollow a user
function unfollowUser(follower, following) {
    const profiles = localStorage.getItem('scronth_profiles');
    const allProfiles = profiles ? JSON.parse(profiles) : {};
    
    if (allProfiles[follower] && allProfiles[follower].following.includes(following)) {
        allProfiles[follower].following = allProfiles[follower].following.filter(u => u !== following);
    }
    
    if (allProfiles[following] && allProfiles[following].followers.includes(follower)) {
        allProfiles[following].followers = allProfiles[following].followers.filter(u => u !== follower);
    }
    
    // Remove from friends if needed
    if (allProfiles[follower] && allProfiles[follower].friends.includes(following)) {
        allProfiles[follower].friends = allProfiles[follower].friends.filter(u => u !== following);
    }
    if (allProfiles[following] && allProfiles[following].friends.includes(follower)) {
        allProfiles[following].friends = allProfiles[following].friends.filter(u => u !== follower);
    }
    
    localStorage.setItem('scronth_profiles', JSON.stringify(allProfiles));
    return { success: true };
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

// Profile messages (admin notes on profiles)
function setProfileMessage(username, message) {
    const profiles = localStorage.getItem('scronth_profiles');
    const allProfiles = profiles ? JSON.parse(profiles) : {};
    
    if (!allProfiles[username]) {
        allProfiles[username] = getUserProfile(username);
    }
    
    allProfiles[username].adminMessage = message || null;
    localStorage.setItem('scronth_profiles', JSON.stringify(allProfiles));
    return true;
}

function getProfileMessage(username) {
    const profile = getUserProfile(username);
    return profile.adminMessage || null;
}

// Like/Unlike a post
function toggleLike(postId, username) {
    if (!username) return false;
    
    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return false;
    
    // Initialize if needed
    if (!post.likes) post.likes = [];
    
    const index = post.likes.indexOf(username);
    if (index > -1) {
        post.likes.splice(index, 1); // Unlike
    } else {
        post.likes.push(username); // Like
    }
    
    savePosts(posts);
    return true;
}

// Check if user liked a post
function hasLiked(postId, username) {
    if (!username) return false;
    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (!post || !post.likes) return false;
    return post.likes.includes(username);
}

// Add reply to post
function addReply(postId, username, content) {
    if (!username || !content.trim()) return false;
    
    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return false;
    
    // Initialize if needed
    if (!post.replies) post.replies = [];
    
    const reply = {
        id: Date.now().toString(),
        username: username,
        content: content.trim(),
        timestamp: new Date().toISOString()
    };
    
    post.replies.push(reply);
    savePosts(posts);
    return true;
}

// Get replies for a post
function getReplies(postId) {
    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (!post || !post.replies) return [];
    return post.replies;
}

// Increment view count for a post
function incrementViews(postId) {
    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    if (!post.views) post.views = 0;
    post.views++;
    savePosts(posts);
}

// Format number (e.g., 15000 -> 15K)
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
}

