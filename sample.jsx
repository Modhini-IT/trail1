import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Loader2,
  MapPin,
  Clock,
  Plus,
  Search,
  Trash2,
  ShieldCheck,
  Video,
  User,
} from 'lucide-react';

// Types
type DetectionStatus = 'Bunking' | 'Authorized' | 'In Class';

type Detection = {
  id: string;
  name: string;
  status: DetectionStatus;
  x: number; // percent left
  y: number; // percent top
  w: number; // percent width
  h: number; // percent height
  location: string;
};

type Exemption = {
  id: string;
  name: string;
  reason: string;
};

type AlertItem = {
  id: string;
  studentName: string;
  location: string;
  timestamp: string;
  messageSent: boolean;
};

// Utils
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const now = () => new Date().toLocaleString();
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const sampleStudents = [
  'John Doe',
  'Jane Smith',
  'Alex Lee',
  'Priya Patel',
  'Wei Chen',
  'Carlos Ramirez',
  'Aisha Khan',
  'Emily Clark',
  'Michael Brown',
  'Sara Johnson',
];

const sampleReasons = ['Sports Competition', 'Medical', 'Library Duty', 'Lab Prep', 'Placement Event'];
const sampleLocations = ['Cafeteria', 'Library', 'Quad', 'Gym', 'Parking Lot', 'Corridor', 'Garden'];
const inClassLocations = ['Room 101', 'Room 202', 'CS Lab', 'Lecture Hall A'];

function randomBox() {
  // Keep boxes within 10%-60% width/height and inside frame
  const w = 12 + Math.random() * 18; // 12% - 30%
  const h = 14 + Math.random() * 20; // 14% - 34%
  const x = Math.random() * (100 - w - 4) + 2; // padding 2%
  const y = Math.random() * (100 - h - 4) + 2;
  return { x, y, w, h };
}

function statusStyles(status: DetectionStatus) {
  switch (status) {
    case 'Bunking':
      return {
        border: 'border-red-500/90',
        bg: 'bg-red-500/10',
        text: 'text-red-300',
        chip: 'bg-red-500/20 text-red-300 border border-red-500/40',
      };
    case 'Authorized':
      return {
        border: 'border-green-500/90',
        bg: 'bg-green-500/10',
        text: 'text-green-300',
        chip: 'bg-green-500/20 text-green-300 border border-green-500/40',
      };
    case 'In Class':
      return {
        border: 'border-blue-500/90',
        bg: 'bg-blue-500/10',
        text: 'text-blue-300',
        chip: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
      };
    default:
      return { border: 'border-gray-500', bg: 'bg-gray-500/10', text: 'text-gray-300', chip: 'bg-gray-500/20' };
  }
}

export default function Home() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [exemptions, setExemptions] = useState<Exemption[]>([
    { id: uid(), name: 'Jane Smith', reason: 'Medical' },
    { id: uid(), name: 'Alex Lee', reason: 'Sports Competition' },
  ]);

  const [search, setSearch] = useState('');
  const [newExName, setNewExName] = useState('');
  const [newExReason, setNewExReason] = useState('');

  const filteredExemptions = useMemo(
    () =>
      exemptions.filter(
        (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.reason.toLowerCase().includes(search.toLowerCase())
      ),
    [exemptions, search]
  );

  const [classes, setClasses] = useState(
    [
      { name: 'CS101', expected: 60, current: 54 },
      { name: 'EE207', expected: 45, current: 42 },
      { name: 'MA110', expected: 50, current: 48 },
      { name: 'BIO150', expected: 40, current: 36 },
    ].map((c) => ({ ...c }))
  );

  const adjustAttendance = (delta: number) => {
    setClasses((prev) =>
      prev.map((c, idx) => {
        if (idx !== Math.floor(Math.random() * prev.length)) return c;
        const curr = clamp(c.current + delta, 0, c.expected);
        return { ...c, current: curr };
      })
    );
  };

  const addAlert = (studentName: string, location: string) => {
    const id = uid();
    const item: AlertItem = {
      id,
      studentName,
      location,
      timestamp: now(),
      messageSent: false,
    };
    setAlerts((prev) => [item, ...prev].slice(0, 50));
    // Simulate message sending
    setTimeout(() => {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, messageSent: true } : a)));
    }, 800);
  };

  const addExemption = (name: string, reason: string) => {
    if (!name.trim() || !reason.trim()) return;
    setExemptions((prev) => [{ id: uid(), name: name.trim(), reason: reason.trim() }, ...prev]);
    setNewExName('');
    setNewExReason('');
  };

  const removeExemption = (id: string) => {
    setExemptions((prev) => prev.filter((e) => e.id !== id));
  };

  const simulateDetection = () => {
    const name = sampleStudents[Math.floor(Math.random() * sampleStudents.length)];
    const box = randomBox();

    // Choose scenario: 45% Bunking, 35% Authorized, 20% In Class
    const r = Math.random();
    let status: DetectionStatus;
    let location = '';

    if (r < 0.45) {
      // Bunking (outside), only if not exempted
      status = 'Bunking';
      location = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
      const isExempt = exemptions.some((e) => e.name.toLowerCase() === name.toLowerCase());
      if (isExempt) {
        // If exempt, treat as Authorized instead
        status = 'Authorized';
      } else {
        addAlert(name, location);
        adjustAttendance(-1);
      }
    } else if (r < 0.80) {
      // Authorized (whitelisted) outside
      status = 'Authorized';
      location = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
      const isExempt = exemptions.some((e) => e.name.toLowerCase() === name.toLowerCase());
      if (!isExempt) {
        const reason = sampleReasons[Math.floor(Math.random() * sampleReasons.length)];
        setExemptions((prev) => [{ id: uid(), name, reason }, ...prev]);
      }
      // No attendance impact
    } else {
      // In Class detection
      status = 'In Class';
      location = inClassLocations[Math.floor(Math.random() * inClassLocations.length)];
      adjustAttendance(+1);
    }

    const detection: Detection = {
      id: uid(),
      name,
      status,
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      location,
    };
    setDetections((prev) => [detection, ...prev].slice(0, 6));
  };

  const clearAll = () => {
    setDetections([]);
    setAlerts([]);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100">
      <header className="border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <h1 className="text-lg sm:text-xl font-semibold tracking-wide">Smart Campus Attendance & Bunking Tracker</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={simulateDetection}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-500 transition text-white px-3 py-2 text-sm"
            >
              <Plus className="h-4 w-4" /> Simulate Detection
            </button>
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-md bg-neutral-800 hover:bg-neutral-700 transition text-gray-200 px-3 py-2 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-12 gap-6">
        {/* Left: Monitoring + Analytics + Exemptions */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          {/* Live Monitoring View */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-neutral-800/80 bg-neutral-900">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-sky-400" />
                <h2 className="text-sm font-medium text-gray-200">Live Monitoring View</h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-blue-500/40 bg-blue-500/10 text-blue-300">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" /> In Class
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-green-500/40 bg-green-500/10 text-green-300">
                  <span className="h-2 w-2 rounded-full bg-green-400" /> Authorized
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-red-500/40 bg-red-500/10 text-red-300">
                  <span className="h-2 w-2 rounded-full bg-red-400" /> Bunking
                </span>
              </div>
            </div>
            <div className="relative aspect-video bg-neutral-950">
              {/* Placeholder feed */}
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="text-neutral-500 text-xs mb-2">CCTV Stream Placeholder</div>
                  <div className="text-neutral-400 text-sm">Live Feed Unavailable in Demo</div>
                </div>
              </div>
              {/* Overlay detections */}
              {detections.map((d) => {
                const styles = statusStyles(d.status);
                return (
                  <div
                    key={d.id}
                    className={`absolute ${styles.border} ${styles.bg} rounded-md`}
                    style={{
                      left: `${d.x}%`,
                      top: `${d.y}%`,
                      width: `${d.w}%`,
                      height: `${d.h}%`,
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset',
                    }}
                  >
                    <div className={`absolute -top-6 left-0 text-[10px] sm:text-xs ${styles.text} bg-neutral-900/80 backdrop-blur px-1.5 py-0.5 rounded-md border border-neutral-800/80`}> 
                      {d.status === 'Bunking' ? `Alert: ${d.name} - Bunking` : d.status === 'Authorized' ? `Authorized: ${d.name}` : `Student: ${d.name} - In Class`} 
                    </div>
                    <div className="absolute -top-6 right-0 text-[10px] sm:text-xs text-neutral-400 bg-neutral-900/70 backdrop-blur px-1.5 py-0.5 rounded-md border border-neutral-800/80">
                      {d.location}
                    </div>
                    <div className="w-full h-full rounded-md border-dashed border-2 border-current opacity-50" />
                  </div>
                );
              })}
            </div>
            <div className="px-4 sm:px-5 py-3 flex items-center justify-between border-t border-neutral-800/80 bg-neutral-900/60">
              <div className="text-xs text-neutral-400">Overlay simulates bounding boxes and labels for detected students.</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={simulateDetection}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-500 transition text-white px-3 py-2 text-xs"
                >
                  <Plus className="h-4 w-4" /> Simulate Detection
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Analytics */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50">
            <div className="px-4 sm:px-5 py-3 border-b border-neutral-800/80 bg-neutral-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-medium">Attendance Analytics</h3>
            </div>
            <div className="px-4 sm:px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classes.map((c) => {
                const pct = Math.round((c.current / c.expected) * 100);
                const bar = pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500';
                return (
                  <div key={c.name} className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="font-medium text-gray-200">{c.name}</div>
                      <div className="text-neutral-400">{c.current}/{c.expected}</div>
                    </div>
                    <div className="h-2 w-full rounded bg-neutral-800 overflow-hidden">
                      <div className={`h-2 ${bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-2 text-xs text-neutral-400">Current attendance: {pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exemption List Manager */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50">
            <div className="px-4 sm:px-5 py-3 border-b border-neutral-800/80 bg-neutral-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-medium">Exemption List Manager</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students or reason..."
                  className="pl-8 pr-3 py-2 text-sm rounded-md bg-neutral-950 border border-neutral-800 text-gray-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
            </div>
            <div className="px-4 sm:px-5 py-4 grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <input
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  placeholder="Student name"
                  className="sm:col-span-5 px-3 py-2 text-sm rounded-md bg-neutral-950 border border-neutral-800 text-gray-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
                <input
                  value={newExReason}
                  onChange={(e) => setNewExReason(e.target.value)}
                  placeholder="Reason (e.g., Medical)"
                  className="sm:col-span-5 px-3 py-2 text-sm rounded-md bg-neutral-950 border border-neutral-800 text-gray-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
                <button
                  onClick={() => addExemption(newExName, newExReason)}
                  className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 hover:bg-purple-500 transition text-white px-3 py-2 text-sm"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {sampleReasons.map((r) => (
                  <button
                    key={r}
                    onClick={() => setNewExReason(r)}
                    className="px-2 py-1 rounded-md border border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900"
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="max-h-56 overflow-auto rounded-lg border border-neutral-800">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-900/80 text-neutral-400">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">Name</th>
                      <th className="text-left font-medium px-3 py-2">Reason</th>
                      <th className="text-right font-medium px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExemptions.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-neutral-500">
                          No exemptions found.
                        </td>
                      </tr>
                    )}
                    {filteredExemptions.map((e) => (
                      <tr key={e.id} className="border-t border-neutral-800/60">
                        <td className="px-3 py-2 text-gray-200">{e.name}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs">
                            {e.reason}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => removeExemption(e.id)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-gray-200 text-xs"
                          >
                            <Trash2 className="h-4 w-4" /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Real-Time Alert Feed */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 h-full">
            <div className="px-4 sm:px-5 py-3 border-b border-neutral-800/80 bg-neutral-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-medium">Real-Time Alert Feed</h3>
              </div>
              <span className="text-xs text-neutral-400">{alerts.length} alerts</span>
            </div>
            <div className="p-4 sm:p-5 space-y-3 max-h-[70vh] overflow-auto">
              {alerts.length === 0 && (
                <div className="text-center py-10 text-neutral-500">
                  No bunking alerts yet. Simulate a detection to see alerts.
                </div>
              )}
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 hover:bg-neutral-900/60 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <div>
                        <div className="font-medium text-sm text-gray-200">{a.studentName}</div>
                        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {a.location}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {a.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {a.messageSent ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-md text-xs">
                          <CheckCircle className="h-4 w-4" /> Message Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-md text-xs">
                          <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <footer className="mx-auto max-w-7xl px-6 pb-8 text-xs text-neutral-500">
        Demo-only mock logic. Use the Simulate Detection button to trigger various scenarios.
      </footer>
    </div>
  );
}
