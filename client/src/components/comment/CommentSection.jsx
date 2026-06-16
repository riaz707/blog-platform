import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

function CommentItem({ comment, postId, onDelete }) {
  const { user, isAuthenticated } = useAuthStore();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState(comment.replies || []);
  const [liked, setLiked] = useState(comment.likes?.includes(user?._id));
  const [likesCount, setLikesCount] = useState(comment.likes?.length || 0);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const { data } = await api.post(`/comments/${postId}`, {
        content: replyText,
        parentComment: comment._id,
      });
      setReplies([...replies, data.comment]);
      setReplyText('');
      setShowReply(false);
      toast.success('Reply added');
    } catch { toast.error('Failed to add reply'); }
  };

  const handleLike = async () => {
    if (!isAuthenticated) { toast.error('Login to like'); return; }
    const { data } = await api.put(`/comments/${comment._id}/like`);
    setLiked(data.isLiked);
    setLikesCount(data.likes);
  };

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
        {comment.author?.avatar ? (
          <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-xs font-semibold">{comment.author?.name?.[0]}</span>
        )}
      </div>
      <div className="flex-1">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <Link to={`/profile/${comment.author?.username}`} className="font-medium text-sm hover:text-primary-600">
              {comment.author?.name}
            </Link>
            <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 px-2">
          <button onClick={handleLike} className={`text-xs flex items-center gap-1 ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
            ♥ {likesCount}
          </button>
          {isAuthenticated && (
            <button onClick={() => setShowReply(!showReply)} className="text-xs text-gray-400 hover:text-primary-500">Reply</button>
          )}
          {user?._id === comment.author?._id && (
            <button onClick={() => onDelete(comment._id)} className="text-xs text-gray-400 hover:text-red-500">Delete</button>
          )}
        </div>

        {/* Reply form */}
        {showReply && (
          <form onSubmit={handleReply} className="mt-2 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="input-field text-sm py-2"
            />
            <button type="submit" className="btn-primary text-sm py-2 px-3">Reply</button>
          </form>
        )}

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
            {replies.map((reply) => (
              <CommentItem key={reply._id} comment={reply} postId={postId} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ postId }) {
  const { isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/comments/${postId}`)
      .then(({ data }) => setComments(data.comments))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const { data } = await api.post(`/comments/${postId}`, { content: newComment });
      setComments([data.comment, ...comments]);
      setNewComment('');
      toast.success('Comment added!');
    } catch { toast.error('Failed to add comment'); }
  };

  const handleDelete = async (commentId) => {
    await api.delete(`/comments/${commentId}`);
    setComments(comments.map((c) => c._id === commentId ? { ...c, content: '[deleted]', isDeleted: true } : c));
  };

  return (
    <div id="comments" className="mt-12">
      <h3 className="text-xl font-bold mb-6">Comments ({comments.length})</h3>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8 flex gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="input-field resize-none flex-1"
          />
          <button type="submit" className="btn-primary self-end px-6">Post</button>
        </form>
      ) : (
        <div className="mb-8 p-4 card text-center text-sm text-gray-500">
          <Link to="/login" className="text-primary-600 font-medium">Login</Link> to join the discussion
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} postId={postId} onDelete={handleDelete} />
          ))}
          {comments.length === 0 && (
            <p className="text-center text-gray-400 py-8">No comments yet. Be the first!</p>
          )}
        </div>
      )}
    </div>
  );
}
