# Backend TODO Backlog

## High Priority
- [ ] Implement pagination on search endpoints (limit/offset) to handle large result sets.
- [ ] Add caching (e.g., Redis) for frequently accessed endpoints like trending songs and search queries.
- [ ] Refine role-based access control (RBAC) middleware for stricter resource ownership checks on playlists and profile edits.

## Medium Priority
- [ ] Integrate automated tests using Jest and Supertest for core API endpoints.
- [ ] Implement rate limiting to prevent abuse of the search and upload APIs.
- [ ] Expand the Moderation Controller to handle automated content flagging (e.g., AI audio analysis integration).

## Low Priority
- [ ] Add support for webhook events to notify the frontend of background job completion (e.g., audio transcoding).
- [ ] Implement soft-delete for user accounts and audio tracks.
