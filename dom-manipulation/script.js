// Initial quotes array
let quotes = [
  { text: "The best way to predict the future is to invent it.", category: "Inspiration" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" },
  { text: "Stay hungry, stay foolish.", category: "Motivation" }
];

// DOM references
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const newQuoteText = document.getElementById("newQuoteText");
const newQuoteCategory = document.getElementById("newQuoteCategory");

// Function: Show a random quote
function showRandomQuote() {
  if (quotes.length === 0) {
    quoteDisplay.textContent = "No quotes available. Please add one!";
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

  // Clear and rebuild DOM content dynamically
  quoteDisplay.innerHTML = "";
  const quoteTextEl = document.createElement("p");
  quoteTextEl.textContent = `"${quote.text}"`;

  const categoryEl = document.createElement("span");
  categoryEl.textContent = `— ${quote.category}`;
  categoryEl.classList.add("category");

  quoteDisplay.appendChild(quoteTextEl);
  quoteDisplay.appendChild(categoryEl);
}

// Function: Add a new quote
function createAddQuoteForm() {
  const text = newQuoteText.value.trim();
  const category = newQuoteCategory.value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }

  // Add to array
  quotes.push({ text, category });

  // Clear form fields
  newQuoteText.value = "";
  newQuoteCategory.value = "";

  alert("New quote added successfully!");
}

// Event Listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", createAddQuoteForm);

const quoteTextEl = document.createElement("p");
quoteTextEl.textContent = `"${quote.text}"`;
quoteDisplay.appendChild(quoteTextEl);

