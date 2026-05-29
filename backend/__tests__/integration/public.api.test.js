const request = require('supertest');
const createApp = require('../../test/app');
const { seedSettings, createSuperAdmin, loginAdmin, createRestaurantViaApi } = require('../../test/integrationHelpers');

describe('Public API', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await seedSettings();
  });

  test('GET /api/restaurants returns empty list initially', async () => {
    const res = await request(app).get('/api/restaurants');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('GET /api/restaurants/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/restaurants/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Not found');
  });

  test('GET /api/restaurants lists created restaurants', async () => {
    await createSuperAdmin();
    const token = await loginAdmin(request(app));
    await createRestaurantViaApi(request(app), token, { name: 'Pizza Hub' });

    const res = await request(app).get('/api/restaurants');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Pizza Hub');
  });

  test('GET /api/restaurants?search= filters by name', async () => {
    await createSuperAdmin();
    const agent = request(app);
    const token = await loginAdmin(agent);
    await createRestaurantViaApi(agent, token, { name: 'Sushi Spot' });
    await createRestaurantViaApi(agent, token, { name: 'Burger Barn' });

    const res = await agent.get('/api/restaurants?search=sushi');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Sushi Spot');
  });

  test('GET /api/reason-codes/review returns policy codes', async () => {
    const res = await request(app).get('/api/reason-codes/review');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining(['spam', 'abuse']));
  });

  test('POST /api/reviews returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .send({ comment: 'No auth' });
    expect(res.status).toBe(401);
  });
});
