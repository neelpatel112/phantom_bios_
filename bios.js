class BIOSMenu {
    constructor() {
        // Menu structure - INCLUDES BOOT MANAGER
        this.menuItems = [
            { id: 'standard-cmos', title: "STANDARD CMOS SETUP", desc: "Date, Time, Hard Disk Type" },
            { id: 'bios-features', title: "BIOS FEATURES SETUP", desc: "Advanced BIOS Options" },
            { id: 'chipset', title: "CHIPSET FEATURES SETUP", desc: "Chipset Configuration" },
            { id: 'power', title: "POWER MANAGEMENT SETUP", desc: "Power Saving Options" },
            { id: 'pnp', title: "PNP/PCI CONFIGURATION", desc: "Plug & Play Settings" },
            { id: 'load-bios-defaults', title: "LOAD BIOS DEFAULTS", desc: "Load Default Settings", action: 'loadDefaults' },
            { id: 'load-setup-defaults', title: "LOAD SETUP DEFAULTS", desc: "Load Optimized Defaults", action: 'loadOptimized' },
            { id: 'peripherals', title: "INTEGRATED PERIPHERALS", desc: "Onboard Devices" },
            { id: 'boot-manager', title: "BOOT MANAGER", desc: "Configure Boot Device Order" }, // NEW!
            { id: 'hardware-monitor', title: "HARDWARE MONITOR", desc: "Temperature & Voltage" },
            { id: 'supervisor-password', title: "SUPERVISOR PASSWORD", desc: "Set Administrator Password", action: 'setPassword' },
            { id: 'user-password', title: "USER PASSWORD", desc: "Set User Password", action: 'setPassword' },
            { id: 'save-exit', title: "SAVE & EXIT SETUP", desc: "Save Changes and Reboot", action: 'saveExit' },
            { id: 'exit-without-saving', title: "EXIT WITHOUT SAVING", desc: "Discard Changes and Reboot", action: 'exitWithoutSave' }
        ];

        // System state (settings)
        this.state = {
            date: new Date(),
            time: new Date(),
            bootOrder: ['Hard Disk', 'CD-ROM', 'Floppy', 'Network'],
            cpuSpeed: '1000MHz',
            memorySpeed: '133MHz',
            virtualization: false,
            quickBoot: true,
            bootNumLock: true,
            bootDelay: 0,
            securityLevel: 'None'
        };

        // Navigation state
        this.currentIndex = 0;
        this.inSettingsPage = false;
        this.currentSettingsPage = null;
        this.exitModalActive = false;
        this.exitModalIndex = 0;

        // Hardware Monitor
        this.hardwareMonitor = null;

        // DOM elements
        this.menuContainer = null;
        this.settingsContainer = null;

        // Audio
        this.navSound = new Audio();
        this.navSound.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

        this.init();
    }

    init() {
        console.log("BIOS Menu System Initialized");
        
        // Create menu elements
        this.createMenu();
        
        // Create ALL settings pages
        this.createAllSettingsPages();
        
        // Load saved state
        this.loadState();
        
        // Setup keyboard listeners
        this.setupKeyboard();
        
        // Highlight first item
        this.updateSelection();
    }

    createMenu() {
        this.menuContainer = document.querySelector('.menu-items');
        this.menuContainer.innerHTML = '';
        
        // Create settings pages container
        this.settingsContainer = document.createElement('div');
        this.settingsContainer.id = 'settings-pages-container';
        this.settingsContainer.style.position = 'relative';
        this.settingsContainer.style.height = '400px';
        document.querySelector('#bios-menu').appendChild(this.settingsContainer);
        
        // Build menu items
        this.menuItems.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'menu-item';
            div.id = `menu-item-${index}`;
            div.innerHTML = `
                <span class="menu-title">${item.title}</span>
                <span class="menu-desc">${item.desc}</span>
            `;
            
            // Click handler (for mouse users)
            div.addEventListener('click', () => {
                this.currentIndex = index;
                this.updateSelection();
                this.selectItem();
            });
            
            this.menuContainer.appendChild(div);
        });
    }

    createAllSettingsPages() {
        // Create all pages
        this.createStandardCMOSPage();
        this.createHardwareMonitorPage();
        this.createBootManagerPage(); // NEW BOOT MANAGER!
        
        // Create placeholder pages
        this.createPlaceholderPage('bios-features', 'BIOS Features Setup');
        this.createPlaceholderPage('chipset', 'Chipset Features Setup');
        this.createPlaceholderPage('power', 'Power Management Setup');
        this.createPlaceholderPage('pnp', 'PNP/PCI Configuration');
        this.createPlaceholderPage('peripherals', 'Integrated Peripherals');
    }

    createStandardCMOSPage() {
        const page = document.createElement('div');
        page.className = 'settings-page';
        page.id = 'page-standard-cmos';
        page.innerHTML = `
            <div class="settings-header">STANDARD CMOS SETUP</div>
            
            <div class="settings-group">
                <div class="setting-row">
                    <span class="setting-label">Date (mm/dd/yyyy):</span>
                    <span class="setting-value editable" id="date-value">
                        ${this.formatDate(this.state.date)}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Time (hh:mm:ss):</span>
                    <span class="setting-value editable" id="time-value">
                        ${this.formatTime(this.state.time)}
                    </span>
                </div>
            </div>
            
            <div class="settings-group">
                <div class="setting-row">
                    <span class="setting-label">Primary Master:</span>
                    <span class="setting-value">ST310211A [Auto]</span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Primary Slave:</span>
                    <span class="setting-value">None</span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Secondary Master:</span>
                    <span class="setting-value">CD-ROM [Auto]</span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Secondary Slave:</span>
                    <span class="setting-value">None</span>
                </div>
            </div>
            
            <div class="help-footer">
                ↑↓ : Select Item   ←→ : Change Value   +/- : Adjust   F10: Save   ESC: Exit
            </div>
        `;
        
        this.settingsContainer.appendChild(page);
        
        // Add click handlers
        page.querySelector('#date-value').addEventListener('click', () => this.editDate());
        page.querySelector('#time-value').addEventListener('click', () => this.editTime());
    }

    createHardwareMonitorPage() {
        const page = document.createElement('div');
        page.className = 'settings-page';
        page.id = 'page-hardware-monitor';
        page.innerHTML = `
            <div class="settings-header">HARDWARE MONITOR</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <!-- Left Column: Gauges -->
                <div class="settings-group">
                    <h3 style="color: #fff; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                        SYSTEM SENSORS
                    </h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <!-- CPU Temperature Gauge -->
                        <div class="gauge-container">
                            <div class="gauge-label">CPU TEMP</div>
                            <canvas id="gauge-cpu-temp" width="120" height="120"></canvas>
                            <div class="gauge-value" id="value-cpu-temp">45°C</div>
                            <div class="gauge-status" id="status-cpu-temp">Normal</div>
                        </div>
                        
                        <!-- CPU Voltage Gauge -->
                        <div class="gauge-container">
                            <div class="gauge-label">CPU VCore</div>
                            <canvas id="gauge-cpu-voltage" width="120" height="120"></canvas>
                            <div class="gauge-value" id="value-cpu-voltage">1.20V</div>
                            <div class="gauge-status" id="status-cpu-voltage">Optimal</div>
                        </div>
                        
                        <!-- Fan Speed Gauge -->
                        <div class="gauge-container">
                            <div class="gauge-label">FAN SPEED</div>
                            <canvas id="gauge-fan-speed" width="120" height="120"></canvas>
                            <div class="gauge-value" id="value-fan-speed">1200 RPM</div>
                            <div class="gauge-status" id="status-fan-speed">Low</div>
                        </div>
                        
                        <!-- CPU Load Gauge -->
                        <div class="gauge-container">
                            <div class="gauge-label">CPU LOAD</div>
                            <canvas id="gauge-cpu-load" width="120" height="120"></canvas>
                            <div class="gauge-value" id="value-cpu-load">15%</div>
                            <div class="gauge-status" id="status-cpu-load">Idle</div>
                        </div>
                    </div>
                </div>
                
                <!-- Right Column -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- System Information -->
                    <div class="settings-group">
                        <h3 style="color: #fff; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                            SYSTEM INFORMATION
                        </h3>
                        
                        <div class="info-grid">
                            <div class="info-row">
                                <span class="info-label">Processor:</span>
                                <span class="info-value" id="info-cpu">Intel Pentium III 1000MHz</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Memory:</span>
                                <span class="info-value" id="info-memory">32MB SDRAM</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">BIOS Version:</span>
                                <span class="info-value">Phoenix 4.0 Release 6.0</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">System Time:</span>
                                <span class="info-value" id="info-time">${this.formatTime()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Voltage Readings -->
                    <div class="settings-group">
                        <h3 style="color: #fff; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                            VOLTAGE READINGS
                        </h3>
                        
                        <div class="voltage-grid">
                            <div class="voltage-row">
                                <span class="voltage-label">+12V:</span>
                                <span class="voltage-value" id="voltage-12v">12.00V</span>
                                <div class="voltage-bar">
                                    <div class="voltage-bar-fill" id="bar-12v" style="width: 100%"></div>
                                </div>
                            </div>
                            <div class="voltage-row">
                                <span class="voltage-label">+5V:</span>
                                <span class="voltage-value" id="voltage-5v">5.00V</span>
                                <div class="voltage-bar">
                                    <div class="voltage-bar-fill" id="bar-5v" style="width: 100%"></div>
                                </div>
                            </div>
                            <div class="voltage-row">
                                <span class="voltage-label">+3.3V:</span>
                                <span class="voltage-value" id="voltage-3v">3.30V</span>
                                <div class="voltage-bar">
                                    <div class="voltage-bar-fill" id="bar-3v" style="width: 100%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- System Load Graph -->
                    <div class="settings-group">
                        <h3 style="color: #fff; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                            SYSTEM LOAD HISTORY
                        </h3>
                        <canvas id="load-graph" width="400" height="100" style="width: 100%; height: 100px;"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="help-footer">
                F5: Refresh Sensors   Space: Stress Test   ESC: Return to Main Menu
            </div>
        `;
        
        this.settingsContainer.appendChild(page);
    }

    // ========== BOOT MANAGER PAGE ==========
    createBootManagerPage() {
        const page = document.createElement('div');
        page.className = 'settings-page';
        page.id = 'page-boot-manager';
        
        const bootDevices = this.state.bootOrder || ['Hard Disk', 'CD-ROM', 'Floppy', 'Network'];
        
        page.innerHTML = `
            <div class="settings-header">BOOT MANAGER</div>
            
            <div class="settings-group">
                <h3 style="color: #fff; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    BOOT DEVICE PRIORITY
                </h3>
                <p style="color: #aaa; margin-bottom: 20px; font-size: 0.9em;">
                    Drag devices to reorder boot sequence. System boots from top to bottom.
                </p>
                
                <div id="boot-devices-list" style="min-height: 200px;">
                    <!-- Devices injected by JavaScript -->
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: rgba(0, 30, 0, 0.3); border: 1px solid #333;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 12px; height: 12px; background: #90ee90; border-radius: 2px;"></div>
                        <span style="color: #90ee90;">Current Boot Device:</span>
                        <span style="color: #fff; font-weight: bold;" id="current-boot-device">${bootDevices[0]}</span>
                    </div>
                    <div style="margin-top: 10px; color: #aaa; font-size: 0.9em;">
                        System will attempt to boot from <strong>${bootDevices[0]}</strong> first.
                        ${bootDevices.length > 1 ? `If unavailable, will try ${bootDevices[1]}.` : ''}
                    </div>
                </div>
            </div>
            
            <div class="settings-group">
                <h3 style="color: #fff; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    BOOT OPTIONS
                </h3>
                
                <div class="setting-row">
                    <span class="setting-label">Quick Boot:</span>
                    <span class="setting-value">
                        <label class="bios-switch">
                            <input type="checkbox" id="quick-boot-toggle" ${this.state.quickBoot ? 'checked' : ''}>
                            <span class="bios-slider"></span>
                        </label>
                        <span style="margin-left: 10px; color: ${this.state.quickBoot ? '#90ee90' : '#aaa'}">
                            ${this.state.quickBoot ? 'Enabled' : 'Disabled'}
                        </span>
                    </span>
                </div>
                
                <div class="setting-row">
                    <span class="setting-label">Boot NumLock:</span>
                    <span class="setting-value">
                        <label class="bios-switch">
                            <input type="checkbox" id="numlock-toggle" ${this.state.bootNumLock ? 'checked' : ''}>
                            <span class="bios-slider"></span>
                        </label>
                        <span style="margin-left: 10px; color: ${this.state.bootNumLock ? '#90ee90' : '#aaa'}">
                            ${this.state.bootNumLock ? 'On' : 'Off'}
                        </span>
                    </span>
                </div>
                
                <div class="setting-row">
                    <span class="setting-label">Boot Delay:</span>
                    <span class="setting-value">
                        <select id="boot-delay-select" style="background: #000a14; color: #fff; border: 1px solid #333; padding: 3px 8px;">
                            <option value="0" ${this.state.bootDelay === 0 ? 'selected' : ''}>0 sec</option>
                            <option value="3" ${this.state.bootDelay === 3 ? 'selected' : ''}>3 sec</option>
                            <option value="5" ${this.state.bootDelay === 5 ? 'selected' : ''}>5 sec</option>
                            <option value="10" ${this.state.bootDelay === 10 ? 'selected' : ''}>10 sec</option>
                        </select>
                    </span>
                </div>
            </div>
            
            <div class="help-footer">
                Drag to reorder   ↑↓ : Move selection   Space: Toggle   Enter: Select   F5: Reset to defaults
            </div>
        `;
        
        this.settingsContainer.appendChild(page);
        
        // Initialize after DOM is ready
        setTimeout(() => {
            this.renderBootDevicesList();
            this.setupBootManagerEvents();
        }, 10);
    }

    renderBootDevicesList() {
        const container = document.getElementById('boot-devices-list');
        if (!container) return;
        
        const bootDevices = this.state.bootOrder;
        container.innerHTML = '';
        
        bootDevices.forEach((device, index) => {
            const deviceElement = document.createElement('div');
            deviceElement.className = 'boot-device-item';
            deviceElement.draggable = true;
            deviceElement.dataset.index = index;
            deviceElement.dataset.device = device;
            deviceElement.innerHTML = `
                <div class="boot-device-content">
                    <div class="boot-device-icon">
                        ${this.getBootDeviceIcon(device)}
                    </div>
                    <div class="boot-device-info">
                        <div class="boot-device-name">${device}</div>
                        <div class="boot-device-type">${this.getBootDeviceType(device)}</div>
                    </div>
                    <div class="boot-device-order">
                        <span class="order-number">${index + 1}</span>
                        <div class="boot-device-controls">
                            <button class="boot-btn up-btn" title="Move up">↑</button>
                            <button class="boot-btn down-btn" title="Move down">↓</button>
                        </div>
                    </div>
                </div>
                ${index === 0 ? '<div class="boot-primary-badge">PRIMARY</div>' : ''}
            `;
            
            container.appendChild(deviceElement);
        });
        
        // Update current boot device display
        document.getElementById('current-boot-device').textContent = bootDevices[0];
    }

    getBootDeviceIcon(device) {
        const icons = {
            'Hard Disk': '💾',
            'CD-ROM': '💿',
            'Floppy': '📼',
            'Network': '🌐',
            'USB': '🔌',
            'SSD': '⚡'
        };
        return icons[device] || '💻';
    }

    getBootDeviceType(device) {
        const types = {
            'Hard Disk': 'ATA/IDE Drive',
            'CD-ROM': 'Optical Drive',
            'Floppy': 'Floppy Disk Drive',
            'Network': 'PXE Network Boot',
            'USB': 'USB Mass Storage',
            'SSD': 'Solid State Drive'
        };
        return types[device] || 'Boot Device';
    }

    setupBootManagerEvents() {
        const container = document.getElementById('boot-devices-list');
        if (!container) return;
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('page-boot-manager')?.classList.contains('active')) return;
            
            const selected = container.querySelector('.boot-device-item.selected');
            let currentIndex = selected ? parseInt(selected.dataset.index) : 0;
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        this.moveBootDevice(currentIndex, currentIndex - 1);
                    }
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    const devices = this.state.bootOrder;
                    if (currentIndex < devices.length - 1) {
                        this.moveBootDevice(currentIndex, currentIndex + 1);
                    }
                    break;
                    
                case 'F5':
                    e.preventDefault();
                    this.resetBootOrder();
                    break;
            }
        });
        
        // Click to select
        container.addEventListener('click', (e) => {
            const deviceItem = e.target.closest('.boot-device-item');
            if (deviceItem) {
                // Remove previous selection
                container.querySelectorAll('.boot-device-item').forEach(item => {
                    item.classList.remove('selected');
                });
                // Select current
                deviceItem.classList.add('selected');
                
                // Handle button clicks
                const upBtn = e.target.closest('.up-btn');
                const downBtn = e.target.closest('.down-btn');
                
                if (upBtn) {
                    const index = parseInt(deviceItem.dataset.index);
                    if (index > 0) this.moveBootDevice(index, index - 1);
                }
                
                if (downBtn) {
                    const index = parseInt(deviceItem.dataset.index);
                    const devices = this.state.bootOrder;
                    if (index < devices.length - 1) this.moveBootDevice(index, index + 1);
                }
            }
        });
        
        // Drag and drop
        let draggedItem = null;
        
        container.addEventListener('dragstart', (e) => {
            draggedItem = e.target.closest('.boot-device-item');
            if (draggedItem) {
                e.dataTransfer.setData('text/plain', draggedItem.dataset.index);
                draggedItem.style.opacity = '0.5';
            }
        });
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const deviceItem = e.target.closest('.boot-device-item');
            if (deviceItem && draggedItem && deviceItem !== draggedItem) {
                const rect = deviceItem.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                if (e.clientY < midpoint) {
                    deviceItem.style.borderTop = '2px solid #90ee90';
                    deviceItem.style.borderBottom = 'none';
                } else {
                    deviceItem.style.borderBottom = '2px solid #90ee90';
                    deviceItem.style.borderTop = 'none';
                }
            }
        });
        
        container.addEventListener('dragleave', (e) => {
            const deviceItem = e.target.closest('.boot-device-item');
            if (deviceItem) {
                deviceItem.style.borderTop = 'none';
                deviceItem.style.borderBottom = 'none';
            }
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            const deviceItem = e.target.closest('.boot-device-item');
            
            if (deviceItem && draggedItem && deviceItem !== draggedItem) {
                const fromIndex = parseInt(draggedItem.dataset.index);
                const toIndex = parseInt(deviceItem.dataset.index);
                
                const rect = deviceItem.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                const finalIndex = e.clientY < midpoint ? toIndex : toIndex + 1;
                
                this.moveBootDevice(fromIndex, finalIndex);
            }
            
            // Reset styles
            container.querySelectorAll('.boot-device-item').forEach(item => {
                item.style.borderTop = 'none';
                item.style.borderBottom = 'none';
                item.style.opacity = '1';
            });
            
            draggedItem = null;
        });
        
        container.addEventListener('dragend', () => {
            if (draggedItem) {
                draggedItem.style.opacity = '1';
                draggedItem = null;
            }
        });
        
        // Toggle switches
        document.getElementById('quick-boot-toggle')?.addEventListener('change', (e) => {
            this.state.quickBoot = e.target.checked;
            const status = e.target.nextElementSibling.nextElementSibling;
            status.textContent = e.target.checked ? 'Enabled' : 'Disabled';
            status.style.color = e.target.checked ? '#90ee90' : '#aaa';
            this.saveState();
            this.showToast(`Quick Boot ${e.target.checked ? 'Enabled' : 'Disabled'}`);
        });
        
        document.getElementById('numlock-toggle')?.addEventListener('change', (e) => {
            this.state.bootNumLock = e.target.checked;
            const status = e.target.nextElementSibling.nextElementSibling;
            status.textContent = e.target.checked ? 'On' : 'Off';
            status.style.color = e.target.checked ? '#90ee90' : '#aaa';
            this.saveState();
            this.showToast(`Boot NumLock ${e.target.checked ? 'On' : 'Off'}`);
        });
        
        document.getElementById('boot-delay-select')?.addEventListener('change', (e) => {
            this.state.bootDelay = parseInt(e.target.value);
            this.saveState();
            this.showToast(`Boot delay set to ${e.target.value} seconds`);
        });
    }

    moveBootDevice(fromIndex, toIndex) {
        const devices = [...this.state.bootOrder];
        
        // Ensure toIndex is within bounds
        toIndex = Math.max(0, Math.min(toIndex, devices.length - 1));
        
        if (fromIndex === toIndex) return;
        
        // Remove from old position and insert at new position
        const [movedItem] = devices.splice(fromIndex, 1);
        devices.splice(toIndex, 0, movedItem);
        
        // Update state
        this.state.bootOrder = devices;
        this.saveState();
        
        // Re-render list
        this.renderBootDevicesList();
        
        // Play sound
        this.playNavSound(800, 50);
        
        this.showToast(`Boot order updated: ${movedItem} moved to position ${toIndex + 1}`);
    }

    resetBootOrder() {
        this.state.bootOrder = ['Hard Disk', 'CD-ROM', 'Floppy', 'Network'];
        this.state.quickBoot = true;
        this.state.bootNumLock = true;
        this.state.bootDelay = 0;
        
        // Update UI
        if (document.getElementById('quick-boot-toggle')) {
            document.getElementById('quick-boot-toggle').checked = true;
            document.getElementById('numlock-toggle').checked = true;
            document.getElementById('boot-delay-select').value = '0';
        }
        
        this.saveState();
        this.renderBootDevicesList();
        
        this.showToast('Boot order reset to defaults');
        this.playNavSound(1000, 100);
    }

    createPlaceholderPage(id, title) {
        const page = document.createElement('div');
        page.className = 'settings-page';
        page.id = `page-${id}`;
        page.innerHTML = `
            <div class="settings-header">${title}</div>
            <div style="text-align: center; margin-top: 100px; color: #aaa;">
                <p>Settings page under construction</p>
                <p>Check back in future updates!</p>
            </div>
            <div class="help-footer">
                ESC: Return to Main Menu
            </div>
        `;
        this.settingsContainer.appendChild(page);
    }

    formatDate(date) {
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    }

    formatTime(date) {
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }

    editDate() {
        const elem = document.getElementById('date-value');
        elem.innerHTML = `
            <input type="text" class="time-input" value="${this.formatDate(this.state.date)}" maxlength="10" 
                   style="width: 100px;" id="date-input">
            <span class="blinking-cursor">_</span>
        `;
        
        const input = document.getElementById('date-input');
        input.focus();
        input.select();
        
        input.addEventListener('blur', () => this.saveDate());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.saveDate();
            if (e.key === 'Escape') this.cancelEdit();
        });
    }

    editTime() {
        const elem = document.getElementById('time-value');
        elem.innerHTML = `
            <input type="text" class="time-input" value="${this.formatTime(this.state.time)}" maxlength="8" 
                   style="width: 80px;" id="time-input">
            <span class="blinking-cursor">_</span>
        `;
        
        const input = document.getElementById('time-input');
        input.focus();
        input.select();
        
        input.addEventListener('blur', () => this.saveTime());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.saveTime();
            if (e.key === 'Escape') this.cancelEdit();
        });
    }

    saveDate() {
        const input = document.getElementById('date-input');
        const value = input.value;
        
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (regex.test(value)) {
            const [mm, dd, yyyy] = value.split('/').map(Number);
            const newDate = new Date(this.state.date);
            newDate.setMonth(mm - 1);
            newDate.setDate(dd);
            newDate.setFullYear(yyyy);
            this.state.date = newDate;
            this.saveState();
        }
        
        this.updateDisplay();
    }

    saveTime() {
        const input = document.getElementById('time-input');
        const value = input.value;
        
        const regex = /^\d{2}:\d{2}:\d{2}$/;
        if (regex.test(value)) {
            const [hh, mm, ss] = value.split(':').map(Number);
            const newTime = new Date(this.state.time);
            newTime.setHours(hh);
            newTime.setMinutes(mm);
            newTime.setSeconds(ss);
            this.state.time = newTime;
            this.saveState();
        }
        
        this.updateDisplay();
    }

    cancelEdit() {
        this.updateDisplay();
    }

    updateDisplay() {
        document.getElementById('date-value').textContent = this.formatDate(this.state.date);
        document.getElementById('time-value').textContent = this.formatTime(this.state.time);
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (this.exitModalActive) {
                this.handleExitModalKey(e);
                return;
            }
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigate(-1);
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigate(1);
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    this.selectItem();
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    this.goBack();
                    break;
                    
                case 'F10':
                    e.preventDefault();
                    this.showExitModal(true);
                    break;
                    
                case 'F2':
                    e.preventDefault();
                    this.saveState();
                    this.playNavSound(800, 50);
                    break;
                    
                case 'F5':
                    if (this.inSettingsPage && this.currentSettingsPage === 'hardware-monitor' && this.hardwareMonitor) {
                        e.preventDefault();
                        this.hardwareMonitor.resetSimulation();
                    }
                    if (this.inSettingsPage && this.currentSettingsPage === 'boot-manager') {
                        e.preventDefault();
                        this.resetBootOrder();
                    }
                    break;
                    
                case ' ':
                    if (this.inSettingsPage && this.currentSettingsPage === 'hardware-monitor' && this.hardwareMonitor) {
                        e.preventDefault();
                        this.hardwareMonitor.startStressTest();
                    }
                    break;
            }
        });
    }

    navigate(direction) {
        if (this.inSettingsPage) {
            this.playNavSound(700, 30);
        } else {
            const newIndex = this.currentIndex + direction;
            
            if (newIndex >= 0 && newIndex < this.menuItems.length) {
                this.currentIndex = newIndex;
                this.updateSelection();
                this.playNavSound(600 + (direction * 100), 30);
            } else {
                this.playNavSound(400, 100);
            }
        }
    }

    updateSelection() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const currentItem = document.getElementById(`menu-item-${this.currentIndex}`);
        if (currentItem) {
            currentItem.classList.add('selected');
            currentItem.scrollIntoView({ block: 'nearest' });
        }
    }

    selectItem() {
        const item = this.menuItems[this.currentIndex];
        
        if (item.action) {
            this.handleAction(item.action);
        } else {
            this.openSettingsPage(item.id);
        }
        
        this.playNavSound(800, 50);
    }

    openSettingsPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.settings-page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        const page = document.getElementById(`page-${pageId}`);
        if (page) {
            page.classList.add('active');
            this.inSettingsPage = true;
            this.currentSettingsPage = pageId;
            
            // Update UI state
            document.querySelector('.menu-items').style.opacity = '0.3';
            
            // Initialize hardware monitor if needed
            if (pageId === 'hardware-monitor') {
                if (!this.hardwareMonitor) {
                    this.initHardwareMonitor();
                }
                this.hardwareMonitor.init();
            }
            
            // Initialize boot manager if needed
            if (pageId === 'boot-manager') {
                // Re-render in case state changed
                this.renderBootDevicesList();
            }
            
            // Stop hardware monitor when leaving its page
            if (pageId !== 'hardware-monitor' && this.hardwareMonitor) {
                this.hardwareMonitor.stop();
            }
        }
    }

    goBack() {
        if (this.inSettingsPage) {
            // Stop hardware monitor if active
            if (this.hardwareMonitor) {
                this.hardwareMonitor.stop();
            }
            
            // Return to main menu from settings
            document.querySelectorAll('.settings-page').forEach(page => {
                page.classList.remove('active');
            });
            
            this.inSettingsPage = false;
            this.currentSettingsPage = null;
            document.querySelector('.menu-items').style.opacity = '1';
            
            this.playNavSound(500, 50);
        }
    }

    handleAction(action) {
        switch(action) {
            case 'loadDefaults':
                alert('Load BIOS Defaults: Would reset to factory settings');
                break;
                
            case 'loadOptimized':
                alert('Load Setup Defaults: Would load optimized settings');
                break;
                
            case 'setPassword':
                this.setPassword();
                break;
                
            case 'saveExit':
                this.showExitModal(true);
                break;
                
            case 'exitWithoutSave':
                this.showExitModal(false);
                break;
        }
    }

    setPassword() {
        const password = prompt('Enter new password (max 8 chars):');
        if (password && password.length <= 8) {
            alert(`Password set to: ${password}`);
            this.state.securityLevel = 'Basic';
            this.saveState();
        } else if (password) {
            alert('Password too long! Maximum 8 characters.');
        }
    }

    showExitModal(saveFirst) {
        this.exitModalActive = true;
        this.exitModalIndex = saveFirst ? 0 : 1;
        
        const modal = document.createElement('div');
        modal.className = 'exit-modal';
        modal.id = 'exit-modal';
        modal.innerHTML = `
            <div style="text-align: center; color: #fff; margin-bottom: 20px;">
                <h3>CONFIRM EXIT</h3>
                <p>Save configuration changes before exiting?</p>
            </div>
            <div class="exit-options">
                <div class="exit-option yes ${saveFirst ? 'selected' : ''}" id="exit-yes">
                    SAVE CHANGES & EXIT
                </div>
                <div class="exit-option no ${!saveFirst ? 'selected' : ''}" id="exit-no">
                    EXIT WITHOUT SAVING
                </div>
            </div>
            <div style="text-align: center; margin-top: 30px; color: #aaa; font-size: 0.9em;">
                ↑↓ : Select   Enter: Confirm   ESC: Cancel
            </div>
        `;
        
        document.getElementById('bios-menu').appendChild(modal);
        
        document.getElementById('exit-yes').addEventListener('click', () => this.confirmExit(true));
        document.getElementById('exit-no').addEventListener('click', () => this.confirmExit(false));
        
        this.updateExitModalSelection();
    }

    handleExitModalKey(e) {
        e.preventDefault();
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                this.exitModalIndex = (this.exitModalIndex === 0) ? 1 : 0;
                this.updateExitModalSelection();
                this.playNavSound(600, 30);
                break;
                
            case 'ArrowRight':
            case 'ArrowDown':
                this.exitModalIndex = (this.exitModalIndex === 0) ? 1 : 0;
                this.updateExitModalSelection();
                this.playNavSound(600, 30);
                break;
                
            case 'Enter':
                this.confirmExit(this.exitModalIndex === 0);
                break;
                
            case 'Escape':
                this.cancelExitModal();
                break;
        }
    }

    updateExitModalSelection() {
        document.getElementById('exit-yes').classList.toggle('selected', this.exitModalIndex === 0);
        document.getElementById('exit-no').classList.toggle('selected', this.exitModalIndex === 1);
    }

    confirmExit(saveChanges) {
    if (saveChanges) {
        this.saveState();
        this.playNavSound(1000, 200);
        
        const modal = document.getElementById('exit-modal');
        modal.innerHTML = `
            <div style="text-align: center; color: #90ee90; padding: 20px;">
                <h3>SELECT BOOT DEVICE</h3>
                <p style="color: #aaa; margin-bottom: 30px;">Choose operating system to launch:</p>
                
                <div class="os-selection-grid">
                    <div class="os-option" data-os="macos">
                        <div class="os-icon">🖥️</div>
                        <div class="os-name">macOS Catalina</div>
                        <div class="os-desc">Apple Desktop Environment</div>
                        <div class="os-hotkey">[1]</div>
                    </div>
                    
                    <div class="os-option" data-os="windows">
                        <div class="os-icon">🪟</div>
                        <div class="os-name">Windows 8.1</div>
                        <div class="os-desc">Microsoft Metro UI</div>
                        <div class="os-hotkey">[2]</div>
                    </div>
                    
                    <div class="os-option" data-os="bios">
                        <div class="os-icon">⚙️</div>
                        <div class="os-name">Return to BIOS</div>
                        <div class="os-desc">System Configuration</div>
                        <div class="os-hotkey">[3]</div>
                    </div>
                </div>
                
                <div style="margin-top: 40px; padding: 15px; background: rgba(0, 30, 0, 0.3); border: 1px solid #333; border-radius: 5px;">
                    <div style="color: #fff; font-weight: bold; margin-bottom: 10px;">Boot Information</div>
                    <div style="color: #aaa; font-size: 0.9em;">
                        Primary Boot Device: <span style="color: #90ee90;">${this.state.bootOrder[0] || 'Hard Disk'}</span><br>
                        Quick Boot: <span style="color: ${this.state.quickBoot ? '#90ee90' : '#ff6666'}">${this.state.quickBoot ? 'Enabled' : 'Disabled'}</span> | 
                        Boot Delay: <span style="color: #90ee90;">${this.state.bootDelay || 0}s</span>
                    </div>
                </div>
                
                <div style="margin-top: 30px; color: #666; font-size: 0.9em;">
                    ↑↓←→ or 1/2/3 : Navigate   Enter : Select   ESC : Cancel
                </div>
            </div>
        `;
        
        this.setupOSSelection();
    } else {
        // Exit without saving (reboot)
        this.playNavSound(800, 150);
        this.reboot();
    }
}

setupOSSelection() {
    const options = document.querySelectorAll('.os-option');
    let selectedIndex = 0;
    
    options[0].classList.add('selected');
    
    // Keyboard navigation
    const keyHandler = (e) => {
        if (!document.getElementById('exit-modal')) {
            document.removeEventListener('keydown', keyHandler);
            return;
        }
        
        // Number keys for quick selection
        if (e.key >= '1' && e.key <= '3') {
            e.preventDefault();
            const index = parseInt(e.key) - 1;
            options.forEach(opt => opt.classList.remove('selected'));
            options[index].classList.add('selected');
            selectedIndex = index;
            this.playNavSound(700, 50);
            
            // Auto-select after short delay
            setTimeout(() => {
                this.bootToOS(options[index].dataset.os);
            }, 300);
            return;
        }
        
        switch(e.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                options[selectedIndex].classList.remove('selected');
                selectedIndex = (selectedIndex - 1 + options.length) % options.length;
                options[selectedIndex].classList.add('selected');
                this.playNavSound(600, 30);
                break;
                
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                options[selectedIndex].classList.remove('selected');
                selectedIndex = (selectedIndex + 1) % options.length;
                options[selectedIndex].classList.add('selected');
                this.playNavSound(600, 30);
                break;
                
            case 'Enter':
                e.preventDefault();
                const selectedOS = options[selectedIndex].dataset.os;
                this.bootToOS(selectedOS);
                break;
                
            case 'Escape':
                e.preventDefault();
                this.cancelExitModal();
                document.removeEventListener('keydown', keyHandler);
                break;
                
            case ' ':
                e.preventDefault();
                // Space toggles quick boot preview
                this.toggleQuickBootPreview();
                break;
        }
    };
    
    document.addEventListener('keydown', keyHandler);
    
    // Click handlers
    options.forEach((option, index) => {
        option.addEventListener('click', () => {
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedIndex = index;
            this.bootToOS(option.dataset.os);
        });
        
        // Hover effects
        option.addEventListener('mouseenter', () => {
            if (!option.classList.contains('selected')) {
                option.style.transform = 'translateY(-2px)';
                this.playNavSound(500, 20);
            }
        });
        
        option.addEventListener('mouseleave', () => {
            if (!option.classList.contains('selected')) {
                option.style.transform = '';
            }
        });
    });
}

toggleQuickBootPreview() {
    if (!this.state.quickBoot) return;
    
    // Show quick boot animation
    const modal = document.getElementById('exit-modal');
    const originalContent = modal.innerHTML;
    
    modal.innerHTML = `
        <div style="text-align: center; color: #90ee90; padding: 40px;">
            <h3>QUICK BOOT ENABLED</h3>
            <div style="margin: 30px;">
                <div style="width: 100%; height: 20px; background: #222; border: 1px solid #333; border-radius: 10px; overflow: hidden;">
                    <div id="quick-boot-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #004400, #00ff00); transition: width 0.5s;"></div>
                </div>
            </div>
            <p>Bypassing boot menu...</p>
        </div>
    `;
    
    setTimeout(() => {
        document.getElementById('quick-boot-progress').style.width = '100%';
    }, 100);
    
    setTimeout(() => {
        // Boot to primary OS (macOS by default)
        this.bootToOS('macos');
    }, 600);
}

bootToOS(osType) {
    const osURLs = {
        'macos': 'https://macoswebemulator.vercel.app',
        'windows': 'https://windows-8-web-os.vercel.app',
        'bios': null
    };
    
    const osNames = {
        'macos': 'macOS Catalina',
        'windows': 'Windows 8.1',
        'bios': 'BIOS Setup'
    };
    
    this.playNavSound(1200, 150);
    
    const modal = document.getElementById('exit-modal');
    const bootMessages = [
        "Initializing system hardware...",
        "Loading boot loader...",
        "Verifying system integrity...",
        "Starting operating system...",
        "Welcome to " + osNames[osType]
    ];
    
    let messageIndex = 0;
    
    modal.innerHTML = `
        <div style="text-align: center; color: #90ee90; padding: 40px;">
            <h3>BOOTING ${osNames[osType].toUpperCase()}</h3>
            <div style="margin: 30px;">
                <div style="width: 100%; height: 20px; background: #222; border: 1px solid #333; border-radius: 10px; overflow: hidden;">
                    <div id="boot-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #004400, #00aa00); transition: width 1.5s;"></div>
                </div>
            </div>
            <p id="boot-message">${bootMessages[0]}</p>
            <div style="margin-top: 20px; color: #666; font-size: 0.9em;">
                Booting from: <span style="color: #90ee90;">${this.state.bootOrder[0] || 'Hard Disk'}</span>
            </div>
        </div>
    `;
    
    // Animate progress bar with messages
    const progressBar = document.getElementById('boot-progress');
    const messageElement = document.getElementById('boot-message');
    
    const updateBootProgress = (progress, message) => {
        progressBar.style.width = progress + '%';
        if (message) {
            messageElement.textContent = message;
            // Play a subtle sound for each step
            this.playNavSound(800 + messageIndex * 100, 30);
        }
    };
    
    // Simulate boot sequence
    const bootSequence = [
        {delay: 200, progress: 15, message: bootMessages[0]},
        {delay: 500, progress: 35, message: bootMessages[1]},
        {delay: 800, progress: 60, message: bootMessages[2]},
        {delay: 1100, progress: 85, message: bootMessages[3]},
        {delay: 1400, progress: 100, message: bootMessages[4]}
    ];
    
    bootSequence.forEach((step, index) => {
        setTimeout(() => {
            updateBootProgress(step.progress, step.message);
        }, step.delay);
    });
    
    // Redirect after animation
    setTimeout(() => {
        if (osType === 'bios') {
            this.cancelExitModal();
        } else {
            // Open in new tab
            window.open(osURLs[osType], '_blank');
            // Also update browser URL for testing
            window.history.pushState({}, '', osURLs[osType]);
            // Show return message
            modal.innerHTML = `
                <div style="text-align: center; color: #90ee90; padding: 40px;">
                    <h3>BOOT COMPLETE</h3>
                    <div style="font-size: 4em; margin: 30px;">✅</div>
                    <p>${osNames[osType]} is now running in a new tab.</p>
                    <div style="margin-top: 30px; color: #aaa; font-size: 0.9em;">
                        <p>If pop-up was blocked, check your browser settings.</p>
                        <p>Or manually visit:<br>
                        <code style="color: #90ee90; background: rgba(0,0,0,0.3); padding: 5px 10px; border-radius: 3px;">${osURLs[osType]}</code></p>
                    </div>
                    <div style="margin-top: 30px;">
                        <button onclick="window.BIOSMenu.cancelExitModal()" style="
                            background: rgba(144, 238, 144, 0.2);
                            border: 1px solid #90ee90;
                            color: #90ee90;
                            padding: 10px 20px;
                            cursor: pointer;
                            font-family: 'IBM Plex Mono', monospace;
                            border-radius: 3px;
                        ">Return to BIOS</button>
                    </div>
                </div>
            `;
        }
    }, 1600);
}

    cancelExitModal() {
        this.exitModalActive = false;
        const modal = document.getElementById('exit-modal');
        if (modal) modal.remove();
        this.playNavSound(500, 50);
    }

    reboot() {
        const screen = document.getElementById('bios-screen');
        screen.innerHTML = `
            <div style="text-align: center; padding-top: 200px; color: #90ee90;">
                <h2>SYSTEM REBOOTING</h2>
                <p>Please wait while the system restarts...</p>
                <div style="margin-top: 50px; font-size: 3em;">⌛</div>
            </div>
        `;
        
        setTimeout(() => {
            location.reload();
        }, 3000);
    }

    playNavSound(freq, duration) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration/1000);
        } catch (e) {
            console.log("Audio not available:", e);
        }
    }

    saveState() {
        localStorage.setItem('biosState', JSON.stringify({
            date: this.state.date.toISOString(),
            time: this.state.time.toISOString(),
            bootOrder: this.state.bootOrder,
            quickBoot: this.state.quickBoot,
            bootNumLock: this.state.bootNumLock,
            bootDelay: this.state.bootDelay,
            securityLevel: this.state.securityLevel
        }));
        
        this.showToast('Configuration saved to CMOS');
    }

    loadState() {
        const saved = localStorage.getItem('biosState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.state.date = new Date(state.date);
                this.state.time = new Date(state.time);
                this.state.bootOrder = state.bootOrder || ['Hard Disk', 'CD-ROM', 'Floppy', 'Network'];
                this.state.quickBoot = state.quickBoot !== undefined ? state.quickBoot : true;
                this.state.bootNumLock = state.bootNumLock !== undefined ? state.bootNumLock : true;
                this.state.bootDelay = state.bootDelay || 0;
                this.state.securityLevel = state.securityLevel || 'None';
            } catch (e) {
                console.log('Error loading saved state:', e);
            }
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 50, 0, 0.9);
            color: #90ee90;
            padding: 10px 20px;
            border: 1px solid #90ee90;
            border-radius: 3px;
            z-index: 1000;
            animation: slideIn 0.3s, fadeOut 0.3s 2s forwards;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 2300);
    }

    // Hardware Monitor methods (simplified version)
    initHardwareMonitor() {
        this.hardwareMonitor = {
            state: {
                cpuTemp: 45,
                cpuVoltage: 1.2,
                cpuLoad: 15,
                fanSpeed: 1200
            },
            canvases: {},
            gauges: {},
            animationId: null,
            
            init: function() {
                this.initGauges();
                this.startSimulation();
            },
            
            initGauges: function() {
                ['cpu-temp', 'cpu-voltage', 'fan-speed', 'cpu-load'].forEach(id => {
                    const canvas = document.getElementById(`gauge-${id}`);
                    if (canvas) {
                        this.canvases[id] = canvas;
                        this.gauges[id] = {
                            ctx: canvas.getContext('2d'),
                            value: this.state[id.replace('-', '')] || 0
                        };
                        this.drawGauge(id);
                    }
                });
                
                // Initialize load graph
                this.initLoadGraph();
            },
            
            drawGauge: function(gaugeId) {
                // Simplified gauge drawing
                const gauge = this.gauges[gaugeId];
                if (!gauge) return;
                
                const ctx = gauge.ctx;
                const canvas = this.canvases[gaugeId];
                const width = canvas.width;
                const height = canvas.height;
                const centerX = width / 2;
                const centerY = height / 2;
                const radius = Math.min(width, height) / 2 - 10;
                
                ctx.clearRect(0, 0, width, height);
                
                // Draw gauge background
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
                ctx.fill();
                
                // Update display values
                const value = this.state[gaugeId.replace('-', '')];
                if (gaugeId === 'cpu-temp') {
                    document.getElementById('value-cpu-temp').textContent = `${value}°C`;
                } else if (gaugeId === 'cpu-voltage') {
                    document.getElementById('value-cpu-voltage').textContent = `${value.toFixed(2)}V`;
                } else if (gaugeId === 'fan-speed') {
                    document.getElementById('value-fan-speed').textContent = `${value} RPM`;
                } else if (gaugeId === 'cpu-load') {
                    document.getElementById('value-cpu-load').textContent = `${value}%`;
                }
            },
            
            initLoadGraph: function() {
                // Simple load graph initialization
                const canvas = document.getElementById('load-graph');
                if (!canvas) return;
                
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'rgba(0, 20, 0, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            },
            
            startSimulation: function() {
                this.animationId = requestAnimationFrame(() => this.updateSimulation());
            },
            
            updateSimulation: function() {
                // Simulate random fluctuations
                this.state.cpuLoad = 15 + Math.sin(Date.now() / 2000) * 10 + Math.random() * 5;
                this.state.cpuTemp = 45 + (this.state.cpuLoad - 15) * 0.3;
                this.state.fanSpeed = 1200 + (this.state.cpuTemp - 45) * 20;
                this.state.cpuVoltage = 1.2 + Math.sin(Date.now() / 3000) * 0.05;
                
                // Update all gauges
                Object.keys(this.gauges).forEach(id => this.drawGauge(id));
                
                // Update time
                document.getElementById('info-time').textContent = new Date().toLocaleTimeString('en-US', { 
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                
                this.animationId = requestAnimationFrame(() => this.updateSimulation());
            },
            
            resetSimulation: function() {
                this.state = {
                    cpuTemp: 45,
                    cpuVoltage: 1.2,
                    cpuLoad: 15,
                    fanSpeed: 1200
                };
                
                Object.keys(this.gauges).forEach(id => this.drawGauge(id));
            },
            
            startStressTest: function() {
                const originalLoad = this.state.cpuLoad;
                const interval = setInterval(() => {
                    this.state.cpuLoad = Math.min(100, this.state.cpuLoad + 10);
                    this.state.cpuTemp = Math.min(95, this.state.cpuTemp + 5);
                    this.state.fanSpeed = Math.min(3000, this.state.fanSpeed + 200);
                    
                    Object.keys(this.gauges).forEach(id => this.drawGauge(id));
                }, 500);
                
                setTimeout(() => clearInterval(interval), 10000);
            },
            
            stop: function() {
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                    this.animationId = null;
                }
            }
        };
    }
}

// Start the BIOS menu when POST completes
window.BIOSMenu = new BIOSMenu();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);