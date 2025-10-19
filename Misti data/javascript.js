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
    // Keep input flexible (full width) in the new flex layout; just sync dropdown width
    inputBox.style.width = '100%';
    if (suggestions) suggestions.style.minWidth = inputBox.getBoundingClientRect().width + 'px';
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

// Suggestions rendering with live search
const onInput = debounce(function () {
    const q = inputBox.value.trim().toLowerCase();
    if (!q) {
        if (suggestions) {
            suggestions.innerHTML = '';
            suggestions.style.display = 'none';
        }
        clearSearchHighlighting();
        searchAllResults('');
        updateClearButton();
        autosizeInput();
        return;
    }
    const matches = availablekeywords
        .filter((k) => k.toLowerCase().includes(q))
        .slice(0, 8);
    
    if (suggestions) {
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
    }
    
    // Perform live search as user types
    searchAllResults(q);
    updateClearButton();
    autosizeInput();
}, 250);

if (inputBox) {
    inputBox.addEventListener('input', onInput);

    // Hide suggestions on blur with a short delay
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

    // Keyboard navigation in suggestions
    let active = -1;
    inputBox.addEventListener('keydown', function (e) {
        if (!suggestions) return;
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
                searchAllResults(inputBox.value.trim());
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
        clearSearchHighlighting();
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

// Enhanced table filtering with better visual feedback
function searchTable(query) {
    const table = document.querySelector('.result-box table');
    if (!table) return 0;
    
    const q = (query || '').trim().toLowerCase();
    const bodyRows = table.querySelectorAll('tbody tr');
    let visibleCount = 0;
    
    // Clear all previous highlights and row states
    bodyRows.forEach(row => {
        const tds = Array.from(row.querySelectorAll('td'));
        tds.forEach((cell, idx) => {
            cell.classList.remove('highlight', 'search-match');
            
            // Remove highlighting while preserving original HTML structure including links
            const highlights = cell.querySelectorAll('mark.search-highlight');
            highlights.forEach(mark => {
                const parent = mark.parentNode;
                parent.replaceChild(document.createTextNode(mark.textContent), mark);
                parent.normalize();
            });
            
            // Remove wrapper spans added for highlighting (but preserve spans with links or classes)
            const wrapperSpans = cell.querySelectorAll('span');
            wrapperSpans.forEach(span => {
                if (!span.querySelector('a') && !span.classList.length) {
                    const parent = span.parentNode;
                    while (span.firstChild) {
                        parent.insertBefore(span.firstChild, span);
                    }
                    parent.removeChild(span);
                    parent.normalize();
                }
            });
        });
        row.classList.remove('search-result-row', 'hidden-row');
    });
    
    // If no query, show all rows
    if (!q) {
        bodyRows.forEach(row => {
            row.style.display = '';
            row.classList.remove('search-result-row', 'hidden-row');
        });
        return bodyRows.length;
    }
    
    bodyRows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        // Skip the first cell (row number) for matching/highlighting; also skip last map cell if present
        const cells = Array.from(tds).slice(1);
        if (tds.length >= 7) {
            cells.pop(); // drop map column from match/highlight
        }
        let hasMatch = false;
        
        // Check each cell for matches
        cells.forEach(cell => {
            const cellText = (cell.textContent || '').trim();
            const cellTextLower = cellText.toLowerCase();
            
            if (cellTextLower.includes(q)) {
                hasMatch = true;
                // Highlight the matching text within the cell
                highlightTextInCell(cell, cellText, q);
                cell.classList.add('search-match');
            }
        });
        
        if (hasMatch) {
            row.style.display = '';
            row.classList.add('search-result-row');
            row.classList.remove('hidden-row');
            visibleCount++;
        } else {
            row.style.display = 'none';
            row.classList.add('hidden-row');
            row.classList.remove('search-result-row');
        }
    });
    
    // Scroll to first match if results exist
    if (visibleCount > 0) {
        const firstMatch = table.querySelector('.search-result-row');
        if (firstMatch) {
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    return visibleCount;
}

// Function to highlight matching text within a cell while preserving HTML links
function highlightTextInCell(cell, originalText, query) {
    if (!query || !originalText) return;
    
    // Check if the cell contains HTML links
    const hasLinks = cell.querySelector('a');
    
    if (hasLinks) {
        // For cells with links, highlight only the text content of non-link elements
        const textNodes = [];
        const walker = document.createTreeWalker(
            cell,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            // Only highlight text that's not inside a link
            if (!node.parentElement.closest('a')) {
                textNodes.push(node);
            }
        }
        
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            if (regex.test(text)) {
                const highlightedText = text.replace(regex, '<mark class="search-highlight">$1</mark>');
                const span = document.createElement('span');
                span.innerHTML = highlightedText;
                textNode.parentNode.replaceChild(span, textNode);
            }
        });
    } else {
        // For cells without links, use the original highlighting method
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        const highlightedText = originalText.replace(regex, '<mark class="search-highlight">$1</mark>');
        cell.innerHTML = highlightedText;
    }
}

// --- Row numbering helpers (№) ---
function ensureRownumColumn() {
    const table = document.querySelector('.result-box table');
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row) => {
        const first = row.querySelector('td');
        const cells = row.querySelectorAll('td');
        // If first cell isn't a row number yet, prepend one
        if (!first || !first.classList.contains('rownum-cell')) {
            if (cells.length >= 5) {
                const td = document.createElement('td');
                td.className = 'rownum-cell';
                td.textContent = '';
                row.insertBefore(td, row.firstChild);
            }
        }
    });
}

function renumberVisibleRows() {
    const table = document.querySelector('.result-box table');
    if (!table) return 0;
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    let num = 1;
    rows.forEach((row) => {
        if (row.style.display === 'none') return;
        let first = row.querySelector('td');
        if (!first) return;
        // Ensure first cell exists for rownum
        if (!first.classList.contains('rownum-cell')) {
            const td = document.createElement('td');
            td.className = 'rownum-cell';
            td.textContent = '';
            row.insertBefore(td, row.firstChild);
            first = td;
        }
        first.textContent = num++;
        first.classList.add('rownum-cell');
    });
    return num - 1;
}

// Ensure Map column exists as the last data cell for each row
function ensureMapColumn() {
    const table = document.querySelector('.result-box table');
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        if (!tds.length) return;
        const hasRownum = tds[0].classList.contains('rownum-cell');
        const expectedTotal = hasRownum ? 7 : 6; // 6 data cols + optional rownum
        if (tds.length < expectedTotal) {
            while (row.querySelectorAll('td').length < expectedTotal) {
                const td = document.createElement('td');
                row.appendChild(td);
            }
        }
        const last = row.querySelectorAll('td')[row.querySelectorAll('td').length - 1];
        if (last) last.classList.add('map-cell');
    });
}

// Clear all search highlighting and restore original state
function clearSearchHighlighting() {
    const table = document.querySelector('.result-box table');
    if (!table) return;
    
    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            cell.classList.remove('highlight', 'search-match');
            
            // Remove only the highlighting spans while preserving links
            const highlights = cell.querySelectorAll('mark.search-highlight');
            highlights.forEach(mark => {
                const parent = mark.parentNode;
                parent.replaceChild(document.createTextNode(mark.textContent), mark);
                parent.normalize(); // Merge adjacent text nodes
            });
            
            // Also remove any wrapper spans that were added for highlighting
            const wrapperSpans = cell.querySelectorAll('span');
            wrapperSpans.forEach(span => {
                if (!span.querySelector('a') && !span.classList.length) {
                    // Only remove spans that don't contain links and have no classes
                    const parent = span.parentNode;
                    while (span.firstChild) {
                        parent.insertBefore(span.firstChild, span);
                    }
                    parent.removeChild(span);
                    parent.normalize();
                }
            });
        });
        row.classList.remove('search-result-row', 'hidden-row');
        row.style.display = '';
    });
    
    // Remove no-results message
    const noResultsMessage = document.querySelector('.no-results-message');
    if (noResultsMessage) {
        noResultsMessage.remove();
    }
}

// Escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Unified search over table or generic result items
function searchAllResults(query) {
    const q = (query || '').trim().toLowerCase();
    const table = document.querySelector('.result-box table');
    if (table) {
        const visibleCount = searchTable(query);
        // Renumber after filtering
        renumberVisibleRows();
        updateResultsTitle(query, visibleCount);
        return;
    }
}

// Enhanced results title with better messaging
function updateResultsTitle(query, passedCount = null) {
    const titleEl = document.getElementById('resultsTitle');
    if (!titleEl) return;
    const q = (query || '').trim();
    let count = passedCount;
    
    // If count not passed, calculate it
    if (count === null) {
        count = 0;
        const table = document.querySelector('.result-box table');
        if (table && table.querySelectorAll('tr').length > 0) {
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            count = rows.filter((r) => r.style.display !== 'none').length;
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
    }
    
    // Remove any existing no-results message
    const existingMessage = document.querySelector('.no-results-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    if (!q) {
        titleEl.hidden = true;
        document.title = 'បញ្ជីដីរដ្ឋ';
        return;
    }
    
    titleEl.hidden = false;
    
    if (count === 0) {
        titleEl.innerHTML = `
            <div class="search-status">🔍 ស្វែងរកសម្រាប់: "${q}"</div>
            <div style="color: #ef4444; font-weight: 600;">❌ រកមិនឃើញលទ្ធផល</div>
        `;
        
        // Add no results message after the table
        const resultBox = document.querySelector('.result-box');
        if (resultBox) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results-message';
            noResultsDiv.innerHTML = `
                <div style="font-size: 1.5rem; margin-bottom: 10px;">🔍</div>
                <div style="font-size: 1.2rem; margin-bottom: 8px;">រកមិនឃើញទិន្នន័យ</div>
                <div style="color: var(--gray-600);">សូមព្យាយាមស្វែងរកដោយប្រើពាក្យគន្លឹះផ្សេង</div>
            `;
            resultBox.appendChild(noResultsDiv);
        }
        
        document.title = `រកមិនឃើញ "${q}"`;
    } else {
        titleEl.innerHTML = `
            <div class="search-status">🔍 ស្វែងរកសម្រាប់: "${q}"</div>
            <div style="color: #16a34a; font-weight: 600;">✅ ទទួលបានលទ្ធផល ${count} ជួរ</div>
        `;
        document.title = `${q} — ${count} results`;
    }
}

// Build availablekeywords from table - extract meaningful words from all columns
function refreshKeywordsFromTable() {
    const table = document.querySelector('.result-box table');
    if (!table) return;
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const set = new Set();
    
    for (const r of rows) {
        // Skip rownum (first) and map (last) column when building suggestion keywords
        const allTds = Array.from(r.querySelectorAll('td'));
        const cells = allTds.slice(1, allTds.length > 1 ? allTds.length - 1 : allTds.length);
        cells.forEach(cell => {
            const text = (cell.textContent || '').trim();
            if (text && text.length > 2) { // Only add meaningful text
                // Add full cell text
                set.add(text);
                
                // Also add individual words for better matching
                const words = text.split(/\s+/).filter(word => word.length > 2);
                words.forEach(word => set.add(word));
            }
        });
    }
    
    availablekeywords = Array.from(set).filter(Boolean).sort();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    refreshKeywordsFromTable();
    autosizeInput();
    updateClearButton();
    ensureRownumColumn();
    ensureMapColumn();
    renumberVisibleRows();
});

// --- Persistence: Save/Load rows in localStorage ---
const STORAGE_KEY = 'misti_table_rows_v1';

function serializeTableRows() {
    const table = document.querySelector('.result-box table');
    if (!table) return [];
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    return rows.map((r) => {
        const tds = r.querySelectorAll('td');
        const mapCell = tds[6];
        let mapVal = '';
        if (mapCell) {
            const a = mapCell.querySelector('a');
            mapVal = a ? a.getAttribute('href') : (mapCell.textContent || '');
        }
        return [
            tds[1] ? tds[1].textContent : '',
            tds[2] ? tds[2].textContent : '',
            tds[3] ? tds[3].textContent : '',
            tds[4] ? tds[4].textContent : '',
            tds[5] ? tds[5].textContent : '',
            mapVal,
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
const exportJsonBtn = document.getElementById('exportJsonBtn');
const loadSharedBtn = document.getElementById('loadSharedBtn');
 

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
    const cleanText = (s) => {
        const t = (s == null ? '' : String(s));
        return t.replace(/\\t/g, ' ').replace(/\t/g, ' ').replace(/_/g, ' ').replace(/\s{2,}/g, ' ').trim();
    };
    const formatAmount = (s) => {
        const raw = (s == null ? '' : String(s));
        const num = Number(raw.replace(/[^\d.-]/g, ''));
        if (isNaN(num)) return cleanText(s);
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    const formatRef = (s) => {
        const t = cleanText(s);
        if (!t) return '';
        return (t.startsWith('"') && t.endsWith('"')) ? t : `"${t}"`;
    };
    const tr = document.createElement('tr');
    // Prepend row number cell placeholder
    const rn = document.createElement('td');
    rn.className = 'rownum-cell';
    rn.textContent = '';
    tr.appendChild(rn);
    for (let i = 0; i < 6; i++) {
        const td = document.createElement('td');
        let val = cols[i] || '';
        if (i === 3) {
            val = formatAmount(val);
        } else if (i === 4) {
            val = formatRef(val);
        } else {
            val = cleanText(val);
        }
        if (i === 5) {
            // Map URL column: render clickable link if valid URL
            const url = (val || '').trim();
            td.classList.add('map-cell');
            if (url && /^(https?:\/\/)/i.test(url)) {
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.className = 'map-link';
                a.textContent = 'បើកផែនទី';
                td.appendChild(a);
            } else {
                td.textContent = '';
            }
        } else {
            td.textContent = val;
        }
        tr.appendChild(td);
    }
    tbody.appendChild(tr);
    // After appending, renumber visible rows
    renumberVisibleRows();
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
                    getVal('f_col5'),
                ];
                const newRow = appendRow(cols);
                // In cloud mode, also write to Firestore for global visibility
                if (window.CLOUD_MODE && window._cloud && window._cloud.addRow) {
                    window._cloud.addRow(cols).catch(()=>{});
                } else {
                    saveRowsToStorage();
                }
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

        // Clear all table data (cloud-aware)
        if (clearTableBtn) {
            clearTableBtn.addEventListener('click', async function () {
                if (!confirm('Are you sure you want to delete all rows?')) return;
                if (window.CLOUD_MODE && window._cloud && window._cloud.clearAll) {
                    try { await window._cloud.clearAll(); } catch {}
                }
                const table = document.querySelector('.result-box table');
                if (table) {
                    const tbodies = Array.from(table.querySelectorAll('tbody'));
                    tbodies.forEach((tb) => (tb.innerHTML = ''));
                }
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

// Data layer: Firestore (if configured) -> else localStorage -> else data.json
(function initData(){
    const hasFirebase = typeof window !== 'undefined' && window.FIREBASE_CONFIG && window.firebase;
    if (hasFirebase) {
        try {
            const app = firebase.initializeApp(window.FIREBASE_CONFIG);
            const db = firebase.firestore(app);
            const coll = db.collection('misti_rows');

            // Live listener: keep table in sync for everyone
            coll.orderBy('createdAt').onSnapshot((snap) => {
                const rows = [];
                snap.forEach(doc => rows.push(doc.data().cols || []));
                const table = document.querySelector('.result-box table');
                if (!table) return;
                const tbodies = Array.from(table.querySelectorAll('tbody'));
                tbodies.forEach(tb => tb.innerHTML = '');
                rows.forEach(cols => appendRow(cols));
                refreshKeywordsFromTable();
                setInputValueAndShowFull('');
                searchAllResults('');
                updateResultsTitle('');
            });

            // Cloud mode hooks used by existing UI handlers
            window.CLOUD_MODE = true;
            window._cloud = {
                addRow: (cols) => coll.add({ cols, createdAt: firebase.firestore.FieldValue.serverTimestamp() }),
                clearAll: async () => {
                    const snap = await coll.get();
                    const batch = db.batch();
                    snap.forEach(d => batch.delete(d.ref));
                    return batch.commit();
                }
            };

            // In cloud mode, ignore local save
            window.saveRowsToStorage = function(){};
            return; // cloud mode initialized
        } catch (e) {
            console.warn('Firebase unavailable, falling back to local/data.json', e);
        }
    }

    // Local mode: existing behavior plus data.json fallback
    // If HTML already has rows (preloaded), just refresh keywords and title.
    const existing = document.querySelectorAll('.result-box table tbody tr').length;
    if (existing > 0) {
        refreshKeywordsFromTable();
        updateResultsTitle('');
        return;
    }
    const rows = loadRowsFromStorage();
    if (rows.length) {
        rows.forEach(cols => appendRow(cols));
        refreshKeywordsFromTable();
        updateResultsTitle('');
        return;
    }
    // Fallback to data.json only if no static rows and no local rows
    fetch('data.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(json => {
          if (Array.isArray(json)) {
              json.forEach(cols => appendRow(cols));
              refreshKeywordsFromTable();
              updateResultsTitle('');
          }
      })
      .catch(() => {});
})();

// Export current table rows to a JSON download so it can be committed to Git
if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', function(){
        const data = serializeTableRows();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// Manually load shared data.json (overwrites current displayed rows)
if (loadSharedBtn) {
    loadSharedBtn.addEventListener('click', function(){
        fetch('data.json', { cache: 'no-store' })
            .then(r => r.ok ? r.json() : Promise.reject('Not found'))
            .then(json => {
                const table = document.querySelector('.result-box table');
                if (!table) return;
                const tbodies = Array.from(table.querySelectorAll('tbody'));
                tbodies.forEach(tb => tb.innerHTML = '');
                if (Array.isArray(json)) json.forEach(cols => appendRow(cols));
                // Clear localStorage to rely on shared data until user edits
                localStorage.removeItem(STORAGE_KEY);
                refreshKeywordsFromTable();
                setInputValueAndShowFull('');
                searchAllResults('');
                updateResultsTitle('');
            })
            .catch(() => alert('No shared data.json found yet. Use Export to create one and commit it.'));
    });
}



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
        const isRownum = idx === 0;
        const isMap = th.classList.contains('map-col');
        th.setAttribute('role', 'columnheader');
        th.setAttribute('aria-sort', 'none');
        if (isRownum || isMap) {
            // Not sortable
            th.classList.remove('sortable');
            th.tabIndex = -1;
            return;
        }
        th.classList.add('sortable');
        th.tabIndex = 0;
        th.addEventListener('click', () => sortByColumn(idx));
        th.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sortByColumn(idx); }
        });
    });
})();

// --- Generic loader: fetch JSON and populate table ---
// Usage examples (in console or your code):
// loadTableFromUrl('data.json');
// loadTableFromUrl('https://example.com/api/rows');
// loadTableFromUrl('https://.../api', { columns: ['id','type','name','area','sun'], replace: true });
// If 'columns' is omitted and items are objects, the first 5 keys are used.
// If CLOUD_MODE is enabled (Firestore), this will (optionally) replace cloud data and add rows there.
window.loadTableFromUrl = async function(url, opts){
    opts = opts || {};
    const columns = opts.columns || null; // string[] or {0:'id',1:'type',...}
    const replace = opts.replace !== false; // default true

    const titleEl = document.getElementById('resultsTitle');
    if (titleEl) { titleEl.hidden = false; titleEl.textContent = 'Loading…'; }
    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP '+res.status);
        const json = await res.json();
        let arr = [];
        if (Array.isArray(json)) arr = json;
        else if (Array.isArray(json?.data)) arr = json.data;
        else if (Array.isArray(json?.rows)) arr = json.rows;
        else if (json && typeof json === 'object') arr = [json];

        const toSix = (cols) => {
            const out = new Array(6).fill('');
            for (let i=0;i<6;i++){ out[i] = cols[i] ?? ''; }
            return out;
        };
        const objectToCols = (obj) => {
            if (!obj || typeof obj !== 'object') return new Array(6).fill('');
            if (Array.isArray(columns)) {
                return toSix(columns.map(k => obj[k] ?? ''));
            } else if (columns && typeof columns === 'object') {
                const out = new Array(6).fill('');
                for (let i=0;i<6;i++){
                    const key = columns[i];
                    out[i] = key ? (obj[key] ?? '') : '';
                }
                return out;
            } else {
                const keys = Object.keys(obj);
                return toSix(keys.slice(0,6).map(k => obj[k] ?? ''));
            }
        };

        if (window.CLOUD_MODE && window._cloud && window._cloud.addRow) {
            if (replace && window._cloud.clearAll) { try { await window._cloud.clearAll(); } catch{} }
            for (const item of arr) {
                const cols = Array.isArray(item) ? toSix(item) : objectToCols(item);
                try { await window._cloud.addRow(cols); } catch{}
            }
            if (titleEl) titleEl.textContent = `Loaded ${arr.length} rows (cloud)`;
            return;
        }

        // Local/DOM mode: replace table body then save to localStorage
        const table = document.querySelector('.result-box table');
        if (!table) throw new Error('Table not found');
        if (replace) {
            const tbodies = Array.from(table.querySelectorAll('tbody'));
            tbodies.forEach(tb => tb.innerHTML = '');
        }
        for (const item of arr) {
            const cols = Array.isArray(item) ? toSix(item) : objectToCols(item);
            appendRow(cols);
        }
        saveRowsToStorage();
        refreshKeywordsFromTable();
        setInputValueAndShowFull('');
        searchAllResults('');
        updateResultsTitle('');
        if (titleEl) titleEl.textContent = `Loaded ${arr.length} rows`;
    } catch (err) {
        if (titleEl) { titleEl.hidden = false; titleEl.textContent = 'Failed to load data'; }
        console.warn('loadTableFromUrl error:', err);
    }
};
