# Audio & Song API Documentation

> [!IMPORTANT]
> **Storage Infrastructure Update:** The file storage architecture has been successfully migrated to **Cloudinary**. Previous documentation referencing local `multer` saves to `/uploads/` and `sharp` image optimization should be viewed as historical context. 
> 
> - **Multer** is now strictly used as a temporary parsing step.
> - **Files** are instantly offloaded to Cloudinary (`streamflow/audio`, `streamflow/covers`) and local temporary files are deleted.
> - **URLs** stored in the database are now secure `https://res.cloudinary.com/...` paths.
> - **Audio Streaming** routes now act as a redirect gateway to Cloudinary's global CDN instead of serving via local `fs.createReadStream`.


This document outlines the API endpoints related to Audio and Song management in Stream_Flow. It covers standard CRUD operations, audio streaming via chunked transfers, and administrative actions.

## 🏗️ Architecture Overview

The Audio API handles both metadata (title, genre, singer) and static file assets (audio files and cover images).
- **File Uploads**: Processed via `multer` (`multipart/form-data`) and heavily optimized via `sharp` for cover images.
- **Audio Streaming**: Handled using HTTP 206 Partial Content headers for chunked streaming, reducing memory overhead and allowing users to skip around in a track.

Base path for user routes: `/api/audios`
Base path for admin routes: `/`

---

## 🛣️ API Endpoints

### 1. Upload Audio
Uploads a new song, including the audio file itself and its cover art.

- **URL:** `POST /api/audios/upload`
- **Content-Type:** `multipart/form-data`
- **Auth Required:** Yes (`checkAuthenticated`)

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | The song title. |
| `genre` | string | Yes | The genre of the song. |
| `singer` | string/array | Yes | Array or comma-separated string of singers. |
| `isPrivate` | boolean| No | If true, only the uploader can see/play the song. |
| `duration` | number | Yes | Duration of the audio track in seconds. |
| `audio` | file | Yes | The `.mp3` or `.wav` audio file. |
| `cover` | file | Yes | The cover art image file. |

#### Responses
- `201 Created` - Returns the newly created audio object.
- `400 Bad Request` - Missing required fields or files.

---

### 2. Get Public Audios (Paginated & Filtered)
Retrieves public songs with server-side pagination and filtering.

- **URL:** `GET /audios/` (or `GET /audios/song/`)
- **Auth Required:** No

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | The page number for pagination. |
| `limit` | number | 50 | Number of results per page. |
| `genre` | string | 'all' | Filter by a specific genre. |
| `category` | string | 'all' | Filter by category (`song`, `podcast`, `audiobook`). |
| `artist` | string | 'all' | Filter by a specific artist (exact match of singer array). |
| `album` | string | 'all' | Filter by a specific album. |

#### Responses
- `200 OK` - Returns a paginated object: `{ audios: [], totalCount, totalPages, currentPage }`.

---

### 3. Unified Global Search
Searches across Audios (Songs, Podcasts, Audiobooks) AND Public Playlists simultaneously.

- **URL:** `GET /audios/search`
- **Auth Required:** No

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | - | The search query string. |
| `page` | number | 1 | The page number for pagination. |
| `limit` | number | 50 | Number of results per page. |
| `genre` | string | 'all' | Filter audios by a specific genre. |
| `category` | string | 'all' | Filter audios by category. |
| `artist` | string | 'all' | Filter audios by a specific artist. |
| `album` | string | 'all' | Filter audios by a specific album. |

#### Responses
- `200 OK` - Returns `{ audios: [], totalAudios, playlists: [], totalPlaylists, users: [], totalUsers, albums: [], totalAlbums, currentPage, totalPages }`. Note: `users` only returns accounts with the `artist` role.

---

### 4. Category-Specific Endpoints
Convenience endpoints to fetch or search entirely within a specific category.

- **URL:** `GET /audios/category/:category`
- **URL:** `GET /audios/category/:category/search?q=...`
- **Auth Required:** No

#### Responses
- Maps identically to the paginated `Get Public Audios` and `Unified Global Search` payloads.

### 5. Get My Audios
Fetches the library of songs uploaded by the currently authenticated user.

- **URL:** `GET /api/audios/mine`
- **Auth Required:** Yes (`checkAuthenticated`)

#### Responses
- `200 OK` - Returns an array of user's audio objects.

---

### 6. Stream Audio
Streams an audio file back to the client using chunked data transfer (`206 Partial Content`), supporting seeking/scrubbing in audio players.

- **URL:** `GET /api/audios/stream/:id`
- **Auth Required:** No

#### Responses
- `206 Partial Content` - Binary audio stream.
- `404 Not Found` - Audio document or physical file missing.
- `416 Range Not Satisfiable` - Requested byte range exceeds file size.

---

### 7. Update Audio
Edits the metadata or cover art of an existing song. Users can only update their own uploads.

- **URL:** `PUT /api/audios/:id`
- **Content-Type:** `multipart/form-data`
- **Auth Required:** Yes (`checkAuthenticated`, `validateObjectId`)

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | The new song title. |
| `genre` | string | No | The new genre. |
| `singer` | string | No | JSON stringified array of singers. |
| `isPrivate` | boolean| No | Visibility toggle. |
| `cover` | file | No | A new cover art image to replace the old one. |

#### Responses
- `200 OK` - Audio updated successfully.
- `403 Forbidden` - User is not the owner of the audio.

---

### 8. Delete Audio
Permanently deletes an audio file from the platform. Users can only delete their own uploads.

- **URL:** `DELETE /api/audios/:id`
- **Auth Required:** Yes (`checkAuthenticated`, `validateObjectId`)

#### Responses
- `200 OK` - Audio deleted successfully.
- `403 Forbidden` - Attempting to delete another user's audio.

---

## 👑 Admin Endpoints

### 7. Admin: Get ALL Audios
Fetches every audio file in the database regardless of visibility/privacy.

- **URL:** `GET /admin/audios`
- **Auth Required:** Yes (`checkAuthenticated`, `authorizeRoles("admin")`)

#### Responses
- `200 OK` - Returns an array of all audio objects.

### 8. Admin: Delete Any Audio
Allows an administrator to forcefully delete any audio track.

- **URL:** `DELETE /admin/audio/:id`
- **Auth Required:** Yes (`checkAuthenticated`, `authorizeRoles("admin")`, `validateObjectId`)

#### Responses
- `200 OK` - Audio deleted by admin.

---

## 🛡️ Middlewares

The audio endpoints utilize several layers of middleware to ensure security, robust file handling, and media optimization.

### `checkAuthenticated` (`auth.Middleware.js`)
Guard middleware that extracts and validates the user's `accessToken` (or transparently rotates the `refreshToken`). Attaches `req.user` to authorized requests.

### `authorizeRoles("admin")` (`auth.Middleware.js`)
Strict RBAC guard used exclusively on the admin routes to prevent standard users from fetching the global library or deleting arbitrary files.

### `validateObjectId` (`validateObjectId.js`)
Ensures that the `:id` parameter provided in the URL is a structurally valid MongoDB `ObjectId` before querying the database, preventing fatal casting errors.

### `upload.fields` (`config/multer.js`)
A `multer` instance configured to handle multi-file uploads (e.g., separating the `audio` file and the `cover` image). It enforces strict MIME type filtering, rejecting non-audio files for the audio field and non-image files for the cover field.

### `optimizeImage` (`imageOptimizer.js`)
Image processing middleware running `sharp`. It intercepts the `cover` image saved by `multer`, converts it to the highly-compressed `.webp` format, deletes the original uploaded image file, and seamlessly updates `req.file` with the new WebP asset details before handing off to the controller.

---

## ⚙️ Core Implementation Logic

### Upload & Save Logic (`uploadAudio`)
The audio upload controller handles several complex data formatting and validation steps before saving to the database:
1. **Singer Parsing:** The frontend can send the `singer` field as a string or an array. The controller standardizes this by flattening arrays and joining them into a comma-separated string before saving.
2. **Path Construction:** Unlike typical setups, the `audioUrl` and `coverImageUrl` fields are constructed using the absolute server path (`${__dirname}/../uploads/audio/...`). This ensures the `fs` module can locate the files easily during streaming.
3. **Database Write:** A new `Audio` document is instantiated and linked to the `req.user._id` (the uploader). The audio metadata, including the parsed `duration`, is written alongside the file paths.

### Streaming Logic (`streamAudio`)
To prevent the server from loading massive `.mp3` or `.wav` files into RAM, the streaming endpoint implements a highly optimized chunked-transfer mechanism using HTTP `Range` headers:
1. **File Verification:** The controller uses `fs.existsSync` to ensure the audio file hasn't been deleted from the file system.
2. **Range Header Parsing:** When a modern HTML5 audio player requests a song, it sends a `Range` header (e.g., `bytes=1000-2000`). The controller parses this to determine exactly which chunk of the file the user is trying to buffer.
3. **Chunk Calculation:** It calculates the start and end bytes, ensuring it doesn't exceed the total file size (`fs.statSync(filePath).size`). If the requested range is invalid, it returns `416 Range Not Satisfiable`.
4. **Pipe Streaming:** It sends a `206 Partial Content` response header indicating chunked streaming, followed by a dynamically generated Node.js readable stream (`fs.createReadStream`) that pipes only the requested byte chunk directly into the HTTP response buffer (`res`). If no range is requested, it defaults to a standard `200 OK` full-file stream.
