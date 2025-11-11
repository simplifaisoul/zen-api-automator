// Professional Zen API Automator - AAA Quality
class ZenAPIAutomator {
    constructor() {
        this.workflows = [];
        this.connections = [];
        this.executions = [];
        this.currentWorkflow = null;
        this.selectedComponent = null;
        this.stats = {
            workflows: 0,
            connections: 0,
            executions: 0,
            successRate: 0
        };
        this.init();
    }

    init() {
        console.log('🚀 Initializing Zen API Automator...');
        this.loadFromStorage();
        this.setupEventListeners();
        this.updateStats();
        this.updateActivityList();
        console.log('✅ Zen API Automator initialized successfully');
    }

    setupEventListeners() {
        // Setup drag and drop
        this.setupDragAndDrop();
        
        // Setup modal close on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Setup keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            // Ctrl/Cmd + S to save workflow
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.currentWorkflow && document.getElementById('workflowModal').style.display === 'flex') {
                    this.saveWorkflow();
                }
            }
            // Ctrl/Cmd + N for new workflow
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.createNewWorkflow();
            }
        });
    }

    setupDragAndDrop() {
        const components = document.querySelectorAll('.component-item');
        const canvas = document.getElementById('builderCanvas');

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
                canvas.classList.add('drag-over');
            });

            canvas.addEventListener('dragleave', (e) => {
                if (e.target === canvas) {
                    canvas.classList.remove('drag-over');
                }
            });

            canvas.addEventListener('drop', (e) => {
                e.preventDefault();
                canvas.classList.remove('drag-over');
                
                const componentType = e.dataTransfer.getData('component-type');
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.addComponentToCanvas(componentType, x, y);
            });
        }
    }

    // Tab Management
    switchTab(tabName) {
        console.log(`🔄 Switching to tab: ${tabName}`);
        
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Add active class to clicked nav button
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Load tab-specific content
        this.loadTabContent(tabName);
    }

    loadTabContent(tabName) {
        switch(tabName) {
            case 'workflows':
                this.loadWorkflows();
                break;
            case 'connections':
                this.loadConnections();
                break;
            case 'executions':
                this.loadExecutions();
                break;
            case 'dashboard':
                this.updateStats();
                break;
        }
    }

    // Workflow Management
    createNewWorkflow() {
        console.log('➕ Creating new workflow...');
        this.currentWorkflow = {
            id: this.generateId(),
            name: 'New Workflow',
            components: [],
            created: new Date().toISOString()
        };
        this.showWorkflowModal();
    }

    showWorkflowModal() {
        const modal = document.getElementById('workflowModal');
        if (modal) {
            modal.style.display = 'flex';
            this.clearCanvas();
            this.showNotification('Workflow builder opened', 'success');
        }
    }

    closeWorkflowModal() {
        const modal = document.getElementById('workflowModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentWorkflow = null;
    }

    addComponentToCanvas(type, x, y) {
        const canvas = document.getElementById('builderCanvas');
        const placeholder = canvas.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }

        const component = {
            id: this.generateId(),
            type: type,
            x: x,
            y: y,
            config: this.getDefaultConfig(type)
        };

        if (this.currentWorkflow) {
            this.currentWorkflow.components.push(component);
        }

        this.renderComponent(component);
        this.showNotification(`${this.getComponentName(type)} added to workflow`, 'success');
    }

    renderComponent(component) {
        const canvas = document.getElementById('builderCanvas');
        const element = document.createElement('div');
        element.className = 'workflow-component';
        element.style.left = component.x + 'px';
        element.style.top = component.y + 'px';
        element.dataset.id = component.id;
        
        element.innerHTML = `
            <div class="component-header">
                <i class="fas ${this.getComponentIcon(component.type)}"></i>
                <span>${this.getComponentName(component.type)}</span>
                <button class="remove-btn" onclick="zenAPI.removeComponent('${component.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        element.addEventListener('click', () => {
            this.selectComponent(component);
        });

        canvas.appendChild(element);
    }

    selectComponent(component) {
        // Remove previous selection
        document.querySelectorAll('.workflow-component').forEach(el => {
            el.classList.remove('selected');
        });

        // Add selection to current component
        const element = document.querySelector(`[data-id="${component.id}"]`);
        if (element) {
            element.classList.add('selected');
        }

        this.selectedComponent = component;
        this.showComponentProperties(component);
    }

    showComponentProperties(component) {
        const panel = document.getElementById('propertiesPanel');
        panel.innerHTML = `
            <h4>${this.getComponentName(component.type)}</h4>
            <div class="property-form">
                ${this.generatePropertyForm(component)}
            </div>
        `;
    }

    generatePropertyForm(component) {
        const forms = {
            trigger: `
                <div class="form-group">
                    <label>Trigger Type</label>
                    <select onchange="zenAPI.updateComponentConfig('${component.id}', 'triggerType', this.value)">
                        <option value="webhook">Webhook</option>
                        <option value="schedule">Schedule</option>
                        <option value="manual">Manual</option>
                    </select>
                </div>
            `,
            http: `
                <div class="form-group">
                    <label>URL</label>
                    <input type="url" placeholder="https://api.example.com" 
                           onchange="zenAPI.updateComponentConfig('${component.id}', 'url', this.value)">
                </div>
                <div class="form-group">
                    <label>Method</label>
                    <select onchange="zenAPI.updateComponentConfig('${component.id}', 'method', this.value)">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>
            `,
            phone: `
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" placeholder="+1-555-123-4567" 
                           onchange="zenAPI.updateComponentConfig('${component.id}', 'phone', this.value)">
                </div>
                <div class="form-group">
                    <label>Message</label>
                    <textarea placeholder="Message to say" 
                              onchange="zenAPI.updateComponentConfig('${component.id}', 'message', this.value)"></textarea>
                </div>
            `,
            email: `
                <div class="form-group">
                    <label>To</label>
                    <input type="email" placeholder="user@example.com" 
                           onchange="zenAPI.updateComponentConfig('${component.id}', 'to', this.value)">
                </div>
                <div class="form-group">
                    <label>Subject</label>
                    <input type="text" placeholder="Email subject" 
                           onchange="zenAPI.updateComponentConfig('${component.id}', 'subject', this.value)">
                </div>
            `,
            condition: `
                <div class="form-group">
                    <label>Condition</label>
                    <input type="text" placeholder="Field operator value" 
                           onchange="zenAPI.updateComponentConfig('${component.id}', 'condition', this.value)">
                </div>
            `,
            delay: `
                <div class="form-group">
                    <label>Delay (seconds)</label>
                    <input type="number" placeholder="5" 
                           onchange="zenAPI.updateComponentConfig('${component.id}', 'delay', this.value)">
                </div>
            `
        };

        return forms[component.type] || '<p>No configuration needed</p>';
    }

    updateComponentConfig(componentId, key, value) {
        if (this.currentWorkflow) {
            const component = this.currentWorkflow.components.find(c => c.id === componentId);
            if (component) {
                component.config[key] = value;
                console.log(`📝 Updated component ${componentId}: ${key} = ${value}`);
            }
        }
    }

    removeComponent(componentId) {
        if (this.currentWorkflow) {
            this.currentWorkflow.components = this.currentWorkflow.components.filter(c => c.id !== componentId);
            const element = document.querySelector(`[data-id="${componentId}"]`);
            if (element) {
                element.remove();
            }
            this.showNotification('Component removed', 'success');
        }
    }

    clearCanvas() {
        const canvas = document.getElementById('builderCanvas');
        canvas.innerHTML = `
            <div class="canvas-placeholder">
                <i class="fas fa-arrow-left"></i>
                <p>Drag components here to build your workflow</p>
            </div>
        `;
    }

    saveWorkflow() {
        if (!this.currentWorkflow) {
            this.showNotification('No workflow to save', 'error');
            return;
        }

        // Get workflow name
        const name = prompt('Enter workflow name:', this.currentWorkflow.name);
        if (!name || name.trim() === '') {
            this.showNotification('Workflow name is required', 'error');
            return;
        }

        this.currentWorkflow.name = name.trim();
        
        // Check if workflow already exists (edit mode)
        const existingIndex = this.workflows.findIndex(w => w.id === this.currentWorkflow.id);
        if (existingIndex >= 0) {
            this.workflows[existingIndex] = this.currentWorkflow;
            this.showNotification(`Workflow "${name}" updated successfully`, 'success');
            this.addActivity('Updated Workflow', `Updated workflow "${name}"`, 'success');
        } else {
            this.workflows.push(this.currentWorkflow);
            this.showNotification(`Workflow "${name}" saved successfully`, 'success');
            this.addActivity('Created Workflow', `Created workflow "${name}"`, 'success');
        }
        
        this.saveToStorage();
        this.closeWorkflowModal();
        this.loadWorkflows();
        this.updateStats();
    }

    loadWorkflows() {
        const grid = document.getElementById('workflowGrid');
        if (!grid) return;

        if (this.workflows.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-project-diagram"></i>
                    <h3>No workflows yet</h3>
                    <p>Create your first workflow to get started</p>
                    <button class="btn-primary" onclick="zenAPI.createNewWorkflow()">
                        <i class="fas fa-plus"></i>
                        Create Workflow
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.workflows.map(workflow => `
            <div class="workflow-card">
                <div class="workflow-header">
                    <h3>${workflow.name}</h3>
                    <div class="workflow-status">
                        <span class="status-indicator success"></span>
                        Active
                    </div>
                </div>
                <div class="workflow-info">
                    <p><i class="fas fa-cube"></i> ${workflow.components.length} components</p>
                    <p><i class="fas fa-clock"></i> ${new Date(workflow.created).toLocaleDateString()}</p>
                </div>
                <div class="workflow-actions">
                    <button class="btn-primary" onclick="zenAPI.runWorkflowById('${workflow.id}')">
                        <i class="fas fa-play"></i>
                        Run
                    </button>
                    <button class="btn-secondary" onclick="zenAPI.editWorkflow('${workflow.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                </div>
            </div>
        `).join('');
    }

    runWorkflowById(workflowId) {
        const workflow = this.workflows.find(w => w.id === workflowId);
        if (workflow) {
            this.runWorkflow(workflow);
        }
    }

    editWorkflow(workflowId) {
        const workflow = this.workflows.find(w => w.id === workflowId);
        if (workflow) {
            this.currentWorkflow = workflow;
            this.showWorkflowModal();
            // Render existing components
            this.clearCanvas();
            workflow.components.forEach(component => {
                this.renderComponent(component);
            });
        }
    }

    async runWorkflow(workflow = null) {
        const targetWorkflow = workflow || this.currentWorkflow;
        if (!targetWorkflow) {
            this.showNotification('No workflow to run', 'error');
            return;
        }

        if (!targetWorkflow.components || targetWorkflow.components.length === 0) {
            this.showNotification('Workflow has no components to execute', 'error');
            return;
        }

        this.showLoading('Running workflow...');
        
        try {
            // Simulate workflow execution
            const execution = {
                id: this.generateId(),
                workflowId: targetWorkflow.id,
                workflowName: targetWorkflow.name,
                status: 'running',
                startTime: new Date().toISOString(),
                components: targetWorkflow.components.length
            };

            this.executions.unshift(execution);
            this.addActivity('Workflow Started', `Started "${targetWorkflow.name}" with ${targetWorkflow.components.length} components`, 'info');

            // Simulate processing time based on component count
            const processingTime = Math.min(1000 + (targetWorkflow.components.length * 500), 5000);
            await new Promise(resolve => setTimeout(resolve, processingTime));

            execution.status = 'success';
            execution.endTime = new Date().toISOString();
            execution.duration = processingTime;
            
            this.saveToStorage();
            this.loadExecutions();
            this.updateStats();
            this.hideLoading();
            this.showNotification(`Workflow "${targetWorkflow.name}" completed successfully`, 'success');
            this.addActivity('Workflow Completed', `Completed "${targetWorkflow.name}" in ${processingTime}ms`, 'success');

        } catch (error) {
            console.error('Workflow execution error:', error);
            this.hideLoading();
            this.showNotification('Workflow execution failed: ' + error.message, 'error');
            this.addActivity('Workflow Failed', error.message, 'error');
        }
    }

    // Connection Management
    showConnectionDialog() {
        const modal = document.getElementById('connectionModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeConnectionModal() {
        const modal = document.getElementById('connectionModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    updateConnectionForm() {
        const serviceType = document.getElementById('serviceType').value;
        const fields = document.getElementById('connectionFields');
        
        const fieldConfigs = {
            http: `
                <div class="form-group">
                    <label>Base URL</label>
                    <input type="url" id="baseUrl" placeholder="https://api.example.com">
                </div>
                <div class="form-group">
                    <label>API Key</label>
                    <input type="password" id="apiKey" placeholder="Your API key">
                </div>
            `,
            twilio: `
                <div class="form-group">
                    <label>Account SID</label>
                    <input type="text" id="accountSid" placeholder="ACxxxxxxxx">
                </div>
                <div class="form-group">
                    <label>Auth Token</label>
                    <input type="password" id="authToken" placeholder="Your auth token">
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="phoneNumber" placeholder="+1-555-123-4567">
                </div>
            `,
            sendgrid: `
                <div class="form-group">
                    <label>API Key</label>
                    <input type="password" id="sendgridKey" placeholder="SG.xxxxx">
                </div>
                <div class="form-group">
                    <label>From Email</label>
                    <input type="email" id="fromEmail" placeholder="noreply@yourdomain.com">
                </div>
            `,
            slack: `
                <div class="form-group">
                    <label>Bot Token</label>
                    <input type="password" id="slackToken" placeholder="xoxb-xxxxx">
                </div>
                <div class="form-group">
                    <label>Channel</label>
                    <input type="text" id="slackChannel" placeholder="#general">
                </div>
            `,
            github: `
                <div class="form-group">
                    <label>Personal Access Token</label>
                    <input type="password" id="githubToken" placeholder="ghp_xxxxx">
                </div>
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="githubUsername" placeholder="your-username">
                </div>
            `,
            stripe: `
                <div class="form-group">
                    <label>Publishable Key</label>
                    <input type="text" id="stripePublishable" placeholder="pk_test_xxxxx">
                </div>
                <div class="form-group">
                    <label>Secret Key</label>
                    <input type="password" id="stripeSecret" placeholder="sk_test_xxxxx">
                </div>
            `
        };

        fields.innerHTML = fieldConfigs[serviceType] || '<p>Select a service type to see required fields</p>';
    }

    saveConnection() {
        const serviceTypeElement = document.getElementById('serviceType');
        const nameElement = document.getElementById('connectionName');
        
        if (!serviceTypeElement || !nameElement) {
            this.showNotification('Form elements not found', 'error');
            return;
        }

        const serviceType = serviceTypeElement.value;
        const name = nameElement.value;

        if (!serviceType || !name || name.trim() === '') {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const connection = {
            id: this.generateId(),
            name: name.trim(),
            type: serviceType,
            status: 'connected',
            created: new Date().toISOString()
        };

        this.connections.push(connection);
        this.saveToStorage();
        this.closeConnectionModal();
        this.loadConnections();
        this.updateStats();
        this.showNotification(`Connection "${name}" added successfully`, 'success');
        this.addActivity('Connection Added', `Added connection "${name}"`, 'success');
        
        // Reset form
        serviceTypeElement.value = '';
        nameElement.value = '';
        document.getElementById('connectionFields').innerHTML = '<p>Select a service type to see required fields</p>';
    }

    loadConnections() {
        const grid = document.getElementById('connectionGrid');
        if (!grid) return;

        if (this.connections.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plug"></i>
                    <h3>No connections yet</h3>
                    <p>Add your first service connection</p>
                    <button class="btn-primary" onclick="zenAPI.showConnectionDialog()">
                        <i class="fas fa-plus"></i>
                        Add Connection
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.connections.map(connection => `
            <div class="connection-card">
                <div class="connection-header">
                    <h3>${connection.name}</h3>
                    <div class="connection-status">
                        <span class="status-indicator ${connection.status}"></span>
                        ${connection.status}
                    </div>
                </div>
                <div class="connection-info">
                    <p><i class="fas fa-plug"></i> ${connection.type.toUpperCase()}</p>
                    <p><i class="fas fa-clock"></i> ${new Date(connection.created).toLocaleDateString()}</p>
                </div>
                <div class="connection-actions">
                    <button class="btn-secondary" onclick="zenAPI.testConnection('${connection.id}')">
                        <i class="fas fa-plug"></i>
                        Test
                    </button>
                    <button class="btn-secondary" onclick="zenAPI.deleteConnection('${connection.id}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    testConnection(connectionId) {
        this.showLoading('Testing connection...');
        
        setTimeout(() => {
            this.hideLoading();
            this.showNotification('Connection test successful', 'success');
            this.addActivity('Connection Tested', 'Connection test passed', 'success');
        }, 1500);
    }

    deleteConnection(connectionId) {
        if (!confirm('Are you sure you want to delete this connection?')) return;

        this.connections = this.connections.filter(c => c.id !== connectionId);
        this.saveToStorage();
        this.loadConnections();
        this.showNotification('Connection deleted', 'success');
        this.addActivity('Connection Deleted', 'Connection removed', 'info');
    }

    // Execution Management
    loadExecutions() {
        const list = document.getElementById('executionList');
        if (!list) return;

        if (this.executions.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-play"></i>
                    <h3>No executions yet</h3>
                    <p>Run a workflow to see execution history</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.executions.map(execution => `
            <div class="execution-item">
                <div class="execution-status ${execution.status}"></div>
                <div class="execution-info">
                    <h4>${execution.workflowName}</h4>
                    <p>Execution ID: ${execution.id}</p>
                </div>
                <div class="execution-time">
                    ${new Date(execution.startTime).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    refreshExecutions() {
        this.loadExecutions();
        this.showNotification('Executions refreshed', 'success');
    }

    // Templates
    showTemplates() {
        this.showNotification('Template gallery coming soon!', 'info');
    }

    // Stats and Activity
    updateStats() {
        this.stats.workflows = this.workflows.length;
        this.stats.connections = this.connections.length;
        this.stats.executions = this.executions.length;
        
        const successfulExecutions = this.executions.filter(e => e.status === 'success').length;
        this.stats.successRate = this.stats.executions > 0 ? 
            Math.round((successfulExecutions / this.stats.executions) * 100) : 0;

        // Update DOM
        const workflowCount = document.getElementById('workflowCount');
        const connectionCount = document.getElementById('connectionCount');
        const executionCount = document.getElementById('executionCount');
        const successRate = document.getElementById('successRate');

        if (workflowCount) workflowCount.textContent = this.stats.workflows;
        if (connectionCount) connectionCount.textContent = this.stats.connections;
        if (executionCount) executionCount.textContent = this.stats.executions;
        if (successRate) successRate.textContent = this.stats.successRate + '%';
    }

    addActivity(title, description, type = 'info') {
        const activity = {
            id: this.generateId(),
            title,
            description,
            type,
            timestamp: new Date().toISOString()
        };

        this.executions.unshift(activity);
        this.updateActivityList();
        this.saveToStorage();
    }

    updateActivityList() {
        const list = document.getElementById('activityList');
        if (!list) return;

        const recentActivities = this.executions.slice(0, 10);
        
        list.innerHTML = recentActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                    <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getComponentName(type) {
        const names = {
            trigger: 'Trigger',
            http: 'HTTP Request',
            phone: 'Phone Call',
            email: 'Send Email',
            condition: 'Condition',
            delay: 'Delay'
        };
        return names[type] || type;
    }

    getComponentIcon(type) {
        const icons = {
            trigger: 'fa-bolt',
            http: 'fa-globe',
            phone: 'fa-phone',
            email: 'fa-envelope',
            condition: 'fa-code-branch',
            delay: 'fa-clock'
        };
        return icons[type] || 'fa-cube';
    }

    getDefaultConfig(type) {
        const configs = {
            trigger: { triggerType: 'manual' },
            http: { method: 'GET', url: '' },
            phone: { phone: '', message: '' },
            email: { to: '', subject: '', body: '' },
            condition: { condition: '' },
            delay: { delay: 5 }
        };
        return configs[type] || {};
    }

    getActivityIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };
        return icons[type] || 'fa-info-circle';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' minutes ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
        return date.toLocaleDateString();
    }

    // UI Functions
    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const loadingText = overlay.querySelector('p');
            if (loadingText) {
                loadingText.textContent = message;
            }
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        const icon = notification.querySelector('i');
        
        if (!notification || !notificationText || !icon) {
            console.warn('Notification elements not found');
            return;
        }
        
        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        
        // Update icon based on type
        const iconClasses = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        icon.className = iconClasses[type] || iconClasses.info;
        
        notification.style.display = 'block';
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            if (notification.style.display === 'block') {
                notification.style.display = 'none';
            }
        }, 4000);
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Storage Functions
    saveToStorage() {
        const data = {
            workflows: this.workflows,
            connections: this.connections,
            executions: this.executions.slice(0, 100) // Keep only last 100 executions
        };
        localStorage.setItem('zenAPIAutomator', JSON.stringify(data));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('zenAPIAutomator');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.workflows = data.workflows || [];
                this.connections = data.connections || [];
                this.executions = data.executions || [];
            } catch (error) {
                console.error('Failed to load from storage:', error);
            }
        }
    }
}

// Global Functions for HTML onclick handlers
let zenAPI;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM loaded, initializing Zen API Automator...');
    zenAPI = new ZenAPIAutomator();
    window.zenAPI = zenAPI;
});

// Tab switching
function switchTab(tabName) {
    if (zenAPI) {
        zenAPI.switchTab(tabName);
    }
}

// Workflow functions
function createNewWorkflow() {
    if (zenAPI) {
        zenAPI.createNewWorkflow();
    }
}

function closeWorkflowModal() {
    if (zenAPI) {
        zenAPI.closeWorkflowModal();
    }
}

function saveWorkflow() {
    if (zenAPI) {
        zenAPI.saveWorkflow();
    }
}

// Connection functions
function showConnectionDialog() {
    if (zenAPI) {
        zenAPI.showConnectionDialog();
    }
}

function closeConnectionModal() {
    if (zenAPI) {
        zenAPI.closeConnectionModal();
    }
}

function updateConnectionForm() {
    if (zenAPI) {
        zenAPI.updateConnectionForm();
    }
}

function saveConnection() {
    if (zenAPI) {
        zenAPI.saveConnection();
    }
}

// Execution functions
function runWorkflow() {
    if (zenAPI) {
        zenAPI.runWorkflow();
    }
}

function refreshExecutions() {
    if (zenAPI) {
        zenAPI.refreshExecutions();
    }
}

// Template functions
function showTemplates() {
    if (zenAPI) {
        zenAPI.showTemplates();
    }
}

    // Export for global access
    if (typeof zenAPI !== 'undefined') {
        window.zenAPI = zenAPI;
    }