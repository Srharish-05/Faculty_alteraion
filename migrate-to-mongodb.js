// migrate-to-mongodb.js
// This script migrates data from JSON files to MongoDB
// Run with: node migrate-to-mongodb.js

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'faculty_db';
const DATA_DIR = path.join(__dirname, 'data');

// Define Schemas
const profileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
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
}, { collection: 'profiles' });

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
}, { collection: 'notifications' });

const sectionSchema = new mongoose.Schema({
  _id: String,
  sections: [String]
}, { collection: 'sections' });

async function migrate() {
  try {
    console.log('🔄 Starting migration to MongoDB...');
    console.log('📁 Database:', DATABASE_NAME);

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: DATABASE_NAME
    });

    console.log('✅ Connected to MongoDB');

    const Profile = mongoose.model('Profile', profileSchema);
    const Curriculum = mongoose.model('Curriculum', curriculumSchema);
    const Notification = mongoose.model('Notification', notificationSchema);
    const Section = mongoose.model('Section', sectionSchema);

    // Migrate Profiles
    const profilesFile = path.join(DATA_DIR, 'profiles.json');
    if (fs.existsSync(profilesFile)) {
      console.log('📂 Migrating profiles.json...');
      const profilesData = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
      
      // Convert object to array format
      const profilesArray = Object.values(profilesData);
      
      // Clear existing profiles
      await Profile.deleteMany({});
      
      // Insert new profiles
      await Profile.insertMany(profilesArray, { ordered: false }).catch(err => {
        if (err.code === 11000) {
          console.log('⚠️  Some profiles already exist, continuing...');
        } else {
          throw err;
        }
      });
      
      console.log(`✅ Migrated ${profilesArray.length} profiles`);
    }

    // Migrate Curriculum
    const curriculumFile = path.join(DATA_DIR, 'curriculum.json');
    if (fs.existsSync(curriculumFile)) {
      console.log('📂 Migrating curriculum.json...');
      const curriculumData = JSON.parse(fs.readFileSync(curriculumFile, 'utf8'));
      
      await Curriculum.deleteMany({});
      
      for (const [key, subjects] of Object.entries(curriculumData)) {
        // Make sure subjects is an array
        const subjectsArray = Array.isArray(subjects) ? subjects : [];
        
        await Curriculum.findByIdAndUpdate(
          key,
          { _id: key, subjects: subjectsArray },
          { upsert: true }
        ).exec();
      }
      
      console.log(`✅ Migrated curriculum for ${Object.keys(curriculumData).length} programs`);
    }

    // Migrate Notifications
    const notificationsFile = path.join(DATA_DIR, 'notifications.json');
    if (fs.existsSync(notificationsFile)) {
      console.log('📂 Migrating notifications.json...');
      const notificationsData = JSON.parse(fs.readFileSync(notificationsFile, 'utf8'));
      
      if (Array.isArray(notificationsData) && notificationsData.length > 0) {
        await Notification.deleteMany({});
        await Notification.insertMany(notificationsData);
        console.log(`✅ Migrated ${notificationsData.length} notifications`);
      }
    }

    // Migrate Sections
    const sectionsFile = path.join(DATA_DIR, 'sections.json');
    if (fs.existsSync(sectionsFile)) {
      console.log('📂 Migrating sections.json...');
      const sectionsData = JSON.parse(fs.readFileSync(sectionsFile, 'utf8'));
      
      await Section.deleteMany({});
      
      for (const [key, value] of Object.entries(sectionsData)) {
        await Section.findByIdAndUpdate(
          key,
          { _id: key, sections: value },
          { upsert: true }
        );
      }
      
      console.log(`✅ Migrated sections for ${Object.keys(sectionsData).length} years`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('💾 Your JSON data is now in MongoDB');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

migrate();
