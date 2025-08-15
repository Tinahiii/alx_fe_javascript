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
    const newQuoteText = document.getElementById('newQuoteText');
    const newQuoteCategory = document.getElementById('newQuoteCategory');
    const addQuoteBtn = document.getElementById('addQuoteBtn');

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
     * @description Adds a new quote to the quotes array from user input and updates the DOM.
     */
    const addQuote = () => {
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
    addQuoteBtn.addEventListener('click', addQuote);

    // Initial call to show a quote when the page loads.
    showRandomQuote();
});
