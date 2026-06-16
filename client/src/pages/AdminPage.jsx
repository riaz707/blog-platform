import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// ── Stats Overview ──────────────────────────────────────────────
function StatsCard({ icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value?.toLocaleString()}</p>
      </div>
    </div>
  );
}

// ── Dashboard Home ───────────────────────────────────────────────
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  const COLORS = ['#a855f7', '#6366f1', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon="👥" label="Total Users" value={stats.stats.totalUsers} color="bg-purple-100 dark:bg-purple-900" />
        <StatsCard icon="📝" label="Total Posts" value={stats.stats.totalPosts} color="bg-blue-100 dark:bg-blue-900" />
        <StatsCard icon="💬" label="Comments" value={stats.stats.totalComments} color="bg-green-100 dark:bg-green-900" />
        <StatsCard icon="🗂️" label="Categories" value={stats.stats.totalCategories} color="bg-yellow-100 dark:bg-yellow-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts per day chart */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Posts (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.postsPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top categories pie */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Posts by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.topCategories} dataKey="count" nameKey="category.name" cx="50%" cy="50%" outerRadius={80} label>
                {stats.topCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend formatter={(v) => v} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Users Management ─────────────────────────────────────────────
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = (q = '') => {
    setLoading(true);
    api.get(`/admin/users?search=${q}&limit=50`)
      .then(({ data }) => setUsers(data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleBan = async (userId) => {
    const { data } = await api.put(`/admin/users/${userId}/ban`);
    setUsers(users.map((u) => u._id === userId ? { ...u, isActive: data.isActive } : u));
    toast.success(data.message);
  };

  const handleRole = async (userId, role) => {
    const newRole = role === 'admin' ? 'user' : 'admin';
    await api.put(`/admin/users/${userId}/role`, { role: newRole });
    setUsers(users.map((u) => u._id === userId ? { ...u, role: newRole } : u));
    toast.success('Role updated');
  };

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers(search)}
          className="input-field max-w-xs"
        />
        <button onClick={() => fetchUsers(search)} className="btn-primary text-sm">Search</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center overflow-hidden">
                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-xs font-semibold">{u.name?.[0]}</span>}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBan(u._id)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${u.isActive ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                      >
                        {u.isActive ? 'Ban' : 'Unban'}
                      </button>
                      <button
                        onClick={() => handleRole(u._id, u.role)}
                        className="text-xs px-2 py-1 rounded border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        {u.role === 'admin' ? '→ User' : '→ Admin'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="text-center py-8 text-gray-400">Loading...</div>}
          {!loading && users.length === 0 && <div className="text-center py-8 text-gray-400">No users found</div>}
        </div>
      </div>
    </div>
  );
}

// ── Posts Management ─────────────────────────────────────────────
function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPosts = (q = '', s = '') => {
    setLoading(true);
    api.get(`/admin/posts?search=${q}&status=${s}&limit=50`)
      .then(({ data }) => setPosts(data.posts))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    await api.delete(`/posts/${postId}`);
    setPosts(posts.filter((p) => p._id !== postId));
    toast.success('Post deleted');
  };

  const handleApprove = async (postId) => {
    const { data } = await api.put(`/admin/posts/${postId}/approve`);
    setPosts(posts.map((p) => p._id === postId ? { ...p, isApproved: data.isApproved } : p));
    toast.success(data.isApproved ? 'Post approved' : 'Post hidden');
  };

  return (
    <div>
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchPosts(search, statusFilter)}
          className="input-field max-w-xs"
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); fetchPosts(search, e.target.value); }} className="input-field w-36">
          <option value="">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button onClick={() => fetchPosts(search, statusFilter)} className="btn-primary text-sm">Search</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Author</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {posts.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="font-medium truncate">{p.title}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.author?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category?.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.status}
                      </span>
                      {!p.isApproved && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600 w-fit">hidden</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(p._id)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${p.isApproved ? 'border-yellow-200 text-yellow-600 hover:bg-yellow-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                      >
                        {p.isApproved ? 'Hide' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="text-xs px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="text-center py-8 text-gray-400">Loading...</div>}
          {!loading && posts.length === 0 && <div className="text-center py-8 text-gray-400">No posts found</div>}
        </div>
      </div>
    </div>
  );
}

// ── Categories Management ────────────────────────────────────────
function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', color: '#a855f7' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/categories', form);
      setCategories([...categories, data.category]);
      setForm({ name: '', description: '', color: '#a855f7' });
      toast.success('Category created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter((c) => c._id !== id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Create form */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Create Category</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border border-gray-200" />
              <span className="text-sm text-gray-500">{form.color}</span>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Creating...' : 'Create Category'}
          </button>
        </form>
      </div>

      {/* Categories list */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">All Categories</h3>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-medium text-sm">{cat.name}</span>
                </div>
                <button onClick={() => handleDelete(cat._id)} className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
              </div>
            ))}
            {categories.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No categories yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Admin Layout with sidebar nav ────────────────────────────────
export default function AdminPage() {
  const location = useLocation();

  const navLinks = [
    { to: '/admin', label: '📊 Dashboard', exact: true },
    { to: '/admin/users', label: '👥 Users' },
    { to: '/admin/posts', label: '📝 Posts' },
    { to: '/admin/categories', label: '🗂️ Categories' },
  ];

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-48 flex-shrink-0">
        <div className="card p-4 sticky top-24">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Admin Panel</p>
          <nav className="space-y-1">
            {navLinks.map(({ to, label, exact }) => {
              const isActive = exact ? location.pathname === to : location.pathname.startsWith(to) && to !== '/admin';
              const activeExact = exact && location.pathname === '/admin';
              return (
                <Link
                  key={to}
                  to={to}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive || activeExact
                      ? 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-5">
          <h1 className="text-2xl font-bold">
            {location.pathname === '/admin' && 'Dashboard'}
            {location.pathname === '/admin/users' && 'Manage Users'}
            {location.pathname === '/admin/posts' && 'Manage Posts'}
            {location.pathname === '/admin/categories' && 'Manage Categories'}
          </h1>
        </div>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="categories" element={<AdminCategories />} />
        </Routes>
      </div>
    </div>
  );
}
