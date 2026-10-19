
import { useEffect, useState } from "react";
import {
  Trash2,
  TrendingUp,
  TrendingDown,
  Receipt,
  PlusCircle,
} from "lucide-react";
import type { FormEvent } from "react";
import type { Transaction } from "../types/transaction";
import {
  saveUserData,
  loadUserData,
  deleteUserData,
} from "../lib/firestore";

function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState("all");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load transactions from Firestore for the signed-in user
  useEffect(() => {
    let active = true;

    async function fetchTransactions() {
      setLoading(true);

      try {
        const data = await loadUserData("transactions");

        if (active) {
          setTransactions(data as Transaction[]);
        }
      } catch (error) {
        console.error("Error loading transactions:", error);

        if (active) {
          setMessage(
            "Could not load transactions. Check your login and Firestore rules."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchTransactions();

    return () => {
      active = false;
    };
  }, []);

  // Add a transaction to Firestore
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const numericAmount = Number(amount);

    if (
      !title.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !date
    ) {
      setMessage("Enter a title, a valid date, and an amount greater than zero.");
      return;
    }

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      title: title.trim(),
      amount: numericAmount,
      type,
      category,
      date,
    };

    setSaving(true);

    try {
      await saveUserData(
        "transactions",
        newTransaction.id,
        newTransaction as unknown as Record<string, unknown>
      );

      setTransactions((previous) => [...previous, newTransaction]);

      setTitle("");
      setAmount("");
      setType("expense");
      setCategory("Food");
      setDate(new Date().toISOString().split("T")[0]);

      setMessage("Transaction saved successfully!");
    } catch (error) {
      console.error("Error saving transaction:", error);
      setMessage(
        "Could not save transaction. Check your internet connection and Firestore rules."
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete a transaction from Firestore
  async function deleteTransaction(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    setMessage("");

    try {
      await deleteUserData("transactions", id);

      setTransactions((previous) =>
        previous.filter((item) => item.id !== id)
      );

      setMessage("Transaction deleted successfully!");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setMessage("Could not delete the transaction.");
    }
  }

  const filteredTransactions = transactions
    .filter((item) => filter === "all" || item.type === filter)
    .sort(
      (a, b) =>
        new Date(`${b.date}T00:00:00`).getTime() -
        new Date(`${a.date}T00:00:00`).getTime()
    );

  const totalIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalExpenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 2,
    }).format(value);

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-[#E0E7DD] bg-white px-3 py-2.5 text-sm text-[#263D30] outline-none focus:border-[#5B8967]";

  return (
    <main className="min-h-screen rounded-[30px] bg-[#F5F7F2]/65 p-4 md:p-6">
      <header className="mb-6">
        <p className="text-sm text-[#718074]">MyPurse / Finance</p>

        <h1 className="mt-1 text-3xl font-bold text-[#263D30]">
          Transactions
        </h1>

        <p className="mt-1 text-sm text-[#718074]">
          Record and manage your income and expenses.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Add transaction form */}
        <section className="rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg">
          <div className="flex items-center gap-2">
            <PlusCircle size={21} className="text-[#365B45]" />

            <h2 className="text-lg font-bold text-[#263D30]">
              Add Transaction
            </h2>
          </div>

          <p className="mt-1 text-sm text-[#718074]">
            Enter a new financial record.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-[#35483A]">
                Transaction Title
              </label>

              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Lunch, Salary"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#35483A]">
                Amount (LKR)
              </label>

              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#35483A]">
                Transaction Type
              </label>

              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as "income" | "expense")
                }
                className={inputClass}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#35483A]">
                Category
              </label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={inputClass}
              >
                <option>Food</option>
                <option>Transport</option>
                <option>Education</option>
                <option>Shopping</option>
                <option>Salary</option>
                <option>Allowance</option>
                <option>Bills</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#35483A]">
                Date
              </label>

              <input
                required
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={inputClass}
              />
            </div>

            {message && (
              <p
                role="status"
                className={`text-sm ${
                  message.startsWith("Could not")
                    ? "text-red-600"
                    : "text-[#365B45]"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || loading}
              className="w-full rounded-xl bg-[#365B45] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#294735] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Transaction"}
            </button>
          </form>
        </section>

        {/* Transaction list */}
        <section className="min-w-0 rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#263D30]">
                All Transactions
              </h2>

              <p className="mt-1 text-sm text-[#718074]">
                {loading
                  ? "Loading transactions..."
                  : `${filteredTransactions.length} transaction(s)`}
              </p>
            </div>

            <select
              aria-label="Filter transactions"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-[#E0E7DD] bg-white px-3 py-2 text-sm text-[#263D30] outline-none focus:border-[#5B8967]"
            >
              <option value="all">All Transactions</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>
          </div>

          {/* Totals */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#EFF7F0] p-3 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg">
              <div className="flex items-center gap-2 text-sm text-[#388052]">
                <TrendingUp size={17} />
                Total Income
              </div>

              <p className="mt-2 break-words text-lg font-bold text-[#263D30]">
                {formatMoney(totalIncome)}
              </p>
            </div>

            <div className="rounded-xl bg-[#FCF0ED] p-3 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg">
              <div className="flex items-center gap-2 text-sm text-[#BB6854]">
                <TrendingDown size={17} />
                Total Expenses
              </div>

              <p className="mt-2 break-words text-lg font-bold text-[#263D30]">
                {formatMoney(totalExpenses)}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-[#718074]">
              Loading your transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
              <Receipt size={32} className="text-[#A0AEA0]" />

              <p className="mt-3 font-medium text-[#263D30]">
                No transactions found
              </p>

              <p className="mt-1 text-sm text-[#718074]">
                Add a transaction using the form on the left.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {filteredTransactions.map((transaction) => (
                <article
                  key={transaction.id}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[#EEF1EB] p-3 transition-all duration-300 ease-out hover:scale-[1.01] hover:bg-[#FAFBF8] hover:shadow-md"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        transaction.type === "income"
                          ? "bg-[#E5F2E8] text-[#388052]"
                          : "bg-[#F8E9E4] text-[#BB6854]"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp size={19} />
                      ) : (
                        <TrendingDown size={19} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#263D30]">
                        {transaction.title}
                      </p>

                      <p className="mt-1 text-xs text-[#879388]">
                        {transaction.category} · {transaction.date}
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          transaction.type === "income"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "Income" : "Expense"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <p
                      className={`text-right text-sm font-bold ${
                        transaction.type === "income"
                          ? "text-green-700"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatMoney(transaction.amount)}
                    </p>

                    <button
                      type="button"
                      onClick={() => deleteTransaction(transaction.id)}
                      aria-label={`Delete ${transaction.title}`}
                      title="Delete transaction"
                      className="rounded-lg p-2 text-[#879388] transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Transactions;
