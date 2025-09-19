/* script.js
   - Saves/loads quotes to/from localStorage
   - Stores last viewed quote index in sessionStorage
   - Exports quotes to a JSON file (Blob + URL.createObjectURL)
   - Imports quotes from a JSON file using FileReader
*/

// ------------- Config / Keys -------------
const STORAGE_KEY = 'dynamic_quote_generator_quotes_v1'; // **localStorage** key (versioned)
const LAST_QUOTE_SESSION_KEY = 'dynamic_quote_generator_last_index'; // **sessionStorage** key

// ------------- Initial (seed) quotes -------------
const DEFAULT_QUOTES = [
  { text: "The best way to predict the future is to invent it.", category: "Inspiration" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" },
  { text: "Stay hungry, stay foolish.", category: "Motivation" }
];

let quotes = []; // runtime array used by the app

// ------------- DOM refs -------------
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const clearStorageBtn = document.getElementById('clearStorageBtn');
const statusEl = document.getElementById('status');
const lastViewedInfo = document.getElementById('lastViewedInfo');

// ------------- Utility: show transient status messages -------------
function showStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? 'crimson' : '#222';
  // auto-clear after a short while for cleanliness
  clearTimeout(showStatus._t);
  showStatus._t = setTimeout(() => { statusEl.textContent = ''; }, 4000);
}

// ------------- Local Storage: load/save -------------
function saveQuotes() {
  // **JSON.stringify** to store the array as a string
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    updateStoredCount();
  } catch (err) {
    console.error('Failed to save quotes to localStorage', err);
    showStatus('Error: could not save quotes to localStorage', true);
  }
}

function loadQuotes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // No saved data -> seed with defaults
    quotes = [...DEFAULT_QUOTES];
    saveQuotes(); // persist seed so user sees something next time
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Saved quotes must be an array');
    // Validate items: only keep objects with string text & category
    quotes = parsed.filter(q => q && typeof q.text === 'string' && typeof q.category === 'string');
    // If validation removed everything (bad file), seed defaults as fallback
    if (quotes.length === 0) {
      quotes = [...DEFAULT_QUOTES];
      saveQuotes();
    }
  } catch (err) {
    console.error('Error parsing saved quotes, resetting to defaults', err);
    quotes = [...DEFAULT_QUOTES];
    saveQuotes();
    showStatus('Saved quotes were corrupt — reset to defaults', true);
  }
}

// ------------- Session Storage: last viewed quote -------------
function saveLastViewedIndex(index) {
  // **sessionStorage** is temporary (cleared on tab close)
  try {
    sessionStorage.setItem(LAST_QUOTE_SESSION_KEY, String(index));
    updateLastViewedInfo(index);
  } catch (err) {
    console.warn('Session storage not available', err);
  }
}

function loadLastViewedIndex() {
  const v = sessionStorage.getItem(LAST_QUOTE_SESSION_KEY);
  return v === null ? null : Number(v);
}

function updateLastViewedInfo(index) {
  if (index === null || typeof index === 'undefined' || !quotes[index]) {
    lastViewedInfo.textContent = '';
    return;
  }
  lastViewedInfo.textContent = `Last viewed (this tab): ${quotes[index].text} — ${quotes[index].category}`;
}

// ------------- Displaying quotes -------------
function showRandomQuote() {
  if (!quotes.length) {
    quoteDisplay.textContent = 'No quotes available. Add one!';
    return;
  }
  const idx = Math.floor(Math.random() * quotes.length);
  const q = quotes[idx];

  // Create/replace DOM nodes (avoid innerHTML for security)
  quoteDisplay.innerHTML = ''; // clear
  const quoteTextEl = document.createElement('p');
  quoteTextEl.textContent = `"${q.text}"`;
  const categoryEl = document.createElement('span');
  categoryEl.textContent = `— ${q.category}`;
  categoryEl.classList.add('category');

  quoteDisplay.appendChild(quoteTextEl);
  quoteDisplay.appendChild(categoryEl);

  // Save index to sessionStorage so it persists across reloads in same tab
  saveLastViewedIndex(idx);
}

// ------------- Adding new quote (UI -> runtime -> storage) -------------
function addQuote() {
  const text = newQuoteText.value.trim();
  const category = newQuoteCategory.value.trim();

  if (!text || !category) {
    showStatus('Please enter both quote and category', true);
    return;
  }

  // Optional: prevent exact duplicates
  const duplicate = quotes.some(q => q.text === text && q.category === category);
  if (duplicate) {
    showStatus('This quote already exists', true);
    newQuoteText.value = '';
    return;
  }

  const newQ = { text, category };
  quotes.push(newQ);      // update runtime array
  saveQuotes();           // persist to **localStorage**
  newQuoteText.value = '';
  newQuoteCategory.value = '';
  showStatus('Quote added');

  // Show the newly added quote immediately
  quoteDisplay.innerHTML = '';
  const p = document.createElement('p'); p.textContent = `"${newQ.text}"`;
  const s = document.createElement('span'); s.textContent = `— ${newQ.category}`; s.classList.add('category');
  quoteDisplay.appendChild(p); quoteDisplay.appendChild(s);

  // Save index of newly added quote as last viewed (the newest is at end)
  saveLastViewedIndex(quotes.length - 1);
}

// ------------- Export to JSON (download) -------------
function exportQuotes() {
  try {
    const data = JSON.stringify(quotes, null, 2); // pretty-print with indent
    const blob = new Blob([data], { type: 'application/json' }); // **Blob**
    const url = URL.createObjectURL(blob);                       // **URL.createObjectURL**

    // Create a temporary anchor to initiate download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Clean up blob URL
    URL.revokeObjectURL(url);
    showStatus('Quotes exported (download started)');
  } catch (err) {
    console.error('Export failed', err);
    showStatus('Export failed', true);
  }
}

// ------------- Import from JSON file (merge) -------------
function importFromJsonFile(file) {
  if (!file) return;
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result); // **JSON.parse**
      if (!Array.isArray(parsed)) {
        throw new Error('Imported JSON must be an array of {text, category} objects.');
      }

      // Validate and collect new valid quotes
      const valid = parsed.filter(it => it && typeof it.text === 'string' && typeof it.category === 'string');

      if (!valid.length) {
        showStatus('No valid quotes found in file', true);
        return;
      }

      // Merge: add only unique entries (by exact text+category)
      let addedCount = 0;
      valid.forEach(q => {
        const exists = quotes.some(existing => existing.text === q.text && existing.category === q.category);
        if (!exists) {
          quotes.push({ text: q.text, category: q.category });
          addedCount++;
        }
      });

      if (addedCount > 0) {
        saveQuotes();
        showStatus(`Imported ${addedCount} new quote(s)`);
      } else {
        showStatus('No new quotes to import (all duplicates)', true);
      }
    } catch (err) {
      console.error('Import error', err);
      showStatus('Failed to import: invalid JSON or format', true);
    } finally {
      // Reset file input so same file can be re-selected later if desired
      importFile.value = '';
    }
  };

  reader.onerror = () => {
    showStatus('File read error', true);
    importFile.value = '';
  };

  reader.readAsText(file);
}

// ------------- Clear stored quotes (for testing) -------------
function clearStoredQuotes() {
  if (!confirm('Clear stored quotes? This will reset to defaults.')) return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(LAST_QUOTE_SESSION_KEY);
  loadQuotes();
  showStatus('Storage cleared — reset to defaults');
  // Update display
  quoteDisplay.textContent = 'Storage cleared. Click "Show New Quote"';
  updateLastViewedInfo(null);
}

// ------------- Helpers: UI updates -------------
function updateStoredCount() {
  // optional: show how many quotes are stored
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    // Keep it simple: print a small status
    // (Not using innerHTML heavy updates so user doesn't lose focus)
    // showStatus(`Stored quotes: ${parsed.length}`);
  } catch(e) { /* ignore */ }
}

// ------------- Init: wire up events & load initial state -------------
function init() {
  // Load persisted quotes from localStorage (if any)
  loadQuotes();

  // Wire buttons to functions (use addEventListener rather than inline attributes)
  newQuoteBtn.addEventListener('click', showRandomQuote);
  addQuoteBtn.addEventListener('click', addQuote);
  exportBtn.addEventListener('click', exportQuotes);
  importFile.addEventListener('change', (ev) => importFromJsonFile(ev.target.files[0]));
  clearStorageBtn.addEventListener('click', clearStoredQuotes);

  // If sessionStorage contains last viewed index, show it (helps during dev/test)
  const lastIdx = loadLastViewedIndex();
  if (lastIdx !== null && quotes[lastIdx]) {
    // show the exact quote the user last viewed in this tab
    const q = quotes[lastIdx];
    quoteDisplay.innerHTML = '';
    const p = document.createElement('p'); p.textContent = `"${q.text}"`;
    const s = document.createElement('span'); s.textContent = `— ${q.category}`; s.classList.add('category');
    quoteDisplay.appendChild(p); quoteDisplay.appendChild(s);

    updateLastViewedInfo(lastIdx);
  } else {
    // show a friendly prompt
    quoteDisplay.textContent = 'Click "Show New Quote" to see one!';
  }

  updateStoredCount();
}

// Run init after DOM loads
document.addEventListener('DOMContentLoaded', init);
//filtering 


function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");

  // Clear existing (avoid duplicates when re-populating)
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  // Get unique categories
  const categories = [...new Set(quotes.map(q => q.category))];

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  // Restore last selected filter from localStorage
  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) {
    categoryFilter.value = savedFilter;
    filterQuotes();
  }
}
//  
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;

  // Save choice to localStorage
  localStorage.setItem("selectedCategory", selectedCategory);

  const quoteDisplay = document.getElementById("quoteDisplay");
  quoteDisplay.innerHTML = "";

  let filteredQuotes = quotes;

  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  // Display random quote from filtered list
  if (filteredQuotes.length > 0) {
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    quoteDisplay.textContent = filteredQuotes[randomIndex].text;
  } else {
    quoteDisplay.textContent = "No quotes available in this category.";
  }
}
//update catagory when adding the code 
function addQuote() {
  const text = document.getElementById("newQuoteText").value;
  const category = document.getElementById("newQuoteCategory").value;

  if (text && category) {
    quotes.push({ text, category });
    saveQuotes(); // already stores in localStorage

    // Update category list dynamically
    populateCategories();

    alert("Quote added successfully!");
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
  } else {
    alert("Please enter both quote text and category.");
  }
}
//hook everything together 
window.onload = function() {
  loadQuotes();
  populateCategories();
  filterQuotes();
};
