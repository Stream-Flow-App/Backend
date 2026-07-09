# StreamFlow API Reference

> [!IMPORTANT]
> **Storage:** All media is stored on **Cloudinary**. URLs in the database are always `https://res.cloudinary.com/...` paths. Multer is used only as a temporary file parser before files are offloaded.

> [!NOTE]
> **Base URL:** `http://localhost:5000` (development). All route prefixes below are relative to this base.

This document is the official, comprehensive API Reference for the StreamFlow backend. Derived directly from the application source code.

---

## 🛡️ Architecture & Security

StreamFlow is built on **Node.js / Express.js**, using **MongoDB (Mongoose)** for data persistence.

### Security Middlewares

| Middleware | Purpose | Failure |
| :--- | :--- | :--- |
| `checkAuthenticated` | Guards protected routes. Reads JWT from `Authorization: Bearer <token>` header or `accessToken` cookie. Attaches `req.user`. Auto-rotates expired access tokens if a valid `refreshToken` cookie exists. | `401 Unauthorized` |
| `authorizeRoles(...roles)` | Restricts access by user role (`user`, `artist`, `moderator`, `admin`). | `403 Forbidden` |
| `validateRequest` | Catches `express-validator` errors and halts the request. | `400 Bad Request` |
| `optimizeImage` | Converts uploaded images to compressed `.webp` via `sharp`, updates `req.file`. | — |
| `validateObjectId` | Ensures `:id` path param is a valid MongoDB ObjectId. | `400 Bad Request` |
| `checkOptionalAuthenticated` | Same as `checkAuthenticated` but does not fail if the user is not logged in. | — |

### Standard Request Headers

| Header | Required | Description |
| :--- | :--- | :--- |
| `Content-Type` | Yes (for bodies) | `application/json` or `multipart/form-data` |
| `Authorization` | Optional | `Bearer <JWT>` (can be omitted if `accessToken` cookie is present) |

---

## 🧑‍💻 1. Authentication API

Base path: `/api/users`

### 1.1 Register User

**Endpoint:** `POST /api/users/register`
**Authentication:** None
**Content-Type:** `multipart/form-data`
**Middlewares:** `upload.single('profileImg')`, `optimizeImage`, `registerValidator`, `validateRequest`

#### Request Body (Form Data)

| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `name` | String | Yes | Min 2 chars |
| `username` | String | Yes | Min 2, Max 20 chars. Must be unique. |
| `email` | String | Yes | Valid email. Must be unique. |
| `password` | String | Yes | Min 6, Max 20 chars. Must contain 1 uppercase, 1 lowercase, 1 special char. |
| `profileImg` | File | No | Image file |

#### Response `201 Created`
```json
{
  "message": "User Created Successfully!",
  "result": 1,
  "metadata": { "accessToken": "eyJ..." },
  "data": {
    "id": "64c4e6f2...",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "profileImg": "https://res.cloudinary.com/.../profile.webp",
    "createdAt": "2026-07-09T10:00:00.000Z",
    "lastPlayback": null
  }
}
```

---

### 1.2 Login User

**Endpoint:** `POST /api/users/login`
**Authentication:** None
**Content-Type:** `application/json`
**Middlewares:** `loginValidator`, `validateRequest`

#### Request Body (JSON)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | String | Yes | Accepts email **or** username. |
| `password` | String | Yes | The raw password. |
| `remember` | Boolean | No | If `true`, issues a persistent `refreshToken`. |

#### Response `200 OK`
```json
{
  "message": "Logged In successfully.",
  "metadata": { "accessToken": "eyJ..." },
  "data": {
    "id": "64c4e6...",
    "name": "John Doe",
    "username": "johndoe",
    "role": "user",
    "profileImg": "https://res.cloudinary.com/.../profile.webp",
    "lastPlayback": { "currentTime": 120, "songId": { "_id": "...", "title": "Bad Guy" } }
  }
}
```

---

### 1.3 Logout

**Endpoint:** `GET /api/users/logout`
**Authentication:** None (relies on cookies)

**Response `200 OK`:** `{ "message": "Logged out successfully." }`

---

### 1.4 Forget Password

**Endpoint:** `POST /api/users/forget-password`
**Authentication:** None
**Content-Type:** `application/json`

**Body:** `{ "email": "john@example.com" }`

**Response `200 OK`:** `{ "message": "Reset link sent to email: john@example.com", ... }`

---

### 1.5 Reset Password

**Endpoint:** `POST /api/users/reset-password`
**Authentication:** None
**Content-Type:** `application/json`

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `token` | String | Yes | From body, query `?resetToken=`, or cookie. |
| `password` | String | Yes | The new password. |

**Response `200 OK`:** `{ "message": "Password reset successfully!" }`

---

### 1.6 Change Password (Authenticated)

**Endpoint:** `PUT /api/users/change-password`
**Authentication:** Required

**Body:** `{ "oldPassword": "...", "newPassword": "..." }`

**Response `200 OK`:** `{ "message": "Password changed successfully." }`

---

## 👤 2. Profile API

Base path: `/api/users`

### 2.1 Get My Profile

**Endpoint:** `GET /api/users/profile/data`
**Authentication:** Required

#### Response `200 OK`
```json
{
  "message": "User profile fetched successfully.",
  "user": {
    "name": "John Doe",
    "username": "johndoe",
    "phone": "No Phone Number",
    "role": "user",
    "profileImg": "https://res.cloudinary.com/.../profile.webp",
    "lastPlayback": { "currentTime": 95, "songId": { "_id": "...", "title": "..." } }
  }
}
```

---

### 2.2 Edit My Profile

**Endpoint:** `PUT /api/users/profile`
**Authentication:** Required
**Content-Type:** `multipart/form-data`
**Middlewares:** `upload.single('profileImg')`, `optimizeImage`

**Fields (all optional):** `name`, `username`, `phone`, `profileImg` (file)

**Response `200 OK`:** `{ "message": "Profile updated!", "user": { ... } }`

---

### 2.3 Sync Playback State

**Endpoint:** `PUT /api/users/profile/playback`
**Authentication:** Required
**Content-Type:** `application/json`

| Field | Type | Required |
| :--- | :--- | :--- |
| `songId` | ObjectId | Yes |
| `currentTime` | Number | Yes |

**Response `200 OK`:** `{ "message": "Playback state synced" }`

---

### 2.4 Get Public Artist Profile

Returns publicly available data for any user by username, including their approved public tracks.

**Endpoint:** `GET /api/users/public/:username`
**Authentication:** None

#### Response `200 OK`
```json
{
  "user": { "_id": "...", "name": "Billie Eilish", "username": "billieeilish", "profileImg": "...", "isActive": true },
  "audios": [
    { "_id": "...", "title": "Bad Guy", "singer": ["Billie Eilish"], "audioUrl": "...", "coverImageUrl": "...", "duration": 194 }
  ]
}
```

---

### 2.5 Get User Favorites

**Endpoint:** `GET /api/users/favorites`
**Authentication:** Required

Returns a list of the user's favorite songs. Only includes songs that are `approved` and `isPrivate: false`.

#### Response `200 OK`
```json
{
  "favorites": [
    {
      "_id": "...",
      "title": "Bad Guy",
      "singer": ["Billie Eilish"],
      "audioUrl": "...",
      "coverImageUrl": "...",
      "duration": 194,
      "uploadedBy": { "name": "Billie", "username": "billieeilish", "profileImg": "..." }
    }
  ]
}
```

---

### 2.6 Toggle Favorite Song

**Endpoint:** `POST /api/users/favorites/:songId`
**Authentication:** Required

Adds a song to the user's favorites if it isn't already, or removes it if it is.

**URL Parameter:** `:songId` - Valid ObjectId of the song.

#### Response `200 OK`
```json
{
  "message": "Added to favorites",
  "isFavorite": true
}
```
*Note: `message` toggles between "Added to favorites" and "Removed from favorites", and `isFavorite` reflects the new state.*

---

## 🎵 3. Audio & Streaming API

> [!NOTE]
> Audio endpoints use the `/audios` prefix, **not** `/api/audios`. This router is mounted directly at `/audios`.

### 3.1 Get All Public Audios

**Endpoint:** `GET /audios`
**Authentication:** None

**Query Parameters:**

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `page` | `1` | Page number |
| `limit` | `50` | Items per page |
| `genre` | `all` | Filter by genre |
| `category` | `all` | `song`, `podcast`, `audiobook` |
| `artist` | `all` | Filter by singer name |
| `album` | `all` | Filter by album name |

#### Response `200 OK`
```json
{
  "audios": [
    {
      "_id": "64d5...",
      "title": "Bad Guy",
      "singer": ["Billie Eilish"],
      "album": "When We All Fall Asleep",
      "genre": "Alternative Pop",
      "category": "song",
      "duration": 194,
      "audioUrl": "https://res.cloudinary.com/.../audio.mp3",
      "coverImageUrl": "https://res.cloudinary.com/.../cover.webp",
      "listenTimes": 0,
      "uploadedBy": { "_id": "...", "username": "billieeilish" }
    }
  ],
  "totalCount": 24,
  "totalPages": 1,
  "currentPage": 1
}
```

---

### 3.2 Upload Audio

The track `status` defaults to **`pending`** for Artists (requires admin/mod approval) and **`approved`** for Admins/Moderators.

**Endpoint:** `POST /audios/upload`
**Authentication:** Required
**Content-Type:** `multipart/form-data`
**Middlewares:** `upload.fields([{name:'audio'},{name:'cover'}])`, `optimizeImage`

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | String | Yes | Min 3 chars |
| `genre` | String | Yes | Genre name |
| `duration` | Number | Yes | Duration in **seconds** |
| `singer` | String | Yes | Artist name(s) |
| `category` | String | No | `song` (default), `podcast`, `audiobook` |
| `album` | String | No | Album name |
| `isPrivate` | Boolean | No | Defaults to `false` |
| `audio` | File | Yes | Audio file (mp3, wav, etc.) |
| `cover` | File | Yes | Cover art (optimized to WebP) |

#### Response `201 Created`
```json
{
  "message": "Audio uploaded successfully.",
  "audio": {
    "_id": "...", "title": "My Track", "status": "pending",
    "audioUrl": "https://res.cloudinary.com/.../audio.mp3",
    "coverImageUrl": "https://res.cloudinary.com/.../cover.webp",
    "duration": 210, "uploadedBy": "64c4e6...", "listenTimes": 0
  }
}
```

---

### 3.3 Search Audios (Global Unified Search)

Searches audios, public playlists, users, and albums concurrently.

**Endpoint:** `GET /audios/search`
**Authentication:** None

| Parameter | Required | Description |
| :--- | :--- | :--- |
| `q` | Yes | Search term |
| `page` | No | Page number (default: `1`) |
| `limit` | No | Results per page (default: `50`) |
| `genre` | No | Filter audios by genre |
| `category` | No | Filter audios by category |
| `artist` | No | Filter by singer name |

#### Response `200 OK`
```json
{
  "audios": [{ "_id": "...", "title": "Bad Guy" }],
  "totalAudios": 1,
  "playlists": [{ "_id": "...", "name": "Summer Hits" }],
  "totalPlaylists": 1,
  "users": [{ "_id": "...", "username": "billieeilish" }],
  "totalUsers": 1,
  "albums": ["When We All Fall Asleep"],
  "totalAlbums": 1,
  "currentPage": 1,
  "totalPages": 1
}
```

---

### 3.4 Stream Audio

**Endpoint:** `GET /audios/stream/:id`
**Authentication:** None

Streams the audio binary. Supports HTTP Range requests for seek/resume.

---

### 3.5 Get My Audios

**Endpoint:** `GET /audios/mine`
**Authentication:** Required

Returns all audio tracks uploaded by the authenticated user (any status).

---

### 3.6 Update Audio

**Endpoint:** `PUT /audios/:id`
**Authentication:** Required
**Content-Type:** `multipart/form-data`
**Middlewares:** `validateObjectId`, `upload.fields([{name:'cover'}])`, `optimizeImage`

Fields (all optional): `title`, `genre`, `singer`, `album`, `isPrivate`, `cover` (file)

**Response `200 OK`:** `{ "message": "Audio updated.", "audio": { ... } }`

---

### 3.7 Delete Audio

**Endpoint:** `DELETE /audios/:id`
**Authentication:** Required (uploader or admin/mod)
**Middlewares:** `validateObjectId`

**Response `200 OK`:** `{ "message": "Audio deleted successfully." }`

---

### 3.8 Increment Listen Count

**Endpoint:** `POST /audios/:id/listen`
**Authentication:** None
**Content-Type:** `application/json`

**Body (optional):** `{ "listenedSeconds": 120 }`

**Response `200 OK`:** `{ "message": "Listen time incremented", "listenTimes": 42, "totalListenSeconds": 3600 }`

---

## 🎧 4. Playlist API

Base path: `/api/playlists`

Setting `isAlbum: true` creates an **Artist Album**, which starts as `status: pending` and requires admin approval before appearing publicly.

### 4.1 Get My Playlists

**Endpoint:** `GET /api/playlists/me`
**Authentication:** Required

---

### 4.2 Create Playlist / Album

**Endpoint:** `POST /api/playlists`
**Authentication:** Required
**Content-Type:** `application/json`

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Yes | Playlist/album name |
| `description` | String | No | Defaults to `"No Description"` |
| `isPublic` | Boolean | No | Defaults to `false` |
| `isAlbum` | Boolean | No | If `true`, creates an album requiring approval |
| `audio` | Array[ObjectId] | No | Initial audio track IDs |

#### Response `201 Created`
```json
{
  "success": true,
  "playlist": {
    "_id": "...", "name": "My Album", "isAlbum": true, "status": "pending",
    "owner": "64c4e6...", "audio": [], "cover": "No Cover"
  }
}
```

---

### 4.3 Get Playlist By ID

**Endpoint:** `GET /api/playlists/:id`
**Authentication:** Optional (`checkOptionalAuthenticated`)

Public playlists are accessible to anyone. Private playlists require the requester to be the owner.

---

### 4.4 Update Playlist

**Endpoint:** `PUT /api/playlists/:id`
**Authentication:** Required (owner only)
**Content-Type:** `application/json`

---

### 4.5 Delete Playlist

**Endpoint:** `DELETE /api/playlists/:id`
**Authentication:** Required (owner or admin)

---

### 4.6 Add Song to Playlist

If the playlist has no cover art, it automatically inherits the first song's `coverImageUrl`.

**Endpoint:** `POST /api/playlists/:id/songs`
**Authentication:** Required
**Content-Type:** `application/json`

**Body:** `{ "songId": "64d5..." }`

---

### 4.7 Remove Song from Playlist

**Endpoint:** `DELETE /api/playlists/:id/songs/:songId`
**Authentication:** Required (owner only)

---

### 4.8 Clone Playlist

Duplicates an existing public playlist or album into the user's personal library.

**Endpoint:** `POST /api/playlists/clone/:id`
**Authentication:** Required

---

## 📝 5. Artist Applications API

Base path: `/api/applications`

### 5.1 Submit Artist Application

One active/pending application per user is allowed. Admins are notified on submission.

**Endpoint:** `POST /api/applications/apply`
**Authentication:** Required
**Content-Type:** `application/json`

| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `bio` | String | Yes | Minimum 20 characters |
| `socialLinks` | Object | No | e.g. `{ "instagram": "url" }` |
| `portfolioLinks` | Object | No | e.g. `{ "soundcloud": "url" }` |

#### Response `201 Created`
```json
{
  "message": "Application submitted successfully!",
  "application": { "_id": "...", "status": "pending", "user": "64c4e6...", "bio": "..." }
}
```

---

### 5.2 Get My Application

**Endpoint:** `GET /api/applications/mine`
**Authentication:** Required

---

### 5.3 Get Pending Applications (Admin)

**Endpoint:** `GET /api/applications/admin`
**Authentication:** Required (`admin` or `moderator`)

---

### 5.4 Review Application (Admin)

On approval, the user's role is automatically promoted to `artist` and a notification is sent.

**Endpoint:** `PATCH /api/applications/admin/:id/review`
**Authentication:** Required (`admin` or `moderator`)
**Content-Type:** `application/json`

**Body:** `{ "status": "approved" }` or `{ "status": "rejected" }`

---

## ⚖️ 6. Moderation API

Base path: `/api/moderation`

### 6.1 Get Pending Audios

> [!NOTE]
> When accessed by a `moderator`, tracks uploaded by `admin` accounts are excluded.

**Endpoint:** `GET /api/moderation/audios/pending`
**Authentication:** Required (`admin` or `moderator`)

---

### 6.2 Update Audio Status

**Endpoint:** `PUT /api/moderation/audios/:id/status`
**Authentication:** Required (`admin` or `moderator`)
**Content-Type:** `application/json`

**Body:** `{ "status": "approved" }` — valid values: `approved`, `rejected`, `pending`

#### Response `200 OK`
```json
{ "success": true, "message": "Audio has been approved.", "audio": { "_id": "...", "status": "approved" } }
```

---

## 🔔 7. Notifications API

Base path: `/api/notifications`

### 7.1 Get My Notifications

Fetches the last 20 notifications for the authenticated user, newest first.

**Endpoint:** `GET /api/notifications`
**Authentication:** Required

#### Response `200 OK`
```json
{
  "notifications": [
    { "_id": "...", "title": "Artist Application Approved!", "message": "...", "type": "success", "isRead": false }
  ]
}
```

---

### 7.2 Mark All As Read

**Endpoint:** `PATCH /api/notifications/read-all`
**Authentication:** Required

---

### 7.3 Mark One As Read

**Endpoint:** `PATCH /api/notifications/:id/read`
**Authentication:** Required

---

## 👑 8. Admin API — Users

Base path: `/api/admin`

### 8.1 Get All Users

**Endpoint:** `GET /api/admin/users`
**Authentication:** Required (`admin` or `moderator`)

**Query Params:** `search`, `page` (default: `1`), `limit` (default: `10`)

> Moderators cannot see admin accounts.

---

### 8.2 Get Specific User

**Endpoint:** `GET /api/admin/users/:username`
**Authentication:** Required (`admin` or `moderator`)

---

### 8.3 Create User (Admin)

**Endpoint:** `POST /api/admin/user`
**Authentication:** Required (`admin`)
**Content-Type:** `application/json`

**Required Fields:** `name`, `username`, `email`, `password`. Optional: `phone`.

---

### 8.4 Update User (Admin)

**Endpoint:** `PUT /api/admin/users/:username`
**Authentication:** Required (`admin`)
**Content-Type:** `application/json`

**Optional Fields:** `name`, `username`, `phone`, `password`, `role`, `profileImg` (URL)

---

### 8.5 Deactivate User

Sets `isActive: false`, locking the user out.

**Endpoint:** `DELETE /api/admin/users/:username`
**Authentication:** Required (`admin` or `moderator`)

---

### 8.6 Ban / Unban User

> [!NOTE]
> Moderators cannot ban `admin` or other `moderator` accounts.

**Endpoint:** `PUT /api/admin/users/:username/ban`
**Authentication:** Required (`admin` or `moderator`)
**Content-Type:** `application/json`

| `durationHours` value | Effect |
| :--- | :--- |
| A number (e.g. `24`) | Temporary ban for N hours |
| `"forever"` | Permanent ban: `isActive: false`, `bannedUntil: 2099-12-31` |
| `0` or `null` | Unban: `isActive: true`, `bannedUntil: null` |

---

### 8.7 Update User Role

**Endpoint:** `PUT /api/admin/users/:username/role`
**Authentication:** Required (`admin` only)

**Body:** `{ "role": "moderator" }` — valid values: `user`, `moderator`, `admin`

---

## 🎙️ 9. Admin Audio & Album Moderation API

Base path: `/api/admin`

### 9.1 Get All Audios (Admin)

**Endpoint:** `GET /api/admin/audios`
**Authentication:** Required (`admin` or `moderator`)

Returns all audio tracks regardless of status.

---

### 9.2 Get Pending Audios (Admin)

**Endpoint:** `GET /api/admin/audios/pending`
**Authentication:** Required (`admin` or `moderator`)

---

### 9.3 Approve Audio

**Endpoint:** `PATCH /api/admin/audio/:id/approve`
**Authentication:** Required (`admin` or `moderator`)
**Middlewares:** `validateObjectId`

---

### 9.4 Reject Audio

**Endpoint:** `PATCH /api/admin/audio/:id/reject`
**Authentication:** Required (`admin` or `moderator`)
**Middlewares:** `validateObjectId`

---

### 9.5 Force Delete Any Audio (Admin)

**Endpoint:** `DELETE /api/admin/audio/:id`
**Authentication:** Required (`admin` or `moderator`)
**Middlewares:** `validateObjectId`

---

### 9.6 Get Pending Albums

**Endpoint:** `GET /api/admin/albums/pending`
**Authentication:** Required (`admin` or `moderator`)

#### Response `200 OK`
```json
{
  "success": true,
  "count": 1,
  "albums": [{ "_id": "...", "name": "Unreleased Album", "status": "pending", "owner": { "username": "..." } }]
}
```

---

### 9.7 Approve Album

**Endpoint:** `PATCH /api/admin/album/:id/approve`
**Authentication:** Required (`admin` or `moderator`)

---

### 9.8 Reject Album

**Endpoint:** `PATCH /api/admin/album/:id/reject`
**Authentication:** Required (`admin` or `moderator`)

---

## 📋 Complete Route Index

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/register` | None | Register new user |
| `POST` | `/api/users/login` | None | Login |
| `GET` | `/api/users/logout` | None | Logout |
| `POST` | `/api/users/forget-password` | None | Send password reset email |
| `POST` | `/api/users/reset-password` | None | Reset password via token |
| `PUT` | `/api/users/change-password` | Required | Change password in-app |
| `GET` | `/api/users/profile/data` | Required | Get my profile |
| `PUT` | `/api/users/profile` | Required | Edit my profile |
| `PUT` | `/api/users/profile/playback` | Required | Sync playback state |
| `GET` | `/api/users/public/:username` | None | Get public artist profile |
| `GET` | `/audios` | None | Get all public audios |
| `POST` | `/audios/upload` | Required | Upload audio |
| `GET` | `/audios/search` | None | Global unified search |
| `GET` | `/audios/stream/:id` | None | Stream audio |
| `GET` | `/audios/mine` | Required | Get my uploaded audios |
| `PUT` | `/audios/:id` | Required | Update audio |
| `DELETE` | `/audios/:id` | Required | Delete audio |
| `POST` | `/audios/:id/listen` | None | Increment listen count |
| `GET` | `/api/playlists/me` | Required | Get my playlists |
| `POST` | `/api/playlists` | Required | Create playlist or album |
| `GET` | `/api/playlists/:id` | Optional | Get playlist by ID |
| `PUT` | `/api/playlists/:id` | Required | Update playlist |
| `DELETE` | `/api/playlists/:id` | Required | Delete playlist |
| `POST` | `/api/playlists/:id/songs` | Required | Add song to playlist |
| `DELETE` | `/api/playlists/:id/songs/:songId` | Required | Remove song from playlist |
| `POST` | `/api/applications/apply` | Required | Submit artist application |
| `GET` | `/api/applications/mine` | Required | Get my application |
| `GET` | `/api/applications/admin` | admin/mod | Get all pending applications |
| `PATCH` | `/api/applications/admin/:id/review` | admin/mod | Approve or reject application |
| `GET` | `/api/moderation/audios/pending` | admin/mod | Get pending audios |
| `PUT` | `/api/moderation/audios/:id/status` | admin/mod | Update audio approval status |
| `GET` | `/api/notifications` | Required | Get my notifications |
| `PATCH` | `/api/notifications/read-all` | Required | Mark all notifications read |
| `PATCH` | `/api/notifications/:id/read` | Required | Mark one notification read |
| `GET` | `/api/admin/users` | admin/mod | List all users (paginated) |
| `GET` | `/api/admin/users/:username` | admin/mod | Get specific user |
| `POST` | `/api/admin/user` | admin | Create user |
| `PUT` | `/api/admin/users/:username` | admin | Update user |
| `DELETE` | `/api/admin/users/:username` | admin/mod | Deactivate user |
| `PUT` | `/api/admin/users/:username/ban` | admin/mod | Ban or unban user |
| `PUT` | `/api/admin/users/:username/role` | admin | Change user role |
| `GET` | `/api/admin/audios` | admin/mod | Get all audios |
| `GET` | `/api/admin/audios/pending` | admin/mod | Get pending audios |
| `PATCH` | `/api/admin/audio/:id/approve` | admin/mod | Approve audio |
| `PATCH` | `/api/admin/audio/:id/reject` | admin/mod | Reject audio |
| `DELETE` | `/api/admin/audio/:id` | admin/mod | Force delete any audio |
| `GET` | `/api/admin/albums/pending` | admin/mod | Get pending albums |
| `PATCH` | `/api/admin/album/:id/approve` | admin/mod | Approve album |
| `PATCH` | `/api/admin/album/:id/reject` | admin/mod | Reject album |
