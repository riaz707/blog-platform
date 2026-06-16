const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @GET /api/posts
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag, search, sort = 'latest', author } = req.query;
    const skip = (page - 1) * limit;

    const query = { status: 'published', isApproved: true };

    if (category) query.category = category;
    if (tag) query.tags = { $in: [tag.toLowerCase()] };
    if (author) query.author = author;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    let sortOption = {};
    if (sort === 'latest') sortOption = { createdAt: -1 };
    else if (sort === 'popular') sortOption = { views: -1 };
    else if (sort === 'trending') sortOption = { likes: -1 };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('author', 'name username avatar')
        .populate('category', 'name slug color')
        .populate('commentCount')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Post.countDocuments(query),
    ]);

    res.json({
      success: true,
      posts,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch posts' });
  }
};

// @GET /api/posts/feed
exports.getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user = await User.findById(req.user._id);
    const following = user.following;

    const feedQuery = {
      author: { $in: following },
      status: 'published',
      isApproved: true,
    };

    const [posts, total] = await Promise.all([
      Post.find(feedQuery)
        .populate('author', 'name username avatar')
        .populate('category', 'name slug color')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Post.countDocuments(feedQuery),
    ]);

    res.json({
      success: true,
      posts,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch feed' });
  }
};

// @GET /api/posts/:slug
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug, status: 'published', isApproved: true },
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'name username avatar bio followers')
      .populate('category', 'name slug color');

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch post' });
  }
};

// @POST /api/posts
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, tags, status } = req.body;
    const thumbnail = req.file?.path || '';

    const post = await Post.create({
      title,
      content,
      category,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      status: status || 'draft',
      thumbnail,
      author: req.user._id,
    });

    await post.populate(['author', 'category']);
    res.status(201).json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create post' });
  }
};

// @PUT /api/posts/:id
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { title, content, category, tags, status } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;
    if (category) post.category = category;
    if (tags) post.tags = tags.split(',').map((t) => t.trim());
    if (status) post.status = status;
    if (req.file?.path) post.thumbnail = req.file.path;

    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update post' });
  }
};

// @DELETE /api/posts/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete post' });
  }
};

// @PUT /api/posts/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
      if (post.author.toString() !== userId.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: 'like',
          post: post._id,
          message: `${req.user.name} liked your post`,
        });
        const io = req.app.get('io');
        io.to(post.author.toString()).emit('new_notification', { type: 'like' });
      }
    }

    await post.save();
    res.json({ success: true, likes: post.likes.length, isLiked: !isLiked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to toggle like' });
  }
};

// @GET /api/posts/my-posts
exports.getMyPosts = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { author: req.user._id };
    if (status) query.status = status;

    const posts = await Post.find(query)
      .populate('category', 'name slug color')
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch posts' });
  }
};
