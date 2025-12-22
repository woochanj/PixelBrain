import { useState } from 'react';
import { Link } from 'react-router-dom';

function Game() {
    const [score, setScore] = useState<number>(0);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#202020] text-white font-['Press_Start_2P',monospace]">
            <header className="absolute top-5 w-full flex justify-between items-center px-10 box-border">
                <Link to="/" className="text-xs p-2.5 bg-[#4a90e2] text-white border-2 border-[#1c4e80] shadow-[4px_4px_0px_#1c4e80] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1c4e80] no-underline">← HOME</Link>
                <h1 className="text-2xl m-0">PIXEL CLICKER</h1>
                <div className="text-2xl text-[#f7d51d] drop-shadow-[2px_2px_0_#000]">SCORE: {score}</div>
            </header>

            <div className="text-center">
                <p className="mb-[30px] text-sm text-[#8b949e] animate-pulse">CLICK THE COIN!</p>
                <button
                    className="text-[80px] bg-transparent border-none cursor-pointer transition-transform duration-100 select-none active:scale-90"
                    onClick={() => setScore(s => s + 10)}
                >
                    🪙
                </button>
            </div>
        </div>
    );
}

export default Game;
