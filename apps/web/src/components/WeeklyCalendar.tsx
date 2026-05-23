import { AlertTriangle, CarFront, LockKeyhole, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { api } from "../lib/api";
import { Badge } from "./Badge";

const categories = ["camp", "sports", "school", "music", "stem", "art", "playdate", "doctor", "travel", "other"];

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

interface Activity {
  id: string;
  title: string;
  location: string;
  category: string;
  provider?: string | null;
  registrationLink?: string | null;
  notes?: string | null;
  visibility: string;
  attendances: Array<{ childId?: string; child: { id?: string; name: string } }>;
  sessions: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    conflicts: unknown[];
    carpoolOffers: Array<{ seats: number; rides: Array<{ status: string }> }>;
  }>;
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function daysOfWeek() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function timeRange(session: Activity["sessions"][number]) {
  return `${new Date(session.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${new Date(session.endsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

export function WeeklyCalendar({
  activities,
  children,
  onChanged
}: {
  activities: Activity[];
  children: Child[];
  onChanged: () => void;
}) {
  const days = daysOfWeek();
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [openActionsId, setOpenActionsId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  async function deleteActivity(activity: Activity) {
    setDeletingId(activity.id);
    try {
      await api(`/activities/${activity.id}`, { method: "DELETE" });
      setOpenActionsId("");
      onChanged();
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Weekly Family View</h2>
          <p className="text-sm text-ink/60">Activities, conflicts, carpools, and privacy at a glance.</p>
        </div>
        <Badge tone="green">{activities.length} activities</Badge>
      </div>
      <div className="calendar-grid grid gap-3 overflow-x-auto">
        {days.map((day) => {
          const dayActivities = activities.filter((activity) => activity.sessions.some((session) => sameDay(new Date(session.startsAt), day)));
          return (
            <div className="min-h-48 rounded-md border border-ink/10 bg-[#fbfaf6] p-3" key={day.toISOString()}>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-bold">{day.toLocaleDateString([], { weekday: "short" })}</p>
                <p className="text-sm text-ink/50">{day.getDate()}</p>
              </div>
              <div className="space-y-2">
                {dayActivities.length === 0 ? (
                  <p className="rounded-md border border-dashed border-ink/15 p-3 text-sm text-ink/45">Open day</p>
                ) : dayActivities.map((activity) => {
                  const session = activity.sessions.find((candidate) => sameDay(new Date(candidate.startsAt), day))!;
                  const seats = session.carpoolOffers.reduce((total, offer) => total + offer.seats - offer.rides.filter((ride) => ride.status === "approved").length, 0);
                  return (
                    <article className="relative rounded-md border border-ink/10 bg-white p-3" key={activity.id}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-black">{activity.title}</h3>
                          <p className="text-xs text-ink/60">{timeRange(session)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {session.conflicts.length > 0 && <AlertTriangle className="text-peach" size={18} />}
                          <button
                            className="rounded-md p-1.5 text-ink/55 hover:bg-skywash hover:text-ink"
                            onClick={() => setOpenActionsId(openActionsId === activity.id ? "" : activity.id)}
                            title={`More options for ${activity.title}`}
                            type="button"
                          >
                            <MoreHorizontal size={17} />
                          </button>
                        </div>
                      </div>
                      {openActionsId === activity.id && (
                        <ActivityActionsPopover
                          activity={activity}
                          deleting={deletingId === activity.id}
                          onClose={() => setOpenActionsId("")}
                          onDelete={() => void deleteActivity(activity)}
                          onEdit={() => {
                            setEditingActivity(activity);
                            setOpenActionsId("");
                          }}
                        />
                      )}
                      <p className="mt-2 text-xs text-ink/60">{activity.location}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge>{activity.attendances.map((attendance) => attendance.child.name).join(", ")}</Badge>
                        <Badge tone="yellow"><LockKeyhole size={12} /> {activity.visibility.replace("_", " ")}</Badge>
                        {seats > 0 && <Badge tone="green"><CarFront size={12} /> {seats} seats</Badge>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {editingActivity && (
        <EditActivityDialog
          activity={editingActivity}
          children={children}
          onClose={() => setEditingActivity(null)}
          onSaved={() => {
            setEditingActivity(null);
            onChanged();
          }}
        />
      )}
    </section>
  );
}

function ActivityActionsPopover({
  activity,
  deleting,
  onClose,
  onDelete,
  onEdit
}: {
  activity: Activity;
  deleting: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="absolute right-2 top-10 z-30 w-44 rounded-md border border-ink/10 bg-white p-1.5 shadow-soft" role="dialog" aria-label={`Options for ${activity.title}`}>
      <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-skywash" onClick={onEdit} type="button">
        <Pencil size={16} />
        Edit
      </button>
      <button
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
        disabled={deleting}
        onClick={onDelete}
        type="button"
      >
        <Trash2 size={16} />
        {deleting ? "Deleting" : "Delete"}
      </button>
      <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-ink/60 hover:bg-skywash" onClick={onClose} type="button">
        <X size={16} />
        Cancel
      </button>
    </div>
  );
}

function EditActivityDialog({
  activity,
  children,
  onClose,
  onSaved
}: {
  activity: Activity;
  children: Child[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const session = activity.sessions[0];
  const existingChildId = activity.attendances[0]?.childId ?? activity.attendances[0]?.child.id ?? children[0]?.id ?? "";
  const [title, setTitle] = useState(activity.title);
  const [childId, setChildId] = useState(existingChildId);
  const [startsAt, setStartsAt] = useState(session ? toDateTimeLocal(session.startsAt) : "");
  const [endsAt, setEndsAt] = useState(session ? toDateTimeLocal(session.endsAt) : "");
  const [location, setLocation] = useState(activity.location);
  const [category, setCategory] = useState(activity.category);
  const [visibility, setVisibility] = useState(activity.visibility);
  const [provider, setProvider] = useState(activity.provider ?? "");
  const [registrationLink, setRegistrationLink] = useState(activity.registrationLink ?? "");
  const [notes, setNotes] = useState(activity.notes ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    if (endDate <= startDate) {
      setError("End time must be after start time.");
      return;
    }

    setSaving(true);
    try {
      await api(`/activities/${activity.id}`, {
        method: "PUT",
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
      onSaved();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update activity.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4">
      <form className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-md bg-white p-5 shadow-soft" onSubmit={submit}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">Edit Activity</h2>
          <button className="rounded-md p-2 text-ink/60 hover:bg-skywash hover:text-ink" onClick={onClose} title="Close" type="button">
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-3">
          <input className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf" onChange={(event) => setTitle(event.target.value)} required value={title} />
          <select className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf" onChange={(event) => setChildId(event.target.value)} required value={childId}>
            {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-bold uppercase text-ink/55">
              Starts
              <input className="rounded-md border border-ink/15 px-3 py-2 text-sm font-normal normal-case text-ink outline-none focus:border-leaf" onChange={(event) => setStartsAt(event.target.value)} required type="datetime-local" value={startsAt} />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-ink/55">
              Ends
              <input className="rounded-md border border-ink/15 px-3 py-2 text-sm font-normal normal-case text-ink outline-none focus:border-leaf" onChange={(event) => setEndsAt(event.target.value)} required type="datetime-local" value={endsAt} />
            </label>
          </div>
          <input className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf" onChange={(event) => setLocation(event.target.value)} placeholder="Location" required value={location} />
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf" onChange={(event) => setCategory(event.target.value)} value={category}>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf" onChange={(event) => setVisibility(event.target.value)} value={visibility}>
              {visibilityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <input className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf" onChange={(event) => setProvider(event.target.value)} placeholder="Provider or organizer" value={provider} />
          <input className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf" onChange={(event) => setRegistrationLink(event.target.value)} placeholder="Registration link" type="url" value={registrationLink} />
          <textarea className="min-h-24 resize-y rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-leaf" onChange={(event) => setNotes(event.target.value)} placeholder="Notes" value={notes} />
          {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button className="rounded-md border border-ink/15 px-4 py-2 font-bold text-ink/70 hover:bg-skywash" onClick={onClose} type="button">Cancel</button>
            <button className="rounded-md bg-leaf px-4 py-2 font-bold text-white disabled:opacity-60" disabled={saving || !children.length} type="submit">{saving ? "Saving" : "Save Changes"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
