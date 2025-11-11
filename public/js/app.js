class ZenAPIAutomator {
    constructor() {
        this.socket = io();
        this.currentTab = 'dashboard';
        this.workflows = [];
        this.connections = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadConnections();
        this.loadWorkflows();
        this.setupSocketListeners();
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
    }

    async loadConnections() {
        try {
            const response = await fetch('/api/connections');
            this.connections = await response.json();
            this.renderConnections();
        } catch (error) {
            console.error('Failed to load connections:', error);
        }
    }

    async loadWorkflows() {
        try {
            const response = await fetch('/api/workflows');
            this.workflows = await response.json();
        } catch (error) {
            console.error('Failed to load workflows:', error);
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

            const response = await fetch('/api/execute-curl', {
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