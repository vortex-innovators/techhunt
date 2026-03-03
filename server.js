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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/techhuntdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Student Schema
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    studentClass: { type: String, required: true },
    year: { type: String, required: true },
    progress: {
        type: Map,
        of: Date,
        default: {}
    },
    lastUpdated: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// Routes
// 1. Register a student
app.post('/api/register', async (req, res) => {
    try {
        const { name, studentClass, year } = req.body;

        // Check if student already exists
        let student = await Student.findOne({ name });
        if (student) {
            return res.status(400).json({ message: 'Student already registered with this name.' });
        }

        student = new Student({ name, studentClass, year });
        await student.save();

        res.status(201).json({ message: 'Registration successful', student });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
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

        // Update level progress if not already recorded
        if (!student.progress.has(levelName)) {
            student.progress.set(levelName, new Date());
            student.lastUpdated = new Date();
            await student.save();
        }

        res.status(200).json({ message: `Progress recorded for ${levelName}`, student });
    } catch (error) {
        console.error('Tracking error:', error);
        res.status(500).json({ message: 'Server error during tracking' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
