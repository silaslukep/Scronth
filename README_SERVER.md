# Running Scronth with Server (Public Posts)

This guide explains how to run Scronth with a backend server so posts are **PUBLIC** and visible to all users!

## Quick Start

### 1. Install Node.js
If you don't have Node.js installed:
- Download from: https://nodejs.org/
- Install it (choose LTS version)

### 2. Install Dependencies
Open terminal/PowerShell in the Scronth folder and run:
```bash
npm install
```

### 3. Start the Server
Run one of these commands:
```bash
npm start
```
OR
```bash
node server.js
```

### 4. Open Your Browser
Go to: **https://scronth.com**

That's it! Posts are now stored on the server and are **PUBLIC** - visible to all users!

## How It Works

- **Before**: Posts were stored in `localStorage` (only visible in the same browser)
- **After**: Posts are stored on the server in `data/posts.json` (visible to ALL users!)

## Server Details

- **Port**: 3000
- **Data Storage**: `data/posts.json`
- **API Endpoints**:
  - `GET /api/posts` - Get all posts
  - `POST /api/posts` - Create a new post
  - `PUT /api/posts/:id` - Update a post (likes, replies, etc.)
  - `DELETE /api/posts/:id` - Delete a post

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Troubleshooting

**Port already in use?**
- Change the PORT in `server.js` (line 5) to a different number (e.g., 3001, 8080)
- Then access the app at `http://localhost:YOUR_PORT`

**Posts not showing?**
- Make sure the server is running
- Check the browser console for errors
- Verify `data/posts.json` exists and contains posts





