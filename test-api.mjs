import { setTimeout as delay } from 'node:timers/promises';

process.env.NODE_ENV = 'test';

const base = 'http://127.0.0.1:3456';
const uniqueUser = `tester_${Date.now()}`;
const uniqueProduct = `Node.js Essentials ${Date.now()}`;

const serverModule = await import('./server.js');
const { app } = serverModule;

const server = app.listen(3456, async () => {
  try {
    const registerResponse = await fetch(`${base}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uniqueUser, password: 'pass123' })
    });

    const registerText = await registerResponse.text();
    console.log('REGISTER_STATUS', registerResponse.status, registerText.slice(0, 120));

    const loginResponse = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uniqueUser, password: 'pass123' })
    });

    const cookies = loginResponse.headers.get('set-cookie') || '';
    console.log('LOGIN_STATUS', loginResponse.status, 'COOKIE_SET', Boolean(cookies));

    const productResponse = await fetch(`${base}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies
      },
      body: JSON.stringify({
        name: uniqueProduct,
        category: 'Books',
        price: 24.5,
        stock: 5,
        description: 'Learning guide'
      })
    });

    const productPayload = await productResponse.json();
    console.log('PRODUCT_CREATE_STATUS', productResponse.status, productPayload);

    const listResponse = await fetch(`${base}/products`, {
      method: 'GET',
      headers: { Cookie: cookies }
    });

    console.log('PRODUCT_LIST_STATUS', listResponse.status);
    console.log((await listResponse.text()).slice(0, 200));

    const bookingResponse = await fetch(`${base}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies
      },
      body: JSON.stringify({
        productId: productPayload.product._id,
        bookingDate: '2026-10-20',
        startTime: '09:00',
        endTime: '10:00',
        notes: 'Testing'
      })
    });

    console.log('BOOKING_STATUS', bookingResponse.status);
    console.log(await bookingResponse.text());

    await delay(200);
    server.close();
  } catch (error) {
    console.error('TEST_ERROR', error);
    server.close();
    process.exitCode = 1;
  }
});
