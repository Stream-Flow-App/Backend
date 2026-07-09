# Frontend API Utilities Documentation

This document outlines the API utility functions implemented on the frontend (located in `client/src/utils/`). These utilities abstract the `axios` calls, handle error intercepts, ensure JWT cookies are injected into requests, and transform backend responses into the exact shape required by the React context.

## 1. Core Configuration (`apiUtils.js` & `authUtils.js`)

All requests flow through two central `axios` instances:
- **`api`**: Used for public routes (e.g., fetching public audio).
- **`authApi`**: Used for authenticated routes. It explicitly sets `withCredentials: true` to ensure that the browser attaches the JWT `httpOnly` cookie to every request. It also includes an interceptor that listens for `401 Unauthorized` errors and automatically dispatches a global `auth:logout` event to clear the user's session.

---

## 2. Audio & Data Fetching (`apiUtils.js`)

### `fetchSongs()`
- **Purpose:** Fetches the public catalog of songs.
- **Backend Route:** `GET /api/audios`
- **Transformation:** Automatically pipes the response through `transformApiSongs()`, which normalizes MongoDB `_id` to `id`, fixes absolute server file paths to web-relative URLs, and ensures the raw duration milliseconds are converted to `MM:SS` format for the UI.

### `fetchSongById(songId)`
- **Purpose:** Fetches a single public song and applies the same transformations.
- **Backend Route:** `GET /api/audios/:id`

---

## 3. Authentication & Profile (`authUtils.js`)

### `registerUser(userData, profileImg)`
- **Purpose:** Creates a new account. Dynamically switches to a `multipart/form-data` payload if an image file is provided.
- **Backend Route:** `POST /api/users/register`

### `loginUser(credentials)`
- **Purpose:** Authenticates the user. The backend attaches the JWT via an `httpOnly` cookie. The frontend extracts the public user JSON and stores it in `localStorage` for immediate rehydration on refresh.
- **Backend Route:** `POST /api/users/login`

### `logoutUser()`
- **Purpose:** Destroys the session. Instructs the backend to clear the JWT cookie, wipes `localStorage`, and triggers the `auth:logout` event to kick the user back to the login screen.
- **Backend Route:** `POST /api/users/logout`

### `fetchUserProfile()`
- **Purpose:** Fetches the authenticated user's private data. Crucially, this returns the populated `lastPlayback` state to instantly synchronize the global `AudioPlayer` upon login.
- **Backend Route:** `GET /api/users/profile/data`

### `updateProfile(profileData, profileImg)`
- **Purpose:** Updates user details. Only sends the fields actively provided. This utility seamlessly powers both the `ProfilePage` (Name, Username, Avatar) and the `SettingsPage` (Phone) without them overwriting each other.
- **Backend Route:** `PUT /api/users/profile`

### `changePassword(oldPassword, newPassword)`
- **Purpose:** Facilitates in-app secure password changing.
- **Backend Route:** `PUT /api/users/change-password`

### `syncPlaybackState(songId, currentTime)`
- **Purpose:** Fires silently in the background (throttled every 30s or on pause) to save the user's exact listening timestamp to the database, enabling cross-device resume.
- **Backend Route:** `PUT /api/users/playback-state`

### `toggleFavorite(songId)` / `fetchFavorites()`
- **Purpose:** Manages the user's liked songs library.
- **Backend Routes:** `POST /api/users/favorites/:songId`, `GET /api/users/favorites`

---

## 4. Playlist Management (`playlistUtils.js`)

### `fetchUserPlaylists()`
- **Purpose:** Fetches all playlists owned by the authenticated user, automatically running all nested audio tracks through `transformApiSong()`.
- **Backend Route:** `GET /api/playlists/me`

### `createPlaylist({ name, description, isPublic })`
- **Purpose:** Creates a new playlist container.
- **Backend Route:** `POST /api/playlists`

### `addSongToPlaylist(playlistId, songId)` / `removeSongFromPlaylist(playlistId, songId)`
- **Purpose:** Dynamically pushes or pulls a song from the `audio` array of a specific playlist.
- **Backend Routes:** `POST /api/playlists/:id/songs`, `DELETE /api/playlists/:id/songs/:songId`

---

## 5. Artist Applications & Notifications

While most of our fetch logic is abstracted in the `client/src/utils/` folder, the newly introduced Artist Applications and Notification systems are designed to be self-contained within their respective components (`ArtistApplicationForm.jsx`, `AdminApplicationsList.jsx`, and `NotificationBell.jsx`).

### Artist Application
- **Submit Application:** Uses `POST /api/applications/apply`. Sends `bio`, `socialLinks`, and `portfolioLinks`.
- **Check Status:** Uses `GET /api/applications/mine` when the `ArtistApplicationForm` mounts to see if the user is already pending or rejected.
- **Admin Review:** Uses `GET /api/applications/admin` to populate the `AdminApplicationsList`, and `PATCH /api/applications/admin/:id/review` to accept or reject them.

### Notifications
- **Fetch Unread/Read:** The `NotificationBell` component automatically queries `GET /api/notifications` every 60 seconds (or on manual open) to pull down the user's latest in-app alerts.
- **Marking as Read:** Uses `PATCH /api/notifications/:id/read` to individually mark notifications, or `PATCH /api/notifications/read-all` to clear the entire queue.
