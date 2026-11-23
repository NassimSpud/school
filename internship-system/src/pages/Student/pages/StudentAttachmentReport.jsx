import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';

const StudentAttachmentReport = () => {
  const [title, setTitle] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [file, setFile] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadReports = async () => {
    try {
      const { data } = await api.get('/api/ams/reports');
      setReports(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load your reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Choose a report file to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    const body = new FormData();
    body.append('title', title.trim());
    body.append('periodStart', periodStart);
    body.append('periodEnd', periodEnd);
    body.append('file', file);

    try {
      const { data } = await api.post('/api/ams/reports', body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReports((current) => [data, ...current]);
      setTitle('');
      setPeriodStart('');
      setPeriodEnd('');
      setFile(null);
      event.target.reset();
      setSuccess('Report uploaded and shared with both supervisors.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Report upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const downloadReport = async (report) => {
    try {
      const { data } = await api.get(report.file.downloadUrl, { responseType: 'blob' });
      const objectUrl = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = report.file.originalName;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Report download failed.');
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">Attachment Progress Report</h1>
      <p className="mb-6 text-sm text-gray-600">Upload a periodic or final report. Both supervisors can review it independently.</p>

      {error && <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</p>}
      {success && <p role="status" className="mb-4 rounded border border-green-300 bg-green-50 px-4 py-3 text-green-700">{success}</p>}

      <form onSubmit={handleSubmit} className="mb-8 space-y-4 rounded bg-white p-6 shadow">
        <div>
          <label htmlFor="report-title" className="mb-1 block text-sm font-medium text-gray-700">Report title</label>
          <input id="report-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} className="w-full rounded border px-3 py-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="period-start" className="mb-1 block text-sm font-medium text-gray-700">Period start</label>
            <input id="period-start" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} required className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label htmlFor="period-end" className="mb-1 block text-sm font-medium text-gray-700">Period end</label>
            <input id="period-end" type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} required className="w-full rounded border px-3 py-2" />
          </div>
        </div>
        <div>
          <label htmlFor="report-file" className="mb-1 block text-sm font-medium text-gray-700">Report file (PDF, DOC/DOCX, image, or spreadsheet; max 25 MB)</label>
          <input id="report-file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" onChange={(event) => setFile(event.target.files?.[0] || null)} required className="block w-full text-sm" />
        </div>
        <button type="submit" disabled={uploading} className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {uploading ? 'Uploading...' : 'Submit report'}
        </button>
      </form>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Submitted reports</h2>
        {loading ? <p className="text-gray-500">Loading reports...</p> : reports.length === 0 ? (
          <p className="rounded bg-white p-4 text-gray-500 shadow">No reports submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <article key={report.id} className="rounded bg-white p-4 shadow">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-600">{report.periodStart} – {report.periodEnd}</p>
                    {report.file && (
                      <button type="button" className="mt-1 inline-block text-sm text-blue-700 underline" onClick={() => downloadReport(report)}>
                        {report.file.originalName}
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">Submitted {new Date(report.submittedAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ['Company supervisor', report.companyReview],
                    ['School supervisor', report.schoolReview]
                  ].map(([label, review]) => (
                    <div key={label} className="rounded border p-3">
                      <p className="font-medium">{label}: {review.reviewed ? 'Reviewed' : 'Pending'}</p>
                      {review.comment && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentAttachmentReport;
