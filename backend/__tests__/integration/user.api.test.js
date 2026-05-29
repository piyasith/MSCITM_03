const request = require('supertest');
const createApp = require('../../test/app');
const {
  seedSettings,
  createSuperAdmin,
  loginAdmin,
  registerUser,
  createRestaurantViaApi,
  sampleReviewBody
} = require('../../test/integrationHelpers');

describe('User API', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await seedSettings();
    await createSuperAdmin();
  });

  test('POST /api/user/register creates account and returns token', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@test.com');
  });

  test('POST /api/user/login returns token for valid credentials', async () => {
    await request(app)
      .post('/api/user/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'pass456' });

    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'bob@test.com', password: 'pass456' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('GET /api/user/profile returns authenticated user', async () => {
    const { token } = await registerUser(request(app), { email: 'profile@test.com' });
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('profile@test.com');
    expect(res.body.password).toBeUndefined();
  });

  test('POST /api/reviews creates pending review for logged-in user', async () => {
    const agent = request(app);
    const adminToken = await loginAdmin(agent);
    const restaurant = await createRestaurantViaApi(agent, adminToken);
    const { token, user } = await registerUser(agent, { email: 'reviewer@test.com' });

    const res = await agent
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleReviewBody(restaurant._id, { userName: user.name, userEmail: user.email }));

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/pending moderation/i);
  });

  test('GET /api/user/my-reviews lists own submissions with status', async () => {
    const agent = request(app);
    const adminToken = await loginAdmin(agent);
    const restaurant = await createRestaurantViaApi(agent, adminToken);
    const { token, user } = await registerUser(agent, { email: 'mine@test.com' });

    await agent
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleReviewBody(restaurant._id, { userName: user.name, userEmail: user.email }));

    const res = await agent
      .get('/api/user/my-reviews')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('pending');
  });
});
