/**
 * @file backend/tests/e2e.ts
 * 
 * @why-file-exists
 * Executes a full integration test suite across all 10 microservices.
 * 
 * @why-pattern-selected
 * Programmatic Orchestration and Assertion testing. Starts background child instances, 
 * polls for ready states, and runs sequential API calls to verify end-to-end flows.
 * 
 * @performance-impact
 * Spawns 10 Node processes in parallel. Closes all connections and processes cleanly on exit.
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { MongoClient } from 'mongodb';

let currentDirName = '';
try {
  currentDirName = __dirname;
} catch (e) {
  // ESM fallback
  currentDirName = path.dirname(new URL(import.meta.url).pathname);
}

const SERVICES = [
  { name: 'api-gateway', dir: 'api-gateway', port: 3000 },
  { name: 'auth-service', dir: 'auth-service', port: 3001 },
  { name: 'product-service', dir: 'product-service', port: 3002 },
  { name: 'inventory-service', dir: 'inventory-service', port: 3003 },
  { name: 'cart-service', dir: 'cart-service', port: 3004 },
  { name: 'wishlist-service', dir: 'wishlist-service', port: 3006 },
  { name: 'order-service', dir: 'order-service', port: 3005 },
  { name: 'payment-service', dir: 'payment-service', port: 3007 },
  { name: 'notification-service', dir: 'notification-service', port: 3008 },
  { name: 'review-service', dir: 'review-service', port: 3009 },
  { name: 'admin-service', dir: 'admin-service', port: 3010 },
];

const spawnedProcesses: { name: string; process: ChildProcess }[] = [];

// Helper to sleep
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to check health check port
const checkHealth = async (port: number): Promise<boolean> => {
  try {
    const res = await fetch(`http://localhost:${port}/health`);
    if (res.ok) {
      const body = await res.json();
      return body.status === 'healthy';
    }
  } catch (e) {
    // Ignore connection errors during startup polling
  }
  return false;
};

// Start all microservices in background
const startServices = async () => {
  console.log('\n=== [1/5] Starting all microservices ===');

  for (const svc of SERVICES) {
    console.log(`Starting ${svc.name} on port ${svc.port}...`);
    const proc = spawn('npx', ['tsx', 'src/index.ts'], {
      cwd: path.join(currentDirName, '..', svc.dir),
      env: {
        ...process.env,
        PORT: String(svc.port),
        NODE_ENV: 'test',
        MONGO_URI: `mongodb://localhost:27017/eshop_test_${svc.dir.replace('-service', '')}`,
        REDIS_URL: 'redis://localhost:6379',
        RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://flipkart:flipkart123@localhost:5672',
      },
      stdio: 'pipe',
    });

    // Capture logs to print if services fail
    proc.stdout?.on('data', (data) => {
      console.log(`[${svc.name}] ${data.toString().trim()}`);
    });
    proc.stderr?.on('data', (data) => {
      console.error(`[${svc.name} ERROR] ${data.toString().trim()}`);
    });

    spawnedProcesses.push({ name: svc.name, process: proc });
  }

  // Poll health checks until all are ready (up to 30 seconds)
  const maxRetries = 30;
  for (let i = 1; i <= maxRetries; i++) {
    await sleep(1000);
    console.log(`Polling services health checks (Attempt ${i}/${maxRetries})...`);
    let allHealthy = true;
    const statusReport: string[] = [];
    
    for (const svc of SERVICES) {
      const healthy = await checkHealth(svc.port);
      statusReport.push(`${svc.name}: ${healthy ? 'ONLINE' : 'OFFLINE'}`);
      if (!healthy) {
        allHealthy = false;
      }
    }
    console.log(`Status Report: ${statusReport.join(', ')}`);

    if (allHealthy) {
      console.log('All microservices are ONLINE and healthy!');
      return;
    }
  }

  throw new Error('Timeout: Not all microservices launched successfully within 30 seconds.');
};

// Kill all processes cleanly
const cleanup = () => {
  console.log('\n=== Cleaning up background service processes ===');
  for (const spawned of spawnedProcesses) {
    console.log(`Killing ${spawned.name}...`);
    spawned.process.kill('SIGINT');
  }
};

// Run E2E scenarios
const runScenarios = async () => {
  console.log('\n=== [2/5] Running Authentication E2E flows ===');
  const gateUrl = 'http://localhost:3000/api/v1';

  const uniqueId = Date.now();
  const testUsername = `e2etester_${uniqueId}`;
  const testEmail = `e2e_${uniqueId}@example.com`;

  // 1. Register a test user
  console.log('Testing Register mutation...');
  const regRes = await fetch(`${gateUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      email: testEmail,
      password: 'password123',
      firstname: 'John',
      lastname: 'Doe',
      phone: '123456789',
    }),
  });

  if (!regRes.ok) {
    throw new Error(`Registration failed with status ${regRes.status}: ${await regRes.text()}`);
  }
  const regBody = await regRes.json();
  console.log('Successfully registered user! Returned ID:', regBody.data.user.id);

  // 2. Login as the newly created user
  console.log('Testing Login mutation...');
  const loginRes = await fetch(`${gateUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      password: 'password123',
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
  }
  const loginBody = await loginRes.json();
  const token = loginBody.data.accessToken;
  const userId = loginBody.data.user.id;
  console.log(`Successfully logged in! Received accessToken, user ID: ${userId}, role: ${loginBody.data.user.role}`);

  console.log('\n=== [3/5] Catalog and Cart operations ===');
  
  // 3. Fetch products list from catalog (uses Redis cache behind-the-scenes)
  const prodRes = await fetch(`${gateUrl}/products`);
  if (!prodRes.ok) throw new Error('Failed to fetch catalog list');
  const products = await prodRes.json();
  console.log(`Successfully loaded catalog! Found ${products.length} products.`);

  // 4. Add items to user's cart
  console.log('Adding item (Product ID: 2, Qty: 3) to cart...');
  const cartRes = await fetch(`${gateUrl}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ productId: 2, quantity: 3 }),
  });
  if (!cartRes.ok) throw new Error(`Failed to add item to cart: ${await cartRes.text()}`);
  const cart = await cartRes.json();
  console.log(`Cart updated successfully! Items count: ${cart.items.length}`);

  console.log('\n=== [4/5] Transactional Saga: Checkout Flow ===');
  
  // 5. Checkout Cart -> triggers order.created -> inventory lock -> payment completion
  console.log('Dispatching order checkout trigger...');
  const checkoutRes = await fetch(`${gateUrl}/orders/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: [
        { productId: 2, quantity: 3, price: 22.3 },
      ],
      shippingAddress: {
        fullName: 'John Doe',
        street: '123 E2E Lane',
        city: 'Testing Town',
        state: 'TS',
        zipCode: '12345',
        country: 'United States',
      },
    }),
  });
  if (!checkoutRes.ok) throw new Error(`Checkout failed: ${await checkoutRes.text()}`);
  const checkoutData = await checkoutRes.json();
  console.log(`Checkout accepted! Order ID: ${checkoutData.orderId}, Status: ${checkoutData.status}`);

  // Poll order status until Completed (choreographed rabbitmq queues processing)
  let orderStatus = checkoutData.status;
  const maxPolls = 10;
  for (let poll = 1; poll <= maxPolls; poll++) {
    await sleep(1000);
    console.log(`Polling Order Status (Attempt ${poll}/${maxPolls})...`);
    
    const getOrderRes = await fetch(`${gateUrl}/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (getOrderRes.ok) {
      const ordersList = await getOrderRes.json();
      const currentOrder = ordersList.find((o: any) => o.orderId === checkoutData.orderId);
      if (currentOrder) {
        orderStatus = currentOrder.status;
        console.log(`Current Order Status in database: '${orderStatus}'`);
        if (orderStatus === 'completed' || orderStatus === 'cancelled') {
          break;
        }
      }
    }
  }

  if (orderStatus !== 'completed') {
    throw new Error(`E2E Checkout Saga did not complete successfully. End status: ${orderStatus}`);
  }
  console.log('SAGA TRANSACTION FULLY RESOLVED! Stock locked and billing processed successfully.');

  console.log('\n=== [5/5] Review & Event-Driven Rating Updates ===');
  
  // 6. Submit a review for Product ID 2
  console.log('Submitting 5-star review for product 2...');
  const reviewRes = await fetch(`${gateUrl}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      productId: 2,
      rating: 5,
      comment: 'Absolutely amazing! Highly recommend E2E testing!',
    }),
  });
  if (!reviewRes.ok) throw new Error(`Review submission failed: ${await reviewRes.text()}`);
  const reviewBody = await reviewRes.json();
  console.log(`Review recorded! ID: ${reviewBody._id}, rating: ${reviewBody.rating}`);

  // Wait 1.5 seconds for review.updated event to propagate to Product Service and update Redis
  console.log('Waiting for RabbitMQ review propagation event and Redis cache invalidation...');
  await sleep(1500);

  // Fetch Product ID 2 details and assert rating has updated
  const getProductRes = await fetch(`${gateUrl}/products/2`);
  if (!getProductRes.ok) throw new Error('Failed to fetch product details after review');
  const productDetails = await getProductRes.json();
  console.log(`Product 2 Details - Updated Rating: ${productDetails.rating.rate} stars (Count: ${productDetails.rating.count})`);

  if (productDetails.rating.rate !== 5) {
    throw new Error(`Rating synchronization failed. Expected 5 stars, got ${productDetails.rating.rate}`);
  }
  console.log('Event-driven catalog rating synchronization check: SUCCESS!');

  console.log('\n=== [6/5] Admin Service dashboard summaries ===');
  // Promote the user to admin in the test DB
  console.log('Promoting user to admin in MongoDB test database...');
  const mongoClient = new MongoClient('mongodb://localhost:27017');
  await mongoClient.connect();
  const db = mongoClient.db('eshop_test_auth');
  await db.collection('users').updateOne({ _id: userId }, { $set: { role: 'admin' } });
  await mongoClient.close();
  console.log('User promoted successfully.');

  // Re-authenticate to get a token with admin role
  console.log('Re-authenticating to retrieve admin-scoped JWT...');
  const adminLoginRes = await fetch(`${gateUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      password: 'password123',
    }),
  });
  if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${await adminLoginRes.text()}`);
  const adminLoginBody = await adminLoginRes.json();
  const adminToken = adminLoginBody.data.accessToken;
  console.log('Admin login successful!');

  // 7. Query admin dashboard statistics.
  const adminRes = await fetch(`${gateUrl}/admin/dashboard/summary`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  });
  if (!adminRes.ok) {
    throw new Error(`Admin dashboard query failed with status ${adminRes.status}: ${await adminRes.text()}`);
  }
  const adminSummary = await adminRes.json();
  console.log('Admin Summary retrieved successfully! Services Status check:');
  console.log(JSON.stringify(adminSummary.servicesStatus, null, 2));
};

// Main E2E runner loop
const main = async () => {
  try {
    await startServices();
    await runScenarios();
    console.log('\n🎉 ALL END-TO-END INTEGRATION TEST SUITES PASSED SUCCESSFULY! 🎉');
  } catch (error: any) {
    console.error('\n❌ INTEGRATION FLOW FAILURE:', error.message);
    process.exitCode = 1;
  } finally {
    cleanup();
    process.exit();
  }
};

main();
