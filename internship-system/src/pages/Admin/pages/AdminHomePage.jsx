import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Users } from 'lucide-react';
import api from '../../../utils/api';

const emptyFilters = {
  classId: '',
  departmentId: '',
  companyId: '',
  schoolSupervisorId: '',
  status: ''
};

const AdminHomePage = () => {
  const [overview, setOverview] = useState({ stats: {}, students: [], filters: {} });
  const [supervisors, setSupervisors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [schoolSupervisorId, setSchoolSupervisorId] = useState('');
  const [applicationChoices, setApplicationChoices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [companyForm, setCompanyForm] = useState({ name: '', industryType: '', location: '' });
  const [classForm, setClassForm] = useState({ classNumber: '', departmentId: '', intake: '' });
  const [companySupervisorForm, setCompanySupervisorForm] = useState({
    companyId: '', name: '', email: '', phone: ''
  });

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/attachments', { params: filters });
      setOverview(data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load the attachment overview.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadAdminData = async () => {
    try {
      const [supervisorResponse, applicationResponse, companyResponse, classResponse, departmentResponse] = await Promise.all([
        api.get('/api/admin/school-supervisors'),
        api.get('/api/admin/attachment-applications'),
        api.get('/api/admin/companies'),
        api.get('/api/admin/classes'),
        api.get('/api/admin/departments')
      ]);
      setSupervisors(supervisorResponse.data);
      setApplications(applicationResponse.data);
      setCompanies(companyResponse.data);
      setClasses(classResponse.data);
      setDepartments(departmentResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load admin reference data.');
    }
  };

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const assignSchoolSupervisor = async () => {
    if (!selectedStudents.length || !schoolSupervisorId) return;
    try {
      await api.post('/api/admin/assignments', {
        studentIds: selectedStudents,
        schoolSupervisorId
      });
      setSelectedStudents([]);
      setMessage(`${selectedStudents.length} student(s) assigned.`);
      await Promise.all([loadOverview(), loadAdminData()]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not assign the school supervisor.');
    }
  };

  const assignClass = async (studentId, classId) => {
    if (!classId) return;
    try {
      await api.patch(`/api/admin/students/${studentId}/class`, { classId });
      await loadOverview();
      setMessage('Student class updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not assign the class.');
    }
  };

  const decideApplication = async (application, decision) => {
    const choice = applicationChoices[application.id] || {};
    try {
      await api.patch(`/api/admin/attachment-applications/${application.id}`, {
        decision,
        companyId: decision === 'approved' ? choice.companyId : null,
        companySupervisorId: decision === 'approved' ? choice.companySupervisorId : null,
        comment: choice.comment || ''
      });
      setMessage(`Application ${decision}.`);
      await Promise.all([loadOverview(), loadAdminData()]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update the application.');
    }
  };

  const createCompany = async (event) => {
    event.preventDefault();
    try {
      await api.post('/api/admin/companies', companyForm);
      setCompanyForm({ name: '', industryType: '', location: '' });
      setMessage('Company created.');
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create the company.');
    }
  };

  const createClass = async (event) => {
    event.preventDefault();
    try {
      await api.post('/api/admin/classes', classForm);
      setClassForm({ classNumber: '', departmentId: '', intake: '' });
      setMessage('Class created.');
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create the class.');
    }
  };

  const createAndInviteCompanySupervisor = async (event) => {
    event.preventDefault();
    try {
      const { data: supervisor } = await api.post(
        `/api/admin/companies/${companySupervisorForm.companyId}/supervisors`,
        {
          name: companySupervisorForm.name,
          email: companySupervisorForm.email,
          phone: companySupervisorForm.phone
        }
      );
      await api.post(`/api/admin/company-supervisors/${supervisor.id}/invite`);
      setCompanySupervisorForm({ companyId: '', name: '', email: '', phone: '' });
      setMessage('Company supervisor invitation sent.');
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not invite the company supervisor.');
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents((current) => current.includes(studentId)
      ? current.filter((id) => id !== studentId)
      : [...current, studentId]);
  };

  const setApplicationChoice = (applicationId, field, value) => {
    setApplicationChoices((current) => ({
      ...current,
      [applicationId]: { ...current[applicationId], [field]: value }
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Attachment Overview</h1>
        <p className="text-gray-600">Manage placements, supervisor assignments, and student records.</p>
      </div>

      {error && <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p role="status" className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-green-700">{message}</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Students" value={overview.stats.totalStudents || 0} />
        <StatCard title="Active Attachments" value={overview.stats.activeAttachments || 0} />
        <StatCard title="Pending Applications" value={overview.stats.pendingApplications || 0} />
        <StatCard title="School Supervisors" value={supervisors.length} />
      </div>

      <section className="mb-8 rounded-lg bg-white p-5 shadow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Students on Attachment</h2>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Filter by class" value={filters.classId} onChange={(e) => setFilters({ ...filters, classId: e.target.value })} className="rounded border p-2 text-sm">
              <option value="">All classes</option>
              {(overview.filters.classes || []).map((item) => <option key={item.id} value={item.id}>{item.classNumber} · {item.intake}</option>)}
            </select>
            <select aria-label="Filter by department" value={filters.departmentId} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })} className="rounded border p-2 text-sm">
              <option value="">All departments</option>
              {(overview.filters.departments || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select aria-label="Filter by company" value={filters.companyId} onChange={(e) => setFilters({ ...filters, companyId: e.target.value })} className="rounded border p-2 text-sm">
              <option value="">All companies</option>
              {(overview.filters.companies || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select aria-label="Filter by school supervisor" value={filters.schoolSupervisorId} onChange={(e) => setFilters({ ...filters, schoolSupervisorId: e.target.value })} className="rounded border p-2 text-sm">
              <option value="">All school supervisors</option>
              {(overview.filters.schoolSupervisors || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select aria-label="Filter by assignment status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="rounded border p-2 text-sm">
              <option value="">Assigned and unassigned</option>
              <option value="Assigned">Assigned</option>
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-600">{selectedStudents.length} selected</span>
          <select aria-label="School supervisor to assign" value={schoolSupervisorId} onChange={(e) => setSchoolSupervisorId(e.target.value)} className="rounded border p-2 text-sm">
            <option value="">Select school supervisor</option>
            {supervisors.map((supervisor) => <option key={supervisor.id} value={supervisor.id}>{supervisor.name}</option>)}
          </select>
          <button onClick={assignSchoolSupervisor} disabled={!selectedStudents.length || !schoolSupervisorId} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
            Assign selected
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Select</th>
                <th className="p-3 text-left">Student / Reg. no.</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">Company Supervisor</th>
                <th className="p-3 text-left">School Supervisor</th>
                <th className="p-3 text-left">Attachment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {overview.students.map((student) => (
                <tr key={student.id}>
                  <td className="p-3">
                    <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => toggleStudent(student.id)} aria-label={`Select ${student.name}`} />
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-gray-500">{student.registrationNumber}</div>
                  </td>
                  <td className="p-3">
                    {student.className === 'Unassigned' ? (
                      <select aria-label={`Assign class to ${student.name}`} defaultValue="" onChange={(e) => assignClass(student.id, e.target.value)} className="rounded border p-1">
                        <option value="">Unassigned</option>
                        {classes.map((item) => <option key={item.id} value={item.id}>{item.classNumber} · {item.intake}</option>)}
                      </select>
                    ) : student.className}
                  </td>
                  <td className="p-3">{student.department}</td>
                  <td className="p-3">{student.company}</td>
                  <td className="p-3">{student.companySupervisor}</td>
                  <td className="p-3">{student.schoolSupervisor || <span className="font-medium text-amber-700">Unassigned</span>}</td>
                  <td className="p-3">{student.attachmentStatus}</td>
                </tr>
              ))}
              {!loading && overview.students.length === 0 && (
                <tr><td colSpan="8" className="p-6 text-center text-gray-500">No students match these filters.</td></tr>
              )}
              {loading && <tr><td colSpan="8" className="p-6 text-center text-gray-500">Loading students...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 rounded-lg bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-semibold">School Supervisors and Assigned Students</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {supervisors.map((supervisor) => (
            <article key={supervisor.id} className="rounded border p-4">
              <h3 className="font-semibold">{supervisor.name}</h3>
              <p className="text-sm text-gray-500">{supervisor.email}</p>
              <p className="mt-2 text-sm font-medium">Assigned students ({supervisor.students.length})</p>
              <p className="text-sm text-gray-600">{supervisor.students.map((student) => student.name).join(', ') || 'None'}</p>
            </article>
          ))}
          {!supervisors.length && <p className="text-sm text-gray-500">No school supervisors found.</p>}
        </div>
      </section>

      <section className="mb-8 rounded-lg bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-semibold">Attachment Applications</h2>
        <div className="space-y-4">
          {applications.filter((application) => application.status === 'pending').map((application) => {
            const choice = applicationChoices[application.id] || {};
            const selectedCompany = companies.find((company) => company.id === choice.companyId);
            return (
              <article key={application.id} className="rounded border p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{application.student?.name} · {application.company_name}</h3>
                    <p className="text-sm text-gray-600">{application.start_date} – {application.end_date} · {application.supervisor_name} · {application.supervisor_email || application.supervisor_contact}</p>
                  </div>
                  <span className="text-sm text-amber-700">Pending review</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <select value={choice.companyId || ''} onChange={(e) => setApplicationChoice(application.id, 'companyId', e.target.value)} className="rounded border p-2 text-sm">
                    <option value="">Link to company</option>
                    {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                  </select>
                  <select value={choice.companySupervisorId || ''} onChange={(e) => setApplicationChoice(application.id, 'companySupervisorId', e.target.value)} className="rounded border p-2 text-sm">
                    <option value="">Link to company supervisor</option>
                    {(selectedCompany?.supervisors || []).filter((supervisor) => supervisor.userId).map((supervisor) => <option key={supervisor.id} value={supervisor.id}>{supervisor.name} ({supervisor.email})</option>)}
                  </select>
                </div>
                <textarea value={choice.comment || ''} onChange={(e) => setApplicationChoice(application.id, 'comment', e.target.value)} placeholder="Review comment" className="mt-2 w-full rounded border p-2 text-sm" />
                <div className="mt-3 flex gap-2">
                  <button disabled={!choice.companyId || !choice.companySupervisorId} onClick={() => decideApplication(application, 'approved')} className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Approve and create placement</button>
                  <button onClick={() => decideApplication(application, 'rejected')} className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white">Reject</button>
                </div>
              </article>
            );
          })}
          {!applications.some((application) => application.status === 'pending') && <p className="text-sm text-gray-500">No pending applications.</p>}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={createCompany} className="space-y-2 rounded-lg bg-white p-5 shadow">
          <h2 className="font-semibold">Add Company</h2>
          <input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} placeholder="Company name" required className="w-full rounded border p-2 text-sm" />
          <input value={companyForm.industryType} onChange={(e) => setCompanyForm({ ...companyForm, industryType: e.target.value })} placeholder="Industry" required className="w-full rounded border p-2 text-sm" />
          <input value={companyForm.location} onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })} placeholder="Location" required className="w-full rounded border p-2 text-sm" />
          <button className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Create company</button>
        </form>

        <form onSubmit={createClass} className="space-y-2 rounded-lg bg-white p-5 shadow">
          <h2 className="font-semibold">Add Class</h2>
          <input value={classForm.classNumber} onChange={(e) => setClassForm({ ...classForm, classNumber: e.target.value })} placeholder="Class number" required className="w-full rounded border p-2 text-sm" />
          <select value={classForm.departmentId} onChange={(e) => setClassForm({ ...classForm, departmentId: e.target.value })} required className="w-full rounded border p-2 text-sm">
            <option value="">Select department</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
          <input value={classForm.intake} onChange={(e) => setClassForm({ ...classForm, intake: e.target.value })} placeholder="Intake (e.g. September 2026)" required className="w-full rounded border p-2 text-sm" />
          <button className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Create class</button>
        </form>

        <form onSubmit={createAndInviteCompanySupervisor} className="space-y-2 rounded-lg bg-white p-5 shadow">
          <h2 className="font-semibold">Invite Company Supervisor</h2>
          <select value={companySupervisorForm.companyId} onChange={(e) => setCompanySupervisorForm({ ...companySupervisorForm, companyId: e.target.value })} required className="w-full rounded border p-2 text-sm">
            <option value="">Select company</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
          <input value={companySupervisorForm.name} onChange={(e) => setCompanySupervisorForm({ ...companySupervisorForm, name: e.target.value })} placeholder="Supervisor name" required className="w-full rounded border p-2 text-sm" />
          <input type="email" value={companySupervisorForm.email} onChange={(e) => setCompanySupervisorForm({ ...companySupervisorForm, email: e.target.value })} placeholder="Email" required className="w-full rounded border p-2 text-sm" />
          <input value={companySupervisorForm.phone} onChange={(e) => setCompanySupervisorForm({ ...companySupervisorForm, phone: e.target.value })} placeholder="Phone" required className="w-full rounded border p-2 text-sm" />
          <button className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Create and invite</button>
        </form>
      </section>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="rounded-lg bg-white p-5 shadow">
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-600">{title}</p>
      {title === 'Pending Applications' ? <AlertCircle className="h-5 w-5 text-orange-500" /> : <CheckCircle className="h-5 w-5 text-blue-500" />}
    </div>
    <p className="mt-2 text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

export default AdminHomePage;
