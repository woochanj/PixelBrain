import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Game.css';

function Game() {
    const [score, setScore] = useState<number>(0);

    return (
        <div className="game-container">
            <header className="game-header">
                <Link to="/" className="pixel-btn back-btn">← HOME</Link>
                <h1>PIXEL CLICKER</h1>
                <div className="score-board">SCORE: {score}</div>
            </header>

            <div className="game-area">
                <p className="instruction">CLICK THE COIN!</p>
                <button
                    className="coin-btn"
                    onClick={() => setScore(s => s + 10)}
                >
                    🪙
                </button>
            </div>
        </div>
    );
}

export default Game;
