let availablekeywords = [
    "ខេត្តសៀមរាប",
    "ខេត្តកំពង់ចាម",
    "រាជធានីភ្នំពេញ",
    "ខេត្តកណ្តាល",
    // Add more keywords as needed
];

const results = document.querySelector(".result-box");
const inputBox = document.getElementById("inputBox");
const suggestions = document.getElementById('suggestions');
const searchButton = document.getElementById('searchButton');

// AUTOSIZE: create a hidden measurer element
let _autosizeMeasure = document.querySelector('._autosize-measure');
if (!_autosizeMeasure){
    _autosizeMeasure = document.createElement('div');
    _autosizeMeasure.className = '_autosize-measure';
    document.body.appendChild(_autosizeMeasure);
}

if (inputBox) {
    inputBox.addEventListener('input', function () {
        const q = inputBox.value.trim().toLowerCase();
        if (!q) {
            suggestions.innerHTML = '';
            suggestions.style.display = 'none';
            return;
        }

        const matches = availablekeywords.filter(keyword => {
            return keyword.toLowerCase().includes(q);
        }).slice(0, 8);

        // Render
        suggestions.innerHTML = '';
        if (matches.length === 0) {
            suggestions.style.display = 'none';
        } else {
            matches.forEach(m => {
                const li = document.createElement('li');
                li.textContent = m;
                li.className = 'suggestion-item';
                // use click so the input keeps focus properly across browsers
                li.addEventListener('click', function () {
                    inputBox.value = m;
                    suggestions.innerHTML = '';
                    suggestions.style.display = 'none';
                    // filter results (table or divs) immediately for the selected suggestion
                    searchAllResults(m);
                });
                suggestions.appendChild(li);
            });
            suggestions.style.display = 'block';
        }
    });

    // Autosize handler: set input width to content width (with min/max)
    function autosizeInput(){
        if (!inputBox || !_autosizeMeasure) return;
        // Copy font and padding styles so measurement is accurate
        const style = window.getComputedStyle(inputBox);
        _autosizeMeasure.style.font = style.font;
        _autosizeMeasure.style.padding = style.padding;
        _autosizeMeasure.style.fontSize = style.fontSize;
        _autosizeMeasure.style.fontFamily = style.fontFamily;
        const value = inputBox.value || inputBox.placeholder || '';
        _autosizeMeasure.textContent = value;

        const parent = inputBox.parentElement;
        const parentWidth = parent ? parent.getBoundingClientRect().width : window.innerWidth;
        const min = 160; // px
        const max = Math.max(200, parentWidth - 80);
        const measured = Math.ceil(_autosizeMeasure.getBoundingClientRect().width) + 24; // extra buffer
        const final = Math.min(Math.max(measured, min), max);
        inputBox.style.width = final + 'px';
        // Sync suggestions width
        if (suggestions) suggestions.style.width = final + 'px';
    }

    // call autosize on input and on window resize
    inputBox.addEventListener('input', autosizeInput);
    window.addEventListener('resize', autosizeInput);
    // initial call
    autosizeInput();

    // Hide suggestions on blur (with a short delay to allow click events)
    inputBox.addEventListener('blur', function (){
        setTimeout(() => {
            if (suggestions) {
                suggestions.innerHTML = '';
                suggestions.style.display = 'none';
            }
        }, 150);
    });

    // Search button: show the current input value and (optionally) filter the table
    if (searchButton){
        searchButton.addEventListener('click', function(){
            const query = inputBox.value.trim();
            console.log('Search for:', query);
            searchAllResults(query);
        });
    }

    // Helper: filter the result table to show only rows that match the query
    function searchTable(query){
        const table = document.querySelector('.result-box table');
        if (!table) return;
        const rows = table.querySelectorAll('tr');
        const q = query.trim().toLowerCase();
        // Keep the header row visible (first row)
        rows.forEach((row, idx) => {
            if (idx === 0) { row.style.display = ''; return; }
            const text = row.textContent ? row.textContent.toLowerCase() : '';
            if (!q || text.includes(q)){
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Generic search: supports table rows or result divs/cards inside `.result-box`.
    function searchAllResults(query){
        const q = (query || '').trim().toLowerCase();
        // Prefer table if present and has rows
        const table = document.querySelector('.result-box table');
        if (table && table.querySelectorAll('tr').length > 0){
            searchTable(query);
            updateResultsTitle(query);
            return;
        }

        const container = document.querySelector('.result-box');
        if (!container) return;

        // Try common result element classes first
        const itemSelectors = ['.result-item', '.result-card', '.card', '.search-result'];
        let items = [];
        for (const s of itemSelectors){
            const found = container.querySelectorAll(s);
            if (found && found.length) { items = Array.from(found); break; }
        }

        // Fallback: direct child divs of the result container (excluding tables)
        if (!items.length){
            items = Array.from(container.children).filter(el => el.tagName.toLowerCase() !== 'table');
        }

        items.forEach(it => {
            const text = it.textContent ? it.textContent.toLowerCase() : '';
            if (!q || text.includes(q)){
                it.style.display = '';
            } else {
                it.style.display = 'none';
            }
        });
        updateResultsTitle(query);
    }

    // Update the visible results title and document title
    function updateResultsTitle(query){
        const titleEl = document.getElementById('resultsTitle');
        if (!titleEl) return;
        const q = (query || '').trim();
        let count = 0;
        const table = document.querySelector('.result-box table');
        if (table && table.querySelectorAll('tr').length > 0){
            const rows = Array.from(table.querySelectorAll('tr'));
            // exclude header
            count = rows.slice(1).filter(r => r.style.display !== 'none').length;
        } else {
            const container = document.querySelector('.result-box');
            if (container){
                const items = Array.from(container.querySelectorAll('.result-item, .result-card, .card, .search-result'));
                if (items.length > 0){
                    count = items.filter(i => i.style.display !== 'none').length;
                } else {
                    // fallback: direct child divs
                    const children = Array.from(container.children).filter(el => el.tagName.toLowerCase() !== 'table');
                    count = children.filter(c => c.style.display !== 'none').length;
                }
            }
        }

        if (!q){
            titleEl.hidden = true;
            document.title = 'បញ្ជីដីរដ្ឋ';
            return;
        }

        titleEl.hidden = false;
        titleEl.textContent = `Results for "${q}" — ${count}`;
        // Update browser tab title too
        document.title = `${q} — ${count} results`;
    }

    // Enter key should perform the search (when not selecting suggestion)
    inputBox.addEventListener('keydown', function(e){
        if (e.key === 'Enter'){
            const query = inputBox.value.trim();
            searchAllResults(query);
        }
    });

    // Optional: keyboard navigation (Arrow keys + Enter)
    let active = -1;
    inputBox.addEventListener('keydown', function(e){
        const items = suggestions.querySelectorAll('.suggestion-item');
        if (!items.length) return;
        if (e.key === 'ArrowDown'){
            e.preventDefault();
            active = Math.min(active + 1, items.length - 1);
            items.forEach(i => i.classList.remove('active'));
            items[active].classList.add('active');
            items[active].scrollIntoView({block:'nearest'});
        } else if (e.key === 'ArrowUp'){
            e.preventDefault();
            active = Math.max(active - 1, 0);
            items.forEach(i => i.classList.remove('active'));
            items[active].classList.add('active');
            items[active].scrollIntoView({block:'nearest'});
        } else if (e.key === 'Enter'){
            if (active >= 0 && items[active]){
                e.preventDefault();
                inputBox.value = items[active].textContent;
                suggestions.innerHTML = '';
                suggestions.style.display = 'none';
                // perform search using the selected suggestion
                searchAllResults(inputBox.value);
                active = -1;
            }
        } else if (e.key === 'Escape'){
            suggestions.innerHTML = '';
            suggestions.style.display = 'none';
            active = -1;
        }
        console.log(results);
    });
    
    }

// Utility: collect results matching a class name and return structured data
function getResultsFromClass(className){
    if (!className) return [];
    const matched = Array.from(document.querySelectorAll('.result-box table tr.' + className));
    // If rows aren't using classes but cells are, also look for elements with the class inside the table
    if (matched.length === 0){
        const inner = Array.from(document.querySelectorAll('.result-box table .' + className));
        // Map to their closest table row
        const rows = inner.map(el => el.closest('tr')).filter(Boolean);
        return rows.map(r => {
            const cells = Array.from(r.querySelectorAll('td,th')).map(c => c.textContent.trim());
            return { element: r, cells, text: r.textContent.trim() };
        });
    }
    return matched.map(r => {
        const cells = Array.from(r.querySelectorAll('td,th')).map(c => c.textContent.trim());
        return { element: r, cells, text: r.textContent.trim() };
    });
}

// Expose helper for console use
window.getResultsFromClass = getResultsFromClass;
