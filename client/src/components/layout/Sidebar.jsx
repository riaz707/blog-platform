import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function Sidebar() {
  const [categories, setCategories] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories));
    api.get('/posts?sort=trending&limit=5').then(({ data }) => setTrendingPosts(data.posts));
  }, []);

  return (
    <div className="space-y-6 sticky top-24">
      {/* Categories */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/category/${cat.slug}`}
              className="tag-badge text-xs"
              style={{ borderLeft: `3px solid ${cat.color}` }}
            >
              {cat.name}
            </Link>
          ))}
          {categories.length === 0 && <p className="text-sm text-gray-400">No categories yet</p>}
        </div>
      </div>

      {/* Trending */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🔥 Trending</h3>
        <div className="space-y-4">
          {trendingPosts.map((post, i) => (
            <Link key={post._id} to={`/blog/${post.slug}`} className="flex gap-3 group">
              <span className="text-2xl font-bold text-gray-200 dark:text-gray-700 leading-none">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-sm font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                  {post.title}
                </p>
                <p className="text-xs text-gray-400 mt-1">{post.author?.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Write CTA */}
      <div className="card p-5 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-950 dark:to-purple-950 border-primary-100 dark:border-primary-900">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Share your story</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Start writing and reach thousands of readers.</p>
        <Link to="/write" className="btn-primary w-full block text-center text-sm">
          Start Writing
        </Link>
      </div>
    </div>
  );
}
