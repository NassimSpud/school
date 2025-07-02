import React, { useState, useEffect } from 'react';
import { fetchStudentAttendance } from '../../../utils/api';

const StudentAttendance = ({ classId }) => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const data = await fetchStudentAttendance(classId);
                setAttendanceData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (classId) {
            fetchAttendance();
        }
    }, [classId]);

    if (loading) {
        return <div>Loading attendance data...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="attendance-container">
            <h2>Student Attendance</h2>
            <div className="attendance-table">
                <table>
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Class</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendanceData.map((student) => (
                            <tr key={student.id}>
                                <td>{student.name}</td>
                                <td>{student.class}</td>
                                <td>{student.present}</td>
                                <td>{student.absent}</td>
                                <td>{student.percentage}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentAttendance;