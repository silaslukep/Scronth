const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for image data
app.use(express.static(__dirname)); // Serve static files (HTML, CSS, JS)

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        // Initialize posts.json if it doesn't exist
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
        console.log(`💾 Saved ${posts.length} posts to ${POSTS_FILE}`);
        return true;
    } catch (error) {
        console.error('❌ Error writing posts:', error);
        console.error('Error details:', error.message, error.stack);
        return false;
    }
}

// API Routes

// GET /api/posts - Get all posts (PUBLIC - accessible to everyone)
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await readPosts();
        // Sort by timestamp descending (newest first)
        posts.sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeB - timeA;
        });
        // Return all posts (client-side will filter blocked posts)
        // This is PUBLIC - all posts are accessible to everyone
        console.log(`📬 Served ${posts.length} posts (PUBLIC)`);
        res.json(posts);
    } catch (error) {
        console.error('Error getting posts:', error);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});

// POST /api/posts - Create a new post (PUBLIC - anyone can post)
app.post('/api/posts', async (req, res) => {
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
            console.error('❌ Failed to save post to file!');
            return res.status(500).json({ error: 'Failed to save post to storage' });
        }
        
        console.log(`✅ New post created by ${username} (PUBLIC) - Saved to ${POSTS_FILE}`);
        res.json({ success: true, post: newPost });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// PUT /api/posts/:id - Update a post (for likes, replies, etc.)
app.put('/api/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const posts = await readPosts();
        const postIndex = posts.findIndex(p => p.id === id);
        
        if (postIndex === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Merge updates with existing post
        posts[postIndex] = { ...posts[postIndex], ...updates };
        await writePosts(posts);
        
        res.json({ success: true, post: posts[postIndex] });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// DELETE /api/posts/:id - Delete a post
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const posts = await readPosts();
        const filteredPosts = posts.filter(p => p.id !== id);
        
        if (posts.length === filteredPosts.length) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        await writePosts(filteredPosts);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Scronth server is running' });
});

// Root route - serve index.html
app.get('/', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const indexPath = path.join(__dirname, 'index.html');
        const html = await fs.readFile(indexPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Error loading page');
    }
});

// Explicit routes for HTML files (for Vercel compatibility)
app.get('/signup.html', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const html = await fs.readFile(path.join(__dirname, 'signup.html'), 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        res.status(404).send('Page not found');
    }
});

app.get('/login.html', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const html = await fs.readFile(path.join(__dirname, 'login.html'), 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        res.status(404).send('Page not found');
    }
});

// Static files are handled by express.static middleware above

// Start server
async function startServer() {
    await ensureDataDir();
    
    // Bind to 0.0.0.0 to allow network access (optional, localhost works for local dev)
    const HOST = '0.0.0.0';
    
    app.listen(PORT, HOST, () => {
        console.log('='.repeat(50));
        console.log(`🚀 Scronth Server Running`);
        console.log('='.repeat(50));
        console.log(`📍 Local:    http://localhost:${PORT}`);
        console.log(`📍 Network:  http://${getLocalIP()}:${PORT}`);
        console.log(`📁 Posts:    ${POSTS_FILE}`);
        console.log(`🌐 Status:   PUBLIC - All posts are accessible to everyone!`);
        console.log('='.repeat(50));
        console.log(`Press Ctrl+C to stop the server`);
    });
}

// Get local IP address for network access
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// For Vercel deployment - export the app
module.exports = async (req, res) => {
    await ensureDataDir();
    return app(req, res);
};

// For local development - only run if not on Vercel
if (require.main === module) {
    startServer().catch(console.error);
}




