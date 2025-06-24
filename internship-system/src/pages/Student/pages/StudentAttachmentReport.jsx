import React, { useState } from 'react';

const StudentAttachmentReport = () => {
    const [report, setReport] = useState({
        week: '',
        progress: '',
        challenges: '',
        lessonsLearned: '',
        supervisorFeedback: '',
        rating: 0
    });

    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setReport(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRatingChange = (value) => {
        setReport(prev => ({
            ...prev,
            rating: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would typically send the data to your backend
        console.log('Report submitted:', report);
        setSubmitted(true);
        // Reset form after 3 seconds
        setTimeout(() => {
            setSubmitted(false);
            setReport({
                week: '',
                progress: '',
                challenges: '',
                lessonsLearned: '',
                supervisorFeedback: '',
                rating: 0
            });
        }, 3000);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-2xl font-bold text-center mb-6">Attachment Progress Report</h1>
            
            {submitted && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    Report submitted successfully!
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="progress">
                        Progress Made
                    </label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                        id="progress"
                        name="progress"
                        placeholder="Describe what you've accomplished during this period..."
                        value={report.progress}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="challenges">
                        Challenges Faced
                    </label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                        id="challenges"
                        name="challenges"
                        placeholder="Describe any challenges you encountered..."
                        value={report.challenges}
                        onChange={handleChange}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lessonsLearned">
                        Lessons Learned
                    </label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                        id="lessonsLearned"
                        name="lessonsLearned"
                        placeholder="What did you learn from this period?"
                        value={report.lessonsLearned}
                        onChange={handleChange}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="supervisorFeedback">
                        Supervisor's Feedback (if any)
                    </label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                        id="supervisorFeedback"
                        name="supervisorFeedback"
                        placeholder="Any feedback from your supervisor?"
                        value={report.supervisorFeedback}
                        onChange={handleChange}
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Overall Experience Rating
                    </label>
                    <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`text-2xl ${star <= report.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                onClick={() => handleRatingChange(star)}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        type="submit"
                    >
                        Submit Report
                    </button>
                </div>
            </form>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <p className="text-blue-700">
                    <strong>Note:</strong> Please submit your weekly/monthly attachment progress reports regularly. 
                    This helps us track your experience and provide support where needed.
                </p>
            </div>
        </div>
    );
};

export default StudentAttachmentReport;