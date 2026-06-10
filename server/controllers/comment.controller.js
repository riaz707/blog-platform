const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @GET /api/comments/:postId
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
      parentComment: null,
      isDeleted: false,
    })
      .populate('author', 'name username avatar')
      .sort({ createdAt: -1 });

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          parentComment: comment._id,
          isDeleted: false,
        }).populate('author', 'name username avatar');
        return { ...comment.toObject(), replies };
      })
    );

    res.json({ success: true, comments: commentsWithReplies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch comments' });
  }
};

// @POST /api/comments/:postId
exports.addComment = async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = await Comment.create({
      content,
      author: req.user._id,
      post: req.params.postId,
      parentComment: parentComment || null,
    });

    await comment.populate('author', 'name username avatar');

    const notifType = parentComment ? 'reply' : 'comment';
    let recipient;
    if (parentComment) {
      const parentCommentDoc = await Comment.findById(parentComment);
      if (!parentCommentDoc) {
        return res.status(404).json({ success: false, message: 'Parent comment not found' });
      }
      recipient = parentCommentDoc.author;
    } else {
      recipient = post.author;
    }

    if (recipient.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient,
        sender: req.user._id,
        type: notifType,
        post: post._id,
        comment: comment._id,
        message: `${req.user.name} ${parentComment ? 'replied to your comment' : 'commented on your post'}`,
      });
      const io = req.app.get('io');
      io.to(recipient.toString()).emit('new_notification', { type: notifType });
    }

    res.status(201).json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to add comment' });
  }
};

// @PUT /api/comments/:id
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.content = req.body.content;
    await comment.save();
    res.json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update comment' });
  }
};

// @DELETE /api/comments/:id
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.isDeleted = true;
    comment.content = '[deleted]';
    await comment.save();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete comment' });
  }
};

// @PUT /api/comments/:id/like
exports.toggleCommentLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const isLiked = comment.likes.includes(req.user._id);
    if (isLiked) comment.likes.pull(req.user._id);
    else comment.likes.push(req.user._id);

    await comment.save();
    res.json({ success: true, likes: comment.likes.length, isLiked: !isLiked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to toggle like' });
  }
};
