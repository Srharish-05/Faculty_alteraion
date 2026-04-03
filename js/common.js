/**
 * FacultySync - Common UI Logic
 * Handles sidebar injection, navbar updates, and session management across all pages.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Session Check
    try {
        if (typeof db !== 'undefined') {
            const currentUser = await db.getCurrentUser();
            const currentPage = window.location.pathname.split('/').pop();

            if (!currentUser && currentPage !== 'index.html' && currentPage !== '') {
                window.location.href = 'index.html';
                return;
            }

            // 1.5 Admin Redirection: If admin, they shouldn't be on faculty pages
            const isAdmin = currentUser && currentUser.role === 'admin';
            const isHod = currentUser && currentUser.role === 'hod';
            const facultyOnlyPages = ['dashboard.html', 'leave-history.html'];

            if (isAdmin && facultyOnlyPages.includes(currentPage)) {
                window.location.href = 'admin-dashboard.html';
                return;
            }

            // HOD is allowed on dashboard.html for now, but we can also treat them like faculty
            // If you want HOD to have their own dashboard eventually, you'd add it here.

            // 2. Update UI with User Info
            if (currentUser) {
                updateUserUI(currentUser);
                await updateNotificationBadge(currentUser.id);
                if (isAdmin) simplifyUIForAdmin();
                if (isHod) simplifyUIForHOD();
            }
        }
    } catch (e) {
        console.error("Session Check Failed:", e);
    }

    // 3. Highlight Active Link in Sidebar
    highlightActiveLink();

    // 4. Profile Dropdown Logic
    const profilePill = document.getElementById('profilePill');
    const profileMenu = document.getElementById('profileMenu');
    if (profilePill && profileMenu) {
        // Inject Change Password link before Logout
        const logoutLink = profileMenu.querySelector('a[onclick*="handleLogout"]');
        if (logoutLink) {
            logoutLink.classList.add('logout-link');
            const divider = document.createElement('div');
            divider.className = 'dropdown-divider';
            const cpLink = document.createElement('a');
            cpLink.href = '#';
            cpLink.innerHTML = '<i class="fas fa-key"></i> Change Password';
            cpLink.onclick = (e) => { e.preventDefault(); openChangePasswordModal(); };
            logoutLink.parentNode.insertBefore(cpLink, logoutLink);
            logoutLink.parentNode.insertBefore(divider, logoutLink);
        }

        profilePill.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!profilePill.contains(e.target) && !profileMenu.contains(e.target)) {
                profileMenu.classList.remove('active');
            }
        });
    }

    // Inject Change Password Modal into page
    injectChangePasswordModal();

    // 5. Command Search Shortcut (unique feature)
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('.command-search');
            if (searchInput) searchInput.focus();
        }
    });

    // 7. Mobile Navigation Toggle
    const mobileToggle = document.getElementById('mobileNavToggle');
    const nav = document.querySelector('.navbar');
    if (mobileToggle && nav) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            nav.classList.toggle('mobile-nav-open');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (nav.classList.contains('mobile-nav-open') && !nav.contains(e.target)) {
                nav.classList.remove('mobile-nav-open');
            }
        });

        // Close menu when clicking links
        const navLinks = nav.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('mobile-nav-open');
            });
        });
    }

    // 8. Page Transition: Entry
    try {
        setTimeout(() => {
            document.body.classList.add('page-loaded');
        }, 20);
    } catch (e) {
        document.body.style.opacity = '1';
        document.body.style.transform = 'none';
    }

    // 9. Page Transition: Exit
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        const target = link.getAttribute('target');

        // Orchestrate transition for internal portal links
        if (href && !href.startsWith('http') && !href.startsWith('#') && target !== '_blank' && !e.ctrlKey && !e.metaKey) {
            // Don't trigger transition if it's just a logout or specifically marked as no-transition
            if (href === '#' || link.onclick) return;

            e.preventDefault();
            document.body.classList.add('page-leaving');

            setTimeout(() => {
                window.location.href = href;
            }, 350); // Matches CSS transition duration (0.4s) minus a small buffer
        }
    });
});

function updateUserUI(user) {
    const nameEls = document.querySelectorAll('#user-display-name, #current-user-name, #user-nav-name, #user-dropdown-name');
    const avatarEls = document.querySelectorAll('#user-initials, #quick-user-avatar, #user-nav-avatar, #user-dropdown-avatar');
    const roleEls = document.querySelectorAll('#user-nav-role, #user-dropdown-role');

    nameEls.forEach(el => el.innerText = user.name);

    if (avatarEls.length > 0) {
        avatarEls.forEach(el => {
            if (user.photo) {
                el.innerHTML = `<img src="${user.photo}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                el.style.background = 'transparent';
            } else {
                el.innerHTML = `<i class="fas fa-user-circle" style="font-size: 1.25rem; opacity: 0.8;"></i>`;
                el.style.background = 'var(--primary-light)';
            }
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
        });
    }

    roleEls.forEach(el => el.innerText = user.desig || 'Faculty');
}

/**
 * Hides faculty-specific UI elements for admin users
 */
function simplifyUIForAdmin() {
    // Redirect Dashboard links to admin version and update labels
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const text = link.innerText.trim();
        if (text.includes('Dashboard')) {
            link.href = 'admin-dashboard.html';
            link.innerHTML = '<i class="fas fa-chart-pie"></i> Admin Dashboard';
        }
        if (text.includes('Leave History')) {
            link.style.display = 'none';
        }
    });

    // Hide Request Leave button on all pages
    const leaveBtns = document.querySelectorAll('button[onclick*="openLeaveModal"]');
    leaveBtns.forEach(btn => btn.style.display = 'none');

    // Hide specific dashboard stat blocks if they exist on the FACULTY dashboard only
    // Note: must NOT match 'admin-dashboard.html' — use endsWith for exact page match
    const currentPath = window.location.pathname;
    const isOnFacultyDashboard = currentPath.endsWith('/dashboard.html') || currentPath === 'dashboard.html';
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length > 0 && isOnFacultyDashboard) {
        // Redundancy check if redirect fails
        const mc = document.querySelector('.main-content');
        if (mc) mc.innerHTML = '<div style="padding: 4rem; text-align:center;">Redirecting to Admin Dashboard...</div>';
    }
}

/**
 * Redirects HOD to notifications and hides unnecessary faculty features
 */
function simplifyUIForHOD() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();

    // 1. Redirection: HOD primary focus is approvals
    if (currentPage === 'dashboard.html' || currentPage === 'leave-history.html') {
        window.location.href = 'notifications.html';
        return;
    }

    // 2. Hide restricted navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const text = link.innerText.trim();
        if (text.includes('Dashboard') || text.includes('Leave History')) {
            link.style.display = 'none';
        }
    });

    // 3. Hide Request Leave buttons
    const leaveBtns = document.querySelectorAll('button[onclick*="openLeaveModal"]');
    leaveBtns.forEach(btn => btn.style.display = 'none');
}

function highlightActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.nav-link, .sidebar-link, .profile-dropdown-menu a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        } else {
            // Special case for dashboard
            if (currentPage === 'dashboard.html' && href === 'dashboard.html') link.classList.add('active');
            else link.classList.remove('active');
        }
    });
}

/**
 * Log out the user and redirect to login page
 */
function handleLogout() {
    if (typeof db !== 'undefined') {
        db.logout();
    }
    window.location.href = 'index.html';
}

/**
 * Update the notification badge count in the sidebar
 */
async function updateNotificationBadge(userId) {
    if (typeof db === 'undefined') return;

    const notifs = await db.getNotifications(userId);
    const unreadCount = notifs.filter(n => !n.read).length;

    const badges = document.querySelectorAll('.notif-badge');
    badges.forEach(badge => {
        if (unreadCount > 0) {
            badge.innerText = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    });
}

// ============================================
// Toast Notification System
// ============================================

function initToastContainer() {
    if (document.querySelector('.toast-container')) return;
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
}

/**
 * Show a professional toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'warning', or 'info'
 */
function showToast(message, type = 'info') {
    initToastContainer();
    const container = document.querySelector('.toast-container');

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icon}"></i></div>
        <div class="toast-message">${message}</div>
        <div class="toast-close"><i class="fas fa-times"></i></div>
        <div class="toast-progress"></div>
    `;

    container.appendChild(toast);

    const closeToast = () => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast-close').onclick = (e) => {
        e.stopPropagation();
        closeToast();
    };

    // Auto-remove after 4 seconds
    const timeout = setTimeout(closeToast, 4000);

    toast.onclick = () => {
        clearTimeout(timeout);
        closeToast();
    };
}

// Override native alert for consistency
window.alert = (msg) => showToast(msg, 'info');

// ============================================
// Change Password Modal
// ============================================

function injectChangePasswordModal() {
    if (document.getElementById('changePasswordModal')) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'changePasswordModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 420px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.25rem; margin: 0;">Change Password</h2>
                <button onclick="closeChangePasswordModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
            </div>
            <form id="changePasswordForm" onsubmit="handleChangePassword(event)">
                <div class="form-group" style="margin-bottom: 1.25rem;">
                    <label class="form-label">Current Password</label>
                    <input type="password" id="cpOldPass" class="form-input" required placeholder="Enter current password">
                </div>
                <div class="form-group" style="margin-bottom: 1.25rem;">
                    <label class="form-label">New Password</label>
                    <input type="password" id="cpNewPass" class="form-input" required placeholder="Enter new password" minlength="6">
                </div>
                <div class="form-group" style="margin-bottom: 2rem;">
                    <label class="form-label">Confirm New Password</label>
                    <input type="password" id="cpConfirmPass" class="form-input" required placeholder="Confirm new password" minlength="6">
                </div>
                <div id="cpError" style="color: var(--danger); font-size: 0.8125rem; margin-bottom: 1rem; display: none;"></div>
                <div style="display: flex; gap: 1rem;">
                    <button type="button" class="btn btn-secondary w-full" onclick="closeChangePasswordModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary w-full">Update Password</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.classList.add('active');
        const form = document.getElementById('changePasswordForm');
        if (form) form.reset();
        const err = document.getElementById('cpError');
        if (err) err.style.display = 'none';
    }
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) modal.classList.remove('active');
}

async function handleChangePassword(e) {
    e.preventDefault();
    const oldPass = document.getElementById('cpOldPass').value;
    const newPass = document.getElementById('cpNewPass').value;
    const confirmPass = document.getElementById('cpConfirmPass').value;
    const errorEl = document.getElementById('cpError');

    errorEl.style.display = 'none';

    if (newPass !== confirmPass) {
        errorEl.textContent = 'New passwords do not match.';
        errorEl.style.display = 'block';
        return;
    }

    if (newPass.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters.';
        errorEl.style.display = 'block';
        return;
    }

    const currentUser = await db.getCurrentUser();
    if (!currentUser) {
        errorEl.textContent = 'Session expired. Please log in again.';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const result = await db.changePassword(currentUser.id, oldPass, newPass);
        if (result && result.error) {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
        } else if (result && result.success) {
            closeChangePasswordModal();
            showToast('Password changed successfully!', 'success');
        } else {
            errorEl.textContent = 'Unexpected response. Please try again.';
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.style.display = 'block';
    }
}


// End of common.js
