const STORAGE_KEY = 'finance_tracker_data';
const CAP_KEY = 'finance_cap';

let transactions = [];
let capAmount = null;
let editingId = null;
let sortAsc = false;
let searchTerm = '';

function loadData() {
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
    
    loadSeedFromFile();
}

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
                useHardcodedData();
            }
        })
        .catch(function(error) {
            console.log('Could not load seed.json, using hardcoded data:', error);
            useHardcodedData();
        });
}

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

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    
    if (capAmount !== null && capAmount >= 0) {
        localStorage.setItem(CAP_KEY, String(capAmount));
    } else {
        localStorage.removeItem(CAP_KEY);
    }
}

function generateId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

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

function validateDescription(text) {
    const cleaned = text.trim().replace(/\s+/g, ' ');
    
    if (!/^\S(?:.*\S)?$/.test(cleaned)) {
        return { valid: false, message: 'No leading or trailing spaces allowed.' };
    }
    
    const words = cleaned.split(' ');
    for (let i = 0; i < words.length - 1; i++) {
        if (words[i].toLowerCase() === words[i + 1].toLowerCase()) {
            return { valid: false, message: 'Duplicate words found (e.g., "the the").' };
        }
    }
    
    return { valid: true, value: cleaned };
}

function validateAmount(value) {
    if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value)) {
        return { valid: false, message: 'Enter a positive number (e.g., 12.50).' };
    }
    return { valid: true, value: parseFloat(value) };
}

function validateDate(value) {
    if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) {
        return { valid: false, message: 'Use YYYY-MM-DD format.' };
    }
    return { valid: true };
}

function validateCategory(value) {
    if (!/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(value)) {
        return { valid: false, message: 'Only letters, spaces, and hyphens allowed.' };
    }
    return { valid: true };
}

function render() {
    const searchValue = document.getElementById('search-input').value.trim();
    let searchRegex = null;
    
    if (searchValue) {
        try {
            searchRegex = new RegExp(searchValue, 'i');
        } catch (error) {
            document.getElementById('search-error').textContent = 'Invalid search pattern.';
        }
    }
    
    let filtered = transactions;
    if (searchRegex) {
        filtered = transactions.filter(function(transaction) {
            return searchRegex.test(transaction.description) ||
                   searchRegex.test(transaction.category) ||
                   searchRegex.test(transaction.date);
        });
    }
    
    filtered.sort(function(a, b) {
        let valueA = a.date;
        let valueB = b.date;
        
        if (sortAsc) {
            if (valueA < valueB) return -1;
            if (valueA > valueB) return 1;
            return 0;
        } else {
            if (valueA > valueB) return -1;
            if (valueA < valueB) return 1;
            return 0;
        }
    });
    
    const tbody = document.getElementById('records-body');
    const cardsContainer = document.getElementById('mobile-cards');
    const emptyMsg = document.getElementById('empty-msg');
    
    if (filtered.length === 0) {
        tbody.innerHTML = '';
        cardsContainer.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }
    
    emptyMsg.style.display = 'none';
    
    let tableHTML = '';
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
    
    const allButtons = document.querySelectorAll('[data-id]');
    for (let i = 0; i < allButtons.length; i++) {
        const button = allButtons[i];
        button.addEventListener('click', function(event) {
            const id = this.dataset.id;
            const action = this.dataset.action;
            
            if (action === 'delete') {
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
    
    updateStats();
    updateCapMessage();
}

function updateStats() {
    const total = transactions.length;
    document.getElementById('total-records').textContent = total;
    
    let sum = 0;
    for (let i = 0; i < transactions.length; i++) {
        sum = sum + transactions[i].amount;
    }
    document.getElementById('total-amount').textContent = sum.toFixed(2);
    
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

document.getElementById('transaction-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const descriptionRaw = document.getElementById('desc-input').value;
    const amountRaw = document.getElementById('amount-input').value;
    const category = document.getElementById('category-select').value;
    const dateRaw = document.getElementById('date-input').value;
    
    document.getElementById('desc-error').textContent = '';
    document.getElementById('amount-error').textContent = '';
    document.getElementById('date-error').textContent = '';
    
    let isValid = true;
    
    const descResult = validateDescription(descriptionRaw);
    if (!descResult.valid) {
        document.getElementById('desc-error').textContent = descResult.message;
        isValid = false;
    }
    
    const amountResult = validateAmount(amountRaw);
    if (!amountResult.valid) {
        document.getElementById('amount-error').textContent = amountResult.message;
        isValid = false;
    }
    
    const dateResult = validateDate(dateRaw);
    if (!dateResult.valid) {
        document.getElementById('date-error').textContent = dateResult.message;
        isValid = false;
    }
    
    const categoryResult = validateCategory(category);
    if (!categoryResult.valid) {
        document.getElementById('desc-error').textContent = categoryResult.message;
        isValid = false;
    }
    
    if (!isValid) {
        showMessage('Please fix the errors above.');
        return;
    }
    
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

document.getElementById('cancel-edit').addEventListener('click', function() {
    editingId = null;
    document.getElementById('submit-btn').textContent = 'Add Transaction';
    this.style.display = 'none';
    document.getElementById('form-status').textContent = '';
    document.getElementById('transaction-form').reset();
    document.getElementById('date-input').value = new Date().toISOString().slice(0, 10);
});

document.getElementById('search-input').addEventListener('input', function() {
    render();
});

document.getElementById('clear-search').addEventListener('click', function() {
    document.getElementById('search-input').value = '';
    render();
});

document.getElementById('sort-btn').addEventListener('click', function() {
    sortAsc = !sortAsc;
    this.textContent = 'Sort by Date ' + (sortAsc ? '▲' : '▼');
    render();
});

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

document.getElementById('seed-btn').addEventListener('click', function() {
    if (confirm('Load sample data? This will replace your current transactions.')) {
        loadSeedFromFile();
        showSettingsMessage('Sample data loaded.');
    }
});

document.getElementById('clear-all').addEventListener('click', function() {
    if (confirm('Delete ALL transactions? This cannot be undone.')) {
        transactions = [];
        saveData();
        render();
        showSettingsMessage('All transactions cleared.');
    }
});

function loadCap() {
    const savedCap = localStorage.getItem(CAP_KEY);
    if (savedCap !== null) {
        capAmount = parseFloat(savedCap);
        document.getElementById('cap-input').value = capAmount;
        updateCapMessage();
    }
}

const todayDate = new Date().toISOString().slice(0, 10);
document.getElementById('date-input').value = todayDate;

loadCap();
loadData();

console.log('Student Finance Tracker loaded!');
