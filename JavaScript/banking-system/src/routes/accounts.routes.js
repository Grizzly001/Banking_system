import express from "express";
import { getAccounts, getAccountById, createAccount,
         deposit, withdraw, transfer, getAccountTransactions } from "../controllers/accounts.controller.js";

const router = express.Router();

router.get("/", getAccounts);
router.get("/:id", getAccountById);
router.post("/", createAccount);
router.post("/:id/deposit", deposit);
router.post("/:id/withdraw", withdraw)
router.post("/transfer", transfer);
router.get("/:id/transactions", getAccountTransactions);
export default router;
