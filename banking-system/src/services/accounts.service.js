import { pool } from "../db.js";

export async function getAllAccounts() {
    const result = await pool.query(
        "SELECT * FROM accounts ORDER BY id"
    );

    return result.rows
}

export async function getAccId(accountId) {
    const result = await pool.query(
        "SELECT * FROM accounts WHERE id = $1",
        [accountId]
    );

    return result.rows[0];
}

export async function depositMoney(accountId, amount) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const accountResult = await client.query(
            `
            UPDATE accounts
            SET balance = balance + $1
            WHERE id = $2
            RETURNING*
            `,
            [amount,accountId]
        );
        
        if (accountResult.rows.length === 0) {
            throw new Error("Account not found")
        }

        await client.query(
            `
            INSERT INTO transactions (
                type,
                to_account_id,
                amount
            )
            VALUES ($1, $2, $3)
            `,
            ["deposit", accountId, amount]
        );

        await client.query("COMMIT");

        return accountResult.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }finally {
        client.release();
    }

}

export async function withdrawMoney(accountId, amount) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const accountResult = await client.query(
            `
            SELECT *
            FROM accounts
            WHERE id = $1
            FOR UPDATE
            `,
            [accountId]
        );

        if (accountResult.rows.length === 0) {
           const error = new Error("Account not found");
           error.statusCode = 404;
           throw error;
        }

        const account = accountResult.rows[0];
        const balance = Number(account.balance);

        if (balance < amount) {
            const error = new Error("Insufficient funds");
            error.statusCode = 400;
            throw error;
        }

        const updatedAccountResult = await client.query(
            `
            UPDATE accounts
            SET balance = balance - $1
            WHERE id = $2
            RETURNING *
            `,
            [amount, accountId]
        );

        await client.query(
            `
            INSERT INTO transactions (
                type,
                from_account_id,
                amount
            )
            VALUES ($1, $2, $3)
            `,
            ["withdraw", accountId, amount]
        );

        await client.query("COMMIT");

        return updatedAccountResult.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}

export async function transferMoney(
    fromAccountId,
    toAccountId,
    amount
) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const accountsResult = await client.query(
            `
            SELECT *
            FROM accounts
            WHERE id IN ($1, $2)
            ORDER BY id
            FOR UPDATE
            `,
            [fromAccountId, toAccountId]
        );

        if (accountsResult.rows.length !== 2) {
            const error = new Error("One or both accounts not found");
            error.statusCode = 404;
            throw error;
        }

        const sender = accountsResult.rows.find(
            account => account.id === fromAccountId
        );

        const receiver = accountsResult.rows.find(
            account => account.id === toAccountId
        );

        if (!sender || !receiver) {
            const error = new Error("One or both accounts not found");
            error.statusCode = 404;
            throw error;
        }

        const senderBalance = Number(sender.balance);

        if (senderBalance < amount) {
            const error = new Error("Insufficient funds");
            error.statusCode = 400;
            throw error;
        }

        const senderResult = await client.query(
            `
            UPDATE accounts
            SET balance = balance - $1
            WHERE id = $2
            RETURNING *
            `,
            [amount, fromAccountId]
        );

        const receiverResult = await client.query(
            `
            UPDATE accounts
            SET balance = balance + $1
            WHERE id = $2
            RETURNING *
            `,
            [amount, toAccountId]
        );

        await client.query(
            `
            INSERT INTO transactions (
                type,
                from_account_id,
                to_account_id,
                amount
            )
            VALUES ($1, $2, $3, $4)
            `,
            [
                "transfer",
                fromAccountId,
                toAccountId,
                amount
            ]
        );

        await client.query("COMMIT");

        return {
            message: "Transfer completed successfully",
            from_account: senderResult.rows[0],
            to_account: receiverResult.rows[0]
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}


export async function createNewUser(
    name, surname, email
){
    const result = await pool.query(
        `INSERT INTO users(name,surname, email)
        Values ($1, $2, $3)
        RETURNING *
        `,[name, surname, email]
        );

    return result.rows[0]
}


export async function createNewAccount(
    userID,
    accountNumber
){
    const result = await pool.query(
        `
        INSERT INTO accounts (
        user_id,
        account_number
        )
        VALUES($1, $2)
        RETURNING*
        `,
        [userID,accountNumber]
    );

    return result.rows[0];

}

export async function getTransactionsByAccountId(accountId) {
    const result = await pool.query(
        `
        SELECT *
        FROM transactions
        WHERE from_account_id = $1
           OR to_account_id = $1
        ORDER BY created_at DESC
        `,
        [accountId]
    );

    return result.rows;
}