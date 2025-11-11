// Simple Zen API Automator - Teen Friendly Version
class ZenAPI {
    constructor() {
        this.stats = {
            calls: 0,
            apiRequests: 0,
            success: 0,
            total: 0
        };
        this.activity = [];
        this.init();
    }

    init() {
        this.loadStats();
        this.setupEventListeners();
        this.updateActivityTimeline();
    }

    setupEventListeners() {
        // Add ripple effects to buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', this.createRipple);
        });
    }

    createRipple(e) {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    // Main Prompt Box Functions
    async executeMainPrompt() {
        const input = document.getElementById('mainPromptInput');
        const prompt = input.value.trim();
        
        if (!prompt) {
            this.showNotification('Please enter what you want to do!', 'error');
            return;
        }

        this.showLoading('Working on it...');
        this.addToActivity('Processing request', prompt, 'processing');

        try {
            // Send to bot backend
            const response = await fetch('/bot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: prompt,
                    userId: 'zen-user'
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Done! ✨', 'success');
                this.addToActivity('Success', data.response, 'success');
                input.value = '';
                
                // Update stats
                this.stats.total++;
                this.stats.success++;
                this.updateStats();
            } else {
                throw new Error(data.error || 'Something went wrong');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
            this.addToActivity('Error', error.message, 'error');
            this.stats.total++;
            this.updateStats();
        }

        this.hideLoading();
    }

    handleMainPrompt(event) {
        if (event.key === 'Enter') {
            this.executeMainPrompt();
        }
    }

    setPrompt(text) {
        const input = document.getElementById('mainPromptInput');
        input.value = text;
        input.focus();
    }

    updatePromptSuggestions(value) {
        // Could add dynamic suggestions here based on typing
        const suggestions = document.getElementById('promptSuggestions');
        if (value.length > 2) {
            suggestions.style.display = 'block';
        } else {
            suggestions.style.display = 'none';
        }
    }

    quickAction(type) {
        switch(type) {
            case 'phone':
                this.switchTab('phone');
                this.setPrompt('Call +1-555-123-4567');
                break;
            case 'api':
                this.switchTab('api');
                this.setPrompt('Send API request to https://api.github.com');
                break;
            case 'bot':
                this.switchTab('bot');
                break;
        }
    }

    // Tab Switching
    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    // Phone Functions
    async makePhoneCall() {
        const phoneInput = document.getElementById('phoneNumberInput');
        const messageInput = document.getElementById('callMessageInput');
        const phoneNumber = phoneInput.value.trim();
        const message = messageInput.value.trim();

        if (!phoneNumber) {
            this.showNotification('Please enter a phone number!', 'error');
            return;
        }

        this.showLoading('Making call...');
        this.addToActivity('Phone Call', `Calling ${phoneNumber}`, 'processing');

        try {
            const command = message ? `Call ${phoneNumber} and say "${message}"` : `Call ${phoneNumber}`;
            
            const response = await fetch('/bot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: command,
                    userId: 'zen-user'
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Call initiated! 📞', 'success');
                this.addToActivity('Call Successful', phoneNumber, 'success');
                this.stats.calls++;
                this.stats.total++;
                this.stats.success++;
                this.updateStats();
                
                // Add to recent calls
                this.addRecentCall(phoneNumber, message);
            } else {
                throw new Error(data.error || 'Call failed');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
            this.addToActivity('Call Failed', error.message, 'error');
            this.stats.total++;
            this.updateStats();
        }

        this.hideLoading();
    }

    quickCall(number) {
        document.getElementById('phoneNumberInput').value = number;
        this.makePhoneCall();
    }

    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value.length <= 3) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
        }
        input.value = value;
    }

    addRecentCall(phoneNumber, message) {
        const callsList = document.getElementById('callsList');
        const callItem = document.createElement('div');
        callItem.className = 'call-item';
        callItem.innerHTML = `
            <div class="call-icon">
                <i class="fas fa-phone"></i>
            </div>
            <div class="call-info">
                <div class="call-number">${phoneNumber}</div>
                <div class="call-message">${message || 'No message'}</div>
                <div class="call-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        
        // Remove empty state if it exists
        const emptyState = callsList.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        callsList.insertBefore(callItem, callsList.firstChild);
    }

    // API Functions
    async sendApiRequest() {
        const urlInput = document.getElementById('apiUrlInput');
        const dataInput = document.getElementById('apiDataInput');
        const method = document.querySelector('.method-btn.active').dataset.method;
        const url = urlInput.value.trim();
        const data = dataInput.value.trim();

        if (!url) {
            this.showNotification('Please enter an API URL!', 'error');
            return;
        }

        this.showLoading('Sending request...');
        this.addToActivity('API Request', `${method} ${url}`, 'processing');

        try {
            const command = `Make ${method} request to ${url}`;
            if (data) command += ` with data ${data}`;
            
            const response = await fetch('/bot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: command,
                    userId: 'zen-user'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('API request sent! 🌐', 'success');
                this.addToActivity('API Success', url, 'success');
                this.stats.apiRequests++;
                this.stats.total++;
                this.stats.success++;
                this.updateStats();
                
                // Show response
                this.showApiResponse(result.response);
            } else {
                throw new Error(result.error || 'API request failed');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
            this.addToActivity('API Failed', error.message, 'error');
            this.stats.total++;
            this.updateStats();
        }

        this.hideLoading();
    }

    showApiResponse(response) {
        const responseDiv = document.getElementById('apiResponse');
        const responseContent = document.getElementById('responseContent');
        
        responseContent.textContent = response;
        responseDiv.style.display = 'block';
    }

    selectMethod(method) {
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('active');
        
        // Show/hide data input based on method
        const dataGroup = document.getElementById('dataGroup');
        if (method === 'POST' || method === 'PUT') {
            dataGroup.style.display = 'block';
        } else {
            dataGroup.style.display = 'none';
        }
    }

    tryExample(url, method) {
        document.getElementById('apiUrlInput').value = url;
        this.selectMethod(method);
        this.sendApiRequest();
    }

    // Bot Chat Functions
    async sendBotMessage() {
        const input = document.getElementById('botInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addBotMessage(message, 'user');
        input.value = '';
        
        this.showBotTyping();
        
        try {
            const response = await fetch('/bot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    userId: 'zen-user'
                })
            });

            const data = await response.json();
            
            this.hideBotTyping();
            
            if (data.success) {
                this.addBotMessage(data.response, 'bot');
            } else {
                this.addBotMessage('Sorry, something went wrong. Try again!', 'bot');
            }
        } catch (error) {
            this.hideBotTyping();
            this.addBotMessage('Connection error. Check your internet!', 'bot');
        }
    }

    handleBotInput(event) {
        if (event.key === 'Enter') {
            this.sendBotMessage();
        }
    }

    addBotMessage(message, sender) {
        const messagesContainer = document.getElementById('botMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${sender === 'bot' ? 'robot' : 'user'}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${message}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    sendQuickCommand(command) {
        const input = document.getElementById('botInput');
        input.value = command;
        this.sendBotMessage();
    }

    clearBotChat() {
        const messagesContainer = document.getElementById('botMessages');
        messagesContainer.innerHTML = `
            <div class="message bot-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">
                        Chat cleared! How can I help you? 👋
                    </div>
                    <div class="message-time">Just now</div>
                </div>
            </div>
        `;
    }

    showBotTyping() {
        const messagesContainer = document.getElementById('botMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message';
        typingDiv.id = 'botTyping';
        
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

    hideBotTyping() {
        const typingIndicator = document.getElementById('botTyping');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Activity Timeline
    addToActivity(title, description, type) {
        const timeline = document.getElementById('activityTimeline');
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const iconClass = type === 'success' ? 'fa-check' : type === 'error' ? 'fa-times' : 'fa-clock';
        const iconType = type === 'success' ? 'success' : type === 'error' ? 'error' : 'processing';
        
        activityItem.innerHTML = `
            <div class="activity-icon ${iconType}">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="activity-content">
                <h4>${title}</h4>
                <p>${description}</p>
                <span class="activity-time">Just now</span>
            </div>
        `;
        
        timeline.insertBefore(activityItem, timeline.firstChild);
        
        // Keep only last 10 activities
        while (timeline.children.length > 10) {
            timeline.removeChild(timeline.lastChild);
        }
        
        this.activity.unshift({ title, description, type, time: new Date() });
        this.saveActivity();
    }

    updateActivityTimeline() {
        const timeline = document.getElementById('activityTimeline');
        if (this.activity.length === 0) {
            timeline.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon success">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="activity-content">
                        <h4>Welcome to Zen API!</h4>
                        <p>Start by typing what you want to do above</p>
                        <span class="activity-time">Just now</span>
                    </div>
                </div>
            `;
        } else {
            this.activity.forEach(item => {
                this.addToActivity(item.title, item.description, item.type);
            });
        }
    }

    // Stats Functions
    updateStats() {
        document.getElementById('totalCalls').textContent = this.stats.calls;
        document.getElementById('totalApiCalls').textContent = this.stats.apiRequests;
        
        const successRate = this.stats.total > 0 ? 
            Math.round((this.stats.success / this.stats.total) * 100) : 100;
        document.getElementById('successRate').textContent = successRate + '%';
        
        this.saveStats();
    }

    loadStats() {
        const saved = localStorage.getItem('zenStats');
        if (saved) {
            this.stats = JSON.parse(saved);
            this.updateStats();
        }
        
        const savedActivity = localStorage.getItem('zenActivity');
        if (savedActivity) {
            this.activity = JSON.parse(savedActivity);
        }
    }

    saveStats() {
        localStorage.setItem('zenStats', JSON.stringify(this.stats));
    }

    saveActivity() {
        localStorage.setItem('zenActivity', JSON.stringify(this.activity.slice(0, 20)));
    }

    // UI Helper Functions
    showLoading(text = 'Working on it...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        loadingText.textContent = text;
        overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = 'none';
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('successNotification');
        const notificationText = document.getElementById('successText');
        
        notificationText.textContent = message;
        notification.className = `success-notification ${type}`;
        notification.style.display = 'flex';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Global Functions for HTML onclick handlers
let zenAPI;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    zenAPI = new ZenAPI();
});

// Tab switching
function switchTab(tabName) {
    zenAPI.switchTab(tabName);
}

// Main prompt functions
function executeMainPrompt() {
    zenAPI.executeMainPrompt();
}

function handleMainPrompt(event) {
    zenAPI.handleMainPrompt(event);
}

function setPrompt(text) {
    zenAPI.setPrompt(text);
}

function updatePromptSuggestions(value) {
    zenAPI.updatePromptSuggestions(value);
}

function quickAction(type) {
    zenAPI.quickAction(type);
}

// Phone functions
function makePhoneCall() {
    zenAPI.makePhoneCall();
}

function quickCall(number) {
    zenAPI.quickCall(number);
}

function formatPhoneNumber(input) {
    zenAPI.formatPhoneNumber(input);
}

// API functions
function sendApiRequest() {
    zenAPI.sendApiRequest();
}

function selectMethod(method) {
    zenAPI.selectMethod(method);
}

function tryExample(url, method) {
    zenAPI.tryExample(url, method);
}

// Bot functions
function sendBotMessage() {
    zenAPI.sendBotMessage();
}

function handleBotInput(event) {
    zenAPI.handleBotInput(event);
}

function sendQuickCommand(command) {
    zenAPI.sendQuickCommand(command);
}

function clearBotChat() {
    zenAPI.clearBotChat();
}

// Message character count
function updateMessageCharCount() {
    const input = document.getElementById('callMessageInput');
    const count = document.getElementById('messageCharCount');
    if (input && count) {
        count.textContent = input.value.length;
    }
}

// Add character count listener
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('callMessageInput');
    if (messageInput) {
        messageInput.addEventListener('input', updateMessageCharCount);
    }
});