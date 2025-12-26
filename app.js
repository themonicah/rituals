const COLORS = ['#58CC02', '#1CB0F6', '#FF9600', '#CE82FF', '#FF86D0', '#FFC800'];
const DEFAULT_RITUALS = [
    { name: 'moving my body', addedAt: new Date().toISOString() },
    { name: 'draw', addedAt: new Date().toISOString() },
    { name: 'mascot', addedAt: new Date().toISOString() }
];

let data = { rituals: [], completions: {}, ideas: [] };
let currentWeekStart = getWeekStart(new Date());
let selectedDate = getDateStr(new Date()); // Default to today

// DOM
const streaksEl = document.getElementById('streaks');
const calendarEl = document.getElementById('calendar');
const statsEl = document.getElementById('stats');
const ideasEl = document.getElementById('ideas');
const monthLabel = document.getElementById('month-label');
const checklistEl = document.getElementById('checklist');
const checklistDate = document.getElementById('checklist-date');
const settings = document.getElementById('settings');
const ritualList = document.getElementById('ritual-list');

function init() {
    load();
    render();
    setupEvents();
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
        if (!data.ideas) data.ideas = [];
    } else {
        data = { rituals: [...DEFAULT_RITUALS], completions: {}, ideas: [] };
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
    renderIdeas();
    renderSettings();
}

function renderStreaks() {
    streaksEl.innerHTML = data.rituals.map((r, i) => {
        const streak = calcStreak(r.name);
        const color = getColor(i);
        const active = streak > 0;
        return `
            <div class="streak ${active ? '' : 'inactive'}">
                <span class="streak-tooltip">${r.name}</span>
                <span class="streak-icon">🔥</span>
                <span class="streak-count" style="color: ${active ? color : 'inherit'}">${streak}</span>
            </div>
        `;
    }).join('');
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
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const todayStr = getDateStr(today);

    // Update month label
    const midWeek = new Date(currentWeekStart);
    midWeek.setDate(midWeek.getDate() + 3);
    monthLabel.textContent = midWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let html = '';
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        const str = getDateStr(d);
        const isToday = str === todayStr;
        const isSelected = str === selectedDate;
        const completed = data.completions[str] || [];
        const isPerfect = completed.length === data.rituals.length && data.rituals.length > 0;

        const dots = data.rituals.map((r, idx) => {
            const done = completed.includes(r.name);
            return `<div class="dot ${done ? 'done' : ''}" style="background: ${getColor(idx)}"></div>`;
        }).join('');

        html += `
            <div class="day ${isToday ? 'today' : ''} ${isPerfect ? 'perfect' : ''}" data-date="${str}">
                <div class="day-name">${dayNames[d.getDay()]}</div>
                <div class="day-num">${d.getDate()}</div>
                <div class="day-dots">${dots}</div>
            </div>
        `;
    }
    calendarEl.innerHTML = html;
}

function renderStats() {
    const circ = 2 * Math.PI * 10;

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
                    <svg width="28" height="28">
                        <circle class="bg" cx="14" cy="14" r="10"/>
                        <circle class="progress" cx="14" cy="14" r="10"
                            stroke="${color}"
                            stroke-dasharray="${circ}"
                            stroke-dashoffset="${offset}"/>
                    </svg>
                </div>
            </div>
        `;
    }).join('');
}

function renderIdeas() {
    const sorted = [...data.ideas].sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1);

    ideasEl.innerHTML = sorted.map(idea => {
        const days = idea.createdAt ? Math.floor((new Date() - new Date(idea.createdAt)) / (1000*60*60*24)) : 0;
        const ageText = days > 0 && !idea.completed ? `(${days})` : '';

        return `
            <div class="idea ${idea.completed ? 'done' : ''}" data-id="${idea.id}">
                <div class="idea-check ${idea.completed ? 'done' : ''}" data-id="${idea.id}"></div>
                <span class="idea-text">${escapeHtml(idea.text)}</span>
                ${ageText ? `<span class="idea-age">${ageText}</span>` : ''}
                <button class="idea-delete" data-id="${idea.id}">×</button>
            </div>
        `;
    }).join('');
}

function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

function renderSettings() {
    ritualList.innerHTML = data.rituals.map((r, i) => `
        <div class="ritual-item">
            <div class="ritual-color" style="background: ${getColor(i)}"></div>
            <span>${r.name}</span>
            <button data-name="${r.name}">×</button>
        </div>
    `).join('');
}

function toggleRitual(name) {
    if (!data.completions[selectedDate]) data.completions[selectedDate] = [];

    const idx = data.completions[selectedDate].indexOf(name);
    if (idx === -1) {
        data.completions[selectedDate].push(name);
    } else {
        data.completions[selectedDate].splice(idx, 1);
    }

    save();
    render();
}

function setupEvents() {
    // Navigation
    document.getElementById('prev').onclick = () => {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        renderCalendar();
    };
    document.getElementById('next').onclick = () => {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        renderCalendar();
    };

    // Calendar click - select day
    calendarEl.onclick = e => {
        const day = e.target.closest('.day');
        if (day) {
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

    // Add ritual
    document.getElementById('add-ritual-btn').onclick = () => {
        const input = document.getElementById('ritual-input');
        const name = input.value.trim().toLowerCase();
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
        if (e.target.tagName === 'BUTTON') {
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
    };

    // Ideas
    document.getElementById('add-idea-btn').onclick = () => {
        const input = document.getElementById('idea-input');
        const text = input.value.trim();
        if (text) {
            data.ideas.push({ id: Date.now().toString(), text, completed: false, createdAt: new Date().toISOString() });
            save();
            renderIdeas();
            input.value = '';
        }
    };
    document.getElementById('idea-input').onkeypress = e => {
        if (e.key === 'Enter') document.getElementById('add-idea-btn').click();
    };

    ideasEl.onclick = e => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('idea-check')) {
            const idea = data.ideas.find(i => i.id === id);
            if (idea) { idea.completed = !idea.completed; save(); renderIdeas(); }
        }
        if (e.target.classList.contains('idea-delete')) {
            data.ideas = data.ideas.filter(i => i.id !== id);
            save();
            renderIdeas();
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
