class ZenAPIAutomator {
    constructor() {
        this.socket = null;
        this.currentTab = 'dashboard';
        this.workflows = [];
        this.connections = [];
        this.chatMessages = [];
        this.isTyping = false;
        this.apiBase = '/api'; // Updated for Netlify functions
        this.botApiBase = '/bot'; // Bot API endpoints
        this.botStatus = null;
        this.botHistory = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadConnections();
        this.loadWorkflows();
        this.setupSocketListeners();
        this.initChat();
        this.initBotControl();
        this.checkMobileView();
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        this.setupDragAndDrop();
    }

    setupSocketListeners() {
        this.socket.on('workflow-result', (result) => {
            console.log('Workflow result:', result);
            this.showNotification('Workflow completed successfully', 'success');
        });

        this.socket.on('workflow-error', (error) => {
            console.error('Workflow error:', error);
            this.showNotification('Workflow failed: ' + error.error, 'error');
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        this.currentTab = tabName;
        
        // Hide chat notification when switching to chat tab
        if (tabName === 'ai-chat') {
            this.hideChatNotification();
        }
    }

    async loadConnections() {
        try {
            const response = await fetch(`${this.apiBase}/connections`);
            if (!response.ok) throw new Error('Failed to load connections');
            this.connections = await response.json();
            this.renderConnections();
        } catch (error) {
            console.error('Failed to load connections:', error);
            this.showNotification('Failed to load connections', 'error');
        }
    }

    async loadWorkflows() {
        try {
            const response = await fetch(`${this.apiBase}/workflows`);
            if (!response.ok) throw new Error('Failed to load workflows');
            this.workflows = await response.json();
        } catch (error) {
            console.error('Failed to load workflows:', error);
            this.showNotification('Failed to load workflows', 'error');
        }
    }

    renderConnections() {
        const grid = document.getElementById('connectionsGrid');
        if (!grid) return;

        grid.innerHTML = this.connections.map(conn => `
            <div class="connection-card ${conn.status}">
                <div class="connection-header">
                    <h3>${conn.name}</h3>
                    <span class="connection-status ${conn.status}">${conn.status}</span>
                </div>
                <p>Type: ${conn.type}</p>
                <div class="form-actions">
                    <button class="btn primary" onclick="testConnection('${conn.id}')">
                        <i class="fas fa-plug"></i> Test
                    </button>
                    <button class="btn secondary" onclick="editConnection('${conn.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupDragAndDrop() {
        const components = document.querySelectorAll('.component');
        const canvas = document.getElementById('workflowCanvas');

        components.forEach(component => {
            component.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('component-type', e.target.dataset.type);
                e.target.style.opacity = '0.5';
            });

            component.addEventListener('dragend', (e) => {
                e.target.style.opacity = '';
            });
        });

        if (canvas) {
            canvas.addEventListener('dragover', (e) => {
                e.preventDefault();
                canvas.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
            });

            canvas.addEventListener('dragleave', (e) => {
                canvas.style.backgroundColor = '';
            });

            canvas.addEventListener('drop', (e) => {
                e.preventDefault();
                canvas.style.backgroundColor = '';
                
                const componentType = e.dataTransfer.getData('component-type');
                this.addWorkflowComponent(componentType, e.offsetX, e.offsetY);
            });
        }
    }

    addWorkflowComponent(type, x, y) {
        const canvas = document.getElementById('workflowCanvas');
        const placeholder = canvas.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }

        const component = document.createElement('div');
        component.className = 'workflow-component';
        component.style.left = x + 'px';
        component.style.top = y + 'px';
        component.innerHTML = `
            <div class="component-header">
                <i class="fas ${this.getComponentIcon(type)}"></i>
                <span>${this.getComponentName(type)}</span>
                <button class="remove-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="component-config">
                ${this.getComponentConfig(type)}
            </div>
        `;

        canvas.appendChild(component);
        this.showNotification(`${this.getComponentName(type)} added to workflow`, 'success');
    }

    getComponentIcon(type) {
        const icons = {
            curl: 'fa-terminal',
            phone_call: 'fa-phone',
            website: 'fa-globe',
            condition: 'fa-code-branch',
            delay: 'fa-clock'
        };
        return icons[type] || 'fa-cube';
    }

    getComponentName(type) {
        const names = {
            curl: 'cURL Request',
            phone_call: 'Phone Call',
            website: 'Website',
            condition: 'Condition',
            delay: 'Delay'
        };
        return names[type] || 'Component';
    }

    getComponentConfig(type) {
        const configs = {
            curl: `
                <input type="text" placeholder="URL" class="component-input">
                <select class="component-input">
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                </select>
            `,
            phone_call: `
                <input type="tel" placeholder="Phone Number" class="component-input">
                <select class="component-input">
                    <option>Analyze</option>
                    <option>Record</option>
                    <option>Transcribe</option>
                </select>
            `,
            website: `
                <input type="text" placeholder="Domain" class="component-input">
                <select class="component-input">
                    <option>Modern</option>
                    <option>Classic</option>
                    <option>Landing</option>
                </select>
            `
        };
        return configs[type] || '<p>Configuration options</p>';
    }

    async executeCurl() {
        const method = document.getElementById('curlMethod').value;
        const url = document.getElementById('curlUrl').value;
        const headersText = document.getElementById('curlHeaders').value;
        const bodyText = document.getElementById('curlBody').value;

        if (!url) {
            this.showNotification('Please enter a URL', 'error');
            return;
        }

        try {
            const headers = headersText ? JSON.parse(headersText) : {};
            const body = bodyText ? JSON.parse(bodyText) : undefined;

            const response = await fetch(`${this.apiBase}/execute-curl`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    method,
                    url,
                    headers,
                    data: body
                })
            });

            if (!response.ok) throw new Error('Request failed');
            
            const result = await response.json();
            this.displayCurlResult(result);
        } catch (error) {
            this.showNotification('Invalid JSON in headers or body', 'error');
        }
    }

    displayCurlResult(result) {
        const resultDiv = document.getElementById('curlResult');
        const responsePre = document.getElementById('curlResponse');

        resultDiv.style.display = 'block';
        responsePre.textContent = JSON.stringify(result, null, 2);

        if (result.success) {
            this.showNotification('Request executed successfully', 'success');
        } else {
            this.showNotification('Request failed: ' + result.error, 'error');
        }
    }

    generateCurlCommand() {
        const method = document.getElementById('curlMethod').value;
        const url = document.getElementById('curlUrl').value;
        const headersText = document.getElementById('curlHeaders').value;
        const bodyText = document.getElementById('curlBody').value;

        if (!url) {
            this.showNotification('Please enter a URL', 'error');
            return;
        }

        let curlCommand = `curl -X ${method} "${url}"`;

        if (headersText) {
            try {
                const headers = JSON.parse(headersText);
                Object.entries(headers).forEach(([key, value]) => {
                    curlCommand += ` \\\n  -H "${key}: ${value}"`;
                });
            } catch (error) {
                this.showNotification('Invalid JSON in headers', 'error');
                return;
            }
        }

        if (bodyText && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            curlCommand += ` \\\n  -d '${bodyText}'`;
        }

        navigator.clipboard.writeText(curlCommand).then(() => {
            this.showNotification('cURL command copied to clipboard', 'success');
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--primary)'};
            color: white;
            border-radius: 0.5rem;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Chat functionality
    initChat() {
        this.loadChatHistory();
        this.setupChatEventListeners();
    }

    setupChatEventListeners() {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('input', () => {
                this.autoResizeTextarea(chatInput);
            });
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message || this.isTyping) return;
        
        this.addMessageToChat(message, 'user');
        input.value = '';
        this.autoResizeTextarea(input);
        
        this.showTypingIndicator();
        this.isTyping = true;
        
        try {
            const response = await this.callAI(message);
            this.hideTypingIndicator();
            this.addMessageToChat(response, 'ai');
            this.isTyping = false;
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessageToChat('Sorry, I encountered an error. Please try again.', 'ai');
            this.isTyping = false;
        }
    }

    async callAI(message) {
        try {
            const response = await fetch(`${this.apiBase}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    conversationHistory: this.chatMessages.slice(-10) // Last 10 messages for context
                })
            });
            
            if (!response.ok) {
                throw new Error('AI service unavailable');
            }
            
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('AI API Error:', error);
            // Fallback to local responses if API fails
            return this.getFallbackResponse(message);
        }
    }

    getFallbackResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('create') && lowerMessage.includes('workflow')) {
            return "I'll help you create a new workflow! Let me guide you through the process:\n\n1. **Choose a trigger** - What should start this workflow?\n2. **Add actions** - What should happen when triggered?\n3. **Configure connections** - Which APIs do you need?\n4. **Test and deploy** - Let's make sure everything works\n\nWhat type of workflow would you like to create?";
        }
        
        if (lowerMessage.includes('connect') || lowerMessage.includes('api')) {
            return "I can help you connect any API! Here's what I need to know:\n\n**Required Information:**\n- API name and documentation URL\n- Authentication method (API key, OAuth, etc.)\n- Base URL\n- Rate limits\n\nWhich API would you like to connect?";
        }
        
        if (lowerMessage.includes('debug') || lowerMessage.includes('error')) {
            return "I'll help you debug your workflow! Let me analyze the common issues:\n\n**Things to check:**\n1. **Connection status** - Are all APIs connected?\n2. **Authentication** - Are credentials valid?\n3. **Data flow** - Is data passing correctly between steps?\n4. **Error handling** - Are failures being caught?\n\nWhat specific error are you seeing?";
        }
        
        if (lowerMessage.includes('example') || lowerMessage.includes('template')) {
            return "Here are some powerful workflow examples:\n\n**🔄 Data Sync Workflow**\n- Trigger: Schedule (every hour)\n- Action: Get data from API A\n- Action: Transform data\n- Action: Send to API B\n\n**📧 Smart Notifications**\n- Trigger: Webhook from app\n- Condition: Check priority\n- Action: Send email/SMS\n\nWhich example interests you most?";
        }
        
        return "I'm here to help with API automation! I can assist with workflow creation, API connections, debugging, and optimization. What would you like to work on?";
    }

    addMessageToChat(message, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${sender === 'ai' ? 'robot' : 'user'}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${this.formatMessage(message)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        this.chatMessages.push({ message, sender, time });
        this.saveChatHistory();
        
        // Show notification if not on chat tab
        if (this.currentTab !== 'ai-chat' && sender === 'ai') {
            this.showChatNotification();
        }
    }

    formatMessage(message) {
        // Convert URLs to links
        message = message.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        
        // Convert line breaks to <br>
        message = message.replace(/\n/g, '<br>');
        
        // Bold text between ** **
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic text between * *
        message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return message;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    showChatNotification() {
        const badge = document.getElementById('chatNotification');
        const floatingBadge = document.getElementById('floatingNotification');
        
        if (badge) {
            badge.style.display = 'flex';
            badge.textContent = '1';
        }
        
        if (floatingBadge) {
            floatingBadge.style.display = 'flex';
            floatingBadge.textContent = '1';
        }
    }

    hideChatNotification() {
        const badge = document.getElementById('chatNotification');
        const floatingBadge = document.getElementById('floatingNotification');
        
        if (badge) badge.style.display = 'none';
        if (floatingBadge) floatingBadge.style.display = 'none';
    }

    saveChatHistory() {
        try {
            localStorage.setItem('zenChatHistory', JSON.stringify(this.chatMessages));
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    }

    loadChatHistory() {
        try {
            const saved = localStorage.getItem('zenChatHistory');
            if (saved) {
                this.chatMessages = JSON.parse(saved);
                // Only load recent messages (last 20)
                const recentMessages = this.chatMessages.slice(-20);
                recentMessages.forEach(msg => {
                    this.addMessageToChat(msg.message, msg.sender);
                });
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }

    clearChat() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = '';
        this.chatMessages = [];
        localStorage.removeItem('zenChatHistory');
        
        // Add welcome message back
        this.addMessageToChat("Chat cleared! How can I help you today?", 'ai');
    }

    exportChat() {
        const chatText = this.chatMessages.map(msg => 
            `[${msg.time}] ${msg.sender.toUpperCase()}: ${msg.message}`
        ).join('\n\n');
        
        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zen-chat-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Chat exported successfully', 'success');
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    // Bot Control Functions
    initBotControl() {
        this.refreshBotStatus();
        this.loadBotHistory();
        
        // Auto-refresh bot status every 30 seconds
        setInterval(() => {
            if (this.currentTab === 'bot-control') {
                this.refreshBotStatus();
            }
        }, 30000);
    }

    async refreshBotStatus() {
        try {
            const response = await fetch(`${this.botApiBase}/status`);
            if (!response.ok) throw new Error('Failed to get bot status');
            
            const status = await response.json();
            this.updateBotStatus(status);
            
        } catch (error) {
            console.error('Failed to refresh bot status:', error);
            this.addBotLogEntry('Failed to refresh bot status', 'error');
        }
    }

    updateBotStatus(status) {
        this.botStatus = status;
        
        // Update UI elements
        const statusValue = document.getElementById('botStatusValue');
        const uptime = document.getElementById('botUptime');
        const messages = document.getElementById('botMessages');
        const queue = document.getElementById('botQueue');
        const mainStatus = document.getElementById('botMainStatus');
        const statusIndicator = document.getElementById('botStatusIndicator');
        
        if (statusValue) statusValue.textContent = status.status || 'Unknown';
        if (uptime) uptime.textContent = this.formatUptime(status.uptime || 0);
        if (messages) messages.textContent = status.messageCount || 0;
        if (queue) queue.textContent = status.queueLength || 0;
        
        // Update status indicators
        const isOnline = status.status === 'online';
        if (mainStatus) {
            mainStatus.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
        }
        if (statusIndicator) {
            statusIndicator.className = `status-indicator-bot ${isOnline ? 'online' : 'offline'}`;
        }
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    async loadBotHistory() {
        try {
            const response = await fetch(`${this.botApiBase}/history?limit=20`);
            if (!response.ok) throw new Error('Failed to load bot history');
            
            const data = await response.json();
            this.botHistory = data.history || [];
            this.updateBotActivityLog();
            
        } catch (error) {
            console.error('Failed to load bot history:', error);
        }
    }

    updateBotActivityLog() {
        const logContainer = document.getElementById('botActivityLog');
        if (!logContainer) return;
        
        logContainer.innerHTML = this.botHistory.slice(-10).reverse().map(entry => `
            <div class="log-entry">
                <span class="log-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span class="log-message">${entry.type === 'user' ? '👤 User:' : '🤖 Bot:'} ${entry.message}</span>
            </div>
        `).join('');
    }

    async sendBotCommand(command = null) {
        const input = document.getElementById('botCommandInput');
        const message = command || input.value.trim();
        
        if (!message) return;
        
        if (!command) {
            input.value = '';
            this.autoResizeTextarea(input);
        }
        
        this.addBotLogEntry(`Sending command: ${message}`, 'info');
        
        try {
            const response = await fetch(`${this.botApiBase}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    userId: 'web-user'
                })
            });
            
            if (!response.ok) throw new Error('Failed to send command');
            
            const data = await response.json();
            
            if (data.success) {
                this.addBotLogEntry(`Bot response: ${data.response.substring(0, 100)}...`, 'success');
                this.showNotification(data.response, 'success');
                this.refreshBotStatus();
            } else {
                this.addBotLogEntry(`Bot error: ${data.error}`, 'error');
                this.showNotification(data.error, 'error');
            }
            
        } catch (error) {
            console.error('Failed to send bot command:', error);
            this.addBotLogEntry(`Command failed: ${error.message}`, 'error');
            this.showNotification('Failed to send command to bot', 'error');
        }
    }

    addBotLogEntry(message, type = 'info') {
        const logContainer = document.getElementById('botActivityLog');
        if (!logContainer) return;
        
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-time">${new Date().toLocaleTimeString()}</span>
            <span class="log-message">${message}</span>
        `;
        
        logContainer.insertBefore(entry, logContainer.firstChild);
        
        // Keep only last 20 entries
        while (logContainer.children.length > 20) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }

    async clearBotHistory() {
        if (!confirm('Are you sure you want to clear bot history?')) return;
        
        try {
            // Clear local display
            const logContainer = document.getElementById('botActivityLog');
            if (logContainer) {
                logContainer.innerHTML = `
                    <div class="log-entry">
                        <span class="log-time">${new Date().toLocaleTimeString()}</span>
                        <span class="log-message">Bot history cleared</span>
                    </div>
                `;
            }
            
            this.showNotification('Bot history cleared', 'success');
            
        } catch (error) {
            console.error('Failed to clear bot history:', error);
            this.showNotification('Failed to clear bot history', 'error');
        }
    }

    checkMobileView() {
        const floatingBtn = document.getElementById('floatingChatBtn');
        if (window.innerWidth <= 768) {
            if (floatingBtn) floatingBtn.style.display = 'flex';
        } else {
            if (floatingBtn) floatingBtn.style.display = 'none';
        }
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .workflow-component {
        position: absolute;
        background: white;
        border: 2px solid var(--primary);
        border-radius: 0.5rem;
        padding: 1rem;
        min-width: 200px;
        box-shadow: var(--shadow);
        cursor: move;
    }
    
    .component-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        font-weight: 600;
    }
    
    .remove-btn {
        margin-left: auto;
        background: var(--error);
        color: white;
        border: none;
        border-radius: 0.25rem;
        padding: 0.25rem 0.5rem;
        cursor: pointer;
    }
    
    .component-config {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .component-input {
        padding: 0.5rem;
        border: 1px solid var(--border);
        border-radius: 0.25rem;
        font-size: 0.875rem;
    }
`;
document.head.appendChild(style);

const app = new ZenAPIAutomator();

function createNewWorkflow() {
    app.showNotification('Workflow builder activated', 'success');
    app.switchTab('workflows');
}

function addConnection() {
    app.showNotification('Connection dialog coming soon', 'info');
}

function testConnection(id) {
    app.showNotification(`Testing connection ${id}...`, 'info');
}

function editConnection(id) {
    app.showNotification(`Editing connection ${id}...`, 'info');
}

function executeCurl() {
    app.executeCurl();
}

function generateCurlCommand() {
    app.generateCurlCommand();
}

// Chat functions
function sendMessage() {
    app.sendMessage();
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        app.sendMessage();
    }
}

function sendQuickMessage(message) {
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = message;
        app.sendMessage();
    }
}

function clearChat() {
    app.clearChat();
}

function exportChat() {
    app.exportChat();
}

function toggleChat() {
    const chatTab = document.getElementById('ai-chat');
    const chatBtn = document.getElementById('aiChatBtn');
    
    if (chatTab && chatBtn) {
        app.switchTab('ai-chat');
        app.hideChatNotification();
    }
}

// Bot dialog functions
function showPhoneDialog() {
    document.getElementById('phoneDialog').style.display = 'flex';
}

function closePhoneDialog() {
    document.getElementById('phoneDialog').style.display = 'none';
}

function showApiDialog() {
    document.getElementById('apiDialog').style.display = 'flex';
}

function closeApiDialog() {
    document.getElementById('apiDialog').style.display = 'none';
}

async function executePhoneCall() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const message = document.getElementById('callMessage').value.trim();
    
    if (!phoneNumber) {
        app.showNotification('Please enter a phone number', 'error');
        return;
    }
    
    const command = message ? `Call ${phoneNumber} and say "${message}"` : `Call ${phoneNumber}`;
    
    closePhoneDialog();
    await app.sendBotCommand(command);
}

async function executeApiRequest() {
    const method = document.getElementById('apiMethod').value;
    const url = document.getElementById('apiUrl').value.trim();
    const headers = document.getElementById('apiHeaders').value.trim();
    const data = document.getElementById('apiData').value.trim();
    
    if (!url) {
        app.showNotification('Please enter a URL', 'error');
        return;
    }
    
    let command = `Make ${method} request to ${url}`;
    if (headers) command += ` with headers ${headers}`;
    if (data) command += ` with data ${data}`;
    
    closeApiDialog();
    await app.sendBotCommand(command);
}

function handleBotCommandKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        app.sendBotCommand();
    }
}

// Handle window resize for mobile chat
window.addEventListener('resize', () => {
    if (app) app.checkMobileView();
});

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});