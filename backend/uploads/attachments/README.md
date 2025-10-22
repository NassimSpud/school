# Attachments Directory Structure

This directory contains all attachment files for the school system, organized by category:

## Directory Structure

```
attachments/
├── student-documents/     # Student-submitted documents (reports, assignments, etc.)
├── teacher-evaluations/   # Teacher evaluation forms and feedback
├── reports/              # System-generated reports and analytics
└── profiles/             # Profile pictures and related media
```

## File Organization

- **student-documents/**: Contains all documents uploaded by students including:
  - Internship reports
  - Progress updates
  - Company feedback forms
  - Attachment completion certificates

- **teacher-evaluations/**: Contains teacher-related files including:
  - Student evaluation forms
  - Visit reports
  - Assessment documents
  - Feedback forms

- **reports/**: Contains system-generated files including:
  - Analytics reports
  - Performance summaries
  - Attendance reports
  - Progress tracking documents

- **profiles/**: Contains user profile media including:
  - Profile pictures
  - User avatars
  - Identity documents (if required)

## File Naming Convention

Files should follow this naming pattern:
`{category}_{userId}_{timestamp}_{originalName}`

Example: `report_60d5ec49f1b2c8b1f8e4e1a1_1634567890_internship_report.pdf`

## Security Notes

- All files are stored outside the web root for security
- File access is controlled through API endpoints
- File types are validated before upload
- Maximum file size limits are enforced
