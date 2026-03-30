const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'faculty_db';

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, './'), {
    etag: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== MONGOOSE SCHEMAS ====================

const profileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  facultyId: { type: String, sparse: true, unique: true },
  name: String,
  dept: String,
  desig: String,
  role: String,
  password: String,
  phone: String,
  timetable: mongoose.Schema.Types.Mixed,
  photo: String,
  subjectHandling: String,
  classHandling: String
}, { collection: 'profiles', timestamps: true });

const curriculumSchema = new mongoose.Schema({
  _id: String,
  subjects: mongoose.Schema.Types.Mixed
}, { collection: 'curriculum' });

const notificationSchema = new mongoose.Schema({
  id: Number,
  from: String,
  to: String,
  message: String,
  timestamp: Date,
  read: Boolean
}, { collection: 'notifications', timestamps: true });

const sectionSchema = new mongoose.Schema({
  _id: String,
  sections: [String]
}, { collection: 'sections' });

const Profile = mongoose.model('Profile', profileSchema);
const Curriculum = mongoose.model('Curriculum', curriculumSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Section = mongoose.model('Section', sectionSchema);


// ==================== DEFAULT DATA ====================

const DEFAULT_CURRICULUM = {
    '1-ECE': [
        { name: "Engineering Mathematics II", type: "normal" },
        { name: "Engineering Mathematics II Lab", type: "batch" },
        { name: "Engineering Physics", type: "normal" },
        { name: "Engineering Physics Lab", type: "batch" },
        { name: "Data Structure", type: "normal" },
        { name: "Data Structure Project", type: "normal" },
        { name: "Career Skill Development I", type: "normal" },
        { name: "Counselling", type: "normal" }
    ],
    '1-VLSI': [
        { name: "Engineering Mathematics II", type: "normal" },
        { name: "Engineering Mathematics II Lab", type: "batch" },
        { name: "Engineering Physics", type: "normal" },
        { name: "Engineering Physics Lab", type: "batch" },
        { name: "Data Structure", type: "normal" },
        { name: "Data Structure Project", type: "normal" },
        { name: "Career Skill Development I", type: "normal" },
        { name: "Counselling", type: "normal" }
    ],
    '2-ECE': [
        { name: "Analog and Digital Communication", type: "normal" },
        { name: "Transmission Lines & Waveguide", type: "normal" },
        { name: "Microcontrollers & Interfacing", type: "normal" },
        { name: "Digital Signal Processing", type: "normal" },
        { name: "Integrated Optoelectronic Devices", type: "normal" },
        { name: "Machine Learning", type: "normal" },
        { name: "Artificial Intelligence", type: "normal" },
        { name: "IoT in Robotics", type: "normal" },
        { name: "Privacy & Security in IoT", type: "normal" },
        { name: "Analog and Digital Communication Lab", type: "batch" },
        { name: "Business Communication", type: "normal" },
        { name: "Career Skill Development III", type: "normal" },
        { name: "Library", type: "normal" },
        { name: "Counselling", type: "normal" }
    ],
    '2-VLSI': [
        { name: "Analog and Digital Communication", type: "normal" },
        { name: "Transmission Lines & Waveguide", type: "normal" },
        { name: "Microcontrollers & Interfacing", type: "normal" },
        { name: "Digital Signal Processing", type: "normal" },
        { name: "Integrated Optoelectronic Devices", type: "normal" },
        { name: "Machine Learning", type: "normal" },
        { name: "Artificial Intelligence", type: "normal" },
        { name: "IoT in Robotics", type: "normal" },
        { name: "Privacy & Security in IoT", type: "normal" },
        { name: "Analog and Digital Communication Lab", type: "batch" },
        { name: "Business Communication", type: "normal" },
        { name: "Career Skill Development III", type: "normal" },
        { name: "Library", type: "normal" },
        { name: "Counselling", type: "normal" }
    ],
    '3-ECE': [
        { name: "Wireless Communication", type: "normal" },
        { name: "Antenna & Millimetrewave Communication", type: "normal" },
        { name: "Microwave & Optical Communication", type: "normal" },
        { name: "Renewable Energy Source", type: "normal" },
        { name: "Comprehension", type: "batch" },
        { name: "Design Project", type: "batch" },
        { name: "Microwave & Optical Communication Lab", type: "batch" },
        { name: "Electromagnetic Interference & Compatibility", type: "elective" },
        { name: "SoC & NoC Design", type: "elective" },
        { name: "MEMS", type: "elective" },
        { name: "ASIC Design", type: "elective" },
        { name: "Advanced PCB Design and Testing", type: "elective" },
        { name: "Sensor Technology", type: "elective" },
        { name: "Library", type: "normal" },
        { name: "Counselling", type: "normal" }
    ],
    '3-VLSI': [
        { name: "Wireless Communication", type: "normal" },
        { name: "Antenna & Millimetrewave Communication", type: "normal" },
        { name: "Microwave & Optical Communication", type: "normal" },
        { name: "Renewable Energy Source", type: "normal" },
        { name: "Comprehension", type: "batch" },
        { name: "Design Project", type: "batch" },
        { name: "Microwave & Optical Communication Lab", type: "batch" },
        { name: "Electromagnetic Interference & Compatibility", type: "elective" },
        { name: "SoC & NoC Design", type: "elective" },
        { name: "MEMS", type: "elective" },
        { name: "ASIC Design", type: "elective" },
        { name: "Advanced PCB Design and Testing", type: "elective" },
        { name: "Sensor Technology", type: "elective" },
        { name: "Library", type: "normal" },
        { name: "Counselling", type: "normal" }
    ],
    '4-ECE': [
        { name: "VLSI Design", type: "normal" },
        { name: "Wireless Communication", type: "normal" },
        { name: "Embedded Systems", type: "normal" },
        { name: "Machine Learning", type: "normal" }
    ],
    '4-VLSI': [
        { name: "VLSI Design", type: "normal" },
        { name: "Wireless Communication", type: "normal" },
        { name: "Embedded Systems", type: "normal" },
        { name: "Machine Learning", type: "normal" }
    ]
};

// Default Sections
const DEFAULT_SECTIONS = {
    '1': ['ECE-A', 'ECE-B', 'ECE-C', 'ECE-D', 'ECE-E', 'VLSI'],
    '2': ['ECE-A', 'ECE-B', 'ECE-C', 'ECE-D', 'VLSI'],
    '3': ['ECE-A', 'ECE-B', 'ECE-C', 'ECE-D'],
    '4': ['ECE-A', 'ECE-B', 'ECE-C', 'ECE-D']
};

// ==================== UTILITY FUNCTIONS ====================

async function hashPassword(password) {
    if (!password) return '';
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function initDB() {
    try {
        console.log('🔍 Initializing default data...');
        
        // Initialize Curriculum if empty
        const curriculumCount = await Curriculum.countDocuments({});
        if (curriculumCount === 0) {
            console.log('📚 Creating default curriculum...');
            for (const [key, subjects] of Object.entries(DEFAULT_CURRICULUM)) {
                await Curriculum.findByIdAndUpdate(
                    key,
                    { _id: key, subjects },
                    { upsert: true }
                );
            }
        }

        // Initialize Sections if empty
        const sectionCount = await Section.countDocuments({});
        if (sectionCount === 0) {
            console.log('🏫 Creating default sections...');
            for (const [key, sections] of Object.entries(DEFAULT_SECTIONS)) {
                await Section.findByIdAndUpdate(
                    key,
                    { _id: key, sections },
                    { upsert: true }
                );
            }
        }

        console.log('✅ Database initialized');
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
    }
}


// ==================== API ENDPOINTS ====================

// Get all profiles
app.get('/api/profiles', async (req, res) => {
    try {
        const profiles = await Profile.find({});
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single profile
app.get('/api/profiles/:id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ id: req.params.id });
        if (profile) {
            res.json(profile);
        } else {
            res.status(404).json({ error: 'Profile not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create or update profile
app.post('/api/profiles', async (req, res) => {
    try {
        const data = req.body;
        const id = data.id;

        if (!id) {
            return res.status(400).json({ error: 'Profile ID is required' });
        }

        // Hash password if it's new or changed
        if (data.password && data.password.length < 60) {
            data.password = await hashPassword(data.password);
        }

        const profile = await Profile.findOneAndUpdate(
            { id },
            data,
            { upsert: true, new: true }
        );

        res.json({ success: true, profile });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete profile
app.delete('/api/profiles/:id', async (req, res) => {
    try {
        await Profile.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login validation
app.post('/api/login', async (req, res) => {
    try {
        let { id, password } = req.body;
        id = id ? id.trim() : '';

        // Try to find by mailid first, then by facultyId if facultyId is set
        let profile = await Profile.findOne({ id });
        
        if (!profile) {
            // If not found by mailid, try facultyId
            profile = await Profile.findOne({ facultyId: id });
        }

        if (!profile) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check password based on user role
        let isPasswordValid = false;
        if (profile.role === 'admin') {
            // Admin password must be "admin123"
            isPasswordValid = password === 'admin123';
        } else {
            // All other users password must be "12345678"
            isPasswordValid = password === '12345678';
        }

        if (isPasswordValid) {
            res.json({ success: true, profile: profile.toObject() });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Change password
app.post('/api/change-password', async (req, res) => {
    try {
        const { id, oldPassword, newPassword } = req.body;

        if (!id || !oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const profile = await Profile.findOne({ id });
        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify old password against fixed or stored password
        let isOldPasswordValid = false;
        if (profile.role === 'admin') {
            isOldPasswordValid = oldPassword === 'admin123';
        } else {
            isOldPasswordValid = oldPassword === '12345678';
        }

        // Also check if user has a custom password already set
        if (!isOldPasswordValid) {
            const hashedOld = await hashPassword(oldPassword);
            if (hashedOld === profile.password) {
                isOldPasswordValid = true;
            }
        }

        if (!isOldPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash and save new password
        const newHash = await hashPassword(newPassword);
        await Profile.findOneAndUpdate({ id }, { password: newHash });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Set or update faculty ID
app.post('/api/set-faculty-id', async (req, res) => {
    try {
        const { mailId, facultyId } = req.body;

        if (!mailId || !facultyId) {
            return res.status(400).json({ error: 'Mail ID and Faculty ID are required' });
        }

        // Check if faculty ID is already in use by another user
        const existing = await Profile.findOne({ facultyId, id: { $ne: mailId } });
        if (existing) {
            return res.status(400).json({ error: 'Faculty ID is already in use' });
        }

        // Update the profile with faculty ID
        const profile = await Profile.findOneAndUpdate(
            { id: mailId },
            { facultyId },
            { new: true }
        );

        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, message: 'Faculty ID set successfully', profile: profile.toObject() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ==================== NOTIFICATIONS ====================

app.get('/api/notifications', async (req, res) => {
    try {
        const notifs = await Notification.find({}).sort({ timestamp: -1 });
        res.json(notifs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/notifications/:userId', async (req, res) => {
    try {
        const notifs = await Notification.find({ to: req.params.userId }).sort({ timestamp: -1 });
        res.json(notifs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/notifications', async (req, res) => {
    try {
        const notif = new Notification({
            id: Date.now(),
            ...req.body,
            timestamp: new Date(),
            read: false
        });
        await notif.save();
        res.json(notif);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== CURRICULUM ====================

app.get('/api/curriculum', async (req, res) => {
    try {
        const curriculums = await Curriculum.find({});
        const result = {};
        for (const cur of curriculums) {
            result[cur._id] = cur.subjects;
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/curriculum', async (req, res) => {
    try {
        const data = req.body;
        for (const [key, subjects] of Object.entries(data)) {
            await Curriculum.findByIdAndUpdate(
                key,
                { _id: key, subjects },
                { upsert: true }
            );
        }
        res.json({ success: true, curriculum: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== SECTIONS ====================

app.get('/api/sections', async (req, res) => {
    try {
        const sections = await Section.find({});
        const result = {};
        for (const sec of sections) {
            result[sec._id] = sec.sections;
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sections', async (req, res) => {
    try {
        const data = req.body;
        for (const [key, sections] of Object.entries(data)) {
            await Section.findByIdAndUpdate(
                key,
                { _id: key, sections },
                { upsert: true }
            );
        }
        res.json({ success: true, sections: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ==================== SERVER STARTUP ====================

async function startServer() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: DATABASE_NAME
        });
        console.log('✅ Connected to MongoDB');

        await initDB();

        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server startup failed:', error.message);
        process.exit(1);
    }
}

startServer();
