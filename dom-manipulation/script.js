// script.js

// Ensure the script runs only after the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {

    // Initial array of quote objects.
    let quotes = [
        { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
        { text: "Strive not to be a success, but rather to be of value.", category: "Motivation" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" },
        { text: "The best time to plant a tree was 20 years ago. The second best time is now.", category: "Motivation" },
        { text: "If you are not willing to risk the usual, you will have to settle for the ordinary.", category: "Risk" }
    ];

    // Get DOM elements
    const quoteDisplay = document.getElementById('quoteDisplay');
    const newQuoteBtn = document.getElementById('newQuote');
    const formContainer = document.getElementById('formContainer');

    /**
     * @description Displays a random quote from the quotes array in the DOM.
     */
    const showRandomQuote = () => {
        // Get a random index from the quotes array.
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const randomQuote = quotes[randomIndex];

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

        // Show a new random quote to reflect the change.
        showRandomQuote();
    };

    // Attach event listeners to the buttons.
    newQuoteBtn.addEventListener('click', showRandomQuote);

    // Initial calls to create the form and show a quote when the page loads.
    createAddQuoteForm();
    showRandomQuote();
});
