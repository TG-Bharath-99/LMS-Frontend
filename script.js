let currentUser = null;
let token = null;
let currentCourseId = null;

// ✅ FIXED FOR DEPLOYMENT: Use Vercel backend URL
const API_BASE = 'https://lms-backend-kappa-kohl.vercel.app/api';

const loader = document.getElementById('loader');
const message = document.getElementById('message');
const authContainer = document.getElementById('auth-container');
const sidebar = document.getElementById('sidebar');

// Motivation messages
const motivationMessages = [
    "🔥 Great job! Keep that momentum going!",
    "⭐ One step closer to mastery!",
    "💪 You're crushing it! Stay focused!",
    "🚀 Amazing progress! The finish line is getting closer!",
    "🎯 Nailed it! Every topic brings you closer to your goal!",
    "🏆 Champions are built one lesson at a time!",
    "✨ Fantastic! Your dedication is paying off!",
    "🌟 Keep going — you're building something great!",
    "💡 Knowledge unlocked! You're on fire!",
    "🎉 Well done! Consistency is the key to success!",
];

function getRandomMotivation() {
    return motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
}

// ─── Mobile Menu ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
});

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

// ─── Motivation Toast ─────────────────────────────────────────────
function showMotivationToast(text) {
    const toast = document.getElementById('motivationToast');
    const toastText = document.getElementById('motivationText');
    toastText.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// ─── URL Builder ─────────────────────────────────────────────────
function buildUrl(endpoint) {
    const base = API_BASE.replace(/\/+$/, '');
    const path = endpoint.replace(/^\/+/, '');
    return `${base}/${path}`;
}

// ─── API Call ────────────────────────────────────────────────────
async function apiCall(method, endpoint, authToken = null, data = null) {
    showLoader();
    try {
        const config = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (authToken) config.headers['Authorization'] = `Bearer ${authToken}`;
        if (data) config.body = JSON.stringify(data);

        const url = buildUrl(endpoint);
        const response = await fetch(url, config);
        const text = await response.text();

        let result = {};
        if (text) {
            try { result = JSON.parse(text); }
            catch { throw new Error(`Server error (${response.status}).`); }
        }
        if (!response.ok) throw new Error(result.detail || `HTTP ${response.status}`);
        hideLoader();
        return result;
    } catch (error) {
        hideLoader();
        showMessage(error.message, 'error');
        throw error;
    }
}

// ─── Page Routing ─────────────────────────────────────────────────
function hideAll() {
    document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.auth-form').forEach(el => el.classList.add('hidden'));
    if (sidebar) sidebar.classList.remove('active');
    updateActiveNav('');
}

function updateActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (page) {
        const activeItem = document.querySelector(`[onclick="show${page}()"]`);
        if (activeItem) activeItem.classList.add('active');
    }
}

function showLogin() {
    hideAll();
    authContainer.classList.remove('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

function showSignup() {
    hideAll();
    authContainer.classList.remove('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
}

function showDashboard() {
    hideAll();
    authContainer.classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    updateActiveNav('Dashboard');
    loadDashboard();
}

function showCourses() {
    hideAll();
    authContainer.classList.add('hidden');
    document.getElementById('courses').classList.remove('hidden');
    updateActiveNav('Courses');
    loadCourses();
}

function showMyCourses() {
    hideAll();
    authContainer.classList.add('hidden');
    document.getElementById('my-courses').classList.remove('hidden');
    updateActiveNav('MyCourses');
    loadMyCourses();
}

function showProfile() {
    hideAll();
    authContainer.classList.add('hidden');
    document.getElementById('profile').classList.remove('hidden');
    updateActiveNav('Profile');
    loadProfile();
}

function showCourseTopics(courseId, courseTitle) {
    hideAll();
    authContainer.classList.add('hidden');
    currentCourseId = courseId;
    document.getElementById('course-topics').classList.remove('hidden');
    document.getElementById('courseTopicTitle').textContent = courseTitle;
    loadTopics(courseId);
}

// ─── Auth ─────────────────────────────────────────────────────────
async function checkAuthStatus() {
    token = localStorage.getItem('token');
    if (token) {
        try {
            const user = await apiCall('GET', 'me', token);
            currentUser = user.logged_in_as;
            updateUserProfile();
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

function updateUserProfile() {
    if (!currentUser) return;
    const firstName = currentUser.split('@')[0].charAt(0).toUpperCase();
    const avatar = document.querySelector('.avatar');
    if (avatar) avatar.textContent = firstName;
    
    const headerUserName = document.getElementById('headerUserName');
    const headerUserEmail = document.getElementById('headerUserEmail');
    if (headerUserName) headerUserName.textContent = currentUser;
    if (headerUserEmail) headerUserEmail.textContent = currentUser;
}

function initEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (!loginForm || !signupForm) {
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
            updateUserProfile();
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
}

// ─── Dashboard ────────────────────────────────────────────────────
async function loadDashboard() {
    if (!token) return;
    try {
        const [coursesRes, myCoursesRes] = await Promise.all([
            apiCall('GET', 'courses', token),
            apiCall('GET', 'my-courses', token)
        ]);
        
        const courses = Array.isArray(coursesRes) ? coursesRes : [];
        const myCourses = Array.isArray(myCoursesRes) ? myCoursesRes : [];
        
        // Calculate stats
        let totalTopicsDone = 0;
        let totalTopics = 0;
        let completedCourses = 0;
        let activeCourse = null;
        let maxProgress = 0;
        
        for (const course of myCourses) {
            const progress = getProgress(course.id);
            const completed = getCompletedTopics(course.id);
            const total = parseInt(localStorage.getItem(`topiccount_${course.id}`) || '0');
            
            totalTopicsDone += completed.length;
            totalTopics += total;
            
            if (progress >= 70) {
                completedCourses++;
            }
            
            if (progress > maxProgress) {
                maxProgress = progress;
                activeCourse = { id: course.id, title: course.title, progress };
            }
        }
        
        // Update status cards
        document.getElementById('topicsDoneCount').textContent = totalTopicsDone;
        document.getElementById('topicsDetail').textContent = `of ${totalTopics} total`;
        document.getElementById('enrolledCount').textContent = myCourses.length;
        document.getElementById('completedCount').textContent = completedCourses;
        
        // Show continue section if there's an active course
        const continueSection = document.getElementById('continueSection');
        if (activeCourse && maxProgress < 100) {
            document.getElementById('continueCourseTitle').textContent = activeCourse.title;
            document.getElementById('continueProgressFill').style.width = `${activeCourse.progress}%`;
            document.getElementById('continueProgressText').textContent = 
                `${activeCourse.progress}% • ${getCompletedTopics(activeCourse.id).length} topics done`;
            continueSection.style.display = 'block';
        }
        
        // Load courses table
        loadCoursesTable(myCourses, maxProgress < 100);
    } catch (err) {
        console.error(err);
    }
}

function resumeCourse() {
    if (!currentCourseId) {
        // Find the active course
        const activeCourse = JSON.parse(localStorage.getItem('activeCourse') || 'null');
        if (activeCourse) {
            showCourseTopics(activeCourse.id, activeCourse.title);
        }
    } else {
        showCourseTopics(currentCourseId, document.getElementById('courseTopicTitle').textContent);
    }
}

async function loadCoursesTable(courses, showActive = true) {
    const container = document.getElementById('coursesTableContainer');
    
    if (!courses || courses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-graduation-cap"></i>
                <p>No enrolled courses yet.</p>
                <a href="#" onclick="showCourses()" class="empty-cta">Browse Courses →</a>
            </div>`;
        return;
    }
    
    let html = '<div class="table-header">';
    html += '<div>#</div>';
    html += '<div>COURSE NAME</div>';
    html += '<div>PROGRESS</div>';
    html += '<div>STATUS</div>';
    html += '<div>ACTION</div>';
    html += '</div>';
    
    courses.forEach((course, index) => {
        const progress = getProgress(course.id);
        const completed = getCompletedTopics(course.id);
        const total = parseInt(localStorage.getItem(`topiccount_${course.id}`) || '1');
        const status = progress >= 70 ? 'completed' : 'in-progress';
        
        html += '<div class="table-row">';
        html += `<div class="table-number">${index + 1}</div>`;
        html += `<div class="table-course">`;
        html += `<div class="course-badge"></div>`;
        html += `<div class="course-name">${escapeHtml(course.title)}</div>`;
        html += `</div>`;
        html += `<div class="progress-inline">`;
        html += `<div class="progress-bar-inline" style="--progress: ${progress}%"></div>`;
        html += `<span>${progress}%</span>`;
        html += `</div>`;
        html += `<div class="status-badge ${status}">`;
        html += status === 'completed' ? 'Completed' : 'In Progress';
        html += `</div>`;
        html += `<div class="table-action">`;
        html += `<button class="btn-open" onclick="showCourseTopics(${course.id}, '${escapeHtml(course.title).replace(/'/g, "\\'")}')">`;
        html += `<i class="fas fa-play"></i> Open`;
        html += `</button>`;
        html += `</div>`;
        html += '</div>';
    });
    
    container.innerHTML = html;
}

// ─── ENROLLMENT LOGIC ─────────────────────────────────────────────
function getEnrollmentStatus(enrolledCourses) {
    if (!enrolledCourses || enrolledCourses.length === 0) {
        return { canEnrollNew: true, activeCourseId: null, activeCourseName: null };
    }

    const activeCourse = enrolledCourses.find(course => {
        const progress = getProgress(course.id);
        return progress < 70;
    });

    if (activeCourse) {
        const progress = getProgress(activeCourse.id);
        return {
            canEnrollNew: false,
            activeCourseId: activeCourse.id,
            activeCourseName: activeCourse.title,
            activeProgress: progress
        };
    }

    return { canEnrollNew: true, activeCourseId: null, activeCourseName: null };
}

// ─── All Courses ──────────────────────────────────────────────────
async function loadCourses() {
    if (!token) return showLogin();
    const grid = document.getElementById('coursesGrid');
    grid.innerHTML = '<p class="loading-text">Loading courses...</p>';
    try {
        const [courses, myCourses] = await Promise.all([
            apiCall('GET', 'courses', token),
            apiCall('GET', 'my-courses', token)
        ]);

        if (!Array.isArray(courses) || courses.length === 0) {
            grid.innerHTML = '<p class="loading-text">No courses available.</p>';
            return;
        }

        const enrolledIds = Array.isArray(myCourses) ? myCourses.map(c => c.id) : [];
        const status = getEnrollmentStatus(Array.isArray(myCourses) ? myCourses : []);

        const hint = document.getElementById('enrollHint');
        if (hint) {
            if (!status.canEnrollNew && status.activeCourseId) {
                hint.textContent = `Complete 70% of "${status.activeCourseName}" to unlock next enrollment`;
            } else if (enrolledIds.length === 0) {
                hint.textContent = 'Enroll in your first course to get started!';
            } else {
                hint.textContent = 'All current courses are 70%+ complete — enroll in a new one!';
            }
        }

        grid.innerHTML = courses.map(course => {
            const enrolled = enrolledIds.includes(course.id);
            const progress = getProgress(course.id);
            const canEnroll = enrolled || status.canEnrollNew;

            if (enrolled) {
                return `
                <div class="course-card">
                    <div class="course-header">📚</div>
                    <div class="course-body">
                        <h3 class="course-title">${escapeHtml(course.title)}</h3>
                        <p class="course-meta">
                            <span>${progress}% Complete</span>
                            <span>•</span>
                            <span>${getCompletedTopics(course.id).length} topics</span>
                        </p>
                        <button class="btn-primary" disabled>
                            <i class="fas fa-check"></i> Enrolled
                        </button>
                    </div>
                </div>`;
            }

            if (!canEnroll) {
                return `
                <div class="course-card">
                    <div class="course-header" style="opacity: 0.5;">🔒</div>
                    <div class="course-body">
                        <h3 class="course-title">${escapeHtml(course.title)}</h3>
                        <p class="course-meta" style="color: var(--text-muted);">
                            Complete "${status.activeCourseName}" first
                        </p>
                        <button class="btn-primary" disabled>
                            <i class="fas fa-lock"></i> Locked
                        </button>
                    </div>
                </div>`;
            }

            return `
            <div class="course-card">
                <div class="course-header">📖</div>
                <div class="course-body">
                    <h3 class="course-title">${escapeHtml(course.title)}</h3>
                    <p class="course-meta">
                        <i class="fas fa-star"></i> Ready to learn
                    </p>
                    <button class="btn-primary" onclick="enrollCourse(${course.id}, this)">
                        <i class="fas fa-plus-circle"></i> Enroll Now
                    </button>
                </div>
            </div>`;
        }).join('');

    } catch {
        grid.innerHTML = '<p class="loading-text">Failed to load courses.</p>';
    }
}

async function enrollCourse(courseId, btn) {
    if (!token) return showLogin();
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enrolling...';
    try {
        await apiCall('POST', `enroll/${courseId}`, token);
        showMessage('Successfully enrolled! 🎉', 'success');
        setTimeout(loadCourses, 800);
    } catch {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

// ─── My Courses ───────────────────────────────────────────────────
async function loadMyCourses() {
    if (!token) return showLogin();
    const grid = document.getElementById('myCoursesGrid');
    grid.innerHTML = '<p class="loading-text">Loading your courses...</p>';
    try {
        const courses = await apiCall('GET', 'my-courses', token);
        if (!Array.isArray(courses) || courses.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-graduation-cap"></i>
                    <p>No enrolled courses yet.</p>
                    <a href="#" onclick="showCourses()" class="empty-cta">Browse Courses →</a>
                </div>`;
            return;
        }
        
        grid.innerHTML = courses.map(course => {
            const progress = getProgress(course.id);
            return `
            <div class="course-card" onclick="showCourseTopics(${course.id}, '${escapeHtml(course.title).replace(/'/g, "\\'")}')">
                <div class="course-header">📚</div>
                <div class="course-body">
                    <h3 class="course-title">${escapeHtml(course.title)}</h3>
                    <div class="course-progress">
                        <p class="progress-text-small">${progress}% Complete</p>
                        <div class="progress-ring-wrap">
                            <svg class="progress-ring" viewBox="0 0 60 60">
                                <circle cx="30" cy="30" r="24" fill="none" stroke="#334155" stroke-width="5"/>
                                <circle cx="30" cy="30" r="24" fill="none"
                                    stroke="${progress >= 70 ? '#10b981' : progress >= 40 ? '#f97316' : '#7c3aed'}"
                                    stroke-width="5"
                                    stroke-dasharray="${2 * Math.PI * 24}"
                                    stroke-dashoffset="${2 * Math.PI * 24 * (1 - progress / 100)}"
                                    stroke-linecap="round"
                                    transform="rotate(-90 30 30)"/>
                                <text x="30" y="35" text-anchor="middle" font-size="11" font-weight="700"
                                    fill="${progress >= 70 ? '#10b981' : progress >= 40 ? '#f97316' : '#7c3aed'}">${progress}%</text>
                            </svg>
                        </div>
                    </div>
                    ${progress >= 70 ? '<p style="color: var(--accent-green); font-weight: 600; margin-top: 8px;"><i class="fas fa-check-circle"></i> 70% Unlocked</p>' : ''}
                </div>
            </div>`;
        }).join('');
    } catch {
        grid.innerHTML = '<p class="loading-text">Failed to load your courses.</p>';
    }
}

// ─── Progress ─────────────────────────────────────────────────────
function getProgressKey(courseId) {
    return `progress_${currentUser}_${courseId}`;
}

function getCompletedTopics(courseId) {
    const stored = localStorage.getItem(getProgressKey(courseId));
    return stored ? JSON.parse(stored) : [];
}

function getProgress(courseId) {
    const completed = getCompletedTopics(courseId);
    const total = parseInt(localStorage.getItem(`topiccount_${courseId}`) || '0');
    if (!total) return 0;
    return Math.round((completed.length / total) * 100);
}

function updateProgressUI(courseId, completedCount, totalCount) {
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    
    if (fill) {
        fill.style.width = `${percent}%`;
    }
    if (text) {
        text.innerHTML = `${percent}% Complete (${completedCount}/${totalCount} topics)`;
    }
}

// ─── Topics ───────────────────────────────────────────────────────
function markTopicComplete(courseId, topicId, totalTopics, checkbox) {
    if (!checkbox.checked) {
        checkbox.checked = true;
        return;
    }

    const completed = getCompletedTopics(courseId);
    if (completed.includes(topicId)) return;

    completed.push(topicId);
    localStorage.setItem(getProgressKey(courseId), JSON.stringify(completed));

    const card = document.getElementById(`topic-card-${topicId}`);
    if (card) {
        card.classList.add('completed');
        const statusEl = card.querySelector('.topic-status');
        if (statusEl) statusEl.textContent = 'Done ✓';
    }

    updateProgressUI(courseId, completed.length, totalTopics);
    showMotivationToast(getRandomMotivation());

    const percent = Math.round((completed.length / totalTopics) * 100);
    const prevPercent = Math.round(((completed.length - 1) / totalTopics) * 100);
    if (percent >= 70 && prevPercent < 70) {
        setTimeout(() => {
            showMotivationToast('🎊 You\'ve hit 70%! You can now enroll in another course!');
        }, 4500);
    }
}

async function loadTopics(courseId) {
    currentCourseId = courseId;
    const list = document.getElementById('topicsList');
    list.innerHTML = '<p class="loading-text">Loading topics...</p>';
    try {
        const data = await apiCall('GET', `courses/${courseId}/topics`, token);
        const topics = data.topics || [];

        localStorage.setItem(`topiccount_${courseId}`, topics.length);
        const completed = getCompletedTopics(courseId);
        updateProgressUI(courseId, completed.length, topics.length);

        if (topics.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No topics added yet for this course.</p>
                </div>`;
            return;
        }

        list.innerHTML = topics.map((topic, index) => {
            const isDone = completed.includes(topic.id);
            return `
            <div class="topic-card ${isDone ? 'completed' : ''}" id="topic-card-${topic.id}">
                <div class="topic-number">${isDone ? '✓' : index + 1}</div>
                <div class="topic-content">
                    <h4 class="topic-title">${escapeHtml(topic.title)}</h4>
                    <a href="${escapeHtml(topic.link)}" target="_blank" class="topic-link">
                        <i class="fab fa-youtube"></i> Watch Video
                    </a>
                </div>
                <div class="topic-status">${isDone ? 'Done ✓' : 'Pending'}</div>
                <label class="checkbox-container">
                    <input type="checkbox"
                        ${isDone ? 'checked' : ''}
                        onchange="markTopicComplete(${courseId}, ${topic.id}, ${topics.length}, this)">
                    <span class="checkmark"></span>
                </label>
            </div>`;
        }).join('');
    } catch {
        list.innerHTML = '<p class="loading-text">Failed to load topics.</p>';
    }
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
        logout();
    } catch {
        showMessage('Failed to delete account.', 'error');
    }
}

// Filter courses function
function filterCourses(filter) {
    // Update tab styling
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filter logic will be added based on progress
}

function logout() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('progress_') || key.startsWith('topiccount_'))) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    currentUser = null;
    token = null;
    localStorage.removeItem('token');
    
    showLogin();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    checkAuthStatus();
});