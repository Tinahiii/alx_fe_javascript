// script.js

// Ensure the script runs only after the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {

    // Initial array of quote objects.
    let quotes = [];

    // Simulate a server-side data source.
    const SERVER_DATA_KEY = 'server_quotes';
    const serverQuoteData = [
        { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "Inspiration" },
        { text: "The way to get started is to quit talking and begin doing.", category: "Motivation" },
        { text: "Your time is limited, don't waste it living someone else's life.", category: "Life" },
        { text: "If life were predictable it would cease to be life, and be without flavor.", category: "Life" },
        { text: "If you look at what you have in life, you'll always have more.", category: "Gratitude" }
    ];

    /**
     * @description Simulates fetching quotes from a server with a delay.
     * @returns {Promise<Array>} A promise that resolves with the server quotes.
     */
    const fetchQuotesFromServer = () => {
        return new Promise(resolve => {
            setTimeout(() => {
                // Get the latest server data from local storage, or use the default.
                const storedServerData = localStorage.getItem(SERVER_DATA_KEY);
                const currentServerData = storedServerData ? JSON.parse(storedServerData) : serverQuoteData;
                resolve(currentServerData);
            }, 1000); // Simulate a 1-second network delay.
        });
    };

    /**
     * @description Simulates pushing local quotes to the server.
     * @param {Array} updatedQuotes The quotes to save to the server.
     * @returns {Promise<void>} A promise that resolves when the data is "saved".
     */
    const saveToServer = (updatedQuotes) => {
        return new Promise(resolve => {
            setTimeout(() => {
                localStorage.setItem(SERVER_DATA_KEY, JSON.stringify(updatedQuotes));
                resolve();
            }, 500); // Simulate a 0.5-second save delay.
        });
    };

    // Get DOM elements
    const quoteDisplay = document.getElementById('quoteDisplay');
    const newQuoteBtn = document.getElementById('newQuote');
    const formContainer = document.getElementById('formContainer');
    const exportQuotesBtn = document.getElementById('exportQuotesBtn');
    const importFile = document.getElementById('importFile');
    const categoryFilter = document.getElementById('categoryFilter');
    const syncBtn = document.getElementById('syncBtn');
    const syncStatus = document.getElementById('syncStatus');

    /**
     * @description Displays a status message to the user.
     * @param {string} message The message to display.
     */
    const displayStatus = (message) => {
        syncStatus.textContent = message;
    };

    /**
     * @description Saves the current quotes array to local storage.
     */
    const saveQuotes = () => {
        localStorage.setItem('quotes', JSON.stringify(quotes));
    };

    /**
     * @description Loads quotes from local storage when the page initializes.
     */
    const loadQuotes = () => {
        const storedQuotes = localStorage.getItem('quotes');
        if (storedQuotes) {
            quotes = JSON.parse(storedQuotes);
        } else {
            // If no quotes in local storage, use the initial default quotes.
            quotes = [
                { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
                { text: "Strive not to be a success, but rather to be of value.", category: "Motivation" },
                { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" },
                { text: "The best time to plant a tree was 20 years ago. The second best time is now.", category: "Motivation" },
                { text: "If you are not willing to risk the usual, you will have to settle for the ordinary.", category: "Risk" }
            ];
            saveQuotes(); // Save the initial quotes to local storage for the first time.
        }
    };

    /**
     * @description Filters and displays quotes based on the selected category.
     */
    const filterQuotes = () => {
        const selectedCategory = categoryFilter.value;
        localStorage.setItem('lastFilter', selectedCategory); // Save the selected filter.

        let filteredQuotes = quotes;
        if (selectedCategory !== 'all') {
            filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
        }

        if (filteredQuotes.length === 0) {
            quoteDisplay.textContent = `No quotes found for category: ${selectedCategory}`;
            return;
        }

        const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];

        // Store the last viewed quote in session storage.
        sessionStorage.setItem('lastQuote', JSON.stringify(randomQuote));

        // Clear the current display.
        quoteDisplay.innerHTML = '';

        // Create and append the quote text element.
        const quoteTextElement = document.createElement('p');
        quoteTextElement.textContent = `"${randomQuote.text}"`;

        // Create and append the quote category element.
        const quoteCategoryElement = document.createElement('small');
        quoteCategoryElement.textContent = `Category: ${randomQuote.category}`;

        // Append both elements to the display container.
        quoteDisplay.appendChild(quoteTextElement);
        quoteDisplay.appendChild(quoteCategoryElement);
    };

    /**
     * @description Populates the category filter dropdown with unique categories from the quotes array.
     */
    const populateCategories = () => {
        // Clear existing options
        categoryFilter.innerHTML = '';

        // Add "All Categories" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Categories';
        categoryFilter.appendChild(allOption);

        // Get unique categories
        const categories = [...new Set(quotes.map(quote => quote.category))];

        // Add each unique category as an option
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        // Restore last selected filter from local storage
        const lastFilter = localStorage.getItem('lastFilter');
        if (lastFilter) {
            categoryFilter.value = lastFilter;
        }
    };

    /**
     * @description Dynamically creates and adds the quote form to the DOM.
     */
    const createAddQuoteForm = () => {
        // Create the form container div
        const formDiv = document.createElement('div');
        formDiv.classList.add('form-container');

        // Create the heading
        const heading = document.createElement('h3');
        heading.textContent = "Add a New Quote";

        // Create the input fields
        const quoteInput = document.createElement('input');
        quoteInput.id = 'newQuoteText';
        quoteInput.type = 'text';
        quoteInput.placeholder = 'Enter a new quote';

        const categoryInput = document.createElement('input');
        categoryInput.id = 'newQuoteCategory';
        categoryInput.type = 'text';
        categoryInput.placeholder = 'Enter quote category';

        // Create the add quote button
        const addBtn = document.createElement('button');
        addBtn.id = 'addQuoteBtn';
        addBtn.textContent = 'Add Quote';

        // Append all elements to the form container
        formDiv.appendChild(heading);
        formDiv.appendChild(quoteInput);
        formDiv.appendChild(categoryInput);
        formDiv.appendChild(addBtn);

        // Append the form container to the main container
        formContainer.appendChild(formDiv);

        // Attach event listener to the dynamically created button
        addBtn.addEventListener('click', addQuote);
    };

    /**
     * @description Adds a new quote to the quotes array from user input and updates the DOM.
     */
    const addQuote = () => {
        // Get the values from the dynamically created input fields
        const newQuoteText = document.getElementById('newQuoteText');
        const newQuoteCategory = document.getElementById('newQuoteCategory');

        const text = newQuoteText.value.trim();
        const category = newQuoteCategory.value.trim();

        // Validate that both fields have been filled.
        if (text === "" || category === "") {
            alert("Please enter both a quote and a category.");
            return;
        }

        // Create a new quote object.
        const newQuote = {
            text: text,
            category: category
        };

        // Add the new quote to the array.
        quotes.push(newQuote);

        // Clear the input fields.
        newQuoteText.value = '';
        newQuoteCategory.value = '';

        // Save the updated quotes array to local storage.
        saveQuotes();

        // Repopulate categories to include the new one.
        populateCategories();

        // Show a new random quote to reflect the change.
        filterQuotes();
    };

    /**
     * @description Exports the quotes array to a JSON file.
     */
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

    /**
     * @description Imports quotes from a JSON file and adds them to the quotes array.
     * @param {Event} event The file change event.
     */
    const importFromJsonFile = (event) => {
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
            try {
                const importedQuotes = JSON.parse(event.target.result);
                // Check if the imported data is an array
                if (Array.isArray(importedQuotes)) {
                    quotes.push(...importedQuotes);
                    saveQuotes();
                    populateCategories(); // Update categories after import.
                    filterQuotes();
                    alert('Quotes imported successfully!');
                } else {
                    alert('Invalid JSON format. Please upload a file with an array of quotes.');
                }
            } catch (error) {
                alert('Error parsing JSON file. Please ensure it is a valid JSON format.');
            }
        };
        fileReader.readAsText(event.target.files[0]);
    };

    /**
     * @description Syncs local quotes with the server.
     * This version simulates a push-then-pull strategy for conflict resolution.
     */
    const syncQuotes = async () => {
        displayStatus('Syncing with server...');
        try {
            // Step 1: Push local changes to the server
            await saveToServer(quotes);

            // Step 2: Fetch the latest data from the server
            const serverQuotes = await fetchQuotesFromServer();

            // Step 3: Compare and resolve conflicts (server data takes precedence)
            if (JSON.stringify(quotes) !== JSON.stringify(serverQuotes)) {
                quotes = serverQuotes;
                saveQuotes();
                displayStatus('Data synced successfully. Local changes were saved and server data was loaded.');
                populateCategories();
                filterQuotes();
            } else {
                displayStatus('Local data is already up-to-date with the server.');
            }
            
        } catch (error) {
            displayStatus('Sync failed: ' + error.message);
        }
    };


    // Attach event listeners to the buttons.
    newQuoteBtn.addEventListener('click', filterQuotes);
    exportQuotesBtn.addEventListener('click', exportQuotesToJson);
    importFile.addEventListener('change', importFromJsonFile);
    categoryFilter.addEventListener('change', filterQuotes);
    syncBtn.addEventListener('click', syncQuotes);

    // Initial calls
    loadQuotes(); // Load quotes from local storage first.
    createAddQuoteForm();
    populateCategories(); // Populate filter dropdown.
    filterQuotes(); // Display initial quotes based on the loaded filter.

    // Periodically sync with the server every 5 minutes (300000ms)
    // You can adjust this interval as needed.
    setInterval(syncQuotes, 300000);
});
