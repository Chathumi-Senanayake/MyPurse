
import { useEffect, useState } from "react";
import {
  Wallet,
  PlusCircle,
  Trash2,
  TrendingUp,
  CircleCheck,
  AlertTriangle,
} from "lucide-react";
import type { FormEvent } from "react";
import type { Transaction } from "../types/transaction";
import {
  loadUserData,
  saveUserData,
  deleteUserData,
} from "../lib/firestore";

type Budget = {
  id: string;
  category: string;
  limit: number;
};

const categories = [
  "Food",
  "Transport",
  "Education",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
];

const progressColors = [
  "bg-[#5B9B73]",
  "bg-[#E9AF5A]",
  "bg-[#9A88D5]",
  "bg-[#6D9FD1]",
  "bg-[#D77D8A]",
];

function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [category, setCategory] = useState("Food");
  const [limit, setLimit] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      const [savedBudgets, savedTransactions] = await Promise.all([
        loadUserData("budgets"),
        loadUserData("transactions"),
      ]);

      setBudgets(savedBudgets as Budget[]);
      setTransactions(savedTransactions as Transaction[]);
    } catch (error) {
      console.error("Error loading budget data:", error);
      setMessage(
        "Could not load your data. Check your sign-in and Firestore rules."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleAddBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const numericLimit = Number(limit);

    if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
      setMessage("Please enter a budget amount greater than zero.");
      return;
    }

    const existing = budgets.find(
      (budget) => budget.category === category
    );

    if (existing) {
      setMessage(
        `${category} already has a budget. Delete the existing one first to create a new budget.`
      );
      return;
    }

    const newBudget: Budget = {
      id: crypto.randomUUID(),
      category,
      limit: numericLimit,
    };

    setSaving(true);

    try {
      await saveUserData(
        "budgets",
        newBudget.id,
        newBudget as unknown as Record<string, unknown>
      );

      setBudgets((current) => [...current, newBudget]);
      setLimit("");
      setMessage("Budget added successfully!");
    } catch (error) {
      console.error("Error saving budget:", error);
      setMessage("Could not save your budget. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBudget(id: string) {
    if (!window.confirm("Delete this budget?")) return;

    setMessage("");
    setSaving(true);

    try {
      await deleteUserData("budgets", id);
      setBudgets((current) =>
        current.filter((budget) => budget.id !== id)
      );
      setMessage("Budget deleted successfully!");
    } catch (error) {
      console.error("Error deleting budget:", error);
      setMessage("Could not delete this budget. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const now = new Date();

  const monthlyExpenses = transactions.filter((transaction) => {
    const date = new Date(`${transaction.date}T00:00:00`);

    return (
      transaction.type === "expense" &&
      !Number.isNaN(date.getTime()) &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  function getSpent(categoryName: string) {
    return monthlyExpenses
      .filter((transaction) => transaction.category === categoryName)
      .reduce(
        (total, transaction) => total + Number(transaction.amount || 0),
        0
      );
  }

  const totalBudget = budgets.reduce(
    (total, budget) => total + Number(budget.limit || 0),
    0
  );

  const totalBudgetSpent = budgets.reduce(
    (total, budget) => total + getSpent(budget.category),
    0
  );

  const totalRemaining = totalBudget - totalBudgetSpent;

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 2,
    }).format(amount);

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-[#E0E7DD] bg-white px-3 py-3 text-sm text-[#263D30] outline-none focus:border-[#5B8967]";

  return (
    <main className="min-h-screen rounded-[30px] bg-[#F5F7F2]/65 p-5 md:p-7">
      <header>
        <p className="text-sm text-[#718074]">
          {now.toLocaleString("en", {
            month: "long",
            year: "numeric",
          })}
        </p>

        <h1 className="mt-1 text-3xl font-bold text-[#263D30]">
          Budgets
        </h1>

        <p className="mt-2 text-sm text-[#718074]">
          Plan your spending and stay in control of your money.
        </p>
      </header>

      {message && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-white p-3 text-sm text-[#365B45]"
        >
          {message}
        </p>
      )}

      {loading ? (
        <div className="mt-8 rounded-2xl bg-white p-10 text-center text-[#718074]">
          Loading your budgets...
        </div>
      ) : (
        <>
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
              <div className="flex items-center gap-3 text-[#718074]">
                <Wallet size={20} />
                <span className="text-sm font-medium">Total Budget</span>
              </div>
              <p className="mt-4 text-2xl font-bold text-[#263D30]">
                {formatMoney(totalBudget)}
              </p>
              <p className="mt-2 text-xs text-[#879388]">
                Combined monthly limits
              </p>
            </article>

            <article className="rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
              <div className="flex items-center gap-3 text-[#BB6854]">
                <TrendingUp size={20} />
                <span className="text-sm font-medium">
                  Spent Against Budgets
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold text-[#263D30]">
                {formatMoney(totalBudgetSpent)}
              </p>
              <p className="mt-2 text-xs text-[#879388]">
                Spending in budgeted categories this month
              </p>
            </article>

            <article className="rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
              <div className="flex items-center gap-3 text-[#388052]">
                <CircleCheck size={20} />
                <span className="text-sm font-medium">
                  Budget Remaining
                </span>
              </div>
              <p
                className={`mt-4 text-2xl font-bold ${
                  totalRemaining < 0 ? "text-red-600" : "text-[#263D30]"
                }`}
              >
                {formatMoney(totalRemaining)}
              </p>
              <p className="mt-2 text-xs text-[#879388]">
                {totalRemaining < 0
                  ? "You have exceeded your combined limits"
                  : "Available within your budget limits"}
              </p>
            </article>
          </section>

          <section className="mt-6 rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg md:p-6">
            <div className="flex items-center gap-2">
              <PlusCircle size={21} className="text-[#365B45]" />
              <h2 className="text-lg font-bold text-[#263D30]">
                Create a Monthly Budget
              </h2>
            </div>

            <form
              onSubmit={handleAddBudget}
              className="mt-4 grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <label className="text-sm font-medium text-[#35483A]">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={inputClass}
                  disabled={saving}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-[#35483A]">
                  Monthly Limit (LKR)
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={limit}
                  onChange={(event) => setLimit(event.target.value)}
                  placeholder="e.g. 15000"
                  className={inputClass}
                  disabled={saving}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#365B45] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#294735] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Add Budget"}
              </button>
            </form>
          </section>

          <section className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#263D30]">
                  Your Monthly Budgets
                </h2>
                <p className="mt-1 text-sm text-[#718074]">
                  Spending progress for each category
                </p>
              </div>

              <span className="rounded-lg bg-white px-3 py-2 text-sm text-[#718074]">
                {budgets.length} {budgets.length === 1 ? "budget" : "budgets"}
              </span>
            </div>

            {budgets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#CCD8C9] bg-white p-10 text-center">
                <Wallet size={38} className="mx-auto text-[#9BAC9A]" />
                <h3 className="mt-3 font-semibold text-[#263D30]">
                  No budgets created yet
                </h3>
                <p className="mt-2 text-sm text-[#718074]">
                  Create your first monthly budget using the form above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {budgets.map((budget, index) => {
                  const spent = getSpent(budget.category);
                  const remaining = budget.limit - spent;
                  const percentage = (spent / budget.limit) * 100;
                  const progress = Math.min(percentage, 100);
                  const exceeded = spent > budget.limit;

                  return (
                    <article
                      key={budget.id}
                      className="rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-[#263D30]">
                            {budget.category}
                          </p>
                          <p className="mt-1 text-sm text-[#718074]">
                            Monthly spending limit
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => void deleteBudget(budget.id)}
                          disabled={saving}
                          title="Delete budget"
                          aria-label={`Delete ${budget.category} budget`}
                          className="rounded-lg p-2 text-[#879388] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs text-[#879388]">Spent</p>
                          <p className="mt-1 text-xl font-bold text-[#263D30]">
                            {formatMoney(spent)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-[#879388]">
                            Budget limit
                          </p>
                          <p className="mt-1 font-semibold text-[#526457]">
                            {formatMoney(budget.limit)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#EDF1E9]">
                        <div
                          className={`h-full rounded-full transition-all ${
                            exceeded
                              ? "bg-red-500"
                              : progressColors[index % progressColors.length]
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <span
                          className={
                            exceeded
                              ? "font-medium text-red-600"
                              : "text-[#718074]"
                          }
                        >
                          {Math.round(percentage)}% used
                        </span>

                        <span
                          className={`text-right font-semibold ${
                            exceeded ? "text-red-600" : "text-[#365B45]"
                          }`}
                        >
                          {exceeded
                            ? `${formatMoney(Math.abs(remaining))} over budget`
                            : `${formatMoney(remaining)} left`}
                        </span>
                      </div>

                      {exceeded && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                          <AlertTriangle size={17} />
                          You've exceeded this category's budget.
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <p className="mt-5 text-xs leading-5 text-[#879388]">
            Budget progress is calculated from expenses recorded in MyPurse
            during the current month. Only categories with a budget are
            included in the budget summary.
          </p>
        </>
      )}
    </main>
  );
}

export default Budgets;
