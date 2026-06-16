const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Category = require('../models/Category');

// @GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalPosts, totalComments, totalCategories] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments({ isDeleted: false }),
      Category.countDocuments(),
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const postsPerDay = await Post.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const topCategories = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
    ]);

    res.json({
      success: true,
      stats: { totalUsers, totalPosts, totalComments, totalCategories },
      postsPerDay,
      topCategories,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch stats' });
  }
};

// @GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role) query.role = role;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch users' });
  }
};

// @PUT /api/admin/users/:id/ban
exports.toggleBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot ban admin' });

    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive, message: `User ${user.isActive ? 'unbanned' : 'banned'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to toggle ban' });
  }
};

// @PUT /api/admin/users/:id/role
exports.changeRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to change role' });
  }
};

// @GET /api/admin/posts
exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('author', 'name username')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Post.countDocuments(query),
    ]);

    res.json({ success: true, posts, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch posts' });
  }
};

// @PUT /api/admin/posts/:id/approve
exports.toggleApprove = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.isApproved = !post.isApproved;
    await post.save();
    res.json({ success: true, isApproved: post.isApproved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to toggle approval' });
  }
};
