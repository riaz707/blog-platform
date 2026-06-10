const express = require('express');
const router = express.Router();
const { getStats, getUsers, toggleBan, changeRole, getAllPosts, toggleApprove } = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/ban', toggleBan);
router.put('/users/:id/role', changeRole);
router.get('/posts', getAllPosts);
router.put('/posts/:id/approve', toggleApprove);

module.exports = router;
