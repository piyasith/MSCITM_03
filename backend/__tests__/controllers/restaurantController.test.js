jest.mock('../../models/Restaurant');
jest.mock('../../models/MenuItem');
jest.mock('../../models/Review');
jest.mock('../../models/CompanyResponse');
jest.mock('../../utils/scoring', () => ({
  getSettings: jest.fn().mockResolvedValue({
    weights: {
      foodQuality: 0.3,
      customerService: 0.2,
      ambienceCleanliness: 0.15,
      valueForMoney: 0.2,
      bookingExperience: 0.1,
      miscellaneous: 0.05
    },
    minReviewCountForRanking: 1,
    recencyHalfLifeDays: 180
  }),
  aggregate: jest.fn().mockReturnValue({
    averageRating: 4,
    weightedRating: 4.2,
    reviewCount: 2,
    eligibleForRanking: true
  })
}));

const Restaurant = require('../../models/Restaurant');
const MenuItem = require('../../models/MenuItem');
const Review = require('../../models/Review');
const CompanyResponse = require('../../models/CompanyResponse');
const restaurantController = require('../../controllers/restaurantController');
const { mockReq, mockRes } = require('../../test/helpers');

describe('restaurantController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getRestaurantById returns 404 when restaurant missing', async () => {
    Restaurant.findById = jest.fn().mockResolvedValue(null);
    const req = mockReq({ params: { id: 'missing' } });
    const res = mockRes();
    await restaurantController.getRestaurantById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not found' });
  });

  test('searchFoodItems returns empty array when no query params', async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();
    await restaurantController.searchFoodItems(req, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('getRestaurants applies search filter and returns rated list', async () => {
    const restaurantDoc = {
      _id: 'r1',
      toObject: () => ({ _id: 'r1', name: 'Pizza Palace' })
    };
    Restaurant.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([restaurantDoc])
    });
    Review.find = jest.fn().mockResolvedValue([]);

    const req = mockReq({ query: { search: 'pizza' } });
    const res = mockRes();
    await restaurantController.getRestaurants(req, res);

    expect(Restaurant.find).toHaveBeenCalledWith(
      expect.objectContaining({ name: { $regex: 'pizza', $options: 'i' } })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Pizza Palace', reviewCount: 2 })
      ])
    );
  });

  test('getRestaurantById includes menu and approved reviews', async () => {
    const restaurant = {
      _id: 'r1',
      name: 'Bistro',
      toObject: () => ({ _id: 'r1', name: 'Bistro' })
    };
    Restaurant.findById = jest.fn().mockResolvedValue(restaurant);
    MenuItem.find = jest.fn().mockResolvedValue([{ name: 'Soup' }]);
    Review.find = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    CompanyResponse.find = jest.fn().mockResolvedValue([]);

    const req = mockReq({ params: { id: 'r1' } });
    const res = mockRes();
    await restaurantController.getRestaurantById(req, res);

    expect(MenuItem.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Bistro',
        menuItems: [{ name: 'Soup' }],
        reviews: []
      })
    );
  });
});
