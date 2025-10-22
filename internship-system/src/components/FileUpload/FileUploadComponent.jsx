import React, { useState, useRef } from 'react';
import { Upload, X, File, Image, FileText, Archive, Video, Music } from 'lucide-react';
import axios from 'axios';

const FileUploadComponent = ({
  uploadType = 'assignment_submission',
  multiple = false,
  maxFiles = 5,
  maxSize = 50 * 1024 * 1024, // 50MB
  allowedTypes = [],
  onUploadSuccess,
  onUploadError,
  className = '',
  disabled = false,
  relatedModel = null,
  relatedId = null,
  description = '',
  tags = '',
  isPublic = false
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // File type icons
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="w-8 h-8 text-green-500" />;
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="w-8 h-8 text-yellow-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      return `File ${file.name} is too large. Maximum size: ${formatFileSize(maxSize)}`;
    }

    // Check file type if specified
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }

    return null;
  };

  // Handle file selection
  const handleFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const validFiles = [];
    const errors = [];

    // Check total file count
    if (!multiple && fileArray.length > 1) {
      errors.push('Only one file is allowed');
      return;
    }

    if (files.length + fileArray.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        });
      }
    });

    if (errors.length > 0) {
      onUploadError?.(errors.join(', '));
      return;
    }

    setFiles(prev => multiple ? [...prev, ...validFiles] : validFiles);
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
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles) {
      handleFiles(droppedFiles);
    }
  };

  // Handle file input change
  const handleInputChange = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  // Remove file
  const removeFile = (fileId) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Revoke object URLs to prevent memory leaks
      const removedFile = prev.find(f => f.id === fileId);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updated;
    });
  };

  // Upload files
  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      if (multiple) {
        files.forEach(({ file }) => {
          formData.append('files', file);
        });
      } else {
        formData.append('file', files[0].file);
      }

      // Add metadata
      formData.append('uploadType', uploadType);
      if (description) formData.append('description', description);
      if (tags) formData.append('tags', tags);
      if (relatedModel) formData.append('relatedModel', relatedModel);
      if (relatedId) formData.append('relatedId', relatedId);
      formData.append('isPublic', isPublic.toString());

      const endpoint = multiple 
        ? `/api/attachments/upload/multiple/${uploadType}`
        : `/api/attachments/upload/single/${uploadType}`;

      const response = await axios.post(endpoint, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Clear files and notify success
      setFiles([]);
      onUploadSuccess?.(response.data);

    } catch (error) {
      console.error('Upload error:', error);
      const message = error.response?.data?.message || 'Upload failed';
      onUploadError?.(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          accept={allowedTypes.join(',')}
        />

        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {dragActive ? 'Drop files here' : 'Upload files'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop files here, or click to select files
        </p>
        <p className="text-xs text-gray-400">
          {multiple ? `Up to ${maxFiles} files` : 'Single file'} • Max {formatFileSize(maxSize)} each
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
          {files.map(({ file, id, preview }) => (
            <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {preview ? (
                  <img src={preview} alt={file.name} className="w-8 h-8 object-cover rounded" />
                ) : (
                  getFileIcon(file.type)
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(id);
                }}
                className="text-red-500 hover:text-red-700 p-1"
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="mt-4">
          <button
            onClick={uploadFiles}
            disabled={uploading || disabled}
            className={`
              w-full px-4 py-2 rounded-lg font-medium transition-colors
              ${uploading || disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;
