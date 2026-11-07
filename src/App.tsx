import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  LogOut,
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Wallet,
} from "lucide-react";

import { auth } from "./lib/firebase";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import PeopleLoans from "./pages/PeopleLoans";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Login from "./pages/Login";

const mobileMenuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Transactions", icon: ArrowLeftRight },
  { label: "People & Loans", icon: Users },
  { label: "Budgets", icon: Wallet },
];

function App() {
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  function renderPage() {
    switch (currentPage) {
      case "Dashboard":
        return <Dashboard />;

      case "Transactions":
        return <Transactions />;

      case "People & Loans":
        return <PeopleLoans />;

      case "Budgets":
        return <Budgets />;

      default:
        return (
          <main className="min-h-screen rounded-[30px] bg-[#F5F7F2] p-5 md:p-10">
            <h1 className="text-2xl font-bold text-[#263D30] md:text-3xl">
              {currentPage}
            </h1>
            <p className="mt-2 text-[#718074]">
              This page is coming soon.
            </p>
          </main>
        );
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F6F0] text-[#254735]">
        Checking your login...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-transparent">

      {/* Desktop Sidebar */}
      <div className="hidden shrink-0 md:block">
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1 px-3 pb-24 pt-3 md:p-4">

        {/* Top Header */}
        <header className="mb-4 flex min-w-0 items-center justify-between gap-2 px-1 py-2 md:px-3">

          {/* Mobile Logo */}
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#263D30] md:hidden">
            <span>🌿</span>
            MyPurse
          </h2>

          {/* Desktop Spacer */}
          <div className="hidden md:block" />

          {/* User and Sign Out */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="max-w-[120px] truncate text-xs text-[#526757] sm:max-w-48 sm:text-sm">
              {user.displayName || user.email}
            </span>

            <button
              type="button"
              onClick={() => signOut(auth)}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-[#D9E1D7] px-2.5 py-2 text-sm text-[#34513B] transition hover:bg-[#E8EFE5] sm:px-3"
              aria-label="Sign out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Current Page */}
        <div className="min-w-0 w-full">
          {renderPage()}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#D9E1D7] bg-[#F8FAF5]/95 shadow-[0_-4px_15px_rgba(38,61,48,0.06)] backdrop-blur-lg md:hidden"
      >
        <div className="flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)] pt-2">
          {mobileMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.label;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setCurrentPage(item.label)}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-colors ${
                  isActive
                    ? "font-semibold text-[#254735]"
                    : "text-[#8A998B] hover:text-[#34513B]"
                }`}
              >
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />

                <span className="max-w-full truncate text-[10px] sm:text-xs">
                  {item.label === "People & Loans"
                    ? "Loans"
                    : item.label}
                </span>

                {isActive && (
                  <span className="h-1 w-1 rounded-full bg-[#456B4E]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;