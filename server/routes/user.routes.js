const express = require('express');
const router = express.Router();
const {
  getUserProfile, updateProfile, changePassword,
  toggleFollow, toggleBookmark, getBookmarks,
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../utils/cloudinary');

router.get('/bookmarks', protect, getBookmarks);
router.put('/update-profile', protect, uploadAvatar.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/bookmarks/:postId', protect, toggleBookmark);
router.put('/:id/follow', protect, toggleFollow);
router.get('/:username', getUserProfile);

module.exports = router;
