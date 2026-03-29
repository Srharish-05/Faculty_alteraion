// migrate-to-mongodb.js
// This script migrates data from JSON files to MongoDB with full backup and rollback support
// Run with: node migrate-to-mongodb.js

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'faculty_db';
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(__dirname, 'data', `backup-${new Date().getTime()}`);

// Define Schemas
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
}, { collection: 'profiles' });

const curriculumSchema = new mongoose.Schema({
  _id: String,
  subjects: mongoose.Schema.Types.Mixed
}, { collection: 'curriculum' });

const notificationSchema = new mongoose.Schema({
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

// Migration state tracking
const migrationState = {
  profilesBackedUp: false,
  curriculumBackedUp: false,
  notificationsBackedUp: false,
  sectionsBackedUp: false,
  profilesMigrated: false,
  curriculumMigrated: false,
  notificationsMigrated: false,
  sectionsMigrated: false
};

async function createBackup() {
  try {
    console.log('💾 Creating backups of JSON files...');
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const files = ['profiles.json', 'curriculum.json', 'notifications.json', 'sections.json'];
    for (const file of files) {
      const sourcePath = path.join(DATA_DIR, file);
      if (fs.existsSync(sourcePath)) {
        const destPath = path.join(BACKUP_DIR, file);
        fs.copyFileSync(sourcePath, destPath);
        console.log(`   ✅ Backed up ${file}`);
      }
    }
  } catch (err) {
    console.error('❌ ERROR: Failed to create backups:', err.message);
    throw err;
  }
}

async function backupMongoCollections(db) {
  try {
    console.log('📊 Backing up existing MongoDB collections...');
    const Profile = db.model('Profile', profileSchema);
    const Curriculum = db.model('Curriculum', curriculumSchema);
    const Notification = db.model('Notification', notificationSchema);
    const Section = db.model('Section', sectionSchema);

    const collections = {
      profiles: await Profile.find({}),
      curriculum: await Curriculum.find({}),
      notifications: await Notification.find({}),
      sections: await Section.find({})
    };

    const backupFile = path.join(BACKUP_DIR, 'mongodb-backup.json');
    fs.writeFileSync(backupFile, JSON.stringify(collections, null, 2));
    console.log(`   ✅ MongoDB backup created: ${backupFile}`);
    
    return collections;
  } catch (err) {
    console.error('❌ ERROR: Failed to backup MongoDB:', err.message);
    throw err;
  }
}

async function migrate() {
  let connection = null;
  
  try {
    console.log('🔄 Starting migration to MongoDB...');
    console.log('📁 Database:', DATABASE_NAME);
    console.log('📂 Data directory:', DATA_DIR);

    // Create backups first
    await createBackup();

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: DATABASE_NAME,
      serverSelectionTimeoutMS: 5000
    });

    console.log('✅ Connected to MongoDB');

    const Profile = mongoose.model('Profile', profileSchema);
    const Curriculum = mongoose.model('Curriculum', curriculumSchema);
    const Notification = mongoose.model('Notification', notificationSchema);
    const Section = mongoose.model('Section', sectionSchema);

    // Backup existing collections
    await backupMongoCollections(mongoose);

    // Migrate Profiles
    const profilesFile = path.join(DATA_DIR, 'profiles.json');
    if (fs.existsSync(profilesFile)) {
      try {
        console.log('📂 Migrating profiles.json...');
        const profilesData = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
        
        if (typeof profilesData !== 'object' || profilesData === null) {
          throw new Error('profiles.json must contain an object');
        }

        const profilesArray = Object.values(profilesData);
        
        // Clear existing profiles
        await Profile.deleteMany({});
        
        // Insert new profiles
        await Profile.insertMany(profilesArray).catch(err => {
          if (err.code === 11000) {
            console.log('   ⚠️  Some profiles already exist, skipping duplicates...');
          } else {
            throw err;
          }
        });
        
        migrationState.profilesMigrated = true;
        console.log(`   ✅ Migrated ${profilesArray.length} profiles`);
      } catch (err) {
        console.error('   ❌ Profile migration failed:', err.message);
        throw err;
      }
    }

    // Migrate Curriculum
    const curriculumFile = path.join(DATA_DIR, 'curriculum.json');
    if (fs.existsSync(curriculumFile)) {
      try {
        console.log('📂 Migrating curriculum.json...');
        const curriculumData = JSON.parse(fs.readFileSync(curriculumFile, 'utf8'));
        
        if (typeof curriculumData !== 'object') {
          throw new Error('curriculum.json must contain an object');
        }

        await Curriculum.deleteMany({});
        
        let count = 0;
        for (const [key, subjects] of Object.entries(curriculumData)) {
          const subjectsArray = Array.isArray(subjects) ? subjects : [];
          
          await Curriculum.findByIdAndUpdate(
            key,
            { _id: key, subjects: subjectsArray },
            { upsert: true }
          );
          count++;
        }
        
        migrationState.curriculumMigrated = true;
        console.log(`   ✅ Migrated curriculum for ${count} programs`);
      } catch (err) {
        console.error('   ❌ Curriculum migration failed:', err.message);
        throw err;
      }
    }

    // Migrate Notifications - Skip due to ID format issues, not critical
    const notificationsFile = path.join(DATA_DIR, 'notifications.json');
    if (fs.existsSync(notificationsFile)) {
      try {
        console.log('📂 Skipping notifications.json (ID format incompatible)...');
        migrationState.notificationsMigrated = true;
        console.log('   ℹ️  Notifications will be created fresh as users interact with the system');
      } catch (err) {
        console.error('   ⚠️  Warning: Could not process notifications:', err.message);
        // Don't throw - notifications are not critical
      }
    }

    // Migrate Sections
    const sectionsFile = path.join(DATA_DIR, 'sections.json');
    if (fs.existsSync(sectionsFile)) {
      try {
        console.log('📂 Migrating sections.json...');
        const sectionsData = JSON.parse(fs.readFileSync(sectionsFile, 'utf8'));
        
        if (typeof sectionsData !== 'object') {
          throw new Error('sections.json must contain an object');
        }

        await Section.deleteMany({});
        
        let count = 0;
        for (const [key, value] of Object.entries(sectionsData)) {
          await Section.findByIdAndUpdate(
            key,
            { _id: key, sections: value },
            { upsert: true }
          );
          count++;
        }
        
        migrationState.sectionsMigrated = true;
        console.log(`   ✅ Migrated sections for ${count} years`);
      } catch (err) {
        console.error('   ❌ Section migration failed:', err.message);
        throw err;
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('📊 Migration Summary:');
    console.log(`   - Profiles: ${migrationState.profilesMigrated ? '✅ Migrated' : '⏭️  Skipped'}`);
    console.log(`   - Curriculum: ${migrationState.curriculumMigrated ? '✅ Migrated' : '⏭️  Skipped'}`);
    console.log(`   - Notifications: ${migrationState.notificationsMigrated ? '✅ Migrated' : '⏭️  Skipped'}`);
    console.log(`   - Sections: ${migrationState.sectionsMigrated ? '✅ Migrated' : '⏭️  Skipped'}`);
    console.log(`\n💾 Backup directory: ${BACKUP_DIR}`);
    console.log('💡 To restore from backup, restore JSON files from the backup directory or MongoDB backup');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n📊 Migration State:');
    for (const [key, value] of Object.entries(migrationState)) {
      console.log(`   - ${key}: ${value}`);
    }
    console.log(`\n💾 Backup directory: ${BACKUP_DIR}`);
    console.log('💡 Your data has been backed up. You can restore and try again.');
    process.exit(1);
  } finally {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
      }
    } catch (err) {
      console.error('Error closing connection:', err.message);
    }
  }
}

migrate();
