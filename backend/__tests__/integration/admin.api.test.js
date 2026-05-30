const request = require('supertest');
const createApp = require('../../test/app');
const Review = require('../../models/Review');
const {
  seedSettings,
  createSuperAdmin,
  loginAdmin,
  registerUser,
  createRestaurantViaApi,
  sampleReviewBody
} = require('../../test/integrationHelpers');

describe('Admin API', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await seedSettings();
    await createSuperAdmin();
  });

  test('POST /api/admin/login returns token for valid admin', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@test.com', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.admin.email).toBe('admin@test.com');
  });

  test('POST /api/admin/restaurants creates restaurant', async () => {
    const token = await loginAdmin(request(app));
    const res = await request(app)
      .post('/api/admin/restaurants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Admin Kitchen',
        description: 'Fine dining',
        address: '99 Chef Lane',
        cuisine: 'French'
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Admin Kitchen');
  });

  test('GET /api/admin/reviews lists pending reviews for moderation', async () => {
    const agent = request(app);
    const adminToken = await loginAdmin(agent);
    const restaurant = await createRestaurantViaApi(agent, adminToken);
    const { token, user } = await registerUser(agent, { email: 'mod@test.com' });

    await agent
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleReviewBody(restaurant._id, { userName: user.name, userEmail: user.email }));

    const res = await agent
      .get('/api/admin/reviews?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].status).toBe('pending');
  });

  test('PATCH /api/admin/reviews/:id/moderate rejects without reasonCode', async () => {
    const agent = request(app);
    const adminToken = await loginAdmin(agent);
    const restaurant = await createRestaurantViaApi(agent, adminToken);
    const { token, user } = await registerUser(agent);

    await agent
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleReviewBody(restaurant._id, { userName: user.name, userEmail: user.email }));

    const pending = await Review.findOne({ status: 'pending' });
    const res = await agent
      .patch(`/api/admin/reviews/${pending._id}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' });

    expect(res.status).toBe(400);
  });

  test('GET /api/admin/dashboard/summary returns platform metrics', async () => {
    const token = await loginAdmin(request(app));
    const res = await request(app)
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.counts).toBeDefined();
    expect(res.body.reviewVolumeTrend).toBeDefined();
  });
});

describe('Moderation workflow API', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await seedSettings();
    await createSuperAdmin();
  });

  test('pending review is hidden publicly until admin approves it', async () => {
    const agent = request(app);
    const adminToken = await loginAdmin(agent);
    const restaurant = await createRestaurantViaApi(agent, adminToken);
    const { token, user } = await registerUser(agent, { email: 'flow@test.com' });

    await agent
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleReviewBody(restaurant._id, { userName: user.name, userEmail: user.email }));

    const pendingPublic = await agent.get(`/api/restaurants/${restaurant._id}/reviews`);
    expect(pendingPublic.body).toHaveLength(0);

    const review = await Review.findOne({ restaurantId: restaurant._id });
    await agent
      .patch(`/api/admin/reviews/${review._id}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    const approvedPublic = await agent.get(`/api/restaurants/${restaurant._id}/reviews`);
    expect(approvedPublic.status).toBe(200);
    expect(approvedPublic.body).toHaveLength(1);
    expect(approvedPublic.body[0].comment).toMatch(/Excellent dining/);
  });

  test('rejected review triggers notification for author', async () => {
    const agent = request(app);
    const adminToken = await loginAdmin(agent);
    const restaurant = await createRestaurantViaApi(agent, adminToken);
    const { token, user } = await registerUser(agent, { email: 'notify@test.com' });

    await agent
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleReviewBody(restaurant._id, { userName: user.name, userEmail: user.email }));

    const review = await Review.findOne({ userId: user.id });
    await agent
      .patch(`/api/admin/reviews/${review._id}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected', reasonCode: 'spam', reason: 'Promotional content' });

    const notifications = await agent
      .get('/api/user/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(notifications.status).toBe(200);
    expect(notifications.body.some(n => n.type === 'review_rejected')).toBe(true);
  });
});
