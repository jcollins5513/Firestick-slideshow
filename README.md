# Firestick Slideshow Web App

A browser-based slideshow app for Firestick and other smart TVs. Supports:
- Short video clips (e.g., MP4)
- 360 images (panoramic JPEG/PNG)
- Standard images (JPEG/PNG)

## Features
- Select media files from device or USB
- Slideshow with play/pause, next/previous controls
- 360 image viewer
- Remote-friendly UI
- Optional inventory slideshow fed from Redis/Neon

## Getting Started
1. Open the app in your Firestick or TV browser (Silk, Firefox, etc).
2. Use the file picker to select images/videos.
3. Use remote or keyboard to navigate the slideshow.
4. (Optional) Copy your dealership GLB/GLTF model to `public/dealership.glb` so it renders behind the billboard screen.

## Local Development
```sh
npm install
npm run server &
npm start
# Start backend server for inventory feed
npm run start-server
```

### Environment Variables

Create a `.env` file in the project root to configure the backend:

```
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgres://user:password@localhost:5432/dbname
PORT=5000
```

The server reads `NEON_DB_URL` or `REDIS_URL` from a `.env` file to load
inventory data. The React app fetches `/inventory` on startup and uses the
returned list of `{name, url, type}` records as a slideshow group.

---
