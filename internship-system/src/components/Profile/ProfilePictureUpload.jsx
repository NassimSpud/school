import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';
import axios from 'axios';

const ProfilePictureUpload = ({
  currentPicture = null,
  onUploadSuccess,
  onUploadError,
  size = 'large', // 'small', 'medium', 'large'
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentPicture);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-16 h-16',
      icon: 'w-6 h-6',
      camera: 'w-4 h-4',
      text: 'text-xs'
    },
    medium: {
      container: 'w-24 h-24',
      icon: 'w-8 h-8',
      camera: 'w-5 h-5',
      text: 'text-sm'
    },
    large: {
      container: 'w-32 h-32',
      icon: 'w-12 h-12',
      camera: 'w-6 h-6',
      text: 'text-base'
    }
  };

  const config = sizeConfig[size];

  // Validate image file
  const validateImage = (file) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return 'Image must be smaller than 5MB';
    }

    // Check image dimensions (optional)
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 100 || img.height < 100) {
          resolve('Image must be at least 100x100 pixels');
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve('Invalid image file');
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = async (file) => {
    if (!file) return;

    const error = await validateImage(file);
    if (error) {
      onUploadError?.(error);
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Upload immediately
    await uploadImage(file);
  };

  // Upload image
  const uploadImage = async (file) => {
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadType', 'profile_picture');
      formData.append('description', 'Profile picture');

      const response = await axios.post('/api/attachments/upload/single/profile_picture', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      onUploadSuccess?.(response.data);
    } catch (error) {
      console.error('Upload error:', error);
      const message = error.response?.data?.message || 'Upload failed';
      onUploadError?.(message);
      
      // Reset preview on error
      setPreview(currentPicture);
    } finally {
      setUploading(false);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (uploading) return;
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input change
  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Remove current picture
  const removePicture = async () => {
    if (!currentPicture) return;

    try {
      const token = localStorage.getItem('token');
      // Assuming we have the attachment ID from the current picture
      await axios.delete(`/api/attachments/${currentPicture.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setPreview(null);
      onUploadSuccess?.({ removed: true });
    } catch (error) {
      console.error('Remove error:', error);
      onUploadError?.('Failed to remove picture');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Profile Picture Container */}
      <div
        className={`
          ${config.container} relative rounded-full overflow-hidden border-4 border-white shadow-lg
          ${dragActive ? 'border-blue-500' : 'border-gray-200'}
          ${uploading ? 'opacity-50' : ''}
          cursor-pointer group
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          disabled={uploading}
        />

        {/* Profile Picture or Placeholder */}
        {preview ? (
          <img
            src={preview}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <User className={`${config.icon} text-gray-400`} />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            ) : (
              <Camera className={`${config.camera} text-white`} />
            )}
          </div>
        </div>
      </div>

      {/* Upload Status */}
      {uploading && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <p className={`${config.text} text-gray-600 whitespace-nowrap`}>
            Uploading...
          </p>
        </div>
      )}

      {/* Remove Button */}
      {preview && !uploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removePicture();
          }}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
          title="Remove picture"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Upload Instructions (for large size) */}
      {size === 'large' && !preview && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-400">
            PNG, JPG, GIF up to 5MB
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;
