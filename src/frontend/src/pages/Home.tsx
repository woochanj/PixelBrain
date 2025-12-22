
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center bg-pixel-bg">
            <h1 className="font-['Press_Start_2P',cursive] text-[40px] mb-[60px] drop-shadow-[4px_4px_0_#000]" style={{ color: '#f7d51d' }}>
                PixelBrain 16-BIT
            </h1>

            <div className="flex gap-10 flex-wrap justify-center">
                <Link to="/chat" className="pixel-btn btn-chat w-[220px] h-[180px]">
                    <span className="icon">
                        {/* Solid Square Bubble */}
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="block">
                            <path d="M2 2H22V18H18V22H14V18H2V2ZM4 4V16H20V4H4Z" fill="white" />
                            <rect x="5" y="6" width="14" height="2" fill="white" />
                            <rect x="5" y="10" width="10" height="2" fill="white" />
                            <rect x="5" y="14" width="8" height="2" fill="white" />
                        </svg>
                    </span>
                    START CHAT
                </Link>

                <Link to="/dashboard" className="pixel-btn btn-dash w-[220px] h-[180px]">
                    <span className="icon">
                        {/* Pixel Bar Chart */}
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="block">
                            <path d="M2 2H4V20H22V22H2V2Z" fill="white" />
                            <rect x="6" y="10" width="3" height="10" fill="white" />
                            <rect x="11" y="6" width="3" height="14" fill="white" />
                            <rect x="16" y="14" width="3" height="6" fill="white" />
                        </svg>
                    </span>
                    DASHBOARD
                </Link>

                <Link to="/game" className="pixel-btn btn-game w-[220px] h-[180px]" style={{ backgroundColor: '#2ecc71', color: 'black' }}>
                    <span className="icon">
                        {/* Console Gamepad Icon */}
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
                            {/* Controller Body */}
                            <path d="M2 8H22V17H19V21H14V17H10V21H5V17H2V8Z" fill="white" />
                            {/* D-Pad */}
                            <rect x="5" y="11" width="6" height="2" fill="#202020" />
                            <rect x="7" y="9" width="2" height="6" fill="#202020" />
                            {/* Buttons (ABXY style) */}
                            <rect x="15" y="12" width="2" height="2" fill="#3498db" />
                            <rect x="17" y="10" width="2" height="2" fill="#e74c3c" />
                            <rect x="19" y="12" width="2" height="2" fill="#2ecc71" />
                            <rect x="17" y="14" width="2" height="2" fill="#f1c40f" />
                        </svg>
                    </span>
                    GAME
                </Link>

                <Link to="/excel" className="pixel-btn btn-excel w-[220px] h-[180px]" style={{ backgroundColor: '#9b59b6', color: 'black' }}>
                    <span className="icon">
                        {/* Spreadsheet/Grid Icon */}
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
                            <path d="M4 4H20V20H4V4Z" fill="white" />
                            <rect x="6" y="6" width="12" height="2" fill="#202020" />
                            <rect x="6" y="10" width="12" height="2" fill="#202020" />
                            <rect x="6" y="14" width="12" height="2" fill="#202020" />
                            <rect x="10" y="6" width="2" height="12" fill="#202020" />
                        </svg>
                    </span>
                    EXCEL TOOL
                </Link>
            </div>
        </div>
    );
}

export default Home;
