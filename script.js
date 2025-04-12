// DOM Elements
const balanceEl = document.getElementById("balance");
const moneyPlusEl = document.getElementById("money-plus");
const moneyMinusEl = document.getElementById("money-minus");
const listEl = document.getElementById("list");
const formEl = document.getElementById("form");
const textEl = document.getElementById("text");
const amountEl = document.getElementById("amount");
const categoryEl = document.getElementById("category");
const dateEl = document.getElementById("date");
const budgetAmountEl = document.getElementById("budget-amount");
const setBudgetBtn = document.getElementById("set-budget");
const budgetValueEl = document.getElementById("budget-value");
const budgetRemainingEl = document.getElementById("budget-remaining");
const budgetProgressEl = document.getElementById("budget-progress");
const expenseChartEl = document.getElementById("expense-chart");

// Set default date to today
dateEl.valueAsDate = new Date();

// Local Storage Keys
const TRANSACTION_STORAGE_KEY = "expenseTracker.transactions";
const BUDGET_STORAGE_KEY = "expenseTracker.budget";

// Load transactions from localStorage
let transactions =
  JSON.parse(localStorage.getItem(TRANSACTION_STORAGE_KEY)) || [];
let budget = JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY)) || {
  amount: 0,
};

// Initialize budget display
if (budget.amount > 0) {
  budgetValueEl.textContent = `$${budget.amount.toFixed(2)}`;
  updateBudgetDisplay();
}

// Initialize Chart.js
let expenseChart;

// Add transaction
function addTransaction(e) {
  e.preventDefault();

  if (textEl.value.trim() === "" || amountEl.value.trim() === "") {
    alert("Please add a description and amount");
    return;
  }

  const transaction = {
    id: generateID(),
    text: textEl.value,
    amount: +amountEl.value,
    category: categoryEl.value,
    date: dateEl.value,
  };

  transactions.push(transaction);

  addTransactionDOM(transaction);
  updateValues();
  updateLocalStorage();
  updateChart();
  updateBudgetDisplay();

  textEl.value = "";
  amountEl.value = "";
  categoryEl.value = "general";
  dateEl.valueAsDate = new Date();
}

// Generate random ID
function generateID() {
  return Math.floor(Math.random() * 1000000000);
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
  // Determine if income or expense
  const sign = transaction.amount < 0 ? "-" : "+";

  // Format date
  const dateObj = new Date(transaction.date);
  const formattedDate = dateObj.toLocaleDateString();

  const item = document.createElement("li");

  // Add class based on value
  item.classList.add(transaction.amount < 0 ? "minus" : "plus");

  item.innerHTML = `
        <div>
            <span class="category-tag">${transaction.category}</span>
            ${transaction.text} 
            <div class="date">${formattedDate}</div>
        </div>
        <span>${sign}$${Math.abs(transaction.amount).toFixed(2)}</span>
        <button class="delete-btn" onclick="removeTransaction(${
          transaction.id
        })">×</button>
    `;

  listEl.appendChild(item);
}

// Update the balance, income and expense
function updateValues() {
  const amounts = transactions.map((transaction) => transaction.amount);

  const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

  const income = amounts
    .filter((item) => item > 0)
    .reduce((acc, item) => (acc += item), 0)
    .toFixed(2);

  const expense = (
    amounts.filter((item) => item < 0).reduce((acc, item) => (acc += item), 0) *
    -1
  ).toFixed(2);

  balanceEl.innerText = `$${total}`;
  moneyPlusEl.innerText = `+$${income}`;
  moneyMinusEl.innerText = `-$${expense}`;
}

// Remove transaction by ID
function removeTransaction(id) {
  transactions = transactions.filter((transaction) => transaction.id !== id);

  updateLocalStorage();
  init();
}

// Update local storage
function updateLocalStorage() {
  localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transactions));
}

// Set Budget
function setBudget() {
  const budgetAmount = parseFloat(budgetAmountEl.value);

  if (isNaN(budgetAmount) || budgetAmount <= 0) {
    alert("Please enter a valid budget amount");
    return;
  }

  budget.amount = budgetAmount;
  localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budget));

  budgetValueEl.textContent = `$${budget.amount.toFixed(2)}`;
  updateBudgetDisplay();

  budgetAmountEl.value = "";
}

// Update Budget Display
function updateBudgetDisplay() {
  if (budget.amount <= 0) return;

  // Calculate expenses this month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyExpenses = transactions
    .filter((t) => {
      const tDate = new Date(t.date);
      return (
        t.amount < 0 &&
        tDate.getMonth() === currentMonth &&
        tDate.getFullYear() === currentYear
      );
    })
    .reduce((total, t) => total + Math.abs(t.amount), 0);

  const remaining = budget.amount - monthlyExpenses;
  const percentage = Math.min(100, (monthlyExpenses / budget.amount) * 100);

  budgetRemainingEl.textContent = `$${remaining.toFixed(2)}`;
  budgetProgressEl.style.width = `${percentage}%`;

  // Change color based on percentage
  if (percentage >= 90) {
    budgetProgressEl.style.backgroundColor = "#e74c3c"; // Red
  } else if (percentage >= 70) {
    budgetProgressEl.style.backgroundColor = "#f39c12"; // Orange
  } else {
    budgetProgressEl.style.backgroundColor = "#2ecc71"; // Green
  }
}

// Update Chart
function updateChart() {
  // Group expenses by category
  const expensesByCategory = {};

  transactions.forEach((transaction) => {
    if (transaction.amount < 0) {
      const cat = transaction.category;
      if (!expensesByCategory[cat]) {
        expensesByCategory[cat] = 0;
      }
      expensesByCategory[cat] += Math.abs(transaction.amount);
    }
  });

  const categories = Object.keys(expensesByCategory);
  const expenseAmounts = Object.values(expensesByCategory);

  // Generate random colors for chart
  const backgroundColors = categories.map(() => {
    return `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
  });

  // Create or update chart
  if (expenseChart) {
    expenseChart.data.labels = categories;
    expenseChart.data.datasets[0].data = expenseAmounts;
    expenseChart.data.datasets[0].backgroundColor = backgroundColors;
    expenseChart.update();
  } else {
    expenseChart = new Chart(expenseChartEl, {
      type: "doughnut",
      data: {
        labels: categories,
        datasets: [
          {
            data: expenseAmounts,
            backgroundColor: backgroundColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
          },
          title: {
            display: true,
            text: "Expenses by Category",
          },
        },
      },
    });
  }
}

// Init app
function init() {
  listEl.innerHTML = "";

  transactions.forEach(addTransactionDOM);
  updateValues();
  updateChart();
  updateBudgetDisplay();
}

// Event listeners
formEl.addEventListener("submit", addTransaction);
setBudgetBtn.addEventListener("click", setBudget);

// Initialize the app
init();
