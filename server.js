const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'faculty_db';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5000').split(',');
const MAX_REQUEST_SIZE = '5mb';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://faculty.nuuanv4.mongodb.net"]
        }
    }
}));
app.use(morgan('combined'));
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(bodyParser.json({ limit: MAX_REQUEST_SIZE }));
app.use(bodyParser.urlencoded({ limit: MAX_REQUEST_SIZE, extended: true }));
app.use(express.static(path.join(__dirname, './'), {
    etag: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check - used by frontend to detect if server is running
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// ==================== MONGOOSE SCHEMAS ====================

const profileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  facultyId: { type: String, unique: true, sparse: true },
  name: String,
  dept: String,
  desig: String,
  role: String,
  password: { type: String, required: true },
  phone: String,
  timetable: mongoose.Schema.Types.Mixed,
  photo: String,
  subjectHandling: String,
  classHandling: String,
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: Date
}, { collection: 'profiles', timestamps: true });

const curriculumSchema = new mongoose.Schema({
  _id: String,
  subjects: mongoose.Schema.Types.Mixed
}, { collection: 'curriculum' });

const notificationSchema = new mongoose.Schema({
  from: String,
  to: String,
  fromName: String,
  type: String,  // 'takeover_request', 'approval', 'rejection', etc.
  message: String,
  data: mongoose.Schema.Types.Mixed,  // Store full request data: {subject, day, period, section, year, cellId, etc.}
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

// Password validation
function validatePasswordStrength(password) {
    if (password.length < 12) return { valid: false, message: 'Password must be at least 12 characters' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain uppercase letter' };
    if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain lowercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain number' };
    if (!/[!@#$%^&*]/.test(password)) return { valid: false, message: 'Password must contain special character (!@#$%^&*)' };
    return { valid: true };
}

// Hash password with bcrypt
async function hashPassword(password) {
    if (!password) return '';
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

// Compare passwords
async function comparePasswords(password, hash) {
    return bcrypt.compare(password, hash);
}

// Validate timetable entry structure
function validateTimetableEntry(entry) {
    if (!entry || typeof entry !== 'object') return false;
    
    // Counselling entries only need subject and isCounselling flag
    if (entry.isCounselling) {
        return entry.subject && typeof entry.subject === 'string';
    }
    
    // Must have subject
    if (!entry.subject || typeof entry.subject !== 'string') return false;
    
    // Must have year for non-counselling entries
    if (!entry.year || typeof entry.year !== 'string') return false;
    
    // Must have section OR sections array (for electives)
    if (!entry.section && !Array.isArray(entry.sections)) return false;
    
    // If elective, sections must be non-empty array
    if (entry.isElective && (!Array.isArray(entry.sections) || entry.sections.length === 0)) return false;
    
    return true;
}

// Validate entire timetable object
function validateTimetable(timetable) {
    if (!timetable || typeof timetable !== 'object') {
        return true; // Empty timetable is OK
    }
    
    for (const [cellId, entry] of Object.entries(timetable)) {
        if (!validateTimetableEntry(entry)) {
            return false;
        }
    }
    return true;
}

// Generate JWT token
function generateToken(profile) {
    return jwt.sign(
        { id: profile.id, role: profile.role, facultyId: profile.facultyId },
        JWT_SECRET,
        { expiresIn: '30m' }
    );
}

// JWT verification middleware
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No authorization token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Rate limiting for login
const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 attempts per minute
    message: 'Too many login attempts, please try again after 1 minute',
    standardHeaders: true,
    legacyHeaders: false,
});

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

// Get all profiles (protected)
app.get('/api/profiles', verifyToken, async (req, res) => {
    try {
        const profiles = await Profile.find({});
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single profile (protected)
app.get('/api/profiles/:id', verifyToken, async (req, res) => {
    try {
        const profile = await Profile.findOne({ id: req.params.id });
        if (profile) {
            res.json(profile);
        } else {
            res.status(404).json({ error: 'Profile not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create or update profile (protected, admin only)
app.post('/api/profiles', verifyToken, async (req, res) => {
    try {
        // Check admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const data = req.body;
        const id = data.id;

        if (!id) {
            return res.status(400).json({ error: 'Profile ID is required' });
        }

        // Validate timetable structure if present
        if (data.timetable && !validateTimetable(data.timetable)) {
            return res.status(400).json({ error: 'Invalid timetable structure. Each entry must have subject, year, and section/sections.' });
        }

        // Hash password if it's new or changed
        if (data.password && data.password.length < 60) {
            const strength = validatePasswordStrength(data.password);
            if (!strength.valid) {
                return res.status(400).json({ error: strength.message });
            }
            data.password = await hashPassword(data.password);
        }

        // Use $set to preserve other fields like failedLoginAttempts, lockUntil, timestamps
        const profile = await Profile.findOneAndUpdate(
            { id },
            { $set: data },
            { upsert: true, new: true }
        );

        res.json({ success: true, profile });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete profile (protected, admin only)
app.delete('/api/profiles/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }
        
        // Delete associated notifications
        await Notification.deleteMany({ $or: [{ to: req.params.id }, { from: req.params.id }] });
        
        await Profile.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== ADMIN FACULTY MANAGEMENT ====================

// Create faculty via admin panel (POST /api/admin/faculty)
app.post('/api/admin/faculty', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        const { id, name, dept, desig, role, password, phone } = req.body;

        if (!id || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if email already exists
        const existing = await Profile.findOne({ id });
        if (existing) {
            return res.status(400).json({ error: 'Faculty with this email already exists' });
        }

        // Validate password strength
        const strength = validatePasswordStrength(password);
        if (!strength.valid) {
            return res.status(400).json({ error: strength.message });
        }

        const hashedPassword = await hashPassword(password);
        const profile = new Profile({
            id,
            name: name || '',
            dept: dept || '',
            desig: desig || '',
            role: role || 'faculty',
            password: hashedPassword,
            phone: phone || '',
            timetable: {},
            failedLoginAttempts: 0
        });

        await profile.save();
        res.json({ success: true, message: 'Faculty created successfully', profile: profile.toObject() });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update faculty via admin panel (PUT /api/admin/faculty/:id)
app.put('/api/admin/faculty/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        const { name, dept, desig, role, phone, password } = req.body;
        const id = req.params.id;

        // Check if faculty exists
        const existing = await Profile.findOne({ id });
        if (!existing) {
            return res.status(404).json({ error: 'Faculty not found' });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (dept) updateData.dept = dept;
        if (desig) updateData.desig = desig;
        if (role) updateData.role = role;
        if (phone) updateData.phone = phone;

        // If password is provided, hash and update it
        if (password && password.trim().length > 0) {
            const strength = validatePasswordStrength(password);
            if (!strength.valid) {
                return res.status(400).json({ error: strength.message });
            }
            updateData.password = await hashPassword(password);
        }

        const updated = await Profile.findOneAndUpdate(
            { id },
            { $set: updateData },
            { new: true }
        );

        res.json({ success: true, message: 'Faculty updated successfully', profile: updated.toObject() });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete faculty via admin panel (DELETE /api/admin/faculty/:id)
app.delete('/api/admin/faculty/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        const id = req.params.id;

        // Check if faculty exists
        const existing = await Profile.findOne({ id });
        if (!existing) {
            return res.status(404).json({ error: 'Faculty not found' });
        }

        // Delete associated notifications
        await Notification.deleteMany({ $or: [{ to: id }, { from: id }] });
        
        await Profile.deleteOne({ id });
        res.json({ success: true, message: 'Faculty deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login validation
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        let { id, password } = req.body;
        
        if (!id || !password) {
            return res.status(400).json({ error: 'Email/Faculty ID and password are required' });
        }

        id = id.trim();

        // Try to find by mailid first, then by facultyId if facultyId is set
        let profile = await Profile.findOne({ id });
        
        if (!profile) {
            // If not found by mailid, try facultyId
            profile = await Profile.findOne({ facultyId: id });
        }

        if (!profile) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare passwords using bcrypt
        const isPasswordValid = await comparePasswords(password, profile.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken(profile);
        
        res.json({ 
            success: true, 
            token,
            profile: {
                id: profile.id,
                name: profile.name,
                role: profile.role,
                dept: profile.dept,
                facultyId: profile.facultyId
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change password (protected)
app.post('/api/change-password', verifyToken, async (req, res) => {
    try {
        const { id, oldPassword, newPassword } = req.body;

        if (!id || !oldPassword || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate new password strength
        const strength = validatePasswordStrength(newPassword);
        if (!strength.valid) {
            return res.status(400).json({ error: strength.message });
        }

        const profile = await Profile.findOne({ id });
        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify old password
        const isOldPasswordValid = await comparePasswords(oldPassword, profile.password);
        if (!isOldPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash and save new password
        const newHash = await hashPassword(newPassword);
        await Profile.findOneAndUpdate({ id }, { password: newHash });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Set or update faculty ID (protected, atomic operation)
app.post('/api/set-faculty-id', verifyToken, async (req, res) => {
    try {
        const { mailId, facultyId } = req.body;

        if (!mailId || !facultyId) {
            return res.status(400).json({ error: 'Mail ID and Faculty ID are required' });
        }

        // Atomic operation: update only if facultyId is null, preventing race condition
        const profile = await Profile.findOneAndUpdate(
            { id: mailId, facultyId: null },  // Only update if current facultyId is null
            { facultyId },
            { new: true }
        );

        if (!profile) {
            // Check if user exists but already has a facultyId
            const existing = await Profile.findOne({ id: mailId });
            if (!existing) {
                return res.status(404).json({ error: 'User not found' });
            }
            if (existing.facultyId) {
                return res.status(400).json({ error: 'Faculty ID already set for this user' });
            }
            // If we get here, the facultyId might already be in use
            const checkId = await Profile.findOne({ facultyId, id: { $ne: mailId } });
            if (checkId) {
                return res.status(400).json({ error: 'Faculty ID is already in use' });
            }
        }

        res.json({ success: true, message: 'Faculty ID set successfully', profile: profile ? profile.toObject() : null });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


// ==================== NOTIFICATIONS ====================

app.get('/api/notifications', verifyToken, async (req, res) => {
    try {
        const notifs = await Notification.find({}).sort({ timestamp: -1 });
        res.json(notifs);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/notifications/:userId', verifyToken, async (req, res) => {
    try {
        const notifs = await Notification.find({ to: req.params.userId }).sort({ timestamp: -1 });
        res.json(notifs);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/notifications', verifyToken, async (req, res) => {
    try {
        const { to, from, fromName, type, message, data } = req.body;
        
        if (!to || !from) {
            return res.status(400).json({ error: 'to and from fields are required' });
        }

        const notif = new Notification({
            to,
            from,
            fromName: fromName || 'Unknown',
            type: type || 'general',
            message: message || '',
            data: data || {},  // Store full data object with request details
            timestamp: new Date(),
            read: false
        });
        
        await notif.save();
        res.json(notif.toObject());
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/notifications/:id/read', verifyToken, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== CURRICULUM ====================

app.get('/api/curriculum', verifyToken, async (req, res) => {
    try {
        const curriculums = await Curriculum.find({});
        const result = {};
        for (const cur of curriculums) {
            result[cur._id] = cur.subjects;
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/curriculum', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }
        
        const data = req.body;
        for (const [key, subjects] of Object.entries(data)) {
            // Validate and normalize subjects format - ensure all are objects
            const normalizedSubjects = Array.isArray(subjects) ? subjects.map(s => {
                if (typeof s === 'string') {
                    // Convert string to object format
                    return { name: s, type: 'normal' };
                }
                // Ensure object has required fields
                return {
                    name: s.name || '',
                    type: s.type || 'normal'
                };
            }) : [];

            await Curriculum.findByIdAndUpdate(
                key,
                { _id: key, subjects: normalizedSubjects },
                { upsert: true }
            );
        }
        res.json({ success: true, curriculum: data });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== SECTIONS ====================

app.get('/api/sections', verifyToken, async (req, res) => {
    try {
        const sections = await Section.find({});
        const result = {};
        for (const sec of sections) {
            result[sec._id] = sec.sections;
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/sections', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }
        
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
        res.status(500).json({ error: 'Internal server error' });
    }
});


// ==================== SERVER STARTUP ====================

async function startServer() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: DATABASE_NAME,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
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
