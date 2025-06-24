import React, { useState } from "react";
import {
  Calendar,
  BookOpen,
  CheckCircle,
  User,
  Clipboard,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const StudentLogBook = () => {
  const [activeTab, setActiveTab] = useState("daily");
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    tasks: "",
    skills: "",
    challenges: "",
    hours: 8,
  });

  // Sample log entries
  const [logEntries, setLogEntries] = useState([
    {
      id: 1,
      date: "2023-06-01",
      tasks:
        "Orientation and company tour. Introduced to team members and assigned mentor.",
      skills: "Professional communication, workplace orientation",
      challenges: "Remembering all team names and roles",
      hours: 6,
      supervisorComment:
        "Good first day engagement. Ask more questions when unsure.",
    },
    {
      id: 2,
      date: "2023-06-02",
      tasks:
        "Shadowed senior developer on project X. Reviewed code documentation standards.",
      skills: "Code documentation, observation skills",
      challenges: "Understanding some technical jargon",
      hours: 7,
      supervisorComment:
        "Shows good attention to detail. Keep practicing documentation.",
    },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      id: logEntries.length + 1,
      ...formData,
      supervisorComment: "",
    };
    setLogEntries([...logEntries, newEntry]);
    setFormData({
      date: "",
      tasks: "",
      skills: "",
      challenges: "",
      hours: 8,
    });
  };

  const toggleExpand = (id) => {
    setExpandedEntry(expandedEntry === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold flex items-center text-blue-800">
          <BookOpen className="mr-2" /> Industrial Attachment Log Book
        </h1>
        <div className="flex items-center mt-2 text-sm text-gray-600">
          <User className="mr-1" size={14} />
          <span>Student Name: John Doe</span>
          <span className="mx-2">|</span>
          <Clipboard className="mr-1" size={14} />
          <span>Organization: Tech Solutions Inc.</span>
          <span className="mx-2">|</span>
          <Calendar className="mr-1" size={14} />
          <span>Duration: June 1 - August 30, 2023</span>
        </div>
      </header>

      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "daily"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("daily")}
        >
          Daily Logs
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "skills"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("skills")}
        >
          Skills Gained
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "summary"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("summary")}
        >
          Weekly Summary
        </button>
      </div>

      {activeTab === "daily" && (
        <div>
          <form
            onSubmit={handleSubmit}
            className="bg-white p-4 rounded-lg shadow-md mb-6"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Clipboard className="mr-2" size={18} /> Add New Entry
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="inline mr-1" size={14} /> Hours Worked
                </label>
                <input
                  type="number"
                  name="hours"
                  min="1"
                  max="12"
                  value={formData.hours}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tasks Performed
              </label>
              <textarea
                name="tasks"
                value={formData.tasks}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md h-20"
                placeholder="Describe your daily tasks and activities..."
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills Learned/Applied
                </label>
                <textarea
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md h-20"
                  placeholder="List any new skills or knowledge gained..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Challenges Faced
                </label>
                <textarea
                  name="challenges"
                  value={formData.challenges}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md h-20"
                  placeholder="Describe any difficulties encountered..."
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Add Entry
            </button>
          </form>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="mr-2" size={18} /> Log Entries
            </h2>
            {logEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleExpand(entry.id)}
                >
                  <div>
                    <span className="font-medium">{entry.date}</span>
                    <span className="ml-3 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {entry.hours} hours
                    </span>
                  </div>
                  {expandedEntry === entry.id ? <ChevronUp /> : <ChevronDown />}
                </div>
                {expandedEntry === entry.id && (
                  <div className="p-4 border-t">
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Tasks Performed:
                      </h4>
                      <p className="text-gray-800">{entry.tasks}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Skills Learned/Applied:
                        </h4>
                        <p className="text-gray-800">{entry.skills}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Challenges Faced:
                        </h4>
                        <p className="text-gray-800">{entry.challenges}</p>
                      </div>
                    </div>
                    {entry.supervisorComment && (
                      <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                        <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <User className="mr-1" size={14} /> Supervisor's
                          Comment:
                        </h4>
                        <p className="text-gray-800 italic">
                          {entry.supervisorComment}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "skills" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle className="mr-2" size={18} /> Skills Gained During
            Attachment
          </h2>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-blue-800">Technical Skills</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>React.js component development</li>
                <li>API integration techniques</li>
                <li>Database management basics</li>
                <li>Version control with Git</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-blue-800">Professional Skills</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Team collaboration and communication</li>
                <li>Time management in project work</li>
                <li>Professional email etiquette</li>
                <li>Meeting participation and note-taking</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-blue-800">
                Personal Development
              </h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Increased confidence in technical discussions</li>
                <li>Improved problem-solving approach</li>
                <li>Better understanding of workplace dynamics</li>
                <li>Enhanced ability to receive and implement feedback</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === "summary" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Clipboard className="mr-2" size={18} /> Weekly Summaries
          </h2>
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="font-medium">Week 1: June 1-7, 2023</h3>
              <p className="text-gray-700 mt-2">
                This first week was primarily about orientation and
                understanding the company structure. I was introduced to the
                development team and assigned a mentor. Learned about the
                company's coding standards and began familiarizing myself with
                their codebase. The main challenge was adapting to the
                fast-paced environment and remembering all the new information.
              </p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-medium">Week 2: June 8-14, 2023</h3>
              <p className="text-gray-700 mt-2">
                Started working on small bug fixes under supervision. Attended
                my first sprint planning meeting which was very insightful.
                Began understanding the workflow from design to deployment. My
                mentor has been very helpful in explaining concepts I don't
                understand. I'm starting to feel more comfortable asking
                questions when I'm unsure about something.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Week 3: June 15-21, 2023</h3>
              <p className="text-gray-700 mt-2">
                Was assigned my first small feature to implement. Learned about
                the testing process and how to write unit tests. Had the
                opportunity to pair program with a senior developer which was
                extremely valuable. I'm beginning to see how all the pieces fit
                together in a real-world application.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLogBook;
