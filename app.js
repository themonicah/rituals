const COLORS = ['#58CC02', '#1CB0F6', '#FF9600', '#CE82FF', '#FF86D0', '#FFC800'];
const DEFAULT_RITUALS = [
    { name: 'moving my body', addedAt: new Date().toISOString() },
    { name: 'draw', addedAt: new Date().toISOString() },
    { name: 'mascot', addedAt: new Date().toISOString() }
];

let data = { rituals: [], completions: {} };
let currentWeekStart = getWeekStart(new Date());
let currentMonth = new Date();
let currentYear = new Date().getFullYear();
let selectedDate = getDateStr(new Date()); // Default to today
let currentView = 'week'; // 'week', 'month', 'year'

// Flat SVG icons
const flameIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 23c-4.97 0-9-3.58-9-8 0-2.52 1.17-4.83 3.15-6.35.92-.7 2.15-.2 2.35.9.1.55.33 1.05.68 1.45 1.5-1.5 2.32-3.5 2.32-5.5 0-.55.45-1 1-1 .3 0 .58.14.77.37C15.82 7.63 18 11.27 18 14c0 3.31-2.69 6-6 6v3zm0-4c2.21 0 4-1.79 4-4 0-1.63-.83-3.51-2.2-5.25-.35 1.83-1.27 3.53-2.65 4.82-.73.68-1.83.68-2.55-.02-.68-.66-1.1-1.54-1.24-2.47C6.52 13.17 6 14.55 6 16c0 3.31 2.69 6 6 6v-3z"/></svg>`;
const gearIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
const calendarIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const todayIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

const MAX_RITUALS = 5;
const MILESTONES = [7, 30, 100, 365];
const MILESTONE_MESSAGES = {
    7: { icon: '🔥', text: '1 week streak!' },
    30: { icon: '⭐', text: '30 day streak!' },
    100: { icon: '💎', text: '100 day streak!' },
    365: { icon: '👑', text: '1 year streak!' }
};

// DOM
const streaksEl = document.getElementById('streaks');
const calendarEl = document.getElementById('calendar');
const statsEl = document.getElementById('stats');
const monthLabel = document.getElementById('month-label');
const checklistEl = document.getElementById('checklist');
const checklistDate = document.getElementById('checklist-date');
const settings = document.getElementById('settings');
const ritualList = document.getElementById('ritual-list');
const viewToggleBtn = document.getElementById('view-toggle-btn');
const viewDropdown = document.getElementById('view-dropdown');
const todayBtn = document.getElementById('today-btn');
const milestoneEl = document.getElementById('milestone');

function init() {
    load();
    // Set icons
    document.getElementById('settings-btn').innerHTML = gearIcon;
    viewToggleBtn.innerHTML = calendarIcon;
    todayBtn.innerHTML = todayIcon;
    render();
    setupEvents();
    checkMilestones();
}

function load() {
    const stored = localStorage.getItem('rituals-data');
    if (stored) {
        data = JSON.parse(stored);
        // Migrate old format
        if (data.rituals.length && typeof data.rituals[0] === 'string') {
            data.rituals = data.rituals.map(name => ({
                name,
                addedAt: new Date().toISOString()
            }));
            save();
        }
    } else {
        data = { rituals: [...DEFAULT_RITUALS], completions: {} };
        save();
    }
}

function save() {
    localStorage.setItem('rituals-data', JSON.stringify(data));
}

function getDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekStart(d) {
    const date = new Date(d);
    date.setDate(date.getDate() - date.getDay());
    date.setHours(0,0,0,0);
    return date;
}

function getColor(i) {
    return COLORS[i % COLORS.length];
}

function render() {
    renderStreaks();
    renderChecklist();
    renderCalendar();
    renderStats();
    renderSettings();
}

function renderStreaks() {
    streaksEl.innerHTML = data.rituals.map((r, i) => {
        const streak = calcStreak(r.name);
        const color = getColor(i);
        const active = streak > 0;
        const bgColor = hexToRgba(color, 0.15);
        return `
            <div class="streak ${active ? '' : 'inactive'}" style="background: ${bgColor}; color: ${color}">
                <span class="streak-tooltip">${r.name}</span>
                <span class="streak-icon">${flameIcon}</span>
                <span class="streak-count">${streak}</span>
            </div>
        `;
    }).join('');
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function calcStreak(name) {
    let streak = 0;
    let d = new Date();
    const todayStr = getDateStr(d);
    const todayDone = data.completions[todayStr]?.includes(name);

    if (!todayDone) d.setDate(d.getDate() - 1);

    while (true) {
        const str = getDateStr(d);
        if (data.completions[str]?.includes(name)) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else break;
    }
    return streak;
}

function renderChecklist() {
    const d = new Date(selectedDate + 'T12:00:00');
    const today = getDateStr(new Date());

    if (selectedDate === today) {
        checklistDate.textContent = 'Today';
    } else {
        checklistDate.textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    const completed = data.completions[selectedDate] || [];

    checklistEl.innerHTML = data.rituals.map((r, i) => {
        const done = completed.includes(r.name);
        const color = getColor(i);
        return `
            <div class="checklist-item ${done ? 'done' : ''}" data-name="${r.name}">
                <div class="checklist-check ${done ? 'done' : ''}"
                    style="border-color: ${color}; ${done ? `background: ${color}` : ''}"></div>
                <span class="checklist-name">${r.name}</span>
            </div>
        `;
    }).join('');
}

function renderCalendar() {
    if (currentView === 'week') {
        renderWeekView();
    } else if (currentView === 'month') {
        renderMonthView();
    } else {
        renderYearView();
    }
}

function renderWeekView() {
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();
    const todayStr = getDateStr(today);

    // Update month label
    const midWeek = new Date(currentWeekStart);
    midWeek.setDate(midWeek.getDate() + 3);
    monthLabel.textContent = midWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Calculate weekly stats
    let weekComplete = 0;
    let weekTotal = 0;

    // Track consecutive perfect days for chain
    let prevPerfect = false;

    let html = '<div class="week-row">';
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        const str = getDateStr(d);
        const isToday = str === todayStr;
        const isFuture = d > today;
        const completed = data.completions[str] || [];
        const isPerfect = completed.length === data.rituals.length && data.rituals.length > 0;

        // Chain logic: connected if this day and previous day are both perfect
        const isChained = isPerfect && prevPerfect;
        prevPerfect = isPerfect;

        // Stats (only count past and today)
        if (!isFuture) {
            weekComplete += completed.length;
            weekTotal += data.rituals.length;
        }

        const dots = data.rituals.map((r, idx) => {
            const done = completed.includes(r.name);
            return `<div class="dot ${done ? 'done' : ''}" style="background: ${getColor(idx)}"></div>`;
        }).join('');

        html += `
            <div class="day ${isToday ? 'today' : ''} ${isPerfect ? 'perfect' : ''} ${isChained ? 'chained' : ''}" data-date="${str}">
                <div class="day-name">${dayNames[d.getDay()]}</div>
                <div class="day-num">${d.getDate()}</div>
                <div class="day-dots">${dots}</div>
            </div>
        `;
    }
    html += '</div>';

    // Weekly summary
    const weekPct = weekTotal > 0 ? Math.round((weekComplete / weekTotal) * 100) : 0;
    html += `<div class="weekly-summary">This week: <strong>${weekPct}%</strong> complete</div>`;

    calendarEl.innerHTML = html;
}

function renderMonthView() {
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();
    const todayStr = getDateStr(today);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    monthLabel.textContent = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();

    let html = '<div class="month-grid">';

    // Day headers
    dayNames.forEach(name => {
        html += `<div class="day-header">${name}</div>`;
    });

    // Empty cells for padding
    for (let i = 0; i < startPad; i++) {
        html += '<div class="day empty"></div>';
    }

    // Days
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const date = new Date(year, month, d);
        const str = getDateStr(date);
        const isToday = str === todayStr;
        const completed = data.completions[str] || [];
        const isPerfect = completed.length === data.rituals.length && data.rituals.length > 0;

        const dots = data.rituals.map((r, idx) => {
            const done = completed.includes(r.name);
            return `<div class="dot ${done ? 'done' : ''}" style="background: ${getColor(idx)}"></div>`;
        }).join('');

        html += `
            <div class="day ${isToday ? 'today' : ''} ${isPerfect ? 'perfect' : ''}" data-date="${str}">
                <div class="day-num">${d}</div>
                <div class="day-dots">${dots}</div>
            </div>
        `;
    }

    html += '</div>';
    calendarEl.innerHTML = html;
}

function renderYearView() {
    const today = new Date();
    const todayStr = getDateStr(today);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    monthLabel.textContent = currentYear.toString();

    let html = '<div class="year-grid">';

    for (let month = 0; month < 12; month++) {
        const firstDay = new Date(currentYear, month, 1);
        const lastDay = new Date(currentYear, month + 1, 0);
        const startPad = firstDay.getDay();

        html += `<div class="year-month">`;
        html += `<div class="year-month-label">${monthNames[month]}</div>`;
        html += `<div class="year-month-grid">`;

        // Empty cells
        for (let i = 0; i < startPad; i++) {
            html += '<div class="year-day empty"></div>';
        }

        // Days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(currentYear, month, d);
            const str = getDateStr(date);
            const isToday = str === todayStr;
            const completed = data.completions[str] || [];
            const hasAny = completed.length > 0;
            const isPerfect = completed.length === data.rituals.length && data.rituals.length > 0;

            html += `<div class="year-day ${isToday ? 'today' : ''} ${isPerfect ? 'perfect' : hasAny ? 'has-completions' : ''}" data-date="${str}"></div>`;
        }

        html += '</div></div>';
    }

    html += '</div>';
    calendarEl.innerHTML = html;
}

function renderStats() {
    const circ = 2 * Math.PI * 12;

    statsEl.innerHTML = data.rituals.map((r, i) => {
        const addedDate = new Date(r.addedAt);
        const today = new Date();
        const daysSinceAdded = Math.max(1, Math.floor((today - addedDate) / (1000*60*60*24)) + 1);

        let completed = 0;
        for (let j = 0; j < daysSinceAdded; j++) {
            const d = new Date(today);
            d.setDate(d.getDate() - j);
            const str = getDateStr(d);
            if (data.completions[str]?.includes(r.name)) completed++;
        }

        const pct = Math.round((completed / daysSinceAdded) * 100);
        const offset = circ - (pct / 100) * circ;
        const color = getColor(i);

        return `
            <div class="stat" title="${r.name}: ${pct}% (${completed}/${daysSinceAdded} days)">
                <div class="mini-donut">
                    <svg width="32" height="32">
                        <circle class="bg" cx="16" cy="16" r="12"/>
                        <circle class="progress" cx="16" cy="16" r="12"
                            stroke="${color}"
                            stroke-dasharray="${circ}"
                            stroke-dashoffset="${offset}"/>
                    </svg>
                </div>
            </div>
        `;
    }).join('');
}

function renderSettings() {
    ritualList.innerHTML = data.rituals.map((r, i) => `
        <div class="ritual-item" data-name="${r.name}">
            <div class="ritual-color" style="background: ${getColor(i)}"></div>
            <span class="ritual-name-text">${r.name}</span>
            <button class="ritual-delete" data-name="${r.name}">×</button>
        </div>
    `).join('');
}

function toggleRitual(name) {
    if (!data.completions[selectedDate]) data.completions[selectedDate] = [];

    const idx = data.completions[selectedDate].indexOf(name);
    const wasAdding = idx === -1;

    if (wasAdding) {
        data.completions[selectedDate].push(name);
    } else {
        data.completions[selectedDate].splice(idx, 1);
    }

    save();
    render();

    // Check for milestone after completing a ritual
    if (wasAdding) {
        checkMilestones();
    }
}

function checkMilestones() {
    // Check each ritual for milestone streaks
    data.rituals.forEach(r => {
        const streak = calcStreak(r.name);
        const shownKey = `milestone-${r.name}-${streak}`;

        if (MILESTONES.includes(streak) && !localStorage.getItem(shownKey)) {
            showMilestone(streak, r.name);
            localStorage.setItem(shownKey, 'true');
        }
    });
}

function showMilestone(days, ritualName) {
    const msg = MILESTONE_MESSAGES[days];
    if (!msg) return;

    milestoneEl.querySelector('.milestone-icon').textContent = msg.icon;
    milestoneEl.querySelector('.milestone-text').innerHTML = `<span>${ritualName}</span><br>${msg.text}`;
    milestoneEl.classList.remove('hidden');

    // Auto-hide after 3 seconds
    setTimeout(() => {
        milestoneEl.classList.add('hidden');
    }, 3000);

    // Click to dismiss
    milestoneEl.onclick = () => milestoneEl.classList.add('hidden');
}

function setupEvents() {
    // Navigation
    document.getElementById('prev').onclick = () => {
        if (currentView === 'week') {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        } else if (currentView === 'month') {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
        } else {
            currentYear--;
        }
        renderCalendar();
    };
    document.getElementById('next').onclick = () => {
        if (currentView === 'week') {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        } else if (currentView === 'month') {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
        } else {
            currentYear++;
        }
        renderCalendar();
    };

    // View toggle dropdown
    viewToggleBtn.onclick = (e) => {
        e.stopPropagation();
        viewDropdown.classList.toggle('hidden');
    };

    document.querySelectorAll('.view-opt').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.view-opt').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            viewDropdown.classList.add('hidden');
            renderCalendar();
        };
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        viewDropdown.classList.add('hidden');
    });

    // Today button - jump to current week/month/year and select today
    todayBtn.onclick = () => {
        const today = new Date();
        currentWeekStart = getWeekStart(today);
        currentMonth = new Date(today);
        currentYear = today.getFullYear();
        selectedDate = getDateStr(today);
        render();
    };

    // Calendar click - select day
    calendarEl.onclick = e => {
        const day = e.target.closest('.day') || e.target.closest('.year-day');
        if (day && day.dataset.date) {
            selectedDate = day.dataset.date;
            renderChecklist();
        }
    };

    // Checklist toggle
    checklistEl.onclick = e => {
        const item = e.target.closest('.checklist-item');
        if (item) toggleRitual(item.dataset.name);
    };

    // Settings
    document.getElementById('settings-btn').onclick = () => settings.classList.remove('hidden');
    document.getElementById('close-settings').onclick = () => settings.classList.add('hidden');
    settings.onclick = e => { if (e.target === settings) settings.classList.add('hidden'); };

    // Add ritual (max 5 for best habit-forming)
    document.getElementById('add-ritual-btn').onclick = () => {
        const input = document.getElementById('ritual-input');
        const name = input.value.trim().toLowerCase();
        if (data.rituals.length >= MAX_RITUALS) {
            alert(`Keep it simple! Max ${MAX_RITUALS} rituals for best results.`);
            return;
        }
        if (name && !data.rituals.find(r => r.name === name)) {
            data.rituals.push({ name, addedAt: new Date().toISOString() });
            save();
            render();
            input.value = '';
        }
    };
    document.getElementById('ritual-input').onkeypress = e => {
        if (e.key === 'Enter') document.getElementById('add-ritual-btn').click();
    };

    // Delete ritual
    ritualList.onclick = e => {
        if (e.target.classList.contains('ritual-delete')) {
            const name = e.target.dataset.name;
            if (confirm(`Delete "${name}"?`)) {
                data.rituals = data.rituals.filter(r => r.name !== name);
                Object.keys(data.completions).forEach(d => {
                    data.completions[d] = data.completions[d].filter(n => n !== name);
                });
                save();
                render();
            }
        }
        // Rename ritual
        if (e.target.classList.contains('ritual-name-text')) {
            const item = e.target.closest('.ritual-item');
            const oldName = item.dataset.name;
            const newName = prompt('Rename ritual:', oldName);
            if (newName && newName.trim() && newName.trim().toLowerCase() !== oldName) {
                const trimmed = newName.trim().toLowerCase();
                // Check for duplicate
                if (data.rituals.find(r => r.name === trimmed)) {
                    alert('A ritual with that name already exists.');
                    return;
                }
                // Update ritual name
                const ritual = data.rituals.find(r => r.name === oldName);
                if (ritual) {
                    ritual.name = trimmed;
                    // Update all completions
                    Object.keys(data.completions).forEach(d => {
                        const idx = data.completions[d].indexOf(oldName);
                        if (idx !== -1) {
                            data.completions[d][idx] = trimmed;
                        }
                    });
                    save();
                    render();
                }
            }
        }
    };

    // Keyboard
    document.onkeydown = e => {
        if (e.key === 'Escape') {
            settings.classList.add('hidden');
        }
    };
}

init();
