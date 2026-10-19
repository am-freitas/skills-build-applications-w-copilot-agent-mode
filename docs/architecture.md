# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep API calls in the shared frontend client and rendering/state in the React views. Each view will expose accessible loading, error, empty, and populated states; it will not contain persistence or business rules.
- Logic tier decision: Keep HTTP parsing, validation, status codes, and response shapes in Express routes; put calculations and multi-model operations in the backend service. Do not add authentication.
- Data tier decision: Use Mongoose schemas for required fields, defaults, and references. Seed by adding or updating the exercise fixtures without deleting unrelated records, and make repeated seed runs idempotent.
- Activity tracking approach: Validate the request and both ID formats, verify the referenced user and team exist, then store their references, type, minutes, server-calculated points (one point per minute), and server-generated occurrence time. Return a deliberate 4xx for invalid or missing references.
- Team management approach: Require a nonblank name, preserve the submitted name and mascot, default members to an empty array, and validate member references before creating a team. Keep team membership and user-to-team references consistent when associating members.
- Leaderboard approach: Sum persisted activity points by team, include teams with no activity at zero points, sort by total points descending with team name as a stable tie-breaker, and assign 1-based ranks in result order.
- Workout suggestions approach: Find the user by email, use their fitness goal and recent activities to prioritize matching stored workouts, and include a short reason for the first recommendation. Return a deliberate 4xx when the user is unknown.

## Test plan

Record the commands you run and what each failure means.

- Run in dependency order: data contract, API contract, frontend contract, then backend and frontend builds.
- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` checks model validation and repeatable, non-destructive seed behavior; failures point to schema, reference, or seed issues.
- API command: `npm run test:api --prefix octofit-tracker/backend` checks activity validation and persistence, team creation and membership, leaderboard totals/ranks, and user-specific workout suggestions; failures point to route, service, or persistence behavior.
- Frontend command: `npm test --prefix octofit-tracker/frontend` checks API-backed rendering, requested workout email, and accessible loading, empty, and error states; failures point to the client or presentation tier.
- Backend build command: `npm run build --prefix octofit-tracker/backend` checks backend TypeScript types; failures point to backend compile-time issues not necessarily covered by runtime contracts.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` checks frontend TypeScript and the Vite production build; failures point to frontend type or bundling issues.
- Current baseline before implementation: data contract has 4 failures and 1 pass, API contract has 4 failures, and frontend contract has 15 failures. The starter tests are intentionally red until the corresponding capabilities are implemented.
