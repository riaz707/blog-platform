import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '../store/notificationStore';

const notifIcon = {
  like: '❤️',
  comment: '💬',
  follow: '👤',
  reply: '↩️',
};

export default function NotificationsPage() {
  const { notifications, fetchNotifications, markAllRead, deleteNotification } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    markAllRead();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🔔 Notifications</h1>
        <button onClick={markAllRead} className="text-sm text-primary-600 hover:underline">Mark all read</button>
      </div>

      <div className="space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif._id}
            className={`card p-4 flex items-start gap-3 ${!notif.isRead ? 'border-l-4 border-primary-400' : ''}`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
              {notif.sender?.avatar
                ? <img src={notif.sender.avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-white text-sm font-semibold">{notif.sender?.name?.[0]}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="mr-1">{notifIcon[notif.type]}</span>
                <Link to={`/profile/${notif.sender?.username}`} className="font-semibold hover:text-primary-600">
                  {notif.sender?.name}
                </Link>{' '}
                {notif.message?.replace(notif.sender?.name + ' ', '')}
                {notif.post && (
                  <>
                    {' — '}
                    <Link to={`/blog/${notif.post.slug}`} className="text-primary-600 hover:underline truncate">
                      {notif.post.title}
                    </Link>
                  </>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
              </p>
            </div>
            <button onClick={() => deleteNotification(notif._id)} className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none">
              ×
            </button>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔔</p>
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
