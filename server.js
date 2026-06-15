const http = require('http');
const fs = require('fs');
const path = require('path');
const ExpenseContract = require('./contract/expenseContract');

const contract = new ExpenseContract();
const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Handle API routes
    if (req.url.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json');

        let body = '';
        req.on('data', chunk => body += chunk.toString());

        req.on('end', async () => {
            try {
                let parsedBody = {};
                if (body) {
                    parsedBody = JSON.parse(body);
                }

                // CREATE EXPENSE
                if (req.method === 'POST' && req.url === '/api/expenses') {
                    const { expenseId, amount, category, description, date, createdBy } = parsedBody;
                    console.log(`\n=== Creating Expense ${expenseId} ===`);
                    const result = await contract.createExpense(expenseId, amount, category, description, date, createdBy);
                    console.log(`✓ Expense ${expenseId} created successfully`);
                    console.log(`  Amount: RM ${parseFloat(amount).toFixed(2)} | Category: ${category} | Created By: ${createdBy}`);
                    res.writeHead(201);
                    res.end(JSON.stringify({ success: true, data: result }));

                // UPDATE EXPENSE
                } else if (req.method === 'PUT' && req.url.match(/^\/api\/expenses\/[^\/]+$/)) {
                    const expenseId = req.url.split('/')[3];
                    const { newAmount, newCategory, newDescription, newDate, updatedBy } = parsedBody;
                    console.log(`\n=== Updating Expense ${expenseId} ===`);
                    const result = await contract.updateExpense(expenseId, newAmount, newCategory, newDescription, newDate, updatedBy);
                    console.log(`✓ Expense ${expenseId} updated successfully`);
                    console.log(`  Updated By: ${updatedBy}`);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, data: result }));

                // DELETE EXPENSE
                } else if (req.method === 'PATCH' && req.url.match(/^\/api\/expenses\/[^\/]+\/delete$/)) {
                    const expenseId = req.url.split('/')[3];
                    const { deletedBy, deletionReason } = parsedBody;
                    console.log(`\n=== Deleting Expense ${expenseId} ===`);
                    const result = await contract.deleteExpense(expenseId, deletedBy, deletionReason);
                    console.log(`✓ Expense ${expenseId} deleted successfully`);
                    console.log(`  Deleted By: ${deletedBy} | Reason: ${deletionReason}`);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, data: result }));

                // QUERY SINGLE EXPENSE
                } else if (req.method === 'GET' && req.url.match(/^\/api\/expenses\/[^\/]+$/)) {
                    const expenseId = req.url.split('/')[3];
                    console.log(`\n=== Querying Expense ${expenseId} ===`);
                    const result = await contract.queryExpense(expenseId);
                    console.log(`✓ Expense ${expenseId} found successfully`);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, data: result }));

                // QUERY ALL EXPENSES
                } else if (req.method === 'GET' && req.url === '/api/expenses') {
                    console.log(`\n=== Querying All Expenses ===`);
                    const result = await contract.queryAllExpense();
                    console.log(`✓ Found ${result.length} expense record(s)`);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, data: result }));

                // QUERY ALL USERS
                } else if (req.method === 'GET' && req.url === '/api/users') {
                    console.log(`\n=== Querying All Users ===`);
                    const result = await contract.queryAllUsers();
                    console.log(`✓ Found ${result.length} user(s)`);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, data: result }));


                // TRANSACTION HISTORY
                } else if (req.method === 'GET' && req.url === '/api/transactions') {
                    console.log(`\n=== Querying Transaction History ===`);
                    const result = contract.getTransactionHistory();
                    console.log(`✓ Found ${result.length} transaction(s)`);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, data: result }));

                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ success: false, error: 'API route not found' }));
                }
            } catch (err) {
                console.log(`✗ Error: ${err.message}`);
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // Serve static files from 'web' directory
    let filePath = path.join(__dirname, 'web', req.url === '/' ? 'index.html' : req.url);
    if (filePath.includes('?')) {
        filePath = filePath.split('?')[0];
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server error: ${error.code}\n`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Start server and initialize ledger
server.listen(PORT, async () => {
    console.log(`\n🔗 Open your browser and visit: http://localhost:${PORT}`);
    console.log(`\n📦 Blockchain-Based Expense Tracking System`);
    console.log(`   Powered by Simulated Hyperledger Fabric`);
    console.log(`   Ledger file: ledger/ledger.json\n`);

    // Initialize sample data
    await contract.checkAndInitLedger();
});
