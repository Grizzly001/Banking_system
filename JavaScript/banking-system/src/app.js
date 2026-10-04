import express from "express";
import "dotenv/config";

import { pool } from "./db.js";
import accountsRouter from "./routes/accounts.routes.js";
import { createUser } from "./controllers/accounts.controller.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());
app.use(express.static("public"));
app.post("/users", createUser);
app.use("/accounts", accountsRouter);
app.use(errorHandler);

const result = await pool.query(
    "SELECT NOW() AS current_time"
);

console.log(
    "PostgreSQL connected:",
    result.rows[0]
);

const PORT = Number(
    process.env.PORT ?? 3000
);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});