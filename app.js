// Ritual colors
const COLORS = [
    '#FF6B6B',  // Coral
    '#4ECDC4',  // Teal
    '#9B59B6',  // Purple
    '#F39C12',  // Orange
    '#3498DB',  // Blue
    '#2ECC71',  // Green
];

// Default rituals
const DEFAULT_RITUALS = ['moving my body', 'draw', 'mascot'];

// Celebration messages
const CELEBRATIONS = [
    { emoji: "🎉", text: "You crushed it today!" },
    { emoji: "⭐", text: "All rituals complete!" },
    { emoji: "🌟", text: "Perfect day achieved!" },
    { emoji: "💪", text: "You showed up for yourself!" },
    { emoji: "🔥", text: "On fire! Keep it going!" },
    { emoji: "✨", text: "Magic happens with consistency!" }
];

// State
let data = {
    rituals: [],
    completions: {},
    ideas: []
};
let currentDate = new Date();
let selectedDate = new Date();
let hasShownCelebration = false;
let currentView = 'week'; // 'week', 'month', 'year'

// DOM Elements
const streakFlamesEl = document.getElementById('streak-flames');
const statsDonutsEl = document.getElementById('stats-donuts');
const currentMonthEl = document.getElementById('current-month');
const calendarDaysEl = document.getElementById('calendar-days');
const weekViewEl = document.getElementById('week-view');
const monthViewEl = document.getElementById('month-view');
const yearViewEl = document.getElementById('year-view');
const viewToggleEl = document.querySelector('.view-toggle');
const selectedDateEl = document.getElementById('selected-date');
const ritualsListEl = document.getElementById('rituals-list');
const completionBadgeEl = document.getElementById('completion-badge');
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const closeSettingsBtn = document.getElementById('close-settings');
const manageRitualsListEl = document.getElementById('manage-rituals-list');
const newRitualInput = document.getElementById('new-ritual-input');
const addRitualBtn = document.getElementById('add-ritual-btn');
const celebrationEl = document.getElementById('celebration');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const ideasListEl = document.getElementById('ideas-list');
const newIdeaInput = document.getElementById('new-idea-input');
const addIdeaBtn = document.getElementById('add-idea-btn');

// Initialize
function init() {
    loadData();
    renderAll();
    setupEventListeners();
}

// Load data from localStorage
function loadData() {
    const stored = localStorage.getItem('rituals-data');
    if (stored) {
        data = JSON.parse(stored);
        if (!data.ideas) data.ideas = [];
    } else {
        data = {
            rituals: [...DEFAULT_RITUALS],
            completions: {},
            ideas: []
        };
        saveData();
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('rituals-data', JSON.stringify(data));
}

// Get date string in YYYY-MM-DD format
function getDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get color for ritual by index
function getRitualColor(index) {
    return COLORS[index % COLORS.length];
}

// Render everything
function renderAll() {
    renderStreakFlames();
    renderStatsDonuts();
    renderCalendarView();
    renderDailyView();
    renderManageRituals();
    renderIdeas();
    checkForCelebration();
}

// Calculate current streak for a ritual
function calculateStreak(ritual) {
    let streak = 0;
    const today = new Date();
    let checkDate = new Date(today);

    const todayStr = getDateString(today);
    const todayCompleted = data.completions[todayStr]?.includes(ritual);

    if (!todayCompleted) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
        const dateStr = getDateString(checkDate);
        if (data.completions[dateStr]?.includes(ritual)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

// Render streak flames (Duolingo style)
function renderStreakFlames() {
    streakFlamesEl.innerHTML = data.rituals.map((ritual, index) => {
        const streak = calculateStreak(ritual);
        const color = getRitualColor(index);
        const isActive = streak > 0;

        return `
            <div class="streak-flame ${isActive ? '' : 'inactive'}" title="${ritual}: ${streak} day streak">
                <span class="flame-icon">🔥</span>
                <span class="flame-count" style="color: ${isActive ? color : 'inherit'}">${streak}</span>
            </div>
        `;
    }).join('');
}

// Render stats as donut charts
function renderStatsDonuts() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const daysToCount = isCurrentMonth ? today.getDate() : new Date(year, month + 1, 0).getDate();

    const circumference = 2 * Math.PI * 24; // radius = 24

    statsDonutsEl.innerHTML = data.rituals.map((ritual, index) => {
        let completedDays = 0;
        for (let day = 1; day <= daysToCount; day++) {
            const dateStr = getDateString(new Date(year, month, day));
            if (data.completions[dateStr]?.includes(ritual)) {
                completedDays++;
            }
        }
        const percent = daysToCount > 0 ? Math.round((completedDays / daysToCount) * 100) : 0;
        const color = getRitualColor(index);
        const offset = circumference - (percent / 100) * circumference;

        return `
            <div class="donut-stat">
                <div class="donut-ring">
                    <svg width="60" height="60">
                        <circle class="bg" cx="30" cy="30" r="24"/>
                        <circle class="progress" cx="30" cy="30" r="24"
                            stroke="${color}"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${offset}"/>
                    </svg>
                    <span class="donut-percent" style="color: ${color}">${percent}%</span>
                </div>
                <span class="donut-label" title="${ritual}">${ritual}</span>
            </div>
        `;
    }).join('');
}

// Switch view
function switchView(view) {
    currentView = view;

    // Update toggle buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Show/hide views
    weekViewEl.classList.toggle('hidden', view !== 'week');
    monthViewEl.classList.toggle('hidden', view !== 'month');
    yearViewEl.classList.toggle('hidden', view !== 'year');

    renderCalendarView();
}

// Render the current calendar view
function renderCalendarView() {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    if (currentView === 'week') {
        currentMonthEl.textContent = monthNamesFull[currentDate.getMonth()] + ' ' + currentDate.getFullYear();
        renderWeekView();
    } else if (currentView === 'month') {
        currentMonthEl.textContent = monthNamesFull[currentDate.getMonth()] + ' ' + currentDate.getFullYear();
        renderMonthView();
    } else {
        currentMonthEl.textContent = currentDate.getFullYear().toString();
        renderYearView();
    }
}

// Render week view (last 7 days centered on today or selected)
function renderWeekView() {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const todayStr = getDateString(today);
    const selectedStr = getDateString(selectedDate);

    // Get the week containing the current date
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    let html = '';

    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = getDateString(date);
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === selectedStr;
        const completedRituals = data.completions[dateStr] || [];
        const isPerfect = completedRituals.length === data.rituals.length && data.rituals.length > 0;

        let classes = 'week-day';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (isPerfect) classes += ' perfect';

        const dots = data.rituals.map((ritual, index) => {
            const isCompleted = completedRituals.includes(ritual);
            const color = getRitualColor(index);
            return `<div class="day-dot ${isCompleted ? 'completed' : ''}" style="background: ${color}"></div>`;
        }).join('');

        html += `
            <div class="${classes}" data-date="${dateStr}">
                <div class="week-day-name">${dayNames[date.getDay()]}</div>
                <div class="week-day-num">${date.getDate()}</div>
                <div class="week-day-dots">${dots}</div>
            </div>
        `;
    }

    weekViewEl.innerHTML = html;
}

// Render month view
function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = getDateString(today);
    const selectedStr = getDateString(selectedDate);

    let html = '';

    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = getDateString(date);
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === selectedStr;
        const completedRituals = data.completions[dateStr] || [];
        const isPerfect = completedRituals.length === data.rituals.length && data.rituals.length > 0;

        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (isPerfect) classes += ' perfect';

        const dots = data.rituals.map((ritual, index) => {
            const isCompleted = completedRituals.includes(ritual);
            const color = getRitualColor(index);
            return `<div class="day-dot ${isCompleted ? 'completed' : ''}" style="background: ${color}"></div>`;
        }).join('');

        html += `
            <div class="${classes}" data-date="${dateStr}">
                <span class="day-number">${day}</span>
                <div class="day-dots">${dots}</div>
            </div>
        `;
    }

    calendarDaysEl.innerHTML = html;
}

// Render year view
function renderYearView() {
    const year = currentDate.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let html = '';

    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        let daysHtml = '';

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            daysHtml += '<div class="year-day"></div>';
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = getDateString(new Date(year, month, day));
            const completedRituals = data.completions[dateStr] || [];
            const ratio = data.rituals.length > 0 ? completedRituals.length / data.rituals.length : 0;

            let cls = 'year-day';
            let style = '';

            if (ratio === 1) {
                cls += ' perfect';
                style = `background: ${COLORS[1]};`;
            } else if (ratio > 0) {
                cls += ' partial';
                style = `background: ${COLORS[1]}; opacity: ${0.3 + ratio * 0.4};`;
            }

            daysHtml += `<div class="${cls}" style="${style}"></div>`;
        }

        html += `
            <div class="year-month">
                <div class="year-month-name">${monthNames[month]}</div>
                <div class="year-month-grid">${daysHtml}</div>
            </div>
        `;
    }

    yearViewEl.innerHTML = html;
}

// Render daily view
function renderDailyView() {
    const dateStr = getDateString(selectedDate);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const today = new Date();
    const isToday = getDateString(today) === dateStr;

    selectedDateEl.textContent = isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', options);

    const completedRituals = data.completions[dateStr] || [];
    const allComplete = completedRituals.length === data.rituals.length && data.rituals.length > 0;

    if (allComplete) {
        completionBadgeEl.classList.remove('hidden');
    } else {
        completionBadgeEl.classList.add('hidden');
    }

    ritualsListEl.innerHTML = data.rituals.map((ritual, index) => {
        const isCompleted = completedRituals.includes(ritual);
        const color = getRitualColor(index);

        return `
            <div class="ritual-item ${isCompleted ? 'completed' : ''}" data-ritual="${ritual}">
                <div class="ritual-checkbox ${isCompleted ? 'checked' : ''}"
                     style="border-color: ${color}; ${isCompleted ? `background: ${color}` : ''}"
                     data-ritual="${ritual}"></div>
                <span class="ritual-name">${ritual}</span>
            </div>
        `;
    }).join('');
}

// Check if we should show celebration
function checkForCelebration() {
    const todayStr = getDateString(new Date());
    const selectedStr = getDateString(selectedDate);

    if (todayStr !== selectedStr) return;

    const completedRituals = data.completions[todayStr] || [];
    const allComplete = completedRituals.length === data.rituals.length && data.rituals.length > 0;

    if (allComplete && !hasShownCelebration) {
        showCelebration();
        hasShownCelebration = true;
    }
}

// Show celebration overlay
function showCelebration() {
    const celebration = CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
    celebrationEl.querySelector('.celebration-emoji').textContent = celebration.emoji;
    celebrationEl.querySelector('.celebration-text').textContent = celebration.text;
    celebrationEl.classList.remove('hidden');

    setTimeout(() => {
        celebrationEl.classList.add('hidden');
    }, 2000);
}

// Render manage rituals in settings
function renderManageRituals() {
    manageRitualsListEl.innerHTML = data.rituals.map((ritual, index) => {
        const color = getRitualColor(index);
        return `
            <div class="manage-ritual-item">
                <div class="manage-ritual-color" style="background: ${color}"></div>
                <span class="manage-ritual-name">${ritual}</span>
                <button class="manage-delete-btn" data-ritual="${ritual}" title="Delete">&times;</button>
            </div>
        `;
    }).join('');
}

// Calculate days since creation
function getDaysOld(createdAt) {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now - created;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Render ideas list
function renderIdeas() {
    const sortedIdeas = [...data.ideas].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });

    ideasListEl.innerHTML = sortedIdeas.map(idea => {
        const daysOld = getDaysOld(idea.createdAt);
        const ageText = daysOld > 0 ? `(${daysOld})` : '';

        return `
            <div class="idea-item ${idea.completed ? 'completed' : ''}" data-id="${idea.id}">
                <div class="idea-checkbox ${idea.completed ? 'checked' : ''}" data-id="${idea.id}"></div>
                <span class="idea-text">${escapeHtml(idea.text)}</span>
                ${ageText ? `<span class="idea-age">${ageText}</span>` : ''}
                <button class="idea-delete" data-id="${idea.id}" title="Delete">&times;</button>
            </div>
        `;
    }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add new idea
function addIdea(text) {
    const trimmed = text.trim();
    if (trimmed) {
        data.ideas.push({
            id: Date.now().toString(),
            text: trimmed,
            completed: false,
            createdAt: new Date().toISOString()
        });
        saveData();
        renderIdeas();
    }
}

// Toggle idea completion
function toggleIdea(id) {
    const idea = data.ideas.find(i => i.id === id);
    if (idea) {
        idea.completed = !idea.completed;
        saveData();
        renderIdeas();
    }
}

// Delete idea
function deleteIdea(id) {
    data.ideas = data.ideas.filter(i => i.id !== id);
    saveData();
    renderIdeas();
}

// Toggle ritual completion
function toggleRitual(ritual) {
    const dateStr = getDateString(selectedDate);
    if (!data.completions[dateStr]) {
        data.completions[dateStr] = [];
    }

    const index = data.completions[dateStr].indexOf(ritual);
    if (index === -1) {
        data.completions[dateStr].push(ritual);
    } else {
        data.completions[dateStr].splice(index, 1);
    }

    saveData();
    renderAll();
}

// Add new ritual
function addRitual(name) {
    const trimmed = name.trim().toLowerCase();
    if (trimmed && !data.rituals.includes(trimmed)) {
        data.rituals.push(trimmed);
        saveData();
        renderAll();
    }
}

// Delete ritual
function deleteRitual(ritual) {
    if (confirm(`Delete "${ritual}"? This will remove all history for this ritual.`)) {
        data.rituals = data.rituals.filter(r => r !== ritual);
        Object.keys(data.completions).forEach(dateStr => {
            data.completions[dateStr] = data.completions[dateStr].filter(r => r !== ritual);
        });
        saveData();
        renderAll();
    }
}

// Navigate months
function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderAll();
}

// Select date
function selectDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    selectedDate = new Date(year, month - 1, day);
    hasShownCelebration = false;
    renderAll();
}

// Open settings
function openSettings() {
    settingsMenu.classList.remove('hidden');
    settingsMenu.classList.add('visible');
}

// Close settings
function closeSettings() {
    settingsMenu.classList.remove('visible');
    settingsMenu.classList.add('hidden');
}

// Setup event listeners
function setupEventListeners() {
    prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeMonth(1));

    // View toggle
    viewToggleEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-btn')) {
            switchView(e.target.dataset.view);
        }
    });

    // Week view click
    weekViewEl.addEventListener('click', (e) => {
        const dayEl = e.target.closest('.week-day');
        if (dayEl) {
            selectDate(dayEl.dataset.date);
        }
    });

    // Month view click
    calendarDaysEl.addEventListener('click', (e) => {
        const dayEl = e.target.closest('.calendar-day');
        if (dayEl && !dayEl.classList.contains('empty')) {
            selectDate(dayEl.dataset.date);
        }
    });

    ritualsListEl.addEventListener('click', (e) => {
        const ritualItem = e.target.closest('.ritual-item');
        if (ritualItem) {
            toggleRitual(ritualItem.dataset.ritual);
        }
    });

    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);

    settingsMenu.addEventListener('click', (e) => {
        if (e.target === settingsMenu) {
            closeSettings();
        }
    });

    addRitualBtn.addEventListener('click', () => {
        addRitual(newRitualInput.value);
        newRitualInput.value = '';
    });

    newRitualInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addRitual(newRitualInput.value);
            newRitualInput.value = '';
        }
    });

    manageRitualsListEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('manage-delete-btn')) {
            deleteRitual(e.target.dataset.ritual);
        }
    });

    addIdeaBtn.addEventListener('click', () => {
        addIdea(newIdeaInput.value);
        newIdeaInput.value = '';
    });

    newIdeaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addIdea(newIdeaInput.value);
            newIdeaInput.value = '';
        }
    });

    ideasListEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('idea-checkbox')) {
            toggleIdea(e.target.dataset.id);
        }
        if (e.target.classList.contains('idea-delete')) {
            deleteIdea(e.target.dataset.id);
        }
    });

    celebrationEl.addEventListener('click', () => {
        celebrationEl.classList.add('hidden');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSettings();
            celebrationEl.classList.add('hidden');
        }
    });
}

// Start the app
init();
