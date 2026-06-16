import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function PostCard({ post, onLikeUpdate }) {
  const { user, isAuthenticated } = useAuthStore();
  const [liked, setLiked] = useState(post.likes?.includes(user?._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [bookmarked, setBookmarked] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Login to like posts'); return; }
    try {
      const { data } = await api.put(`/posts/${post._id}/like`);
      setLiked(data.isLiked);
      setLikesCount(data.likes);
    } catch { toast.error('Failed to like'); }
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Login to bookmark'); return; }
    try {
      const { data } = await api.put(`/users/bookmarks/${post._id}`);
      setBookmarked(data.isBookmarked);
      toast.success(data.isBookmarked ? 'Bookmarked!' : 'Removed from bookmarks');
    } catch { toast.error('Failed to bookmark'); }
  };

  return (
    <article className="card p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {/* Author & meta */}
          <div className="flex items-center gap-3 mb-3">
            <Link to={`/profile/${post.author?.username}`} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                {post.author?.avatar ? (
                  <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-semibold">{post.author?.name?.[0]}</span>
                )}
              </div>
              <span className="text-sm font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400">{post.author?.name}</span>
            </Link>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-sm text-gray-400">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            {post.category && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <Link
                  to={`/category/${post.category.slug}`}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: post.category.color + '20', color: post.category.color }}
                >
                  {post.category.name}
                </Link>
              </>
            )}
          </div>

          {/* Title & excerpt */}
          <Link to={`/blog/${post.slug}`}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-1 line-clamp-2">
              {post.title}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
          </Link>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.slice(0, 3).map((tag) => (
                <Link key={tag} to={`/search?tag=${tag}`} className="tag-badge text-xs">#{tag}</Link>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{post.readingTime} min read</span>
              <span>{post.views} views</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm px-2 py-1 rounded-lg transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
                <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {likesCount}
              </button>
              <Link to={`/blog/${post.slug}#comments`} className="flex items-center gap-1.5 text-sm px-2 py-1 rounded-lg text-gray-400 hover:text-primary-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {post.commentCount || 0}
              </Link>
              <button onClick={handleBookmark} className={`p-1.5 rounded-lg transition-colors ${bookmarked ? 'text-primary-500' : 'text-gray-400 hover:text-primary-500'}`}>
                <svg className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        {post.thumbnail && (
          <Link to={`/blog/${post.slug}`} className="flex-shrink-0">
            <img src={post.thumbnail} alt={post.title} className="w-24 h-24 sm:w-32 sm:h-24 object-cover rounded-lg" />
          </Link>
        )}
      </div>
    </article>
  );
}
