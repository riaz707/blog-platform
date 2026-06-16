import { useState, useEffect } from 'react';
import api from '../utils/api';
import PostCard from '../components/blog/PostCard';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/bookmarks')
      .then(({ data }) => setBookmarks(data.bookmarks))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🔖 Saved Posts</h1>
      {loading ? (
        <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="h-32 card animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((post) => <PostCard key={post._id} post={post} />)}
          {bookmarks.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🔖</p>
              <p>No saved posts yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
