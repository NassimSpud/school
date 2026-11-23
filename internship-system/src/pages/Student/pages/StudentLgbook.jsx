import React, { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  GraduationCap,
  Printer,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import api from "../../../utils/api";

const STORAGE_KEY = "student-industrial-attachment-logbook-v1";

const createInitialData = () => ({
  particulars: {
    institution: "",
    faculty: "",
    department: "",
    studentName: "",
    registrationNumber: "",
    course: "Bachelor of Science in Information Technology",
    yearOfStudy: "",
    hostOrganization: "",
    hostAddress: "",
    startDate: "",
    endDate: "",
    industrySupervisor: "",
    supervisorTitle: "",
  },
  objectives: ["", "", "", "", ""],
  dailyEntries: [],
  weeklySummaries: [],
  exposure: {},
  transfer: {
    currentStation: "",
    proposedStation: "",
    reason: "",
    requestDate: "",
    approvalDate: "",
    approvalReference: "",
  },
  visits: [],
  assessment: {
    ratings: {},
    comments: "",
    supervisorName: "",
    supervisorSignature: "",
    assessmentDate: "",
  },
  finalChecklist: {},
  coordinatorName: "",
  submissionDate: "",
});

const loadData = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { data: createInitialData(), error: "" };

    const parsed = JSON.parse(saved);
    const defaults = createInitialData();
    return {
      data: {
        ...defaults,
        ...parsed,
        weeklySummaries: [],
        particulars: { ...defaults.particulars, ...parsed.particulars },
        transfer: { ...defaults.transfer, ...parsed.transfer },
        assessment: { ...defaults.assessment, ...parsed.assessment },
      },
      error: "",
    };
  } catch {
    return {
      data: createInitialData(),
      error: "Saved logbook data could not be read. Your new entries will be saved when storage is available.",
    };
  }
};

const toWeeklySummaryView = (summary) => ({
  id: summary.id,
  week: summary.weekNumber,
  ...summary.details,
  status: summary.status,
  createdAt: summary.createdAt
});

const domains = [
  {
    name: "Network Administration",
    items: [
      "Configured or observed a router or switch",
      "Crimped or tested an Ethernet cable",
      "Created or troubleshot a VLAN",
      "Used a network monitoring or diagnostic tool",
      "Applied TCP/IP, DHCP, DNS, or wireless networking concepts",
    ],
  },
  {
    name: "Helpdesk & User Support",
    items: [
      "Resolved a user account or login issue",
      "Imaged, deployed, or configured a workstation",
      "Installed or troubleshot a printer or peripheral",
      "Recorded, prioritized, or closed a support ticket",
      "Explained a technical solution to a non-technical user",
    ],
  },
  {
    name: "Software Development",
    items: [
      "Wrote or modified a program or automation script",
      "Used Git or another version-control system",
      "Debugged and tested an application",
      "Worked with an API, web application, or development framework",
      "Participated in code review, planning, or deployment",
    ],
  },
  {
    name: "Database Management",
    items: [
      "Created or queried tables using SQL",
      "Used joins, filters, or aggregate queries",
      "Performed or observed a backup and restore",
      "Applied database access controls or data validation",
    ],
  },
  {
    name: "Cybersecurity",
    items: [
      "Ran an approved malware scan or reviewed an alert",
      "Installed security patches or updates",
      "Learned or applied firewall or access-control rules",
      "Participated in security awareness or incident response",
      "Handled data in line with privacy and confidentiality rules",
    ],
  },
  {
    name: "System Administration",
    items: [
      "Created or managed a user or group account",
      "Worked with Windows, Linux, or server administration",
      "Monitored services, storage, or system logs",
      "Configured permissions, backups, or system updates",
    ],
  },
  {
    name: "IT Documentation & Project Management",
    items: [
      "Prepared a technical guide, inventory, or system documentation",
      "Updated a task board, project plan, or issue tracker",
      "Participated in a meeting, sprint, or project review",
      "Estimated work, reported progress, or documented a handover",
    ],
  },
];

const assessmentCriteria = [
  "Punctuality and attendance",
  "Professional conduct and initiative",
  "Technical knowledge and practical skills",
  "Quality and accuracy of work",
  "Communication and teamwork",
  "Problem-solving and adaptability",
  "Record keeping and ability to follow instructions",
];

const reportSections = [
  {
    title: "1. Introduction",
    text: "State the purpose, objectives, scope, location, and duration of the attachment.",
  },
  {
    title: "2. Host organization background",
    text: "Describe the organization, its services, relevant departments, and the IT environment you worked in.",
  },
  {
    title: "3. Activities and duties",
    text: "Group related work by project, function, or week. Explain your role, methods, tools, technologies, and outcomes using specific logbook examples.",
  },
  {
    title: "4. Skills and knowledge gained",
    text: "Relate technical and professional skills to actual tasks. Explain how your objectives were achieved and give evidence where permitted.",
  },
  {
    title: "5. Challenges and solutions",
    text: "Select meaningful challenges from your daily logs, explain your analysis and resolution, and state what you learned.",
  },
  {
    title: "6. Conclusion and recommendations",
    text: "Summarize your experience and objectives achieved. Make practical recommendations to the host organization and your university.",
  },
  {
    title: "7. References and appendices",
    text: "List sources and attach approved, non-confidential evidence, diagrams, or supporting documents as required by your department.",
  },
];

const finalItems = [
  "Cover page and student/host particulars completed",
  "Three to five attachment objectives reviewed",
  "Daily entries completed for each working day",
  "Weekly summaries completed and reviewed",
  "Industry supervisor's weekly initials/signatures obtained",
  "IT activity and skill checklist reviewed",
  "University supervisor's visit record completed, if applicable",
  "Industry supervisor's final assessment completed and signed",
  "Final attachment report prepared using the logbook",
  "Confidential or restricted information removed from evidence",
  "Logbook and report submitted to the departmental coordinator",
];

const Field = ({ label, children, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
    {children}
  </label>
);

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

const Input = ({ className = "", ...props }) => (
  <input className={`${inputClass} ${className}`} {...props} />
);

const Textarea = ({ className = "", ...props }) => (
  <textarea className={`${inputClass} min-h-24 resize-y ${className}`} {...props} />
);

const Section = ({ id, number, title, description, icon: Icon, children }) => (
  <section id={id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
    <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-4">
      <span className="rounded-xl bg-blue-50 p-2 text-blue-700">
        {React.createElement(Icon, { size: 21 })}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Section {number}</p>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
    </div>
    {children}
  </section>
);

const StudentLogBook = () => {
  const [loaded] = useState(loadData);
  const [data, setData] = useState(loaded.data);
  const [storageError, setStorageError] = useState(loaded.error);
  const skipInitialSave = useRef(true);
  const [activeSection, setActiveSection] = useState("cover");
  const [entrySyncState, setEntrySyncState] = useState("loading");
  const [entryError, setEntryError] = useState("");
  const [weeklySyncState, setWeeklySyncState] = useState("loading");
  const [weeklyError, setWeeklyError] = useState("");
  const [savingWeekly, setSavingWeekly] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [savingEntry, setSavingEntry] = useState(false);
  const [dailyForm, setDailyForm] = useState({
    date: "",
    department: "",
    startTime: "",
    endTime: "",
    objectives: "",
    tasks: "",
    technologies: "",
    skills: "",
    challenge: "",
    evidence: "",
    supervisorInitials: "",
  });
  const [weeklyForm, setWeeklyForm] = useState({
    week: "",
    startDate: "",
    endDate: "",
    activities: "",
    skills: "",
    challenges: "",
    supervisorComments: "",
    supervisorName: "",
    supervisorSignature: "",
  });
  const [visitForm, setVisitForm] = useState({
    date: "",
    comments: "",
    supervisorName: "",
    signature: "",
  });

  useEffect(() => {
    let active = true;
    api.get("/api/ams/logbook")
      .then(({ data: entries }) => {
        if (!active) return;
        const serverEntries = entries.map((entry) => ({
          ...entry,
          day: new Date(`${entry.date}T00:00:00`).toLocaleDateString("en", { weekday: "long" }),
        }));
        setData((current) => ({ ...current, dailyEntries: serverEntries }));
        setEntrySyncState("server");
        setEntryError("");
      })
      .catch(() => {
        if (!active) return;
        setEntrySyncState("error");
        setEntryError("Daily entries could not be loaded from the server. Entries shown from this device may not be submitted.");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/api/ams/weekly-summaries")
      .then(({ data: summaries }) => {
        if (!active) return;
        setData((current) => ({ ...current, weeklySummaries: summaries.map(toWeeklySummaryView) }));
        setWeeklySyncState("server");
        setWeeklyError("");
      })
      .catch((error) => {
        if (!active) return;
        setWeeklySyncState("error");
        setWeeklyError(error.response?.data?.message || "Weekly summaries could not be loaded from the server.");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }

    try {
      const localData = { ...data };
      delete localData.weeklySummaries;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
      setStorageError("");
    } catch {
      setStorageError("Your browser could not save this logbook. Export or print a backup and check available browser storage.");
    }
  }, [data]);

  const updateData = (key, value) => {
    setData((current) => ({ ...current, [key]: value }));
  };

  const updateParticular = (event) => {
    const { name, value } = event.target;
    setData((current) => ({
      ...current,
      particulars: { ...current.particulars, [name]: value },
    }));
  };

  const updateNested = (section, name, value) => {
    setData((current) => ({
      ...current,
      [section]: { ...current[section], [name]: value },
    }));
  };

  const updateObjective = (index, value) => {
    setData((current) => ({
      ...current,
      objectives: current.objectives.map((objective, position) =>
        position === index ? value : objective
      ),
    }));
  };

  const addDailyEntry = async (event) => {
    event.preventDefault();
    if (entrySyncState !== "server") return;
    setSavingEntry(true);
    setEntryError("");
    try {
      const { data: savedEntry } = editingEntryId
        ? await api.patch(`/api/ams/logbook/${editingEntryId}`, dailyForm)
        : await api.post("/api/ams/logbook", dailyForm);
      const saved = {
        ...savedEntry,
        day: new Date(`${savedEntry.date}T00:00:00`).toLocaleDateString("en", { weekday: "long" }),
      };
      setData((current) => ({
        ...current,
        dailyEntries: [
          ...current.dailyEntries.filter((entry) => entry.id !== saved.id),
          saved,
        ].sort((a, b) => a.date.localeCompare(b.date)),
      }));
      setEditingEntryId(null);
      setDailyForm({
        date: "",
        department: "",
        startTime: "",
        endTime: "",
        objectives: "",
        tasks: "",
        technologies: "",
        skills: "",
        challenge: "",
        evidence: "",
        supervisorInitials: "",
      });
    } catch (error) {
      setEntryError(error.response?.data?.message || "The logbook entry could not be saved.");
    } finally {
      setSavingEntry(false);
    }
  };

  const editDailyEntry = (entry) => {
    setEditingEntryId(entry.id);
    setDailyForm({
      date: entry.date,
      department: entry.department || "",
      startTime: entry.startTime || "",
      endTime: entry.endTime || "",
      objectives: entry.objectives || "",
      tasks: entry.tasks || "",
      technologies: entry.technologies || "",
      skills: entry.skills || "",
      challenge: entry.challenge || "",
      evidence: entry.evidence || "",
      supervisorInitials: entry.supervisorInitials || "",
    });
    setActiveSection("daily");
  };

  const removeDailyEntry = async (entryId) => {
    setEntryError("");
    try {
      await api.delete(`/api/ams/logbook/${entryId}`);
      updateData("dailyEntries", data.dailyEntries.filter((entry) => entry.id !== entryId));
      if (editingEntryId === entryId) setEditingEntryId(null);
    } catch (error) {
      setEntryError(error.response?.data?.message || "The logbook entry could not be removed.");
    }
  };

  const addWeeklySummary = async (event) => {
    event.preventDefault();
    if (weeklySyncState !== "server") return;
    setSavingWeekly(true);
    setWeeklyError("");
    try {
      const details = {
        startDate: weeklyForm.startDate,
        endDate: weeklyForm.endDate,
        activities: weeklyForm.activities,
        skills: weeklyForm.skills,
        challenges: weeklyForm.challenges,
        supervisorComments: weeklyForm.supervisorComments,
        supervisorName: weeklyForm.supervisorName,
        supervisorSignature: weeklyForm.supervisorSignature
      };
      const { data: savedSummary } = await api.post("/api/ams/weekly-summaries", {
        weekNumber: Number(weeklyForm.week),
        summaryText: JSON.stringify(details),
        status: "submitted"
      });
      const summary = toWeeklySummaryView(savedSummary);
      setData((current) => ({
        ...current,
        weeklySummaries: [
          ...current.weeklySummaries.filter((item) => item.week !== summary.week),
          summary
        ].sort((a, b) => a.week - b.week)
      }));
      setWeeklyForm({
        week: "",
        startDate: "",
        endDate: "",
        activities: "",
        skills: "",
        challenges: "",
        supervisorComments: "",
        supervisorName: "",
        supervisorSignature: "",
      });
    } catch (error) {
      setWeeklyError(error.response?.data?.message || "The weekly summary could not be saved.");
    } finally {
      setSavingWeekly(false);
    }
  };

  const addVisit = (event) => {
    event.preventDefault();
    updateData("visits", [
      ...data.visits,
      { ...visitForm, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
    ]);
    setVisitForm({ date: "", comments: "", supervisorName: "", signature: "" });
  };

  const setChecklistItem = (key, checked) => {
    updateNested("finalChecklist", key, checked);
  };

  const exportLogbook = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "industrial-attachment-logbook-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const sections = [
    ["cover", "Cover & particulars"],
    ["objectives", "Objectives & guidance"],
    ["daily", "Daily activity log"],
    ["weekly", "Weekly summaries"],
    ["skills", "IT skills checklist"],
    ["transfer", "Station change"],
    ["visits", "University visit"],
    ["report", "Final report guide"],
    ["assessment", "Assessment & submission"],
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <style>{`
        @media print {
          body { background: white !important; }
          .logbook-no-print { display: none !important; }
          .logbook-section { break-inside: avoid; box-shadow: none !important; }
          input, textarea { border-color: #94a3b8 !important; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-2xl bg-gradient-to-r from-blue-950 to-blue-800 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-200">
                <GraduationCap size={17} /> Student attachment workspace
              </p>
              <h1 className="text-2xl font-extrabold sm:text-3xl">Industrial Attachment Logbook</h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-100">
                A practical record from your first day at the host organization through final submission.
                Complete entries honestly and have them reviewed regularly.
              </p>
            </div>
            <div className="logbook-no-print flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportLogbook}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-300/50 px-4 py-2 text-sm font-semibold hover:bg-white/10"
              >
                <Download size={16} /> Export backup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
              >
                <Printer size={16} /> Print / Save PDF
              </button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
              <Save size={13} /> {entrySyncState === "server" ? "Daily entries sync to server" : entrySyncState === "loading" ? "Loading daily entries" : "Daily entries not synced"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
              <CalendarDays size={13} /> {data.dailyEntries.length} daily entries
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
              <ClipboardCheck size={13} /> {data.weeklySummaries.length} weekly summaries
            </span>
          </div>
        </header>

        {storageError && (
          <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {storageError}
          </div>
        )}

        <nav className="logbook-no-print mb-6 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-1">
            {sections.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveSection(id);
                  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  activeSection === id ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        <div className="space-y-6">
          <div className="logbook-section">
            <Section
              id="cover"
              number="1"
              title="Cover page & student particulars"
              description="Complete before or on your first day. Add the official university logo to the printed cover where required."
              icon={GraduationCap}
            >
              <div className="mb-6 flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:flex-row sm:text-left">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-500">
                  UNIVERSITY
                  <br />
                  LOGO
                </div>
                <div className="w-full">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Official cover identity</p>
                  <Field label="University / School Name">
                    <Input name="institution" value={data.particulars.institution} onChange={updateParticular} placeholder="Enter institution name" />
                  </Field>
                  <p className="mt-2 text-xs text-slate-500">
                    For a hard copy, replace the logo placeholder with the official logo if your department requires it.
                  </p>
                </div>
              </div>
              <div className="mb-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-blue-800">
                  {data.particulars.institution || "University / School Name"}
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-wide text-slate-900">INDUSTRIAL ATTACHMENT LOGBOOK</h3>
                <p className="mt-1 text-sm text-slate-600">Bachelor of Science in Information Technology or related programme</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Faculty">
                  <Input name="faculty" value={data.particulars.faculty} onChange={updateParticular} placeholder="e.g. Faculty of Computing and IT" />
                </Field>
                <Field label="Department">
                  <Input name="department" value={data.particulars.department} onChange={updateParticular} placeholder="Department / school" />
                </Field>
                <Field label="Student's full name">
                  <Input name="studentName" value={data.particulars.studentName} onChange={updateParticular} autoComplete="name" />
                </Field>
                <Field label="Registration number">
                  <Input name="registrationNumber" value={data.particulars.registrationNumber} onChange={updateParticular} />
                </Field>
                <Field label="Course of study">
                  <Input name="course" value={data.particulars.course} onChange={updateParticular} />
                </Field>
                <Field label="Year of study">
                  <Input name="yearOfStudy" value={data.particulars.yearOfStudy} onChange={updateParticular} placeholder="e.g. Year 3" />
                </Field>
                <Field label="Host organization">
                  <Input name="hostOrganization" value={data.particulars.hostOrganization} onChange={updateParticular} />
                </Field>
                <Field label="Host organization address">
                  <Input name="hostAddress" value={data.particulars.hostAddress} onChange={updateParticular} placeholder="Postal / physical address" />
                </Field>
                <Field label="Industry-based supervisor">
                  <Input name="industrySupervisor" value={data.particulars.industrySupervisor} onChange={updateParticular} />
                </Field>
                <Field label="Supervisor's title / position">
                  <Input name="supervisorTitle" value={data.particulars.supervisorTitle} onChange={updateParticular} />
                </Field>
                <Field label="Attachment start date">
                  <Input type="date" name="startDate" value={data.particulars.startDate} onChange={updateParticular} />
                </Field>
                <Field label="Attachment end date">
                  <Input type="date" name="endDate" value={data.particulars.endDate} onChange={updateParticular} />
                </Field>
              </div>
            </Section>
          </div>

          <div className="logbook-section">
            <Section
              id="objectives"
              number="2"
              title="Introduction, objectives & student guidelines"
              description="Set measurable expectations before starting. Review your objectives with your supervisor during the attachment."
              icon={BookOpen}
            >
              <div className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                <p>
                  This logbook is the day-to-day record of your industrial attachment. Use it to document work performed,
                  tools used, skills developed, and challenges resolved. Your completed entries provide primary evidence
                  for your weekly reviews and final attachment report.
                </p>
              </div>
              <h3 className="mb-1 mt-6 font-bold text-slate-900">Overall attachment objectives (3-5 SMART objectives)</h3>
              <p className="mb-4 text-sm text-slate-600">
                Make each objective Specific, Measurable, Achievable, Relevant, and Time-bound. Leave unused lines blank.
                Example: “Gain hands-on network-administration experience by configuring and documenting router and switch
                settings under supervision within the first four weeks.”
              </p>
              <div className="space-y-3">
                {data.objectives.map((objective, index) => (
                  <Field key={index} label={`Objective ${index + 1}`}>
                    <Textarea
                      value={objective}
                      onChange={(event) => updateObjective(index, event.target.value)}
                      placeholder="By [date / week], I will [specific activity] and demonstrate completion by [measurable result]."
                      className="min-h-20"
                    />
                  </Field>
                ))}
              </div>
              <h3 className="mb-3 mt-7 font-bold text-slate-900">Rules for maintaining an acceptable logbook</h3>
              <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-700">
                <li>
                  <strong>Write daily:</strong> Complete the entry at the end of every working day, not retrospectively.
                  Be factual and specific; identify tools, technologies, your contribution, and the outcome.
                </li>
                <li>
                  <strong>Obtain weekly review:</strong> Present the logbook and weekly summary to your industry supervisor
                  every week for comments and signature/initials. Missing signatures may make the record difficult to verify
                  or acceptable for assessment.
                </li>
                <li>
                  <strong>Keep it professional:</strong> Use clear language, correct errors neatly, and treat the logbook
                  as an official document. Keep the physical logbook at the workplace; do not take it home. Follow your
                  institution's procedures for access, review, and safekeeping.
                </li>
                <li>
                  <strong>Include appropriate evidence:</strong> Add or reference approved sketches, diagrams, screenshots,
                  error messages, or code extracts where useful. Label each item with its date and entry; obtain permission
                  and remove passwords, personal data, and confidential organization information.
                </li>
                <li>
                  <strong>Protect information:</strong> Follow host-organization security policies. Do not copy restricted
                  source code, customer records, credentials, or internal network details into this logbook.
                </li>
              </ol>
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                Daily entries are submitted to your attachment record and shared with your supervisors. Other logbook
                sections still save in this browser. Export or print backups regularly and follow your department's official
                logbook rules if they differ from this guidance.
              </p>
            </Section>
          </div>

          <div className="logbook-section">
            <Section
              id="daily"
              number="3"
              title="Daily activity log"
              description="Create one entry for every working day. Use action verbs and record what you personally did."
              icon={CalendarDays}
            >
              {entryError && (
                <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {entryError}
                </p>
              )}
              <form onSubmit={addDailyEntry} className="logbook-no-print rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
                <h3 className="mb-4 font-bold text-slate-900">{editingEntryId ? "Edit daily entry" : "Add a daily entry"}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Date">
                    <Input type="date" value={dailyForm.date} onChange={(e) => setDailyForm({ ...dailyForm, date: e.target.value })} required />
                  </Field>
                  <Field label="Department / section">
                    <Input value={dailyForm.department} onChange={(e) => setDailyForm({ ...dailyForm, department: e.target.value })} placeholder="e.g. IT Support, Network Team" required />
                  </Field>
                  <Field label="Working hours">
                    <div className="flex items-center gap-2">
                      <Input type="time" aria-label="Start time" value={dailyForm.startTime} onChange={(e) => setDailyForm({ ...dailyForm, startTime: e.target.value })} />
                      <span className="text-slate-500">to</span>
                      <Input type="time" aria-label="End time" value={dailyForm.endTime} onChange={(e) => setDailyForm({ ...dailyForm, endTime: e.target.value })} />
                    </div>
                  </Field>
                  <Field label="Daily objectives (1-3 goals)" className="sm:col-span-2 lg:col-span-3">
                    <Textarea value={dailyForm.objectives} onChange={(e) => setDailyForm({ ...dailyForm, objectives: e.target.value })} placeholder="What specific goals did you plan for today?" required />
                  </Field>
                  <Field label="Tasks performed" className="sm:col-span-2 lg:col-span-3">
                    <Textarea value={dailyForm.tasks} onChange={(e) => setDailyForm({ ...dailyForm, tasks: e.target.value })} placeholder="Describe the work in detail. Start with action verbs such as configured, developed, tested, documented, or troubleshot." required />
                  </Field>
                  <Field label="Tools / technologies used">
                    <Textarea value={dailyForm.technologies} onChange={(e) => setDailyForm({ ...dailyForm, technologies: e.target.value })} placeholder="e.g. Windows, Python, Git, SQL, TCP/IP, Cisco Packet Tracer" />
                  </Field>
                  <Field label="Skills / knowledge gained">
                    <Textarea value={dailyForm.skills} onChange={(e) => setDailyForm({ ...dailyForm, skills: e.target.value })} placeholder="What did you learn or practise?" />
                  </Field>
                  <Field label="Challenge and resolution">
                    <Textarea value={dailyForm.challenge} onChange={(e) => setDailyForm({ ...dailyForm, challenge: e.target.value })} placeholder="Describe the problem, your response, and the outcome. Write “None” if applicable." />
                  </Field>
                  <Field label="Evidence / diagram reference" className="sm:col-span-2">
                    <Textarea value={dailyForm.evidence} onChange={(e) => setDailyForm({ ...dailyForm, evidence: e.target.value })} placeholder="Describe approved evidence attached or where it is filed. Never include confidential data." className="min-h-20" />
                  </Field>
                  <Field label="Supervisor's initials">
                    <Input value={dailyForm.supervisorInitials} onChange={(e) => setDailyForm({ ...dailyForm, supervisorInitials: e.target.value })} placeholder="Initials / leave blank for review" />
                  </Field>
                </div>
                <button type="submit" disabled={entrySyncState !== "server" || savingEntry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
                  <Save size={16} /> {savingEntry ? "Saving..." : editingEntryId ? "Update daily entry" : "Submit daily entry"}
                </button>
                {editingEntryId && (
                  <button type="button" className="ml-3 text-sm font-semibold text-slate-600 hover:underline" onClick={() => {
                    setEditingEntryId(null);
                    setDailyForm({
                      date: "",
                      department: "",
                      startTime: "",
                      endTime: "",
                      objectives: "",
                      tasks: "",
                      technologies: "",
                      skills: "",
                      challenge: "",
                      evidence: "",
                      supervisorInitials: "",
                    });
                  }}>
                    Cancel edit
                  </button>
                )}
              </form>

              <div className="mt-6 rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900">Example entry — use as a guide, not as your own record</h3>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="font-semibold">Date & day</dt><dd>15/10/2025 (Wednesday)</dd></div>
                  <div><dt className="font-semibold">Department</dt><dd>IT Support</dd></div>
                  <div className="sm:col-span-2"><dt className="font-semibold">Tasks performed</dt><dd>Assisted in troubleshooting network connectivity issues for the Finance department. Replaced a faulty Ethernet cable and reconfigured the IP address on a workstation. Updated antivirus definitions on 10 staff laptops.</dd></div>
                  <div><dt className="font-semibold">Tools used</dt><dd>Windows 10, Command Prompt (ipconfig, ping), Symantec Endpoint Protection.</dd></div>
                  <div><dt className="font-semibold">Skills gained</dt><dd>Applied network troubleshooting commands and learned to update antivirus software on multiple machines.</dd></div>
                  <div className="sm:col-span-2"><dt className="font-semibold">Challenge & resolution</dt><dd>The workstation initially had an APIPA address. After checking the cable, released and renewed the DHCP lease, then confirmed connectivity.</dd></div>
                </dl>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="font-bold text-slate-900">Saved daily entries ({data.dailyEntries.length})</h3>
                {data.dailyEntries.length === 0 && (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No entries yet. Add your first entry above at the end of your next working day.</p>
                )}
                {data.dailyEntries.map((entry) => (
                  <article key={entry.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900">{entry.date} ({entry.day})</h4>
                        <p className="text-sm text-slate-600">{entry.department} · {entry.startTime || "—"} to {entry.endTime || "—"}</p>
                      </div>
                      <div className="logbook-no-print flex gap-3 text-sm">
                        <span className={`font-semibold ${entry.status === "approved" ? "text-green-700" : entry.status === "rejected" ? "text-red-700" : "text-amber-700"}`}>
                          {entry.status || "Not synced"}
                        </span>
                        {entry.status === "pending" && (
                          <>
                            <button type="button" className="font-semibold text-blue-700 hover:underline" onClick={() => editDailyEntry(entry)}>Edit</button>
                            <button type="button" className="font-semibold text-red-700 hover:underline" onClick={() => removeDailyEntry(entry.id)}>Remove</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      {[
                        ["Daily objectives", entry.objectives],
                        ["Tasks performed", entry.tasks],
                        ["Tools / technologies", entry.technologies],
                        ["Skills / knowledge", entry.skills],
                        ["Challenge & resolution", entry.challenge],
                        ["Evidence reference", entry.evidence],
                      ].map(([label, value]) => value && (
                        <div key={label}><p className="font-semibold text-slate-700">{label}</p><p className="whitespace-pre-wrap text-slate-600">{value}</p></div>
                      ))}
                      <div><p className="font-semibold text-slate-700">Supervisor initials</p><p className="text-slate-600">{entry.supervisorInitials || "Pending weekly review"}</p></div>
                      {entry.comment && (
                        <div className="sm:col-span-2 rounded-lg bg-slate-50 p-3">
                          <p className="font-semibold text-slate-700">Supervisor comment</p>
                          <p className="whitespace-pre-wrap text-slate-600">{entry.comment}</p>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </Section>
          </div>

          <div className="logbook-section">
            <Section
              id="weekly"
              number="4"
              title="Weekly summary report"
              description="Complete at the end of each week, then present this record and your daily entries to your industry supervisor."
              icon={ClipboardCheck}
            >
              <form onSubmit={addWeeklySummary} className="logbook-no-print rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
                {weeklySyncState === "loading" && <p className="mb-3 text-sm text-slate-600">Loading weekly summaries…</p>}
                {weeklyError && <p role="alert" className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{weeklyError}</p>}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Week number">
                    <Input type="number" min="1" value={weeklyForm.week} onChange={(e) => setWeeklyForm({ ...weeklyForm, week: e.target.value })} placeholder="e.g. 1" required />
                  </Field>
                  <Field label="Week start date">
                    <Input type="date" value={weeklyForm.startDate} onChange={(e) => setWeeklyForm({ ...weeklyForm, startDate: e.target.value })} required />
                  </Field>
                  <Field label="Week end date">
                    <Input type="date" value={weeklyForm.endDate} onChange={(e) => setWeeklyForm({ ...weeklyForm, endDate: e.target.value })} required />
                  </Field>
                  <Field label="Summary of key activities" className="sm:col-span-3">
                    <Textarea value={weeklyForm.activities} onChange={(e) => setWeeklyForm({ ...weeklyForm, activities: e.target.value })} placeholder="Summarize the main tasks, responsibilities, and projects from this week's daily entries." required />
                  </Field>
                  <Field label="Key skills acquired this week" className="sm:col-span-3">
                    <Textarea value={weeklyForm.skills} onChange={(e) => setWeeklyForm({ ...weeklyForm, skills: e.target.value })} placeholder="List the most important technical and professional skills." />
                  </Field>
                  <Field label="Major challenges and how addressed" className="sm:col-span-3">
                    <Textarea value={weeklyForm.challenges} onChange={(e) => setWeeklyForm({ ...weeklyForm, challenges: e.target.value })} placeholder="Summarize significant issues, your response, and the outcome." />
                  </Field>
                  <Field label="Supervisor's comments" className="sm:col-span-3">
                    <Textarea value={weeklyForm.supervisorComments} onChange={(e) => setWeeklyForm({ ...weeklyForm, supervisorComments: e.target.value })} placeholder="For industry supervisor to complete." />
                  </Field>
                  <Field label="Supervisor's name">
                    <Input value={weeklyForm.supervisorName} onChange={(e) => setWeeklyForm({ ...weeklyForm, supervisorName: e.target.value })} />
                  </Field>
                  <Field label="Supervisor's signature / initials">
                    <Input value={weeklyForm.supervisorSignature} onChange={(e) => setWeeklyForm({ ...weeklyForm, supervisorSignature: e.target.value })} placeholder="Sign printed copy if required" />
                  </Field>
                </div>
                <button type="submit" disabled={savingWeekly || weeklySyncState !== "server"} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
                  <Save size={16} /> {savingWeekly ? "Submitting…" : "Submit weekly summary"}
                </button>
              </form>
              <div className="mt-5 space-y-4">
                {data.weeklySummaries.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Your weekly summaries will appear here.</p>}
                {data.weeklySummaries.map((summary) => (
                  <article key={summary.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex justify-between gap-2">
                      <h3 className="font-bold text-slate-900">Week {summary.week}: {summary.startDate} – {summary.endDate}</h3>
                      <div className="flex items-start gap-3">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold capitalize text-blue-800">{summary.status}</span>
                        <button
                          type="button"
                          className="logbook-no-print text-sm font-semibold text-blue-700 hover:underline"
                          onClick={() => {
                            setWeeklyForm({
                              week: String(summary.week),
                              startDate: summary.startDate || "",
                              endDate: summary.endDate || "",
                              activities: summary.activities || "",
                              skills: summary.skills || "",
                              challenges: summary.challenges || "",
                              supervisorComments: summary.supervisorComments || "",
                              supervisorName: summary.supervisorName || "",
                              supervisorSignature: summary.supervisorSignature || "",
                            });
                            setActiveSection("weekly");
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                      <div><dt className="font-semibold">Key activities</dt><dd className="whitespace-pre-wrap">{summary.activities}</dd></div>
                      <div><dt className="font-semibold">Skills acquired</dt><dd className="whitespace-pre-wrap">{summary.skills || "—"}</dd></div>
                      <div><dt className="font-semibold">Challenges</dt><dd className="whitespace-pre-wrap">{summary.challenges || "—"}</dd></div>
                      <div><dt className="font-semibold">Supervisor's comments</dt><dd className="whitespace-pre-wrap">{summary.supervisorComments || "Pending supervisor review"}</dd></div>
                    </dl>
                    <p className="mt-3 text-sm text-slate-600">Supervisor: {summary.supervisorName || "—"} · Signature: {summary.supervisorSignature || "Pending"}</p>
                  </article>
                ))}
              </div>
            </Section>
          </div>

          <div className="logbook-section">
            <Section
              id="skills"
              number="5"
              title="IT-specific activity & skill checklist"
              description="Tick only activities you have personally performed or observed. This checklist supports reflection; it is not a substitute for daily evidence."
              icon={CheckCircle2}
            >
              <div className="space-y-5">
                {domains.map((domain) => (
                  <fieldset key={domain.name} className="rounded-xl border border-slate-200 p-4">
                    <legend className="px-2 font-bold text-slate-900">{domain.name}</legend>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {domain.items.map((item) => (
                        <label key={item} className="flex items-start gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={Boolean(data.exposure[item])}
                            onChange={(event) => updateNested("exposure", item, event.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </Section>
          </div>

          <div className="logbook-section">
            <Section
              id="transfer"
              number="6"
              title="Change of attachment station"
              description="A student is expected to complete the attachment at one establishment. Do not transfer before written university approval is received."
              icon={ShieldCheck}
            >
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
                Any change of attachment station requires prior written approval from the university. Submit a formal
                request with the reason and proposed placement, and wait for approval before moving. Keep the written
                approval and reference details with your records. Follow your university's official transfer procedure.
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Current host station">
                  <Input value={data.transfer.currentStation} onChange={(e) => updateNested("transfer", "currentStation", e.target.value)} />
                </Field>
                <Field label="Proposed new station">
                  <Input value={data.transfer.proposedStation} onChange={(e) => updateNested("transfer", "proposedStation", e.target.value)} />
                </Field>
                <Field label="Reason for requested change" className="sm:col-span-2">
                  <Textarea value={data.transfer.reason} onChange={(e) => updateNested("transfer", "reason", e.target.value)} />
                </Field>
                <Field label="Date request submitted">
                  <Input type="date" value={data.transfer.requestDate} onChange={(e) => updateNested("transfer", "requestDate", e.target.value)} />
                </Field>
                <Field label="Date written approval received (before transfer)">
                  <Input type="date" value={data.transfer.approvalDate} onChange={(e) => updateNested("transfer", "approvalDate", e.target.value)} />
                </Field>
                <Field label="University approval / reference number" className="sm:col-span-2">
                  <Input value={data.transfer.approvalReference} onChange={(e) => updateNested("transfer", "approvalReference", e.target.value)} />
                </Field>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-700">University approval evidence attached: ☐ Yes &nbsp; ☐ Not applicable</p>
            </Section>
          </div>

          <div className="logbook-section">
            <Section
              id="visits"
              number="7"
              title="University supervisor's visit"
              description="Record each university supervisor site visit and have the supervisor complete and sign the comments."
              icon={UserRound}
            >
              <form onSubmit={addVisit} className="logbook-no-print rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date of visit">
                    <Input type="date" value={visitForm.date} onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })} required />
                  </Field>
                  <Field label="University supervisor's name">
                    <Input value={visitForm.supervisorName} onChange={(e) => setVisitForm({ ...visitForm, supervisorName: e.target.value })} required />
                  </Field>
                  <Field label="Comments on student's progress" className="sm:col-span-2">
                    <Textarea value={visitForm.comments} onChange={(e) => setVisitForm({ ...visitForm, comments: e.target.value })} placeholder="For the university supervisor to complete." required />
                  </Field>
                  <Field label="Supervisor's signature">
                    <Input value={visitForm.signature} onChange={(e) => setVisitForm({ ...visitForm, signature: e.target.value })} placeholder="Sign printed copy if required" />
                  </Field>
                </div>
                <button type="submit" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
                  <Save size={16} /> Add visit record
                </button>
              </form>
              <div className="mt-4 space-y-3">
                {data.visits.map((visit) => (
                  <article key={visit.id} className="rounded-lg border border-slate-200 p-4 text-sm">
                    <div className="flex justify-between gap-2">
                      <h3 className="font-bold">{visit.date} · {visit.supervisorName}</h3>
                      <button type="button" className="logbook-no-print text-red-700" onClick={() => updateData("visits", data.visits.filter((item) => item.id !== visit.id))}>Remove</button>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap">{visit.comments}</p>
                    <p className="mt-2 text-slate-600">Signature: {visit.signature || "Pending"}</p>
                  </article>
                ))}
              </div>
            </Section>
          </div>

          <div className="logbook-section">
            <Section
              id="report"
              number="8"
              title="Guide to the final attachment report"
              description="Use this logbook as a primary source of accurate dates, tasks, tools, outcomes, skills, and challenges."
              icon={FileText}
            >
              <div className="mb-4 rounded-xl bg-indigo-50 p-4 text-sm leading-6 text-indigo-950">
                Do not copy the logbook into the report as a raw day-by-day list. Organize related work by week, project,
                department, or IT function. Use specific examples from your own records to explain what you did, how you
                did it, which tools you used, what changed as a result, and what you learned. Follow your department's
                formatting, citation, confidentiality, and length requirements.
              </div>
              <div className="space-y-3">
                {reportSections.map((item) => (
                  <div key={item.title} className="rounded-lg border border-slate-200 p-4">
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-700">
                Writing check: Can each major report claim be traced to a real activity or approved evidence in your logbook?
              </p>
            </Section>
          </div>

          <div className="logbook-section">
            <Section
              id="assessment"
              number="9"
              title="Industry assessment & final submission"
              description="Arrange for the industry supervisor to complete the assessment before the attachment ends."
              icon={ClipboardCheck}
            >
              <h3 className="mb-3 font-bold text-slate-900">Industry supervisor's final assessment</h3>
              <p className="mb-4 text-sm text-slate-600">Select one rating for each criterion. Confirm the scale used with your department if it differs.</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-3">Assessment criterion</th>
                      {["Excellent", "Good", "Satisfactory", "Needs Improvement"].map((rating) => (
                        <th key={rating} className="p-3 text-center">{rating}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assessmentCriteria.map((criterion) => (
                      <tr key={criterion} className="border-t border-slate-200">
                        <th className="p-3 font-medium">{criterion}</th>
                        {["Excellent", "Good", "Satisfactory", "Needs Improvement"].map((rating) => (
                          <td key={rating} className="p-3 text-center">
                            <input
                              type="radio"
                              name={`assessment-${criterion}`}
                              value={rating}
                              checked={data.assessment.ratings[criterion] === rating}
                              onChange={() => updateNested("assessment", "ratings", { ...data.assessment.ratings, [criterion]: rating })}
                              aria-label={`${criterion}: ${rating}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Supervisor's overall comments" className="sm:col-span-2">
                  <Textarea value={data.assessment.comments} onChange={(e) => updateNested("assessment", "comments", e.target.value)} placeholder="For industry supervisor to complete." />
                </Field>
                <Field label="Industry supervisor's name">
                  <Input value={data.assessment.supervisorName} onChange={(e) => updateNested("assessment", "supervisorName", e.target.value)} />
                </Field>
                <Field label="Supervisor's signature">
                  <Input value={data.assessment.supervisorSignature} onChange={(e) => updateNested("assessment", "supervisorSignature", e.target.value)} placeholder="Sign printed copy if required" />
                </Field>
                <Field label="Assessment date">
                  <Input type="date" value={data.assessment.assessmentDate} onChange={(e) => updateNested("assessment", "assessmentDate", e.target.value)} />
                </Field>
              </div>
              <div className="mt-7 border-t border-slate-200 pt-5">
                <h3 className="mb-3 font-bold text-slate-900">Final submission checklist</h3>
                <div className="space-y-2">
                  {finalItems.map((item) => (
                    <label key={item} className="flex items-start gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(data.finalChecklist[item])}
                        onChange={(event) => setChecklistItem(item, event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Departmental coordinator / recipient">
                    <Input value={data.coordinatorName} onChange={(e) => updateData("coordinatorName", e.target.value)} />
                  </Field>
                  <Field label="Submission date">
                    <Input type="date" value={data.submissionDate} onChange={(e) => updateData("submissionDate", e.target.value)} />
                  </Field>
                </div>
              </div>
            </Section>
          </div>

          <footer className="pb-8 text-center text-xs leading-5 text-slate-500">
            Review your department's official requirements before submission. Keep a backup of the browser-saved sections
            and retain signed hard-copy pages where required.
          </footer>
        </div>
      </div>
    </main>
  );
};

export default StudentLogBook;
