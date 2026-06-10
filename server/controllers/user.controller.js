const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @GET /api/users/:username
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'name username avatar')
      .populate('following', 'name username avatar')
      .select('-password -refreshToken -email');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch profile' });
  }
};

// @PUT /api/users/update-profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const update = {};
    if (name) update.name = name;
    if (bio !== undefined) update.bio = bio;
    if (req.file?.path) update.avatar = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update profile' });
  }
};

// @PUT /api/users/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to change password' });
  }
};

// @PUT /api/users/:id/follow
exports.toggleFollow = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      currentUser.following.pull(req.params.id);
      targetUser.followers.pull(req.user._id);
    } else {
      currentUser.following.push(req.params.id);
      targetUser.followers.push(req.user._id);

      await Notification.create({
        recipient: targetUser._id,
        sender: req.user._id,
        type: 'follow',
        message: `${req.user.name} started following you`,
      });
      const io = req.app.get('io');
      io.to(targetUser._id.toString()).emit('new_notification', { type: 'follow' });
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      success: true,
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to toggle follow' });
  }
};

// @PUT /api/users/bookmarks/:postId
exports.toggleBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isBookmarked = user.bookmarks.includes(req.params.postId);

    if (isBookmarked) user.bookmarks.pull(req.params.postId);
    else user.bookmarks.push(req.params.postId);

    await user.save();
    res.json({ success: true, isBookmarked: !isBookmarked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to toggle bookmark' });
  }
};

// @GET /api/users/bookmarks
exports.getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      populate: [
        { path: 'author', select: 'name username avatar' },
        { path: 'category', select: 'name slug color' },
      ],
    });
    res.json({ success: true, bookmarks: user.bookmarks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch bookmarks' });
  }
};
