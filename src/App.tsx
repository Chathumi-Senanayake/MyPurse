
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { LogOut } from "lucide-react";
import { auth, firebaseConfigured } from "./lib/firebase";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import PeopleLoans from "./pages/PeopleLoans";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Login from "./pages/Login";

function App() {
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!auth) {
      setCheckingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  if (!firebaseConfigured || !auth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F6F0] p-6">
        <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-3xl font-bold text-[#254735]">MyPurse needs setup</h1>
          <p className="mt-4 leading-7 text-[#526757]">
            Add the Firebase environment variables to this Vercel project, then redeploy to enable sign-in and your dashboard.
          </p>
        </section>
      </main>
    );
  }

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
          <main className="min-h-screen rounded-[30px] bg-[#F5F7F2] p-8 md:p-10">
            <h1 className="text-3xl font-bold text-[#263D30]">
              {currentPage}
            </h1>
            <p className="mt-2 text-[#718074]">This page is coming soon.</p>
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
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      <div className="min-w-0 flex-1 p-3">
        <div className="mb-3 flex items-center justify-end gap-3 px-3 py-2">
          <span className="max-w-48 truncate text-sm text-[#526757]">
            {user.displayName || user.email}
          </span>
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 rounded-xl border border-[#D9E1D7] px-3 py-2 text-sm text-[#34513B] transition hover:bg-[#E8EFE5]"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>

        {renderPage()}
      </div>
    </div>
  );
}

export default App;
