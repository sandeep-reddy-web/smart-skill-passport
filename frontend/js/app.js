// Smart Skill Passport - Main Application Logic

// API Configuration
const API_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupNavigationToggle();
    setupAuthentication();
    loadUserData();
    setupRouting();
}

// ===========================
// Navigation Toggle (Mobile)
// ===========================

function setupNavigationToggle() {
    const toggle = document.querySelector('.navbar-toggle');
    const menu = document.getElementById('navbarMenu');

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
            });
        });
    }
}

// ===========================
// Authentication Management
// ===========================

function setupAuthentication() {
    const token = localStorage.getItem(TOKEN_KEY);
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');

    if (token && isTokenValid(token)) {
        // User is logged in
        updateNavbarForLoggedInUser();
    } else {
        // User is not logged in
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
}

function isTokenValid(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

function updateNavbarForLoggedInUser() {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    const authLinks = document.querySelector('.navbar-menu');

    if (authLinks) {
        // Remove login/signup buttons
        const loginBtn = authLinks.querySelector('.btn-login');
        const signupBtn = authLinks.querySelector('.btn-signup');
        if (loginBtn) loginBtn.remove();
        if (signupBtn) signupBtn.remove();

        // Add user menu
        const userMenu = document.createElement('li');
        userMenu.innerHTML = `
            <div class="user-menu">
                <span class="user-name">${user.first_name || 'User'}</span>
                <div class="dropdown-menu">
                    <a href="pages/profile.html">My Profile</a>
                    <a href="pages/dashboard.html">Dashboard</a>
                    <a href="pages/settings.html">Settings</a>
                    <hr>
                    <a href="#" onclick="logout()">Logout</a>
                </div>
            </div>
        `;
        authLinks.appendChild(userMenu);
    }
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'pages/homepage.html';
}

// ===========================
// User Data Management
// ===========================

function loadUserData() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && isTokenValid(token)) {
        fetchUserProfile();
    }
}

async function fetchUserProfile() {
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const user = await response.json();
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            dispatchEvent(new CustomEvent('user-loaded', { detail: user }));
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
}

// ===========================
// API Request Helpers
// ===========================

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired
                logout();
                throw new Error('Session expired. Please login again.');
            }
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// ===========================
// Form Validation
// ===========================

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    // Minimum 8 characters, at least one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

function validatePhoneNumber(phone) {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
}

function validateForm(formElement) {
    const formData = new FormData(formElement);
    const errors = [];

    for (const [field, value] of formData) {
        if (!value.trim()) {
            errors.push(`${field} is required`);
        }

        if (field === 'email' && !validateEmail(value)) {
            errors.push('Invalid email address');
        }

        if (field === 'password' && value && !validatePassword(value)) {
            errors.push('Password must be at least 8 characters with uppercase, lowercase, and numbers');
        }

        if (field === 'phone' && value && !validatePhoneNumber(value)) {
            errors.push('Invalid phone number');
        }
    }

    return { valid: errors.length === 0, errors };
}

// ===========================
// UI Utilities
// ===========================

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} fade-in`;
    alertDiv.innerHTML = `
        <i class="fas fa-${getAlertIcon(type)}"></i>
        <span>${message}</span>
    `;

    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function showLoader(element) {
    element.innerHTML = '<div class="loader"></div>';
}

function hideLoader() {
    const loader = document.querySelector('.loader');
    if (loader) loader.remove();
}

// ===========================
// Routing Setup
// ===========================

function setupRouting() {
    // Basic client-side routing
    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange();
}

function handleRouteChange() {
    const hash = window.location.hash.slice(1);
    const app = document.getElementById('app');

    if (!app) return;

    // Route handlers
    const routes = {
        'home': '/pages/homepage.html',
        'profile': '/pages/profile.html',
        'dashboard': '/pages/dashboard.html',
        'skills': '/pages/skills.html',
        'certificates': '/pages/certificates.html',
    };

    if (hash && routes[hash]) {
        // Load page via AJAX
        fetch(routes[hash])
            .then(r => r.text())
            .then(html => {
                app.innerHTML = html;
            })
            .catch(() => {
                app.innerHTML = '<p>Page not found</p>';
            });
    }
}

// ===========================
// Export & Sharing
// ===========================

function downloadPDF(filename) {
    // This will be implemented with a PDF library
    console.log(`Downloading PDF: ${filename}`);
}

function shareLink(url) {
    if (navigator.share) {
        navigator.share({
            title: 'Smart Skill Passport',
            text: 'Check out my professional skill passport!',
            url: url
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url);
        showAlert('Link copied to clipboard!', 'success');
    }
}

// ===========================
// Event Listeners
// ===========================

// Prevent form submission for demo
document.addEventListener('submit', (e) => {
    if (e.target.dataset.ajaxForm) {
        e.preventDefault();
        // Handle form submission
    }
});

// ===========================
// Utility Functions
// ===========================

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function truncateText(text, length = 100) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

// Export functions for use in other modules
window.app = {
    apiRequest,
    validateEmail,
    validatePassword,
    validateForm,
    showAlert,
    showLoader,
    hideLoader,
    downloadPDF,
    shareLink,
    formatDate,
    formatCurrency,
    truncateText,
    debounce,
    logout
};
