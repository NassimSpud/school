import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Bell,
  FileText,
  CheckCircle,
  Mail,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const response = await axios.get('/api/notifications', {
        params: { page, limit: 10 },
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await axios.put('/api/notifications/mark-all-read', {}, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
    },
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_report':
        return <FileText size={18} className="text-blue-500" />;
      case 'report_feedback':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'form_submission':
        return <Mail size={18} className="text-purple-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    markAsReadMutation.mutate(notification._id);
    // Add navigation logic based on notification type
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 flex items-center">
          <AlertCircle className="mr-2" />
          {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        <button
          onClick={() => markAllAsReadMutation.mutate()}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {data.notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            You don't have any notifications
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {data.notifications.map(notification => (
              <li
                key={notification._id}
                className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-100 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="px-4 py-2 bg-gray-100 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;