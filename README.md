<div align="center">
  <img src="logo.png" alt="Stream Flow Logo" width="150" height="150" style="border-radius: 20px;">
  <h1>Stream Flow - Server</h1>
  <p>A robust Node.js backend API for the Stream Flow music streaming platform.</p>
</div>

## Overview
The Stream Flow backend handles all core business logic, database management, file storage integrations, and user authentication. It serves as a secure RESTful API layer interacting seamlessly with the React frontend.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **File Storage:** Cloudinary (Audio and Image uploads)
- **Authentication:** JSON Web Tokens (JWT)
- **Security:** bcrypt.js for password hashing

## Core Features
- **Authentication & Roles:** JWT-based auth with explicit `user`, `artist`, and `admin` roles.
- **Robust Search API:** Dedicated endpoints allowing powerful global queries to search across users (artists), albums, and individual audio tracks.
- **Audio Management:** Secure handling of file uploads to Cloudinary.
- **Playlists:** Users can create, update, and delete custom playlists.
- **Admin Tools:** Extensive endpoints for managing tracks, moderating users, and handling flagged content.

## API Documentation
The `/_docs/` folder contains comprehensive documentation for the system's endpoints:
- `FULL_API_REFERENCE.md`
- `audio_api_docs.md`
- `auth_api_documentation.md`
- `profile_api_docs.md`
- `playlist_api_docs.md`

## Getting Started
1. `npm install`
2. Create a `.env` file referencing `.env.example`
3. `npm run dev` (uses nodemon)