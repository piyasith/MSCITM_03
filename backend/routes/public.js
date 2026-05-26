const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const menuItemController = require('../controllers/menuItemController');
const reviewController = require('../controllers/reviewController');
const commentController = require('../controllers/commentController');
const userAuth = require('../middleware/userAuth');

router.get('/restaurants', restaurantController.getRestaurants);
router.get('/restaurants/:id', restaurantController.getRestaurantById);
router.get('/menu-items/search', restaurantController.searchFoodItems);
router.get('/restaurants/:restaurantId/menu', menuItemController.getMenuItemsByRestaurant);
router.get('/restaurants/:restaurantId/reviews', reviewController.getReviewsByRestaurant);
router.get('/reviews/:reviewId/comments', commentController.getCommentsByReview);

// Protected routes - require user login
router.post('/reviews', userAuth, reviewController.submitReview);
router.post('/reviews/:reviewId/comments', userAuth, commentController.submitComment);

module.exports = router;