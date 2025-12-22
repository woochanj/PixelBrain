
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// Construct backend URL dynamically to bypass Vite proxy and get real client IP
const API_PORT = '5000';
const getBaseUrl = (): string => `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
const STATS_URL = `${getBaseUrl()}/api/stats`;

interface SystemStats {
    cpu: number;
    ram_percent: number;
    ram_used_gb: number;
    ram_total_gb: number;
}

interface OllamaModel {
    name: string;
    size: number;
}

interface OllamaStats {
    status: string;
    models: OllamaModel[];
}

interface ClientInfo {
    ip: string;
    last_seen: string;
}

interface DashboardData {
    system: SystemStats;
    ollama: OllamaStats;
    clients: ClientInfo[];
}

const ADMIN_PASS = 'Dncks12';

function Dashboard() {
    // Auth State
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
        // Secure Check: Compare stored token with current password
        const storedToken = localStorage.getItem('auth_token');
        return storedToken === ADMIN_PASS;
    });
    const [password, setPassword] = useState<string>('');
    const [loginError, setLoginError] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const [stats, setStats] = useState<DashboardData>({
        system: { cpu: 0, ram_percent: 0, ram_used_gb: 0, ram_total_gb: 0 },
        ollama: { status: 'checking', models: [] },
        clients: []
    });

    // Chart Data State
    const [cpuData, setCpuData] = useState<number[]>(Array(20).fill(0));
    const [ramData, setRamData] = useState<number[]>(Array(20).fill(0));

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            y: { beginAtZero: true, max: 100, grid: { color: '#30363d' } },
            x: { display: false }
        },
        plugins: { legend: { display: false } }
    };

    // Login Handler
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASS) {
            setIsLoggedIn(true);
            // Store the password itself (or hash in real app) as the token
            localStorage.setItem('auth_token', ADMIN_PASS);
            setLoginError(false);
        } else {
            setLoginError(true);
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('auth_token');
        setPassword('');
    };

    const fetchData = useCallback(async () => {
        if (!isLoggedIn) return;
        try {
            const res = await fetch(STATS_URL);
            const data: DashboardData = await res.json();
            setStats(data);

            // Update charts
            setCpuData(prev => {
                const newData = [...prev.slice(1), data.system.cpu];
                return newData;
            });
            setRamData(prev => {
                const newData = [...prev.slice(1), data.system.ram_percent];
                return newData;
            });
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    }, [isLoggedIn]);

    // Manual Refresh Handler
    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        // Visual feedback delay
        setTimeout(() => setIsRefreshing(false), 500);
    };

    useEffect(() => {
        if (!isLoggedIn) return;

        fetchData();
        const interval = setInterval(fetchData, 1000);
        return () => clearInterval(interval);
    }, [isLoggedIn, fetchData]);

    // Conditional Rendering for Login
    if (!isLoggedIn) {
        return (
            <div className="flex justify-center items-center h-screen flex-col gap-5 p-5 bg-[#0d1117] text-[#c9d1d9] font-mono">
                <h1 className="text-2xl m-0">SECURITY CHECK</h1>
                <div className="bg-[#161b22] border border-[#30363d] rounded-md p-10 text-center">
                    <p className="mb-5 text-[#8b949e]">ENTER PASSWORD</p>
                    <form onSubmit={handleLogin} className="flex flex-col gap-[15px]">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="******"
                            className="p-2.5 bg-[#0d1117] border border-[#30363d] text-white text-center text-lg focus:outline-none"
                            autoFocus
                        />
                        {loginError && <span className="text-[#da3633] text-xs">ACCESS DENIED</span>}
                        <button
                            type="submit"
                            className="p-2.5 bg-[#238636] text-white border-none cursor-pointer font-bold hover:bg-[#2ea043]"
                        >
                            UNLOCK
                        </button>
                    </form>
                    <div className="mt-5">
                        <Link to="/" className="text-[#58a6ff] no-underline text-xs">← BACK TO HOME</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 bg-[#0d1117] text-[#c9d1d9] font-mono min-h-screen">
            <header className="flex justify-between items-center mb-[30px] border-b border-[#30363d] pb-5 max-w-[1200px] mx-auto">
                <div className="flex gap-[15px] items-center">
                    <Link to="/" className="bg-[#58a6ff] text-white border border-[#30363d] px-3 py-1.5 rounded-md no-underline">
                        🏠 HOME
                    </Link>
                    <h1 className="text-2xl m-0">PixelBrain 16-Bit Control</h1>
                </div>
                <div className="flex gap-[10px] items-center">
                    <div className={`px-3 py-1.5 rounded-[20px] text-sm font-bold bg-[#161b22] border ${stats.ollama.status === 'online' ? 'text-[#3fb950] border-[#3fb950]' : 'text-[#f85149] border-[#f85149]'}`}>
                        {stats.ollama.status === 'online' ? 'OLLAMA ONLINE' : 'OLLAMA OFFLINE'}
                    </div>
                    <button onClick={handleLogout} className="bg-[#da3633] text-white border border-[#30363d] px-3 py-1.5 rounded-md cursor-pointer">LOGOUT</button>
                </div>
            </header>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5 mb-[30px] max-w-[1200px] mx-auto">
                {/* CPU Card */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-md p-5">
                    <h2 className="mt-0 text-base text-[#8b949e] mb-[15px]">CPU Usage</h2>
                    <div className="relative h-[200px] w-full">
                        <Line options={chartOptions} data={{
                            labels: Array(20).fill(''),
                            datasets: [{
                                data: cpuData,
                                borderColor: '#58a6ff',
                                borderWidth: 2,
                                tension: 0.4,
                                pointRadius: 0
                            }]
                        }} />
                    </div>
                    <div className="text-[32px] font-bold mb-[5px]">{stats.system.cpu}%</div>
                </div>

                {/* RAM Card */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-md p-5">
                    <h2 className="mt-0 text-base text-[#8b949e] mb-[15px]">RAM Usage</h2>
                    <div className="relative h-[200px] w-full">
                        <Line options={chartOptions} data={{
                            labels: Array(20).fill(''),
                            datasets: [{
                                data: ramData,
                                borderColor: '#da3633',
                                borderWidth: 2,
                                tension: 0.4,
                                pointRadius: 0
                            }]
                        }} />
                    </div>
                    <div className="text-[32px] font-bold mb-[5px]">{stats.system.ram_percent}%</div>
                    <div className="text-sm text-[#8b949e]">{stats.system.ram_used_gb} GB / {stats.system.ram_total_gb} GB</div>
                </div>

                {/* Ollama Info Card */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-md p-5">
                    <h2 className="mt-0 text-base text-[#8b949e] mb-[15px]">Loaded Models</h2>
                    <ul className="list-none p-0">
                        {stats.ollama.models.length > 0 ? (
                            stats.ollama.models.map((model, idx) => (
                                <li key={idx} className="py-[5px] border-b border-[#30363d]">
                                    📦 {model.name} ({(model.size / 1024 / 1024 / 1024).toFixed(1)} GB)
                                </li>
                            ))
                        ) : (
                            <li className="text-[#8b949e]">No models loaded in memory</li>
                        )}
                    </ul>
                </div>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-md p-5 max-w-[1200px] mx-auto">
                <div className="flex justify-between items-center mb-[15px]">
                    <h2 className="mt-0 text-base text-[#8b949e] mb-0">🔌 Connected Clients (Real-time)</h2>
                    <button
                        onClick={handleManualRefresh}
                        className={`px-[15px] py-[5px] text-xs border transition-all duration-200 cursor-pointer ${isRefreshing ? 'bg-[#2ecc71] border-[#27ae60] text-black' : 'bg-[#58a6ff] border-[#4a90e2] text-white'}`}
                    >
                        {isRefreshing ? '🔄 UPDATING...' : '🔄 REFRESH LIST'}
                    </button>
                </div>
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr>
                            <th className="text-left p-3 border-b border-[#30363d] text-[#8b949e]">IP Address</th>
                            <th className="text-left p-3 border-b border-[#30363d] text-[#8b949e]">Last Seen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.clients.length > 0 ? (
                            stats.clients.map((client, idx) => (
                                <tr key={idx}>
                                    <td className="text-left p-3 border-b border-[#30363d]">{client.ip}</td>
                                    <td className="text-left p-3 border-b border-[#30363d]">{client.last_seen}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={2} className="text-left p-3 border-b border-[#30363d] text-[#8b949e]">No active clients</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Dashboard;
