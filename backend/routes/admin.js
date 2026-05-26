const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const restaurantController = require('../controllers/restaurantController');
const menuItemController = require('../controllers/menuItemController');
const reviewController = require('../controllers/reviewController');
const commentController = require('../controllers/commentController');

router.post('/login', adminController.login);
router.use(auth);

router.get('/me', adminController.getCurrentAdmin);
router.post('/change-password', adminController.changeOwnPassword);
router.get('/admins', adminController.getAllAdmins);
router.post('/admins', adminController.createAdmin);
router.put('/admins/:id', adminController.updateAdmin);
router.delete('/admins/:id', adminController.deleteAdmin);

router.post('/restaurants', restaurantController.createRestaurant);
router.put('/restaurants/:id', restaurantController.updateRestaurant);
router.delete('/restaurants/:id', restaurantController.deleteRestaurant);

router.post('/menu-items', menuItemController.createMenuItem);
router.put('/menu-items/:id', menuItemController.updateMenuItem);
router.delete('/menu-items/:id', menuItemController.deleteMenuItem);

router.get('/reviews', reviewController.getAllReviewsForModeration);
router.patch('/reviews/:id/moderate', reviewController.moderateReview);
router.put('/reviews/:id/response', reviewController.addCompanyResponse);

router.get('/comments', commentController.getAllCommentsForModeration);
router.patch('/comments/:id/moderate', commentController.moderateComment);

module.exports = router;