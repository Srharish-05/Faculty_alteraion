const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'profiles.json');
const backupPath = path.join(__dirname, 'data', `profiles.json.backup.${new Date().getTime()}`);

// Define department variants
const DEPT_VARIANTS = {
    'Electronics and Communication Engineering': 'ECE',
    'Electronics (ECE)': 'ECE',
    'VLSI': 'VLSI'
};

async function migrateProfiles() {
    try {
        // 1. Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error('❌ ERROR: profiles.json not found at', filePath);
            process.exit(1);
        }

        console.log('📁 Starting migration...');

        // 2. Create backup before any changes
        try {
            const originalData = fs.readFileSync(filePath, 'utf8');
            fs.writeFileSync(backupPath, originalData, 'utf8');
            console.log('✅ Backup created:', backupPath);
        } catch (err) {
            console.error('❌ ERROR: Failed to create backup:', err.message);
            process.exit(1);
        }

        // 3. Validate JSON structure
        let data;
        try {
            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (err) {
            console.error('❌ ERROR: Invalid JSON in profiles.json:', err.message);
            console.log('💾 Restoring from backup...');
            fs.copyFileSync(backupPath, filePath);
            process.exit(1);
        }

        // 4. Validate data structure
        if (typeof data !== 'object' || data === null) {
            console.error('❌ ERROR: profiles.json must be an object');
            console.log('💾 Restoring from backup...');
            fs.copyFileSync(backupPath, filePath);
            process.exit(1);
        }

        // 5. Prepare changes in memory (read-all, modify-all, write-once pattern)
        let updatedCount = 0;
        const changes = {};

        for (const id in data) {
            const currentDept = data[id].dept;
            
            // Check if department needs updating
            if (DEPT_VARIANTS[currentDept]) {
                const newDept = DEPT_VARIANTS[currentDept];
                if (currentDept !== newDept) {
                    changes[id] = { from: currentDept, to: newDept };
                    data[id].dept = newDept;
                    updatedCount++;
                }
            }
        }

        // 6. Write all changes at once (atomic operation)
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`✅ Successfully updated ${updatedCount} profiles:`);
            
            for (const id in changes) {
                console.log(`   - ${id}: "${changes[id].from}" → "${changes[id].to}"`);
            }
            
            console.log('\n✨ Migration completed successfully!');
            console.log(`📋 Backup file: ${backupPath}`);
        } catch (err) {
            console.error('❌ ERROR: Failed to write changes:', err.message);
            console.log('💾 Restoring from backup...');
            fs.copyFileSync(backupPath, filePath);
            process.exit(1);
        }

    } catch (err) {
        console.error('❌ Unexpected error during migration:', err.message);
        process.exit(1);
    }
}

// Run migration
migrateProfiles();
