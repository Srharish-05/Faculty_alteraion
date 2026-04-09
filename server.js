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
  fromName: String,
  to: String,
  message: String,
  type: { type: String, default: 'alert' },
  data: mongoose.Schema.Types.Mixed,
  timestamp: Date,
  read: Boolean,
  status: { type: String, default: null } // null, 'accepted', or 'declined'
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

// ==================== VALIDATION FUNCTIONS ====================

// Validate individual timetable entry format
function validateTimetableEntry(entry) {
    if (!entry || typeof entry !== 'object') return false;
    if (typeof entry.faculty !== 'string' || !entry.faculty) return false;
    if (typeof entry.subject !== 'string' || !entry.subject) return false;
    if (typeof entry.type !== 'string' || !entry.type) return false;
    return true;
}

// Validate complete timetable structure
function validateTimetable(timetable) {
    if (!timetable || typeof timetable !== 'object') return false;
    
    const validCells = [
        'Monday_0', 'Monday_1', 'Monday_3', 'Monday_4', 'Monday_6', 'Monday_9',
        'Tuesday_0', 'Tuesday_1', 'Tuesday_3', 'Tuesday_4', 'Tuesday_6', 'Tuesday_9',
        'Wednesday_0', 'Wednesday_1', 'Wednesday_3', 'Wednesday_4', 'Wednesday_6', 'Wednesday_9',
        'Thursday_0', 'Thursday_1', 'Thursday_3', 'Thursday_4', 'Thursday_6', 'Thursday_9',
        'Friday_0', 'Friday_1', 'Friday_3', 'Friday_4', 'Friday_6', 'Friday_9'
    ];
    
    for (const [key, value] of Object.entries(timetable)) {
        if (!validCells.includes(key) && key !== 'free') {
            console.warn(`Invalid timetable cell: ${key}`);
            return false;
        }
        if (value !== null && !validateTimetableEntry(value)) {
            console.warn(`Invalid timetable entry at ${key}:`, value);
            return false;
        }
    }
    
    return true;
}

// Normalize curriculum subjects format
function normalizeCurriculum(curriculum) {
    if (!Array.isArray(curriculum)) return [];
    
    return curriculum.map(subject => {
        if (typeof subject === 'string') {
            return { name: subject, type: 'Lecture' };
        }
        if (subject && typeof subject === 'object') {
            return {
                name: subject.name || subject.subject || '',
                type: subject.type || 'Lecture'
            };
        }
        return null;
    }).filter(s => s && s.name);
}

// ==================== API ENDPOINTS ====================

// Helper to get a profile 
async function getProfileData(id) {
    if (USE_IN_MEMORY) {
        return inMemoryStore.profiles[id] || null;
    }
    const profile = await Profile.findOne({ id });
    return profile ? profile.toObject() : null;
}

// Helper to save a profile
async function saveProfileData(id, data) {
    // Validate timetable if present
    if (data.timetable && !validateTimetable(data.timetable)) {
        console.warn(`Invalid timetable for profile ${id}:`, data.timetable);
        // Don't fail — just log and continue, as timetable can be partially populated
    }

    if (USE_IN_MEMORY) {
        inMemoryStore.profiles[id] = { ...inMemoryStore.profiles[id], ...data, id };
        return inMemoryStore.profiles[id];
    }
    const hashedPassword = data.password && data.password.length < 60 ? await hashPassword(data.password) : data.password;
    return await Profile.findOneAndUpdate(
        { id },
        { ...data, password: hashedPassword },
        { upsert: true, new: true }
    );
}

// Get all profiles
app.get('/api/profiles', async (req, res) => {
    // Set cache headers for GET requests
    res.set('Cache-Control', 'no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
        let profiles;
        if (USE_IN_MEMORY) {
            profiles = Object.values(inMemoryStore.profiles);
        } else {
            profiles = await Profile.find({});
        }
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single profile
app.get('/api/profiles/:id', async (req, res) => {
    // Set cache headers for GET requests
    res.set('Cache-Control', 'no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
        const profile = await getProfileData(req.params.id);
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

        const profile = await saveProfileData(id, data);
        res.json({ success: true, profile });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete profile
app.delete('/api/profiles/:id', async (req, res) => {
    try {
        if (USE_IN_MEMORY) {
            delete inMemoryStore.profiles[req.params.id];
        } else {
            await Profile.deleteOne({ id: req.params.id });
        }
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

        const profile = await getProfileData(id);

        if (!profile) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check password based on user role
        let isPasswordValid = false;
        if (profile.role === 'admin') {
            isPasswordValid = password === 'admin123';
        } else {
            isPasswordValid = password === '12345678';
        }

        if (isPasswordValid) {
            res.json({ success: true, profile });
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

        const profile = await getProfileData(id);
        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify old password
        let isOldPasswordValid = false;
        if (profile.role === 'admin') {
            isOldPasswordValid = oldPassword === 'admin123';
        } else {
            isOldPasswordValid = oldPassword === '12345678';
        }

        if (!isOldPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Update with new password
        await saveProfileData(id, { ...profile, password: newPassword });

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

        const profile = await getProfileData(mailId);
        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updated = await saveProfileData(mailId, { ...profile, facultyId });
        res.json({ success: true, message: 'Faculty ID set successfully', profile: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== ADMIN FACULTY ENDPOINTS ====================

// Get all faculty (admin view)
app.get('/api/admin/faculty', async (req, res) => {
    try {
        let faculties;
        if (USE_IN_MEMORY) {
            faculties = Object.values(inMemoryStore.profiles).filter(f => f.role !== 'admin');
        } else {
            faculties = await Profile.find({ role: { $ne: 'admin' } });
        }
        res.json(faculties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single faculty (admin view)
app.get('/api/admin/faculty/:id', async (req, res) => {
    try {
        const faculty = await getProfileData(req.params.id);
        if (!faculty) {
            return res.status(404).json({ error: 'Faculty not found' });
        }
        res.json(faculty);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create faculty (admin)
app.post('/api/admin/faculty', async (req, res) => {
    try {
        const data = req.body;
        const id = data.id;

        if (!id) {
            return res.status(400).json({ error: 'Faculty ID is required' });
        }

        const faculty = await saveProfileData(id, data);
        res.json({ success: true, faculty });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update faculty (admin)
app.put('/api/admin/faculty/:id', async (req, res) => {
    try {
        const data = req.body;
        const { adminId, ...updateData } = data;

        const existing = await getProfileData(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Faculty not found' });
        }

        const faculty = await saveProfileData(req.params.id, { ...existing, ...updateData });
        res.json({ success: true, faculty });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete faculty (admin)
app.delete('/api/admin/faculty/:id', async (req, res) => {
    try {
        if (USE_IN_MEMORY) {
            delete inMemoryStore.profiles[req.params.id];
        } else {
            await Profile.deleteOne({ id: req.params.id });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ==================== NOTIFICATIONS ====================

app.get('/api/notifications', async (req, res) => {
    // Set cache headers for GET requests
    res.set('Cache-Control', 'no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
        let notifs;
        if (USE_IN_MEMORY) {
            notifs = Object.values(inMemoryStore.notifications).sort((a, b) => b.timestamp - a.timestamp);
        } else {
            notifs = await Notification.find({}).sort({ timestamp: -1 });
        }
        res.json(notifs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/notifications/:userId', async (req, res) => {
    // Set cache headers for GET requests
    res.set('Cache-Control', 'no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
        let notifs;
        if (USE_IN_MEMORY) {
            notifs = Object.values(inMemoryStore.notifications)
                .filter(n => n.to === req.params.userId)
                .sort((a, b) => b.timestamp - a.timestamp);
        } else {
            notifs = await Notification.find({ to: req.params.userId }).sort({ timestamp: -1 });
        }
        res.json(notifs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/notifications', async (req, res) => {
    try {
        const { from, to, fromName, message, type = 'alert', data } = req.body;

        if (!from || !to) {
            return res.status(400).json({ error: 'from and to fields are required' });
        }

        const notif = {
            id: Date.now(),
            from,
            fromName: fromName || from,
            to,
            message: message || '',
            type,
            data: data || { msg: message },
            timestamp: new Date(),
            read: false,
            status: null  // null means no decision yet, then 'accepted' or 'declined'
        };

        if (USE_IN_MEMORY) {
            inMemoryStore.notifications[String(notif.id)] = notif;
        } else {
            const saved = new Notification(notif);
            await saved.save();
        }
        
        res.json({ success: true, ...notif });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        if (USE_IN_MEMORY) {
            const notif = inMemoryStore.notifications[String(req.params.id)];
            if (notif) notif.read = true;
        } else {
            await Notification.findOneAndUpdate({ id: Number(req.params.id) }, { read: true });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/notifications/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        if (USE_IN_MEMORY) {
            const notif = inMemoryStore.notifications[String(req.params.id)];
            if (notif) {
                notif.status = status;
                notif.read = true;
            }
        } else {
            await Notification.findOneAndUpdate({ id: Number(req.params.id) }, { status, read: true });
        }
        res.json({ success: true, status });
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
            // Normalize curriculum to ensure consistent format
            const normalized = normalizeCurriculum(subjects);
            
            await Curriculum.findByIdAndUpdate(
                key,
                { _id: key, subjects: normalized },
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


// ==================== IN-MEMORY DATA STORE (FALLBACK) ====================

// Fallback storage when MongoDB is unavailable
const inMemoryStore = {
    profiles: {},
    notifications: {},
    curriculum: {},
    sections: {},
    initialized: false
};

// Flag to track if we're using in-memory storage
let USE_IN_MEMORY = false;

// ==================== SERVER STARTUP ====================

async function startServer() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        
        // Try connecting with a timeout
        const connectWithTimeout = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('MongoDB connection timeout - using local in-memory storage'));
            }, 5000);
            
            mongoose.connect(MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                dbName: DATABASE_NAME,
                serverSelectionTimeoutMS: 4000
            }).then(() => {
                clearTimeout(timeout);
                resolve();
            }).catch(err => {
                clearTimeout(timeout);
                reject(err);
            });
        });

        try {
            await connectWithTimeout;
            console.log('✅ Connected to MongoDB');
            await initDB();
        } catch (mongoError) {
            console.warn('⚠️  MongoDB unavailable:', mongoError.message);
            console.log('📦 Starting in LOCAL IN-MEMORY MODE for testing...');
            USE_IN_MEMORY = true;
            await initInMemoryDB();
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
            if (USE_IN_MEMORY) {
                console.log('📝 Note: Running with local in-memory storage (data will be lost on restart)');
            }
        });
    } catch (error) {
        console.error('❌ Server startup failed:', error.message);
        process.exit(1);
    }
}

// Initialize in-memory database with default data
async function initInMemoryDB() {
    console.log('🔍 Initializing in-memory database...');
    
    // Store default curriculum
    for (const [key, value] of Object.entries(DEFAULT_CURRICULUM)) {
        inMemoryStore.curriculum[key] = { _id: key, subjects: value };
    }
    
    // Store default sections
    for (const [key, value] of Object.entries(DEFAULT_SECTIONS)) {
        inMemoryStore.sections[key] = { _id: key, sections: value };
    }
    
    // Initialize empty notification store
    inMemoryStore.notifications = {};
    
    // Seed default admin account in-memory
    inMemoryStore.profiles['admin@mkce.ac.in'] = {
        id: 'admin@mkce.ac.in',
        name: 'MKCE Admin',
        role: 'admin',
        password: 'admin123',
        dept: 'Administration'
    };
    
    // Seed default faculty account in-memory
    inMemoryStore.profiles['faculty@mkce.ac.in'] = {
        id: 'faculty@mkce.ac.in',
        name: 'MKCE Faculty',
        role: 'faculty',
        password: '12345678',
        dept: 'ECE'
    };

    inMemoryStore.initialized = true;
    console.log('✅ In-memory database initialized with default accounts');
    console.log('   - Admin: admin@mkce.ac.in / admin123');
    console.log('   - Faculty: faculty@mkce.ac.in / 12345678');
}

startServer();
