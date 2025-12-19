const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Configuration
// Using specific IP for network access
const OLLAMA_API_URL = 'http://192.168.61.249:11434/api/generate';
// URL for checking status (using tags endpoint which is lightweight)
const OLLAMA_STATUS_URL = 'http://192.168.61.249:11434/api/tags';
const MODEL_NAME = 'gemma3:12b';

const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// Connection Checker
async function checkConnection() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

        const response = await fetch(OLLAMA_STATUS_URL, {
            method: 'GET',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            updateStatus(true);
        } else {
            updateStatus(false);
        }
    } catch (e) {
        updateStatus(false);
    }
}

function updateStatus(isOnline) {
    if (isOnline) {
        statusDot.classList.remove('offline');
        statusDot.classList.add('online');
        statusText.innerText = 'ONLINE';
        statusText.style.color = '#00ff00';
    } else {
        statusDot.classList.remove('online');
        statusDot.classList.add('offline');
        statusText.innerText = 'OFFLINE';
        statusText.style.color = '#ff3333';
    }
}

// Check every 5 seconds
setInterval(checkConnection, 5000);
// Check immediately
checkConnection();

// Helper: Add message to UI
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'ai-message');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerText = text; // Using innerText for simple text rendering

    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);

    // Auto scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return contentDiv;
}

// Helper: Create a loading stream message
function createStreamMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'ai-message');

    // Add Loading Indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.innerText = 'THINKING...';
    messageDiv.appendChild(loadingDiv);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.style.display = 'none'; // Hide content initially

    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return { messageDiv, loadingDiv, contentDiv };
}

// State
let abortController = null;

// Icons
const SEND_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
const STOP_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`;

// Send Message Function
async function sendMessage() {
    // 1. Check if we need to STOP
    if (abortController) {
        abortController.abort();
        abortController = null;
        sendBtn.innerHTML = SEND_ICON;
        return;
    }

    const text = userInput.value.trim();
    if (!text) return;

    // 2. Start New Message
    addMessage(text, true);
    userInput.value = '';
    userInput.style.height = 'auto';

    // UI: Change to Stop Button
    sendBtn.innerHTML = STOP_ICON;

    // Prepare AI Response container
    const { messageDiv, loadingDiv, contentDiv } = createStreamMessage();
    const aiMessageContent = contentDiv;

    // Create new abort controller for this request
    abortController = new AbortController();

    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                prompt: text,
                stream: true
            }),
            signal: abortController.signal // Link abort signal
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let isFirstChunk = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (isFirstChunk) {
                if (messageDiv.contains(loadingDiv)) {
                    messageDiv.removeChild(loadingDiv);
                }
                aiMessageContent.style.display = 'block';
                isFirstChunk = false;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.response) {
                        aiMessageContent.innerText += json.response;
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                } catch (e) {
                    console.error('Error parsing JSON chunk', e);
                }
            }
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            // User stopped manually - Remove loading if present
            if (messageDiv.contains(loadingDiv)) {
                messageDiv.removeChild(loadingDiv);
            }
            // Show whatever was generated so far
            aiMessageContent.style.display = 'block';

            // Add Stop Indicator
            const stopIndicator = document.createElement('span');
            stopIndicator.innerText = ' [중단됨]';
            stopIndicator.style.color = '#ff4444';
            stopIndicator.style.fontWeight = 'bold';
            stopIndicator.style.fontSize = '0.9em';
            aiMessageContent.appendChild(stopIndicator);

            console.log('Generation stopped by user');
        } else {
            // Real Error
            if (messageDiv.contains(loadingDiv)) {
                messageDiv.removeChild(loadingDiv);
            }
            aiMessageContent.style.display = 'block';

            const errorContent = document.createElement('div');
            errorContent.innerText = `Error: ${error.message}`;
            errorContent.style.color = 'red';

            aiMessageContent.innerHTML = '';
            aiMessageContent.appendChild(errorContent);
        }
    } finally {
        // Reset UI back to Send State
        abortController = null;
        sendBtn.innerHTML = SEND_ICON;
    }
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
