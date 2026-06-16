const express = require('express');
const router = express.Router();
const {
  getPosts, getFeed, getPost, createPost,
  updatePost, deletePost, toggleLike, getMyPosts,
} = require('../controllers/post.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadThumbnail } = require('../utils/cloudinary');

router.get('/', getPosts);
router.get('/feed', protect, getFeed);
router.get('/my-posts', protect, getMyPosts);
router.get('/:slug', getPost);
router.post('/', protect, uploadThumbnail.single('thumbnail'), createPost);
router.put('/:id', protect, uploadThumbnail.single('thumbnail'), updatePost);
router.delete('/:id', protect, deletePost);
router.put('/:id/like', protect, toggleLike);

module.exports = router;
