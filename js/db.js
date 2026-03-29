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

    // Create fetch with timeout
    async fetchWithTimeout(url, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || `HTTP ${response.status}`);
            }
            
            return response;
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }

    // DATA OPERATIONS
    async getProfile(email) {
        try {
            const token = localStorage.getItem('facultySync_token');
            const response = await this.fetchWithTimeout(`${API_URL}/profiles/${email}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            return await response.json();
        } catch (e) {
            console.error('Get Profile Error:', e.message);
            return null;
        }
    }

    async saveProfile(email, data) {
        try {
            const token = localStorage.getItem('facultySync_token');
            const response = await this.fetchWithTimeout(`${API_URL}/profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ ...data, id: email })
            });
            return await response.json();
        } catch (e) {
            console.error('Save Profile Error:', e.message);
            return { error: 'Failed to save profile' };
        }
    }

    async getAllFaculties() {
        try {
            const token = localStorage.getItem('facultySync_token');
            const response = await this.fetchWithTimeout(`${API_URL}/profiles`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            return await response.json();
        } catch (e) {
            console.error('Get Faculties Error:', e.message);
            return [];
        }
    }

    async validateLogin(id, password) {
        try {
            const response = await this.fetchWithTimeout(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, password })
            });
            const data = await response.json();
            
            if (data.success && data.token) {
                // Store JWT token
                localStorage.setItem('facultySync_token', data.token);
                return data.profile;
            }
            return false;
        } catch (e) {
            console.error('Login Error:', e.message);
            return false;
        }
    }

    // NOTIFICATIONS & REQUESTS
    async sendNotification(toId, fromId, type, data) {
        try {
            const fromProfile = await this.getProfile(fromId);
            const token = localStorage.getItem('facultySync_token');
            const response = await this.fetchWithTimeout(`${API_URL}/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    to: toId,
                    from: fromId,
                    fromName: fromProfile ? fromProfile.name : 'Unknown',
                    type: type,
                    message: data.message || '',
                    data: data,  // Pass full data object with all details (subject, day, period, section, year, cellId, etc.)
                    timestamp: new Date().toISOString()
                })
            });
            return await response.json();
        } catch (e) {
            console.error('Send Notification Error:', e.message);
            return null;
        }
    }

    async getNotifications(userId) {
        try {
            const token = localStorage.getItem('facultySync_token');
            const response = await this.fetchWithTimeout(`${API_URL}/notifications/${userId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            return await response.json();
        } catch (e) {
            console.error('Get Notifications Error:', e.message);
            return [];
        }
    }

    async getAllNotifications() {
        try {
            const token = localStorage.getItem('facultySync_token');
            const response = await this.fetchWithTimeout(`${API_URL}/notifications`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            return await response.json();
        } catch (e) {
            console.error('Get All Notifications Error:', e.message);
            return [];
        }
    }

    async markAsRead(notifId) {
        try {
            const token = localStorage.getItem('facultySync_token');
            await this.fetchWithTimeout(`${API_URL}/notifications/${notifId}/read`, {
                method: 'PUT',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
        } catch (e) {
            console.error('Mark as Read Error:', e.message);
        }
    }

    async deleteProfile(email) {
        try {
            const token = localStorage.getItem('facultySync_token');
            await this.fetchWithTimeout(`${API_URL}/profiles/${email}`, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
        } catch (e) {
            console.error('Delete Profile Error:', e.message);
        }
    }

    async changePassword(id, oldPassword, newPassword) {
        try {
            const token = localStorage.getItem('facultySync_token');
            const response = await this.fetchWithTimeout(`${API_URL}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ id, oldPassword, newPassword })
            });
            const data = await response.json();
            return data;
        } catch (e) {
            console.error('Change Password Error:', e.message);
            return { error: e.message || 'Server error' };
        }
    }

    // CURRICULUM MANAGEMENT
    async getCurriculum() {
        try {
            const token = localStorage.getItem('facultySync_token');
            const response = await this.fetchWithTimeout(`${API_URL}/curriculum`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            return await response.json();
        } catch (e) {
            console.error('Get Curriculum Error:', e.message);
            return {};
        }
    }

    async saveCurriculum(data) {
        try {
            const token = localStorage.getItem('facultySync_token');
            const response = await this.fetchWithTimeout(`${API_URL}/curriculum`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (e) {
            console.error('Save Curriculum Error:', e.message);
            return { error: 'Failed to save curriculum' };
        }
    }

    // SECTION MANAGEMENT
    async getSections() {
        try {
            const token = localStorage.getItem('facultySync_token');
            const response = await this.fetchWithTimeout(`${API_URL}/sections`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            return await response.json();
        } catch (e) {
            console.error('Get Sections Error:', e.message);
            return {};
        }
    }

    async saveSections(data) {
        try {
            const token = localStorage.getItem('facultySync_token');
            const response = await this.fetchWithTimeout(`${API_URL}/sections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (e) {
            console.error('Save Sections Error:', e.message);
            return { error: 'Failed to save sections' };
        }
    }
}

const db = new FacultyDB();
window.db = db;

