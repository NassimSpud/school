import React from 'react';
import { Download, Eye, Trash2, File, Image, FileText, Archive, Video, Music } from 'lucide-react';
import axios from 'axios';

const FilePreview = ({
  attachment,
  onDelete,
  onDownload,
  showActions = true,
  compact = false,
  className = ''
}) => {
  // File type icons
  const getFileIcon = (mimetype) => {
    const iconClass = compact ? "w-4 h-4" : "w-6 h-6";
    
    if (mimetype.startsWith('image/')) return <Image className={`${iconClass} text-blue-500`} />;
    if (mimetype.startsWith('video/')) return <Video className={`${iconClass} text-purple-500`} />;
    if (mimetype.startsWith('audio/')) return <Music className={`${iconClass} text-green-500`} />;
    if (mimetype.includes('pdf')) return <FileText className={`${iconClass} text-red-500`} />;
    if (mimetype.includes('zip') || mimetype.includes('rar')) return <Archive className={`${iconClass} text-yellow-500`} />;
    return <File className={`${iconClass} text-gray-500`} />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle download
  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/attachments/${attachment.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onDownload?.(attachment);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/attachments/${attachment.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      onDelete?.(attachment);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Handle preview
  const handlePreview = () => {
    if (attachment.mimetype.startsWith('image/')) {
      // Open image in new tab
      window.open(attachment.url, '_blank');
    } else if (attachment.mimetype === 'application/pdf') {
      // Open PDF in new tab
      window.open(attachment.url, '_blank');
    } else {
      // Download for other file types
      handleDownload();
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 p-2 bg-gray-50 rounded-lg ${className}`}>
        {getFileIcon(attachment.mimetype)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {attachment.originalName}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(attachment.size)}
          </p>
        </div>
        {showActions && (
          <div className="flex space-x-1">
            <button
              onClick={handlePreview}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Preview/Download"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        {/* File Icon/Preview */}
        <div className="flex-shrink-0">
          {attachment.mimetype.startsWith('image/') ? (
            <img
              src={attachment.url}
              alt={attachment.originalName}
              className="w-12 h-12 object-cover rounded-lg cursor-pointer"
              onClick={handlePreview}
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              {getFileIcon(attachment.mimetype)}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {attachment.originalName}
          </h4>
          <div className="mt-1 text-xs text-gray-500 space-y-1">
            <p>Size: {formatFileSize(attachment.size)}</p>
            <p>Uploaded: {formatDate(attachment.createdAt)}</p>
            {attachment.description && (
              <p className="text-gray-600">{attachment.description}</p>
            )}
            {attachment.tags && attachment.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {attachment.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex-shrink-0 flex space-x-2">
            <button
              onClick={handlePreview}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
              title="Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Download Stats */}
      {attachment.downloadCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Downloaded {attachment.downloadCount} time{attachment.downloadCount !== 1 ? 's' : ''}
            {attachment.lastDownloaded && (
              <span> • Last: {formatDate(attachment.lastDownloaded)}</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default FilePreview;
