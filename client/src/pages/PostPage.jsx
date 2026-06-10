import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import CommentSection from '../components/comment/CommentSection';
import toast from 'react-hot-toast';

export default function PostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    api.get(`/posts/${slug}`)
      .then(({ data }) => {
        setPost(data.post);
        setLiked(data.post.likes?.includes(user?._id));
        setLikesCount(data.post.likes?.length || 0);
        setIsFollowing(data.post.author?.followers?.includes(user?._id));
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [slug, user?._id, navigate]);

  const handleLike = async () => {
    if (!isAuthenticated) { toast.error('Login to like'); return; }
    try {
      const { data } = await api.put(`/posts/${post._id}/like`);
      setLiked(data.isLiked);
      setLikesCount(data.likes);
    } catch {
      toast.error('Failed to like post');
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) { toast.error('Login to bookmark'); return; }
    try {
      const { data } = await api.put(`/users/bookmarks/${post._id}`);
      setBookmarked(data.isBookmarked);
      toast.success(data.isBookmarked ? 'Bookmarked!' : 'Removed from bookmarks');
    } catch {
      toast.error('Failed to bookmark');
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) { toast.error('Login to follow'); return; }
    try {
      const { data } = await api.put(`/users/${post.author._id}/follow`);
      setIsFollowing(data.isFollowing);
      toast.success(data.isFollowing ? `Following ${post.author.name}` : `Unfollowed ${post.author.name}`);
    } catch {
      toast.error('Failed to follow');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success('Post deleted');
      navigate('/');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto animate-pulse space-y-4">
      <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
      <div className="space-y-2">
        {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />)}
      </div>
    </div>
  );

  if (!post) return null;

  return (
    <article className="max-w-3xl mx-auto">
      {post.thumbnail && (
        <img src={post.thumbnail} alt={post.title} className="w-full h-72 object-cover rounded-2xl mb-8" />
      )}

      {post.category && (
        <Link
          to={`/category/${post.category.slug}`}
          className="inline-block px-3 py-1 text-sm font-medium rounded-full mb-4"
          style={{ backgroundColor: post.category.color + '20', color: post.category.color }}
        >
          {post.category.name}
        </Link>
      )}

      <h1 className="text-3xl sm:text-4xl font-bold font-serif leading-tight text-gray-900 dark:text-white mb-6">
        {post.title}
      </h1>

      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.author?.username}`}>
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center overflow-hidden">
              {post.author?.avatar
                ? <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-semibold">{post.author?.name?.[0]}</span>
              }
            </div>
          </Link>
          <div>
            <Link to={`/profile/${post.author?.username}`} className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 text-sm">
              {post.author?.name}
            </Link>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              <span>·</span>
              <span>{post.readingTime} min read</span>
              <span>·</span>
              <span>{post.views} views</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && user?._id !== post.author?._id && (
            <button
              onClick={handleFollow}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                isFollowing
                  ? 'border-gray-300 dark:border-gray-600 hover:border-red-300 hover:text-red-500'
                  : 'border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          {(user?._id === post.author?._id || user?.role === 'admin') && (
            <div className="flex gap-2">
              <Link to={`/edit/${post._id}`} className="btn-outline text-sm py-1">Edit</Link>
              <button onClick={handleDelete} className="text-sm px-3 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">Delete</button>
            </div>
          )}
        </div>
      </div>

      <div
        className="prose prose-lg dark:prose-invert max-w-none mb-10 prose-headings:font-serif prose-a:text-primary-600 prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.map((tag) => (
            <Link key={tag} to={`/search?tag=${tag}`} className="tag-badge">#{tag}</Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between py-4 border-t border-b border-gray-100 dark:border-gray-800 mb-10">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all ${
            liked ? 'bg-red-50 dark:bg-red-950 border-red-200 text-red-500' : 'border-gray-200 dark:border-gray-700 hover:border-red-200 hover:text-red-400'
          }`}
        >
          <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-medium">{likesCount}</span>
        </button>
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all ${
            bookmarked ? 'bg-primary-50 dark:bg-primary-950 border-primary-200 text-primary-600' : 'border-gray-200 dark:border-gray-700 hover:border-primary-200 hover:text-primary-500'
          }`}
        >
          <svg className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {bookmarked ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="card p-6 mb-10 flex gap-4">
        <Link to={`/profile/${post.author?.username}`}>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
            {post.author?.avatar
              ? <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-xl">{post.author?.name?.[0]}</span>
            }
          </div>
        </Link>
        <div>
          <Link to={`/profile/${post.author?.username}`} className="font-bold text-gray-900 dark:text-white hover:text-primary-600">
            {post.author?.name}
          </Link>
          <p className="text-sm text-gray-500 mt-1">{post.author?.bio || 'No bio yet.'}</p>
          <p className="text-xs text-gray-400 mt-1">{post.author?.followers?.length || 0} followers</p>
        </div>
      </div>

      <CommentSection postId={post._id} />
    </article>
  );
}
