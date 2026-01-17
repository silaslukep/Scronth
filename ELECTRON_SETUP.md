# Electron App Setup

This application has been configured to run as an Electron desktop app.

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the Electron app:
   ```bash
   npm start
   ```
   or
   ```bash
   npm run electron
   ```

## Running the Server (Optional)

If you want to use the local server API (instead of or in addition to Firebase), you can run:

```bash
npm run server
```

Then run the Electron app in development mode by setting:
```bash
set NODE_ENV=development
npm start
```

This will load the app from `https://scronth.com` instead of loading the HTML file directly.

## Building for Distribution

To build distributable packages (Windows, macOS, Linux), you can use electron-builder:

1. Install electron-builder:
   ```bash
   npm install --save-dev electron-builder
   ```

2. Build:
   ```bash
   npm run build
   ```

Note: The app works with Firebase and localStorage, so the server is optional. The Electron app will work fine without running the server.




