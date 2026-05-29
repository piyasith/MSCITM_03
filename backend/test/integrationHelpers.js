const Admin = require('../models/Admin');
const Setting = require('../models/Setting');
const Restaurant = require('../models/Restaurant');

async function seedSettings() {
  const existing = await Setting.findOne({ key: 'global' });
  if (!existing) await Setting.create({ key: 'global' });
}

async function createSuperAdmin(overrides = {}) {
  return Admin.create({
    email: 'admin@test.com',
    password: 'admin123',
    fullName: 'Test Admin',
    role: 'super_admin',
    ...overrides
  });
}

async function loginAdmin(agent, email = 'admin@test.com', password = 'admin123') {
  const res = await agent.post('/api/admin/login').send({ email, password });
  return res.body.token;
}

async function registerUser(agent, overrides = {}) {
  const payload = {
    name: 'Test User',
    email: 'user@test.com',
    password: 'pass123',
    ...overrides
  };
  const res = await agent.post('/api/user/register').send(payload);
  return { ...res.body, status: res.status };
}

function sampleReviewBody(restaurantId, overrides = {}) {
  return {
    restaurantId,
    userName: 'Test User',
    userEmail: 'user@test.com',
    foodQualityRating: 5,
    customerServiceRating: 4,
    ambienceCleanlinessRating: 4,
    valueForMoneyRating: 4,
    bookingExperienceRating: 5,
    comment: 'Excellent dining experience',
    ...overrides
  };
}

async function createRestaurantViaApi(agent, adminToken, overrides = {}) {
  const res = await agent
    .post('/api/admin/restaurants')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Test Bistro',
      description: 'A cozy place',
      address: '123 Main St',
      location: 'Downtown',
      cuisine: 'Italian',
      priceRange: '$$',
      ...overrides
    });
  return res.body;
}

module.exports = {
  seedSettings,
  createSuperAdmin,
  loginAdmin,
  registerUser,
  sampleReviewBody,
  createRestaurantViaApi
};
