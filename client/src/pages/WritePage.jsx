import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import RichEditor from '../components/blog/RichEditor';
import toast from 'react-hot-toast';

export default function WritePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    status: 'draft',
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  const handleThumbnail = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (status) => {
    if (!form.title) { toast.error('Title is required'); return; }
    if (!form.content || form.content === '<p></p>') { toast.error('Content is required'); return; }
    if (!form.category) { toast.error('Please select a category'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('category', form.category);
      formData.append('tags', form.tags);
      formData.append('status', status);
      if (thumbnail) formData.append('thumbnail', thumbnail);

      const { data } = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(status === 'published' ? 'Post published!' : 'Saved as draft');
      navigate(status === 'published' ? `/blog/${data.post.slug}` : '/profile/' + data.post.author?.username);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Write a new post</h1>
        <div className="flex gap-2">
          <button onClick={() => handleSubmit('draft')} disabled={loading} className="btn-outline text-sm">
            Save Draft
          </button>
          <button onClick={() => handleSubmit('published')} disabled={loading} className="btn-primary text-sm">
            {loading ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium mb-2">Cover Image</label>
          {thumbnailPreview ? (
            <div className="relative">
              <img src={thumbnailPreview} alt="thumbnail" className="w-full h-52 object-cover rounded-xl" />
              <button onClick={() => { setThumbnail(null); setThumbnailPreview(''); }}
                className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">
                ×
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-400">Click to upload cover image</span>
              <input type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
            </label>
          )}
        </div>

        {/* Title */}
        <div>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Your post title..."
            className="w-full text-3xl font-bold border-none outline-none bg-transparent placeholder-gray-300 dark:placeholder-gray-600"
          />
        </div>

        {/* Category & Tags */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input-field"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tags (comma separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="input-field"
              placeholder="javascript, react, node"
            />
          </div>
        </div>

        {/* Editor */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Content *</label>
          <RichEditor content={form.content} onChange={(html) => setForm({ ...form, content: html })} />
        </div>
      </div>
    </div>
  );
}
