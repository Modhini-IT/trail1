<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Campus Tracker | Live Surveillance</title>
    <!-- React & ReactDOM -->
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <!-- Babel for JSX -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #262626; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #404040; }
        @keyframes pulse-soft {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .animate-pulse-soft { animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    </style>
</head>
<body class="bg-neutral-950 text-gray-100">
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useMemo, useRef } = React;

        // Custom Icon Component to handle Lucide in CDN
        const Icon = ({ name, className = "h-4 w-4" }) => {
            const iconRef = useRef(null);
            useEffect(() => {
                if (iconRef.current) {
                    const icon = lucide.icons[name];
                    if (icon) {
                        const svg = lucide.createIcons({
                            icons: { [name]: icon },
                            nameAttr: 'data-lucide',
                            attrs: { class: className }
                        });
                    }
                }
            }, [name, className]);
            return <i ref={iconRef} data-lucide={name} className={className}></i>;
        };

        const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
        const now = () => new Date().toLocaleTimeString();
        const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

        const sampleStudents = ['John Doe', 'Jane Smith', 'Alex Lee', 'Priya Patel', 'Wei Chen', 'Carlos Ramirez', 'Aisha Khan', 'Emily Clark', 'Michael Brown', 'Sara Johnson'];
        const sampleReasons = ['Sports Competition', 'Medical', 'Library Duty', 'Lab Prep', 'Placement Event'];
        const sampleLocations = ['Cafeteria', 'Library', 'Quad', 'Gym', 'Parking Lot', 'Corridor', 'Garden'];
        const inClassLocations = ['Room 101', 'Room 202', 'CS Lab', 'Lecture Hall A'];

        function randomBox() {
            const w = 15 + Math.random() * 15;
            const h = 20 + Math.random() * 20;
            const x = Math.random() * (100 - w - 4) + 2;
            const y = Math.random() * (100 - h - 4) + 2;
            return { x, y, w, h };
        }

        function statusStyles(status) {
            switch (status) {
                case 'Bunking': return { border: 'border-red-500/90', bg: 'bg-red-500/10', text: 'text-red-300' };
                case 'Authorized': return { border: 'border-green-500/90', bg: 'bg-green-500/10', text: 'text-green-300' };
                case 'In Class': return { border: 'border-blue-500/90', bg: 'bg-blue-500/10', text: 'text-blue-300' };
                default: return { border: 'border-gray-500', bg: 'bg-gray-500/10', text: 'text-gray-300' };
            }
        }

        function App() {
            const [detections, setDetections] = useState([]);
            const [alerts, setAlerts] = useState([]);
            const [exemptions, setExemptions] = useState([
                { id: '1', name: 'Jane Smith', reason: 'Medical' },
                { id: '2', name: 'Alex Lee', reason: 'Sports Competition' }
            ]);
            const [search, setSearch] = useState('');
            const [newExName, setNewExName] = useState('');
            const [newExReason, setNewExReason] = useState('');
            const [isWebcamActive, setIsWebcamActive] = useState(false);
            const videoRef = useRef(null);

            const filteredExemptions = useMemo(() => 
                exemptions.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.reason.toLowerCase().includes(search.toLowerCase())),
                [exemptions, search]
            );

            const [classes, setClasses] = useState([
                { name: 'CS101', expected: 60, current: 54 },
                { name: 'EE207', expected: 45, current: 42 },
                { name: 'MA110', expected: 50, current: 48 },
                { name: 'BIO150', expected: 40, current: 36 }
            ]);

            useEffect(() => {
                if (isWebcamActive && videoRef.current) {
                    navigator.mediaDevices.getUserMedia({ video: true })
                        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
                        .catch(err => { console.error(err); setIsWebcamActive(false); });
                } else if (!isWebcamActive && videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject;
                    stream.getTracks().forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                }
            }, [isWebcamActive]);

            const simulateDetection = () => {
                const name = sampleStudents[Math.floor(Math.random() * sampleStudents.length)];
                const box = randomBox();
                const r = Math.random();
                let status, location;

                if (r < 0.45) {
                    status = 'Bunking';
                    location = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
                    if (exemptions.some(e => e.name.toLowerCase() === name.toLowerCase())) {
                        status = 'Authorized';
                    } else {
                        const id = uid();
                        setAlerts(prev => [{ id, studentName: name, location, timestamp: now(), messageSent: false }, ...prev].slice(0, 20));
                        setTimeout(() => setAlerts(prev => prev.map(a => a.id === id ? { ...a, messageSent: true } : a)), 1500);
                    }
                } else if (r < 0.80) {
                    status = 'Authorized';
                    location = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
                } else {
                    status = 'In Class';
                    location = inClassLocations[Math.floor(Math.random() * inClassLocations.length)];
                }

                setDetections(prev => [{ id: uid(), name, status, ...box, location }, ...prev].slice(0, 6));
            };

            return (
                <div className="min-h-screen bg-neutral-950 text-gray-100 flex flex-col">
                    <header className="border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur sticky top-0 z-50">
                        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                    <Icon name="ShieldCheck" className="h-6 w-6 text-emerald-400" />
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="text-xl font-bold tracking-tight text-white">Smart Campus</h1>
                                    <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest leading-none mt-1">Attendance & Bunking Tracker</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsWebcamActive(!isWebcamActive)}
                                    className={`inline-flex items-center gap-2 rounded-lg transition px-4 py-2 text-sm font-medium ${isWebcamActive ? 'bg-red-600 hover:bg-red-500' : 'bg-neutral-800 hover:bg-neutral-700'}`}
                                >
                                    <Icon name="Camera" className="h-4 w-4" /> <span>{isWebcamActive ? 'Stop' : 'Start'} Webcam</span>
                                </button>
                                <button onClick={simulateDetection} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition px-4 py-2 text-sm font-medium shadow-lg shadow-emerald-900/40">
                                    <Icon name="Plus" className="h-4 w-4" /> Simulation
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-8 grid grid-cols-12 gap-8">
                        <section className="col-span-12 lg:col-span-8 space-y-8">
                            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden shadow-2xl">
                                <div className="flex items-center justify-between px-6 py-4 bg-neutral-900/80 border-b border-neutral-800">
                                    <h2 className="text-sm font-bold flex items-center gap-2 tracking-wide uppercase">
                                        <Icon name="Video" className="h-4 w-4 text-sky-400" /> Live surveillance feed
                                    </h2>
                                    <div className="flex gap-4 items-center">
                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span><span className="text-[10px] uppercase font-bold text-blue-400">Class</span></div>
                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-[10px] uppercase font-bold text-red-400">Bunk</span></div>
                                    </div>
                                </div>
                                <div className="relative aspect-video bg-black group overflow-hidden">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)] z-10 pointer-events-none"></div>
                                    {isWebcamActive ? (
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1] opacity-70 grayscale contrast-125" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 select-none">
                                            <Icon name="WifiOff" className="h-16 w-16 mb-4 text-neutral-600" />
                                            <p className="text-xs font-bold tracking-[0.2em] uppercase">Signal Encrypted / Standby</p>
                                        </div>
                                    )}
                                    {detections.map(d => {
                                        const styles = statusStyles(d.status);
                                        return (
                                            <div key={d.id} className={`absolute ${styles.border} ${styles.bg} rounded-xl border-2 transition-all duration-500 z-20`} style={{left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%`, height: `${d.h}%`}}>
                                                <div className={`absolute -top-10 left-0 ${styles.text} bg-neutral-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-neutral-700 shadow-2xl whitespace-nowrap`}>
                                                    <p className="text-xs font-bold">{d.name}</p>
                                                    <p className="text-[10px] opacity-70 font-medium">{d.status} • {d.location}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay"></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
                                        <Icon name="Activity" className="h-4 w-4 text-emerald-400" /> Attendance logs
                                    </h3>
                                    <div className="space-y-4">
                                        {classes.map(c => (
                                            <div key={c.name} className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-neutral-500">{c.name}</span>
                                                    <span>{c.current}/{c.expected}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{width: `${(c.current/c.expected)*100}%`}}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
                                        <Icon name="UserPlus" className="h-4 w-4 text-purple-400" /> Fast exemption
                                    </h3>
                                    <div className="space-y-3">
                                        <input value={newExName} onChange={e => setNewExName(e.target.value)} placeholder="Student Name" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-xs focus:ring-1 focus:ring-purple-500 transition outline-none"/>
                                        <select value={newExReason} onChange={e => setNewExReason(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-purple-500 transition appearance-none">
                                            <option value="">Choose Reason</option>
                                            {sampleReasons.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <button onClick={() => { if(newExName && newExReason) { setExemptions([{id: uid(), name: newExName, reason: newExReason}, ...exemptions]); setNewExName(''); setNewExReason(''); } }} className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-purple-900/20">Add Authority</button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <aside className="col-span-12 lg:col-span-4 h-fit">
                            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden shadow-xl">
                                <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/80 flex justify-between items-center">
                                    <h3 className="text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                                        <Icon name="Bell" className="h-4 w-4 text-amber-500" /> Incident List
                                    </h3>
                                    <span className="text-[10px] font-bold bg-neutral-800 px-2 py-0.5 rounded text-neutral-500 tracking-tighter">{alerts.length} ITEMS</span>
                                </div>
                                <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                                    {alerts.map(a => (
                                        <div key={a.id} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 group transition-all hover:border-red-500/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">{a.studentName}</h4>
                                                <Icon name="AlertTriangle" className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                                            </div>
                                            <div className="flex gap-4 text-[10px] text-neutral-500 font-medium mb-3">
                                                <span className="flex items-center gap-1"><Icon name="MapPin" className="h-3 w-3" /> {a.location}</span>
                                                <span className="flex items-center gap-1"><Icon name="Clock" className="h-3 w-3" /> {a.timestamp}</span>
                                            </div>
                                            <div className={`mt-2 pt-2 border-t border-neutral-900 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider ${a.messageSent ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {a.messageSent ? <Icon name="CheckCircle" className="h-3.5 w-3.5" /> : <Icon name="Loader2" className="h-3.5 w-3.5 animate-spin" />}
                                                <span>{a.messageSent ? 'Advisor Notified' : 'Dispatching SMS...'}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {alerts.length === 0 && (
                                        <div className="py-12 text-center opacity-20 font-bold uppercase tracking-widest text-xs">No active violations</div>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </main>

                    <footer className="p-8 mt-auto border-t border-neutral-900">
                        <div className="mx-auto max-w-7xl flex justify-between items-center opacity-30 text-[10px] uppercase font-bold tracking-[0.2em]">
                            <span>System v2.5.0-Deployment</span>
                            <span>Secure Channel 01 Active</span>
                        </div>
                    </footer>
                </div>
            );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>

