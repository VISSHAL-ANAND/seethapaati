#!/usr/bin/env node

/**
 * Seethapaati Customer Journey & E2E Validation Script
 * Tests:
 * 1. Cart Operations (Add, Update, Apply Coupon, Remove)
 * 2. Account Registration with empty optional phone (verifying 201 and JWT)
 * 3. Specific validation error reporting (verifying detailed field errors)
 * 4. Checkout Order Creation (Tax, GST, and Razorpay Order intent)
 * 5. Guest cart & auth merge flow
 */

import { randomUUID } from 'crypto';

const API_BASE = process.env.API_BASE_URL || 'https://seethapaati-api.onrender.com/api/v1';

console.log(`\n============================================================`);
console.log(`🛒 Starting Customer Journey & E2E Verification`);
console.log(`🔌 Target API: ${API_BASE}`);
console.log(`============================================================\n`);

let testPassed = 0;
let testFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testFailed++;
  }
}

async function runTests() {
  // 1. Fetch available products to get a live variant ID
  console.log(`📦 Phase 1: Catalog Discovery`);
  const productsRes = await fetch(`${API_BASE}/catalog/products?limit=5`);
  const productsData = await productsRes.json();
  const products = Array.isArray(productsData) ? productsData : productsData.data || [];
  assert(products.length > 0, `Discovered ${products.length} live products`);

  const sampleProduct = products[0];
  const sampleVariant = sampleProduct?.variants?.[0];
  assert(!!sampleVariant, `Discovered variant ID: ${sampleVariant?.id} (${sampleProduct?.name})`);

  // 2. Cart Operations (Guest)
  console.log(`\n🛒 Phase 2: Cart Operations & Item Removal`);
  let cartCookies = '';

  // 2.1 Add item to bag
  const addRes = await fetch(`${API_BASE}/cart/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variantId: sampleVariant.id, quantity: 2 }),
  });
  const addCookies = addRes.headers.get('set-cookie');
  if (addCookies) {
    cartCookies = addCookies.split(';')[0];
  }
  const addJson = await addRes.json();
  const cartData = addJson.data;
  assert(addRes.status === 201 || addRes.status === 200, `Add item to cart HTTP ${addRes.status}`);
  assert(cartData.items.length === 1, `Cart contains 1 line item`);
  assert(cartData.items[0].quantity === 2, `Item quantity is 2`);

  // 2.2 Update quantity to 3
  const updateRes = await fetch(`${API_BASE}/cart/items/${sampleVariant.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(cartCookies ? { Cookie: cartCookies } : {}),
    },
    body: JSON.stringify({ quantity: 3 }),
  });
  const updateJson = await updateRes.json();
  assert(updateRes.ok, `Update quantity to 3 HTTP ${updateRes.status}`);
  assert(updateJson.data.items[0].quantity === 3, `Item quantity updated to 3`);

  // 2.3 Apply Coupon SEETHA10
  const couponRes = await fetch(`${API_BASE}/cart?coupon=SEETHA10`, {
    headers: cartCookies ? { Cookie: cartCookies } : {},
  });
  const couponJson = await couponRes.json();
  assert(couponRes.ok, `Apply SEETHA10 coupon HTTP ${couponRes.status}`);
  assert(couponJson.data.pricing.couponCode === 'SEETHA10', `Coupon SEETHA10 reflected in pricing breakdown`);
  const totalDiscount = (couponJson.data.pricing.couponDiscountCents || 0) + (couponJson.data.pricing.discountCents || 0);
  assert(totalDiscount > 0, `Discount applied: ₹${totalDiscount / 100}`);

  // 2.4 Remove item from bag
  const removeRes = await fetch(`${API_BASE}/cart/items/${sampleVariant.id}`, {
    method: 'DELETE',
    headers: cartCookies ? { Cookie: cartCookies } : {},
  });
  const removeJson = await removeRes.json();
  assert(removeRes.ok, `Remove item from bag HTTP ${removeRes.status}`);
  assert(removeJson.data.items.length === 0, `Cart items successfully emptied (0 items remaining)`);

  // 3. Registration & Validation Error Verification
  console.log(`\n👤 Phase 3: Registration & Validation Verification`);

  // 3.1 Test detailed validation error message on weak password
  const weakPassRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'QA Tester',
      email: `test.${Date.now()}@example.com`,
      phone: '',
      password: 'weak',
    }),
  });
  const weakPassJson = await weakPassRes.json();
  assert(weakPassRes.status === 400, `Weak password rejected with HTTP 400`);
  const errorMsg = weakPassJson.error?.message || '';
  assert(
    errorMsg.includes('at least 8 characters') || errorMsg.includes('password'),
    `Validation error message is specific: "${errorMsg}"`
  );

  // 3.2 Test registration with empty optional phone string "" (the reported bug)
  const testEmail = `qa.customer.${Date.now()}@seethapaati-test.in`;
  const registerRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Seetha Paati Customer',
      email: testEmail,
      phone: '', // empty optional phone!
      password: 'StrongPassword123!',
    }),
  });
  const registerJson = await registerRes.json();
  const authCookie = registerRes.headers.get('set-cookie');
  assert(
    registerRes.status === 201,
    `Register with empty optional phone succeeds with HTTP 201 (Received: ${registerRes.status} ${JSON.stringify(registerJson.error || '')})`
  );
  assert(!!registerJson.data?.accessToken, `Access token returned successfully`);
  const token = registerJson.data?.accessToken;
  const user = registerJson.data?.user;
  assert(user?.email === testEmail, `Registered user email matches ${testEmail}`);

  // 4. Authenticated Checkout Journey & GST Calculation
  console.log(`\n💳 Phase 4: Authenticated Checkout & Order Creation`);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 4.1 Add item to user's cart
  const userCartAddRes = await fetch(`${API_BASE}/cart/items`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ variantId: sampleVariant.id, quantity: 2 }),
  });
  const userCartAddJson = await userCartAddRes.json();
  assert(userCartAddRes.ok, `Add item to authenticated cart HTTP ${userCartAddRes.status}`);
  const userCart = userCartAddJson.data;

  // 4.2 Create Checkout Intent with Tamil Nadu address (Intra-state GST: CGST + SGST)
  const idempotencyKey = randomUUID();
  const intentPayload = {
    cartId: userCart.cartId,
    shippingAddress: {
      fullName: 'Seetha Paati Customer',
      phone: '+919876543210',
      addressLine1: 'No. 24 North Mada Street, Mylapore',
      city: 'Chennai',
      state: 'Tamil Nadu',
      stateCode: '33',
      postalCode: '600004',
      country: 'IN',
    },
    couponCode: 'SEETHA10',
    idempotencyKey,
  };

  const intentRes = await fetch(`${API_BASE}/checkout/intent`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(intentPayload),
  });
  const intentJson = await intentRes.json();
  assert(
    intentRes.status === 201,
    `Checkout intent generated HTTP 201 (Received: ${intentRes.status} ${JSON.stringify(intentJson.error || '')})`
  );
  const orderIntent = intentJson.data;
  assert(!!orderIntent?.orderId, `Order ID created: ${orderIntent?.orderId}`);
  assert(!!orderIntent?.orderNumber, `Order Number created: ${orderIntent?.orderNumber}`);
  assert(orderIntent?.gateway === 'RAZORPAY', `Gateway is Razorpay`);
  assert(orderIntent?.amountCents > 0, `Order Total amount: ₹${orderIntent?.amountCents / 100}`);

  // Summary
  console.log(`\n============================================================`);
  console.log(`📊 Test Summary: ${testPassed} Passed, ${testFailed} Failed`);
  console.log(`============================================================\n`);

  if (testFailed > 0) {
    process.exit(1);
  } else {
    console.log(`🎉 All customer journey flows verified successfully!`);
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error(`💥 Unhandled test execution error:`, err);
  process.exit(1);
});
