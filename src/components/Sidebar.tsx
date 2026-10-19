
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Users,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Transactions", icon: ArrowLeftRight },
  { label: "People & Loans", icon: Users },
  { label: "Budgets", icon: Wallet },
];

type SidebarProps = {
  currentPage: string;
  onPageChange: (page: string) => void;
};

function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  return (
    <aside className="sticky top-0 relative flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-[#C1D0C0]">

      {/* Sage to forest-green background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#E2E9DE] via-[#B6C7B4] to-[#254735]" />

      {/* Bottom savings image */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[390px] overflow-hidden">
        <img
          src="/sidebar-save.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_65%]"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 42%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 42%, black 100%)",
          }}
        />

        {/* Green image shading */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#254735]/30 to-[#142B1E]/90" />
      </div>

      {/* Sidebar content */}
      <div className="relative z-10 flex h-full flex-col p-5">

        {/* Logo */}
        <h2 className="mb-10 flex items-center gap-2 px-2 text-2xl font-bold tracking-tight text-[#263D30]">
          <span className="text-xl">🌿</span>
          MyPurse
        </h2>

        {/* Navigation */}
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.label;

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => onPageChange(item.label)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left
                      transition-all duration-200 ease-out
                      hover:scale-[1.03] hover:shadow-md
                      active:scale-[0.97]
                      ${
                        isActive
                          ? "bg-[#BFD5BD] font-semibold text-[#21442E] shadow-sm"
                          : "text-[#435D49] hover:bg-white/40 hover:text-[#203E2B]"
                      }`}
                  >
                    <Icon
                      size={20}
                      strokeWidth={2}
                      className="transition-transform duration-200 group-hover:scale-110"
                    />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom tagline */}
        <div className="mt-auto pt-4 text-sm text-white">
          <p className="font-semibold">Your Money,</p>
          <p className="mt-1 flex items-center gap-2">
            Your Control <span>🌱</span>
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
