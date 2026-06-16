'use strict';

// Simulated fabric-contract-api
const fs = require('fs-extra');
const path = require('path');

const LEDGER_PATH = path.join(__dirname, '../ledger/ledger.json');

// Simulated Context Stub
class SimulatedStub {
    constructor() {
        this._ensureLedgerExists();
    }

    _ensureLedgerExists() {
        if (!fs.existsSync(LEDGER_PATH)) {
            fs.writeJsonSync(LEDGER_PATH, { worldState: {}, transactions: [] }, { spaces: 2 });
        }
    }

    _readLedger() {
        return fs.readJsonSync(LEDGER_PATH);
    }

    _writeLedger(data) {
        fs.writeJsonSync(LEDGER_PATH, data, { spaces: 2 });
    }

    async getState(id) {
        const ledger = this._readLedger();
        const val = ledger.worldState[id];
        if (!val) return null;
        return Buffer.from(JSON.stringify(val));
    }

    async putState(id, buffer) {
        const ledger = this._readLedger();
        const state = JSON.parse(buffer.toString());
        ledger.worldState[id] = state;

        ledger.transactions.push({
            transactionId: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            assetId: id,
            action: state.expenseId ? 'expense' : (state.userId ? 'user' : (state.categoryId ? 'category' : 'unknown')),
            assetState: state
        });

        this._writeLedger(ledger);
    }

    async getStateByRange(startKey, endKey) {
        const ledger = this._readLedger();
        const results = [];
        for (const [key, value] of Object.entries(ledger.worldState)) {
            results.push({
                value: { value: Buffer.from(JSON.stringify(value)) },
                done: false
            });
        }
        let index = 0;
        return {
            next: async () => {
                if (index < results.length) {
                    return results[index++];
                }
                return { done: true };
            },
            close: async () => {}
        };
    }
}

// Simulated Contract base class
class Contract {
    constructor() {}
}

// Simulated Context
class SimulatedContext {
    constructor() {
        this.stub = new SimulatedStub();
    }
}

// ==================== EXPENSE CONTRACT ====================

class ExpenseContract extends Contract {

    constructor() {
        super();
        this.ctx = new SimulatedContext();
    }

    // Initialize ledger with sample Users, Categories, and Expenses
    async initLedger(ctx) {
        console.log('\n========================================');
        console.log('  Initializing Ledger with Sample Data');
        console.log('========================================\n');

        // ---- USERS ----
        const users = [
            {
                userId: 'user001',
                fullName: 'Amar bin Abdullah',
                email: 'amar@gmail.com',
                role: 'CREATOR',
                enrolledDate: '2025-01-15',
                department: 'IT Department'
            },
            {
                userId: 'manager001',
                fullName: 'Amir bin Firdaus',
                email: 'amir@gmail.com',
                role: 'MANAGER',
                enrolledDate: '2025-01-10',
                department: 'Finance'
            },
            {
                userId: 'auditor001',
                fullName: 'Razali bin Hassan',
                email: 'razali@gmail.com',
                role: 'AUDITOR',
                enrolledDate: '2025-02-01',
                department: 'Audit'
            }
        ];

        for (const user of users) {
            await ctx.stub.putState(user.userId, Buffer.from(JSON.stringify(user)));
            console.log(`  ✓ User ${user.userId} (${user.fullName}) initialized [Role: ${user.role}]`);
        }


        console.log('\n========================================');
        console.log(`  Ledger initialized: ${users.length} Users`);
        console.log('========================================\n');
    }

    // Check if sample data already exists
    async checkAndInitLedger() {
        const existing = await this.ctx.stub.getState('user001');
        if (existing) {
            console.log('\nSample data already exists\n');
            return false;
        }
        await this.initLedger(this.ctx);
        return true;
    }

    // Helper: Check if asset exists
    async assetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // Helper: Validate that a user ID exists in the ledger
    async validateUser(userId) {
        const ctx = this.ctx;
        const userJSON = await ctx.stub.getState(userId);
        if (!userJSON || userJSON.length === 0) {
            throw new Error(`User ID '${userId}' does not exist. Please use a valid user ID.`);
        }
        const user = JSON.parse(userJSON.toString());
        if (!user.userId) {
            throw new Error(`ID '${userId}' is not a valid user.`);
        }
        return user;
    }

    //Create Expense
    async createExpense(expenseId, amount, category, description, date, createdBy) {
        const ctx = this.ctx;

        //Validate user exists
        await this.validateUser(createdBy);

        const exists = await this.assetExists(ctx, expenseId);
        if (exists) {
            throw new Error(`Expense with ID ${expenseId} already exists.`);
        }

        const parsedAmount = parseFloat(amount);
        if (parsedAmount <= 0) {
            throw new Error('Amount must be greater than 0.');
        }

        const asset = {
            expenseId: expenseId,
            amount: parsedAmount,
            category: category,
            description: description,
            date: date,
            createdBy: createdBy,
            timestamp: new Date().toISOString(),
            status: 'ACTIVE'
        };

        await ctx.stub.putState(expenseId, Buffer.from(JSON.stringify(asset)));
        return asset;
    }

    //Update Expense
    async updateExpense(expenseId, newAmount, newCategory, newDescription, newDate, updatedBy) {
        const ctx = this.ctx;

        //Validate user exists
        await this.validateUser(updatedBy);

        const assetJSON = await ctx.stub.getState(expenseId);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`Expense with ID ${expenseId} does not exist.`);
        }

        const asset = JSON.parse(assetJSON.toString());

        if (!asset.expenseId) {
            throw new Error(`Asset ${expenseId} is not an expense record.`);
        }

        if (asset.status === 'DELETED') {
            throw new Error(`Cannot update expense ${expenseId} because it is DELETED.`);
        }

        if (newAmount) {
            const parsedAmount = parseFloat(newAmount);
            if (parsedAmount <= 0) throw new Error('Amount must be greater than 0.');
            asset.amount = parsedAmount;
        }
        if (newCategory) asset.category = newCategory;
        if (newDescription) asset.description = newDescription;
        if (newDate) asset.date = newDate;

        asset.lastUpdateBy = updatedBy;
        asset.lastUpdateTimestamp = new Date().toISOString();

        await ctx.stub.putState(expenseId, Buffer.from(JSON.stringify(asset)));
        return asset;
    }

    //Delete Expense (Soft Delete)
    async deleteExpense(expenseId, deletedBy, deletionReason) {
        const ctx = this.ctx;

        //Validate user exists
        await this.validateUser(deletedBy);

        const assetJSON = await ctx.stub.getState(expenseId);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`Expense with ID ${expenseId} does not exist.`);
        }

        const asset = JSON.parse(assetJSON.toString());

        if (!asset.expenseId) {
            throw new Error(`Asset ${expenseId} is not an expense record.`);
        }

        if (asset.status === 'DELETED') {
            throw new Error(`Expense ${expenseId} is already DELETED.`);
        }

        asset.status = 'DELETED';
        asset.deletedBy = deletedBy;
        asset.deletionReason = deletionReason;
        asset.deletionTimestamp = new Date().toISOString();

        await ctx.stub.putState(expenseId, Buffer.from(JSON.stringify(asset)));
        return asset;
    }

    //Query Single Expense
    async queryExpense(expenseId) {
        const ctx = this.ctx;
        const assetJSON = await ctx.stub.getState(expenseId);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`Asset not found: ${expenseId}`);
        }
        return JSON.parse(assetJSON.toString());
    }

    //Query All Expenses
    async queryAllExpense() {
        const ctx = this.ctx;
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();

        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            // Only return expense records
            if (record.expenseId) {
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return allResults;
    }
}

module.exports = ExpenseContract;
