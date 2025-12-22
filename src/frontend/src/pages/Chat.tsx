import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Chat.css';

// Construct backend URL dynamically to bypass Vite proxy and get real client IP
const API_PORT = '5000';
const getBaseUrl = (): string => `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;

const OLLAMA_URL = `${getBaseUrl()}/api/generate`;
const OLLAMA_STATUS_URL = `${getBaseUrl()}/api/tags`;
const MODEL_NAME = 'gemma3:12b';

interface Message {
    text: string;
    isUser: boolean;
    isStopped?: boolean;
    isError?: boolean;
}

function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<string>('CHECKING');
    const [isOnline, setIsOnline] = useState<boolean>(false);
    const [isThinking, setIsThinking] = useState<boolean>(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Auto-scroll
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, loading]);

    // Check Status
    useEffect(() => {
        const checkConnection = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                // We might need to proxy this if CORS fails, but let's try direct first.
                const response = await fetch(OLLAMA_STATUS_URL, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (response.ok) {
                    setStatus('ONLINE');
                    setIsOnline(true);
                } else {
                    setStatus('OFFLINE');
                    setIsOnline(false);
                }
            } catch (e) {
                setStatus('OFFLINE');
                setIsOnline(false);
            }
        };

        checkConnection();
        const interval = setInterval(checkConnection, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleStop = () => {
        if (abortControllerRef.current) {
            const controller = abortControllerRef.current;
            abortControllerRef.current = null; // Null immediately to signal valid stop to loop
            controller.abort();

            setLoading(false);
            // Add [Stopped] indicator to the last AI message
            setMessages(prev => {
                const newMsgs = [...prev];
                if (newMsgs.length > 0 && !newMsgs[newMsgs.length - 1].isUser) {
                    // Prevent duplicate stopped status
                    if (newMsgs[newMsgs.length - 1].isStopped) return newMsgs;

                    newMsgs[newMsgs.length - 1].isStopped = true;
                }
                return newMsgs;
            });
        }
    };

    const handleSend = async () => {
        // If loading, treat click as stop (Priority over empty input)
        if (loading) {
            handleStop();
            return;
        }

        if (!input.trim()) return;

        const userText = input;
        setInput('');
        setMessages(prev => [...prev, { text: userText, isUser: true }]);
        setLoading(true);
        setIsThinking(true);

        // Initial AI message placeholder
        setMessages(prev => [...prev, { text: '', isUser: false }]);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await fetch(OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    prompt: userText,
                    stream: true
                }),
                signal: controller.signal
            });

            if (!response.body) throw new Error('ReadableStream not supported');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (!abortControllerRef.current) break; // Stop if aborted

                setIsThinking(false); // Received data, so switching to Typing

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line) continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.response) {
                            aiText += json.response;
                            // Update the last message
                            setMessages(prev => {
                                // Double check if aborted inside state update to be sure
                                if (!abortControllerRef.current) return prev;

                                const newMsgs = [...prev];
                                newMsgs[newMsgs.length - 1].text = aiText;
                                return newMsgs;
                            });
                        }
                    } catch (e) {
                        console.error("JSON Parse Error", e);
                    }
                }
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                setMessages(prev => [...prev, { text: "Error: " + error.message, isUser: false, isError: true }]);
            }
        } finally {
            if (abortControllerRef.current) {
                setLoading(false);
                abortControllerRef.current = null;
            }
        }
    };

    return (
        <div className="main-container">
            <header className="chat-header">
                <div className="header-left">
                    <Link to="/" className="pixel-btn" style={{ padding: '5px 10px', fontSize: '10px' }}>
                        ←
                    </Link>
                    <h1>PixelBrain Chat</h1>
                </div>
                <div className="status-indicator">
                    <div className={`status-dot ${isOnline ? 'online' : 'offline'}`}></div>
                    <span className="status-text">{status}</span>
                    <span className="model-badge">12B Model</span>
                </div>
            </header>

            <div className="chat-container" ref={chatContainerRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.isUser ? 'user-message' : 'ai-message'}`}>
                        <div className="message-content">
                            {msg.text}
                            {msg.isStopped && <span style={{ color: '#ff4444', fontWeight: 'bold' }}> [중단됨]</span>}
                        </div>
                    </div>
                ))}
                {loading && <div className="loading-indicator">{isThinking ? "Thinking..." : "Typing..."}</div>}
            </div>

            <div className="input-area">
                <div className="input-wrapper">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ask anything..."
                        rows={1}
                        style={{ height: 'auto' }}
                    />
                    <button onClick={handleSend} id="send-btn" className={loading ? 'stop-mode' : ''}>
                        {loading ? (
                            // Stop Icon
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                            </svg>
                        ) : (
                            // Send Icon
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Chat;
