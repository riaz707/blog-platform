import { useState, useEffect } from 'react';
import api from '../utils/api';
import PostCard from '../components/blog/PostCard';
import { Link } from 'react-router-dom';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/posts/feed?limit=10')
      .then(({ data }) => setPosts(data.posts))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📰 Your Feed</h1>
      {loading ? (
        <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="h-32 card animate-pulse" />)}</div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => <PostCard key={post._id} post={post} />)}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-medium mb-2">Your feed is empty</p>
          <p className="text-sm mb-4">Follow some authors to see their posts here</p>
          <Link to="/" className="btn-primary text-sm">Explore posts</Link>
        </div>
      )}
    </div>
  );
}
