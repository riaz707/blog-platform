import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import RichEditor from '../components/blog/RichEditor';
import toast from 'react-hot-toast';

export default function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: '', tags: '', status: 'draft' });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/posts/my-posts`),
      api.get('/categories'),
    ]).then(([postsRes, catRes]) => {
      const post = postsRes.data.posts.find((p) => p._id === id);
      if (!post) { navigate('/'); return; }
      setForm({
        title: post.title,
        content: post.content,
        category: post.category?._id || '',
        tags: post.tags?.join(', ') || '',
        status: post.status,
      });
      setThumbnailPreview(post.thumbnail || '');
      setCategories(catRes.data.categories);
    }).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = async (status) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('category', form.category);
      formData.append('tags', form.tags);
      formData.append('status', status);
      if (thumbnail) formData.append('thumbnail', thumbnail);

      const { data } = await api.put(`/posts/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Post updated!');
      navigate(status === 'published' ? `/blog/${data.post.slug}` : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <div className="flex gap-2">
          <button onClick={() => handleSubmit('draft')} disabled={saving} className="btn-outline text-sm">Save Draft</button>
          <button onClick={() => handleSubmit('published')} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving...' : 'Update & Publish'}
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
                className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center">×</button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
              <span className="text-sm text-gray-400">Click to upload cover image</span>
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f){setThumbnail(f);setThumbnailPreview(URL.createObjectURL(f));} }} className="hidden" />
            </label>
          )}
        </div>

        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full text-3xl font-bold border-none outline-none bg-transparent placeholder-gray-300 dark:placeholder-gray-600"
          placeholder="Post title..."
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
              <option value="">Select category</option>
              {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tags</label>
            <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="tag1, tag2, tag3" />
          </div>
        </div>

        <RichEditor content={form.content} onChange={(html) => setForm({ ...form, content: html })} />
      </div>
    </div>
  );
}
