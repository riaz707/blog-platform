import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import PostCard from '../components/blog/PostCard';

const SORT_ICONS = { latest: '🕐', popular: '👁️', trending: '🔥' };

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [sort, setSort] = useState('latest');

  const fetchPosts = useCallback(async (p = 1, s = sort) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/posts?page=${p}&limit=10&sort=${s}`);
      if (p === 1) setPosts(data.posts);
      else setPosts((prev) => [...prev, ...data.posts]);
      setHasNext(data.pagination.hasNext);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => { fetchPosts(1, sort); }, [sort]);

  return (
    <div>
      {/* Sort tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
        {['latest', 'popular', 'trending'].map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              sort === s
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {SORT_ICONS[s]} {s}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {loading && page === 1 ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </div>
            </div>
          ))
        ) : (
          posts.map((post) => <PostCard key={post._id} post={post} />)
        )}
      </div>

      {hasNext && (
        <button
          onClick={() => fetchPosts(page + 1)}
          disabled={loading}
          className="w-full mt-6 btn-outline py-3 text-sm"
        >
          {loading ? 'Loading...' : 'Load more posts'}
        </button>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">📝</p>
          <p>No posts yet. Be the first to write!</p>
        </div>
      )}
    </div>
  );
}
