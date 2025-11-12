// Zen API Automator - Refactored for Bootstrap 5
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

        // Bootstrap component instances
        this.workflowModal = new bootstrap.Modal(document.getElementById('workflowModal'));
        this.connectionModal = new bootstrap.Modal(document.getElementById('connectionModal'));
        this.loadingOverlay = new bootstrap.Modal(document.getElementById('loadingOverlay'), { backdrop: 'static', keyboard: false });
        this.notificationToast = new bootstrap.Toast(document.getElementById('notificationToast'));

        this.init();
    }

    init() {
        console.log('🚀 Initializing Zen API Automator...');
        this.loadFromStorage();
        this.setupEventListeners();
        this.updateStats();
        this.updateActivityList();
        this.switchTab('dashboard'); // Set initial tab
        console.log('✅ Zen API Automator initialized successfully');
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Drag and drop
        this.setupDragAndDrop();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.workflowModal.hide();
                this.connectionModal.hide();
            }
        });
    }

    setupDragAndDrop() {
        const components = document.querySelectorAll('.component-item');
        const canvas = document.getElementById('builderCanvas');

        components.forEach(component => {
            component.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('component-type', e.target.dataset.type);
            });
        });

        if (canvas) {
            canvas.addEventListener('dragover', (e) => {
                e.preventDefault();
                canvas.classList.add('bg-light');
            });

            canvas.addEventListener('dragleave', () => {
                canvas.classList.remove('bg-light');
            });

            canvas.addEventListener('drop', (e) => {
                e.preventDefault();
                canvas.classList.remove('bg-light');
                const componentType = e.dataTransfer.getData('component-type');
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.addComponentToCanvas(componentType, x, y);
            });
        }
    }

    switchTab(tabName) {
        console.log(`🔄 Switching to tab: ${tabName}`);
        document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

        document.getElementById(tabName).style.display = 'block';
        document.querySelector(`.nav-link[data-tab="${tabName}"]`).classList.add('active');

        this.loadTabContent(tabName);
    }

    loadTabContent(tabName) {
        switch(tabName) {
            case 'workflows': this.loadWorkflows(); break;
            case 'connections': this.loadConnections(); break;
            case 'executions': this.loadExecutions(); break;
            case 'dashboard': this.updateStats(); break;
        }
    }

    createNewWorkflow() {
        this.currentWorkflow = {
            id: this.generateId(),
            name: 'New Workflow',
            components: [],
            created: new Date().toISOString()
        };
        this.clearCanvas();
        this.workflowModal.show();
    }

    showWorkflowModal() {
        this.workflowModal.show();
    }

    addComponentToCanvas(type, x, y) {
        const canvas = document.getElementById('builderCanvas');
        const placeholder = canvas.querySelector('.canvas-placeholder');
        if (placeholder) placeholder.style.display = 'none';

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
        this.showNotification('Success', `${this.getComponentName(type)} added to workflow.`);
    }

    renderComponent(component) {
        const canvas = document.getElementById('builderCanvas');
        const element = document.createElement('div');
        element.className = 'workflow-component';
        element.style.left = `${component.x}px`;
        element.style.top = `${component.y}px`;
        element.dataset.id = component.id;
        
        element.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="fw-bold">
                    <i class="fas ${this.getComponentIcon(component.type)} me-2"></i>
                    <span>${this.getComponentName(component.type)}</span>
                </div>
                <button class="btn-close remove-btn" onclick="event.stopPropagation(); zenAPI.removeComponent('${component.id}')"></button>
            </div>
        `;

        element.addEventListener('click', () => this.selectComponent(component));
        canvas.appendChild(element);
    }

    selectComponent(component) {
        document.querySelectorAll('.workflow-component').forEach(el => el.classList.remove('selected'));
        const element = document.querySelector(`[data-id="${component.id}"]`);
        if (element) element.classList.add('selected');

        this.selectedComponent = component;
        this.showComponentProperties(component);
    }

    showComponentProperties(component) {
        const panel = document.getElementById('propertiesPanel');
        panel.innerHTML = `
            <h5 class="mb-3">${this.getComponentName(component.type)} Properties</h5>
            <div class="property-form">
                ${this.generatePropertyForm(component)}
            </div>
        `;
    }

    generatePropertyForm(component) {
        const config = component.config;
        const forms = {
            trigger: `
                <div class="mb-3">
                    <label class="form-label">Trigger Type</label>
                    <select class="form-select" onchange="zenAPI.updateComponentConfig('${component.id}', 'triggerType', this.value)">
                        <option value="webhook" ${config.triggerType === 'webhook' ? 'selected' : ''}>Webhook</option>
                        <option value="schedule" ${config.triggerType === 'schedule' ? 'selected' : ''}>Schedule</option>
                        <option value="manual" ${config.triggerType === 'manual' ? 'selected' : ''}>Manual</option>
                    </select>
                </div>`,
            http: `
                <div class="mb-3">
                    <label class="form-label">URL</label>
                    <input type="url" class="form-control" placeholder="https://api.example.com" value="${config.url || ''}"
                           onchange="zenAPI.updateComponentConfig('${component.id}', 'url', this.value)">
                </div>
                <div class="mb-3">
                    <label class="form-label">Method</label>
                    <select class="form-select" onchange="zenAPI.updateComponentConfig('${component.id}', 'method', this.value)">
                        <option value="GET" ${config.method === 'GET' ? 'selected' : ''}>GET</option>
                        <option value="POST" ${config.method === 'POST' ? 'selected' : ''}>POST</option>
                    </select>
                </div>`,
            // Add other component forms here
        };
        return forms[component.type] || '<p class="text-muted">No configuration needed.</p>';
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
            document.querySelector(`[data-id="${componentId}"]`)?.remove();
            this.showNotification('Success', 'Component removed.');
        }
    }

    clearCanvas() {
        const canvas = document.getElementById('builderCanvas');
        canvas.innerHTML = `
            <div class="canvas-placeholder">
                <i class="fas fa-arrow-left"></i>
                <p>Drag components here</p>
            </div>
        `;
    }

    saveWorkflow() {
        if (!this.currentWorkflow) return;

        const name = prompt('Enter workflow name:', this.currentWorkflow.name);
        if (!name?.trim()) {
            this.showNotification('Error', 'Workflow name is required.', 'danger');
            return;
        }
        this.currentWorkflow.name = name.trim();

        const existingIndex = this.workflows.findIndex(w => w.id === this.currentWorkflow.id);
        if (existingIndex >= 0) {
            this.workflows[existingIndex] = this.currentWorkflow;
        } else {
            this.workflows.push(this.currentWorkflow);
        }
        
        this.saveToStorage();
        this.workflowModal.hide();
        this.loadWorkflows();
        this.updateStats();
        this.showNotification('Success', `Workflow "${name}" saved.`);
    }

    loadWorkflows() {
        const grid = document.getElementById('workflowGrid');
        if (this.workflows.length === 0) {
            grid.innerHTML = `<div class="col-12"><div class="empty-state">
                <i class="fas fa-project-diagram"></i>
                <h3 class="mt-3">No workflows yet</h3>
                <p>Create your first workflow to get started.</p>
                <button class="btn btn-primary mt-2" onclick="zenAPI.createNewWorkflow()">Create Workflow</button>
            </div></div>`;
            return;
        }
        grid.innerHTML = this.workflows.map(wf => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${wf.name}</h5>
                        <p class="card-text text-muted">${wf.components.length} components</p>
                    </div>
                    <div class="card-footer bg-white d-flex gap-2">
                        <button class="btn btn-primary w-100" onclick="zenAPI.runWorkflowById('${wf.id}')">Run</button>
                        <button class="btn btn-outline-secondary w-100" onclick="zenAPI.editWorkflow('${wf.id}')">Edit</button>
                    </div>
                </div>
            </div>`).join('');
    }

    runWorkflowById(workflowId) {
        const workflow = this.workflows.find(w => w.id === workflowId);
        if (workflow) this.runWorkflow(workflow);
    }

    editWorkflow(workflowId) {
        const workflow = this.workflows.find(w => w.id === workflowId);
        if (workflow) {
            this.currentWorkflow = JSON.parse(JSON.stringify(workflow)); // Deep copy
            this.clearCanvas();
            this.currentWorkflow.components.forEach(c => this.renderComponent(c));
            this.workflowModal.show();
        }
    }

    async runWorkflow(workflow) {
        if (!workflow?.components?.length) {
            this.showNotification('Error', 'Workflow has no components.', 'danger');
            return;
        }
        this.showLoading(`Running "${workflow.name}"...`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate execution
        this.hideLoading();
        this.showNotification('Success', `Workflow "${workflow.name}" completed.`);
    }

    showConnectionDialog() {
        this.connectionModal.show();
    }

    updateConnectionForm() {
        const serviceType = document.getElementById('serviceType').value;
        const fields = document.getElementById('connectionFields');
        const fieldConfigs = {
            http: `<div class="mb-3"><label class="form-label">Base URL</label><input type="url" class="form-control" placeholder="https://api.example.com"></div>`,
            twilio: `<div class="mb-3"><label class="form-label">Account SID</label><input type="text" class="form-control" placeholder="ACxxxxxxxx"></div>`,
        };
        fields.innerHTML = fieldConfigs[serviceType] || '<p class="text-muted">Select a service type.</p>';
    }

    saveConnection() {
        const name = document.getElementById('connectionName').value;
        if (!name?.trim()) {
            this.showNotification('Error', 'Connection name is required.', 'danger');
            return;
        }
        this.connections.push({ id: this.generateId(), name: name.trim(), type: document.getElementById('serviceType').value });
        this.saveToStorage();
        this.connectionModal.hide();
        this.loadConnections();
        this.updateStats();
        this.showNotification('Success', `Connection "${name}" saved.`);
    }

    loadConnections() {
        const grid = document.getElementById('connectionGrid');
        if (this.connections.length === 0) {
            grid.innerHTML = `<div class="col-12"><div class="empty-state">
                <i class="fas fa-plug"></i>
                <h3 class="mt-3">No connections yet</h3>
                <p>Add your first service connection.</p>
                <button class="btn btn-primary mt-2" onclick="zenAPI.showConnectionDialog()">Add Connection</button>
            </div></div>`;
            return;
        }
        grid.innerHTML = this.connections.map(c => `
            <div class="col-md-6 col-lg-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${c.name}</h5>
                        <p class="card-text text-muted">${c.type.toUpperCase()}</p>
                        <button class="btn btn-sm btn-outline-danger" onclick="zenAPI.deleteConnection('${c.id}')">Delete</button>
                    </div>
                </div>
            </div>`).join('');
    }
    
    deleteConnection(connectionId) {
        if (!confirm('Are you sure?')) return;
        this.connections = this.connections.filter(c => c.id !== connectionId);
        this.saveToStorage();
        this.loadConnections();
        this.updateStats();
        this.showNotification('Success', 'Connection deleted.');
    }

    loadExecutions() {
        // Implementation for loading executions
    }
    
    refreshExecutions() {
        // Implementation for refreshing executions
    }

    showTemplates() {
        this.showNotification('Info', 'Template gallery coming soon!', 'info');
    }

    updateStats() {
        document.getElementById('workflowCount').textContent = this.workflows.length;
        document.getElementById('connectionCount').textContent = this.connections.length;
        // Other stats...
    }

    updateActivityList() {
        // Implementation for updating activity list
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getComponentName(type) {
        const names = { trigger: 'Trigger', http: 'HTTP Request', phone: 'Phone Call', email: 'Send Email', condition: 'Condition', delay: 'Delay' };
        return names[type] || type;
    }

    getComponentIcon(type) {
        const icons = { trigger: 'fa-bolt', http: 'fa-globe', phone: 'fa-phone', email: 'fa-envelope', condition: 'fa-code-branch', delay: 'fa-clock' };
        return icons[type] || 'fa-cube';
    }

    getDefaultConfig(type) {
        const configs = { trigger: { triggerType: 'manual' }, http: { method: 'GET', url: '' } };
        return configs[type] || {};
    }

    showLoading(message = 'Processing...') {
        document.getElementById('loadingText').textContent = message;
        this.loadingOverlay.show();
    }

    hideLoading() {
        this.loadingOverlay.hide();
    }

    showNotification(title, message, type = 'success') {
        const toastEl = document.getElementById('notificationToast');
        const toastHeader = toastEl.querySelector('.toast-header');
        toastEl.querySelector('#notificationTitle').textContent = title;
        toastEl.querySelector('#notificationText').textContent = message;
        
        toastHeader.classList.remove('bg-success', 'bg-danger', 'bg-info', 'text-white');
        if (type === 'danger') {
            toastHeader.classList.add('bg-danger', 'text-white');
        } else if (type === 'info') {
            toastHeader.classList.add('bg-info', 'text-white');
        } else {
            toastHeader.classList.add('bg-success', 'text-white');
        }
        
        this.notificationToast.show();
    }

    saveToStorage() {
        const data = { workflows: this.workflows, connections: this.connections, executions: this.executions };
        localStorage.setItem('zenAPIAutomator', JSON.stringify(data));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('zenAPIAutomator');
        if (stored) {
            const data = JSON.parse(stored);
            this.workflows = data.workflows || [];
            this.connections = data.connections || [];
            this.executions = data.executions || [];
        }
    }
}

let zenAPI;
document.addEventListener('DOMContentLoaded', () => {
    zenAPI = new ZenAPIAutomator();
    window.zenAPI = zenAPI;
});
