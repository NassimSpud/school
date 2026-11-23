import fs from 'fs';
import { supabase } from '../config/db.js';
import { deleteFile, formatFileSize, getFileUrl } from '../utils/fileUtils.js';

const today = () => new Date().toISOString().slice(0, 10);
const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const sendDbError = (res, label, error) => {
  console.error(`${label}:`, error);
  if (error.code === '23505') {
    return res.status(409).json({ message: 'A record with these details already exists' });
  }
  if (error.code === '23514' || error.code === '22023') {
    return res.status(400).json({ message: error.message });
  }
  if (error.code === '42501') {
    return res.status(403).json({ message: 'Not authorized for this action' });
  }
  if (error.code === 'P0002') {
    return res.status(404).json({ message: error.message });
  }
  return res.status(500).json({ message: 'A database error occurred' });
};

const currentPlacement = async (studentId) => {
  const date = today();
  const { data, error } = await supabase
    .from('placements')
    .select('id,student_id,company_id,company_supervisor_id,start_date,end_date,status')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .lte('start_date', date)
    .gte('end_date', date)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const getSchoolAssignment = async (studentId) => {
  const { data, error } = await supabase
    .from('school_supervisor_assignments')
    .select('school_supervisor_id,supervisor:users!school_supervisor_assignments_school_supervisor_id_fkey(id,name,email)')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const getCompanySupervisor = async (id) => {
  const { data, error } = await supabase
    .from('company_supervisors')
    .select('id,company_id,user_id,name,email')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const notify = async (rows) => {
  const notifications = rows.filter((row) => row?.recipient_id);
  if (!notifications.length) return;

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) throw error;
};

const notification = (recipient, sender, type, title, message, entityId, model) => ({
  recipient_id: recipient.id,
  recipient_role: recipient.role,
  sender_id: sender.id,
  sender_role: sender.role,
  type,
  title,
  message,
  related_entity: entityId,
  on_model: model
});

const getStudentIdsForSchoolSupervisor = async (supervisorId) => {
  const { data, error } = await supabase
    .from('school_supervisor_assignments')
    .select('student_id')
    .eq('school_supervisor_id', supervisorId);

  if (error) throw error;
  return data.map(({ student_id: studentId }) => studentId);
};

const getCurrentPlacementsForCompanySupervisor = async (supervisorId) => {
  const date = today();
  const { data, error } = await supabase
    .from('placements')
    .select('id,student_id,company_id,company_supervisor_id,start_date,end_date,status')
    .eq('company_supervisor_id', supervisorId)
    .eq('status', 'active')
    .lte('start_date', date)
    .gte('end_date', date)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data;
};

const getVisibleStudentIds = async (user) => {
  if (user.role === 'admin') return null;
  if (user.role === 'student') return [user.id];
  if (user.role === 'teacher') return getStudentIdsForSchoolSupervisor(user.id);
  return [];
};

const getVisiblePlacements = async (user) => {
  if (user.role === 'company_supervisor') {
    return getCurrentPlacementsForCompanySupervisor(user.companySupervisorId);
  }

  const studentIds = await getVisibleStudentIds(user);
  let query = supabase
    .from('placements')
    .select('id,student_id,company_id,company_supervisor_id,start_date,end_date,status')
    .order('start_date', { ascending: false });

  if (studentIds !== null) {
    if (!studentIds.length) return [];
    query = query.in('student_id', studentIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const getPeople = async (studentIds) => {
  if (!studentIds.length) return new Map();
  const { data, error } = await supabase
    .from('users')
    .select('id,name,school_id,department,class_id')
    .in('id', studentIds);

  if (error) throw error;
  return new Map(data.map((person) => [person.id, person]));
};

const getPlacementDetails = async (placementIds) => {
  if (!placementIds.length) return new Map();
  const { data, error } = await supabase
    .from('placements')
    .select('id,company_id,company_supervisor_id,start_date,end_date,status,company:companies(name,location),companySupervisor:company_supervisors(name,email)')
    .in('id', placementIds);

  if (error) throw error;
  return new Map(data.map((placement) => [placement.id, placement]));
};

const serializeReport = (report, files = new Map()) => {
  const file = files.get(report.file_attachment_id);
  return {
    id: report.id,
    studentId: report.student_id,
    placementId: report.placement_id,
    title: report.title,
    periodStart: report.period_start,
    periodEnd: report.period_end,
    submittedAt: report.created_at,
    companyReview: {
      reviewed: Boolean(report.company_reviewed_at),
      comment: report.company_review_comment,
      reviewedAt: report.company_reviewed_at
    },
    schoolReview: {
      reviewed: Boolean(report.school_reviewed_at),
      comment: report.school_review_comment,
      reviewedAt: report.school_reviewed_at
    },
    file: file ? {
      id: file.id,
      originalName: file.original_name,
      size: Number(file.size),
      formattedSize: formatFileSize(Number(file.size)),
      downloadUrl: `/api/ams/reports/${report.id}/download`
    } : null
  };
};

const queryReports = async (placementIds) => {
  if (!placementIds.length) return [];
  const { data, error } = await supabase
    .from('attachment_reports')
    .select('*')
    .in('placement_id', placementIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const fileIds = data.map((report) => report.file_attachment_id).filter(Boolean);
  let files = new Map();
  if (fileIds.length) {
    const { data: fileRows, error: fileError } = await supabase
      .from('attachments')
      .select('id,original_name,size')
      .in('id', fileIds);
    if (fileError) throw fileError;
    files = new Map(fileRows.map((file) => [file.id, file]));
  }

  return data.map((report) => serializeReport(report, files));
};

const parseWeeklySummaryDetails = (summaryText) => {
  try {
    const details = JSON.parse(summaryText);
    if (details && typeof details === 'object' && !Array.isArray(details)) return details;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }
  return { activities: summaryText };
};

const queryWeeklySummaries = async (placementIds, role) => {
  if (!placementIds.length) return [];
  let query = supabase
    .from('weekly_summaries')
    .select('id,placement_id,student_id,week_number,summary_text,status,created_at,updated_at')
    .in('placement_id', placementIds)
    .order('week_number', { ascending: true });
  if (role === 'teacher' || role === 'company_supervisor') query = query.eq('status', 'submitted');

  const { data, error } = await query;
  if (error) throw error;
  const people = await getPeople([...new Set(data.map(({ student_id: id }) => id))]);
  return data.map((summary) => ({
    id: summary.id,
    placementId: summary.placement_id,
    studentId: summary.student_id,
    studentName: people.get(summary.student_id)?.name || 'Student',
    weekNumber: summary.week_number,
    summaryText: summary.summary_text,
    details: parseWeeklySummaryDetails(summary.summary_text),
    status: summary.status,
    createdAt: summary.created_at,
    updatedAt: summary.updated_at
  }));
};

const queryLogbookEntries = async (query) => {
  const { data, error } = await query.order('entry_date', { ascending: false });
  if (error) throw error;

  const people = await getPeople([...new Set(data.map((entry) => entry.student_id))]);
  const placements = await getPlacementDetails([...new Set(data.map((entry) => entry.placement_id))]);
  return data.map((entry) => ({
    id: entry.id,
    studentId: entry.student_id,
    studentName: people.get(entry.student_id)?.name || 'Student',
    schoolId: people.get(entry.student_id)?.school_id || '',
    placementId: entry.placement_id,
    company: placements.get(entry.placement_id)?.company?.name || '',
    date: entry.entry_date,
    department: entry.department_section,
    startTime: entry.start_time,
    endTime: entry.end_time,
    objectives: entry.objectives,
    tasks: entry.tasks,
    technologies: entry.technologies,
    skills: entry.skills,
    challenge: entry.challenge,
    evidence: entry.evidence,
    supervisorInitials: entry.supervisor_initials,
    status: entry.status,
    comment: entry.review_comment,
    reviewedAt: entry.reviewed_at
  }));
};

const reportIsVisibleTo = async (report, user) => {
  if (user.role === 'admin' || (user.role === 'student' && report.student_id === user.id)) return true;

  if (user.role === 'teacher') {
    const assignment = await getSchoolAssignment(report.student_id);
    return assignment?.school_supervisor_id === user.id;
  }

  if (user.role === 'company_supervisor') {
    const placement = await currentPlacement(report.student_id);
    return placement?.id === report.placement_id &&
      placement.company_supervisor_id === user.companySupervisorId;
  }

  return false;
};

export const getStudentDashboard = async (req, res) => {
  try {
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id,name,school_id,department,class_id,department_id')
      .eq('id', req.user.id)
      .single();
    if (studentError) throw studentError;

    const placement = await currentPlacement(student.id);
    const assignment = await getSchoolAssignment(student.id);
    const placementDetails = placement ? (await getPlacementDetails([placement.id])).get(placement.id) : null;
    const reports = placement ? await queryReports([placement.id]) : [];
    const logbookQuery = supabase.from('logbook_entries').select('*').eq('student_id', student.id);
    const logbookEntries = await queryLogbookEntries(logbookQuery);

    return res.json({
      student: {
        id: student.id,
        name: student.name,
        schoolId: student.school_id,
        department: student.department
      },
      attachment: placement ? {
        id: placement.id,
        company: placementDetails?.company?.name || '',
        location: placementDetails?.company?.location || '',
        companySupervisor: placementDetails?.companySupervisor?.name || '',
        schoolSupervisor: assignment?.supervisor?.name || null,
        startDate: placement.start_date,
        endDate: placement.end_date,
        status: placement.status
      } : null,
      reports,
      logbookEntries
    });
  } catch (error) {
    return sendDbError(res, 'Get student dashboard error', error);
  }
};

export const getLogbookEntries = async (req, res) => {
  try {
    let query = supabase.from('logbook_entries').select('*');

    if (req.user.role === 'student') {
      query = query.eq('student_id', req.user.id);
    } else if (req.user.role === 'teacher') {
      const studentIds = await getStudentIdsForSchoolSupervisor(req.user.id);
      if (!studentIds.length) return res.json([]);
      query = query.in('student_id', studentIds);
    } else if (req.user.role === 'company_supervisor') {
      const placements = await getCurrentPlacementsForCompanySupervisor(req.user.companySupervisorId);
      if (!placements.length) return res.json([]);
      query = query.in('placement_id', placements.map(({ id }) => id));
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view logbook entries' });
    }

    if (typeof req.query.status === 'string') query = query.eq('status', req.query.status);
    return res.json(await queryLogbookEntries(query));
  } catch (error) {
    return sendDbError(res, 'Get logbook entries error', error);
  }
};

export const createLogbookEntry = async (req, res) => {
  const {
    date, department, startTime, endTime, objectives, tasks,
    technologies, skills, challenge, evidence, supervisorInitials
  } = req.body;

  if (!isDate(date) || !isText(department) || !isText(objectives) || !isText(tasks)) {
    return res.status(400).json({ message: 'Date, department, objectives, and tasks are required' });
  }

  try {
    const placement = await currentPlacement(req.user.id);
    if (!placement) {
      return res.status(409).json({ message: 'A current active attachment is required to submit a logbook entry' });
    }
    if (date < placement.start_date || date > placement.end_date) {
      return res.status(400).json({ message: 'Logbook date must fall within the active attachment period' });
    }

    const { data: entry, error } = await supabase
      .from('logbook_entries')
      .insert({
        placement_id: placement.id,
        student_id: req.user.id,
        entry_date: date,
        department_section: department.trim(),
        start_time: startTime || null,
        end_time: endTime || null,
        objectives: objectives.trim(),
        tasks: tasks.trim(),
        technologies: technologies?.trim() || null,
        skills: skills?.trim() || null,
        challenge: challenge?.trim() || null,
        evidence: evidence?.trim() || null,
        supervisor_initials: supervisorInitials?.trim() || null
      })
      .select('*')
      .single();
    if (error) throw error;

    const [companySupervisor, schoolAssignment] = await Promise.all([
      getCompanySupervisor(placement.company_supervisor_id),
      getSchoolAssignment(req.user.id)
    ]);

    await notify([
      companySupervisor?.user_id && notification(
        { id: companySupervisor.user_id, role: 'company_supervisor' },
        { id: req.user.id, role: 'student' },
        'new_logbook',
        'New logbook entry',
        'A student submitted a logbook entry for your review.',
        entry.id,
        'LogbookEntry'
      ),
      schoolAssignment?.school_supervisor_id && notification(
        { id: schoolAssignment.school_supervisor_id, role: 'teacher' },
        { id: req.user.id, role: 'student' },
        'new_logbook',
        'New logbook entry',
        'A student you supervise submitted a logbook entry.',
        entry.id,
        'LogbookEntry'
      )
    ]);

    return res.status(201).json((await queryLogbookEntries(
      supabase.from('logbook_entries').select('*').eq('id', entry.id)
    ))[0]);
  } catch (error) {
    return sendDbError(res, 'Create logbook entry error', error);
  }
};

export const updateLogbookEntry = async (req, res) => {
  const {
    date, department, startTime, endTime, objectives, tasks,
    technologies, skills, challenge, evidence, supervisorInitials
  } = req.body;
  if (!isDate(date) || !isText(department) || !isText(objectives) || !isText(tasks)) {
    return res.status(400).json({ message: 'Date, department, objectives, and tasks are required' });
  }

  try {
    const { data, error } = await supabase
      .from('logbook_entries')
      .update({
        entry_date: date,
        department_section: department.trim(),
        start_time: startTime || null,
        end_time: endTime || null,
        objectives: objectives.trim(),
        tasks: tasks.trim(),
        technologies: technologies?.trim() || null,
        skills: skills?.trim() || null,
        challenge: challenge?.trim() || null,
        evidence: evidence?.trim() || null,
        supervisor_initials: supervisorInitials?.trim() || null
      })
      .eq('id', req.params.id)
      .eq('student_id', req.user.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Pending logbook entry not found' });
    return res.json((await queryLogbookEntries(
      supabase.from('logbook_entries').select('*').eq('id', data.id)
    ))[0]);
  } catch (error) {
    return sendDbError(res, 'Update logbook entry error', error);
  }
};

export const deleteLogbookEntry = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('logbook_entries')
      .delete()
      .eq('id', req.params.id)
      .eq('student_id', req.user.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Pending logbook entry not found' });
    return res.json({ message: 'Logbook entry deleted' });
  } catch (error) {
    return sendDbError(res, 'Delete logbook entry error', error);
  }
};

export const getWeeklySummaries = async (req, res) => {
  try {
    const placements = await getVisiblePlacements(req.user);
    return res.json(await queryWeeklySummaries(placements.map(({ id }) => id), req.user.role));
  } catch (error) {
    return sendDbError(res, 'Get weekly summaries error', error);
  }
};

export const createWeeklySummary = async (req, res) => {
  const { weekNumber, summaryText, status = 'submitted' } = req.body;
  if (
    !Number.isInteger(weekNumber) || weekNumber < 1 ||
    !isText(summaryText) || !['draft', 'submitted'].includes(status)
  ) {
    return res.status(400).json({ message: 'A positive week number, summary text, and valid status are required' });
  }

  try {
    const placement = await currentPlacement(req.user.id);
    if (!placement) {
      return res.status(409).json({ message: 'A current active attachment is required to save a weekly summary' });
    }

    const { error } = await supabase
      .from('weekly_summaries')
      .upsert({
        placement_id: placement.id,
        student_id: req.user.id,
        week_number: weekNumber,
        summary_text: summaryText.trim(),
        status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'placement_id,week_number' });
    if (error) throw error;

    const summaries = await queryWeeklySummaries([placement.id], req.user.role);
    const savedSummary = summaries.find(({ weekNumber: savedWeek }) => savedWeek === weekNumber);
    return res.status(200).json(savedSummary);
  } catch (error) {
    return sendDbError(res, 'Save weekly summary error', error);
  }
};

export const reviewLogbookEntry = async (req, res) => {
  const { decision, comment = '' } = req.body;
  if (!['approved', 'rejected'].includes(decision) || typeof comment !== 'string') {
    return res.status(400).json({ message: 'Decision must be approved or rejected and comment must be text' });
  }

  try {
    const { data: entry, error: entryError } = await supabase
      .from('logbook_entries')
      .select('id,student_id,placement_id,status')
      .eq('id', req.params.id)
      .maybeSingle();
    if (entryError) throw entryError;
    if (!entry) return res.status(404).json({ message: 'Logbook entry not found' });

    const placement = await currentPlacement(entry.student_id);
    if (
      req.user.role !== 'company_supervisor' ||
      !placement ||
      placement.id !== entry.placement_id ||
      placement.company_supervisor_id !== req.user.companySupervisorId
    ) {
      return res.status(403).json({ message: 'Not authorized to review this logbook entry' });
    }

    const { data, error } = await supabase
      .from('logbook_entries')
      .update({
        status: decision,
        review_comment: comment.trim(),
        reviewed_by: req.user.companySupervisorId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', entry.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(409).json({ message: 'This logbook entry has already been reviewed' });

    const schoolAssignment = await getSchoolAssignment(entry.student_id);
    await notify([
      notification(
        { id: entry.student_id, role: 'student' },
        { id: req.user.id, role: 'company_supervisor' },
        'logbook_reviewed',
        `Logbook entry ${decision}`,
        comment.trim() || `Your logbook entry was ${decision}.`,
        entry.id,
        'LogbookEntry'
      ),
      schoolAssignment?.school_supervisor_id && notification(
        { id: schoolAssignment.school_supervisor_id, role: 'teacher' },
        { id: req.user.id, role: 'company_supervisor' },
        'logbook_reviewed',
        `Logbook entry ${decision}`,
        comment.trim() || `A company supervisor ${decision} a logbook entry.`,
        entry.id,
        'LogbookEntry'
      )
    ]);

    return res.json((await queryLogbookEntries(
      supabase.from('logbook_entries').select('*').eq('id', entry.id)
    ))[0]);
  } catch (error) {
    return sendDbError(res, 'Review logbook entry error', error);
  }
};

export const getReports = async (req, res) => {
  try {
    const placements = await getVisiblePlacements(req.user);
    return res.json(await queryReports(placements.map(({ id }) => id)));
  } catch (error) {
    return sendDbError(res, 'Get attachment reports error', error);
  }
};

export const createReport = async (req, res) => {
  const { title, periodStart, periodEnd } = req.body;
  if (!isText(title) || !isDate(periodStart) || !isDate(periodEnd) || periodEnd < periodStart) {
    if (req.file?.path) await deleteFile(req.file.path);
    return res.status(400).json({ message: 'Title and a valid report period are required' });
  }
  if (!req.file) return res.status(400).json({ message: 'Report file is required' });

  let reportId;
  let fileAttachmentId;
  try {
    const placement = await currentPlacement(req.user.id);
    if (!placement) {
      await deleteFile(req.file.path);
      return res.status(409).json({ message: 'A current active attachment is required to upload a report' });
    }
    if (periodStart < placement.start_date || periodEnd > placement.end_date) {
      await deleteFile(req.file.path);
      return res.status(400).json({ message: 'Report period must fall within the active attachment period' });
    }

    const { data: report, error: reportError } = await supabase
      .from('attachment_reports')
      .insert({
        placement_id: placement.id,
        student_id: req.user.id,
        title: title.trim(),
        period_start: periodStart,
        period_end: periodEnd
      })
      .select('id')
      .single();
    if (reportError) throw reportError;
    reportId = report.id;

    const { data: attachment, error: attachmentError } = await supabase
      .from('attachments')
      .insert({
        filename: req.file.filename,
        original_name: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: getFileUrl(req.file.filename, 'report_attachment'),
        uploaded_by: req.user.id,
        attachment_type: 'report_attachment',
        related_model: 'Report',
        related_id: report.id,
        description: title.trim(),
        is_public: false,
        is_scanned: Boolean(req.file.isScanned),
        scan_result: req.file.scanResult || 'pending'
      })
      .select('id')
      .single();
    if (attachmentError) throw attachmentError;
    fileAttachmentId = attachment.id;

    const { error: linkError } = await supabase
      .from('attachment_reports')
      .update({ file_attachment_id: fileAttachmentId })
      .eq('id', report.id);
    if (linkError) throw linkError;

    const [companySupervisor, schoolAssignment] = await Promise.all([
      getCompanySupervisor(placement.company_supervisor_id),
      getSchoolAssignment(req.user.id)
    ]);
    await notify([
      companySupervisor?.user_id && notification(
        { id: companySupervisor.user_id, role: 'company_supervisor' },
        { id: req.user.id, role: 'student' },
        'new_report',
        'New attachment report',
        'A student uploaded a report for your review.',
        report.id,
        'Report'
      ),
      schoolAssignment?.school_supervisor_id && notification(
        { id: schoolAssignment.school_supervisor_id, role: 'teacher' },
        { id: req.user.id, role: 'student' },
        'new_report',
        'New attachment report',
        'A student you supervise uploaded a report.',
        report.id,
        'Report'
      )
    ]);

    return res.status(201).json((await queryReports([placement.id])).find(({ id }) => id === report.id));
  } catch (error) {
    if (fileAttachmentId) {
      await supabase.from('attachments').delete().eq('id', fileAttachmentId);
    }
    if (reportId) {
      await supabase.from('attachment_reports').delete().eq('id', reportId);
    }
    await deleteFile(req.file.path);
    return sendDbError(res, 'Create attachment report error', error);
  }
};

export const reviewReport = async (req, res) => {
  const { comment = '' } = req.body;
  if (typeof comment !== 'string') {
    return res.status(400).json({ message: 'Comment must be text' });
  }

  try {
    const { data: report, error: reportError } = await supabase
      .from('attachment_reports')
      .select('id,student_id,placement_id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (reportError) throw reportError;
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (req.user.role === 'company_supervisor') {
      const placement = await currentPlacement(report.student_id);
      if (
        !placement ||
        placement.id !== report.placement_id ||
        placement.company_supervisor_id !== req.user.companySupervisorId
      ) {
        return res.status(403).json({ message: 'Not authorized to review this report' });
      }

      const { error } = await supabase
        .from('attachment_reports')
        .update({
          company_review_comment: comment.trim(),
          company_reviewed_by: req.user.companySupervisorId,
          company_reviewed_at: new Date().toISOString()
        })
        .eq('id', report.id);
      if (error) throw error;
    } else if (req.user.role === 'teacher') {
      const assignment = await getSchoolAssignment(report.student_id);
      if (assignment?.school_supervisor_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to review this report' });
      }

      const { error } = await supabase
        .from('attachment_reports')
        .update({
          school_review_comment: comment.trim(),
          school_reviewed_by: req.user.id,
          school_reviewed_at: new Date().toISOString()
        })
        .eq('id', report.id);
      if (error) throw error;
    } else {
      return res.status(403).json({ message: 'Not authorized to review reports' });
    }

    await notify([
      notification(
        { id: report.student_id, role: 'student' },
        { id: req.user.id, role: req.user.role },
        'report_reviewed',
        'Attachment report reviewed',
        comment.trim() || 'One of your supervisors reviewed your report.',
        report.id,
        'Report'
      )
    ]);

    return res.json((await queryReports([report.placement_id])).find(({ id }) => id === report.id));
  } catch (error) {
    return sendDbError(res, 'Review attachment report error', error);
  }
};

export const downloadReport = async (req, res) => {
  try {
    const { data: report, error: reportError } = await supabase
      .from('attachment_reports')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (reportError) throw reportError;
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (!(await reportIsVisibleTo(report, req.user))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (!report.file_attachment_id) return res.status(404).json({ message: 'Report file not found' });

    const { data: file, error: fileError } = await supabase
      .from('attachments')
      .select('path,original_name,mimetype,size')
      .eq('id', report.file_attachment_id)
      .maybeSingle();
    if (fileError) throw fileError;
    if (!file || !fs.existsSync(file.path)) {
      return res.status(404).json({ message: 'Report file is unavailable' });
    }

    const safeFilename = file.original_name.replace(/[\r\n"]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Length', file.size);
    return fs.createReadStream(file.path).pipe(res);
  } catch (error) {
    return sendDbError(res, 'Download attachment report error', error);
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id,type,title,message,related_entity,on_model,is_read,created_at')
      .eq('recipient_id', req.user.id)
      .eq('recipient_role', req.user.role)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;

    return res.json(data.map((item) => ({
      _id: item.id,
      id: item.id,
      type: item.type,
      title: item.title,
      message: item.message,
      relatedEntity: item.related_entity,
      onModel: item.on_model,
      isRead: item.is_read,
      createdAt: item.created_at
    })));
  } catch (error) {
    return sendDbError(res, 'Get notifications error', error);
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('recipient_id', req.user.id)
      .eq('recipient_role', req.user.role)
      .select('id,is_read')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Notification not found' });
    return res.json({ id: data.id, isRead: data.is_read });
  } catch (error) {
    return sendDbError(res, 'Mark notification read error', error);
  }
};

export const createCompany = async (req, res) => {
  const { name, industryType, location } = req.body;
  if (!isText(name) || !isText(industryType) || !isText(location)) {
    return res.status(400).json({ message: 'Name, industry type, and location are required' });
  }

  try {
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: name.trim(),
        industry_type: industryType.trim(),
        location: location.trim(),
        created_by: req.user.id
      })
      .select('id,name,industry_type,location')
      .single();
    if (error) throw error;
    return res.status(201).json({
      id: data.id,
      name: data.name,
      industryType: data.industry_type,
      location: data.location
    });
  } catch (error) {
    return sendDbError(res, 'Create company error', error);
  }
};

export const getCompanies = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id,name,industry_type,location,supervisors:company_supervisors(id,name,email,phone,user_id,invited_at)')
      .order('name');
    if (error) throw error;
    return res.json(data.map((company) => ({
      id: company.id,
      name: company.name,
      industryType: company.industry_type,
      location: company.location,
      supervisors: (company.supervisors || []).map((supervisor) => ({
        id: supervisor.id,
        name: supervisor.name,
        email: supervisor.email,
        phone: supervisor.phone,
        userId: supervisor.user_id,
        invitedAt: supervisor.invited_at
      }))
    })));
  } catch (error) {
    return sendDbError(res, 'Get companies error', error);
  }
};

export const createCompanySupervisor = async (req, res) => {
  const { name, email, phone } = req.body;
  if (!isText(name) || !isText(email) || !isText(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'A valid name, email, and phone are required' });
  }

  try {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', req.params.companyId)
      .maybeSingle();
    if (companyError) throw companyError;
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const { data, error } = await supabase
      .from('company_supervisors')
      .insert({
        company_id: company.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        created_by: req.user.id
      })
      .select('id,company_id,name,email,phone')
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    return sendDbError(res, 'Create company supervisor error', error);
  }
};

export const inviteCompanySupervisor = async (req, res) => {
  try {
    const { data: supervisor, error: supervisorError } = await supabase
      .from('company_supervisors')
      .select('id,user_id,name,email')
      .eq('id', req.params.id)
      .maybeSingle();
    if (supervisorError) throw supervisorError;
    if (!supervisor) return res.status(404).json({ message: 'Company supervisor not found' });
    if (supervisor.user_id) return res.status(409).json({ message: 'This supervisor already has an account' });

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      supervisor.email,
      { redirectTo: `${frontendUrl}/set-password` }
    );
    if (inviteError) throw inviteError;
    if (!inviteData.user?.id) {
      throw new Error('Supabase Auth did not return the invited user');
    }

    const { data, error } = await supabase
      .from('company_supervisors')
      .update({
        user_id: inviteData.user.id,
        invited_at: new Date().toISOString()
      })
      .eq('id', supervisor.id)
      .is('user_id', null)
      .select('id,user_id,name,email,invited_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(409).json({ message: 'This supervisor was linked to an account concurrently' });
    return res.status(201).json({ message: 'Invitation sent', supervisor: data });
  } catch (error) {
    return sendDbError(res, 'Invite company supervisor error', error);
  }
};

export const getClasses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('id,class_number,intake,department_id,department:departments(name)')
      .order('class_number');
    if (error) throw error;
    return res.json(data.map((item) => ({
      id: item.id,
      classNumber: item.class_number,
      intake: item.intake,
      departmentId: item.department_id,
      department: item.department?.name || ''
    })));
  } catch (error) {
    return sendDbError(res, 'Get classes error', error);
  }
};

export const createClass = async (req, res) => {
  const { classNumber, departmentId, intake } = req.body;
  if (!isText(classNumber) || !isText(departmentId) || !isText(intake)) {
    return res.status(400).json({ message: 'Class number, department, and intake are required' });
  }

  try {
    const { data, error } = await supabase
      .from('classes')
      .insert({
        class_number: classNumber.trim(),
        department_id: departmentId,
        intake: intake.trim()
      })
      .select('id,class_number,intake,department_id')
      .single();
    if (error) throw error;
    return res.status(201).json({
      id: data.id,
      classNumber: data.class_number,
      intake: data.intake,
      departmentId: data.department_id
    });
  } catch (error) {
    return sendDbError(res, 'Create class error', error);
  }
};

export const getDepartments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id,name')
      .order('name');
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return sendDbError(res, 'Get departments error', error);
  }
};

export const assignStudentClass = async (req, res) => {
  const { classId } = req.body;
  if (!isText(classId)) return res.status(400).json({ message: 'Class ID is required' });

  try {
    const { data: classRow, error: classError } = await supabase
      .from('classes')
      .select('id,department_id,department:departments(name)')
      .eq('id', classId)
      .maybeSingle();
    if (classError) throw classError;
    if (!classRow) return res.status(404).json({ message: 'Class not found' });

    const { data, error } = await supabase
      .from('users')
      .update({
        class_id: classRow.id,
        department_id: classRow.department_id,
        department: classRow.department.name
      })
      .eq('id', req.params.id)
      .eq('role', 'student')
      .select('id,name,school_id,class_id,department_id,department')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Student not found' });
    return res.json(data);
  } catch (error) {
    return sendDbError(res, 'Assign student class error', error);
  }
};

export const createAttachmentApplication = async (req, res) => {
  const {
    companyName, location, verifiedLocation, industryType, supervisorName,
    supervisorContact, supervisorEmail, startDate, endDate, weeklyHours
  } = req.body;
  if (
    !isText(companyName) || !isText(location) || !isText(industryType) ||
    !isText(supervisorName) || !isText(supervisorContact) ||
    !isDate(startDate) || !isDate(endDate) || endDate < startDate ||
    !Number.isFinite(Number(weeklyHours)) || Number(weeklyHours) < 1 || Number(weeklyHours) > 168
  ) {
    return res.status(400).json({ message: 'Complete all required attachment application fields with valid values' });
  }

  try {
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('class_id,department_id')
      .eq('id', req.user.id)
      .single();
    if (studentError) throw studentError;
    if (!student.class_id || !student.department_id) {
      return res.status(409).json({ message: 'Ask an administrator to assign your class before submitting an attachment application' });
    }

    const { data: active, error: activeError } = await supabase
      .from('placements')
      .select('id')
      .eq('student_id', req.user.id)
      .eq('status', 'active')
      .gte('end_date', today())
      .maybeSingle();
    if (activeError) throw activeError;
    if (active) return res.status(409).json({ message: 'You already have an active attachment' });

    const { data, error } = await supabase
      .from('attachment_applications')
      .insert({
        student_id: req.user.id,
        company_name: companyName.trim(),
        location: location.trim(),
        verified_location: verifiedLocation?.trim() || null,
        industry_type: industryType.trim(),
        supervisor_name: supervisorName.trim(),
        supervisor_contact: supervisorContact.trim(),
        supervisor_email: supervisorEmail?.trim().toLowerCase() || null,
        start_date: startDate,
        end_date: endDate,
        weekly_hours: Number(weeklyHours)
      })
      .select('id,status,created_at')
      .single();
    if (error) throw error;
    return res.status(201).json({ application: data });
  } catch (error) {
    return sendDbError(res, 'Create attachment application error', error);
  }
};

export const getMyAttachmentApplications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attachment_applications')
      .select('*')
      .eq('student_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return sendDbError(res, 'Get student attachment applications error', error);
  }
};

export const getAttachmentApplications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attachment_applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const students = await getPeople([...new Set(data.map((application) => application.student_id))]);
    return res.json(data.map((application) => ({
      ...application,
      student: students.get(application.student_id) || null
    })));
  } catch (error) {
    return sendDbError(res, 'Get attachment applications error', error);
  }
};

export const reviewAttachmentApplication = async (req, res) => {
  const { decision, companyId = null, companySupervisorId = null, comment = '' } = req.body;
  if (!['approved', 'rejected'].includes(decision) || typeof comment !== 'string') {
    return res.status(400).json({ message: 'Decision must be approved or rejected and comment must be text' });
  }
  if (decision === 'approved' && (!isText(companyId) || !isText(companySupervisorId))) {
    return res.status(400).json({ message: 'Company and company supervisor are required for approval' });
  }

  try {
    const { data, error } = await supabase.rpc('review_attachment_application', {
      p_application_id: req.params.id,
      p_decision: decision,
      p_company_id: companyId,
      p_company_supervisor_id: companySupervisorId,
      p_admin_id: req.user.id,
      p_comment: comment.trim()
    });
    if (error) throw error;
    return res.json(data[0]);
  } catch (error) {
    return sendDbError(res, 'Review attachment application error', error);
  }
};

export const assignSchoolSupervisor = async (req, res) => {
  const { studentIds, schoolSupervisorId } = req.body;
  if (
    !Array.isArray(studentIds) ||
    !studentIds.length ||
    studentIds.some((id) => !isText(id)) ||
    !isText(schoolSupervisorId)
  ) {
    return res.status(400).json({ message: 'Student IDs and a school supervisor ID are required' });
  }
  if (studentIds.length > 100) {
    return res.status(400).json({ message: 'A maximum of 100 students can be assigned at once' });
  }

  try {
    const { data, error } = await supabase.rpc('assign_school_supervisor', {
      p_student_ids: [...new Set(studentIds)],
      p_school_supervisor_id: schoolSupervisorId,
      p_admin_id: req.user.id
    });
    if (error) throw error;
    return res.json({ assignments: data });
  } catch (error) {
    return sendDbError(res, 'Assign school supervisor error', error);
  }
};

export const getSchoolSupervisors = async (req, res) => {
  try {
    const { data: supervisors, error: supervisorError } = await supabase
      .from('users')
      .select('id,name,email,department')
      .eq('role', 'teacher')
      .order('name');
    if (supervisorError) throw supervisorError;

    const ids = supervisors.map(({ id }) => id);
    const { data: assignments, error: assignmentError } = ids.length
      ? await supabase
        .from('school_supervisor_assignments')
        .select('school_supervisor_id,student_id,student:users!school_supervisor_assignments_student_id_fkey(id,name,school_id)')
        .in('school_supervisor_id', ids)
      : { data: [], error: null };
    if (assignmentError) throw assignmentError;

    const studentsBySupervisor = new Map(ids.map((id) => [id, []]));
    for (const assignment of assignments) {
      studentsBySupervisor.get(assignment.school_supervisor_id)?.push(assignment.student);
    }

    return res.json(supervisors.map((supervisor) => ({
      id: supervisor.id,
      name: supervisor.name,
      email: supervisor.email,
      department: supervisor.department,
      students: studentsBySupervisor.get(supervisor.id) || []
    })));
  } catch (error) {
    return sendDbError(res, 'Get school supervisors error', error);
  }
};

export const getAttachmentOverview = async (req, res) => {
  try {
    const [
      { data: students, error: studentError },
      { data: classes, error: classError },
      { data: departments, error: departmentError },
      { data: companies, error: companyError }
    ] = await Promise.all([
      supabase.from('users').select('id,name,school_id,department,class_id,department_id').eq('role', 'student').order('name'),
      supabase.from('classes').select('id,class_number,intake,department_id'),
      supabase.from('departments').select('id,name'),
      supabase.from('companies').select('id,name')
    ]);
    if (studentError) throw studentError;
    if (classError) throw classError;
    if (departmentError) throw departmentError;
    if (companyError) throw companyError;

    const studentIds = students.map(({ id }) => id);
    const [{ data: assignments, error: assignmentError }, { data: placements, error: placementError }] = studentIds.length
      ? await Promise.all([
        supabase
          .from('school_supervisor_assignments')
          .select('student_id,school_supervisor_id,supervisor:users!school_supervisor_assignments_school_supervisor_id_fkey(id,name,email)')
          .in('student_id', studentIds),
        supabase
          .from('placements')
          .select('id,student_id,company_id,company_supervisor_id,start_date,end_date,status,created_at,company:companies(id,name,location),companySupervisor:company_supervisors(id,name,email)')
          .in('student_id', studentIds)
          .order('start_date', { ascending: false })
      ])
      : [{ data: [], error: null }, { data: [], error: null }];
    if (assignmentError) throw assignmentError;
    if (placementError) throw placementError;

    const classById = new Map(classes.map((item) => [item.id, item]));
    const departmentById = new Map(departments.map((item) => [item.id, item]));
    const assignmentByStudent = new Map(assignments.map((item) => [item.student_id, item]));
    const placementByStudent = new Map();
    const date = today();
    for (const placement of placements) {
      const current = placementByStudent.get(placement.student_id);
      const priority = (item) => (
        item.status === 'active' && item.start_date <= date && item.end_date >= date ? 0
          : item.status === 'active' && item.start_date > date ? 1
            : item.status === 'completed' || item.end_date < date ? 2 : 3
      );
      if (!current || priority(placement) < priority(current)) {
        placementByStudent.set(placement.student_id, placement);
      }
    }

    const classId = req.query.classId;
    const departmentId = req.query.departmentId;
    const companyId = req.query.companyId;
    const supervisorId = req.query.schoolSupervisorId;
    const assignmentStatus = req.query.status;
    const rows = students.map((student) => {
      const classRow = classById.get(student.class_id);
      const department = departmentById.get(student.department_id);
      const assignment = assignmentByStudent.get(student.id);
      const placement = placementByStudent.get(student.id);
      return {
        id: student.id,
        name: student.name,
        registrationNumber: student.school_id,
        classId: classRow?.id || null,
        className: classRow ? `${classRow.class_number} (${classRow.intake})` : 'Unassigned',
        departmentId: department?.id || null,
        department: department?.name || student.department || 'Unassigned',
        companyId: placement?.company_id || null,
        company: placement?.company?.name || '—',
        companySupervisorId: placement?.company_supervisor_id || null,
        companySupervisor: placement?.companySupervisor?.name || '—',
        schoolSupervisorId: assignment?.school_supervisor_id || null,
        schoolSupervisor: assignment?.supervisor?.name || null,
        assignmentStatus: assignment ? 'Assigned' : 'Unassigned',
        attachmentStatus: !placement ? 'No active attachment'
          : placement.status === 'cancelled' ? 'Cancelled'
            : placement.status === 'completed' || placement.end_date < date ? 'Completed'
              : placement.start_date > date ? 'Upcoming' : 'Active',
        placementId: placement?.id || null,
        startDate: placement?.start_date || null,
        endDate: placement?.end_date || null
      };
    }).filter((student) => (
      (!classId || student.classId === classId) &&
      (!departmentId || student.departmentId === departmentId) &&
      (!companyId || student.companyId === companyId) &&
      (!supervisorId || student.schoolSupervisorId === supervisorId) &&
      (!assignmentStatus || assignmentStatus === 'all' ||
        student.assignmentStatus.toLowerCase() === String(assignmentStatus).toLowerCase())
    ));

    const { count: pendingApplications, error: applicationError } = await supabase
      .from('attachment_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (applicationError) throw applicationError;

    return res.json({
      stats: {
        totalStudents: students.length,
        activeAttachments: rows.filter(({ attachmentStatus: status }) => status === 'Active').length,
        pendingApplications: pendingApplications || 0,
        schoolSupervisors: new Set(assignments.map(({ school_supervisor_id: id }) => id)).size
      },
      students: rows,
      filters: {
        classes: classes.map((item) => ({
          id: item.id,
          classNumber: item.class_number,
          intake: item.intake
        })),
        departments,
        companies,
        schoolSupervisors: [...new Map(assignments.map((item) => [
          item.school_supervisor_id,
          item.supervisor
        ])).values()]
      }
    });
  } catch (error) {
    return sendDbError(res, 'Get admin attachment overview error', error);
  }
};

export const getSupervisorDashboard = async (req, res) => {
  try {
    const placements = await getVisiblePlacements(req.user);
    const studentIds = [...new Set(placements.map(({ student_id: id }) => id))];
    const [people, reports, weeklySummaries] = await Promise.all([
      getPeople(studentIds),
      queryReports(placements.map(({ id }) => id)),
      queryWeeklySummaries(placements.map(({ id }) => id), req.user.role)
    ]);
    const placementDetails = await getPlacementDetails(placements.map(({ id }) => id));
    const recentStudents = studentIds.map((id) => {
      const placement = placements.find(({ student_id: studentId }) => studentId === id);
      const details = placementDetails.get(placement.id);
      return {
        id,
        name: people.get(id)?.name || 'Student',
        schoolId: people.get(id)?.school_id || '',
        company: details?.company?.name || '',
        location: details?.company?.location || '',
        status: placement.status
      };
    });
    const logbookQuery = supabase.from('logbook_entries').select('*');
    const logbookEntries = placements.length
      ? await queryLogbookEntries(logbookQuery.in('placement_id', placements.map(({ id }) => id)))
      : [];
    const pendingLogbook = logbookEntries.filter(({ status }) => status === 'pending');

    return res.json({
      role: req.user.role,
      totalStudents: studentIds.length,
      nairobiStudents: recentStudents.filter(({ location }) => /nairobi/i.test(location)).length,
      pendingEvaluations: pendingLogbook.length,
      urgentIssues: 0,
      recentStudents,
      upcomingVisits: [],
      logbookEntries,
      reports,
      weeklySummaries
    });
  } catch (error) {
    return sendDbError(res, 'Get supervisor dashboard error', error);
  }
};
