
'use strict';

const fs = require('fs-extra');
const path = require('path');

// Reset ledger before simulation starts
const LEDGER_PATH = path.join(__dirname, '../ledger/ledger.json');
fs.writeJsonSync(LEDGER_PATH, { worldState: {}, transactions: [] }, { spaces: 2 });

const ExpenseContract = require('../contract/expenseContract');

// ==================== PRINT HELPERS ====================

function printHeader() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║       BLOCKCHAIN-BASED EXPENSE TRACKING SYSTEM               ║');
    console.log('║       Smart Contract Simulation & Testing                    ║');
    console.log('║       BCI3353 Blockchain Technology                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
}

function printScenarioHeader(num, title) {
    console.log('');
    console.log('═'.repeat(65));
    console.log('  SCENARIO ' + num + ': ' + title);
    console.log('═'.repeat(65));
    console.log('');
}

function printSuccess(msg) {
    console.log('  [SUCCESS] ' + msg);
}

function printError(msg) {
    console.log('  [ERROR]   ' + msg);
}

function printExpected(msg) {
    console.log('  [EXPECTED ERROR] ' + msg);
}

function printField(label, value) {
    var pad = '';
    for (var i = label.length; i < 22; i++) pad += ' ';
    console.log('            ' + label + ':' + pad + value);
}

function printSeparator() {
    console.log('  ' + '-'.repeat(60));
}

function printNote(msg) {
    console.log('  [NOTE]    ' + msg);
}

function printFooter(passed, failed, expected) {
    console.log('');
    console.log('═'.repeat(65));
    console.log('  END OF SIMULATION');
    console.log('  Total Tests      : ' + (passed + failed + expected));
    console.log('  Passed           : ' + passed);
    console.log('  Expected Errors  : ' + expected);
    console.log('  Unexpected Failed: ' + failed);
    console.log('═'.repeat(65));
    console.log('');
}

// ==================== MAIN SIMULATION ====================

(async () => {

    printHeader();

    const contract = new ExpenseContract();

    // Initialize ledger with users
    await contract.initLedger(contract.ctx);

    let passed   = 0;
    let failed   = 0;
    let expected = 0;

    // ════════════════════════════════════════════════════════
    // SCENARIO 1: Create 2 Different Expense Records
    // ════════════════════════════════════════════════════════
    printScenarioHeader(1, 'Create 2 Different Expense Records');

    // Expense 1
    console.log('  > Creating Expense 1 (Food & Dining by user001)...');
    printSeparator();
    try {
        const exp1 = await contract.createExpense(
            'EXP-20260101-0001',
            120.50,
            'Food & Dining',
            'Team lunch at Nasi Kandar restaurant',
            '2026-01-01',
            'user001'
        );
        printSuccess('Expense 1 created and committed to the blockchain ledger');
        printField('Expense ID',  exp1.expenseId);
        printField('Amount',      'RM ' + parseFloat(exp1.amount).toFixed(2));
        printField('Category',    exp1.category);
        printField('Description', exp1.description);
        printField('Date',        exp1.date);
        printField('Created By',  exp1.createdBy);
        printField('Status',      exp1.status);
        printField('Timestamp',   exp1.timestamp);
        passed++;
    } catch (err) {
        printError('Failed: ' + err.message);
        failed++;
    }

    console.log('');

    // Expense 2
    console.log('  > Creating Expense 2 (Transportation by manager001)...');
    printSeparator();
    try {
        const exp2 = await contract.createExpense(
            'EXP-20260102-0002',
            85.00,
            'Transportation',
            'Grab ride to client site meeting',
            '2026-01-02',
            'manager001'
        );
        printSuccess('Expense 2 created and committed to the blockchain ledger');
        printField('Expense ID',  exp2.expenseId);
        printField('Amount',      'RM ' + parseFloat(exp2.amount).toFixed(2));
        printField('Category',    exp2.category);
        printField('Description', exp2.description);
        printField('Date',        exp2.date);
        printField('Created By',  exp2.createdBy);
        printField('Status',      exp2.status);
        printField('Timestamp',   exp2.timestamp);
        passed++;
    } catch (err) {
        printError('Failed: ' + err.message);
        failed++;
    }

    console.log('');
    console.log('  RESULT: 2 expense records successfully committed to the ledger.');
    console.log('');

    // ════════════════════════════════════════════════════════
    // SCENARIO 2: Create 1 Expense With Same Expense ID
    // ════════════════════════════════════════════════════════
    printScenarioHeader(2, 'Create Expense with Duplicate Expense ID');

    console.log('  > Attempting to create expense with existing ID: EXP-20260101-0001...');
    printSeparator();
    printNote('EXP-20260101-0001 was already created in Scenario 1.');
    printNote('The blockchain must reject this to ensure data integrity.');
    console.log('');
    try {
        await contract.createExpense(
            'EXP-20260101-0001',
            50.00,
            'Office Supplies',
            'Attempting duplicate record',
            '2026-01-03',
            'user001'
        );
        printError('Duplicate ID was accepted — this should NOT happen!');
        failed++;
    } catch (err) {
        printExpected(err.message);
        printSuccess('Blockchain correctly rejected the duplicate Expense ID');
        printNote('Ledger integrity is maintained — no duplicate records allowed.');
        expected++;
    }

    console.log('');

    // ════════════════════════════════════════════════════════
    // SCENARIO 3: Query Single Expense by ID
    // ════════════════════════════════════════════════════════
    printScenarioHeader(3, 'Query Single Expense by ID');

    console.log('  > Querying EXP-20260101-0001 from the ledger...');
    printSeparator();
    try {
        const result = await contract.queryExpense('EXP-20260101-0001');
        printSuccess('Expense record successfully retrieved from the ledger');
        printField('Expense ID',  result.expenseId);
        printField('Amount',      'RM ' + parseFloat(result.amount).toFixed(2));
        printField('Category',    result.category);
        printField('Description', result.description);
        printField('Date',        result.date);
        printField('Created By',  result.createdBy);
        printField('Status',      result.status);
        printField('Timestamp',   result.timestamp);
        passed++;
    } catch (err) {
        printError('Query failed: ' + err.message);
        failed++;
    }

    console.log('');

    // ════════════════════════════════════════════════════════
    // SCENARIO 4: Update Expense Record (by Manager)
    // ════════════════════════════════════════════════════════
    printScenarioHeader(4, 'Update Expense Record (by Manager)');

    console.log('  > Updating EXP-20260101-0001 — manager001 changes amount and description...');
    printSeparator();
    try {
        const before = await contract.queryExpense('EXP-20260101-0001');
        console.log('  Before Update:');
        printField('Amount',      'RM ' + parseFloat(before.amount).toFixed(2));
        printField('Description', before.description);
        console.log('');

        const updated = await contract.updateExpense(
            'EXP-20260101-0001',
            150.00,
            '',
            'Team lunch at Nasi Kandar + dessert',
            '',
            'manager001'
        );

        printSuccess('Expense record updated and committed to the blockchain ledger');
        console.log('  After Update:');
        printField('Expense ID',       updated.expenseId);
        printField('New Amount',       'RM ' + parseFloat(updated.amount).toFixed(2));
        printField('New Description',  updated.description);
        printField('Updated By',       updated.lastUpdateBy);
        printField('Update Timestamp', updated.lastUpdateTimestamp);
        printField('Status',           updated.status);
        passed++;
    } catch (err) {
        printError('Update failed: ' + err.message);
        failed++;
    }

    console.log('');

    // ════════════════════════════════════════════════════════
    // SCENARIO 5: Delete Expense Record
    // ════════════════════════════════════════════════════════
    printScenarioHeader(5, 'Delete Expense Record');

    console.log('  > manager001 deletes EXP-20260102-0002 (duplicate entry)...');
    printSeparator();
    try {
        const deleted = await contract.deleteExpense(
            'EXP-20260102-0002',
            'manager001',
            'Duplicate entry — expense was submitted twice by mistake'
        );
        printSuccess('Expense deleted and status updated on the blockchain ledger');
        printField('Expense ID',       deleted.expenseId);
        printField('Status',           deleted.status);
        printField('Deleted By',       deleted.deletedBy);
        printField('Deletion Reason',  deleted.deletionReason);
        printField('Delete Timestamp', deleted.deletionTimestamp);
        console.log('');
        printNote('Record is preserved on the ledger — blockchain is immutable.');
        printNote('Full audit trail is maintained for compliance purposes.');
        passed++;
    } catch (err) {
        printError('Delete failed: ' + err.message);
        failed++;
    }

    console.log('');

    // ════════════════════════════════════════════════════════
    // SCENARIO 6: Delete Same Expense Record Again
    // ════════════════════════════════════════════════════════
    printScenarioHeader(6, 'Delete Same Expense Record');

    console.log('  > Attempting to delete EXP-20260102-0002 again...');
    printSeparator();
    printNote('This expense was already marked as DELETED in Scenario 5.');
    console.log('');
    try {
        await contract.deleteExpense(
            'EXP-20260102-0002',
            'manager001',
            'Trying to delete an already deleted record'
        );
        printError('Duplicate delete was accepted — this should NOT happen!');
        failed++;
    } catch (err) {
        printExpected(err.message);
        printSuccess('Blockchain correctly prevented deleting an already deleted expense');
        expected++;
    }

    console.log('');

    // ════════════════════════════════════════════════════════
    // SCENARIO 7: Query All Expense Records
    // ════════════════════════════════════════════════════════
    printScenarioHeader(7, 'Query All Expense Records');

    console.log('  > Retrieving all expense records from the blockchain ledger...');
    printSeparator();
    try {
        const all = await contract.queryAllExpense();
        printSuccess('Found ' + all.length + ' expense record(s) on the ledger');
        console.log('');

        for (var i = 0; i < all.length; i++) {
            var e = all[i];
            console.log('  Record ' + (i + 1) + ':');
            printField('Expense ID',   e.expenseId);
            printField('Amount',       'RM ' + parseFloat(e.amount).toFixed(2));
            printField('Category',     e.category);
            printField('Description',  e.description);
            printField('Date',         e.date);
            printField('Created By',   e.createdBy);
            printField('Status',       e.status);
            if (e.lastUpdateBy) {
                printField('Last Update By', e.lastUpdateBy);
            }
            if (e.deletedBy) {
                printField('Deleted By',    e.deletedBy);
                printField('Delete Reason', e.deletionReason);
            }
            console.log('');
        }
        passed++;
    } catch (err) {
        printError('Query all failed: ' + err.message);
        failed++;
    }

    // ════════════════════════════════════════════════════════
    // FINAL: Ledger State Summary
    // ════════════════════════════════════════════════════════
    const ledger      = fs.readJsonSync(LEDGER_PATH);
    const allRecords  = Object.values(ledger.worldState);
    const expenseRecs = allRecords.filter(function(r) { return r.expenseId; });
    const userRecs    = allRecords.filter(function(r) { return r.userId; });
    const activeRecs  = expenseRecs.filter(function(r) { return r.status === 'ACTIVE'; });
    const deletedRecs = expenseRecs.filter(function(r) { return r.status === 'DELETED'; });

    console.log('═'.repeat(65));
    console.log('  FINAL LEDGER STATE SUMMARY');
    console.log('═'.repeat(65));
    console.log('');
    printField('World State Records', allRecords.length);
    printField('User Records',        userRecs.length);
    printField('Expense Records',     expenseRecs.length);
    printField('Active Expenses',     activeRecs.length);
    printField('Deleted Expenses',    deletedRecs.length);
    printField('Total Transactions',  ledger.transactions.length);
    console.log('');
    printSuccess('Blockchain ledger is intact — all transactions recorded');
    printSuccess('Audit trail preserved in ledger/ledger.json');
    console.log('');

    printFooter(passed, failed, expected);

})();
