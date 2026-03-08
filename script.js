let currentUser = null;
let token = null;

// ✅ Your actual Vercel backend URL
const API_BASE = 'https://lms-backend-kappa-kohl.vercel.app/api';

const loader = document.getElementById('loader');
const message = document.getElementById('message');
const authContainer = document.getElementById('auth-container');
const navbar = document.querySelector('.navbar');

// ─── Mobile Menu ─────────────────────────────────────────────────
function toggleMobileMenu() {
    document.getElementById('nav-menu').classList.toggle('active');
}

// ─── Loader ──────────────────────────────────────────────────────
function showLoader() { loader.style.display = 'block'; }
function hideLoader() { loader.style.display = 'none'; }

// ─── Messages ────────────────────────────────────────────────────
function showMessage(text, type = 'success') {
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    setTimeout(() => { message.style.display = 'none'; }, 5000);
}
function hideMessage() { message.style.display = 'none'; }

// ─── URL Builder ─────────────────────────────────────────────────
function buildUrl(endpoint) {
    const base = API_BASE.replace(/\/+$/, '');
    const path = endpoint.replace(/^\/+/, '');
    return `${base}/${path}`;
}

// ─── API Call ────────────────────────────────────────────────────
async function apiCall(method, endpoint, authToken = null, data = null) {
    showLoader();
    hideMessage();
    try {
        const config = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (authToken) config.headers['Authorization'] = `Bearer ${authToken}`;
        if (data) config.body = JSON.stringify(data);

        const url = buildUrl(endpoint);
        console.log(`🔍 ${method} ${url}`);
        const response = await fetch(url, config);

        const text = await response.text();
        console.log(`📡 ${response.status} raw:`, text);

        let result = {};
        if (text) {
            try { result = JSON.parse(text); }
            catch { throw new Error(`Server error (${response.status}). Check Vercel logs.`); }
        }
        if (!response.ok) throw new Error(result.detail || `HTTP ${response.status}`);
        hideLoader();
        return result;
    } catch (error) {
        hideLoader();
        console.error('❌ API Error:', error.message);
        showMessage(error.message, 'error');
        throw error;
    }
}

// ─── Page Routing ─────────────────────────────────────────────────
function hideAll() {
    document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.auth-form').forEach(el => el.classList.add('hidden'));
    document.getElementById('nav-menu').classList.remove('active');
}

function setNavbarVisible(visible) {
    navbar.style.display = visible ? 'block' : 'none';
}

function showLogin() {
    hideAll();
    setNavbarVisible(false);
    authContainer.classList.remove('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

function showSignup() {
    hideAll();
    setNavbarVisible(false);
    authContainer.classList.remove('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
}

function showDashboard() {
    hideAll();
    authContainer.classList.add('hidden');
    setNavbarVisible(true);
    document.getElementById('dashboard').classList.remove('hidden');
    loadDashboard();
}

function showCourses() {
    hideAll();
    authContainer.classList.add('hidden');
    setNavbarVisible(true);
    document.getElementById('courses').classList.remove('hidden');
    loadCourses();
}

function showMyCourses() {
    hideAll();
    authContainer.classList.add('hidden');
    setNavbarVisible(true);
    document.getElementById('my-courses').classList.remove('hidden');
    loadMyCourses();
}

function showProfile() {
    hideAll();
    authContainer.classList.add('hidden');
    setNavbarVisible(true);
    document.getElementById('profile').classList.remove('hidden');
    loadProfile();
}

function showCourseTopics(courseId, courseTitle) {
    hideAll();
    authContainer.classList.add('hidden');
    setNavbarVisible(true);
    document.getElementById('course-topics').classList.remove('hidden');
    document.getElementById('courseTopicTitle').textContent = courseTitle;
    loadTopics(courseId);
}

// ─── Auth Check ──────────────────────────────────────────────────
async function checkAuthStatus() {
    token = localStorage.getItem('token');
    if (token) {
        try {
            const user = await apiCall('GET', 'me', token);
            currentUser = user.logged_in_as;
            showDashboard();
        } catch {
            localStorage.removeItem('token');
            token = null;
            showLogin();
        }
    } else {
        showLogin();
    }
}

// ─── Event Listeners ─────────────────────────────────────────────
function initEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!loginForm || !signupForm || !mobileMenu) {
        setTimeout(initEventListeners, 100);
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = loginForm.querySelector('.btn-primary');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');
        btn.disabled = true;
        btnText.style.opacity = '0';
        btnLoader.style.display = 'inline-block';
        try {
            const response = await apiCall('POST', 'login', null, {
                email: document.getElementById('loginEmail').value.trim(),
                password: document.getElementById('loginPassword').value
            });
            token = response.access_token;
            currentUser = document.getElementById('loginEmail').value.trim();
            localStorage.setItem('token', token);
            showMessage('Login successful! Welcome back 👋', 'success');
            setTimeout(showDashboard, 800);
        } catch {
        } finally {
            btn.disabled = false;
            btnText.style.opacity = '1';
            btnLoader.style.display = 'none';
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('signupPassword').value;
        if (password.length < 8) {
            showMessage('Password must be at least 8 characters.', 'error');
            return;
        }
        const btn = signupForm.querySelector('.btn-primary');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');
        btn.disabled = true;
        btnText.style.opacity = '0';
        btnLoader.style.display = 'inline-block';
        try {
            await apiCall('POST', 'signup', null, {
                name: document.getElementById('signupName').value.trim(),
                email: document.getElementById('signupEmail').value.trim(),
                password
            });
            showMessage('Account created! Redirecting to login...', 'success');
            signupForm.reset();
            setTimeout(showLogin, 1500);
        } catch {
        } finally {
            btn.disabled = false;
            btnText.style.opacity = '1';
            btnLoader.style.display = 'none';
        }
    });

    mobileMenu.addEventListener('click', toggleMobileMenu);
    console.log('✅ Event listeners ready');
}

// ─── Dashboard ────────────────────────────────────────────────────
async function loadDashboard() {
    if (!token) return;
    try {
        const [coursesRes, myCoursesRes] = await Promise.all([
            apiCall('GET', 'courses', token),
            apiCall('GET', 'my-courses', token)
        ]);
        document.getElementById('totalCourses').textContent = Array.isArray(coursesRes) ? coursesRes.length : 0;
        document.getElementById('myCoursesCount').textContent = Array.isArray(myCoursesRes) ? myCoursesRes.length : 0;
        const subtitle = document.querySelector('#dashboard .page-header p');
        if (subtitle) subtitle.textContent = `Welcome back, ${currentUser} 👋`;
    } catch (err) {
        console.error('Dashboard load failed:', err);
    }
}

// ─── All Courses ──────────────────────────────────────────────────
async function loadCourses() {
    if (!token) return showLogin();
    const grid = document.getElementById('coursesGrid');
    grid.innerHTML = '<p style="color:white;text-align:center;grid-column:1/-1">Loading...</p>';
    try {
        const [courses, myCourses] = await Promise.all([
            apiCall('GET', 'courses', token),
            apiCall('GET', 'my-courses', token)
        ]);
        if (!Array.isArray(courses) || courses.length === 0) {
            grid.innerHTML = '<p style="color:white;text-align:center;grid-column:1/-1">No courses available.</p>';
            return;
        }
        const enrolledIds = Array.isArray(myCourses) ? myCourses.map(c => c.id) : [];
        grid.innerHTML = courses.map(course => {
            const enrolled = enrolledIds.includes(course.id);
            return `
            <div class="course-card">
                <div class="course-card-icon"><i class="fas fa-book-open"></i></div>
                <h3>${course.title}</h3>
                <button onclick="enrollCourse(${course.id}, this)" ${enrolled ? 'disabled' : ''}>
                    ${enrolled ? '✓ Enrolled' : 'Enroll Now'}
                </button>
            </div>`;
        }).join('');
    } catch {
        grid.innerHTML = '<p style="color:white;text-align:center;grid-column:1/-1">Failed to load courses.</p>';
    }
}

async function enrollCourse(courseId, btn) {
    if (!token) return showLogin();
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Enrolling...';
    try {
        await apiCall('POST', `enroll/${courseId}`, token);
        showMessage('Successfully enrolled! 🎉', 'success');
        btn.textContent = '✓ Enrolled';
    } catch {
        btn.disabled = false;
        btn.textContent = original;
    }
}

// ─── My Courses ───────────────────────────────────────────────────
async function loadMyCourses() {
    if (!token) return showLogin();
    const grid = document.getElementById('myCoursesGrid');
    grid.innerHTML = '<p style="color:white;text-align:center;grid-column:1/-1">Loading...</p>';
    try {
        const courses = await apiCall('GET', 'my-courses', token);
        if (!Array.isArray(courses) || courses.length === 0) {
            grid.innerHTML = `<p style="text-align:center;color:white;font-size:1.1rem;grid-column:1/-1">
                No enrolled courses yet.
                <a href="#" onclick="showCourses()" style="color:#ffd700;font-weight:600;"> Browse Courses →</a>
            </p>`;
            return;
        }
        grid.innerHTML = courses.map(course => {
            const progress = getProgress(course.id);
            return `
            <div class="course-card clickable" onclick="showCourseTopics(${course.id}, '${course.title.replace(/'/g, "\\'")}')">
                <div class="course-card-icon"><i class="fas fa-play-circle"></i></div>
                <h3>${course.title}</h3>
                <div class="enrolled-badge"><i class="fas fa-check-circle"></i> Enrolled</div>
                <div class="mini-progress">
                    <div class="mini-progress-fill" style="width:${progress}%"></div>
                </div>
                <p class="mini-progress-label">${progress}% complete — Click to view topics</p>
            </div>`;
        }).join('');
    } catch {
        grid.innerHTML = '<p style="color:white;text-align:center;grid-column:1/-1">Failed to load your courses.</p>';
    }
}

// ─── Topics & Progress ────────────────────────────────────────────

// Progress stored in localStorage per course per user
function getProgressKey(courseId) {
    return `progress_${currentUser}_${courseId}`;
}

function getCompletedTopics(courseId) {
    const key = getProgressKey(courseId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
}

function toggleTopicComplete(courseId, topicId, totalTopics) {
    const completed = getCompletedTopics(courseId);
    const idx = completed.indexOf(topicId);
    if (idx === -1) {
        completed.push(topicId);
    } else {
        completed.splice(idx, 1);
    }
    localStorage.setItem(getProgressKey(courseId), JSON.stringify(completed));
    updateProgressUI(courseId, completed.length, totalTopics);
}

function getProgress(courseId) {
    const completed = getCompletedTopics(courseId);
    // We don't know total here, just return 0 if nothing saved
    const key = `topiccount_${courseId}`;
    const total = parseInt(localStorage.getItem(key) || '0');
    if (!total) return 0;
    return Math.round((completed.length / total) * 100);
}

function updateProgressUI(courseId, completedCount, totalCount) {
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    if (fill) fill.style.width = `${percent}%`;
    if (text) text.textContent = `${percent}% Complete (${completedCount}/${totalCount} topics)`;
}

async function loadTopics(courseId) {
    const list = document.getElementById('topicsList');
    list.innerHTML = '<p style="color:white;text-align:center;">Loading topics...</p>';
    try {
        const data = await apiCall('GET', `courses/${courseId}/topics`, token);
        const topics = data.topics || [];

        // Save total count for progress calculation
        localStorage.setItem(`topiccount_${courseId}`, topics.length);

        const completed = getCompletedTopics(courseId);
        updateProgressUI(courseId, completed.length, topics.length);

        if (topics.length === 0) {
            list.innerHTML = `
                <div class="no-topics">
                    <i class="fas fa-inbox"></i>
                    <p>No topics added yet for this course.</p>
                </div>`;
            return;
        }

        list.innerHTML = topics.map((topic, index) => {
            const isDone = completed.includes(topic.id);
            const youtubeId = extractYoutubeId(topic.link);
            const thumbnail = youtubeId
                ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
                : null;

            return `
            <div class="topic-card ${isDone ? 'completed' : ''}" id="topic-card-${topic.id}">
                <div class="topic-left">
                    <div class="topic-number">${index + 1}</div>
                    ${thumbnail ? `
                    <div class="topic-thumbnail">
                        <img src="${thumbnail}" alt="thumbnail" onerror="this.style.display='none'">
                        <div class="play-overlay">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>` : ''}
                </div>
                <div class="topic-content">
                    <h3 class="topic-title">${topic.title}</h3>
                    <a href="${topic.link}" target="_blank" class="topic-link">
                        <i class="fab fa-youtube"></i> Watch on YouTube
                    </a>
                </div>
                <div class="topic-right">
                    <label class="checkbox-container">
                        <input type="checkbox" 
                            ${isDone ? 'checked' : ''} 
                            onchange="toggleTopicComplete(${courseId}, ${topic.id}, ${topics.length})">
                        <span class="checkmark"></span>
                    </label>
                    <span class="topic-status">${isDone ? 'Done' : 'Pending'}</span>
                </div>
            </div>`;
        }).join('');

        // Update card styling on checkbox change
        topics.forEach(topic => {
            const checkbox = document.querySelector(`#topic-card-${topic.id} input[type=checkbox]`);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    const card = document.getElementById(`topic-card-${topic.id}`);
                    const statusEl = card.querySelector('.topic-status');
                    if (checkbox.checked) {
                        card.classList.add('completed');
                        statusEl.textContent = 'Done';
                    } else {
                        card.classList.remove('completed');
                        statusEl.textContent = 'Pending';
                    }
                });
            }
        });

    } catch {
        list.innerHTML = '<p style="color:white;text-align:center;">Failed to load topics.</p>';
    }
}

// Extract YouTube video ID from URL
function extractYoutubeId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// ─── Profile ──────────────────────────────────────────────────────
async function loadProfile() {
    if (!token || !currentUser) return showLogin();
    try {
        const user = await apiCall('GET', `users/${encodeURIComponent(currentUser)}`, token);
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profileEmail').textContent = user.email;
    } catch {
        showMessage('Failed to load profile.', 'error');
    }
}

function editProfile() {
    showMessage('Edit profile feature coming soon!', 'success');
}

async function deleteAccount() {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    try {
        await apiCall('DELETE', `users/${encodeURIComponent(currentUser)}`, token);
        showMessage('Account deleted.', 'success');
        logout();
    } catch {
        showMessage('Failed to delete account.', 'error');
    }
}

// ─── Logout ───────────────────────────────────────────────────────
function logout() {
    currentUser = null;
    token = null;
    localStorage.removeItem('token');
    showLogin();
}

// ─── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App starting...');
    initEventListeners();
    checkAuthStatus();
});