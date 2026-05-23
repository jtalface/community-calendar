import { CalendarDays, Car, CircleUserRound, Home, LockKeyhole, UsersRound } from "lucide-react";

const nav = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "children", label: "Children", icon: CircleUserRound },
  { id: "friends", label: "Friend Circles", icon: UsersRound },
  { id: "carpool", label: "Carpool", icon: Car },
  { id: "privacy", label: "Privacy", icon: LockKeyhole }
];

export type NavSection = (typeof nav)[number]["id"];

export function Sidebar({ activeSection, onNavigate }: { activeSection: NavSection; onNavigate: (section: NavSection) => void }) {
  return (
    <aside className="flex gap-2 overflow-x-auto border-b border-ink/10 bg-white/80 p-3 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r lg:p-5">
      <div className="hidden px-2 pb-5 lg:block">
        <p className="text-2xl font-black text-ink">KidCal</p>
        <p className="text-sm text-ink/60">Family activity command center</p>
      </div>
      {nav.map((item) => (
        <button
          aria-current={activeSection === item.id ? "page" : undefined}
          className={`flex min-w-max items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
            activeSection === item.id ? "bg-ink text-white" : "text-ink/70 hover:bg-skywash hover:text-ink"
          }`}
          key={item.label}
          onClick={() => onNavigate(item.id)}
          title={item.label}
          type="button"
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </button>
      ))}
    </aside>
  );
}
