const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const menuItemController = require('../controllers/menuItemController');
const reviewController = require('../controllers/reviewController');
const commentController = require('../controllers/commentController');
const companyResponseController = require('../controllers/companyResponseController');
const tagController = require('../controllers/tagController');
const reportController = require('../controllers/reportController');
const userAuth = require('../middleware/userAuth');
const anyAuth = require('../middleware/anyAuth');

router.get('/restaurants', restaurantController.getRestaurants);
router.get('/restaurants/top-rated', restaurantController.getTopRated);
router.get('/restaurants/trending', restaurantController.getTrending);
router.get('/restaurants/:id', restaurantController.getRestaurantById);
router.get('/menu-items/search', restaurantController.searchFoodItems);
router.get('/restaurants/:restaurantId/menu', menuItemController.getMenuItemsByRestaurant);
router.get('/restaurants/:restaurantId/reviews', reviewController.getReviewsByRestaurant);
router.get('/reviews/:reviewId/comments', commentController.getCommentsByReview);
router.get('/reviews/:reviewId/responses', companyResponseController.getResponsesByReview);
router.get('/tags', tagController.publicList);
router.get('/reason-codes/review', reviewController.listReasonCodes);
router.get('/reason-codes/comment', commentController.listReasonCodes);

// Protected (user) routes
router.post('/reviews', userAuth, reviewController.submitReview);
router.post('/reviews/:reviewId/comments', userAuth, commentController.submitComment);
router.post('/reports', userAuth, reportController.createReport);

// Company responses can be submitted by either company_rep (user token) or admin token
router.post('/reviews/:reviewId/responses', anyAuth, companyResponseController.submitResponse);
router.put('/responses/:id', anyAuth, companyResponseController.editResponse);

module.exports = router;
