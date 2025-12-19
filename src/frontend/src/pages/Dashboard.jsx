import React, { useState, useEffect } from 'react';
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
} from 'chart.js';
import './Dashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const STATS_URL = '/api/stats';

function Dashboard() {
    // Auth State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(false);

    const [stats, setStats] = useState({
        system: { cpu: 0, ram_percent: 0, ram_used_gb: 0, ram_total_gb: 0 },
        ollama: { status: 'checking', models: [] },
        clients: []
    });

    // Chart Data State
    const [cpuData, setCpuData] = useState(Array(20).fill(0));
    const [ramData, setRamData] = useState(Array(20).fill(0));

    const chartOptions = {
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
    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'Dncks') {
            setIsLoggedIn(true);
            setLoginError(false);
        } else {
            setLoginError(true);
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setPassword('');
    };

    useEffect(() => {
        // Only fetch if logged in to save resources
        if (!isLoggedIn) return;

        const fetchData = async () => {
            try {
                const res = await fetch(STATS_URL);
                const data = await res.json();
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
        };

        fetchData();
        const interval = setInterval(fetchData, 1000);
        return () => clearInterval(interval);
    }, [isLoggedIn]);

    // Conditional Rendering for Login
    if (!isLoggedIn) {
        return (
            <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
                <h1 className="dashboard-title">SECURITY CHECK</h1>
                <div className="card" style={{ padding: '40px', textAlign: 'center', border: '2px solid #30363d' }}>
                    <p style={{ marginBottom: '20px', color: '#8b949e' }}>ENTER PASSWORD</p>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="******"
                            style={{
                                padding: '10px',
                                backgroundColor: '#0d1117',
                                border: '1px solid #30363d',
                                color: '#fff',
                                fontFamily: 'inherit',
                                textAlign: 'center',
                                fontSize: '18px'
                            }}
                            autoFocus
                        />
                        {loginError && <span style={{ color: '#da3633', fontSize: '12px' }}>ACCESS DENIED</span>}
                        <button
                            type="submit"
                            style={{
                                padding: '10px',
                                backgroundColor: '#238636',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontWeight: 'bold'
                            }}
                        >
                            UNLOCK
                        </button>
                    </form>
                    <div style={{ marginTop: '20px' }}>
                        <Link to="/" style={{ color: '#58a6ff', textDecoration: 'none', fontSize: '12px' }}>← BACK TO HOME</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <Link to="/" className="nav-btn">
                        🏠 HOME
                    </Link>
                    <h1 className="dashboard-title">PixelBrain 16-Bit Control</h1>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className={`status-badge ${stats.ollama.status === 'online' ? 'online' : 'offline'}`}>
                        {stats.ollama.status === 'online' ? 'OLLAMA ONLINE' : 'OLLAMA OFFLINE'}
                    </div>
                    <button onClick={handleLogout} className="nav-btn logout">LOGOUT</button>
                </div>
            </header>

            <div className="grid">
                {/* CPU Card */}
                <div className="card">
                    <h2>CPU Usage</h2>
                    <div className="chart-container">
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
                    <div className="metric-value">{stats.system.cpu}%</div>
                </div>

                {/* RAM Card */}
                <div className="card">
                    <h2>RAM Usage</h2>
                    <div className="chart-container">
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
                    <div className="metric-value">{stats.system.ram_percent}%</div>
                    <div className="metric-sub">{stats.system.ram_used_gb} GB / {stats.system.ram_total_gb} GB</div>
                </div>

                {/* Ollama Info Card */}
                <div className="card">
                    <h2>Loaded Models</h2>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {stats.ollama.models.length > 0 ? (
                            stats.ollama.models.map((model, idx) => (
                                <li key={idx} style={{ padding: '5px 0', borderBottom: '1px solid #30363d' }}>
                                    📦 {model.name} ({(model.size / 1024 / 1024 / 1024).toFixed(1)} GB)
                                </li>
                            ))
                        ) : (
                            <li>No models loaded in memory</li>
                        )}
                    </ul>
                </div>
            </div>

            <div className="card" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h2>🔌 Connected Clients (Real-time)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>IP Address</th>
                            <th>Last Seen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.clients.length > 0 ? (
                            stats.clients.map((client, idx) => (
                                <tr key={idx}>
                                    <td>{client.ip}</td>
                                    <td>{client.last_seen}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="2">No active clients</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Dashboard;
