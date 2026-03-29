/**
 * Bulk Faculty Creation Script
 * Run: node create_faculties.js
 * Creates login accounts for all new faculty members via the FacultySync API.
 * 
 * IMPORTANT: Set the following environment variables before running:
 *   - ADMIN_EMAIL: Admin account email
 *   - ADMIN_PASSWORD: Admin account password
 *   - API_URL: Server URL (default: http://localhost:5000)
 *   - INITIAL_FACULTY_PASSWORD: Password to set for new faculty members
 */

require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const INITIAL_FACULTY_PASSWORD = process.env.INITIAL_FACULTY_PASSWORD;

// Validate required environment variables
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
    console.error('Please set these in your .env file');
    process.exit(1);
}

if (!INITIAL_FACULTY_PASSWORD) {
    console.error('❌ ERROR: INITIAL_FACULTY_PASSWORD environment variable is required');
    console.error('Should be in .env file with a strong password (12+ chars, mix of uppercase, lowercase, numbers, special chars)');
    process.exit(1);
}

const faculties = [
    {
        id: 'kiruthika@mkce.ac.in',
        name: 'Ms. G. Kiruthika',
        dept: 'ECE',
        desig: 'Assistant Professor',
        phone: '',
        timetable: {}
    },
    {
        id: 'saranya@mkce.ac.in',
        name: 'Mrs. M. Saranya',
        dept: 'ECE',
        desig: 'Assistant Professor',
        phone: '',
        timetable: {}
    },
    {
        id: 'sivakumar@mkce.ac.in',
        name: 'Mr. T. Siva Kumar',
        dept: 'ECE',
        desig: 'Assistant Professor',
        phone: '',
        timetable: {}
    },
    {
        id: 'senthamilselvi@mkce.ac.in',
        name: 'Mrs. M. Senthamilselvi',
        dept: 'ECE',
        desig: 'Assistant Professor',
        phone: '',
        timetable: {}
    },
    {
        id: 'ramesh@mkce.ac.in',
        name: 'Mr. L. Ramesh',
        dept: 'ECE',
        desig: 'Assistant Professor',
        phone: '',
        timetable: {}
    },
    {
        id: 'revathi@mkce.ac.in',
        name: 'Dr. G. Revathi',
        dept: 'ECE',
        desig: 'Assistant Professor',
        phone: '',
        timetable: {}
    },
    {
        id: 'jeyakumar@mkce.ac.in',
        name: 'Dr. P. Jeyakumar',
        dept: 'ECE',
        desig: 'Assistant Professor',
        phone: '',
        timetable: {}
    },
    {
        id: 'sheikdavood@mkce.ac.in',
        name: 'Dr. K. Sheikdavood',
        dept: 'ECE',
        desig: 'Assistant Professor',
        phone: '',
        timetable: {}
    },
    {
        id: 'sivaranjani@mkce.ac.in',
        name: 'Dr. S. Sivaranjani',
        dept: 'ECE',
        desig: 'Assistant Professor',
        phone: '',
        timetable: {}
    },
    {
        id: 'sivagurunathan@mkce.ac.in',
        name: 'Dr. P. T. Sivagurunathan',
        dept: 'ECE',
        desig: 'Assistant Professor',
        phone: '',
        timetable: {}
    },
    {
        id: 'sridevi@mkce.ac.in',
        name: 'Dr. A. Sridevi',
        dept: 'ECE',
        desig: 'Professor',
        phone: '',
        timetable: {}
    }
];

async function createFaculties() {
    console.log('🔑 Faculty Account Creation Script');
    console.log('===================================\n');

    let adminToken = null;

    // Step 1: Login as admin
    try {
        console.log('🔐 Authenticating as admin...');
        const loginRes = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: ADMIN_EMAIL,
                password: ADMIN_PASSWORD
            })
        });

        const loginData = await loginRes.json();
        
        if (!loginData.success || !loginData.token) {
            console.error('❌ Authentication failed:', loginData.error || 'Invalid credentials');
            process.exit(1);
        }

        adminToken = loginData.token;
        console.log('✅ Authenticated successfully\n');
    } catch (err) {
        console.error('❌ Failed to authenticate:', err.message);
        process.exit(1);
    }

    // Step 2: Create faculty accounts
    console.log('👥 Creating faculty accounts...\n');
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const faculty of faculties) {
        try {
            const res = await fetch(`${API_URL}/api/profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    ...faculty,
                    password: INITIAL_FACULTY_PASSWORD,
                    role: 'faculty'
                })
            });

            const data = await res.json();
            
            if (!res.ok) {
                console.log(`❌ Failed: ${faculty.name} — ${data.error || 'Unknown error'}`);
                failed++;
            } else if (data.success) {
                console.log(`✅ Created: ${faculty.name} (${faculty.id})`);
                success++;
            } else {
                console.log(`⚠️  Skipped: ${faculty.name} — ${data.error || 'Already exists'}`);
                skipped++;
            }
        } catch (err) {
            console.log(`❌ Error creating ${faculty.name}: ${err.message}`);
            failed++;
        }
    }

    // Summary
    console.log('\n📊 Summary');
    console.log('==========');
    console.log(`✅ Created: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📋 Total: ${faculties.length}`);
    
    if (success > 0) {
        console.log('\n✨ Faculty accounts created successfully!');
        console.log(`📧 All accounts use: ${INITIAL_FACULTY_PASSWORD} (first login)`);
        console.log('💡 Faculty members should change password on first login');
    }
    
    if (failed > 0) {
        console.log('\n⚠️  Some accounts failed. Check the errors above.');
        process.exit(1);
    }
}

createFaculties();
