const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Configuration
// Using specific IP for network access
const OLLAMA_API_URL = 'http://192.168.61.249:11434/api/generate';
const MODEL_NAME = 'gemma3:12b';

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

// Send Message Function
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Add User Message
    addMessage(text, true);
    userInput.value = '';
    userInput.style.height = 'auto'; // Reset height

    // 2. Prepare AI Response container
    const { messageDiv, loadingDiv, contentDiv } = createStreamMessage();
    const aiMessageContent = contentDiv; // Keep reference for streaming updates

    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                prompt: text,
                stream: true // Enable streaming
            })
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
                // Remove loading indicator and show content
                if (messageDiv.contains(loadingDiv)) {
                    messageDiv.removeChild(loadingDiv);
                }
                aiMessageContent.style.display = 'block';
                isFirstChunk = false;
            }

            const chunk = decoder.decode(value, { stream: true });
            // Ollama sends multiple JSON objects in one chunk sometimes
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.response) {
                        aiMessageContent.innerText += json.response;
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                    if (json.done) {
                        console.log('Generation complete');
                    }
                } catch (e) {
                    console.error('Error parsing JSON chunk', e);
                }
            }
        }

    } catch (error) {
        // If error occurs, remove loading if present and show error
        if (messageDiv.contains(loadingDiv)) {
            messageDiv.removeChild(loadingDiv);
        }
        aiMessageContent.style.display = 'block';

        const errorContent = document.createElement('div');
        errorContent.innerText = `Error: ${error.message}\nMake sure Ollama is running and OLLAMA_ORIGINS="*" is set if connecting from a browser.`;
        errorContent.style.color = 'red';

        // Replace existing hidden content or append
        aiMessageContent.innerHTML = '';
        aiMessageContent.appendChild(errorContent);
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
