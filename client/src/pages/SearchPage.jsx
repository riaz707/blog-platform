import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import PostCard from '../components/blog/PostCard';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(query);

  useEffect(() => {
    if (!query && !tag) return;
    setLoading(true);
    const params = tag ? `tag=${tag}` : `search=${query}`;
    api.get(`/posts?${params}&limit=20`)
      .then(({ data }) => setPosts(data.posts))
      .finally(() => setLoading(false));
  }, [query, tag]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ q: input });
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search posts..."
          className="input-field"
        />
        <button type="submit" className="btn-primary px-6">Search</button>
      </form>

      {tag && (
        <div className="mb-6">
          <h2 className="text-xl font-bold">Posts tagged <span className="text-primary-600">#{tag}</span></h2>
        </div>
      )}
      {query && (
        <div className="mb-6">
          <h2 className="text-xl font-bold">Results for "<span className="text-primary-600">{query}</span>"</h2>
          <p className="text-sm text-gray-400 mt-1">{posts.length} posts found</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => <div key={i} className="h-32 card animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => <PostCard key={post._id} post={post} />)}
          {posts.length === 0 && (query || tag) && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🔍</p>
              <p>No posts found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
