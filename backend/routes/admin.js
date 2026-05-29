const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const restaurantController = require('../controllers/restaurantController');
const menuItemController = require('../controllers/menuItemController');
const reviewController = require('../controllers/reviewController');
const commentController = require('../controllers/commentController');
const companyResponseController = require('../controllers/companyResponseController');
const reportController = require('../controllers/reportController');
const settingsController = require('../controllers/settingsController');
const tagController = require('../controllers/tagController');
const dashboardController = require('../controllers/dashboardController');

router.post('/login', adminController.login);
router.use(auth);

router.get('/me', adminController.getCurrentAdmin);
router.post('/change-password', adminController.changeOwnPassword);
router.get('/admins', adminController.getAllAdmins);
router.post('/admins', adminController.createAdmin);
router.put('/admins/:id', adminController.updateAdmin);
router.delete('/admins/:id', adminController.deleteAdmin);

// FR-19 restaurants CRUD
router.post('/restaurants', restaurantController.createRestaurant);
router.put('/restaurants/:id', restaurantController.updateRestaurant);
router.delete('/restaurants/:id', restaurantController.deleteRestaurant);
// FR-21 photo management
router.post('/restaurants/:id/photos', restaurantController.addPhoto);
router.put('/restaurants/:id/photos/:photoId', restaurantController.updatePhoto);
router.delete('/restaurants/:id/photos/:photoId', restaurantController.deletePhoto);

// FR-19/20 menu items
router.post('/menu-items', menuItemController.createMenuItem);
router.put('/menu-items/:id', menuItemController.updateMenuItem);
router.patch('/menu-items/:id/availability', menuItemController.setAvailability);
router.patch('/menu-items/:id/retire', menuItemController.retireMenuItem);
router.delete('/menu-items/:id', menuItemController.deleteMenuItem);

// FR-10/11/12/13/14 review moderation
router.get('/reviews', reviewController.getAllReviewsForModeration);
router.patch('/reviews/:id/moderate', reviewController.moderateReview);
router.patch('/reviews/:id/escalate', reviewController.escalateReview);
router.put('/reviews/:id/response', async (req, res) => {
  // Backwards-compatible: routes legacy admin "post response" through the
  // moderated CompanyResponse flow.
  req.params.reviewId = req.params.id;
  req.body.text = req.body.response || req.body.text;
  return companyResponseController.submitResponse(req, res);
});

// FR-10/11/12 comment moderation
router.get('/comments', commentController.getAllCommentsForModeration);
router.patch('/comments/:id/moderate', commentController.moderateComment);
router.patch('/comments/:id/escalate', commentController.escalateComment);

// FR-10/11/12 company response moderation
router.get('/company-responses', companyResponseController.getAllForModeration);
router.patch('/company-responses/:id/moderate', companyResponseController.moderate);

// FR-26 reports
router.get('/reports', reportController.listReports);
router.get('/reports/:id', reportController.getReport);
router.patch('/reports/:id/resolve', reportController.resolveReport);

// FR-16 settings
router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);

// FR-22 tags
router.get('/tags', tagController.adminList);
router.post('/tags', tagController.create);
router.put('/tags/:id', tagController.update);
router.delete('/tags/:id', tagController.remove);

// FR-23 dashboard / FR-13 audit
router.get('/dashboard/summary', dashboardController.summary);
router.get('/dashboard/audit', dashboardController.auditTrail);

// FR-14 user moderation
router.get('/users', userController.adminListUsers);
router.put('/users/:id', userController.adminUpdateUser);

module.exports = router;
