# Stream Flow Technical & Product Documentation

## 1. Executive Summary: What is Stream Flow?
Stream Flow is a modern, full-stack web-based music streaming platform designed to seamlessly connect listeners with independent artists. Built as a Single Page Application (SPA) driven by a robust RESTful backend, Stream Flow provides a highly responsive, rich media experience comparable to industry-leading platforms.

At its core, Stream Flow facilitates audio playback, intelligent search, playlist curation, and artist discovery. However, unlike traditional minimal viable products, Stream Flow features a deeply integrated **Role-Based Access Control (RBAC)** system that delineates standard listeners from content-creating artists and system-administrating moderators.

## 2. Value Proposition: Why Stream Flow?
The music streaming market is heavily saturated, but Stream Flow differentiates itself by focusing on **Artist Autonomy** and **Community Moderation**. 

### The Problem
Independent artists often lack transparency into how their music performs, while administrators of growing platforms struggle with scaling content moderation and managing malicious uploads.

### The Stream Flow Solution
- **Dedicated Artist Dashboards:** Artists receive real-time, anti-spam-protected analytics on total plays and precise listen-duration tracking (total seconds listened).
- **Content Approval Pipelines:** Every audio upload and album creation goes through an automated 'Pending' state, requiring Admin or Moderator approval before going live, ensuring platform safety and quality.
- **Custom Application System:** Users cannot simply toggle an "artist" switch. They must submit a formal application, which goes to an Admin queue for review, maintaining a curated creator ecosystem.

## 3. Technology Stack & Architecture

Stream Flow utilizes the **MERN** stack (MongoDB, Express, React, Node.js), augmented by modern tooling and cloud infrastructure to ensure scalability and high performance.

### 3.1 Frontend Architecture
- **Framework:** React 19 (via Vite)
- **Styling:** Tailwind CSS (utility-first, highly responsive, built-in dark mode support)
- **State Management & Routing:** React Context API (for global auth and music player state) and React Router DOM.
- **Forms & Validation:** Formik and Yup for complex, validated artist applications and login forms.
- **UI Details:** Lucide-react for iconography, React-spinners for loading states, and custom dynamic animations for a premium user experience.

### 3.2 Backend Architecture
- **Runtime & Framework:** Node.js v25+ with Express 5.
- **Authentication & Security:** JWT (JSON Web Tokens) for stateless authentication, HTTP-only cookies, and Bcrypt for secure password hashing.
- **Routing & Validation:** Express Router combined with Express-Validator for strict payload sanitization.
- **Documentation:** Swagger UI (OpenAPI specification) auto-generated from YAML and Markdown for seamless API discovery.

### 3.3 Database & Data Modeling
- **Database:** MongoDB (NoSQL) - Chosen for its highly flexible schema design, allowing complex arrays of references (e.g., playlists containing multiple audio ObjectIds).
- **ODM (Object Data Modeling):** Mongoose - Enforces schema typing, strict validations, and handles complex document population (e.g., populating `uploadedBy` user details on an audio track).

### 3.4 Infrastructure & Storage
- **Media Hosting:** Cloudinary - Offloads the heavy lifting of audio file and cover image hosting. Utilizes Cloudinary's global CDN for rapid media delivery to the frontend player.
- **File Processing:** Multer and Sharp - Used to intercept multipart/form-data, locally optimize/resize cover images before beaming them to Cloudinary, reducing bandwidth overhead.
- **Email Delivery:** Nodemailer - Handles automated communications like application approvals, password resets, and moderation alerts.


---

## 4. Role-Based Access Control (RBAC) & Feature Matrix

Stream Flow utilizes a strict Role-Based Access Control (RBAC) model. The system defines four primary roles: `user`, `artist`, `moderator`, and `admin`. Each role inherits the permissions of the roles below it while gaining new administrative or content-creation capabilities.

### 4.1 End-User (Standard Listener)
The default role assigned to any new account upon registration. Users consume content and manage their personal library.

**Key Features:**
- **Continuous Audio Playback:** A persistent, global audio player that continues playing across route transitions.
- **Queue Management:** Users can skip forward, skip backward, shuffle the current context (album/playlist), and toggle repeat modes.
- **Search & Discovery:** A robust search engine querying MongoDB by song title, artist, and genre, complete with categorized filtering.
- **Personal Library:** 
  - Ability to "Favorite" songs for quick access.
  - Create, edit, and delete personal custom Playlists.
- **Profile Customization:** Users can edit their display name, bio, and upload a profile picture via Cloudinary.
- **Artist Application:** A dedicated portal allowing standard users to apply for the "Artist" tier by submitting a portfolio/reasoning for review.

### 4.2 Artist (Content Creator)
Users who have passed the moderation queue and been promoted to the artist tier. They retain all user features while gaining access to ingestion pipelines and analytics.

**Key Features:**
- **Artist Dashboard:** A centralized hub displaying a summary of the artist's catalog performance.
- **Content Ingestion Pipeline:**
  - **Single Track Uploads:** Artists can upload audio files (`.mp3`, `.wav`) along with metadata and custom cover art.
  - **Album Creation:** Ability to bundle multiple uploaded tracks into cohesive Albums with unified cover art.
- **Real-Time Analytics:** 
  - **Play Counts:** Tracks total unique session listens (`listenTimes`).
  - **Duration Tracking:** Integrates with the custom frontend player to report and log the exact total seconds audiences spend listening to the artist's catalog (`totalListenSeconds`).
- **Content Management:** Artists can edit metadata or delete their own tracks and albums (subject to moderation rules).

### 4.3 Admin & Moderator (Platform Oversight)
Moderators and Admins ensure the platform remains safe, curated, and free of copyright or malicious material. Admins have absolute control, while Moderators handle day-to-day queue management.

**Key Features:**
- **Centralized Admin Dashboard:** A comprehensive view of system health, total user counts, pending applications, and total uploads.
- **Content Moderation Queues:**
  - Every uploaded track and album enters a `pending` state by default.
  - Moderators can review, play, and then `approve` or `reject` the content. Rejected content is removed from public discovery.
- **User Role Management:** Admins can view a table of all registered users and directly upgrade/downgrade their roles (e.g., manually promoting a `user` to an `artist`).
- **Artist Application Processing:** A dedicated queue where moderators review user-submitted artist applications. They can approve the application, which automatically upgrades the user's DB role.
- **Account Disciplinary Actions:** Admins have the authority to ban or delete malicious user accounts.


---

## 5. System Workflows & Detailed Use Cases

Stream Flow relies on several complex workflows that bridge the frontend Client, the backend API, and external services like Cloudinary. Below are the architectural deep dives into the most critical platform workflows.

### 5.1 Workflow: Content Ingestion & Moderation Pipeline
Ensuring high-quality, safe content requires a strict ingestion pipeline.

1. **Actor (Artist):** Navigates to the Upload page and submits a multipart/form-data request containing an audio file (`.mp3`/`.wav`), a cover image (`.jpg`/`.png`), and metadata (title, genre).
2. **System (API - `POST /audios`):**
   - **Multer** intercepts the request and buffers the files in memory.
   - **Sharp** processes the cover image (resizing, optimizing format to WebP/JPEG) to reduce CDN bandwidth.
   - The audio and optimized image are streamed to **Cloudinary** via `cloudinary.uploader.upload_stream`.
3. **System (Database):** An `Audio` document is created with references to the Cloudinary URLs. Crucially, the document's `status` defaults to `pending`.
4. **Actor (Admin/Moderator):** Navigates to the Admin Dashboard's Moderation Tab.
5. **System (API - `GET /api/admin/moderation`):** Fetches all audios where `status === 'pending'`.
6. **Actor (Admin/Moderator):** Reviews the track and clicks "Approve".
7. **System (API - `PATCH /api/admin/moderation/audio/:id/approve`):** Updates the DB status to `approved`. The song is now fully indexed and visible in global searches.

### 5.2 Workflow: Analytics & Granular Playback Engine
Providing artists with accurate metrics without inflating play counts (e.g., from a user seeking through a song).

1. **Actor (User):** Clicks play on a song.
2. **System (Frontend - `AudioPlayer.jsx`):** 
   - The `<audio>` element begins playback.
   - On initial play, the frontend fires a request to `POST /audios/:id/listen` with `{ isNewPlay: true }`.
3. **System (Backend):** The server increments the `listenTimes` counter by `1` for that specific track.
4. **System (Frontend Engine):**
   - A `useRef` timer in the player tracks active playing seconds.
   - Every 10 seconds of active listening (excluding pauses/buffering), the frontend silently triggers `reportListenProgress(songId, 10)` which posts to `POST /audios/:id/listen` with `{ isNewPlay: false, listenedSeconds: 10 }`.
5. **System (Backend):** The server identifies `isNewPlay: false` and **only** adds 10 to the `totalListenSeconds` counter, leaving `listenTimes` (the raw play count) untouched.
6. **Actor (Artist):** Views their dashboard, seeing a highly accurate representation of "Total Plays" alongside formatted "Total Listen Time" (e.g., "2h 15m").

### 5.3 Workflow: The Artist Application Lifecycle
Preventing arbitrary access to the artist tier.

1. **Actor (User):** Submits the Artist Application form via the Settings page.
2. **System (API - `POST /api/admin/artist-applications`):** Creates an `ArtistApplication` document linked to the User's ObjectId, status set to `pending`.
3. **Actor (Admin):** Opens the Admin Dashboard to review the application.
4. **System (API - `PATCH /api/admin/artist-applications/:id/approve`):**
   - Changes application status to `approved`.
   - Automatically queries the `User` collection and updates `role` to `artist`.
5. **Actor (User):** Upon their next session token refresh or login, their decoded JWT reflects the `artist` role, instantly unlocking the Artist Dashboard and Upload features on the frontend client.


---

## 6. Data Architecture & Database Schema

Stream Flow utilizes MongoDB for its schema-less flexibility, tightly controlled via Mongoose Object Data Modeling (ODM). The relationships lean heavily on `ObjectId` referencing rather than embedding, ensuring that massive collections (like Audios) do not bloat related documents (like Albums or Playlists).

### 6.1 User Model (`users`)
Manages authentication, session tracking, RBAC roles, and playback history.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | required, min 2 | Display name |
| `username` | String | unique, lowercase | Unique slug for profiles |
| `email` | String | unique, required | Contact and login email (select: false) |
| `password` | String | required | Bcrypt hashed password (select: false) |
| `role` | Enum | default: `user` | Allowed values: `user`, `artist`, `moderator`, `admin` |
| `sessions` | Array | | Stores active JWT session data (token, expires, device) |
| `favorites`| [ObjectId] | ref: `Audio` | List of liked/bookmarked audio tracks |
| `lastPlayback` | Object | | Resumes playback context (`songId` and `currentTime`) |

### 6.2 Audio Model (`audios`)
The core entity representing an uploaded track.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `title` | String | required | Name of the track |
| `singer` | String | required | Artist attribution |
| `uploadedBy` | ObjectId | ref: `User`, required | Maps the track to the uploading artist account |
| `category` | Enum | required | E.g., `music`, `podcast`, `audiobook` |
| `genre` | String | required | Categorization for search |
| `audioUrl` | String | required | Cloudinary raw file URL |
| `coverImageUrl`| String| required | Cloudinary image URL |
| `duration` | Number | required | Total length in milliseconds |
| `status` | Enum | default: `pending` | Allowed: `pending`, `approved`, `rejected` |
| `listenTimes` | Number | default: `0` | Total *unique* session plays |
| `totalListenSeconds`| Number| default: `0` | Exact cumulative seconds listened globally |

### 6.3 Album Model (`albums`)
A logical grouping of `Audio` documents, owned by an artist.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | required | Album title |
| `owner` | ObjectId | ref: `User`, required | The artist who created the album |
| `audio` | [ObjectId] | ref: `Audio` | Array of references to the constituent tracks |
| `cover` | String | default | Inherited cover image for the album |
| `status` | Enum | default: `pending` | Allowed: `pending`, `approved`, `rejected` |

### 6.4 Playlist Model (`playlists`)
User-generated collections of audio tracks.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | required | Title of the playlist |
| `owner` | ObjectId | ref: `User`, required | The user who maintains the list |
| `audio` | [ObjectId] | ref: `Audio` | Array of references to songs added |
| `isPublic` | Boolean| default: `false`| Privacy toggle for sharing |

### 6.5 ArtistApplication Model (`artistapplications`)
Pipeline queue for standard users applying to upgrade their account role.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `user` | ObjectId | ref: `User`, required | The applicant |
| `portfolioUrl`| String | required | Link to past work or socials |
| `status` | Enum | default: `pending` | Allowed: `pending`, `approved`, `rejected` |

### 6.6 Notification Model (`notifications`)
System alerts dispatched to users.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `recipient` | ObjectId | ref: `User`, required | Target user |
| `type` | String | required | Event type (e.g., `audio_approved`) |
| `message` | String | required | Body of the notification |
| `read` | Boolean| default: `false`| Unread/Read toggle |


---

## 7. Technical Debt & Future Roadmap

To ensure Stream Flow scales efficiently to thousands of concurrent users and a massive audio library, several architectural upgrades have been addressed, and a few are planned for the future.

### 7.1 Resolved Technical Debt (Senior Audit Updates)
- **Database Optimization (Resolved):** Added native MongoDB Text Search (`$text`) and Compound Indexes (`{ status: 1, isPrivate: 1 }`) to eliminate `O(N)` `COLLSCAN` operations and drastically improve global search efficiency.
- **Missing Pagination (Resolved):** Hard limits and offsets (`skip`, `limit`) have been added to the `Audio` and `Playlist` controllers, guaranteeing an `O(1)` memory consumption per request, protecting the V8 heap as the library scales.
- **Production Security (Resolved):** Added `helmet` to secure HTTP headers and protect against XSS/Clickjacking, and `express-rate-limit` to globally throttle the `/api/` endpoints (500 requests / 15m) to prevent DDoS and brute-force credential stuffing.
- **Retroactive Audio Claiming (Resolved):** Intelligent matching logic added to the `register` controller. If a new user signs up with a username that matches an existing artist's name (ignoring spaces/case), the system automatically promotes them to `artist` and binds all matching legacy tracks (and their analytics) to the new account.

### 7.2 Current Open Technical Debt
- **Synchronous Audio Processing:** File uploads are processed synchronously by Multer and Sharp before returning a response, tying up the Node.js event loop during heavy uploads.

### 7.3 High-Priority Short-Term Roadmap
1. **Redis Caching Layer:** Integrate Redis to cache expensive database queries, specifically:
   - The "Most Popular Songs" calculations.
   - Frequent global search queries.
   - The landing page featured tracks.
2. **Role-Based Security Enhancements:** Refine the RBAC middleware to include stricter ownership checks (e.g., ensuring a Moderator cannot approve their own artist application).

### 7.4 Medium-Priority Roadmap (Reliability)
1. **Automated Testing Suite:** Introduce **Jest** and **Supertest** to cover core API endpoints, ensuring regressions do not occur in the authentication and content ingestion pipelines.

### 7.5 Long-Term Architectural Plans
1. **Asynchronous Jobs & Webhooks:** Move audio processing (Cloudinary uploads, transcoding) to background workers (e.g., BullMQ). Implement Webhook events to notify the frontend when a track is fully processed and ready for moderation.
2. **AI Content Moderation:** Expand the Moderation Controller to integrate with third-party AI APIs (e.g., AWS Rekognition or audio fingerprinting APIs) to auto-flag copyrighted or malicious uploads before they hit the manual Admin queue.
3. **Soft-Deletes:** Implement soft-deletion schemas (setting an `isDeleted` flag rather than `db.collection.deleteOne()`) to allow for data recovery and audit trailing for user accounts and audio tracks.


---

