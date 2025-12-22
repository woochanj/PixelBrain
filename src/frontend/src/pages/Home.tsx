
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center bg-pixel-bg">
            <h1 className="text-[30px] text-pixel-yellow mb-[50px] shadow-pixel">
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

                <Link to="/game" className="pixel-btn btn-game w-[220px] h-[180px] bg-pixel-green">
                    <span className="icon">
                        {/* NES Controller Icon */}
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="block">
                            {/* Controller Body */}
                            <rect x="2" y="8" width="20" height="8" fill="white" />
                            {/* D-Pad */}
                            <rect x="4" y="11" width="2" height="2" fill="#202020" />
                            <rect x="6" y="10" width="2" height="4" fill="#202020" />
                            <rect x="8" y="11" width="2" height="2" fill="#202020" />
                            {/* A/B Buttons */}
                            <rect x="14" y="11" width="2" height="2" fill="#da3633" />
                            <rect x="17" y="11" width="2" height="2" fill="#da3633" />
                        </svg>
                    </span>
                    GAME
                </Link>
            </div>
        </div>
    );
}

export default Home;
