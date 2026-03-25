let currentUser = null;
let token = null;

const API_BASE = 'https://lms-backend-kappa-kohl.vercel.app/api';

const loader = document.getElementById('loader');
const message = document.getElementById('message');
const authContainer = document.getElementById('auth-container');
const navbar = document.querySelector('.navbar');

// Motivation Messages
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

// Mobile Menu
function toggleMobileMenu() {
    document.getElementById('nav-menu').classList.toggle('active');
}

// Loader
function showLoader() { loader.style.display = 'block'; }
function hideLoader() { loader.style.display = 'none'; }

// Messages
function showMessage(text, type = 'success') {
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    setTimeout(() => { message.style.display = 'none'; }, 5000);
}

// Motivation Toast
function showMotivationToast(text) {
    const toast = document.getElementById('motivationToast');
    const toastText = document.getElementById('motivationText');
    toastText.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// URL Builder
function buildUrl(endpoint) {
    const base = API_BASE.replace(/\/+$/, '');
    const path = endpoint.replace(/^\/+/, '');
    return `${base}/${path}`;
}

// API Call
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

// Page Routing
function hideAll() {
    document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.auth-form').forEach(el => el.classList.add('hidden'));
    document.getElementById('nav-menu').classList.remove('active');
}

function setNavbarVisible(visible) {
    navbar.style.display = visible ? 'block' : 'none';
}

function showLogin() {
    hideAll(); setNavbarVisible(false);
    authContainer.classList.remove('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

function showSignup() {
    hideAll(); setNavbarVisible(false);
    authContainer.classList.remove('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
}

function showDashboard() {
    hideAll(); authContainer.classList.add('hidden'); setNavbarVisible(true);
    document.getElementById('dashboard').classList.remove('hidden');
    loadDashboard();
}

function showCourses() {
    hideAll(); authContainer.classList.add('hidden'); setNavbarVisible(true);
    document.getElementById('courses').classList.remove('hidden');
    loadCourses();
}

function showMyCourses() {
    hideAll(); authContainer.classList.add('hidden'); setNavbarVisible(true);
    document.getElementById('my-courses').classList.remove('hidden');
    loadMyCourses();
}

function showProfile() {
    hideAll(); authContainer.classList.add('hidden'); setNavbarVisible(true);
    document.getElementById('profile').classList.remove('hidden');
    loadProfile();
}

function showAbout() {
    hideAll(); authContainer.classList.add('hidden'); setNavbarVisible(true);
    document.getElementById('about').classList.remove('hidden');
}

function showContact() {
    hideAll(); authContainer.classList.add('hidden'); setNavbarVisible(true);
    document.getElementById('contact').classList.remove('hidden');
}

function showCourseTopics(courseId, courseTitle) {
    hideAll(); authContainer.classList.add('hidden'); setNavbarVisible(true);
    document.getElementById('course-topics').classList.remove('hidden');
    document.getElementById('courseTopicTitle').textContent = courseTitle;
    loadTopics(courseId);
}

// Auth
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

function initEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const contactForm = document.getElementById('contactForm');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (!loginForm || !signupForm) {
        setTimeout(initEventListeners, 100); 
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = loginForm.querySelector('.btn-primary');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');
        btn.disabled = true; btnText.style.opacity = '0'; btnLoader.style.display = 'inline-block';
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
            btn.disabled = false; btnText.style.opacity = '1'; btnLoader.style.display = 'none';
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
        btn.disabled = true; btnText.style.opacity = '0'; btnLoader.style.display = 'inline-block';
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
            btn.disabled = false; btnText.style.opacity = '1'; btnLoader.style.display = 'none';
        }
    });

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('.btn-primary');
            const btnText = btn.querySelector('.btn-text');
            const btnLoader = btn.querySelector('.btn-loader');
            
            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const subject = document.getElementById('contactSubject').value;
            const message_text = document.getElementById('contactMessage').value;

            btn.disabled = true;
            btnText.style.opacity = '0';
            btnLoader.style.display = 'inline-block';

            try {
                const mailtoLink = `mailto:bharathummadi4@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
                    `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message_text}`
                )}`;
                window.location.href = mailtoLink;
                showMessage('Opening your email client...', 'success');
                contactForm.reset();
            } catch (error) {
                showMessage('Error opening email client. Please email directly: bharathummadi4@gmail.com', 'error');
            } finally {
                btn.disabled = false;
                btnText.style.opacity = '1';
                btnLoader.style.display = 'none';
            }
        });
    }

    if (mobileMenu) {
        mobileMenu.addEventListener('click', toggleMobileMenu);
    }
}

// ─── Dashboard ───────────────────────────────────────────────
async function loadDashboard() {
    if (!token) return;
    try {
        const firstName = currentUser.split('@')[0].charAt(0).toUpperCase();
        document.getElementById('dashboardAvatar').textContent = firstName;
        document.getElementById('dashboardUserEmail').textContent = currentUser;
        document.getElementById('welcomeMessage').textContent = `Welcome back, ${currentUser}! 👋`;

        const [coursesRes, myCoursesRes] = await Promise.all([
            apiCall('GET', 'courses', token),
            apiCall('GET', 'my-courses', token)
        ]);
        
        const courses = Array.isArray(coursesRes) ? coursesRes : [];
        const myCourses = Array.isArray(myCoursesRes) ? myCoursesRes : [];
        
        document.getElementById('totalCourses').textContent = courses.length;
        document.getElementById('myCoursesCount').textContent = myCourses.length;

        // ✅ FIX: Fetch topics for each enrolled course to get accurate counts
        // then compute completed topics correctly
        let totalTopicsCompleted = 0;

        await Promise.all(myCourses.map(async (course) => {
            try {
                // Only fetch if we don't have the topic count cached
                if (!localStorage.getItem(`topiccount_${course.id}`)) {
                    const data = await apiCall('GET', `courses/${course.id}/topics`, token);
                    const topics = data.topics || [];
                    localStorage.setItem(`topiccount_${course.id}`, topics.length);
                }
            } catch (e) {
                // silently ignore per-course fetch errors
            }
            const completed = getCompletedTopics(course.id);
            totalTopicsCompleted += completed.length;
        }));

        document.getElementById('topicsCompleted').textContent = totalTopicsCompleted;
        
        // Learning streak
        const lastLogin = localStorage.getItem('lastLogin');
        const today = new Date().toDateString();
        let streak = parseInt(localStorage.getItem('learningStreak')) || 0;
        
        if (lastLogin !== today) {
            streak += 1;
            localStorage.setItem('lastLogin', today);
            localStorage.setItem('learningStreak', streak);
        }
        document.getElementById('learningStreak').textContent = streak;
        
        // ✅ FIX: Pass myCourses AFTER topic counts are populated
        loadDashboardProgress(myCourses);
        loadDashboardFeatured(courses, myCourses);
        
    } catch (err) { console.error(err); }
}

function loadDashboardProgress(myCourses) {
    const container = document.getElementById('dashboardProgressContainer');
    
    if (!myCourses || myCourses.length === 0) {
        container.innerHTML = '<p class="loading-text">Enroll in courses to track progress</p>';
        return;
    }
    
    container.innerHTML = myCourses.map(course => {
        // ✅ FIX: getProgress now works because topiccount is guaranteed to be set above
        const progress = getProgress(course.id);
        return `
            <div class="progress-item">
                <p class="progress-item-name" title="${course.title}">${escapeHtml(course.title)}</p>
                <div class="progress-item-bar">
                    <div class="progress-item-fill" style="width: ${progress}%"></div>
                </div>
                <p class="progress-item-percent">${progress}%</p>
            </div>
        `;
    }).join('');
}

function loadDashboardFeatured(allCourses, enrolledCourses) {
    const container = document.getElementById('dashboardFeatured');
    const enrolledIds = enrolledCourses.map(c => c.id);
    const featured = allCourses.filter(c => !enrolledIds.includes(c.id)).slice(0, 3);
    
    if (featured.length === 0) {
        container.innerHTML = '<p class="loading-text">All courses explored! Good job!</p>';
        return;
    }
    
    container.innerHTML = featured.map(course => `
        <div class="featured-card">
            <p class="featured-card-title">${escapeHtml(course.title)}</p>
            <div class="featured-card-meta">
                <span><i class="fas fa-book"></i> Course</span>
                <span><i class="fas fa-star"></i> Popular</span>
            </div>
            <button onclick="enrollCourse(${course.id}, this)">
                <i class="fas fa-plus-circle"></i> Enroll Now
            </button>
        </div>
    `).join('');
}

// ─── Enrollment Logic ────────────────────────────────────────
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

// ─── All Courses ─────────────────────────────────────────────
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

        // ✅ FIX: Ensure topic counts are cached before computing enrollment status
        await Promise.all((Array.isArray(myCourses) ? myCourses : []).map(async (course) => {
            if (!localStorage.getItem(`topiccount_${course.id}`)) {
                try {
                    const data = await apiCall('GET', `courses/${course.id}/topics`, token);
                    const topics = data.topics || [];
                    localStorage.setItem(`topiccount_${course.id}`, topics.length);
                } catch (e) {}
            }
        }));

        const status = getEnrollmentStatus(Array.isArray(myCourses) ? myCourses : []);

        const hint = document.getElementById('enrollHint');
        if (hint) {
            if (!status.canEnrollNew && status.activeCourseId) {
                hint.textContent = `Complete 70% of "${status.activeCourseName}" (${status.activeProgress}% done) to unlock next enrollment`;
            } else if (enrolledIds.length === 0) {
                hint.textContent = 'Enroll in your first course to get started!';
            } else {
                hint.textContent = 'All current courses are 70%+ complete — you can enroll in a new one!';
            }
        }

        grid.innerHTML = courses.map(course => {
            const enrolled = enrolledIds.includes(course.id);
            const progress = getProgress(course.id);
            const canEnroll = enrolled || status.canEnrollNew;

            if (enrolled) {
                return `
                <div class="course-card enrolled-card">
                    <div class="card-ribbon">Enrolled</div>
                    <div class="course-icon-wrap"><i class="fas fa-book-open"></i></div>
                    <h3>${escapeHtml(course.title)}</h3>
                    <div class="progress-inline">
                        <div class="progress-inline-bar">
                            <div class="progress-inline-fill" style="width:${progress}%"></div>
                        </div>
                        <span>${progress}%</span>
                    </div>
                    <button disabled>✓ Already Enrolled</button>
                </div>`;
            }

            if (!canEnroll) {
                return `
                <div class="course-card locked-card">
                    <div class="card-ribbon locked-ribbon"><i class="fas fa-lock"></i> Locked</div>
                    <div class="course-icon-wrap locked-icon"><i class="fas fa-lock"></i></div>
                    <h3>${escapeHtml(course.title)}</h3>
                    <div class="lock-notice">
                        Complete 70% of <strong>"${escapeHtml(status.activeCourseName)}"</strong> to unlock
                    </div>
                </div>`;
            }

            return `
            <div class="course-card available-card">
                <div class="card-ribbon available-ribbon">Available</div>
                <div class="course-icon-wrap"><i class="fas fa-book-open"></i></div>
                <h3>${escapeHtml(course.title)}</h3>
                <button onclick="enrollCourse(${course.id}, this)">
                    <i class="fas fa-plus-circle"></i> Enroll Now
                </button>
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
        showMessage('Successfully enrolled! 🎉 Start learning!', 'success');
        setTimeout(loadCourses, 800);
    } catch {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

// ─── My Courses ──────────────────────────────────────────────
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

        // ✅ FIX: Ensure topic counts are cached before rendering progress rings
        await Promise.all(courses.map(async (course) => {
            if (!localStorage.getItem(`topiccount_${course.id}`)) {
                try {
                    const data = await apiCall('GET', `courses/${course.id}/topics`, token);
                    const topics = data.topics || [];
                    localStorage.setItem(`topiccount_${course.id}`, topics.length);
                } catch (e) {}
            }
        }));

        grid.innerHTML = courses.map(course => {
            const progress = getProgress(course.id);
            return `
            <div class="course-card my-course-card" onclick="showCourseTopics(${course.id}, '${course.title.replace(/'/g, "\\'")}')">
                <div class="course-icon-wrap"><i class="fas fa-play-circle"></i></div>
                <h3>${escapeHtml(course.title)}</h3>
                ${progress >= 70 ? '<div class="badge-70"><i class="fas fa-unlock-alt"></i> 70%+ Unlocked</div>' : ''}
                <div class="progress-ring-wrap">
                    <svg class="progress-ring" viewBox="0 0 60 60">
                        <circle cx="30" cy="30" r="24" fill="none" stroke="#e8e8e8" stroke-width="5"/>
                        <circle cx="30" cy="30" r="24" fill="none"
                            stroke="${progress >= 70 ? '#27ae60' : progress >= 40 ? '#f39c12' : '#667eea'}"
                            stroke-width="5"
                            stroke-dasharray="${2 * Math.PI * 24}"
                            stroke-dashoffset="${2 * Math.PI * 24 * (1 - progress / 100)}"
                            stroke-linecap="round"
                            transform="rotate(-90 30 30)"/>
                        <text x="30" y="35" text-anchor="middle" font-size="11" font-weight="700"
                            fill="${progress >= 70 ? '#27ae60' : progress >= 40 ? '#f39c12' : '#667eea'}">${progress}%</text>
                    </svg>
                </div>
                <p style="margin-top: 8px; color: var(--text-muted); font-size: 0.85rem;"><i class="fas fa-mouse-pointer"></i> Click to view topics</p>
            </div>`;
        }).join('');
    } catch {
        grid.innerHTML = '<p class="loading-text">Failed to load your courses.</p>';
    }
}

// ─── Progress Helpers ────────────────────────────────────────
function getProgressKey(courseId) { return `progress_${currentUser}_${courseId}`; }

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
        fill.className = 'progress-bar-fill ' + (percent >= 70 ? 'fill-green' : percent >= 40 ? 'fill-orange' : 'fill-blue');
    }
    if (text) {
        text.innerHTML = `${percent}% Complete (${completedCount}/${totalCount} topics)`;
        if (percent >= 70) {
            text.innerHTML += ' 🔓 You can enroll in another course!';
        }
    }
}

// ─── Topics ──────────────────────────────────────────────────
function markTopicComplete(courseId, topicId, totalTopics, checkbox) {
    checkbox.checked = true;

    const completed = getCompletedTopics(courseId);
    if (completed.includes(topicId)) return;

    completed.push(topicId);
    localStorage.setItem(getProgressKey(courseId), JSON.stringify(completed));

    // ✅ FIX: Always keep topiccount in sync when marking complete
    localStorage.setItem(`topiccount_${courseId}`, totalTopics);

    const card = document.getElementById(`topic-card-${topicId}`);
    if (card) {
        card.classList.add('completed');
        const statusEl = card.querySelector('.topic-status');
        const numEl = card.querySelector('.topic-number');
        if (statusEl) statusEl.textContent = 'Done ✓';
        if (numEl) numEl.innerHTML = '<i class="fas fa-check"></i>';
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
    const list = document.getElementById('topicsList');
    list.innerHTML = '<p class="loading-text">Loading topics...</p>';
    try {
        const data = await apiCall('GET', `courses/${courseId}/topics`, token);
        const topics = data.topics || [];

        // ✅ FIX: Always update topiccount when topics are loaded
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
            const youtubeId = extractYoutubeId(topic.link);
            const thumbnail = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;

            return `
            <div class="topic-card ${isDone ? 'completed' : ''}" id="topic-card-${topic.id}">
                <div class="topic-left">
                    <div class="topic-number">${isDone ? '<i class="fas fa-check"></i>' : index + 1}</div>
                    ${thumbnail ? `
                    <a href="${topic.link}" target="_blank" class="topic-thumbnail">
                        <img src="${thumbnail}" alt="thumbnail" onerror="this.parentElement.style.display='none'">
                        <div class="play-overlay"><i class="fas fa-play"></i></div>
                    </a>` : ''}
                </div>
                <div class="topic-content">
                    <h3 class="topic-title">${escapeHtml(topic.title)}</h3>
                    <a href="${topic.link}" target="_blank" class="topic-link">
                        <i class="fab fa-youtube"></i> Watch on YouTube
                    </a>
                </div>
                <div class="topic-right">
                    <label class="checkbox-container" title="${isDone ? 'Completed' : 'Mark as complete'}">
                        <input type="checkbox"
                            ${isDone ? 'checked' : ''}
                            onchange="markTopicComplete(${courseId}, ${topic.id}, ${topics.length}, this)">
                        <span class="checkmark ${isDone ? 'locked' : ''}"></span>
                    </label>
                    <span class="topic-status">${isDone ? 'Done ✓' : 'Pending'}</span>
                </div>
            </div>`;
        }).join('');
    } catch {
        list.innerHTML = '<p class="loading-text">Failed to load topics.</p>';
    }
}

function extractYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
}

// ─── Profile ─────────────────────────────────────────────────
async function loadProfile() {
    if (!token || !currentUser) return showLogin();
    try {
        const user = await apiCall('GET', `users/${encodeURIComponent(currentUser)}`, token);
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profileEmail').textContent = user.email;
    } catch { showMessage('Failed to load profile.', 'error'); }
}

function editProfile() { showMessage('Edit profile feature coming soon!', 'success'); }

async function deleteAccount() {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    try {
        await apiCall('DELETE', `users/${encodeURIComponent(currentUser)}`, token);
        logout();
    } catch { showMessage('Failed to delete account.', 'error'); }
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

document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    checkAuthStatus();
});