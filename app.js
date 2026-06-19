// ============================================================
// STUDENT FINANCE TRACKER - Main JavaScript
// Simple and beginner-friendly version
// ============================================================

// ----- STORAGE KEYS -----
const STORAGE_KEY = 'finance_tracker_data';
const CAP_KEY = 'finance_cap';

// ----- STATE VARIABLES -----
let transactions = [];
let capAmount = null;
let editingId = null;
let sortAsc = false; // false = newest first, true = oldest first
let searchTerm = '';

// ============================================================
// 1. LOAD DATA FROM localStorage OR seed.json
// ============================================================

function loadData() {
    // First, try to get data from localStorage
    const savedData = localStorage.getItem(STORAGE_KEY);
    
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if (Array.isArray(parsed) && parsed.length > 0) {
                transactions = parsed;
                render();
                return;
            }
        } catch (error) {
            console.log('Error parsing saved data:', error);
        }
    }
    
    // If no data in localStorage, try to load from seed.json
    loadSeedFromFile();
}

// ============================================================
// 2. LOAD FROM seed.json FILE
// ============================================================

function loadSeedFromFile() {
    fetch('seed.json')
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Could not load seed.json');
            }
            return response.json();
        })
        .then(function(data) {
            if (Array.isArray(data) && data.length > 0) {
                transactions = data;
                saveData();
                render();
                console.log('Loaded data from seed.json');
            } else {
                // If seed.json is empty, use hardcoded data
                useHardcodedData();
            }
        })
        .catch(function(error) {
            console.log('Could not load seed.json, using hardcoded data:', error);
            useHardcodedData();
        });
}

// ============================================================
// 3. HARDCODED SAMPLE DATA (fallback)
// ============================================================

function useHardcodedData() {
    transactions = [
        {
            id: 'txn_1',
            description: 'Lunch at cafeteria',
            amount: 12.50,
            category: 'Food',
            date: '2025-09-25'
        },
        {
            id: 'txn_2',
            description: 'Chemistry textbook',
            amount: 89.99,
            category: 'Books',
            date: '2025-09-23'
        },
        {
            id: 'txn_3',
            description: 'Bus pass',
            amount: 45.00,
            category: 'Transport',
            date: '2025-09-20'
        },
        {
            id: 'txn_4',
            description: 'Coffee with friends',
            amount: 8.75,
            category: 'Entertainment',
            date: '2025-09-28'
        },
        {
            id: 'txn_5',
            description: 'Gym membership',
            amount: 30.00,
            category: 'Other',
            date: '2025-09-29'
        },
        {
            id: 'txn_6',
            description: 'Pizza and soda',
            amount: 15.00,
            category: 'Food',
            date: '2025-09-30'
        },
        {
            id: 'txn_7',
            description: 'Notebook set',
            amount: 6.99,
            category: 'Books',
            date: '2025-09-22'
        },
        {
            id: 'txn_8',
            description: 'Movie ticket',
            amount: 12.00,
            category: 'Entertainment',
            date: '2025-09-27'
        },
        {
            id: 'txn_9',
            description: 'Train travel',
            amount: 22.50,
            category: 'Transport',
            date: '2025-09-26'
        },
        {
            id: 'txn_10',
            description: 'Tuition fee',
            amount: 150.00,
            category: 'Fees',
            date: '2025-09-18'
        }
    ];
    saveData();
    render();
}

// ============================================================
// 4. SAVE DATA TO localStorage
// ============================================================

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    
    if (capAmount !== null && capAmount >= 0) {
        localStorage.setItem(CAP_KEY, String(capAmount));
    } else {
        localStorage.removeItem(CAP_KEY);
    }
}

// ============================================================
// 5. GENERATE UNIQUE ID
// ============================================================

function generateId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

// ============================================================
// 6. SHOW MESSAGES
// ============================================================

function showMessage(message) {
    const status = document.getElementById('form-status');
    status.textContent = message;
    setTimeout(function() {
        if (status.textContent === message) {
            status.textContent = '';
        }
    }, 4000);
}

function showSettingsMessage(message) {
    const status = document.getElementById('settings-status');
    status.textContent = message;
    setTimeout(function() {
        if (status.textContent === message) {
            status.textContent = '';
        }
    }, 4000);
}

// ============================================================
// 7. VALIDATION FUNCTIONS
// ============================================================

function validateDescription(text) {
    // Remove extra spaces
    const cleaned = text.trim().replace(/\s+/g, ' ');
    
    // Check for leading/trailing spaces
    if (!/^\S(?:.*\S)?$/.test(cleaned)) {
        return { valid: false, message: 'No leading or trailing spaces allowed.' };
    }
    
    // Check for duplicate words
    const words = cleaned.split(' ');
    for (let i = 0; i < words.length - 1; i++) {
        if (words[i].toLowerCase() === words[i + 1].toLowerCase()) {
            return { valid: false, message: 'Duplicate words found (e.g., "the the").' };
        }
    }
    
    return { valid: true, value: cleaned };
}

function validateAmount(value) {
    // Check if it's a positive number with up to 2 decimals
    if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value)) {
        return { valid: false, message: 'Enter a positive number (e.g., 12.50).' };
    }
    return { valid: true, value: parseFloat(value) };
}

function validateDate(value) {
    // Check YYYY-MM-DD format
    if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) {
        return { valid: false, message: 'Use YYYY-MM-DD format.' };
    }
    return { valid: true };
}

function validateCategory(value) {
    // Only letters, spaces, and hyphens
    if (!/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(value)) {
        return { valid: false, message: 'Only letters, spaces, and hyphens allowed.' };
    }
    return { valid: true };
}

// ============================================================
// 8. RENDER EVERYTHING
// ============================================================

function render() {
    // --- Get search value ---
    const searchValue = document.getElementById('search-input').value.trim();
    let searchRegex = null;
    
    if (searchValue) {
        try {
            searchRegex = new RegExp(searchValue, 'i');
        } catch (error) {
            document.getElementById('search-error').textContent = 'Invalid search pattern.';
        }
    }
    
    // --- Filter transactions ---
    let filtered = transactions;
    if (searchRegex) {
        filtered = transactions.filter(function(transaction) {
            return searchRegex.test(transaction.description) ||
                   searchRegex.test(transaction.category) ||
                   searchRegex.test(transaction.date);
        });
    }
    
    // --- Sort transactions ---
    filtered.sort(function(a, b) {
        let valueA = a.date;
        let valueB = b.date;
        
        if (sortAsc) {
            // Oldest first
            if (valueA < valueB) return -1;
            if (valueA > valueB) return 1;
            return 0;
        } else {
            // Newest first
            if (valueA > valueB) return -1;
            if (valueA < valueB) return 1;
            return 0;
        }
    });
    
    // --- Get DOM elements ---
    const tbody = document.getElementById('records-body');
    const cardsContainer = document.getElementById('mobile-cards');
    const emptyMsg = document.getElementById('empty-msg');
    
    // --- Check if there are any transactions ---
    if (filtered.length === 0) {
        tbody.innerHTML = '';
        cardsContainer.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }
    
    emptyMsg.style.display = 'none';
    
    // --- Build table rows ---
    let tableHTML = '';
    for (let i = 0; i < filtered.length; i++) {
        const t = filtered[i];
        let description = t.description;
        let category = t.category;
        
        // Highlight search matches
        if (searchRegex) {
            description = description.replace(searchRegex, function(match) {
                return '<mark>' + match + '</mark>';
            });
            category = category.replace(searchRegex, function(match) {
                return '<mark>' + match + '</mark>';
            });
        }
        
        tableHTML += `
            <tr>
                <td>${description}</td>
                <td>$${t.amount.toFixed(2)}</td>
                <td>${category}</td>
                <td>${t.date}</td>
                <td>
                    <button class="inline-edit-btn" data-id="${t.id}">Edit</button>
                    <button class="inline-edit-btn danger" data-id="${t.id}" data-action="delete">Delete</button>
                </td>
            </tr>
        `;
    }
    tbody.innerHTML = tableHTML;
    
    // --- Build mobile cards ---
    let cardsHTML = '';
    for (let i = 0; i < filtered.length; i++) {
        const t = filtered[i];
        let description = t.description;
        let category = t.category;
        
        if (searchRegex) {
            description = description.replace(searchRegex, function(match) {
                return '<mark>' + match + '</mark>';
            });
            category = category.replace(searchRegex, function(match) {
                return '<mark>' + match + '</mark>';
            });
        }
        
        cardsHTML += `
            <div class="mobile-card" role="listitem">
                <div><strong>Description:</strong> ${description}</div>
                <div><strong>Amount:</strong> $${t.amount.toFixed(2)}</div>
                <div><strong>Category:</strong> ${category}</div>
                <div><strong>Date:</strong> ${t.date}</div>
                <div class="card-actions">
                    <button class="inline-edit-btn" data-id="${t.id}">Edit</button>
                    <button class="inline-edit-btn danger" data-id="${t.id}" data-action="delete">Delete</button>
                </div>
            </div>
        `;
    }
    cardsContainer.innerHTML = cardsHTML;
    
    // --- Attach event listeners to edit/delete buttons ---
    const allButtons = document.querySelectorAll('[data-id]');
    for (let i = 0; i < allButtons.length; i++) {
        const button = allButtons[i];
        button.addEventListener('click', function(event) {
            const id = this.dataset.id;
            const action = this.dataset.action;
            
            if (action === 'delete') {
                // Delete transaction
                if (confirm('Delete this transaction?')) {
                    const newTransactions = [];
                    for (let j = 0; j < transactions.length; j++) {
                        if (transactions[j].id !== id) {
                            newTransactions.push(transactions[j]);
                        }
                    }
                    transactions = newTransactions;
                    saveData();
                    render();
                    showMessage('Transaction deleted.');
                }
            } else {
                // Edit transaction - fill the form
                let transactionToEdit = null;
                for (let j = 0; j < transactions.length; j++) {
                    if (transactions[j].id === id) {
                        transactionToEdit = transactions[j];
                        break;
                    }
                }
                
                if (transactionToEdit) {
                    editingId = id;
                    document.getElementById('desc-input').value = transactionToEdit.description;
                    document.getElementById('amount-input').value = transactionToEdit.amount.toFixed(2);
                    document.getElementById('category-select').value = transactionToEdit.category;
                    document.getElementById('date-input').value = transactionToEdit.date;
                    document.getElementById('submit-btn').textContent = 'Update Transaction';
                    document.getElementById('cancel-edit').style.display = 'inline-block';
                    document.getElementById('form-status').textContent = 'Editing: ' + transactionToEdit.description;
                    document.getElementById('add-form').scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }
    
    // --- Update stats and cap ---
    updateStats();
    updateCapMessage();
}

// ============================================================
// 9. UPDATE STATISTICS
// ============================================================

function updateStats() {
    // Total number of records
    const total = transactions.length;
    document.getElementById('total-records').textContent = total;
    
    // Total amount spent
    let sum = 0;
    for (let i = 0; i < transactions.length; i++) {
        sum = sum + transactions[i].amount;
    }
    document.getElementById('total-amount').textContent = sum.toFixed(2);
    
    // Top category
    const categoryCount = {};
    for (let i = 0; i < transactions.length; i++) {
        const cat = transactions[i].category;
        if (categoryCount[cat]) {
            categoryCount[cat] = categoryCount[cat] + 1;
        } else {
            categoryCount[cat] = 1;
        }
    }
    
    let topCategory = '-';
    let maxCount = 0;
    for (const cat in categoryCount) {
        if (categoryCount[cat] > maxCount) {
            maxCount = categoryCount[cat];
            topCategory = cat;
        }
    }
    document.getElementById('top-category').textContent = topCategory;
    
    // Last 7 days spending
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    
    let weekSum = 0;
    for (let i = 0; i < transactions.length; i++) {
        const transactionDate = new Date(transactions[i].date);
        if (transactionDate >= weekAgo) {
            weekSum = weekSum + transactions[i].amount;
        }
    }
    document.getElementById('week-trend').textContent = weekSum.toFixed(2);
}

// ============================================================
// 10. UPDATE CAP MESSAGE
// ============================================================

function updateCapMessage() {
    const capArea = document.getElementById('cap-area');
    
    if (capAmount === null || capAmount <= 0) {
        capArea.textContent = 'Set a budget cap in Settings to track progress.';
        return;
    }
    
    let totalSpent = 0;
    for (let i = 0; i < transactions.length; i++) {
        totalSpent = totalSpent + transactions[i].amount;
    }
    
    const remaining = capAmount - totalSpent;
    
    let message = 'Cap: $' + capAmount.toFixed(2) + ' | Spent: $' + totalSpent.toFixed(2) + ' | ';
    
    if (remaining >= 0) {
        message = message + 'Remaining: $' + remaining.toFixed(2) + ' (under cap)';
        capArea.setAttribute('aria-live', 'polite');
    } else {
        message = message + 'EXCEEDED by $' + Math.abs(remaining).toFixed(2);
        capArea.setAttribute('aria-live', 'assertive');
    }
    
    capArea.textContent = message;
}

// ============================================================
// 11. FORM SUBMIT (Add / Edit)
// ============================================================

document.getElementById('transaction-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Get form values
    const descriptionRaw = document.getElementById('desc-input').value;
    const amountRaw = document.getElementById('amount-input').value;
    const category = document.getElementById('category-select').value;
    const dateRaw = document.getElementById('date-input').value;
    
    // Clear previous error messages
    document.getElementById('desc-error').textContent = '';
    document.getElementById('amount-error').textContent = '';
    document.getElementById('date-error').textContent = '';
    
    let isValid = true;
    
    // Validate description
    const descResult = validateDescription(descriptionRaw);
    if (!descResult.valid) {
        document.getElementById('desc-error').textContent = descResult.message;
        isValid = false;
    }
    
    // Validate amount
    const amountResult = validateAmount(amountRaw);
    if (!amountResult.valid) {
        document.getElementById('amount-error').textContent = amountResult.message;
        isValid = false;
    }
    
    // Validate date
    const dateResult = validateDate(dateRaw);
    if (!dateResult.valid) {
        document.getElementById('date-error').textContent = dateResult.message;
        isValid = false;
    }
    
    // Validate category
    const categoryResult = validateCategory(category);
    if (!categoryResult.valid) {
        document.getElementById('desc-error').textContent = categoryResult.message;
        isValid = false;
    }
    
    if (!isValid) {
        showMessage('Please fix the errors above.');
        return;
    }
    
    // If editing
    if (editingId) {
        for (let i = 0; i < transactions.length; i++) {
            if (transactions[i].id === editingId) {
                transactions[i].description = descResult.value;
                transactions[i].amount = amountResult.value;
                transactions[i].category = category;
                transactions[i].date = dateRaw;
                break;
            }
        }
        
        editingId = null;
        document.getElementById('submit-btn').textContent = 'Add Transaction';
        document.getElementById('cancel-edit').style.display = 'none';
        showMessage('Transaction updated.');
    } else {
        // Add new transaction
        const newTransaction = {
            id: generateId(),
            description: descResult.value,
            amount: amountResult.value,
            category: category,
            date: dateRaw
        };
        transactions.push(newTransaction);
        showMessage('Transaction added.');
    }
    
    saveData();
    render();
    this.reset();
    document.getElementById('date-input').value = new Date().toISOString().slice(0, 10);
});

// ============================================================
// 12. CANCEL EDIT
// ============================================================

document.getElementById('cancel-edit').addEventListener('click', function() {
    editingId = null;
    document.getElementById('submit-btn').textContent = 'Add Transaction';
    this.style.display = 'none';
    document.getElementById('form-status').textContent = '';
    document.getElementById('transaction-form').reset();
    document.getElementById('date-input').value = new Date().toISOString().slice(0, 10);
});

// ============================================================
// 13. SEARCH FUNCTIONALITY
// ============================================================

document.getElementById('search-input').addEventListener('input', function() {
    render();
});

document.getElementById('clear-search').addEventListener('click', function() {
    document.getElementById('search-input').value = '';
    render();
});

// ============================================================
// 14. SORT FUNCTIONALITY
// ============================================================

document.getElementById('sort-btn').addEventListener('click', function() {
    sortAsc = !sortAsc;
    this.textContent = 'Sort by Date ' + (sortAsc ? '▲' : '▼');
    render();
});

// ============================================================
// 15. SETTINGS: SET CAP
// ============================================================

document.getElementById('set-cap-btn').addEventListener('click', function() {
    const capValue = parseFloat(document.getElementById('cap-input').value);
    
    if (isNaN(capValue) || capValue < 0) {
        showSettingsMessage('Enter a valid positive number.');
        return;
    }
    
    capAmount = capValue;
    saveData();
    updateCapMessage();
    showSettingsMessage('Cap set to $' + capValue.toFixed(2));
});

// ============================================================
// 16. SETTINGS: EXPORT JSON
// ============================================================

document.getElementById('export-json').addEventListener('click', function() {
    const dataString = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'finance_data.json';
    link.click();
    
    URL.revokeObjectURL(url);
    showSettingsMessage('Export complete.');
});

// ============================================================
// 17. SETTINGS: IMPORT JSON
// ============================================================

document.getElementById('import-trigger').addEventListener('click', function() {
    document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(loadEvent) {
        try {
            const data = JSON.parse(loadEvent.target.result);
            
            if (!Array.isArray(data)) {
                throw new Error('File must contain an array.');
            }
            
            // Check if each item has required fields
            for (let i = 0; i < data.length; i++) {
                if (!data[i].id || data[i].description === undefined || data[i].amount === undefined) {
                    throw new Error('Each transaction needs id, description, and amount.');
                }
            }
            
            transactions = data;
            saveData();
            render();
            showSettingsMessage('Import successful!');
        } catch (error) {
            showSettingsMessage('Import failed: ' + error.message);
        }
    };
    reader.readAsText(file);
    this.value = '';
});

// ============================================================
// 18. SETTINGS: LOAD SAMPLE DATA
// ============================================================

document.getElementById('seed-btn').addEventListener('click', function() {
    if (confirm('Load sample data? This will replace your current transactions.')) {
        loadSeedFromFile();
        showSettingsMessage('Sample data loaded.');
    }
});

// ============================================================
// 19. SETTINGS: CLEAR ALL
// ============================================================

document.getElementById('clear-all').addEventListener('click', function() {
    if (confirm('Delete ALL transactions? This cannot be undone.')) {
        transactions = [];
        saveData();
        render();
        showSettingsMessage('All transactions cleared.');
    }
});

// ============================================================
// 20. LOAD CAP FROM localStorage
// ============================================================

function loadCap() {
    const savedCap = localStorage.getItem(CAP_KEY);
    if (savedCap !== null) {
        capAmount = parseFloat(savedCap);
        document.getElementById('cap-input').value = capAmount;
        updateCapMessage();
    }
}

// ============================================================
// 21. START THE APP
// ============================================================

// Set default date to today
const todayDate = new Date().toISOString().slice(0, 10);
document.getElementById('date-input').value = todayDate;

// Load cap from localStorage
loadCap();

// Load data (will try localStorage, then seed.json, then hardcoded)
loadData();

console.log('Student Finance Tracker loaded!');
