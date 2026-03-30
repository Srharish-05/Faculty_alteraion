/**
 * FacultySync - Database Utility
 * Handles persistence for faculty profiles and directory.
 */

const API_URL = '/api';

const DB_KEYS = {
    CURRENT_USER: 'facultySync_current_user', // Still stored in localStorage for session persistence
};

class FacultyDB {
    constructor() {
        // No local initialization needed, server handles it
    }

    async hashPassword(password) {
        // We still might need this for local checks, but server handles hashing on save/login
        if (!password) return '';
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    login(email) {
        localStorage.setItem(DB_KEYS.CURRENT_USER, email);
    }

    logout() {
        localStorage.removeItem(DB_KEYS.CURRENT_USER);
    }

    async getCurrentUser() {
        const email = localStorage.getItem(DB_KEYS.CURRENT_USER);
        if (!email) return null;
        return await this.getProfile(email);
    }

    // DATA OPERATIONS
    async getProfile(email) {
        try {
            const response = await fetch(`${API_URL}/profiles/${email}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (e) {
            console.error('Database Error:', e);
            return null;
        }
    }

    async saveProfile(email, data) {
        try {
            const response = await fetch(`${API_URL}/profiles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, id: email })
            });
            return await response.json();
        } catch (e) {
            console.error('Database Error:', e);
            return { error: 'Failed to save profile' };
        }
    }

    async getAllFaculties() {
        try {
            const response = await fetch(`${API_URL}/profiles`);
            return await response.json();
        } catch (e) {
            console.error('Database Error:', e);
            return [];
        }
    }

    async validateLogin(id, password) {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, password })
            });
            const data = await response.json();
            return data.success ? data.profile : false;
        } catch (e) {
            console.error('Database Error:', e);
            return false;
        }
    }

    // NOTIFICATIONS & REQUESTS
    async sendNotification(toId, fromId, type, data) {
        try {
            const fromProfile = await this.getProfile(fromId);
            const response = await fetch(`${API_URL}/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: toId,
                    from: fromId,
                    fromName: fromProfile ? fromProfile.name : 'Unknown',
                    type: type,
                    data: data
                })
            });
            return await response.json();
        } catch (e) {
            console.error('Database Error:', e);
            return null;
        }
    }

    async getNotifications(userId) {
        try {
            const response = await fetch(`${API_URL}/notifications/${userId}`);
            return await response.json();
        } catch (e) {
            console.error('Database Error:', e);
            return [];
        }
    }

    async getAllNotifications() {
        try {
            const response = await fetch(`${API_URL}/notifications`);
            return await response.json();
        } catch (e) {
            console.error('Database Error:', e);
            return [];
        }
    }

    async markAsRead(notifId) {
        try {
            await fetch(`${API_URL}/notifications/${notifId}/read`, {
                method: 'PUT'
            });
        } catch (e) {
            console.error('Database Error:', e);
        }
    }

    async deleteProfile(email) {
        try {
            await fetch(`${API_URL}/profiles/${email}`, {
                method: 'DELETE'
            });
        } catch (e) {
            console.error('Database Error:', e);
        }
    }

    async changePassword(id, oldPassword, newPassword) {
        try {
            const response = await fetch(`${API_URL}/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, oldPassword, newPassword })
            });
            const data = await response.json();
            if (!response.ok) return { error: data.error || 'Failed to change password' };
            return data;
        } catch (e) {
            console.error('Database Error:', e);
            return { error: 'Server error' };
        }
    }

    // CURRICULUM MANAGEMENT
    async getCurriculum() {
        try {
            const response = await fetch(`${API_URL}/curriculum`);
            return await response.json();
        } catch (e) {
            console.error('Database Error:', e);
            return {};
        }
    }

    async saveCurriculum(data) {
        try {
            const response = await fetch(`${API_URL}/curriculum`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (e) {
            console.error('Database Error:', e);
            return { error: 'Failed to save curriculum' };
        }
    }

    // SECTION MANAGEMENT
    async getSections() {
        try {
            const response = await fetch(`${API_URL}/sections`);
            return await response.json();
        } catch (e) {
            console.error('Database Error:', e);
            return {};
        }
    }

    async saveSections(data) {
        try {
            const response = await fetch(`${API_URL}/sections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (e) {
            console.error('Database Error:', e);
            return { error: 'Failed to save sections' };
        }
    }
}

const db = new FacultyDB();
window.db = db;

