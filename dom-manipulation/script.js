// script.js (Enhanced with server sync + conflict resolution)

// Ensure the script runs only after the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
  /**
   * =============================================================
   * Server Simulation + Sync Overview
   * -------------------------------------------------------------
   * - Primary fetch source: DummyJSON quotes API (read-only)
   *   Fallback fetch source: JSONPlaceholder posts (read-only)
   *   Final fallback: localStorage-based mock "server" store
   * - Posting: JSONPlaceholder (simulated; not persisted server-side)
   * - Conflict strategy (default): SERVER WINS
   * - Manual conflict resolution UI lets the user override per-item
   * =============================================================
   */

  // ---------------------- State ----------------------
  /** @type {Array<{id:string,text:string,category:string,updatedAt:number,source?:'local'|'server'}>} */
  let quotes = [];

  // Local storage keys
  const LS_QUOTES_KEY = 'quotes';
  const LS_LAST_FILTER_KEY = 'lastFilter';
  const SERVER_DATA_KEY = 'server_quotes_fallback'; // fallback "server"

  // Network endpoints
  const SERVER_SOURCES = [
    {
      name: 'DummyJSON',
      url: 'https://dummyjson.com/quotes',
      transform: (data) =>
        (data?.quotes || []).map((q) => ({
          id: `server-${q.id}`,
          text: q.quote,
          category: q.author || 'Server',
          updatedAt: Date.now(),
          source: 'server',
        })),
    },
    {
      name: 'JSONPlaceholder',
      url: 'https://jsonplaceholder.typicode.com/posts?_limit=20',
      transform: (data) =>
        (data || []).map((p) => ({
          id: `server-${p.id}`,
          text: `${(p.title || '').trim()} — ${(p.body || '').trim()}`.trim(),
          category: 'Server',
          updatedAt: Date.now(),
          source: 'server',
        })),
    },
  ];

  // Initial server seed (for offline-only fallback)
  const serverQuoteData = [
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "Inspiration" },
    { text: "The way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Your time is limited, don't waste it living someone else's life.", category: "Life" },
    { text: "If life were predictable it would cease to be life, and be without flavor.", category: "Life" },
    { text: "If you look at what you have in life, you'll always have more.", category: "Gratitude" }
  ];

  // ---------------------- DOM ----------------------
  const quoteDisplay = document.getElementById('quoteDisplay');
  const newQuoteBtn = document.getElementById('newQuote');
  const formContainer = document.getElementById('formContainer');
  const exportQuotesBtn = document.getElementById('exportQuotesBtn');
  const importFile = document.getElementById('importFile');
  const categoryFilter = document.getElementById('categoryFilter');
  const syncBtn = document.getElementById('syncBtn');
  const syncStatus = document.getElementById('syncStatus');

  // Runtime-generated conflict UI root (lazy)
  let conflictRoot = null;

  // ---------------------- Utils ----------------------
  const now = () => Date.now();
  const normalize = (s) => (s || '').trim().toLowerCase();
  const makeId = () => {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const displayStatus = (message) => {
    if (syncStatus) syncStatus.textContent = message;
  };

  const saveQuotes = () => {
    localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
  };

  const loadQuotes = () => {
    const stored = localStorage.getItem(LS_QUOTES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure shape
        quotes = parsed.map((q) => ({
          id: q.id || makeId(),
          text: String(q.text || ''),
          category: String(q.category || 'General'),
          updatedAt: Number(q.updatedAt || now()),
          source: q.source === 'server' ? 'server' : 'local',
        }));
      } catch {
        quotes = [];
      }
    }

    if (!quotes.length) {
      // Seed local with defaults
      quotes = [
        { id: makeId(), text: "The only way to do great work is to love what you do.", category: "Inspiration", updatedAt: now(), source: 'local' },
        { id: makeId(), text: "Strive not to be a success, but rather to be of value.", category: "Motivation", updatedAt: now(), source: 'local' },
        { id: makeId(), text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams", updatedAt: now(), source: 'local' },
        { id: makeId(), text: "The best time to plant a tree was 20 years ago. The second best time is now.", category: "Motivation", updatedAt: now(), source: 'local' },
        { id: makeId(), text: "If you are not willing to risk the usual, you will have to settle for the ordinary.", category: "Risk", updatedAt: now(), source: 'local' },
      ];
      saveQuotes();
    }
  };

  // ---------------------- Server I/O ----------------------
  const fetchQuotesFromServer = async () => {
    // Try web APIs in order; fallback to localStorage-based server
    for (const src of SERVER_SOURCES) {
      try {
        const res = await fetch(src.url);
        if (!res.ok) throw new Error(`${src.name} fetch failed: ${res.status}`);
        const data = await res.json();
        const transformed = src.transform(data).filter((q) => q.text);
        if (transformed.length) return transformed;
      } catch (e) {
        // Continue to next source
      }
    }

    // Final fallback: localStorage-based "server"
    const storedServerData = localStorage.getItem(SERVER_DATA_KEY);
    const base = storedServerData ? JSON.parse(storedServerData) : serverQuoteData;
    // Stamp ids + timestamps for consistency
    return base.map((q, i) => ({
      id: `server-fallback-${i}`,
      text: q.text,
      category: q.category,
      updatedAt: now(),
      source: 'server',
    }));
  };

  const saveToServer = async (newLocalQuotes /** array of local quotes to push */) => {
    // Simulate server save by POSTing to JSONPlaceholder (non-persistent)
    // We only POST newly added local quotes from this session (heuristic: source==='local' and no server-like id)
    const toPost = newLocalQuotes.filter((q) => q.source !== 'server');
    if (!toPost.length) return;

    try {
      await Promise.all(
        toPost.map((q) =>
          fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: q.category, body: q.text }),
          }).then((r) => r.json()).catch(() => null)
        )
      );
    } catch (e) {
      // Network errors are acceptable in simulation; ignore
    }
  };

  // ---------------------- Filtering + UI ----------------------
  const filterQuotes = () => {
    const selectedCategory = categoryFilter?.value || 'all';
    localStorage.setItem(LS_LAST_FILTER_KEY, selectedCategory);

    let filtered = quotes;
    if (selectedCategory !== 'all') {
      filtered = quotes.filter((q) => q.category === selectedCategory);
    }

    if (!filtered.length) {
      quoteDisplay.textContent = `No quotes found for category: ${selectedCategory}`;
      return;
    }

    const randomQuote = filtered[Math.floor(Math.random() * filtered.length)];
    sessionStorage.setItem('lastQuote', JSON.stringify(randomQuote));

    quoteDisplay.innerHTML = '';

    const quoteTextElement = document.createElement('p');
    quoteTextElement.textContent = `"${randomQuote.text}"`;

    const quoteCategoryElement = document.createElement('small');
    quoteCategoryElement.textContent = `Category: ${randomQuote.category}`;

    quoteDisplay.appendChild(quoteTextElement);
    quoteDisplay.appendChild(quoteCategoryElement);
  };

  const populateCategories = () => {
    if (!categoryFilter) return;
    categoryFilter.innerHTML = '';

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Categories';
    categoryFilter.appendChild(allOption);

    const categories = [...new Set(quotes.map((q) => q.category))].sort((a, b) => a.localeCompare(b));
    categories.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });

    const lastFilter = localStorage.getItem(LS_LAST_FILTER_KEY);
    if (lastFilter) categoryFilter.value = lastFilter;
  };

  const createAddQuoteForm = () => {
    const formDiv = document.createElement('div');
    formDiv.classList.add('form-container');

    const heading = document.createElement('h3');
    heading.textContent = 'Add a New Quote';

    const quoteInput = document.createElement('input');
    quoteInput.id = 'newQuoteText';
    quoteInput.type = 'text';
    quoteInput.placeholder = 'Enter a new quote';

    const categoryInput = document.createElement('input');
    categoryInput.id = 'newQuoteCategory';
    categoryInput.type = 'text';
    categoryInput.placeholder = 'Enter quote category';

    const addBtn = document.createElement('button');
    addBtn.id = 'addQuoteBtn';
    addBtn.textContent = 'Add Quote';

    formDiv.appendChild(heading);
    formDiv.appendChild(quoteInput);
    formDiv.appendChild(categoryInput);
    formDiv.appendChild(addBtn);

    formContainer.appendChild(formDiv);

    addBtn.addEventListener('click', addQuote);
  };

  const addQuote = () => {
    const newQuoteText = document.getElementById('newQuoteText');
    const newQuoteCategory = document.getElementById('newQuoteCategory');

    const text = (newQuoteText.value || '').trim();
    const category = (newQuoteCategory.value || '').trim() || 'General';

    if (!text) {
      alert('Please enter both a quote and a category.');
      return;
    }

    const newQuote = {
      id: makeId(),
      text,
      category,
      updatedAt: now(),
      source: 'local',
    };

    quotes.push(newQuote);

    newQuoteText.value = '';
    newQuoteCategory.value = '';

    saveQuotes();
    populateCategories();
    filterQuotes();
  };

  const exportQuotesToJson = () => {
    const dataStr = JSON.stringify(quotes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quotes.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importFromJsonFile = (event) => {
    const fileReader = new FileReader();
    fileReader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error('Invalid JSON: expected an array');

        // Normalize and dedupe: avoid duplicates by (text+category)
        const key = (q) => `${normalize(q.text)}::${normalize(q.category)}`;
        const existingKeys = new Set(quotes.map(key));

        const cleaned = imported
          .filter((q) => q && typeof q.text === 'string' && q.text.trim())
          .map((q) => ({
            id: q.id || makeId(),
            text: String(q.text),
            category: String(q.category || 'General'),
            updatedAt: Number(q.updatedAt || now()),
            source: q.source === 'server' ? 'server' : 'local',
          }))
          .filter((q) => !existingKeys.has(key(q)));

        if (!cleaned.length) {
          alert('No new quotes to import (duplicates were skipped).');
        } else {
          quotes.push(...cleaned);
          saveQuotes();
          populateCategories();
          filterQuotes();
          alert('Quotes imported successfully!');
        }
      } catch (err) {
        alert('Error parsing JSON file. Please ensure it is a valid JSON format.');
      }
    };
    fileReader.readAsText(event.target.files[0]);
  };

  // ---------------------- Conflict UI ----------------------
  const ensureConflictRoot = () => {
    if (conflictRoot) return conflictRoot;
    conflictRoot = document.createElement('div');
    conflictRoot.id = 'conflict-root';
    conflictRoot.style.position = 'fixed';
    conflictRoot.style.inset = '0';
    conflictRoot.style.background = 'rgba(0,0,0,0.45)';
    conflictRoot.style.display = 'none';
    conflictRoot.style.alignItems = 'center';
    conflictRoot.style.justifyContent = 'center';
    conflictRoot.style.zIndex = '9999';

    const panel = document.createElement('div');
    panel.style.maxWidth = '800px';
    panel.style.width = '90%';
    panel.style.maxHeight = '80vh';
    panel.style.overflow = 'auto';
    panel.style.background = '#fff';
    panel.style.borderRadius = '16px';
    panel.style.padding = '16px';
    panel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';

    const title = document.createElement('h3');
    title.textContent = 'Conflicts detected — manual resolution';
    panel.appendChild(title);

    const info = document.createElement('p');
    info.textContent = 'Server changes were applied automatically (server wins). You can override specific items below:';
    panel.appendChild(info);

    const list = document.createElement('div');
    list.id = 'conflict-list';
    list.style.display = 'grid';
    list.style.gap = '12px';
    panel.appendChild(list);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '12px';
    actions.style.marginTop = '12px';

    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply choices';
    applyBtn.id = 'conflict-apply';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Dismiss';
    cancelBtn.id = 'conflict-cancel';

    actions.appendChild(applyBtn);
    actions.appendChild(cancelBtn);
    panel.appendChild(actions);

    conflictRoot.appendChild(panel);
    document.body.appendChild(conflictRoot);

    cancelBtn.addEventListener('click', () => (conflictRoot.style.display = 'none'));

    return conflictRoot;
  };

  /**
   * Build & show the conflict resolution modal.
   * @param {Array<{key:string, local:any, server:any}>} conflicts
   */
  const showConflictUI = (conflicts) => {
    if (!conflicts?.length) return;
    const root = ensureConflictRoot();
    const list = root.querySelector('#conflict-list');
    list.innerHTML = '';

    conflicts.forEach((c, idx) => {
      const row = document.createElement('div');
      row.style.border = '1px solid #eee';
      row.style.borderRadius = '12px';
      row.style.padding = '12px';

      const header = document.createElement('div');
      header.style.fontWeight = '600';
      header.style.marginBottom = '6px';
      header.textContent = `Conflict #${idx + 1}`;

      const serverOpt = document.createElement('label');
      const serverRadio = document.createElement('input');
      serverRadio.type = 'radio';
      serverRadio.name = `conf-${idx}`;
      serverRadio.value = 'server';
      serverRadio.checked = true; // default server wins
      serverOpt.appendChild(serverRadio);
      serverOpt.append(` Keep SERVER → "${c.server.text}" [${c.server.category}]`);

      const localOpt = document.createElement('label');
      localOpt.style.display = 'block';
      const localRadio = document.createElement('input');
      localRadio.type = 'radio';
      localRadio.name = `conf-${idx}`;
      localRadio.value = 'local';
      localOpt.appendChild(localRadio);
      localOpt.append(` Keep LOCAL → "${c.local.text}" [${c.local.category}]`);

      row.appendChild(header);
      row.appendChild(serverOpt);
      row.appendChild(localOpt);
      list.appendChild(row);
    });

    root.querySelector('#conflict-apply').onclick = () => {
      const decisions = Array.from(list.querySelectorAll('input[type="radio"]:checked'));
      // Each pair uses shared name conf-i. We already applied server versions.
      // If user chose LOCAL for any, revert those.
      decisions.forEach((inp) => {
        if (inp.value !== 'local') return;
        const idx = Number(inp.name.split('-')[1]);
        const item = conflicts[idx];
        // Replace server with local for that key (by text identity)
        const key = item.key;
        const norm = (q) => `${normalize(q.text)}`;
        quotes = quotes.filter((q) => norm(q) !== key).concat([{ ...item.local }]);
      });

      saveQuotes();
      populateCategories();
      filterQuotes();
      root.style.display = 'none';
      displayStatus('Conflicts resolved with your choices.');
    };

    root.style.display = 'flex';
  };

  // ---------------------- Sync & Merge ----------------------
  /**
   * Sync algorithm (every 5 minutes or on demand):
   * 1) Push new local items (best-effort) to the mock server (non-persistent)
   * 2) Pull from server
   * 3) Merge by normalized text key; detect conflicts where local/server differ
   * 4) Apply server-wins, then offer manual conflict UI
   */
  const syncQuotes = async () => {
    displayStatus('Syncing with server...');
    try {
      // Step 1: push (best-effort; non-blocking if it fails)
      await saveToServer(quotes);

      // Step 2: pull
      const serverQuotes = await fetchQuotesFromServer();

      // Step 3: merge by normalized text
      const keyOf = (q) => `${normalize(q.text)}`; // identity = normalized text

      const localMap = new Map();
      quotes.forEach((q) => localMap.set(keyOf(q), q));

      const serverMap = new Map();
      serverQuotes.forEach((q) => serverMap.set(keyOf(q), q));

      const allKeys = new Set([...localMap.keys(), ...serverMap.keys()]);

      /** @type {Array<{key:string, local:any, server:any}>} */
      const conflicts = [];
      const merged = [];

      allKeys.forEach((k) => {
        const l = localMap.get(k);
        const s = serverMap.get(k);
        if (l && s) {
          // Compare meaningful fields
          const sameCategory = normalize(l.category) === normalize(s.category);
          const sameText = normalize(l.text) === normalize(s.text);
          const differs = !sameCategory || !sameText;
          if (differs) {
            // Conflict: server wins by default
            conflicts.push({ key: k, local: l, server: s });
            merged.push({ ...s, source: 'server', updatedAt: Math.max(l.updatedAt || 0, s.updatedAt || 0) });
          } else {
            // Same entry, keep the freshest timestamp and prefer server source
            merged.push({ ...(s || l), updatedAt: Math.max(l.updatedAt || 0, s.updatedAt || 0), source: s ? 'server' : (l.source || 'local') });
          }
        } else if (s && !l) {
          merged.push({ ...s, source: 'server' });
        } else if (l && !s) {
          merged.push(l);
        }
      });

      quotes = merged;
      saveQuotes();
      populateCategories();
      filterQuotes();

      if (conflicts.length) {
        displayStatus(`Data synced. ${conflicts.length} conflict(s) detected — server version applied.`);
        showConflictUI(conflicts);
      } else {
        displayStatus('Local data is up-to-date with the server.');
      }
    } catch (error) {
      displayStatus('Sync failed: ' + (error?.message || String(error)));
    }
  };

  // ---------------------- Event wiring ----------------------
  newQuoteBtn?.addEventListener('click', filterQuotes);
  exportQuotesBtn?.addEventListener('click', exportQuotesToJson);
  importFile?.addEventListener('change', importFromJsonFile);
  categoryFilter?.addEventListener('change', filterQuotes);
  syncBtn?.addEventListener('click', syncQuotes);

  // ---------------------- Init ----------------------
  loadQuotes();
  createAddQuoteForm();
  populateCategories();

  // Restore last viewed quote if available
  const last = sessionStorage.getItem('lastQuote');
  if (last) {
    try {
      const q = JSON.parse(last);
      if (q?.text) {
        // Ensure the quote exists in current set; if not, just filter
        const exists = quotes.some((x) => normalize(x.text) === normalize(q.text));
        if (exists) {
          quoteDisplay.innerHTML = '';
          const p = document.createElement('p');
          p.textContent = `"${q.text}"`;
          const s = document.createElement('small');
          s.textContent = `Category: ${q.category}`;
          quoteDisplay.appendChild(p);
          quoteDisplay.appendChild(s);
        } else {
          filterQuotes();
        }
      } else {
        filterQuotes();
      }
    } catch {
      filterQuotes();
    }
  } else {
    filterQuotes();
  }

  // Periodic sync every 5 minutes
  setInterval(syncQuotes, 300000);
});
