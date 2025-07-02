import Attendance from '../models/attendanceModel.js';
import User from '../models/userModel.js';

// Get attendance for a class
export const getAttendance = async (req, res) => {
    try {
        const { classId } = req.params;
        
        // Get all students in the class
        const students = await User.find({ class: classId, role: 'student' });
        
        // Get attendance records for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const attendanceRecords = await Attendance.find({
            date: today,
            studentId: { $in: students.map(student => student._id) }
        });

        // Map attendance data to include student info
        const attendanceData = students.map(student => {
            const record = attendanceRecords.find(record => record.studentId.toString() === student._id.toString());
            return {
                id: student._id,
                name: student.name,
                rollNumber: student.rollNumber,
                class: student.class,
                status: record ? record.status : 'absent'
            };
        });

        res.json(attendanceData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update attendance record
export const updateAttendance = async (req, res) => {
    try {
        const { studentId, date, status } = req.body;

        // Check if attendance record exists
        let attendance = await Attendance.findOne({ studentId, date });

        if (!attendance) {
            // Create new attendance record
            attendance = new Attendance({
                studentId,
                date: new Date(date),
                status,
                teacherId: req.user._id
            });
            await attendance.save();
        } else {
            // Update existing record
            attendance.status = status;
            await attendance.save();
        }

        res.json({ message: 'Attendance updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
