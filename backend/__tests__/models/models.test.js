const mongoose = require('mongoose');
const User = require('../../models/User');
const Review = require('../../models/Review');
const Restaurant = require('../../models/Restaurant');
const MenuItem = require('../../models/MenuItem');
const Comment = require('../../models/Comment');

describe('User model', () => {
  test('hashes password before save', async () => {
    const user = await User.create({ name: 'Alice', email: 'alice@test.com', password: 'secret123' });
    expect(user.password).not.toBe('secret123');
    expect(user.password.length).toBeGreaterThan(20);
  });

  test('comparePassword returns true for correct password', async () => {
    const user = await User.create({ name: 'Bob', email: 'bob@test.com', password: 'pass456' });
    expect(await user.comparePassword('pass456')).toBe(true);
    expect(await user.comparePassword('wrong')).toBe(false);
  });

  test('stores email in lowercase', async () => {
    const user = await User.create({ name: 'Carol', email: 'Carol@Test.COM', password: 'x' });
    expect(user.email).toBe('carol@test.com');
  });

  test('defaults role to user and strikes to zero', async () => {
    const user = await User.create({ name: 'Dan', email: 'dan@test.com', password: 'x' });
    expect(user.role).toBe('user');
    expect(user.strikes).toBe(0);
    expect(user.isFlagged).toBe(false);
    expect(user.isBanned).toBe(false);
  });
});

describe('Review model', () => {
  const baseReview = () => ({
    restaurantId: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    userName: 'Reviewer',
    foodQualityRating: 5,
    customerServiceRating: 4,
    ambienceCleanlinessRating: 4,
    valueForMoneyRating: 4,
    bookingExperienceRating: 4,
    comment: 'Great meal'
  });

  test('defaults status to pending', async () => {
    const review = await Review.create(baseReview());
    expect(review.status).toBe('pending');
    expect(review.editCount).toBe(0);
  });

  test('rejects rating below minimum', async () => {
    await expect(
      Review.create({ ...baseReview(), foodQualityRating: 0 })
    ).rejects.toThrow();
  });

  test('requires comment text', async () => {
    const data = baseReview();
    delete data.comment;
    await expect(Review.create(data)).rejects.toThrow();
  });
});

describe('Restaurant model', () => {
  test('requires name, description, and address', async () => {
    await expect(Restaurant.create({ name: 'Only Name' })).rejects.toThrow();
  });

  test('rejects invalid priceRange enum', async () => {
    await expect(
      Restaurant.create({
        name: 'Test Place',
        description: 'Desc',
        address: '123 Main',
        priceRange: '$$$$$'
      })
    ).rejects.toThrow();
  });
});

describe('MenuItem model', () => {
  test('defaults isAvailable to true', async () => {
    const item = await MenuItem.create({
      restaurantId: new mongoose.Types.ObjectId(),
      name: 'Pasta',
      description: 'Fresh pasta',
      price: 12.5
    });
    expect(item.isAvailable).toBe(true);
    expect(item.isRetired).toBe(false);
  });
});

describe('Comment model', () => {
  test('defaults status to pending', async () => {
    const comment = await Comment.create({
      reviewId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      commentText: 'Nice review!'
    });
    expect(comment.status).toBe('pending');
  });
});
