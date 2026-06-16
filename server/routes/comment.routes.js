// comment.routes.js
const express = require('express');
const router = express.Router();
const { getComments, addComment, updateComment, deleteComment, toggleCommentLike } = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/:postId', getComments);
router.post('/:postId', protect, addComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.put('/:id/like', protect, toggleCommentLike);

module.exports = router;
