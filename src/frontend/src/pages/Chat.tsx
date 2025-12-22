
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

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
        <div className="w-full max-w-[800px] h-screen flex flex-col bg-[#202020] border-x-4 border-black mx-auto">
            <header className="p-5 border-b-4 border-black flex items-center justify-between gap-4 shadow-[0_4px_0_rgba(0,0,0,0.2)] z-10 shrink-0" style={{ backgroundColor: '#f7d51d' }}>
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center justify-center w-8 h-8 p-0 no-underline bg-white border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-transform hover:bg-gray-100">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="black" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                            <rect x="6" y="2" width="2" height="2" />
                            <rect x="4" y="4" width="2" height="2" />
                            <rect x="2" y="6" width="2" height="2" />
                            <rect x="0" y="8" width="2" height="2" />
                            <rect x="2" y="10" width="2" height="2" />
                            <rect x="4" y="12" width="2" height="2" />
                            <rect x="6" y="14" width="2" height="2" />
                            <rect x="6" y="8" width="10" height="2" />
                        </svg>
                    </Link>
                    <h1 className="font-['Press_Start_2P',cursive] text-[20px] text-black m-0 drop-shadow-[2px_2px_0_#fff]">PixelBrain Chat</h1>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 border-2 border-black shadow-[2px_2px_0_#000] transition-colors duration-300 ${isOnline ? 'bg-[#3fb950] shadow-[0_0_4px_#00f,2px_2px_0_#000]' : 'bg-[#f85149]'}`}></div>
                    <span className="font-['Press_Start_2P',cursive] text-[10px] text-black bg-white/10 px-1 rounded drop-shadow-none">{status}</span>
                    <span className="font-['Press_Start_2P',cursive] text-[10px] bg-black text-white px-2.5 py-1.5 ml-1">12B Model</span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 bg-[#404040]" ref={chatContainerRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`max-w-[85%] flex flex-col animate-[fadeIn_0.3s_steps(5)] ${msg.isUser ? 'self-end' : 'self-start'}`}>
                        {/* User: Blue (#4d9be6), AI: Dark Grey (#2d2d3a) */}
                        <div className={`p-4 text-[18px] leading-[1.6] border-[3px] border-black shadow-[4px_4px_0_#000] relative break-words font-['DungGeunMo',sans-serif] ${msg.isUser ? 'bg-[#4d9be6] text-black' : 'bg-[#2d2d3a] text-white'}`}>
                            {msg.text}

                            {/* Thinking State (Empty Message) */}
                            {!msg.isUser && !msg.text && (
                                <span className="animate-pulse" style={{ color: '#f7d51d' }}>Thinking... ▍</span>
                            )}

                            {/* Typing State (Streaming Text) */}
                            {!msg.isUser && msg.text && loading && idx === messages.length - 1 && (
                                <span className="animate-pulse inline-block ml-1">▍</span>
                            )}

                            {msg.isStopped && <span className="text-[#f85149] font-bold"> [중단됨]</span>}
                        </div>
                    </div>
                ))}

                {messages.length === 0 && (
                    <div className="self-start animate-[fadeIn_0.3s_steps(5)] max-w-[85%]">
                        <div className="p-4 text-[18px] leading-[1.6] border-[3px] border-black shadow-[4px_4px_0_#000] relative break-words font-['DungGeunMo',sans-serif] bg-[#2d2d3a] text-white">
                            안녕! 뭐 하고 있어? 😊 궁금한 거나 필요한 거 있으면 언제든지 말해줘.
                        </div>
                    </div>
                )}

                {/* Typing Indicator at Bottom */}
                {loading && !isThinking && (
                    <div className="font-['Press_Start_2P',cursive] text-[12px] mt-2.5 animate-pulse ml-1" style={{ color: '#f7d51d' }}>
                        Typing...
                    </div>
                )}
            </div>

            <div className="p-5 border-t-4 border-black shrink-0" style={{ backgroundColor: '#f7d51d' }}>
                <div className="flex gap-2.5 items-end">
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
                        className="flex-1 bg-white border-[3px] border-black p-4 font-['DungGeunMo',sans-serif] text-[20px] resize-none outline-none shadow-[inset_4px_4px_0_#ccc] text-black h-auto min-h-[60px]"
                    />
                    <button
                        onClick={handleSend}
                        className="flex items-center justify-center border-[3px] border-black p-4 cursor-pointer shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-transform duration-100 w-[60px] h-[60px]"
                        style={{ backgroundColor: loading ? '#e02c2c' : '#4d9be6' }}
                    >
                        {/* Button Icon Color Adjustment */}
                        {loading ? (
                            // Stop Icon (White on Red)
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <rect x="6" y="6" width="12" height="12" fill="white" />
                            </svg>
                        ) : (
                            // Send Icon (Black on Blue)
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
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
