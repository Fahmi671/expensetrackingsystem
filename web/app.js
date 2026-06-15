const API_URL = "http://localhost:3000/api";

// ==================== OUTPUT / STATUS PANEL ====================
function log(message) {
    const output = document.getElementById('output');
    if (typeof message === 'object') {
        output.innerText = JSON.stringify(message, null, 2);
    } else {
        output.innerText = message;
    }
}

function appendLog(message) {
    const output = document.getElementById('output');
    output.innerText += '\n' + message;
    output.scrollTop = output.scrollHeight;
}

// ==================== HELPER ====================
function switchTab(tabId, btnElement) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    // Add active class to clicked button
    if (btnElement) {
        btnElement.classList.add('active');
    }
}

function showMessage(elementId, success, message, data = null) {
    const el = document.getElementById(elementId);
    el.className = `msg-box ${success ? 'success' : 'error'}`;
    let html = `<strong>${success ? '✓ Success' : '✕ Error'}:</strong> ${message}`;
    if (data) {
        html += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
    el.innerHTML = html;
}

// ==================== CREATE EXPENSE ====================
async function createExpense() {
    const expenseId = document.getElementById("c_id").value.trim();
    const amount = document.getElementById("c_amount").value;
    const category = document.getElementById("c_category").value;
    const description = document.getElementById("c_desc").value.trim();
    const date = document.getElementById("c_date").value;
    const createdBy = document.getElementById("c_creator").value;

    if (!expenseId || !amount || !category || !description || !date || !createdBy) {
        showMessage('create_msg', false, 'Please fill in all fields.');
        return;
    }

    log(`Submitting Transaction: CreateExpense(${expenseId}, ${amount}, ${category}, ${createdBy})...`);

    try {
        const res = await fetch(`${API_URL}/expenses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expenseId, amount: parseFloat(amount), category, description, date, createdBy })
        });
        const result = await res.json();

        if (result.success) {
            appendLog(`\n✓ Expense ${expenseId} created successfully.`);
            appendLog(`  Amount: RM ${parseFloat(amount).toFixed(2)} | Category: ${category}`);
            appendLog(`  Block verified and committed to ledger.`);
            showMessage('create_msg', true, 'Expense recorded on blockchain!', result.data);
            document.querySelectorAll('#c_id, #c_amount, #c_desc, #c_date').forEach(el => el.value = '');
            document.getElementById('c_category').selectedIndex = 0;
            document.getElementById('c_creator').selectedIndex = 0;
        } else {
            appendLog(`\n✗ Error: ${result.error}`);
            showMessage('create_msg', false, result.error);
        }
    } catch (err) {
        appendLog(`\n✗ Network Error: ${err.message}`);
        showMessage('create_msg', false, 'Network error: ' + err.message);
    }
}

// ==================== UPDATE EXPENSE ====================
async function updateExpense() {
    const expenseId = document.getElementById("u_id").value.trim();
    const newAmount = document.getElementById("u_amount").value;
    const newCategory = document.getElementById("u_category").value;
    const newDescription = document.getElementById("u_desc").value.trim();
    const newDate = document.getElementById("u_date").value;
    const updatedBy = document.getElementById("u_updater").value;

    if (!expenseId || !updatedBy) {
        showMessage('update_msg', false, 'Expense ID and Updated By are required.');
        return;
    }

    log(`Submitting Transaction: UpdateExpense(${expenseId}, updatedBy: ${updatedBy})...`);

    try {
        const res = await fetch(`${API_URL}/expenses/${expenseId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                newAmount: newAmount ? parseFloat(newAmount) : null,
                newCategory: newCategory || null,
                newDescription: newDescription || null,
                newDate: newDate || null,
                updatedBy
            })
        });
        const result = await res.json();

        if (result.success) {
            appendLog(`\n✓ Expense ${expenseId} updated successfully.`);
            appendLog(`  Updated By: ${updatedBy}`);
            appendLog(`  Block verified and committed to ledger.`);
            showMessage('update_msg', true, 'Expense updated on blockchain!', result.data);
        } else {
            appendLog(`\n✗ Error: ${result.error}`);
            showMessage('update_msg', false, result.error);
        }
    } catch (err) {
        appendLog(`\n✗ Network Error: ${err.message}`);
        showMessage('update_msg', false, 'Network error: ' + err.message);
    }
}

// ==================== DELETE EXPENSE ====================
async function deleteExpense() {
    const expenseId = document.getElementById("del_id").value.trim();
    const deletedBy = document.getElementById("del_user").value;
    const deletionReason = document.getElementById("del_reason").value.trim();

    if (!expenseId || !deletedBy || !deletionReason) {
        showMessage('delete_msg', false, 'Please fill in all fields.');
        return;
    }

    log(`Submitting Transaction: DeleteExpense(${expenseId}, deletedBy: ${deletedBy})...`);

    try {
        const res = await fetch(`${API_URL}/expenses/${expenseId}/delete`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deletedBy, deletionReason })
        });
        const result = await res.json();

        if (result.success) {
            appendLog(`\n✓ Expense ${expenseId} deleted successfully.`);
            appendLog(`  Deleted By: ${deletedBy} | Reason: ${deletionReason}`);
            appendLog(`  Block verified and committed to ledger.`);
            showMessage('delete_msg', true, 'Expense deleted on blockchain!', result.data);
        } else {
            appendLog(`\n✗ Error: ${result.error}`);
            showMessage('delete_msg', false, result.error);
        }
    } catch (err) {
        appendLog(`\n✗ Network Error: ${err.message}`);
        showMessage('delete_msg', false, 'Network error: ' + err.message);
    }
}

// ==================== QUERY EXPENSE ====================
async function queryExpense() {
    const expenseId = document.getElementById("q_id").value.trim();

    log(`Querying Ledger${expenseId ? ` for ${expenseId}` : ' (All Expenses)'}...`);

    try {
        let url = `${API_URL}/expenses`;
        if (expenseId) url += `/${expenseId}`;

        const res = await fetch(url);
        const result = await res.json();

        if (result.success) {
            const data = Array.isArray(result.data) ? result.data : [result.data];
            appendLog(`\n✓ Found ${data.length} expense record(s)`);
            log(result.data);
        } else {
            appendLog(`\n✗ Error: ${result.error}`);
            log(`Error: ${result.error}`);
        }
    } catch (err) {
        appendLog(`\n✗ Network Error: ${err.message}`);
        log('Network error: ' + err.message);
    }
}



