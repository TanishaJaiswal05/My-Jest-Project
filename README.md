# My Jest Project

A TypeScript/Express salon-booking API with unit-style mocked API tests plus real-MongoDB integration and E2E tests.

## Local setup

### 1. Install prerequisites

- Node.js 18+ (20 or 22 LTS recommended)
- npm 9+
- MongoDB 7/8 locally, MongoDB Atlas, or Docker

### 2. Clone and install

```bash
git clone https://github.com/TanishaJaiswal05/My-Jest-Project.git
cd My-Jest-Project
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Use these values for a local MongoDB server:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/salon-db
MONGO_TEST_URI=mongodb://127.0.0.1:27017/salon-test-db
JWT_SECRET=use-a-long-random-secret
```

`.env` is ignored by Git. Never commit real credentials.

### 4. Start MongoDB

With Docker:

```bash
docker run -d --name salon-mongodb -p 27017:27017 -v salon-mongodb-data:/data/db mongo:8
```

Or start the MongoDB service installed on your machine. Confirm that port `27017` is available before starting the API.

For MongoDB Atlas, replace both URI values with valid Atlas connection strings and allow your IP address in Atlas Network Access. Keep `MONGO_TEST_URI` pointed at a separate test database.

### 5. Run the API

```bash
npm run dev
```

The API runs at `http://localhost:3000`; `GET /` is the health check. The server connects to `MONGO_URI` before listening.

## Tests

The existing `tests/auth-booking.test.ts` suite mocks Mongoose models, so it is fast and does not need MongoDB. The new suites use real MongoDB data:

```bash
# All tests (MongoDB must be running for the real-data suites)
npm test

# Only real database integration tests
npm run test:integration

# Complete register -> login -> booking -> cancel workflow
npm run test:e2e

# Both real database suites
npm run test:real
```

Real-data tests use `MONGO_TEST_URI` (or the safe local default `salon-test-db`), clear only that database before each test, and disconnect when complete. They never use the development `MONGO_URI` unless you explicitly configure the test URI that way.

## Build and production-style start

```bash
npm run build
npm start
```

The application expects booking dates in `YYYY-MM-DD` format and times in `HH:mm` format.

## Project principles

- Keep the Express app exported from `app.ts`; this makes SuperTest straightforward.
- Keep MongoDB connection startup in `index.ts`; tests can import the app without opening a server.
- Prefer small, readable tests that verify business behavior with real persisted records where integration matters.
