import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Camera, User, Briefcase, Calendar, Mail, Save, XCircle, Trash2, LogOut, BookOpen } from 'lucide-react';
import { storage, db } from '../firebase'; // Import db from firebase
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, query, orderBy, getDocs, Timestamp } from "firebase/firestore"; // Import Firestore functions

// Define interface for user stories
interface UserStory {
  id: string;
  title: string;
  content: string;
  category: string;
  timestamp: Timestamp; // Firestore Timestamp type
  contentWarning?: string | null;
}

export default function ProfilePage() {
  const { user, updateUserProfile, isLoading, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    profession: user?.profession || '',
    dateOfBirth: user?.dateOfBirth || '',
    email: user?.email || '',
  });
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(user?.photoURL);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [isFetchingStories, setIsFetchingStories] = useState(true);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        profession: user.profession || '',
        dateOfBirth: user.dateOfBirth || '',
        email: user.email || '',
      });
      setProfilePhoto(user.photoURL);

      const fetchUserStories = async () => {
        setIsFetchingStories(true);
        try {
          const storiesRef = collection(db, `users/${user.id}/stories`);
          const q = query(storiesRef, orderBy('timestamp', 'desc'));
          const querySnapshot = await getDocs(q);
          const fetchedStories = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as UserStory[];
          setUserStories(fetchedStories);
        } catch (error) {
          console.error("Error fetching user stories:", error);
          // Optionally set an error state here to show user
        } finally {
          setIsFetchingStories(false);
        }
      };

      fetchUserStories();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full Name is required';
    if (!formData.profession.trim()) newErrors.profession = 'Profession is required';
    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of Birth is required';
    } else if (!/^(19|20)\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'Please enter a valid date (YYYY-MM-DD)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user || !validateForm() || isUploadingPhoto || isDeletingPhoto) return;

    const updates: Partial<typeof formData & { photoURL?: string }> = {
      name: formData.name,
      profession: formData.profession,
      dateOfBirth: formData.dateOfBirth,
      // Email cannot be changed directly via profile update in Firebase Auth
    };
    // photoURL is handled separately by handlePhotoUpload/handleRemovePhoto already calling updateUserProfile

    const success = await updateUserProfile(updates);
    if (success) {
      setIsEditing(false);
      // Optionally show a success toast
    } else {
      setErrors(prev => ({ ...prev, general: 'Failed to update profile.' }));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        name: user.name || '',
        profession: user.profession || '',
        dateOfBirth: user.dateOfBirth || '',
        email: user.email || '',
      });
      setProfilePhoto(user.photoURL);
    }
    setErrors({});
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, photo: 'Please upload an image file.' }));
      return;
    }

    setIsUploadingPhoto(true);
    setErrors(prev => ({ ...prev, photo: undefined }));

    try {
      const photoRef = ref(storage, `users/${user.id}/profile.jpg`);
      await uploadBytes(photoRef, file);
      const newPhotoURL = await getDownloadURL(photoRef);

      const success = await updateUserProfile({ photoURL: newPhotoURL });
      if (success) {
        setProfilePhoto(newPhotoURL);
      } else {
        setErrors(prev => ({ ...prev, photo: 'Failed to update profile photo URL.' }));
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      setErrors(prev => ({ ...prev, photo: 'Failed to upload photo. Please try again.' }));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user || !profilePhoto || isUploadingPhoto) return;

    setIsDeletingPhoto(true);
    setErrors(prev => ({ ...prev, photo: undefined }));

    try {
      if (user.photoURL) {
        const photoRef = ref(storage, user.photoURL);
        // Check if the current photoURL is a Firebase Storage URL before attempting to delete
        if (user.photoURL.includes('firebasestorage.googleapis.com')) {
            await deleteObject(photoRef);
        } else {
            console.warn("Attempted to remove a non-Firebase Storage URL photo.", user.photoURL);
        }
      }
      
      const success = await updateUserProfile({ photoURL: null }); // Set to null to clear
      if (success) {
        setProfilePhoto(undefined);
      } else {
        setErrors(prev => ({ ...prev, photo: 'Failed to remove profile photo URL.' }));
      }
    } catch (error) {
      console.error("Error removing photo:", error);
      setErrors(prev => ({ ...prev, photo: 'Failed to remove photo from storage. Please try again.' }));
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Loading user profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Your Profile
        </h2>

        {errors.general && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6 text-center">
            <p className="text-red-700 dark:text-red-400 text-sm">{errors.general}</p>
          </div>
        )}
        {errors.photo && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6 text-center">
            <p className="text-red-700 dark:text-red-400 text-sm">{errors.photo}</p>
          </div>
        )}

        <div className="flex flex-col items-center mb-8">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500 dark:border-blue-500 mb-4">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-6xl font-semibold">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            {isEditing && (
              <label htmlFor="profile-photo-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center text-white cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                {isUploadingPhoto ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-8 h-8" />
                )}
                <input
                  id="profile-photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto || isDeletingPhoto}
                />
              </label>
            )}
          </div>
          {isEditing && (profilePhoto || isUploadingPhoto || isDeletingPhoto) && (
            <button
              onClick={handleRemovePhoto}
              className="text-red-500 flex items-center gap-1 hover:text-red-600 transition-colors text-sm"
              disabled={isUploadingPhoto || isDeletingPhoto}
            >
              {isDeletingPhoto ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )} 
              {isDeletingPhoto ? 'Removing...' : 'Remove Photo'}
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Profile Info Display/Edit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isUploadingPhoto || isDeletingPhoto}
                />
              ) : (
                <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white flex items-center"><User className="w-5 h-5 mr-3 text-purple-500" />{user.name}</p>
              )}
              {errors.name && <p className="mt-1 text-red-600 text-sm">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white flex items-center"><Mail className="w-5 h-5 mr-3 text-blue-500" />{user.email}</p>
              {/* Email is typically managed directly by Firebase Auth and not editable here for simplicity */}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profession/Occupation</label>
              {isEditing ? (
                <input
                  type="text"
                  name="profession"
                  value={formData.profession}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isUploadingPhoto || isDeletingPhoto}
                />
              ) : (
                <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white flex items-center"><Briefcase className="w-5 h-5 mr-3 text-green-500" />{user.profession || 'N/A'}</p>
              )}
              {errors.profession && <p className="mt-1 text-red-600 text-sm">{errors.profession}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isUploadingPhoto || isDeletingPhoto}
                />
              ) : (
                <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white flex items-center"><Calendar className="w-5 h-5 mr-3 text-yellow-500" />{user.dateOfBirth || 'N/A'}</p>
              )}
              {errors.dateOfBirth && <p className="mt-1 text-red-600 text-sm">{errors.dateOfBirth}</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  disabled={isUploadingPhoto || isDeletingPhoto || isLoading}
                >
                  <XCircle className="w-5 h-5" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading || isUploadingPhoto || isDeletingPhoto}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" /> Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center gap-2"
                disabled={isLoading || isUploadingPhoto || isDeletingPhoto}
              >
                <User className="w-5 h-5" /> Edit Profile
              </button>
            )}
          </div>

          {/* User Stories Section */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-600" /> Your Stories
            </h3>
            {isFetchingStories ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="ml-3 text-gray-600 dark:text-gray-400">Loading your stories...</p>
              </div>
            ) : userStories.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">You haven't posted any stories yet. Share your thoughts in the Community!</p>
            ) : (
              <div className="space-y-6">
                {userStories.map(story => (
                  <div key={story.id} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{story.title}</h4>
                    <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">{story.content}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {story.category.charAt(0).toUpperCase() + story.category.slice(1)}
                      </span>
                      <span>{story.timestamp.toDate().toLocaleString()}</span>
                    </div>
                    {story.contentWarning && (
                      <div className="mt-3 text-sm text-red-600 dark:text-red-400 border-l-4 border-red-400 pl-2">
                        Content Warning: {story.contentWarning}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-center">
            <button
              onClick={logout}
              disabled={isLoading || isUploadingPhoto || isDeletingPhoto}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
