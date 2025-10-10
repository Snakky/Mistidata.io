let availablekeywords = [
    "ខេត្តកំពង់ចាម",
    "ក្រុងភ្នំពេញ",
    "ខេត្តសៀមរាប",
    "ខេត្តកណ្តាល",
    // Add more keywords as needed
];

const results = document.querySelector(".result-box");
const inputBox = document.getElementById("inputBox");
const suggestions = document.getElementById('suggestions');
const searchButton = document.getElementById('searchButton');

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
                    // filter table immediately for the selected suggestion
                    searchTable(m);
                });
                suggestions.appendChild(li);
            });
            suggestions.style.display = 'block';
        }
    });

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
            const query = inputBox.value.trim().toLowerCase();
            // Simple behavior: if query matches a keyword, keep it in the input (already set);
            // Here we could filter visible table rows. For now, log and highlight matches.
            console.log('Search for:', query);
            // Example: highlight matching table rows
            const rows = document.querySelectorAll('.result-box table tbody tr, .result-box table tr');
            rows.forEach(r => r.classList && r.classList.remove('highlight'));
            if (query){
                rows.forEach(r => {
                    if (r.textContent && r.textContent.toLowerCase().includes(query)){
                        r.classList.add('highlight');
                    }
                });
            }
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

    // Enter key should perform the search (when not selecting suggestion)
    inputBox.addEventListener('keydown', function(e){
        if (e.key === 'Enter'){
            const query = inputBox.value.trim();
            searchTable(query);
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
