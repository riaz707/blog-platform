import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import PostCard from '../components/blog/PostCard';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${username}`)
      .then(async (userRes) => {
        const u = userRes.data.user;
        setProfile(u);
        setFollowersCount(u.followers?.length || 0);
        setIsFollowing(u.followers?.some((f) => f._id === currentUser?._id || f === currentUser?._id));
        const postsRes = await api.get(`/posts?author=${u._id}&limit=20`);
        setPosts(postsRes.data.posts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    if (!isAuthenticated) { toast.error('Login to follow'); return; }
    const { data } = await api.put(`/users/${profile._id}/follow`);
    setIsFollowing(data.isFollowing);
    setFollowersCount(data.followersCount);
    toast.success(data.isFollowing ? `Following ${profile.name}` : `Unfollowed ${profile.name}`);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="text-center py-20 text-gray-400">User not found</div>;

  const isOwn = currentUser?.username === username;
  const tabs = isOwn ? ['posts', 'drafts'] : ['posts'];

  return (
    <div>
      {/* Profile header */}
      <div className="card p-8 mb-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile.avatar
              ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-white text-3xl font-bold">{profile.name?.[0]}</span>
            }
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                <p className="text-gray-400 text-sm">@{profile.username}</p>
              </div>
              {!isOwn && isAuthenticated && (
                <button
                  onClick={handleFollow}
                  className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors ${
                    isFollowing
                      ? 'border-gray-300 dark:border-gray-600 hover:border-red-300 hover:text-red-500'
                      : 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              {isOwn && (
                <Link to="/settings" className="btn-outline text-sm">Edit Profile</Link>
              )}
            </div>
            {profile.bio && <p className="text-gray-600 dark:text-gray-400 mt-3">{profile.bio}</p>}
            <div className="flex gap-6 mt-4 text-sm">
              <div><span className="font-bold text-gray-900 dark:text-white">{posts.filter(p => p.status === 'published').length}</span> <span className="text-gray-400">posts</span></div>
              <div><span className="font-bold text-gray-900 dark:text-white">{followersCount}</span> <span className="text-gray-400">followers</span></div>
              <div><span className="font-bold text-gray-900 dark:text-white">{profile.following?.length || 0}</span> <span className="text-gray-400">following</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts
          .filter((p) => tab === 'posts' ? p.status === 'published' : p.status === 'draft')
          .map((post) => <PostCard key={post._id} post={post} />)
        }
        {posts.filter((p) => tab === 'posts' ? p.status === 'published' : p.status === 'draft').length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📝</p>
            <p>No posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
