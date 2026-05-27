const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const reviewController = require('../controllers/reviewController');
const commentController = require('../controllers/commentController');
const notificationController = require('../controllers/notificationController');
const userAuth = require('../middleware/userAuth');

router.post('/register', userController.register);
router.post('/login', userController.login);

router.use(userAuth);
router.get('/profile', userController.getProfile);

// FR-25 "My submissions"
router.get('/my-reviews', reviewController.getMyReviews);
router.get('/my-comments', commentController.getMyComments);

// FR-9 edit/delete own content (triggers re-moderation on edit)
router.put('/reviews/:id', reviewController.editMyReview);
router.delete('/reviews/:id', reviewController.deleteMyReview);
router.put('/comments/:id', commentController.editMyComment);
router.delete('/comments/:id', commentController.deleteMyComment);

// FR-24 notifications
router.get('/notifications', notificationController.list);
router.get('/notifications/unread-count', notificationController.unreadCount);
router.patch('/notifications/:id/read', notificationController.markRead);
router.post('/notifications/read-all', notificationController.markAllRead);

module.exports = router;
