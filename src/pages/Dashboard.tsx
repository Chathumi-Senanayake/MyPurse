
import { useEffect, useState } from "react";
import {
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { Transaction } from "../types/transaction";
import { auth } from "../lib/firebase";
import { loadUserData } from "../lib/firestore";

const CATEGORY_COLORS = [
  "#5B9B73",
  "#F2B45F",
  "#A58AD5",
  "#8D9DE8",
  "#4C9ED9",
  "#D77D8A",
  "#8A9A83",
];

function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const now = new Date();
  const hour = now.getHours();

  const greeting =
    hour >= 5 && hour < 12
      ? "Good morning"
      : hour >= 12 && hour < 17
        ? "Good afternoon"
        : "Good evening";

  const userName =
    auth.currentUser?.displayName?.trim().split(/\s+/)[0] || "there";

  // Load transactions from Firestore
  useEffect(() => {
    let active = true;

    async function fetchTransactions() {
      setLoading(true);
      setError("");

      try {
        const data = await loadUserData("transactions");

        if (active) {
          setTransactions(data as Transaction[]);
        }
      } catch (err) {
        console.error("Error loading dashboard transactions:", err);

        if (active) {
          setError(
            "Could not load your financial data. Please check your connection and Firestore rules."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchTransactions();

    return () => {
      active = false;
    };
  }, []);

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter((transaction) => {
    const date = new Date(`${transaction.date}T00:00:00`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const sumAmounts = (items: Transaction[]) =>
    items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalIncome = sumAmounts(
    transactions.filter((item) => item.type === "income")
  );

  const totalExpenses = sumAmounts(
    transactions.filter((item) => item.type === "expense")
  );

  const monthlyIncome = sumAmounts(
    monthlyTransactions.filter((item) => item.type === "income")
  );

  const monthlyExpenses = sumAmounts(
    monthlyTransactions.filter((item) => item.type === "expense")
  );

  const overallBalance = totalIncome - totalExpenses;
  const monthlyNet = monthlyIncome - monthlyExpenses;

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(amount);

  // Spending by category for the current month
  const categoryMap = new Map<string, number>();

  monthlyTransactions
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      const category = item.category || "Other";

      categoryMap.set(
        category,
        (categoryMap.get(category) || 0) + Number(item.amount || 0)
      );
    });

  const categoryData = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage:
        monthlyExpenses > 0
          ? Math.round((amount / monthlyExpenses) * 100)
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Monthly income and expenses for the last six months
  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentYear, currentMonth - 5 + index, 1);

    const monthTransactions = transactions.filter((item) => {
      const transactionDate = new Date(`${item.date}T00:00:00`);

      return (
        !Number.isNaN(transactionDate.getTime()) &&
        transactionDate.getFullYear() === date.getFullYear() &&
        transactionDate.getMonth() === date.getMonth()
      );
    });

    return {
      month: date.toLocaleString("en", { month: "short" }),
      Income: sumAmounts(
        monthTransactions.filter((item) => item.type === "income")
      ),
      Expenses: sumAmounts(
        monthTransactions.filter((item) => item.type === "expense")
      ),
    };
  });

  // Daily income and expenses for every day of the current month
  const daysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const dailyData = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;

    const dayTransactions = monthlyTransactions.filter((item) => {
      const date = new Date(`${item.date}T00:00:00`);
      return date.getDate() === day;
    });

    return {
      day: String(day),
      Income: sumAmounts(
        dayTransactions.filter((item) => item.type === "income")
      ),
      Expenses: sumAmounts(
        dayTransactions.filter((item) => item.type === "expense")
      ),
    };
  });

  const cards = [
    {
      title: "Overall Balance",
      amount: overallBalance,
      description: "All recorded income and expenses",
      icon: Wallet,
      color: "bg-[#E7F0E5] text-[#365B45]",
    },
    {
      title: "Monthly Net",
      amount: monthlyNet,
      description: "Income minus expenses this month",
      icon: Receipt,
      color: "bg-[#F0EBDD] text-[#9A793B]",
    },
    {
      title: "Monthly Income",
      amount: monthlyIncome,
      description: "Income received this month",
      icon: TrendingUp,
      color: "bg-[#E5F2E8] text-[#388052]",
    },
    {
      title: "Monthly Expenses",
      amount: monthlyExpenses,
      description: "Expenses recorded this month",
      icon: TrendingDown,
      color: "bg-[#F8E9E4] text-[#BB6854]",
    },
  ];

  const hasMonthlyExpenses = categoryData.length > 0;

  const hasSixMonthData = monthlyData.some(
    (item) => item.Income > 0 || item.Expenses > 0
  );

  const hasDailyData = dailyData.some(
    (item) => item.Income > 0 || item.Expenses > 0
  );

  const axisFormatter = (value: number) =>
    value >= 1000
      ? `${Number(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
      : String(value);

  return (
    <main className="min-h-screen rounded-[30px] bg-[#F5F7F2]/65 p-5 md:p-7">
      {/* Personalized greeting */}
      <header>
        <p className="text-sm font-medium text-[#718074]">
          {now.toLocaleString("en", {
            month: "long",
            year: "numeric",
          })}
        </p>

        <h1 className="mt-2 text-3xl font-bold text-[#263D30] md:text-4xl">
          {greeting}, {userName}! 🌿
        </h1>

        <p className="mt-2 text-sm text-[#718074]">
          Here's your financial overview for today.
        </p>
      </header>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-sm text-[#718074]">
            Loading your financial data...
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className="rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#718074]">
                      {card.title}
                    </p>

                    <div className={`rounded-xl p-3 ${card.color}`}>
                      <Icon size={20} />
                    </div>
                  </div>

                  <p className="mt-4 break-words text-2xl font-bold text-[#263D30]">
                    {formatMoney(card.amount)}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#879388]">
                    {card.description}
                  </p>
                </article>
              );
            })}
          </section>

          {/* Existing charts */}
          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Spending by Category */}
            <article className="min-w-0 rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:shadow-lg">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-[#263D30]">
                    Spending by Category
                  </h2>
                  <p className="mt-1 text-sm text-[#879388]">
                    How you spent money this month
                  </p>
                </div>

                <span className="rounded-lg border border-[#E4EAE0] px-3 py-2 text-xs text-[#718074]">
                  This Month
                </span>
              </div>

              {hasMonthlyExpenses ? (
                <div className="mt-3 grid grid-cols-1 items-center gap-2 sm:grid-cols-2">
                  <div className="relative mx-auto h-[200px] w-full max-w-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={76}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {categoryData.map((item, index) => (
                            <Cell
                              key={item.name}
                              fill={
                                CATEGORY_COLORS[
                                  index % CATEGORY_COLORS.length
                                ]
                              }
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(value) => formatMoney(Number(value))}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs text-[#718074]">LKR</span>
                      <span className="mt-1 text-xl font-bold text-[#263D30]">
                        {new Intl.NumberFormat("en-LK", {
                          maximumFractionDigits: 0,
                        }).format(monthlyExpenses)}
                      </span>
                      <span className="text-xs text-[#879388]">
                        Total Spent
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {categoryData.map((item, index) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  CATEGORY_COLORS[
                                    index % CATEGORY_COLORS.length
                                  ],
                              }}
                            />
                            <span className="truncate text-[#526457]">
                              {item.name}
                            </span>
                          </div>

                          <span className="shrink-0 font-semibold text-[#263D30]">
                            {item.percentage}%
                          </span>
                        </div>

                        <p className="ml-5 mt-1 text-xs text-[#879388]">
                          {formatMoney(item.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-[220px] flex-col items-center justify-center text-center">
                  <Receipt size={30} className="text-[#A0AEA0]" />
                  <p className="mt-3 font-medium text-[#263D30]">
                    No spending data yet
                  </p>
                  <p className="mt-1 text-sm text-[#879388]">
                    Add expenses to see your category breakdown.
                  </p>
                </div>
              )}
            </article>

            {/* Monthly Income vs Expenses */}
            <article className="min-w-0 rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:shadow-lg">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-[#263D30]">
                    Monthly Income vs Expenses
                  </h2>
                  <p className="mt-1 text-sm text-[#879388]">
                    Compare your finances over six months
                  </p>
                </div>

                <span className="rounded-lg border border-[#E4EAE0] px-3 py-2 text-xs text-[#718074]">
                  Last 6 Months
                </span>
              </div>

              {hasSixMonthData ? (
                <div className="mt-3 h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 8, right: 4, left: -15, bottom: 0 }}
                      barGap={5}
                    >
                      <CartesianGrid
                        stroke="#EDF1E9"
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#718074", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        tick={{ fill: "#879388", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={axisFormatter}
                      />

                      <Tooltip
                        formatter={(value) => formatMoney(Number(value))}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #E4EAE0",
                          fontSize: "12px",
                        }}
                      />

                      <Legend
                        wrapperStyle={{
                          fontSize: "12px",
                          paddingTop: "8px",
                        }}
                      />

                      <Bar
                        dataKey="Income"
                        fill="#62A77B"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                      />

                      <Bar
                        dataKey="Expenses"
                        fill="#E98282"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[220px] flex-col items-center justify-center text-center">
                  <TrendingUp size={30} className="text-[#A0AEA0]" />
                  <p className="mt-3 font-medium text-[#263D30]">
                    No monthly data yet
                  </p>
                  <p className="mt-1 text-sm text-[#879388]">
                    Record income or expenses to see your chart.
                  </p>
                </div>
              )}
            </article>
          </section>

          {/* NEW: Full-width Daily Income vs Expenses */}
          <section className="mt-6 w-full">
            <article className="w-full rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:shadow-lg md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-[#263D30]">
                    Daily Income vs Expenses
                  </h2>
                  <p className="mt-1 text-sm text-[#879388]">
                    Track your money day by day this month
                  </p>
                </div>

                <span className="rounded-lg border border-[#E4EAE0] px-3 py-2 text-xs text-[#718074]">
                  {now.toLocaleString("en", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {hasDailyData ? (
                <div className="mt-5 h-[320px] w-full md:h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dailyData}
                      margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
                      barGap={2}
                    >
                      <CartesianGrid
                        stroke="#EDF1E9"
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="day"
                        interval={daysInMonth > 20 ? 2 : 0}
                        tick={{ fill: "#718074", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        label={{
                          value: "Day of Month",
                          position: "insideBottom",
                          offset: -2,
                          fill: "#879388",
                          fontSize: 12,
                        }}
                      />

                      <YAxis
                        tick={{ fill: "#879388", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={axisFormatter}
                        width={48}
                      />

                      <Tooltip
                        labelFormatter={(value) => `Day ${value}`}
                        formatter={(value) => formatMoney(Number(value))}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #E4EAE0",
                          fontSize: "12px",
                        }}
                      />

                      <Legend
                        wrapperStyle={{
                          fontSize: "12px",
                          paddingTop: "12px",
                        }}
                      />

                      <Bar
                        dataKey="Income"
                        fill="#62A77B"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={18}
                      />

                      <Bar
                        dataKey="Expenses"
                        fill="#E98282"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[280px] flex-col items-center justify-center text-center">
                  <TrendingUp size={30} className="text-[#A0AEA0]" />
                  <p className="mt-3 font-medium text-[#263D30]">
                    No daily data yet
                  </p>
                  <p className="mt-1 text-sm text-[#879388]">
                    Record income or expenses this month to see your daily chart.
                  </p>
                </div>
              )}
            </article>
          </section>

          {/* Footer */}
          <p className="mt-4 px-1 text-xs leading-5 text-[#879388]">
            Figures are calculated from transactions recorded in MyPurse.
            Your actual bank balance may be different.
          </p>
        </>
      )}
    </main>
  );
}

export default Dashboard;
