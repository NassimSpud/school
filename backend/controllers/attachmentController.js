import { supabase } from '../config/db.js';
import { clearUserProfilePicture } from '../models/userModel.js';
import { deleteFile, getFileUrl, formatFileSize } from '../utils/fileUtils.js';
import fs from 'fs';

const attachmentFields = [
  'id', 'filename', 'original_name', 'mimetype', 'size', 'path', 'url',
  'uploaded_by', 'attachment_type', 'related_model', 'related_id', 'is_public',
  'allowed_users', 'allowed_roles', 'description', 'tags', 'is_scanned',
  'scan_result', 'is_processed', 'thumbnail_path', 'compressed_path',
  'download_count', 'last_downloaded', 'expires_at', 'created_at', 'updated_at'
].join(',');
const attachmentWithUploader = `*,uploaded_by_user:users!attachments_uploaded_by_fkey(id,name,email)`;

const toAttachment = (row) => {
  const attachment = {
    _id: row.id,
    id: row.id,
    filename: row.filename,
    originalName: row.original_name,
    mimetype: row.mimetype,
    size: row.size,
    path: row.path,
    url: row.url,
    uploadedBy: row.uploaded_by_user || row.uploaded_by,
    attachmentType: row.attachment_type,
    relatedModel: row.related_model,
    relatedId: row.related_id,
    isPublic: row.is_public,
    allowedUsers: row.allowed_users || [],
    allowedRoles: row.allowed_roles || [],
    description: row.description,
    tags: row.tags || [],
    isScanned: row.is_scanned,
    scanResult: row.scan_result,
    isProcessed: row.is_processed,
    thumbnailPath: row.thumbnail_path,
    compressedPath: row.compressed_path,
    downloadCount: row.download_count,
    lastDownloaded: row.last_downloaded,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  if (typeof attachment.uploadedBy === 'string') {
    attachment.uploadedBy = row.uploaded_by_user;
  }

  attachment.extension = attachment.originalName?.split('.').pop()?.toLowerCase() || '';
  attachment.formattedSize = formatFileSize(attachment.size);
  return attachment;
};

const findAttachment = async (id, includeUploader = false) => {
  const { data, error } = await supabase
    .from('attachments')
    .select(includeUploader ? attachmentWithUploader : attachmentFields)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const canAccess = (attachment, user) => (
  user.role === 'admin' ||
  attachment.uploaded_by === user._id ||
  attachment.is_public ||
  (attachment.allowed_users || []).includes(user._id) ||
  (attachment.allowed_roles || []).includes(user.role)
);

const toRecord = (file, userId, metadata) => ({
  filename: file.filename,
  original_name: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
  path: file.path,
  url: getFileUrl(file.filename, metadata.uploadType),
  uploaded_by: userId,
  attachment_type: metadata.uploadType,
  related_model: metadata.relatedModel || null,
  related_id: metadata.relatedId || null,
  description: metadata.description || '',
  tags: metadata.tags ? metadata.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
  is_public: metadata.isPublic === 'true',
  is_scanned: file.isScanned || false,
  scan_result: file.scanResult || 'pending'
});

const parsePagination = (pageValue, limitValue) => {
  const page = Math.max(1, Number.parseInt(pageValue, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(limitValue, 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
};

const paginationResult = (page, limit, offset, total, itemCount) => ({
  current: page,
  pages: Math.ceil(total / limit),
  total,
  hasNext: offset + itemCount < total,
  hasPrev: page > 1
});

const sendDbError = (res, label, error) => {
  console.error(`${label}:`, error);
  return res.status(500).json({ message: 'A database error occurred' });
};

// Upload single file
export const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const metadata = { ...req.body, uploadType: req.params.uploadType };
    const { data, error } = await supabase
      .from('attachments')
      .insert(toRecord(req.file, req.user._id, metadata))
      .select(attachmentWithUploader)
      .single();

    if (error) throw error;

    if (metadata.uploadType === 'profile_picture') {
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_id: data.id })
        .eq('id', req.user._id);
      if (updateError) {
        await supabase.from('attachments').delete().eq('id', data.id);
        throw updateError;
      }

      const { data: oldAttachments, error: oldError } = await supabase
        .from('attachments')
        .select('id,path')
        .eq('uploaded_by', req.user._id)
        .eq('attachment_type', 'profile_picture')
        .neq('id', data.id);
      if (oldError) throw oldError;

      for (const oldAttachment of oldAttachments) {
        const { error: deleteError } = await supabase
          .from('attachments')
          .delete()
          .eq('id', oldAttachment.id);
        if (deleteError) throw deleteError;
        await deleteFile(oldAttachment.path);
      }
    }

    return res.status(201).json({
      message: 'File uploaded successfully',
      attachment: {
        id: data.id,
        filename: data.filename,
        originalName: data.original_name,
        size: data.size,
        formattedSize: formatFileSize(data.size),
        url: data.url,
        uploadedAt: data.created_at,
        attachmentType: data.attachment_type
      }
    });
  } catch (error) {
    if (fs.existsSync(req.file.path)) {
      await deleteFile(req.file.path);
    }
    return sendDbError(res, 'Upload error', error);
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  try {
    const metadata = { ...req.body, uploadType: req.params.uploadType };
    const { data, error } = await supabase
      .from('attachments')
      .insert(req.files.map((file) => toRecord(file, req.user._id, metadata)))
      .select(attachmentFields);

    if (error) throw error;

    return res.status(201).json({
      message: `${data.length} files uploaded successfully`,
      attachments: data.map((row) => ({
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        size: row.size,
        formattedSize: formatFileSize(row.size),
        url: row.url,
        uploadedAt: row.created_at,
        attachmentType: row.attachment_type
      }))
    });
  } catch (error) {
    for (const file of req.files) {
      if (fs.existsSync(file.path)) {
        await deleteFile(file.path);
      }
    }
    return sendDbError(res, 'Multiple upload error', error);
  }
};

// Get user's attachments
export const getUserAttachments = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);
    const end = offset + limit - 1;
    let query = supabase
      .from('attachments')
      .select(attachmentWithUploader, { count: 'exact' })
      .eq('uploaded_by', req.user._id)
      .order('created_at', { ascending: false })
      .range(offset, end);

    if (req.query.type) query = query.eq('attachment_type', req.query.type);

    const { data, count, error } = await query;
    if (error) throw error;

    return res.json({
      attachments: data.map(toAttachment),
      pagination: paginationResult(page, limit, offset, count || 0, data.length)
    });
  } catch (error) {
    return sendDbError(res, 'Get user attachments error', error);
  }
};

// Get attachment by ID
export const getAttachment = async (req, res) => {
  try {
    const row = await findAttachment(req.params.id, true);
    if (!row) return res.status(404).json({ message: 'Attachment not found' });
    if (!canAccess(row, req.user)) return res.status(403).json({ message: 'Access denied' });
    return res.json(toAttachment(row));
  } catch (error) {
    return sendDbError(res, 'Get attachment error', error);
  }
};

// Download attachment
export const downloadAttachment = async (req, res) => {
  try {
    const attachment = await findAttachment(req.params.id);
    if (!attachment) return res.status(404).json({ message: 'Attachment not found' });
    if (!canAccess(attachment, req.user)) return res.status(403).json({ message: 'Access denied' });
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    const { error } = await supabase.rpc('record_attachment_download', {
      p_attachment_id: attachment.id
    });
    if (error) throw error;

    const safeFilename = attachment.original_name.replace(/[\r\n"]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', attachment.mimetype);
    res.setHeader('Content-Length', attachment.size);
    return fs.createReadStream(attachment.path).pipe(res);
  } catch (error) {
    return sendDbError(res, 'Download attachment error', error);
  }
};

// Delete attachment
export const deleteAttachment = async (req, res) => {
  try {
    const attachment = await findAttachment(req.params.id);
    if (!attachment) return res.status(404).json({ message: 'Attachment not found' });
    if (attachment.uploaded_by !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { error } = await supabase.from('attachments').delete().eq('id', attachment.id);
    if (error) throw error;

    await Promise.all([
      deleteFile(attachment.path),
      attachment.thumbnail_path ? deleteFile(attachment.thumbnail_path) : Promise.resolve(),
      attachment.compressed_path ? deleteFile(attachment.compressed_path) : Promise.resolve()
    ]);

    if (attachment.attachment_type === 'profile_picture') {
      await clearUserProfilePicture(attachment.uploaded_by, attachment.id);
    }

    return res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    return sendDbError(res, 'Delete attachment error', error);
  }
};

// Update attachment metadata
export const updateAttachment = async (req, res) => {
  try {
    const attachment = await findAttachment(req.params.id, true);
    if (!attachment) return res.status(404).json({ message: 'Attachment not found' });
    if (attachment.uploaded_by !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = {};
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.tags !== undefined) {
      updates.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : req.body.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    }
    if (req.body.isPublic !== undefined) {
      if (![true, false, 'true', 'false'].includes(req.body.isPublic)) {
        return res.status(400).json({ message: 'isPublic must be a boolean' });
      }
      updates.is_public = req.body.isPublic === true || req.body.isPublic === 'true';
    }

    const { data, error } = await supabase
      .from('attachments')
      .update(updates)
      .eq('id', attachment.id)
      .select(attachmentWithUploader)
      .single();
    if (error) throw error;

    return res.json({
      message: 'Attachment updated successfully',
      attachment: toAttachment(data)
    });
  } catch (error) {
    return sendDbError(res, 'Update attachment error', error);
  }
};

// Get attachments for a specific entity
export const getEntityAttachments = async (req, res) => {
  try {
    const { model, entityId } = req.params;
    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);
    const { data, count, error } = await supabase
      .from('attachments')
      .select(attachmentWithUploader, { count: 'exact' })
      .eq('related_model', model)
      .eq('related_id', entityId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    const accessibleAttachments = data
      .filter((attachment) => canAccess(attachment, req.user))
      .map(toAttachment);

    return res.json({
      attachments: accessibleAttachments,
      pagination: paginationResult(page, limit, offset, count || 0, data.length)
    });
  } catch (error) {
    return sendDbError(res, 'Get entity attachments error', error);
  }
};

// Get attachment statistics
export const getAttachmentStats = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user._id;
    const [{ data: byType, error: byTypeError }, { data: totals, error: totalError }] = await Promise.all([
      supabase.rpc('attachment_stats_by_type', { p_uploaded_by: userId }),
      supabase.rpc('attachment_total_stats', { p_uploaded_by: userId })
    ]);

    if (byTypeError) throw byTypeError;
    if (totalError) throw totalError;

    return res.json({
      byType: byType.map((row) => ({
        _id: row.attachment_type,
        count: Number(row.count),
        totalSize: Number(row.total_size),
        avgSize: Number(row.avg_size)
      })),
      total: {
        totalFiles: Number(totals[0]?.total_files || 0),
        totalSize: Number(totals[0]?.total_size || 0),
        avgSize: Number(totals[0]?.avg_size || 0)
      }
    });
  } catch (error) {
    return sendDbError(res, 'Get attachment stats error', error);
  }
};

// Search attachments
export const searchAttachments = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);
    const end = offset + limit - 1;
    let query = supabase
      .from('attachments')
      .select(attachmentWithUploader, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, end);

    if (req.user.role !== 'admin') {
      const safeUserId = req.user._id.replace(/[^a-zA-Z0-9-]/g, '');
      const safeRole = req.user.role.replace(/[^a-zA-Z0-9_-]/g, '');
      query = query.or(
        `uploaded_by.eq.${safeUserId},is_public.eq.true,allowed_users.cs.{${safeUserId}},allowed_roles.cs.{${safeRole}}`
      );
    }

    if (req.query.q) {
      const safeTerm = String(req.query.q).replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim().slice(0, 100);
      if (safeTerm) {
        const pattern = `*${safeTerm}*`;
        query = query.or(
          `original_name.ilike.${pattern},description.ilike.${pattern},tags.cs.{${safeTerm}}`
        );
      }
    }
    if (req.query.type) query = query.eq('attachment_type', req.query.type);
    if (req.query.tags) {
      const tags = String(req.query.tags).split(',').map((tag) => tag.trim()).filter(Boolean);
      if (tags.length) query = query.overlaps('tags', tags);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return res.json({
      attachments: data.map(toAttachment),
      pagination: paginationResult(page, limit, offset, count || 0, data.length)
    });
  } catch (error) {
    return sendDbError(res, 'Search attachments error', error);
  }
};
