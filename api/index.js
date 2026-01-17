const fs = require('fs').promises;
const path = require('path');

// For Vercel serverless functions, we use /tmp for writable storage
const DATA_DIR = path.join('/tmp', 'scronth-data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        try {
            await fs.access(POSTS_FILE);
        } catch {
            await fs.writeFile(POSTS_FILE, JSON.stringify([], null, 2));
        }
    } catch (error) {
        console.error('Error setting up data directory:', error);
    }
}

// Read posts from file
async function readPosts() {
    try {
        const data = await fs.readFile(POSTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading posts:', error);
        return [];
    }
}

// Write posts to file
async function writePosts(posts) {
    try {
        const data = JSON.stringify(posts, null, 2);
        await fs.writeFile(POSTS_FILE, data, 'utf8');
        console.log(`💾 Saved ${posts.length} posts`);
        return true;
    } catch (error) {
        console.error('❌ Error writing posts:', error);
        return false;
    }
}

// Main serverless function handler
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    await ensureDataDir();
    
    const url = req.url || req.path || '';
    
    // Health check
    if (url === '/api/health' || url === '/health') {
        return res.json({ status: 'ok', message: 'Scronth server is running' });
    }
    
    // GET /api/posts
    if (url === '/api/posts' && req.method === 'GET') {
        try {
            const posts = await readPosts();
            posts.sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA;
            });
            console.log(`📬 Served ${posts.length} posts (PUBLIC)`);
            return res.json(posts);
        } catch (error) {
            console.error('Error getting posts:', error);
            return res.status(500).json({ error: 'Failed to get posts' });
        }
    }
    
    // POST /api/posts
    if (url === '/api/posts' && req.method === 'POST') {
        try {
            const { username, content, image } = req.body;
            
            if (!username) {
                return res.status(400).json({ error: 'Username is required' });
            }
            
            if (!content && !image) {
                return res.status(400).json({ error: 'Post must have content or image' });
            }
            
            const posts = await readPosts();
            const newPost = {
                id: Date.now().toString(),
                username: username,
                content: content || '',
                image: image || null,
                timestamp: new Date().toISOString(),
                blocked: false,
                likes: [],
                replies: [],
                views: 0
            };
            
            posts.push(newPost);
            const saved = await writePosts(posts);
            
            if (!saved) {
                return res.status(500).json({ error: 'Failed to save post to storage' });
            }
            
            console.log(`✅ New post created by ${username} (PUBLIC)`);
            return res.json({ success: true, post: newPost });
        } catch (error) {
            console.error('Error creating post:', error);
            return res.status(500).json({ error: 'Failed to create post' });
        }
    }
    
    // PUT /api/posts/:id
    if (url.startsWith('/api/posts/') && req.method === 'PUT') {
        try {
            const id = url.split('/').pop();
            const updates = req.body;
            
            const posts = await readPosts();
            const postIndex = posts.findIndex(p => p.id === id);
            
            if (postIndex === -1) {
                return res.status(404).json({ error: 'Post not found' });
            }
            
            posts[postIndex] = { ...posts[postIndex], ...updates };
            await writePosts(posts);
            
            return res.json({ success: true, post: posts[postIndex] });
        } catch (error) {
            console.error('Error updating post:', error);
            return res.status(500).json({ error: 'Failed to update post' });
        }
    }
    
    // DELETE /api/posts/:id
    if (url.startsWith('/api/posts/') && req.method === 'DELETE') {
        try {
            const id = url.split('/').pop();
            
            const posts = await readPosts();
            const filteredPosts = posts.filter(p => p.id !== id);
            
            if (posts.length === filteredPosts.length) {
                return res.status(404).json({ error: 'Post not found' });
            }
            
            await writePosts(filteredPosts);
            return res.json({ success: true });
        } catch (error) {
            console.error('Error deleting post:', error);
            return res.status(500).json({ error: 'Failed to delete post' });
        }
    }
    
    // 404 for unknown routes
    return res.status(404).json({ error: 'Not found' });
};
