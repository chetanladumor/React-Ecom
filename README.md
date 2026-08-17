# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

RUN project:

This will spin up the database, all the backend microservices, the API Gateway, and the frontend application.

cd backend
docker compose up -d

http://localhost:8080/

To stop everything:

cd backend
docker compose down

To view logs:
cd backend
docker compose logs -f

To rebuild the project after making code changes:
cd backend
docker compose up -d --build

When you run docker compose up -d in the backend/ directory, it starts a total of 15 services, which can be grouped into 4 main categories:

1. The Frontend Application
   frontend (Port 8080): The React web application that you interact with in your browser.
2. The API Gateway
   api-gateway (Port 3000): The entry point for all frontend requests. It handles CORS, rate limiting, and routes incoming traffic to the correct backend microservice.
3. Core Backend Microservices
   These handle the actual business logic of the e-commerce platform:

auth-service (Port 3001): Handles user registration, login, and JWT tokens.
product-service (Port 3002): Manages the product catalog, categories, and details.
inventory-service (Port 3003): Tracks stock levels and product availability.
cart-service (Port 3004): Manages the user's shopping cart.
order-service (Port 3005): Processes checkout and order creation.
wishlist-service (Port 3006): Stores the user's saved items.
payment-service (Port 3007): Handles mock payment processing.
notification-service (Port 3008): Responsible for sending alerts or emails (often listens to RabbitMQ).
review-service (Port 3009): Handles product reviews and ratings.
admin-service (Port 3010): Provides administrative capabilities (e.g., managing users or products). 4. Infrastructure & Databases
These are the foundational technologies that support the microservices:

mongodb (Port 27018): The NoSQL database used to store all application data (users, products, orders, etc.).
redis (Port 6380): An in-memory data store used for fast caching (e.g., caching products or cart data).
rabbitmq (Ports 5672 / 15672): The message broker that allows the microservices to communicate with each other asynchronously (e.g., the order-service telling the notification-service to send an email).
All of these are automatically wired together to communicate securely over an internal Docker network (eshop-network).

The API Gateway acts as the central entry point (a "reverse proxy") for all requests coming from the frontend. Instead of the frontend trying to communicate directly with 10 different backend microservices on 10 different ports, it sends all requests to the Gateway on Port 3000. The Gateway then handles security, authentication, and forwards (proxies) the request to the correct microservice.

Here is a complete overview of how it works and where the code is located:

1. The Core Setup & Middlewares (backend/api-gateway/src/index.ts)
   This is the main entry point for the Gateway server. It sets up an Express application and binds a series of global middlewares before any requests are routed:

Security Headers (helmet): Adds standard HTTP security headers.
CORS Policy (cors): Dictates which frontend origins are allowed to make requests (this is what we debugged earlier).
Rate Limiting (express-rate-limit): Protects the backend from DDoS attacks by limiting IP addresses to 100 requests per 15-minute window.
Authentication (authMiddleware): Validates incoming JWT tokens globally and attaches the decoded user data to the request.
Logging (loggerMiddleware): Generates a unique correlationId for every request to trace it across the distributed microservices. 2. The Configuration Manager (backend/api-gateway/src/config/gateway.config.ts)
This file consolidates all the environment variables and target URLs.

It maps names like config.services.auth to the internal Docker network URL (http://eshop-auth-service:3001).
This allows the Gateway to know exactly where to send traffic for a specific service. 3. The Reverse Proxy Router (backend/api-gateway/src/routes/proxy.routes.ts)
This is where the actual forwarding happens using a library called http-proxy-middleware. All traffic that hits /api/v1/... goes through this router.

How it routes traffic:

A request to /api/v1/products is intercepted by the proxy.
The proxy checks its table, sees that /products should go to config.services.product.
It rewrites the path (strips out /api/v1/products) and forwards the raw network stream to http://eshop-product-service:3002.
Header Propagation (Important!): Because the Gateway handles authentication centrally, the individual microservices don't need to verify JWT tokens. Instead, the proxy intercepts the request and injects trusted downstream headers before forwarding it to the internal network:

typescript
onProxyReq: (proxyReq, req) => {
// The gateway verified the JWT, now we pass the user details securely
// to the internal microservices via internal headers.
if (req.headers['x-user-id']) {
proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
}
// Also propagates correlation IDs for tracking logs across multiple services
if (req.correlationId) {
proxyReq.setHeader('x-correlation-id', req.correlationId);
}
}
Summary of the Flow
User clicks "Login" on the frontend (http://localhost:8080).
Frontend sends a POST request to http://localhost:3000/api/v1/auth/login.
The request hits index.ts, passes CORS and Rate Limiting.
The request hits proxy.routes.ts.
The proxy forwards the payload securely to the internal Docker container at http://eshop-auth-service:3001/login.
This design pattern is incredibly powerful because it centralizes security and configuration, making your microservices smaller and easier to manage!

RabbitMQ:

In this project, RabbitMQ is used as the backbone for asynchronous, event-driven communication between the microservices. Instead of the microservices talking directly to each other via HTTP (which can cause bottlenecks if one service is slow or down), they use a Publish/Subscribe (Pub/Sub) pattern.

Here is a complete breakdown of how it works, based on the codebase:

1. The Central Exchange
   All messages go through a central RabbitMQ "Topic Exchange" named eshop.events. You can think of this exchange as a central post office that receives all outgoing mail and knows exactly which queues (mailboxes) to route them to based on a "routing key".

2. The Publishers (Broadcasting Events)
   When a microservice performs an important action, it publishes an event to the eshop.events exchange. For example, in the Order Service (order-service/src/events/publisher.ts), when a user checks out, it runs code like this:

typescript
channel.publish('eshop.events', 'order.completed', messageBuffer, { persistent: true });
Notice that the Order Service does not care who is listening. It just shouts into the void: "Hey everyone, an order was completed!" and immediately finishes the HTTP request for the user, making the API extremely fast.

3. The Consumers (Listening for Events)
   Other microservices that care about these actions act as consumers. They create their own dedicated queues and "bind" them to the exchange, asking RabbitMQ to send them specific events.

For example, the Notification Service (notification-service/src/events/consumer.ts) sets up a queue called notification.alerts-queue and binds it to specific routing keys:

typescript
// 3. Bind queue to relevant routing keys
await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'user.registered');
await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'order.completed');
When RabbitMQ sees the order.completed event from the Order Service, it immediately drops a copy of that event into the Notification Service's queue.

4. Message Processing & Reliability
   The consumer (Notification Service) reads the message from the queue and processes it (e.g., by simulating an email send):

typescript
if (routingKey === 'order.completed') {
const { orderId, userId, totalAmount } = content.data;
logger.info(`[SIMULATION] Sending ORDER CONFIRMATION email...`);
}
Why is this incredibly robust?

Acknowledge/Reject: If the Notification Service successfully sends the email, it tells RabbitMQ it's done (channel.ack(msg)). If it crashes or the email provider is down, it rejects the message (channel.nack(msg, false, true)), and RabbitMQ will hold onto it and try again later. No data is ever lost.
Decoupling: If the Notification Service goes completely offline, the Order Service still works perfectly. The checkout process won't break; the emails will just sit safely in RabbitMQ until the Notification Service comes back online!

RabbitMQ Event Architecture Overview
This project uses an Event Choreography (Saga) Pattern where microservices communicate state changes through RabbitMQ. All events are published to the eshop.events topic exchange.

Here is the complete mapping of every event, who produces it, who consumes it, where to find the code, and why it exists.

1. User Events
   user.registered
   Producer: Auth Service
   File: backend/auth-service/src/services/auth.service.ts
   Consumer: Notification Service
   File: backend/notification-service/src/events/consumer.ts
   Use Case: When a new user signs up successfully, the Auth service fires this event. The Notification service catches it to dispatch a "Welcome to the App" email.
2. The Order Saga (Checkout Flow)
   The checkout process spans multiple services. It is completely asynchronous.

Step 1: order.created
Producer: Order Service
File: backend/order-service/src/services/order.service.ts
Consumer: Inventory Service
File: backend/inventory-service/src/events/consumer.ts
Use Case: A user clicks "checkout". The order is saved as PENDING and this event is fired. The Inventory Service listens to it to try and reserve the requested items so nobody else can buy them.
Step 2 (Success Path): inventory.reserved
Producer: Inventory Service
File: backend/inventory-service/src/events/consumer.ts
Consumer: Payment Service
File: backend/payment-service/src/events/consumer.ts
Use Case: The inventory had enough stock and held it successfully. It fires this event to tell the Payment Service to actually charge the user's credit card.
Step 2 (Failure Path): inventory.failed
Producer: Inventory Service
File: backend/inventory-service/src/events/consumer.ts
Consumer: Order Service
File: backend/order-service/src/events/consumer.ts
Use Case: The items were out of stock. It tells the Order service to immediately fail and cancel the pending order.
Step 3 (Success Path): payment.completed
Producer: Payment Service
File: backend/payment-service/src/events/consumer.ts
Consumer: Order Service
File: backend/order-service/src/events/consumer.ts
Use Case: The credit card was charged successfully. The Order service marks the order status as COMPLETED.
Step 3 (Failure Path): payment.failed
Producer: Payment Service
File: backend/payment-service/src/events/consumer.ts
Consumer: Order Service
File: backend/order-service/src/events/consumer.ts
Use Case: The credit card declined. The Order service marks the order status as CANCELLED. 3. Order Completion & Cleanup
When an order reaches its final state (COMPLETED or CANCELLED), the Order service fires a final event to tie up loose ends.

order.completed
Producer: Order Service
File: backend/order-service/src/services/order.service.ts
Consumers:
Notification Service (backend/notification-service/src/events/consumer.ts) -> Sends the user an Order Confirmation Email with a receipt.
Inventory Service (backend/inventory-service/src/events/consumer.ts) -> Permanently deducts the "reserved" items from the stock database.
order.cancelled
Producer: Order Service
File: backend/order-service/src/services/order.service.ts
Consumers:
Notification Service (backend/notification-service/src/events/consumer.ts) -> Sends the user an email explaining why their order failed.
Inventory Service (backend/inventory-service/src/events/consumer.ts) -> Takes the items that were temporarily "reserved" and puts them back on the virtual shelf for others to buy. 4. Product Catalog Events
review.updated
Producer: Review Service
File: backend/review-service/src/services/review.service.ts
Consumer: Product Service
File: backend/product-service/src/events/consumer.ts
Use Case: When a user leaves a 5-star review, the Review Service stores it. It then publishes this event containing the new average rating and total review count. The Product Service listens to it to cache these numbers directly on the Product document in MongoDB so product listing pages load extremely fast without needing to calculate averages on the fly.
