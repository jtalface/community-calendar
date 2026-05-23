import { AlertTriangle, CalendarPlus, CarFront, Download, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "./components/Badge";
import { QuickAddActivity } from "./components/QuickAddActivity";
import { NavSection, Sidebar } from "./components/Sidebar";
import { WeeklyCalendar } from "./components/WeeklyCalendar";
import { api, calendarExportUrl, login } from "./lib/api";
import { fallbackDashboard } from "./lib/mockData";

type Dashboard = typeof fallbackDashboard;

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message === "[object Object]" ? "API unavailable" : error.message;
  if (typeof error === "string") return error;
  return "API unavailable";
}

function App() {
  const [dashboard, setDashboard] = useState<Dashboard>(fallbackDashboard);
  const [status, setStatus] = useState("Loading seeded demo data");
  const [usingFallback, setUsingFallback] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");

  const loadDashboard = useCallback(async () => {
    try {
      if (!localStorage.getItem("kidcal_token")) await login();
      const data = await api<Dashboard>("/dashboard");
      setDashboard(data);
      setStatus("Connected to local API");
      setUsingFallback(false);
    } catch (error) {
      setStatus(`Using UI demo data: ${errorMessage(error)}`);
      setUsingFallback(true);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  function navigateTo(section: NavSection) {
    setActiveSection(section);
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-[#f7f3ec] text-ink lg:flex">
      <Sidebar activeSection={activeSection} onNavigate={navigateTo} />
      <main className="w-full p-4 sm:p-6 lg:p-8">
        <header id="dashboard" className="scroll-mt-5 mb-6 flex flex-col gap-4 rounded-md border border-ink/10 bg-white p-5 shadow-soft md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone={usingFallback ? "yellow" : "green"}>{status}</Badge>
              <Badge tone="gray"><ShieldCheck size={12} /> Private by default</Badge>
            </div>
            <h1 className="text-3xl font-black tracking-normal sm:text-4xl">Family activity calendar</h1>
            <p className="mt-2 max-w-3xl text-ink/65">Coordinate camps, classes, friend plans, pickup conflicts, and carpools from one shared family view.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-bold" href={calendarExportUrl("family")}>
              <Download size={16} /> Family ICS
            </a>
            <a className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-bold" href={calendarExportUrl("carpool")}>
              <Download size={16} /> Carpool ICS
            </a>
          </div>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-sm text-ink/60">Children</p>
            <p className="mt-1 text-3xl font-black">{dashboard.children.length}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-sm text-ink/60">This week</p>
            <p className="mt-1 text-3xl font-black">{dashboard.activities.length}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-sm text-ink/60">Conflicts</p>
            <p className="mt-1 text-3xl font-black text-[#b84a2f]">{dashboard.conflicts.length}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-sm text-ink/60">Open carpool seats</p>
            <p className="mt-1 text-3xl font-black text-leaf">{dashboard.carpoolOffers.reduce((total, offer) => total + offer.remainingSeats, 0)}</p>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div id="calendar" className="scroll-mt-5">
            <WeeklyCalendar activities={dashboard.activities} children={dashboard.children} onChanged={loadDashboard} />
          </div>
          <div className="space-y-6">
            <QuickAddActivity children={dashboard.children} onCreated={loadDashboard} />

            <section id="carpool" className="scroll-mt-5 rounded-md border border-ink/10 bg-white p-4 shadow-soft">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="text-peach" size={19} />
                <h2 className="text-lg font-black">Upcoming Conflicts</h2>
              </div>
              <div className="space-y-2">
                {dashboard.conflicts.length ? dashboard.conflicts.map((conflict) => (
                  <div className="rounded-md border border-peach/25 bg-peach/10 p-3" key={conflict.id}>
                    <p className="font-bold">{conflict.title}</p>
                    <p className="text-sm text-ink/65">{conflict.message}</p>
                  </div>
                )) : <p className="rounded-md border border-dashed border-ink/15 p-3 text-sm text-ink/50">No pickup or work conflicts detected.</p>}
              </div>
            </section>

            <section id="friends" className="scroll-mt-5 rounded-md border border-ink/10 bg-white p-4 shadow-soft">
              <div className="mb-3 flex items-center gap-2">
                <CarFront className="text-leaf" size={19} />
                <h2 className="text-lg font-black">Carpool Options</h2>
              </div>
              <div className="space-y-2">
                {dashboard.carpoolOffers.map((offer) => (
                  <div className="rounded-md border border-ink/10 p-3" key={offer.id}>
                    <p className="font-bold">{offer.session.activity.title}</p>
                    <p className="text-sm text-ink/65">{offer.driver.name} can help with {offer.direction}.</p>
                    <div className="mt-2"><Badge tone="green">{offer.remainingSeats} seats available</Badge></div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
              <div className="mb-3 flex items-center gap-2">
                <UsersRound className="text-[#3f72a7]" size={19} />
                <h2 className="text-lg font-black">Friends Also Attending</h2>
              </div>
              <div className="space-y-2">
                {dashboard.friendsAttending.map((item) => (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-ink/10 p-3" key={`${item.childName}-${item.activityTitle}`}>
                    <div>
                      <p className="font-bold">{item.childName}</p>
                      <p className="text-sm text-ink/65">{item.activityTitle}</p>
                    </div>
                    <Badge>{item.visibility.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section id="children" className="scroll-mt-5 mt-6 grid gap-4 md:grid-cols-3">
          {dashboard.children.map((child) => (
            <div className="rounded-md border border-ink/10 bg-white p-4" key={child.id}>
              <div className="mb-3 flex items-center gap-2">
                <CalendarPlus size={18} />
                <h2 className="font-black">{child.name}</h2>
              </div>
              <p className="text-sm text-ink/65">{child.grade} at {child.school}</p>
              <a className="mt-3 inline-flex items-center gap-2 rounded-md border border-ink/15 px-3 py-2 text-sm font-bold" href={calendarExportUrl("child", child.id)}>
                <Download size={15} /> Child ICS
              </a>
            </div>
          ))}
        </section>

        <section id="privacy" className="scroll-mt-5 mt-6 rounded-md border border-ink/10 bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <LockKeyhole className="text-leaf" size={19} />
            <h2 className="text-lg font-black">Privacy</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-ink/10 p-3">
              <p className="font-bold">Private by default</p>
              <p className="mt-1 text-sm text-ink/60">New child profiles and family-only activities stay inside the household.</p>
            </div>
            <div className="rounded-md border border-ink/10 p-3">
              <p className="font-bold">Shared intentionally</p>
              <p className="mt-1 text-sm text-ink/60">Friend and class visibility only shares attendance, not private notes or addresses.</p>
            </div>
            <div className="rounded-md border border-ink/10 p-3">
              <p className="font-bold">Caregiver ready</p>
              <p className="mt-1 text-sm text-ink/60">Family roles are modeled for owners, co-parents, caregivers, and viewers.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
