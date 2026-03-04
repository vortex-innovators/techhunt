// Main migration server - Force redeploy fix
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/techhuntdb')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Student Schema
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    studentClass: { type: String, required: true },
    year: { type: String, required: true },
    progress: {
        type: Map,
        of: {
            timestamp: { type: String, required: true }, // Stored as IST string
            duration_seconds: { type: Number, default: 0 }
        },
        default: {}
    },
    lastUpdated: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// Helper for IST time
function getISTDate() {
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(new Date()).replace(/(\d+)\/(\d+)\/(\d+),?\s*/, '$3-$2-$1 ');
}

// Routes
// 1. Register a student
app.post('/api/register', async (req, res) => {
    try {
        const { name, studentClass, year } = req.body;

        if (!name || !studentClass || !year) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        let student = await Student.findOne({ name });
        if (student) {
            return res.status(400).json({ message: 'Student already registered.' });
        }

        student = new Student({ name, studentClass, year });
        await student.save();

        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. Track progress
app.post('/api/track', async (req, res) => {
    try {
        const { name, levelName } = req.body;

        const student = await Student.findOne({ name });
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        if (!student.progress.has(levelName)) {
            const currentTime = getISTDate();
            let duration = 0;

            const progressMap = Array.from(student.progress.entries());
            if (progressMap.length > 0) {
                const lastEntryIdx = progressMap.length - 1;
                const lastEntryData = progressMap[lastEntryIdx][1];

                // Parse the IST date string for duration calculation
                // Format: YYYY-MM-DD HH:mm:ss
                const lastTimestamp = lastEntryData.timestamp;
                const lastTime = new Date(lastTimestamp.replace(' ', 'T') + '+05:30');
                const currTime = new Date();
                duration = Math.floor((currTime - lastTime) / 1000);
            }

            student.progress.set(levelName, {
                timestamp: currentTime,
                duration_seconds: duration
            });
            student.lastUpdated = new Date();
            await student.save();
        }

        res.status(200).json({ message: `Progress recorded` });
    } catch (error) {
        console.error('Tracking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. Get Stats (Admin)
app.post('/api/stats', async (req, res) => {
    try {
        const { password } = req.body;
        if (password !== 'heydendaniabd') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const students = await Student.find({}).sort({ lastUpdated: -1 });
        // Format for the frontend dashboard
        const formatted = students.map(s => ({
            name: s.name,
            studentclass: s.studentClass,
            year: s.year,
            progress: JSON.stringify(Object.fromEntries(s.progress)),
            last_updated: s.lastUpdated.toISOString()
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
