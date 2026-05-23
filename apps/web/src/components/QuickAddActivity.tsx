import { Plus, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";

const categories = [
  "camp",
  "sports",
  "school",
  "music",
  "stem",
  "art",
  "playdate",
  "doctor",
  "travel",
  "other"
];

const visibilityOptions = [
  { label: "Family only", value: "family" },
  { label: "Selected parents", value: "selected_parents" },
  { label: "Friend group", value: "friend_group" },
  { label: "Class group", value: "class_group" },
  { label: "School group", value: "school_group" },
  { label: "Public listing", value: "public_listing" }
];

interface Child {
  id: string;
  name: string;
}

function defaultDateTime(hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return toDateTimeLocal(date);
}

function toDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function QuickAddActivity({ children, onCreated }: { children: Child[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [childId, setChildId] = useState(children[0]?.id ?? "");
  const [startsAt, setStartsAt] = useState(defaultDateTime(15));
  const [endsAt, setEndsAt] = useState(defaultDateTime(16));
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("other");
  const [visibility, setVisibility] = useState("family");
  const [provider, setProvider] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!children.length) {
      setChildId("");
      return;
    }

    const selectedChildStillExists = children.some((child) => child.id === childId);
    if (!selectedChildStillExists) {
      setChildId(children[0].id);
    }
  }, [childId, children]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!title || !childId || !startsAt || !endsAt || !location) return;

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    if (endDate <= startDate) {
      setError("End time must be after start time.");
      return;
    }

    setSaving(true);
    try {
      await api("/activities", {
        method: "POST",
        body: JSON.stringify({
          title,
          childIds: [childId],
          startsAt: startDate.toISOString(),
          endsAt: endDate.toISOString(),
          location,
          category,
          visibility,
          provider: provider || undefined,
          registrationLink,
          notes
        })
      });
      setTitle("");
      setLocation("");
      setProvider("");
      setRegistrationLink("");
      setNotes("");
      setOpen(false);
      onCreated();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create activity.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-leaf px-4 py-3 font-bold text-white disabled:opacity-60"
          disabled={!children.length}
          onClick={() => setOpen(true)}
          type="button"
        >
          <Plus size={18} />
          Add Activity
        </button>
      </section>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4">
          <form className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-md bg-white p-5 shadow-soft" onSubmit={submit}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Create Activity</h2>
              <button className="rounded-md p-2 text-ink/60 hover:bg-skywash hover:text-ink" onClick={() => setOpen(false)} title="Close" type="button">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-3">
              <input
                className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Activity title"
                required
                value={title}
              />
              <select className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf" onChange={(event) => setChildId(event.target.value)} required value={childId}>
                {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
              </select>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-bold uppercase text-ink/55">
                  Starts
                  <input
                    className="rounded-md border border-ink/15 px-3 py-2 text-sm font-normal normal-case text-ink outline-none focus:border-leaf"
                    onChange={(event) => setStartsAt(event.target.value)}
                    required
                    type="datetime-local"
                    value={startsAt}
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase text-ink/55">
                  Ends
                  <input
                    className="rounded-md border border-ink/15 px-3 py-2 text-sm font-normal normal-case text-ink outline-none focus:border-leaf"
                    onChange={(event) => setEndsAt(event.target.value)}
                    required
                    type="datetime-local"
                    value={endsAt}
                  />
                </label>
              </div>
              <input
                className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf"
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Location"
                required
                value={location}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf" onChange={(event) => setCategory(event.target.value)} value={category}>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf" onChange={(event) => setVisibility(event.target.value)} value={visibility}>
                  {visibilityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <input
                className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf"
                onChange={(event) => setProvider(event.target.value)}
                placeholder="Provider or organizer"
                value={provider}
              />
              <input
                className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf"
                onChange={(event) => setRegistrationLink(event.target.value)}
                placeholder="Registration link"
                type="url"
                value={registrationLink}
              />
              <textarea
                className="min-h-24 resize-y rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf"
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Notes"
                value={notes}
              />
              {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
              <div className="flex flex-wrap justify-end gap-2">
                <button className="rounded-md border border-ink/15 px-4 py-2 font-bold text-ink/70 hover:bg-skywash" onClick={() => setOpen(false)} type="button">Cancel</button>
                <button className="inline-flex items-center justify-center gap-2 rounded-md bg-leaf px-4 py-2 font-bold text-white disabled:opacity-60" disabled={saving || !children.length}>
                  <Plus size={18} />
                  {saving ? "Adding" : "Add Activity"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
