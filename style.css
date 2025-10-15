// Core elements
const inputBox = document.getElementById('inputBox');
const suggestions = document.getElementById('suggestions');
const searchButton = document.getElementById('searchButton');
const clearButton = document.getElementById('clearButton');

// Initial keywords (example)
let availablekeywords = [
    'ខេត្តសៀមរាប',
    'ខេត្តកំពង់ចាម',
    'រាជធានីភ្នំពេញ',
    'ខេត្តកណ្តាល',
];

// Debounce helper
function debounce(fn, wait) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

// Autosize input and sync dropdown width (approximation)
function autosizeInput() {
    if (!inputBox) return;
    const base = 14; // px per char
    const minW = 180;
    const maxW = 600;
    const len = Math.max(
        inputBox.value.length,
        inputBox.placeholder ? inputBox.placeholder.length : 0
    );
    const w = Math.max(minW, Math.min(maxW, Math.round(len * base)));
    inputBox.style.width = w + 'px';
    if (suggestions) suggestions.style.minWidth = inputBox.offsetWidth + 'px';
}

function updateClearButton() {
    if (!clearButton) return;
    if (inputBox.value && inputBox.value.trim().length) {
        clearButton.style.display = 'flex';
    } else {
        clearButton.style.display = 'none';
    }
}

function setInputValueAndShowFull(value) {
    inputBox.value = value || '';
    inputBox.title = inputBox.value;
    autosizeInput();
    inputBox.scrollLeft = 0;
    updateClearButton();
}

// Suggestions rendering
const onInput = debounce(function () {
    const q = inputBox.value.trim().toLowerCase();
    if (!q) {
        if (suggestions) {
            suggestions.innerHTML = '';
            suggestions.style.display = 'none';
        }
        searchAllResults('');
        updateClearButton();
        autosizeInput();
        return;
    }
    const matches = availablekeywords
        .filter((k) => k.toLowerCase().includes(q))
        .slice(0, 8);
    suggestions.innerHTML = '';
    if (matches.length === 0) {
        suggestions.style.display = 'none';
    } else {
        matches.forEach((m) => {
            const li = document.createElement('li');
            li.textContent = m;
            li.className = 'suggestion-item';
            li.addEventListener('click', function () {
                setInputValueAndShowFull(m);
                suggestions.innerHTML = '';
                suggestions.style.display = 'none';
                searchAllResults(m);
            });
            suggestions.appendChild(li);
        });
        suggestions.style.display = 'block';
    }
    updateClearButton();
    autosizeInput();
}, 250);

if (inputBox) {
    inputBox.addEventListener('input', onInput);
    inputBox.addEventListener('blur', function () {
        setTimeout(() => {
            if (suggestions) {
                suggestions.innerHTML = '';
                suggestions.style.display = 'none';
            }
        }, 150);
    });

    // Enter key triggers search
    inputBox.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const query = inputBox.value.trim();
            searchAllResults(query);
        }
    });

    // Optional keyboard navigation in suggestions
    let active = -1;
    inputBox.addEventListener('keydown', function (e) {
        const items = suggestions.querySelectorAll('.suggestion-item');
        if (!items.length) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            active = Math.min(active + 1, items.length - 1);
            items.forEach((i) => i.classList.remove('active'));
            items[active].classList.add('active');
            items[active].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            active = Math.max(active - 1, 0);
            items.forEach((i) => i.classList.remove('active'));
            items[active].classList.add('active');
            items[active].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            if (active >= 0 && items[active]) {
                e.preventDefault();
                setInputValueAndShowFull(items[active].textContent);
                suggestions.innerHTML = '';
                suggestions.style.display = 'none';
                searchAllResults(inputBox.value);
                active = -1;
            }
        } else if (e.key === 'Escape') {
            suggestions.innerHTML = '';
            suggestions.style.display = 'none';
            active = -1;
        }
    });
}

if (clearButton) {
    clearButton.addEventListener('click', function () {
        setInputValueAndShowFull('');
        if (suggestions) {
            suggestions.innerHTML = '';
            suggestions.style.display = 'none';
        }
        searchAllResults('');
        inputBox.focus();
    });
}

if (searchButton) {
    searchButton.addEventListener('click', function () {
        setInputValueAndShowFull(inputBox.value);
        searchAllResults(inputBox.value.trim());
    });
}

// Table filtering
function searchTable(query) {
    const table = document.querySelector('.result-box table');
    if (!table) return;
    const rows = table.querySelectorAll('tr');
    const q = (query || '').trim().toLowerCase();
    rows.forEach((row, idx) => {
        if (idx === 0) {
            row.style.display = '';
            return;
        }
        const text = row.textContent ? row.textContent.toLowerCase() : '';
        row.style.display = !q || text.includes(q) ? '' : 'none';
    });
}

// Unified search over table or generic result items
function searchAllResults(query) {
    const q = (query || '').trim().toLowerCase();
    const table = document.querySelector('.result-box table');
    if (table && table.querySelectorAll('tr').length > 0) {
        searchTable(query);
        updateResultsTitle(query);
        return;
    }
    const container = document.querySelector('.result-box');
    if (!container) return;
    const itemSelectors = ['.result-item', '.result-card', '.card', '.search-result'];
    let items = [];
    for (const s of itemSelectors) {
        const found = container.querySelectorAll(s);
        if (found && found.length) {
            items = Array.from(found);
            break;
        }
    }
    if (!items.length) {
        items = Array.from(container.children).filter(
            (el) => el.tagName.toLowerCase() !== 'table'
        );
    }
    items.forEach((it) => {
        const text = it.textContent ? it.textContent.toLowerCase() : '';
        it.style.display = !q || text.includes(q) ? '' : 'none';
    });
    updateResultsTitle(query);
}

// Results title + document title update
function updateResultsTitle(query) {
    const titleEl = document.getElementById('resultsTitle');
    if (!titleEl) return;
    const q = (query || '').trim();
    let count = 0;
    const table = document.querySelector('.result-box table');
    if (table && table.querySelectorAll('tr').length > 0) {
        const rows = Array.from(table.querySelectorAll('tr'));
        count = rows.slice(1).filter((r) => r.style.display !== 'none').length;
    } else {
        const container = document.querySelector('.result-box');
        if (container) {
            const items = Array.from(
                container.querySelectorAll('.result-item, .result-card, .card, .search-result')
            );
            if (items.length > 0) {
                count = items.filter((i) => i.style.display !== 'none').length;
            } else {
                const children = Array.from(container.children).filter(
                    (el) => el.tagName.toLowerCase() !== 'table'
                );
                count = children.filter((c) => c.style.display !== 'none').length;
            }
        }
    }
    if (!q) {
        titleEl.hidden = true;
        document.title = 'បញ្ជីដីរដ្ឋ';
        return;
    }
    titleEl.hidden = false;
    titleEl.textContent = `Results for "${q}" — ${count}`;
    document.title = `${q} — ${count} results`;
}

// Build availablekeywords from table
function refreshKeywordsFromTable() {
    const table = document.querySelector('.result-box table');
    if (!table) return;
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const set = new Set();
    for (const r of rows) {
        const cells = r.querySelectorAll('td');
        if (cells[0]) set.add(cells[0].textContent.trim());
        if (cells[1]) set.add(cells[1].textContent.trim());
        if (cells[2]) set.add(cells[2].textContent.trim());
    }
    availablekeywords = Array.from(set).filter(Boolean);
}

// --- Persistence: Save/Load rows in localStorage ---
const STORAGE_KEY = 'misti_table_rows_v1';

function serializeTableRows() {
    const table = document.querySelector('.result-box table');
    if (!table) return [];
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    return rows.map((r) => {
        const tds = r.querySelectorAll('td');
        return [
            tds[0] ? tds[0].textContent : '',
            tds[1] ? tds[1].textContent : '',
            tds[2] ? tds[2].textContent : '',
            tds[3] ? tds[3].textContent : '',
            tds[4] ? tds[4].textContent : '',
        ];
    });
}

function saveRowsToStorage() {
    try {
        const data = serializeTableRows();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Failed to save rows:', e);
    }
}

function loadRowsFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch (e) {
        console.warn('Failed to load rows:', e);
        return [];
    }
}

// Add-row feature wiring (if present in DOM)
const addRowBtn = document.getElementById('addRowBtn');
const addRowForm = document.getElementById('addRowForm');
const saveRowBtn = document.getElementById('saveRowBtn');
const cancelRowBtn = document.getElementById('cancelRowBtn');
const clearTableBtn = document.getElementById('clearTableBtn');

function appendRow(cols) {
    const table = document.querySelector('.result-box table');
    if (!table) return;
    // Use or create a dedicated tbody for custom added rows to avoid mixing into grouped tbodies
    let tbody = table.querySelector('tbody.custom-added');
    if (!tbody) {
        tbody = document.createElement('tbody');
        tbody.className = 'custom-added';
        table.appendChild(tbody); // append at end so new rows appear at bottom
    }
    const tr = document.createElement('tr');
    for (let i = 0; i < 5; i++) {
        const td = document.createElement('td');
        td.textContent = cols[i] || '';
        tr.appendChild(td);
    }
    tbody.appendChild(tr);
    // Return the created row for follow-up (highlight/scroll)
    return tr;
}

if (addRowBtn && addRowForm) {
    addRowBtn.addEventListener('click', function () {
        const visible = addRowForm.style.display === 'block';
        addRowForm.style.display = visible ? 'none' : 'block';
    });

    if (cancelRowBtn) {
        cancelRowBtn.addEventListener('click', function () {
            addRowForm.reset();
            addRowForm.style.display = 'none';
        });
    }

        if (saveRowBtn) {
            addRowForm.addEventListener('submit', function (e) {
                e.preventDefault();
                // Collect values without optional chaining for broader compatibility
                const getVal = (id) => {
                    const el = document.getElementById(id);
                    return el ? el.value : '';
                };
                const cols = [
                    getVal('f_col0'),
                    getVal('f_col1'),
                    getVal('f_col2'),
                    getVal('f_col3'),
                    getVal('f_col4'),
                ];
                const newRow = appendRow(cols);
                saveRowsToStorage();
                refreshKeywordsFromTable();
                // Clear any active search so the new row is visible immediately
                setInputValueAndShowFull('');
                searchAllResults('');
                updateResultsTitle('');
                // Highlight and scroll to the new row for visual feedback
                if (newRow) {
                    newRow.classList.add('highlight');
                    newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => newRow.classList.remove('highlight'), 1200);
                }
                // Reset and hide the form
                addRowForm.reset();
                addRowForm.style.display = 'none';
            });
        }
}

        // Clear all table data and storage
        if (clearTableBtn) {
            clearTableBtn.addEventListener('click', function () {
                if (!confirm('Are you sure you want to delete all rows?')) return;
                const table = document.querySelector('.result-box table');
                if (table) {
                    const tbodies = Array.from(table.querySelectorAll('tbody'));
                    tbodies.forEach((tb) => (tb.innerHTML = ''));
                }
                // Clear storage and refresh keywords/results
                localStorage.removeItem(STORAGE_KEY);
                refreshKeywordsFromTable();
                setInputValueAndShowFull('');
                searchAllResults('');
                updateResultsTitle('');
            });
        }

// Utility to collect results by class name
function getResultsFromClass(className) {
    if (!className) return [];
    const matched = Array.from(
        document.querySelectorAll('.result-box table tr.' + className)
    );
    if (matched.length === 0) {
        const inner = Array.from(
            document.querySelectorAll('.result-box table .' + className)
        );
        const rows = inner.map((el) => el.closest('tr')).filter(Boolean);
        return rows.map((r) => {
            const cells = Array.from(r.querySelectorAll('td,th')).map((c) =>
                c.textContent.trim()
            );
            return { element: r, cells, text: r.textContent.trim() };
        });
    }
    return matched.map((r) => {
        const cells = Array.from(r.querySelectorAll('td,th')).map((c) =>
            c.textContent.trim()
        );
        return { element: r, cells, text: r.textContent.trim() };
    });
}
window.getResultsFromClass = getResultsFromClass;

// On load: hydrate table from localStorage if present
(function initFromStorage(){
    const rows = loadRowsFromStorage();
    if (rows.length) {
        rows.forEach(cols => appendRow(cols));
        refreshKeywordsFromTable();
        updateResultsTitle('');
    }
})();

// --- Optional: make table columns sortable ---
(function initSortableTable(){
    const table = document.querySelector('.result-box table');
    if (!table || !table.tHead) return;
    const ths = Array.from(table.tHead.querySelectorAll('th'));
    if (!ths.length) return;

    let sortState = { index: -1, dir: 'asc' };

    function setAriaSort(activeIdx){
        ths.forEach((th, i) => {
            const state = i === activeIdx ? (sortState.dir === 'asc' ? 'ascending' : 'descending') : 'none';
            th.setAttribute('aria-sort', state);
        });
    }

    function isNumericColumn(rows, index){
        return rows.every(r => {
            const cell = r.children[index];
            if (!cell) return true;
            const raw = cell.textContent.trim().replace(/[\s,]/g, '');
            return raw === '' || !isNaN(Number(raw));
        });
    }

    function sortByColumn(index){
        let dir = 'asc';
        if (sortState.index === index) dir = sortState.dir === 'asc' ? 'desc' : 'asc';
        sortState = { index, dir };

        const tbody = table.querySelector('tbody.custom-added') || table.querySelector('tbody');
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll('tr'));
        if (!rows.length) return;

        const collator = new Intl.Collator(navigator.language || 'km', { numeric: true, sensitivity: 'base' });
        const numeric = isNumericColumn(rows, index);

        rows.sort((a, b) => {
            const av = (a.children[index]?.textContent || '').trim();
            const bv = (b.children[index]?.textContent || '').trim();
            let cmp;
            if (numeric) {
                const an = parseFloat(av.replace(/[\s,]/g, ''));
                const bn = parseFloat(bv.replace(/[\s,]/g, ''));
                if (isNaN(an) && isNaN(bn)) cmp = 0; else if (isNaN(an)) cmp = -1; else if (isNaN(bn)) cmp = 1; else cmp = an - bn;
            } else {
                cmp = collator.compare(av, bv);
            }
            return dir === 'asc' ? cmp : -cmp;
        });

        const frag = document.createDocumentFragment();
        rows.forEach(r => frag.appendChild(r));
        tbody.appendChild(frag);
        setAriaSort(index);
        try { saveRowsToStorage(); } catch {}
    }

    ths.forEach((th, idx) => {
        th.classList.add('sortable');
        th.setAttribute('role', 'columnheader');
        th.setAttribute('aria-sort', 'none');
        th.tabIndex = 0;
        th.addEventListener('click', () => sortByColumn(idx));
        th.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sortByColumn(idx); }
        });
    });
})();
