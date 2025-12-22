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

// Get all posts - uses Firebase if available, falls back to localStorage
async function getAllPosts() {
    // Try Firebase first (cloud storage - visible to all users)
    if (isFirebaseAvailable()) {
        try {
            const snapshot = await db.collection('posts').orderBy('timestamp', 'desc').get();
            const posts = [];
            snapshot.forEach(doc => {
                posts.push({ id: doc.id, ...doc.data() });
            });
            console.log('Loaded posts from Firebase (cloud storage - visible to all users):', posts.length);
            return posts;
        } catch (error) {
            console.error('Error loading from Firebase:', error);
            console.log('Falling back to localStorage');
            // Fall back to localStorage
        }
    }
    
    // Fallback to localStorage (browser-specific)
    try {
        const postsData = localStorage.getItem('scronth_posts');
        const posts = postsData ? JSON.parse(postsData) : [];
        console.log('Loaded posts from localStorage:', posts.length);
        return posts;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return [];
    }
}

// Save posts - uses Firebase if available, falls back to localStorage
async function savePosts(posts) {
    // Try Firebase first (cloud storage - visible to all users)
    if (isFirebaseAvailable()) {
        try {
            // Save each post to Firebase
            const batch = db.batch();
            posts.forEach(post => {
                const postRef = db.collection('posts').doc(post.id);
                batch.set(postRef, {
                    username: post.username,
                    content: post.content,
                    image: post.image,
                    timestamp: post.timestamp || new Date().toISOString(),
                    blocked: post.blocked || false,
                    likes: post.likes || [],
                    replies: post.replies || [],
                    views: post.views || 0
                });
            });
            await batch.commit();
            console.log('Saved posts to Firebase (cloud storage - visible to all users)');
            return;
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            // Fall back to localStorage
        }
    }
    
    // Fallback to localStorage
    localStorage.setItem('scronth_posts', JSON.stringify(posts));
}

// Create a new post
async function createPost(username, content, imageData = null) {
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
    
    // Save to Firebase (cloud) if available - makes it visible to ALL users
    if (isFirebaseAvailable()) {
        try {
            await db.collection('posts').doc(newPost.id).set({
                username: newPost.username,
                content: newPost.content,
                image: newPost.image,
                timestamp: newPost.timestamp,
                blocked: newPost.blocked,
                likes: newPost.likes,
                replies: newPost.replies,
                views: newPost.views
            });
            console.log('Post saved to Firebase cloud storage - visible to ALL users!');
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            // Fall back to localStorage
            const posts = await getAllPosts();
            posts.unshift(newPost);
            await savePosts(posts);
        }
    } else {
        // Fallback to localStorage
        const posts = await getAllPosts();
        posts.unshift(newPost);
        await savePosts(posts);
    }
    
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

// Delete a post permanently
async function deletePost(postId) {
    if (isFirebaseAvailable()) {
        try {
            await db.collection('posts').doc(postId).delete();
            console.log('Post deleted from Firebase');
            return true;
        } catch (error) {
            console.error('Error deleting post from Firebase:', error);
        }
    }
    
    const posts = await getAllPosts();
    const filteredPosts = posts.filter(p => p.id !== postId);
    await savePosts(filteredPosts);
    return true;
}

// Delete a user account permanently
async function deleteUser(username) {
    if (username === 'silas.palmer' || username === 'Scronth') return false; // Can't delete admins
    
    if (isFirebaseAvailable()) {
        try {
            // Delete all posts by this user from Firebase
            const postsSnapshot = await db.collection('posts').where('username', '==', username).get();
            const batch = db.batch();
            postsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            
            // Delete profile
            await db.collection('profiles').doc(username).delete();
            
            console.log('User deleted from Firebase');
        } catch (error) {
            console.error('Error deleting user from Firebase:', error);
        }
    }
    
    // Remove from users
    const users = getUsers();
    delete users[username];
    saveUsers(users);
    
    // Remove from profiles
    const profiles = localStorage.getItem('scronth_profiles');
    const allProfiles = profiles ? JSON.parse(profiles) : {};
    delete allProfiles[username];
    localStorage.setItem('scronth_profiles', JSON.stringify(allProfiles));
    
    // Delete all their posts
    const posts = await getAllPosts();
    const filteredPosts = posts.filter(p => p.username !== username);
    await savePosts(filteredPosts);
    
    // Remove from banned list if there
    const banned = localStorage.getItem('scronth_banned');
    const bannedList = banned ? JSON.parse(banned) : [];
    const newBannedList = bannedList.filter(u => u !== username);
    localStorage.setItem('scronth_banned', JSON.stringify(newBannedList));
    
    // Remove from admin list if there
    const admins = localStorage.getItem('scronth_admins');
    const adminList = admins ? JSON.parse(admins) : [];
    const newAdminList = adminList.filter(u => u !== username);
    localStorage.setItem('scronth_admins', JSON.stringify(newAdminList));
    
    // Log out if they're currently logged in
    if (getCurrentUser() === username) {
        logout();
    }
    
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
async function hasLiked(postId, username) {
    if (!username) return false;
    
    if (isFirebaseAvailable()) {
        try {
            const postDoc = await db.collection('posts').doc(postId).get();
            if (!postDoc.exists) return false;
            const post = postDoc.data();
            return post.likes && post.likes.includes(username);
        } catch (error) {
            console.error('Error checking like in Firebase:', error);
        }
    }
    
    const posts = await getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (!post || !post.likes) return false;
    return post.likes.includes(username);
}

// Add reply to post
async function addReply(postId, username, content) {
    if (!username || !content.trim()) return false;
    
    const reply = {
        id: Date.now().toString(),
        username: username,
        content: content.trim(),
        timestamp: new Date().toISOString()
    };
    
    if (isFirebaseAvailable()) {
        try {
            const postRef = db.collection('posts').doc(postId);
            const postDoc = await postRef.get();
            if (!postDoc.exists) return false;
            
            const post = postDoc.data();
            const replies = post.replies || [];
            replies.push(reply);
            
            await postRef.update({ replies: replies });
            return true;
        } catch (error) {
            console.error('Error adding reply in Firebase:', error);
        }
    }
    
    const posts = await getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return false;
    
    // Initialize if needed
    if (!post.replies) post.replies = [];
    
    post.replies.push(reply);
    await savePosts(posts);
    return true;
}

// Get replies for a post
async function getReplies(postId) {
    if (isFirebaseAvailable()) {
        try {
            const postDoc = await db.collection('posts').doc(postId).get();
            if (!postDoc.exists) return [];
            const post = postDoc.data();
            return post.replies || [];
        } catch (error) {
            console.error('Error getting replies from Firebase:', error);
        }
    }
    
    const posts = await getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (!post || !post.replies) return [];
    return post.replies;
}

// Increment view count for a post
async function incrementViews(postId) {
    if (isFirebaseAvailable()) {
        try {
            const postRef = db.collection('posts').doc(postId);
            await postRef.update({
                views: firebase.firestore.FieldValue.increment(1)
            });
            return;
        } catch (error) {
            console.error('Error incrementing views in Firebase:', error);
        }
    }
    
    const posts = await getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    if (!post.views) post.views = 0;
    post.views++;
    await savePosts(posts);
}

// Format number (e.g., 15000 -> 15K)
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
}

