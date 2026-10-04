import { getAllAccounts,
         getAccId,
         depositMoney,
         withdrawMoney,
         createNewUser,
         createNewAccount,
         transferMoney,
         getTransactionsByAccountId } from "../services/accounts.service.js";

export async function getAccounts(req, res) {
    const accounts = await getAllAccounts();

    res.json(accounts)
}

export async function getAccountById (req, res) {
    const accountId = Number(req.params.id);

    if (Number.isNaN(accountId)) {
        return res.status(400).json({
            message: "Invalid account id"
        });
    }

    const account = await getAccId(accountId);

    if (!account){
        return res.status(404).json({
            message: "Account not found"
        });
    }

    res.json(account)
}


export async function deposit(req, res) {
    const accountId = Number(req.params.id);
    const amount = Number(req.body.amount);

    if (Number.isNaN(accountId)) {
        return res.status(400).json({
            message: "Invalid account id: "
        });
    }

        if (Number.isNaN(amount) || amount <= 0) {
        return res.status(400).json({
            message: "Amount must be greater than 0"
        });
    }
    
    const result = await depositMoney(accountId, amount);

    res.json(result);
}


export async function withdraw(req, res, next) {
    try {
        const accountId = Number(req.params.id);
        const amount = Number(req.body.amount);

        if (Number.isNaN(accountId)) {
            return res.status(400).json({
                message: "Invalid account id"
            });
        }

        if (Number.isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }

        const result = await withdrawMoney(accountId, amount);

        res.json(result);

    } catch (error) {
        next(error)
    }
}

export async function transfer(req, res, next) {
    try {
        const fromAccountId = Number(req.body.from_account_id);
        const toAccountId = Number(req.body.to_account_id);
        const amount = Number(req.body.amount);

        if (
            Number.isNaN(fromAccountId) ||
            Number.isNaN(toAccountId)
        ) {
            return res.status(400).json({
                message: "Invalid account id"
            });
        }

        if (Number.isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }

        if (fromAccountId === toAccountId) {
            return res.status(400).json({
                message: "Sender and receiver cannot be the same account"
            });
        }

        const result = await transferMoney(
            fromAccountId,
            toAccountId,
            amount
        );

        res.json(result);

    } catch (error) {
        next(error);
    }
}


export async function createUser(req, res, next) {
    try {
        const {name, surname, email} = req.body;

        if (!name || !surname || !email) {
            return res.status(400).json({
                message: "name, surname and email are required:"
            });
        }
        
        const user = await createNewUser(
            name,
            surname,
            email
        );
        
        res.status(201).json(user);

    } catch (error){
        next(error);
    }

}



export async function createAccount(req, res, next) {
    
    try {
    const {user_id, account_number} = req.body;

    if (!user_id || !account_number) {
        return res.status(400).json({
            message: "user_id and account_number are required"
        });
    }

    const account = await createNewAccount(
        user_id,
        account_number
    );

    res.status(201).json(account);
    } catch (error) {
        next(error);
    }

}


export async function getAccountTransactions(req, res, next) {
    try {
        const accountId = Number(req.params.id);

        if (Number.isNaN(accountId)) {
            return res.status(400).json({
                message: "Invalid account id"
            });
        }

        const transactions = await getTransactionsByAccountId(
            accountId
        );

        res.json(transactions);

    } catch (error) {
        next(error);
    }
}