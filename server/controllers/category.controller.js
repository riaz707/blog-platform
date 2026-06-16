const Category = require('../models/Category');
const Post = require('../models/Post');

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch categories' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const category = await Category.create({ name, description, color });
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const postCount = await Post.countDocuments({ category: req.params.id });
    if (postCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete: ${postCount} posts use this category` });
    }
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete category' });
  }
};
