import React, { useState, useEffect } from 'react';
import { UserIcon, EnvelopeIcon, PhoneIcon, GlobeAltIcon, ClockIcon } from '@heroicons/react/24/outline';
import { User, UpdateUserRequest, NotificationPreferences } from '../services/api';
import ApiService from '../services/api';

interface ProfilePageProps {
  // onNavigate: (path: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);

  // Form states
  const [formData, setFormData] = useState<UpdateUserRequest>({
    first_name: '',
    last_name: '',
    phone: '',
    timezone: '',
    language: '',
    avatar_url: ''
  });

  useEffect(() => {
    loadUserProfile();
    loadNotificationPreferences();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await ApiService.getCurrentUser();
      setUser(userData);
      setFormData({
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || '',
        timezone: userData.timezone || '',
        language: userData.language || '',
        avatar_url: userData.avatar_url || ''
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const preferences = await ApiService.getNotificationPreferences();
      setNotificationPreferences(preferences);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updatedUser = await ApiService.updateUser(formData);
      setUser(updatedUser);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleUpdatePreferences = async () => {
    if (!notificationPreferences) return;
    try {
      const updatedPreferences = await ApiService.updateNotificationPreferences(notificationPreferences);
      setNotificationPreferences(updatedPreferences);
      setShowPreferencesModal(false);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">User not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreferencesModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Notification Settings
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <div className="w-32 h-32 mx-auto mb-4 bg-gray-300 rounded-full flex items-center justify-center">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={`${user.first_name} ${user.last_name}`}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-gray-600">{user.username}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(user.status)}`}>
                  {user.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-900">{user.phone}</p>
                    </div>
                  </div>
                )}

                {user.timezone && (
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Timezone</p>
                      <p className="text-gray-900">{user.timezone}</p>
                    </div>
                  </div>
                )}

                {user.language && (
                  <div className="flex items-center gap-3">
                    <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Language</p>
                      <p className="text-gray-900">{user.language}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  <p>Member since: {formatDate(user.created_at)}</p>
                  <p>Last updated: {formatDate(user.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity & Stats */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Active Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">Completed Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-gray-600">Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">0</div>
                    <div className="text-sm text-gray-600">Hours Logged</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Profile updated</p>
                      <p className="text-xs text-gray-500">{formatDate(user.updated_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Account created</p>
                      <p className="text-xs text-gray-500">{formatDate(user.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">User ID:</span>
                    <span className="text-gray-900 font-mono text-sm">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tenant ID:</span>
                    <span className="text-gray-900 font-mono text-sm">{user.tenant_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  >
                    <option value="">Select timezone</option>
                    <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                    <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                    <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  >
                    <option value="">Select language</option>
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                  <input
                    type="url"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Preferences Modal */}
      {showPreferencesModal && notificationPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Notification Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={notificationPreferences.email_enabled}
                    onChange={(e) => setNotificationPreferences({
                      ...notificationPreferences,
                      email_enabled: e.target.checked
                    })}
                  />
                  <span className="ml-2 text-sm text-gray-700">Email Notifications</span>
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={notificationPreferences.push_enabled}
                    onChange={(e) => setNotificationPreferences({
                      ...notificationPreferences,
                      push_enabled: e.target.checked
                    })}
                  />
                  <span className="ml-2 text-sm text-gray-700">Push Notifications</span>
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={notificationPreferences.in_app_enabled}
                    onChange={(e) => setNotificationPreferences({
                      ...notificationPreferences,
                      in_app_enabled: e.target.checked
                    })}
                  />
                  <span className="ml-2 text-sm text-gray-700">In-App Notifications</span>
                </label>
              </div>
              
              <hr className="my-4" />
              
              <h3 className="font-medium text-gray-900">Notification Types</h3>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={notificationPreferences.task_assigned}
                      onChange={(e) => setNotificationPreferences({
                        ...notificationPreferences,
                        task_assigned: e.target.checked
                      })}
                    />
                    <span className="ml-2 text-sm text-gray-700">Task Assigned</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={notificationPreferences.task_completed}
                      onChange={(e) => setNotificationPreferences({
                        ...notificationPreferences,
                        task_completed: e.target.checked
                      })}
                    />
                    <span className="ml-2 text-sm text-gray-700">Task Completed</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={notificationPreferences.task_due_soon}
                      onChange={(e) => setNotificationPreferences({
                        ...notificationPreferences,
                        task_due_soon: e.target.checked
                      })}
                    />
                    <span className="ml-2 text-sm text-gray-700">Task Due Soon</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={notificationPreferences.project_invitation}
                      onChange={(e) => setNotificationPreferences({
                        ...notificationPreferences,
                        project_invitation: e.target.checked
                      })}
                    />
                    <span className="ml-2 text-sm text-gray-700">Project Invitation</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePreferences}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 