const API_BASE = "";

const state = {
  accounts: [],
  selectedAccountId: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function formatMoney(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number)
    ? number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(value ?? "0.00");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function showToast(title, message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-title">${escapeHtml(title)}</div>
    <div class="toast-message">${escapeHtml(message)}</div>
  `;
  $("#toast-container").appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let payload = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    payload = await response.json();
  } else {
    const text = await response.text();
    payload = text ? { message: text } : null;
  }

  if (!response.ok) {
    const error = new Error(payload?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function setApiStatus(ok, text) {
  const dot = $("#api-dot");
  dot.classList.remove("ok", "error");
  dot.classList.add(ok ? "ok" : "error");
  $("#api-status").textContent = text;
}

function setBusy(button, busy, busyText = "Working...") {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function setSelectedAccount(accountId) {
  state.selectedAccountId = Number(accountId);
  const account = state.accounts.find((item) => Number(item.id) === state.selectedAccountId);
  $("#stat-selected").textContent = account ? `${account.account_number} (#${account.id})` : "None";
  $("#history-account").value = account ? String(account.id) : "";
  renderAccounts();
}

function renderStats() {
  $("#stat-accounts").textContent = String(state.accounts.length);
  const total = state.accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  $("#stat-balance").textContent = formatMoney(total);
  const selected = state.accounts.find((item) => Number(item.id) === Number(state.selectedAccountId));
  $("#stat-selected").textContent = selected ? `${selected.account_number} (#${selected.id})` : "None";
}

function renderAccounts() {
  const grid = $("#accounts-grid");
  const empty = $("#accounts-empty");

  grid.innerHTML = "";
  empty.classList.toggle("hidden", state.accounts.length !== 0);

  for (const account of state.accounts) {
    const card = document.createElement("article");
    card.className = `account-card ${Number(account.id) === Number(state.selectedAccountId) ? "selected" : ""}`;
    card.innerHTML = `
      <div class="account-card-top">
        <span class="account-number">${escapeHtml(account.account_number)}</span>
        <span class="account-id">Account #${escapeHtml(account.id)}</span>
      </div>
      <div class="balance-label">Current balance</div>
      <div class="balance-value">${formatMoney(account.balance)}</div>
      <div class="account-meta">
        <span>User ID: ${escapeHtml(account.user_id)}</span>
        <span>${formatDate(account.created_at)}</span>
      </div>
      <div class="account-actions">
        <button class="button secondary small" data-action="select" data-id="${escapeHtml(account.id)}">Select</button>
        <button class="button ghost small" data-action="history" data-id="${escapeHtml(account.id)}">History</button>
      </div>
    `;
    grid.appendChild(card);
  }

  renderStats();
}

function fillAccountSelect(select, { allowEmpty = false } = {}) {
  const current = select.value;
  select.innerHTML = allowEmpty ? '<option value="">Choose account</option>' : "";
  for (const account of state.accounts) {
    const option = document.createElement("option");
    option.value = String(account.id);
    option.textContent = `#${account.id} · ${account.account_number} · ${formatMoney(account.balance)}`;
    select.appendChild(option);
  }
  if ([...select.options].some((option) => option.value === current)) {
    select.value = current;
  }
}

function refreshAccountSelectors() {
  fillAccountSelect($("#deposit-account"));
  fillAccountSelect($("#withdraw-account"));
  fillAccountSelect($("#transfer-from"));
  fillAccountSelect($("#transfer-to"));
  fillAccountSelect($("#history-account"), { allowEmpty: true });

  if (state.selectedAccountId) {
    $("#history-account").value = String(state.selectedAccountId);
  }
}

async function loadAccounts({ silent = false } = {}) {
  try {
    const accounts = await apiRequest("/accounts");
    state.accounts = Array.isArray(accounts) ? accounts : [];

    if (state.selectedAccountId && !state.accounts.some((item) => Number(item.id) === Number(state.selectedAccountId))) {
      state.selectedAccountId = null;
    }
    if (!state.selectedAccountId && state.accounts.length > 0) {
      state.selectedAccountId = Number(state.accounts[0].id);
    }

    renderAccounts();
    refreshAccountSelectors();
    setApiStatus(true, "API connected");
    $("#last-refresh").textContent = `Last refresh: ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    state.accounts = [];
    renderAccounts();
    refreshAccountSelectors();
    setApiStatus(false, "API unavailable");
    if (!silent) showToast("Could not load accounts", error.message, "error");
  }
}

function showSection(sectionId) {
  $$(".page-section").forEach((section) => section.classList.toggle("active-section", section.id === sectionId));
  $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.target === sectionId));
}

async function loadHistory(accountId) {
  const body = $("#history-body");
  const empty = $("#history-empty");
  body.innerHTML = "";

  if (!accountId) {
    empty.textContent = "Choose an account and load its history.";
    empty.classList.remove("hidden");
    return;
  }

  try {
    const rows = await apiRequest(`/accounts/${accountId}/transactions`);
    const transactions = Array.isArray(rows) ? rows : [];
    empty.classList.toggle("hidden", transactions.length !== 0);
    if (transactions.length === 0) {
      empty.textContent = "No transactions found for this account.";
    }

    for (const transaction of transactions) {
      const tr = document.createElement("tr");
      const type = String(transaction.type || "unknown").toLowerCase();
      tr.innerHTML = `
        <td>${escapeHtml(transaction.id)}</td>
        <td><span class="type-badge type-${escapeHtml(type)}">${escapeHtml(type)}</span></td>
        <td>${escapeHtml(transaction.from_account_id ?? "—")}</td>
        <td>${escapeHtml(transaction.to_account_id ?? "—")}</td>
        <td>${formatMoney(transaction.amount)}</td>
        <td>${formatDate(transaction.created_at)}</td>
      `;
      body.appendChild(tr);
    }
  } catch (error) {
    empty.textContent = error.message;
    empty.classList.remove("hidden");
    showToast("History error", error.message, "error");
  }
}

$("#create-user-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  setBusy(button, true, "Creating...");

  try {
    const payload = {
      name: $("#user-name").value.trim(),
      surname: $("#user-surname").value.trim(),
      email: $("#user-email").value.trim(),
    };
    const user = await apiRequest("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    $("#created-user-card").textContent = `Created user\nID: ${user.id}\n${user.name} ${user.surname}\n${user.email}`;
    $("#created-user-card").classList.remove("hidden");
    $("#account-user-id").value = user.id;
    event.currentTarget.reset();
    $("#account-user-id").value = user.id;
    showToast("User created", `User #${user.id} created successfully.`);
    showSection("accounts-section");
    $("#account-number").focus();
  } catch (error) {
    showToast("Could not create user", error.message, "error");
  } finally {
    setBusy(button, false);
  }
});

$("#create-account-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  setBusy(button, true, "Creating...");

  try {
    const payload = {
      user_id: Number($("#account-user-id").value),
      account_number: $("#account-number").value.trim(),
    };
    const account = await apiRequest("/accounts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    showToast("Account created", `${account.account_number} was created successfully.`);
    event.currentTarget.reset();
    await loadAccounts({ silent: true });
    setSelectedAccount(account.id);
  } catch (error) {
    showToast("Could not create account", error.message, "error");
  } finally {
    setBusy(button, false);
  }
});

$("#lookup-account-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  setBusy(button, true, "Loading...");

  try {
    const accountId = Number($("#lookup-account-id").value);
    const account = await apiRequest(`/accounts/${accountId}`);
    $("#lookup-result").textContent = `Account #${account.id}\nNumber: ${account.account_number}\nUser ID: ${account.user_id}\nBalance: ${formatMoney(account.balance)}`;
    $("#lookup-result").classList.remove("hidden");
    setSelectedAccount(account.id);
  } catch (error) {
    $("#lookup-result").classList.add("hidden");
    showToast("Account lookup failed", error.message, "error");
  } finally {
    setBusy(button, false);
  }
});

$("#deposit-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  setBusy(button, true, "Depositing...");

  try {
    const accountId = Number($("#deposit-account").value);
    const amount = Number($("#deposit-amount").value);
    const account = await apiRequest(`/accounts/${accountId}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
    showToast("Deposit completed", `New balance: ${formatMoney(account.balance)}`);
    $("#deposit-amount").value = "";
    await loadAccounts({ silent: true });
    setSelectedAccount(accountId);
  } catch (error) {
    showToast("Deposit failed", error.message, "error");
  } finally {
    setBusy(button, false);
  }
});

$("#withdraw-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  setBusy(button, true, "Withdrawing...");

  try {
    const accountId = Number($("#withdraw-account").value);
    const amount = Number($("#withdraw-amount").value);
    const account = await apiRequest(`/accounts/${accountId}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
    showToast("Withdrawal completed", `New balance: ${formatMoney(account.balance)}`);
    $("#withdraw-amount").value = "";
    await loadAccounts({ silent: true });
    setSelectedAccount(accountId);
  } catch (error) {
    showToast("Withdrawal failed", error.message, "error");
  } finally {
    setBusy(button, false);
  }
});

$("#transfer-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  setBusy(button, true, "Transferring...");

  try {
    const fromAccountId = Number($("#transfer-from").value);
    const toAccountId = Number($("#transfer-to").value);
    const amount = Number($("#transfer-amount").value);

    if (fromAccountId === toAccountId) {
      throw new Error("Sender and receiver must be different accounts.");
    }

    const result = await apiRequest("/accounts/transfer", {
      method: "POST",
      body: JSON.stringify({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount,
      }),
    });

    showToast("Transfer completed", result?.message || "Funds transferred successfully.");
    $("#transfer-amount").value = "";
    await loadAccounts({ silent: true });
    setSelectedAccount(fromAccountId);
  } catch (error) {
    showToast("Transfer failed", error.message, "error");
  } finally {
    setBusy(button, false);
  }
});

$("#load-history-btn").addEventListener("click", async () => {
  const accountId = Number($("#history-account").value);
  if (!accountId) {
    showToast("Choose account", "Select an account first.", "error");
    return;
  }
  setSelectedAccount(accountId);
  await loadHistory(accountId);
});

$("#refresh-accounts-btn").addEventListener("click", () => loadAccounts());
$("#refresh-all-btn").addEventListener("click", async () => {
  await loadAccounts();
  if (state.selectedAccountId) await loadHistory(state.selectedAccountId);
});

$("#accounts-grid").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const accountId = Number(button.dataset.id);
  setSelectedAccount(accountId);

  if (button.dataset.action === "history") {
    showSection("history-section");
    await loadHistory(accountId);
  }
});

$$(".nav-item").forEach((button) => {
  button.addEventListener("click", () => showSection(button.dataset.target));
});

window.addEventListener("DOMContentLoaded", async () => {
  await loadAccounts({ silent: true });
  if (state.accounts.length === 0) {
    setApiStatus(true, "API connected · no accounts yet");
  }
});
