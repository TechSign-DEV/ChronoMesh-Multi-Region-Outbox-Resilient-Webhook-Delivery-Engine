ChronoMesh
Multi-Region Outbox & Resilient Webhook Delivery Engine
ChronoMesh is a webhook delivery platform designed to help applications
deliver events reliably, track delivery attempts, and safely handle
repeated webhook requests.

It uses the Transactional Outbox pattern, MongoDB Change Streams,
BullMQ, Redis-compatible Memurai, HMAC-SHA256 signatures, retry
handling, idempotency records, and region assignment/monitoring.
Delivery guarantee: ChronoMesh uses retryable, at-least-once
delivery with receiver-side idempotency. It should not be described as
exactly-once delivery to arbitrary external systems. A receiver must
implement idempotency correctly to prevent repeated business
operations.

1. What problem does ChronoMesh solve?
When an application completes an operation such as a payment, it may
need to notify another service through a webhook.

A simple implementation can lose events if the application crashes after
saving its data but before sending the webhook. Network failures and
receiver downtime can also cause delivery problems. Repeated delivery
can cause the receiver to process the same event more than once.

ChronoMesh addresses these problems by:
- Persisting outgoing events in a MongoDB outbox.
- Watching for new outbox events using MongoDB Change Streams.
- Queueing delivery work with BullMQ.
- Retrying retryable delivery failures with exponential backoff.
- Signing webhook payloads with HMAC-SHA256.
- Sending an idempotency key so receivers can detect duplicates.
- Recording delivery attempts and their outcomes.
- Assigning events to configured regions and exposing monitoring
  information.
- Validating webhook destination URLs to reduce SSRF risk.
2. Main features
  Feature                             Purpose
  Transactional Outbox                Stores events durably before
asynchronous delivery.

  MongoDB Change Streams              Detects newly inserted outbox
events.

  BullMQ                              Manages background webhook delivery
jobs.

  Memurai / Redis                     Provides the Redis-compatible queue
backend.

  Exponential Backoff                 Retries retryable failures with
increasing delays.

  HMAC-SHA256                         Allows a receiver to verify that a
payload was signed with the shared
secret.

  Idempotency                         Detects a previously completed
event and returns its saved
response.

  Delivery Attempts                   Stores attempt number, status, HTTP
status, response, error, and
duration.

  Region Assignment                   Assigns events to a configured
region.

  Monitoring                          Exposes worker and region health
information to the dashboard/API.
SSRF Protection                     Validates webhook URLs and blocks
private/reserved destinations
according to the URL security
rules.
3. Technology stack
Backend
- Node.js
- Express
- MongoDB and Mongoose
- MongoDB Change Streams
- BullMQ
- ioredis
- Memurai (Redis-compatible server)
- Axios
- HMAC-SHA256 using Node.js crypto
- Joi
- ipaddr.js
Frontend
- React
- Vite
- React Router
- Axios
- lucide-react
- CSS
4. Project structure
The project is organized into separate backend and frontend
applications.
ChronoMesh/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── queues/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── workers/
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── api.js
    │   ├── App.jsx
    │   └── App.css
    ├── package.json
    └── ...
Your local project may contain additional files or slightly different
folder names.
5. Requirements
Install or configure the following before starting:
1. Node.js (a supported LTS version).
2. MongoDB running as a replica set. MongoDB Change Streams require
   a replica set or a sharded cluster; a standalone MongoDB server is
   not sufficient.
3. MongoDB Compass (optional, useful for inspecting collections).
4. Memurai or another Redis-compatible server.
5. npm, which is installed with Node.js.
Make sure MongoDB and Memurai are running before starting the backend.
Important: MongoDB replica set
ChronoMesh uses MongoDB Change Streams. Ensure your local MongoDB
deployment is configured as a replica set and that the connection string
points to that deployment.

If Change Streams are unavailable, the outbox watcher may not receive
new-event notifications.
6. Environment configuration
Create or update backend/.env:
PORT=5000

MONGODB_URI=mongodb://127.0.0.1:27017/chronomesh

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

REGION_ID=local-region
REGION_NAME=Local Development
REGION_PRIMARY=true

PUBLIC_BASE_URL=http://localhost:5000
REGION_SHARED_TOKEN=replace_with_a_long_random_secret
REGION_PEERS=

FRONTEND_URL=http://localhost:5173
Notes:
- Use the MongoDB URI that matches your local replica-set
  configuration.
- Set REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD to match your
  Memurai configuration.
- Keep REGION_ID consistent with the local region configuration.
- Replace the example region shared token with a long, random secret.
- Do not commit .env or real webhook secrets to Git.
- The example values are for local development, not production
  deployment.
7. Install dependencies
Open a terminal in the project folder.
Backend
cd backend
npm install
Frontend
Open another terminal:
cd frontend
npm install
If dependencies are already installed, you do not need to install them
again.
8. Start ChronoMesh
Start the services in this order.
Terminal 1: Start MongoDB
Make sure your MongoDB replica-set service is running.
Terminal 2: Start Memurai
Make sure Memurai is running and listening on the configured Redis port
(the example uses 6379).
Terminal 3: Start the backend
cd C:\Users\s\Desktop\ChronoMesh\backend
node server.js
The backend startup logs should indicate that MongoDB and Memurai
connected and that the server is listening on port 5000.

Health endpoint:
GET http://localhost:5000/api/health
Example:
curl http://localhost:5000/api/health
Terminal 4: Start the frontend
cd C:\Users\s\Desktop\ChronoMesh\frontend
npm run dev
Open the Vite URL shown in the terminal. The default is:
http://localhost:5173
The dashboard contains navigation for Dashboard, Endpoints, Events,
Failed Deliveries, and Monitoring.
9. How the event delivery process works
The high-level flow is:
Application creates an event
          |
          v
MongoDB OutboxEvent is saved
          |
          v
MongoDB Change Stream detects the event
          |
          v
Outbox watcher queues a BullMQ job
          |
          v
Worker claims the event lease
          |
          v
Worker loads webhook and signs payload
          |
          v
Worker sends HTTP webhook request
          |
          v
Receiver verifies HMAC signature
          |
          v
Receiver checks idempotency key
          |
          v
Receiver processes event or returns saved duplicate response
          |
          v
ChronoMesh records delivery result
Important data collections
Collection names are based on the Mongoose models and may appear in
lowercase plural form in MongoDB Compass.
- outboxevents --- outgoing events and delivery status.
- webhooks --- destination URL, active status, and signing secret.
- deliveryattempts --- individual delivery attempt records.
- processedwebhooks --- receiver-side idempotency receipts.
- Region health records --- region heartbeat and health information.
10. Register a webhook endpoint
A webhook is the destination that receives an event.

You can register one from the Webhook Endpoints page in the
frontend.

Example local test receiver:
http://localhost:5000/api/test-receiver
Example failing endpoint used only for retry testing:
http://localhost:5000/api/test-failure
The backend creates a random signing secret during webhook registration.
The secret is returned once at registration time. Store it securely. The
webhook model excludes the secret from normal query results.

Do not publish real webhook secrets or commit them to source control.
11. Create an event
The event creation endpoint is:
POST http://localhost:5000/api/events
Required JSON fields:
- eventType --- non-empty event type string.
- payload --- JSON object.
- webhookId --- ID of an active registered webhook.
Example Windows CMD request:
curl -X POST http://localhost:5000/api/events -H "Content-Type: application/json" -d "{\"eventType\":\"payment.completed\",\"payload\":{\"paymentId\":\"PAY-1001\",\"amount\":2500},\"webhookId\":\"YOUR_WEBHOOK_ID\"}"
Replace YOUR_WEBHOOK_ID with the _id of the intended active webhook
returned by:
curl http://localhost:5000/api/webhooks
A successful event creation response includes the event ID, event type,
status, assigned region, webhook ID, and creation time.
12. Test successful webhook delivery
1. Start MongoDB, Memurai, and the backend.
2. Register a webhook pointing to:
   http://localhost:5000/api/test-receiver
3. Copy its webhook ID from the webhook list.
4. Create an event using POST /api/events and that webhook ID.
5. Watch the backend terminal for delivery logs.
6. Open MongoDB Compass and inspect the outboxevents collection.
7. Find the event by its eventId.
For a successful delivery, verify:
- status is DELIVERED.
- deliveredAt has a timestamp.
- lastError is empty or null.
- A successful deliveryattempts record has status: "SUCCESS" and
  an HTTP success status.
The built-in receiver is available locally, so a third-party webhook
service is not required for this test.
13. Test idempotency / duplicate delivery
Idempotency prevents the receiver from performing the same operation
again when it receives a repeated event.

The receiver checks the Idempotency-Key against the
processedwebhooks collection. If a matching receipt is already
COMPLETED, it returns the saved response with duplicate: true.

A test script is provided at:
backend/scripts/testDuplicateDelivery.js
Run it from the backend directory while the backend server is running:
node scripts/testDuplicateDelivery.js
The script uses the existing event ID configured inside the script.
Update that ID if you want to test a different event.

Expected result:
MongoDB connected
Sending the same event again...
HTTP Status: 200
Receiver Response: {
  success: true,
  ...
  duplicate: true
}
SUCCESS: Duplicate event detected!
MongoDB disconnected
Verify in MongoDB Compass:
- processedwebhooks contains a receipt for the event.
- status is COMPLETED.
- idempotencyKey matches the event ID.
- Repeating the same request returns duplicate: true.
The duplicate test posts directly to the receiver. It does not enqueue
another BullMQ job or create another delivery attempt.
14. Test retry handling
The BullMQ queue is configured with:
defaultJobOptions: {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: 1000,
  removeOnFail: false,
}
This configures up to five job attempts, with exponential backoff
beginning at one second. Approximate retry delays after the initial
attempt are 1, 2, 4, and 8 seconds. Actual elapsed time can be longer
due to request timeouts and scheduling.
Development-only failure endpoint
A temporary endpoint can be added to backend/server.js for controlled
testing:
if (process.env.NODE_ENV !== "production") {
  app.post("/api/test-failure", (req, res) => {
    console.log("TEST FAILURE ENDPOINT: Returning HTTP 500");

    return res.status(500).json({
      success: false,
      message: "Intentional failure for retry testing",
    });
  });
}
This endpoint deliberately returns HTTP 500. Keep it development-only
and remove it before production deployment.

Test the endpoint:
curl -X POST http://localhost:5000/api/test-failure -H "Content-Type: application/json" -d "{}"
It should return HTTP 500.
Run the retry test
1. Register a separate webhook named Retry Test Webhook.
2. Set its URL to:
   http://localhost:5000/api/test-failure
3. Get its webhook ID:
   curl http://localhost:5000/api/webhooks
4. Create a new event using that webhook ID:
   curl -X POST http://localhost:5000/api/events -H "Content-Type: application/json" -d "{\"eventType\":\"retry.test\",\"payload\":{\"message\":\"Testing BullMQ retries\"},\"webhookId\":\"YOUR_RETRY_WEBHOOK_ID\"}"
5. Watch the backend logs for repeated failed delivery attempts.
6. Inspect deliveryattempts in MongoDB Compass.
7. Inspect the matching outboxevents document.
Expected final checks after all retries are exhausted:
- There should be up to five attempt records for the test event.
- Each failed attempt should have status: "FAILED".
- The event should eventually have status: "FAILED".
- lastError should describe the HTTP failure.
- The BullMQ job should remain in the failed set because
  removeOnFail is false.
Do not use your successful production-like webhook for this test. Use a
separate test webhook.
15. Test signature verification
ChronoMesh signs the exact serialized request body using HMAC-SHA256.

The signature header format is:
X-ChronoMesh-Signature: sha256=<hex-digest>
The receiver verifies the signature using the webhook's stored secret.

The receiver also checks:
X-ChronoMesh-Event-Id
Idempotency-Key
The event ID, idempotency key, and event ID in the request body must
match.

A request with a missing or invalid signature should be rejected by the
receiver. The receiver code returns HTTP 401 for an invalid signature.
16. SSRF protection
Webhook URLs are validated before registration. The URL security service
checks:
- Only HTTP and HTTPS protocols are accepted.
- URLs containing username/password credentials are rejected.
- URL fragments are rejected.
- Hostnames are resolved through DNS.
- Private and reserved IP addresses are rejected.
- Localhost is allowed only when NODE_ENV is not production.
The worker also uses pinned HTTP agents and disables redirects for
webhook delivery.

Do not disable these checks to make a test pass. Use the
development-only localhost allowance for local testing.
17. Region assignment and monitoring
ChronoMesh assigns an event to a configured region and stores the
selected region ID in the outbox event.

The local development region in the example configuration is:
REGION_ID=local-region
REGION_NAME=Local Development
The Monitoring page and region APIs can be used to inspect worker and
region health.

Multi-region testing limitation: Running one local region verifies
the local region assignment and monitoring path. It does not prove live
cross-region failover. To demonstrate real multi-region failover, deploy
and configure multiple region instances with the required peer
configuration, shared authentication, and compatible database/queue
infrastructure.
18. MongoDB Compass: what to inspect
After running tests, inspect these collections:
outboxevents
Useful fields:
- eventId
- eventType
- payload
- status
- attempts
- regionId
- webhook
- deliveredAt
- lastError
deliveryattempts
Useful fields:
- eventId
- attemptNumber
- status
- httpStatus
- responseBody
- error
- startedAt
- completedAt
- durationMs
processedwebhooks
Useful fields:
- idempotencyKey
- eventId
- status
- responseBody
- processedAt
webhooks
Useful fields:
- name
- url
- active
- createdAt
The webhook secret is excluded from normal Mongoose query results. Avoid
exposing it in screenshots, logs, or documentation.
19. API quick reference
The following routes are visible in the current backend setup.
  Method                  Endpoint                 Purpose
  GET                     /api/health            Backend health check

  GET                     /api/webhooks          List registered
webhooks

  POST                    /api/webhooks          Register a webhook

  GET                     /api/events            List recent events

  POST                    /api/events            Create an event

  GET                     /api/events/:eventId   Get event details

  POST                    /api/test-receiver     Built-in test receiver
(through the test
receiver router)
POST                    /api/test-failure      Development-only
failure test endpoint,
if enabled
Delivery, region, and monitoring routes are also mounted by the backend
under:
- /api/deliveries
- /api/regions
- /api/monitoring
Check the corresponding route files for the exact methods and subpaths.
20. Common problems
Backend cannot connect to MongoDB
- Check that MongoDB is running.
- Check MONGODB_URI in backend/.env.
- Confirm MongoDB is configured as a replica set for Change Streams.
Memurai connection error
- Confirm Memurai is running.
- Check REDIS_HOST and REDIS_PORT.
- Check REDIS_PASSWORD if authentication is enabled.
Change Stream does not detect events
- Confirm the MongoDB deployment is a replica set or sharded cluster.
- Check backend logs for watcher startup errors.
- Confirm the backend is connected to the expected database.
Webhook delivery fails
- Confirm the webhook is active.
- Confirm the receiver URL is reachable from the backend.
- Inspect the event's lastError.
- Inspect the corresponding deliveryattempts records.
- Check whether the HTTP status is retryable under the delivery
  policy.
Localhost webhook URL is rejected
- Localhost is allowed by the provided URL validation code only when
  NODE_ENV is not production.
- Check your environment setting and restart the backend after
  changing it.
- Never enable localhost destinations in production.
Frontend cannot call the backend
- Confirm the backend is running on port 5000.
- Confirm the frontend is running on port 5173.
- Check FRONTEND_URL and the frontend API base URL.
- Inspect browser developer tools for the exact network error.
21. Security and production notes
Before deploying ChronoMesh:
- Use strong, unique secrets and store them in a secure secret
  manager.
- Never commit .env files or webhook signing secrets.
- Use HTTPS for externally reachable webhook destinations.
- Keep the development-only HTTP 500 test route disabled in
  production.
- Keep SSRF validation and pinned connection behavior enabled.
- Configure authentication and authorization for management APIs
  before exposing them publicly.
- Configure TLS, network access controls, backups, monitoring, and
  operational alerting.
- Review retry limits, timeouts, queue retention, and
  dead-letter/replay procedures for your deployment.
- Ensure receiver-side idempotency is implemented around the actual
  business operation, not merely the receipt record.
22. Current testing checklist
Use this checklist when validating a local development environment.
- [ ] MongoDB replica set is running.
- [ ] Memurai is running.
- [ ] Backend starts successfully.
- [ ] Frontend starts successfully.
- [ ] /api/health returns a healthy response.
- [ ] A webhook endpoint can be registered.
- [ ] An event can be created and assigned to a region.
- [ ] A successful webhook delivery is recorded.
- [ ] A delivery attempt is recorded in MongoDB.
- [ ] Duplicate delivery returns duplicate: true.
- [ ] Invalid signature is rejected.
- [ ] HTTP 500 causes retry attempts.
- [ ] Exhausted retries mark the event as failed.
- [ ] SSRF validation rejects private/reserved destinations.
- [ ] Monitoring page displays the available worker and region status.
- [ ] Multi-region failover is tested with multiple actual region
  instances, if that deployment is part of the release.
23. Project summary
ChronoMesh demonstrates reliable asynchronous webhook delivery using an
outbox, change streams, a background queue, retry policies,
cryptographic request signing, receiver-side idempotency, delivery
history, and region-aware processing.

It is intended as an advanced backend/distributed-systems project that
demonstrates how to make event delivery more resilient when networks,
receivers, or workers fail.
