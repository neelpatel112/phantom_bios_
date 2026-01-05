class BIOSMenu {
    constructor() {
        // Menu structure - INCLUDES BOOT MANAGER
        this.menuItems = [
            { id: 'standard-cmos', title: "STANDARD CMOS SETUP", desc: "Date, Time, Hard Disk Type", type: 'settings' },
            { id: 'bios-features', title: "BIOS FEATURES SETUP", desc: "Advanced BIOS Options", type: 'settings' },
            { id: 'chipset', title: "CHIPSET FEATURES SETUP", desc: "Chipset Configuration", type: 'settings' },
            { id: 'power', title: "POWER MANAGEMENT SETUP", desc: "Power Saving Options", type: 'settings' },
            { id: 'pnp', title: "PNP/PCI CONFIGURATION", desc: "Plug & Play Settings", type: 'settings' },
            { id: 'load-bios-defaults', title: "LOAD BIOS DEFAULTS", desc: "Load Default Settings", action: 'loadDefaults' },
            { id: 'load-setup-defaults', title: "LOAD SETUP DEFAULTS", desc: "Load Optimized Defaults", action: 'loadOptimized' },
            { id: 'peripherals', title: "INTEGRATED PERIPHERALS", desc: "Onboard Devices", type: 'settings' },
            { id: 'boot-manager', title: "BOOT MANAGER", desc: "Configure Boot Device Order", type: 'settings' },
            { id: 'hardware-monitor', title: "HARDWARE MONITOR", desc: "Temperature & Voltage", type: 'settings' },
            { id: 'supervisor-password', title: "SUPERVISOR PASSWORD", desc: "Set Administrator Password", action: 'setPassword', passwordType: 'supervisor' },
            { id: 'user-password', title: "USER PASSWORD", desc: "Set User Password", action: 'setPassword', passwordType: 'user' },
            { id: 'save-exit', title: "SAVE & EXIT SETUP", desc: "Save Changes and Reboot", action: 'saveExit' },
            { id: 'exit-without-saving', title: "EXIT WITHOUT SAVING", desc: "Discard Changes and Reboot", action: 'exitWithoutSave' }
        ];

        // System state (settings)
        this.state = {
            date: new Date(),
            time: new Date(),
            bootOrder: ['Hard Disk', 'CD-ROM', 'USB', 'Network'],
            cpuSpeed: '1000MHz',
            memorySpeed: '133MHz',
            virtualization: false,
            quickBoot: true,
            bootNumLock: true,
            bootDelay: 0,
            securityLevel: 'None',
            supervisorPassword: '',
            userPassword: '',
            biosFeatures: {
                cpuCache: 'Enabled',
                quickPowerOnSelfTest: 'Enabled',
                bootVirusDetection: 'Disabled',
                processorNumber: 'Enabled',
                hddSmarterror: 'Enabled',
                bootSequence: ['Hard Disk', 'CD-ROM', 'USB', 'Network'],
                swapFloppy: 'Disabled',
                bootUpNumLock: 'On',
                gateA20: 'Fast',
                typematicRate: 'Fast',
                typematicDelay: 'Short',
                securityOption: 'Setup'
            },
            chipsetFeatures: {
                sdramTiming: 'Auto',
                sdramCASLatency: '2.5',
                agpAperture: '64MB',
                agpMode: '4X',
                onboardSound: 'Auto',
                onboardLan: 'Enabled',
                usbController: 'Enabled'
            },
            powerManagement: {
                acpiSuspend: 'S1(POS)',
                powerButton: 'Delay 4 Sec',
                wakeOnLan: 'Enabled',
                wakeOnRing: 'Disabled',
                cpuFanOffInSuspend: 'Enabled',
                pmEvents: 'Enabled'
            },
            pnpConfiguration: {
                pnpOsInstalled: 'No',
                resetConfigurationData: 'Disabled',
                resourcesControlledBy: 'Auto',
                irqResources: 'Legacy',
                dmaResources: 'Legacy'
            },
            peripherals: {
                onboardFdc: 'Enabled',
                serialPort1: '3F8/IRQ4',
                serialPort2: '2F8/IRQ3',
                parallelPort: '378/IRQ7',
                parallelMode: 'ECP+EPP',
                idePrimaryMaster: 'Auto',
                idePrimarySlave: 'Auto',
                ideSecondaryMaster: 'Auto',
                ideSecondarySlave: 'Auto',
                usbKeyboardSupport: 'Enabled'
            }
        };

        // Navigation state
        this.currentIndex = 0;
        this.inSettingsPage = false;
        this.currentSettingsPage = null;
        this.exitModalActive = false;
        this.exitModalIndex = 0;
        this.editingField = null;
        this.editingValue = '';

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
        this.createBiosFeaturesPage();
        this.createChipsetFeaturesPage();
        this.createPowerManagementPage();
        this.createPnPConfigurationPage();
        this.createPeripheralsPage();
        this.createHardwareMonitorPage();
        this.createBootManagerPage();
        
        // Create password pages
        this.createPasswordPage();
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
                    <span class="setting-value editable" data-field="idePrimaryMaster">
                        ${this.state.peripherals.idePrimaryMaster}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Primary Slave:</span>
                    <span class="setting-value editable" data-field="idePrimarySlave">
                        ${this.state.peripherals.idePrimarySlave}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Secondary Master:</span>
                    <span class="setting-value editable" data-field="ideSecondaryMaster">
                        ${this.state.peripherals.ideSecondaryMaster}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Secondary Slave:</span>
                    <span class="setting-value editable" data-field="ideSecondarySlave">
                        ${this.state.peripherals.ideSecondarySlave}
                    </span>
                </div>
            </div>
            
            <div class="help-footer">
                ↑↓ : Select Item   ←→ : Change Value   +/- : Adjust   Enter: Edit   F10: Save   ESC: Exit
            </div>
        `;
        
        this.settingsContainer.appendChild(page);
        
        // Add click handlers for editable fields
        const editableFields = page.querySelectorAll('.editable');
        editableFields.forEach(field => {
            field.addEventListener('click', (e) => {
                if (field.id === 'date-value') {
                    this.editDate();
                } else if (field.id === 'time-value') {
                    this.editTime();
                } else {
                    const fieldName = field.dataset.field;
                    this.editField(fieldName, field);
                }
            });
        });
    }

    createBiosFeaturesPage() {
        const page = document.createElement('div');
        page.className = 'settings-page';
        page.id = 'page-bios-features';
        page.innerHTML = `
            <div class="settings-header">BIOS FEATURES SETUP</div>
            
            <div class="settings-group">
                <h3 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    CPU & MEMORY SETTINGS
                </h3>
                
                <div class="setting-row">
                    <span class="setting-label">CPU Internal Cache:</span>
                    <span class="setting-value editable" data-field="cpuCache" data-options="Enabled,Disabled">
                        ${this.state.biosFeatures.cpuCache}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Quick Power On Self Test:</span>
                    <span class="setting-value editable" data-field="quickPowerOnSelfTest" data-options="Enabled,Disabled">
                        ${this.state.biosFeatures.quickPowerOnSelfTest}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Boot Virus Detection:</span>
                    <span class="setting-value editable" data-field="bootVirusDetection" data-options="Enabled,Disabled">
                        ${this.state.biosFeatures.bootVirusDetection}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Processor Number Feature:</span>
                    <span class="setting-value editable" data-field="processorNumber" data-options="Enabled,Disabled">
                        ${this.state.biosFeatures.processorNumber}
                    </span>
                </div>
            </div>
            
            <div class="settings-group">
                <h3 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    BOOT SETTINGS
                </h3>
                
                <div class="setting-row">
                    <span class="setting-label">Boot Up NumLock Status:</span>
                    <span class="setting-value editable" data-field="bootUpNumLock" data-options="On,Off">
                        ${this.state.biosFeatures.bootUpNumLock}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Security Option:</span>
                    <span class="setting-value editable" data-field="securityOption" data-options="Setup,System">
                        ${this.state.biosFeatures.securityOption}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Swap Floppy Drive:</span>
                    <span class="setting-value editable" data-field="swapFloppy" data-options="Enabled,Disabled">
                        ${this.state.biosFeatures.swapFloppy}
                    </span>
                </div>
            </div>
            
            <div class="settings-group">
                <h3 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    KEYBOARD SETTINGS
                </h3>
                
                <div class="setting-row">
                    <span class="setting-label">Typematic Rate Setting:</span>
                    <span class="setting-value editable" data-field="typematicRate" data-options="Disabled,Enabled">
                        ${this.state.biosFeatures.typematicRate}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Typematic Rate (Chars/Sec):</span>
                    <span class="setting-value editable" data-field="typematicRate" data-options="6,8,10,12,15,20,24,30">
                        ${this.state.biosFeatures.typematicRate}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Typematic Delay (Msec):</span>
                    <span class="setting-value editable" data-field="typematicDelay" data-options="250,500,750,1000">
                        ${this.state.biosFeatures.typematicDelay}
                    </span>
                </div>
            </div>
            
            <div class="help-footer">
                ↑↓ : Select Item   ←→ : Change Value   +/- : Adjust   Enter: Edit   F10: Save   ESC: Exit
            </div>
        `;
        
        this.settingsContainer.appendChild(page);
        
        // Add click handlers for editable fields
        setTimeout(() => {
            const editableFields = page.querySelectorAll('.editable');
            editableFields.forEach(field => {
                field.addEventListener('click', (e) => {
                    const fieldName = field.dataset.field;
                    this.editField(fieldName, field);
                });
            });
        }, 10);
    }

    createChipsetFeaturesPage() {
        const page = document.createElement('div');
        page.className = 'settings-page';
        page.id = 'page-chipset';
        page.innerHTML = `
            <div class="settings-header">CHIPSET FEATURES SETUP</div>
            
            <div class="settings-group">
                <h3 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    MEMORY SETTINGS
                </h3>
                
                <div class="setting-row">
                    <span class="setting-label">SDRAM Timing:</span>
                    <span class="setting-value editable" data-field="sdramTiming" data-options="Auto,Manual">
                        ${this.state.chipsetFeatures.sdramTiming}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">SDRAM CAS Latency:</span>
                    <span class="setting-value editable" data-field="sdramCASLatency" data-options="2,2.5,3">
                        ${this.state.chipsetFeatures.sdramCASLatency}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">AGP Aperture Size:</span>
                    <span class="setting-value editable" data-field="agpAperture" data-options="32MB,64MB,128MB,256MB">
                        ${this.state.chipsetFeatures.agpAperture}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">AGP Mode:</span>
                    <span class="setting-value editable" data-field="agpMode" data-options="1X,2X,4X">
                        ${this.state.chipsetFeatures.agpMode}
                    </span>
                </div>
            </div>
            
            <div class="settings-group">
                <h3 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    ONBOARD DEVICES
                </h3>
                
                <div class="setting-row">
                    <span class="setting-label">Onboard Sound Controller:</span>
                    <span class="setting-value editable" data-field="onboardSound" data-options="Auto,Enabled,Disabled">
                        ${this.state.chipsetFeatures.onboardSound}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Onboard LAN Controller:</span>
                    <span class="setting-value editable" data-field="onboardLan" data-options="Enabled,Disabled">
                        ${this.state.chipsetFeatures.onboardLan}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">USB Controller:</span>
                    <span class="setting-value editable" data-field="usbController" data-options="Enabled,Disabled">
                        ${this.state.chipsetFeatures.usbController}
                    </span>
                </div>
            </div>
            
            <div class="help-footer">
                ↑↓ : Select Item   ←→ : Change Value   +/- : Adjust   Enter: Edit   F10: Save   ESC: Exit
            </div>
        `;
        
        this.settingsContainer.appendChild(page);
        
        // Add click handlers for editable fields
        setTimeout(() => {
            const editableFields = page.querySelectorAll('.editable');
            editableFields.forEach(field => {
                field.addEventListener('click', (e) => {
                    const fieldName = field.dataset.field;
                    this.editField(fieldName, field);
                });
            });
        }, 10);
    }

    createPowerManagementPage() {
        const page = document.createElement('div');
        page.className = 'settings-page';
        page.id = 'page-power';
        page.innerHTML = `
            <div class="settings-header">POWER MANAGEMENT SETUP</div>
            
            <div class="settings-group">
                <h3 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    POWER SAVING
                </h3>
                
                <div class="setting-row">
                    <span class="setting-label">ACPI Suspend Type:</span>
                    <span class="setting-value editable" data-field="acpiSuspend" data-options="S1(POS),S3(STR)">
                        ${this.state.powerManagement.acpiSuspend}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Power Button Function:</span>
                    <span class="setting-value editable" data-field="powerButton" data-options="Instant Off,Delay 4 Sec">
                        ${this.state.powerManagement.powerButton}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Wake On LAN:</span>
                    <span class="setting-value editable" data-field="wakeOnLan" data-options="Enabled,Disabled">
                        ${this.state.powerManagement.wakeOnLan}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Wake On Ring:</span>
                    <span class="setting-value editable" data-field="wakeOnRing" data-options="Enabled,Disabled">
                        ${this.state.powerManagement.wakeOnRing}
                    </span>
                </div>
            </div>
            
            <div class="settings-group">
                <h3 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    FAN CONTROL
                </h3>
                
                <div class="setting-row">
                    <span class="setting-label">CPU Fan Off In Suspend:</span>
                    <span class="setting-value editable" data-field="cpuFanOffInSuspend" data-options="Enabled,Disabled">
                        ${this.state.powerManagement.cpuFanOffInSuspend}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">PME Events Wake Up:</span>
                    <span class="setting-value editable" data-field="pmEvents" data-options="Enabled,Disabled">
                        ${this.state.powerManagement.pmEvents}
                    </span>
                </div>
            </div>
            
            <div class="help-footer">
                ↑↓ : Select Item   ←→ : Change Value   +/- : Adjust   Enter: Edit   F10: Save   ESC: Exit
            </div>
        `;
        
        this.settingsContainer.appendChild(page);
        
        // Add click handlers for editable fields
        setTimeout(() => {
            const editableFields = page.querySelectorAll('.editable');
            editableFields.forEach(field => {
                field.addEventListener('click', (e) => {
                    const fieldName = field.dataset.field;
                    this.editField(fieldName, field);
                });
            });
        }, 10);
    }

    createPnPConfigurationPage() {
        const page = document.createElement('div');
        page.className = 'settings-page';
        page.id = 'page-pnp';
        page.innerHTML = `
            <div class="settings-header">PNP/PCI CONFIGURATION</div>
            
            <div class="settings-group">
                <h3 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    PLUG & PLAY SETTINGS
                </h3>
                
                <div class="setting-row">
                    <span class="setting-label">PNP OS Installed:</span>
                    <span class="setting-value editable" data-field="pnpOsInstalled" data-options="Yes,No">
                        ${this.state.pnpConfiguration.pnpOsInstalled}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Reset Configuration Data:</span>
                    <span class="setting-value editable" data-field="resetConfigurationData" data-options="Enabled,Disabled">
                        ${this.state.pnpConfiguration.resetConfigurationData}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Resources Controlled By:</span>
                    <span class="setting-value editable" data-field="resourcesControlledBy" data-options="Auto,Manual">
                        ${this.state.pnpConfiguration.resourcesControlledBy}
                    </span>
                </div>
            </div>
            
            <div class="settings-group">
                <h3 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    RESOURCE SETTINGS
                </h3>
                
                <div class="setting-row">
                    <span class="setting-label">IRQ Resources:</span>
                    <span class="setting-value editable" data-field="irqResources" data-options="Legacy,PCI/PnP">
                        ${this.state.pnpConfiguration.irqResources}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">DMA Resources:</span>
                    <span class="setting-value editable" data-field="dmaResources" data-options="Legacy,PCI/PnP">
                        ${this.state.pnpConfiguration.dmaResources}
                    </span>
                </div>
            </div>
            
            <div class="help-footer">
                ↑↓ : Select Item   ←→ : Change Value   +/- : Adjust   Enter: Edit   F10: Save   ESC: Exit
            </div>
        `;
        
        this.settingsContainer.appendChild(page);
        
        // Add click handlers for editable fields
        setTimeout(() => {
            const editableFields = page.querySelectorAll('.editable');
            editableFields.forEach(field => {
                field.addEventListener('click', (e) => {
                    const fieldName = field.dataset.field;
                    this.editField(fieldName, field);
                });
            });
        }, 10);
    }

    createPeripheralsPage() {
        const page = document.createElement('div');
        page.className = 'settings-page';
        page.id = 'page-peripherals';
        page.innerHTML = `
            <div class="settings-header">INTEGRATED PERIPHERALS</div>
            
            <div class="settings-group">
                <h3 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    SERIAL/PARALLEL PORTS
                </h3>
                
                <div class="setting-row">
                    <span class="setting-label">Onboard FDC Controller:</span>
                    <span class="setting-value editable" data-field="onboardFdc" data-options="Enabled,Disabled">
                        ${this.state.peripherals.onboardFdc}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Serial Port 1:</span>
                    <span class="setting-value editable" data-field="serialPort1" data-options="Disabled,3F8/IRQ4,2F8/IRQ3,3E8/IRQ4,2E8/IRQ3">
                        ${this.state.peripherals.serialPort1}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Serial Port 2:</span>
                    <span class="setting-value editable" data-field="serialPort2" data-options="Disabled,3F8/IRQ4,2F8/IRQ3,3E8/IRQ4,2E8/IRQ3">
                        ${this.state.peripherals.serialPort2}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Parallel Port:</span>
                    <span class="setting-value editable" data-field="parallelPort" data-options="Disabled,378/IRQ7,278/IRQ5,3BC/IRQ7">
                        ${this.state.peripherals.parallelPort}
                    </span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">Parallel Port Mode:</span>
                    <span class="setting-value editable" data-field="parallelMode" data-options="SPP,EPP,ECP,ECP+EPP">
                        ${this.state.peripherals.parallelMode}
                    </span>
                </div>
            </div>
            
            <div class="settings-group">
                <h3 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    USB & KEYBOARD
                </h3>
                
                <div class="setting-row">
                    <span class="setting-label">USB Keyboard Support:</span>
                    <span class="setting-value editable" data-field="usbKeyboardSupport" data-options="Enabled,Disabled">
                        ${this.state.peripherals.usbKeyboardSupport}
                    </span>
                </div>
            </div>
            
            <div class="help-footer">
                ↑↓ : Select Item   ←→ : Change Value   +/- : Adjust   Enter: Edit   F10: Save   ESC: Exit
            </div>
        `;
        
        this.settingsContainer.appendChild(page);
        
        // Add click handlers for editable fields
        setTimeout(() => {
            const editableFields = page.querySelectorAll('.editable');
            editableFields.forEach(field => {
                field.addEventListener('click', (e) => {
                    const fieldName = field.dataset.field;
                    this.editField(fieldName, field);
                });
            });
        }, 10);
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

    createBootManagerPage() {
        const page = document.createElement('div');
        page.className = 'settings-page';
        page.id = 'page-boot-manager';
        
        const bootDevices = this.state.bootOrder || ['Hard Disk', 'CD-ROM', 'USB', 'Network'];
        
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

    createPasswordPage() {
        // Create password modal
        const modal = document.createElement('div');
        modal.id = 'password-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #000a14;
            border: 2px solid #333;
            padding: 30px;
            width: 400px;
            z-index: 1000;
            box-shadow: 0 0 50px rgba(0, 0, 0, 0.9);
        `;
        modal.innerHTML = `
            <div style="text-align: center; color: #fff; margin-bottom: 20px;">
                <h3 id="password-title">SET PASSWORD</h3>
                <p id="password-message">Enter new password (max 8 characters):</p>
                <input type="password" id="password-input" style="
                    width: 80%;
                    padding: 10px;
                    background: #000;
                    border: 1px solid #333;
                    color: #90ee90;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 1.2em;
                    text-align: center;
                    margin: 20px 0;
                " maxlength="8">
                <div style="color: #aaa; font-size: 0.9em; margin-top: 10px;">
                    Press Enter to confirm, ESC to cancel
                </div>
            </div>
        `;
        document.getElementById('bios-screen').appendChild(modal);
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
        if (document.getElementById('current-boot-device')) {
            document.getElementById('current-boot-device').textContent = bootDevices[0];
        }
    }

    getBootDeviceIcon(device) {
        const icons = {
            'Hard Disk': '💾',
            'CD-ROM': '💿',
            'USB': '🔌',
            'Network': '🌐',
            'Floppy': '📼',
            'SSD': '⚡'
        };
        return icons[device] || '💻';
    }

    getBootDeviceType(device) {
        const types = {
            'Hard Disk': 'ATA/IDE Drive',
            'CD-ROM': 'Optical Drive',
            'USB': 'USB Mass Storage',
            'Network': 'PXE Network Boot',
            'Floppy': 'Floppy Disk Drive',
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
        const quickBootToggle = document.getElementById('quick-boot-toggle');
        const numlockToggle = document.getElementById('numlock-toggle');
        const bootDelaySelect = document.getElementById('boot-delay-select');
        
        if (quickBootToggle) {
            quickBootToggle.addEventListener('change', (e) => {
                this.state.quickBoot = e.target.checked;
                const status = e.target.nextElementSibling.nextElementSibling;
                status.textContent = e.target.checked ? 'Enabled' : 'Disabled';
                status.style.color = e.target.checked ? '#90ee90' : '#aaa';
                this.saveState();
                this.showToast(`Quick Boot ${e.target.checked ? 'Enabled' : 'Disabled'}`);
            });
        }
        
        if (numlockToggle) {
            numlockToggle.addEventListener('change', (e) => {
                this.state.bootNumLock = e.target.checked;
                const status = e.target.nextElementSibling.nextElementSibling;
                status.textContent = e.target.checked ? 'On' : 'Off';
                status.style.color = e.target.checked ? '#90ee90' : '#aaa';
                this.saveState();
                this.showToast(`Boot NumLock ${e.target.checked ? 'On' : 'Off'}`);
            });
        }
        
        if (bootDelaySelect) {
            bootDelaySelect.addEventListener('change', (e) => {
                this.state.bootDelay = parseInt(e.target.value);
                this.saveState();
                this.showToast(`Boot delay set to ${e.target.value} seconds`);
            });
        }
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
        this.state.bootOrder = ['Hard Disk', 'CD-ROM', 'USB', 'Network'];
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

    formatDate(date) {
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    }

    formatTime(date = new Date()) {
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

    editField(fieldName, element) {
        this.editingField = fieldName;
        this.editingValue = element.textContent.trim();
        
        // Get options if available
        const options = element.dataset.options ? element.dataset.options.split(',') : [];
        
        element.classList.add('editing');
        
        if (options.length > 0) {
            // For fields with predefined options, create a dropdown
            const select = document.createElement('select');
            select.style.cssText = `
                background: #000a14;
                color: #fff;
                border: 1px solid #90ee90;
                font-family: 'IBM Plex Mono', monospace;
                padding: 2px 5px;
            `;
            
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                opt.selected = option === this.editingValue;
                select.appendChild(opt);
            });
            
            element.innerHTML = '';
            element.appendChild(select);
            
            select.focus();
            
            select.addEventListener('change', () => {
                this.saveField(fieldName, select.value);
            });
            
            select.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.saveField(fieldName, select.value);
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            });
        } else {
            // For free-form fields
            const input = document.createElement('input');
            input.type = 'text';
            input.value = this.editingValue;
            input.style.cssText = `
                background: #000a14;
                color: #fff;
                border: 1px solid #90ee90;
                font-family: 'IBM Plex Mono', monospace;
                padding: 2px 5px;
                width: 100px;
            `;
            
            element.innerHTML = '';
            element.appendChild(input);
            
            input.focus();
            input.select();
            
            const saveHandler = () => this.saveField(fieldName, input.value);
            
            input.addEventListener('blur', saveHandler);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    saveHandler();
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            });
        }
    }

    saveDate() {
        const input = document.getElementById('date-input');
        if (!input) return;
        
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
            this.showToast('Date updated');
        }
        
        this.updateDisplay();
    }

    saveTime() {
        const input = document.getElementById('time-input');
        if (!input) return;
        
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
            this.showToast('Time updated');
        }
        
        this.updateDisplay();
    }

    saveField(fieldName, value) {
        // Determine which settings category this field belongs to
        let settingsCategory = null;
        let subField = fieldName;
        
        if (fieldName in this.state.biosFeatures) {
            settingsCategory = 'biosFeatures';
        } else if (fieldName in this.state.chipsetFeatures) {
            settingsCategory = 'chipsetFeatures';
        } else if (fieldName in this.state.powerManagement) {
            settingsCategory = 'powerManagement';
        } else if (fieldName in this.state.pnpConfiguration) {
            settingsCategory = 'pnpConfiguration';
        } else if (fieldName in this.state.peripherals) {
            settingsCategory = 'peripherals';
        }
        
        if (settingsCategory) {
            this.state[settingsCategory][fieldName] = value;
            this.saveState();
            this.showToast(`${fieldName} set to ${value}`);
        }
        
        // Re-render the page to show updated value
        this.cancelEdit();
        
        // Refresh the current page
        const currentPage = document.getElementById(`page-${this.currentSettingsPage}`);
        if (currentPage) {
            // Recreate the page content
            this.recreateCurrentPage();
        }
    }

    recreateCurrentPage() {
        // This is a simplified version - in a real implementation, you'd update only the changed values
        const pageId = this.currentSettingsPage;
        const page = document.getElementById(`page-${pageId}`);
        if (!page) return;
        
        // Just update the display for now
        const editableFields = page.querySelectorAll('.editable');
        editableFields.forEach(field => {
            const fieldName = field.dataset.field;
            if (fieldName) {
                // Find the value in state
                let value = '';
                if (fieldName in this.state.biosFeatures) {
                    value = this.state.biosFeatures[fieldName];
                } else if (fieldName in this.state.chipsetFeatures) {
                    value = this.state.chipsetFeatures[fieldName];
                } else if (fieldName in this.state.powerManagement) {
                    value = this.state.powerManagement[fieldName];
                } else if (fieldName in this.state.pnpConfiguration) {
                    value = this.state.pnpConfiguration[fieldName];
                } else if (fieldName in this.state.peripherals) {
                    value = this.state.peripherals[fieldName];
                }
                
                if (value) {
                    field.textContent = value;
                }
            }
        });
    }

    cancelEdit() {
        this.editingField = null;
        this.editingValue = '';
        
        // Remove editing class from all fields
        document.querySelectorAll('.editing').forEach(el => {
            el.classList.remove('editing');
        });
        
        // Update display for date/time
        this.updateDisplay();
    }

    updateDisplay() {
        const dateValue = document.getElementById('date-value');
        const timeValue = document.getElementById('time-value');
        
        if (dateValue && !dateValue.querySelector('input')) {
            dateValue.textContent = this.formatDate(this.state.date);
        }
        if (timeValue && !timeValue.querySelector('input')) {
            timeValue.textContent = this.formatTime(this.state.time);
        }
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (this.exitModalActive) {
                this.handleExitModalKey(e);
                return;
            }
            
            // Check if password modal is active
            const passwordModal = document.getElementById('password-modal');
            if (passwordModal && passwordModal.style.display !== 'none') {
                this.handlePasswordModalKey(e);
                return;
            }
            
            // Check if we're editing a field
            if (this.editingField) {
                this.handleEditModeKey(e);
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
                    
                case '+':
                case '=':
                    if (this.inSettingsPage) {
                        e.preventDefault();
                        this.adjustValue(1);
                    }
                    break;
                    
                case '-':
                case '_':
                    if (this.inSettingsPage) {
                        e.preventDefault();
                        this.adjustValue(-1);
                    }
                    break;
            }
        });
    }

    handleEditModeKey(e) {
        switch(e.key) {
            case 'Escape':
                e.preventDefault();
                this.cancelEdit();
                break;
            case 'Enter':
                // Already handled in individual edit functions
                break;
        }
    }

    adjustValue(direction) {
        // Find the selected setting row
        const selectedRow = document.querySelector('.setting-row.selected');
        if (!selectedRow) return;
        
        const valueElement = selectedRow.querySelector('.setting-value');
        if (!valueElement || !valueElement.classList.contains('editable')) return;
        
        const fieldName = valueElement.dataset.field;
        if (!fieldName) return;
        
        // Get current value and options
        const currentValue = valueElement.textContent.trim();
        const options = valueElement.dataset.options ? valueElement.dataset.options.split(',') : [];
        
        if (options.length > 0) {
            // Find current index and move to next/prev
            const currentIndex = options.indexOf(currentValue);
            if (currentIndex !== -1) {
                let newIndex = currentIndex + direction;
                if (newIndex < 0) newIndex = options.length - 1;
                if (newIndex >= options.length) newIndex = 0;
                
                this.saveField(fieldName, options[newIndex]);
            }
        }
    }

    navigate(direction) {
        if (this.inSettingsPage) {
            // Navigation within settings page
            const rows = document.querySelectorAll('.setting-row');
            if (rows.length === 0) return;
            
            let currentIndex = 0;
            rows.forEach((row, index) => {
                if (row.classList.contains('selected')) {
                    currentIndex = index;
                }
            });
            
            rows.forEach(row => row.classList.remove('selected'));
            
            let newIndex = currentIndex + direction;
            if (newIndex < 0) newIndex = rows.length - 1;
            if (newIndex >= rows.length) newIndex = 0;
            
            rows[newIndex].classList.add('selected');
            rows[newIndex].scrollIntoView({ block: 'nearest' });
            
            this.playNavSound(600 + (direction * 100), 30);
        } else {
            // Navigation in main menu
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
            this.handleAction(item.action, item.passwordType);
        } else if (item.type === 'settings') {
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
            
            // Select first setting row
            setTimeout(() => {
                const firstRow = page.querySelector('.setting-row');
                if (firstRow) {
                    firstRow.classList.add('selected');
                }
            }, 10);
            
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
            this.editingField = null;
            document.querySelector('.menu-items').style.opacity = '1';
            
            this.playNavSound(500, 50);
        } else {
            // If in main menu, show exit modal
            this.showExitModal(false);
        }
    }

    handleAction(action, passwordType = null) {
        switch(action) {
            case 'loadDefaults':
                this.loadBIOSDefaults();
                break;
                
            case 'loadOptimized':
                this.loadOptimizedDefaults();
                break;
                
            case 'setPassword':
                this.showPasswordModal(passwordType);
                break;
                
            case 'saveExit':
                this.showExitModal(true);
                break;
                
            case 'exitWithoutSave':
                this.showExitModal(false);
                break;
        }
    }

    loadBIOSDefaults() {
        if (confirm('Load BIOS defaults? All settings will be reset to factory defaults.')) {
            // Reset to factory defaults
            this.state = {
                ...this.state,
                biosFeatures: {
                    cpuCache: 'Enabled',
                    quickPowerOnSelfTest: 'Enabled',
                    bootVirusDetection: 'Disabled',
                    processorNumber: 'Enabled',
                    hddSmarterror: 'Enabled',
                    bootSequence: ['Hard Disk', 'CD-ROM', 'USB', 'Network'],
                    swapFloppy: 'Disabled',
                    bootUpNumLock: 'On',
                    gateA20: 'Fast',
                    typematicRate: 'Fast',
                    typematicDelay: 'Short',
                    securityOption: 'Setup'
                },
                chipsetFeatures: {
                    sdramTiming: 'Auto',
                    sdramCASLatency: '2.5',
                    agpAperture: '64MB',
                    agpMode: '4X',
                    onboardSound: 'Auto',
                    onboardLan: 'Enabled',
                    usbController: 'Enabled'
                },
                powerManagement: {
                    acpiSuspend: 'S1(POS)',
                    powerButton: 'Delay 4 Sec',
                    wakeOnLan: 'Enabled',
                    wakeOnRing: 'Disabled',
                    cpuFanOffInSuspend: 'Enabled',
                    pmEvents: 'Enabled'
                },
                pnpConfiguration: {
                    pnpOsInstalled: 'No',
                    resetConfigurationData: 'Disabled',
                    resourcesControlledBy: 'Auto',
                    irqResources: 'Legacy',
                    dmaResources: 'Legacy'
                },
                peripherals: {
                    onboardFdc: 'Enabled',
                    serialPort1: '3F8/IRQ4',
                    serialPort2: '2F8/IRQ3',
                    parallelPort: '378/IRQ7',
                    parallelMode: 'ECP+EPP',
                    idePrimaryMaster: 'Auto',
                    idePrimarySlave: 'Auto',
                    ideSecondaryMaster: 'Auto',
                    ideSecondarySlave: 'Auto',
                    usbKeyboardSupport: 'Enabled'
                },
                bootOrder: ['Hard Disk', 'CD-ROM', 'USB', 'Network'],
                quickBoot: false,
                bootNumLock: true,
                bootDelay: 0
            };
            
            this.saveState();
            this.showToast('BIOS defaults loaded');
            this.playNavSound(1000, 200);
            
            // Reload current page if in settings
            if (this.inSettingsPage && this.currentSettingsPage) {
                this.recreateCurrentPage();
            }
        }
    }

    loadOptimizedDefaults() {
        if (confirm('Load optimized defaults? All settings will be set for optimal performance.')) {
            // Set optimized defaults
            this.state = {
                ...this.state,
                biosFeatures: {
                    cpuCache: 'Enabled',
                    quickPowerOnSelfTest: 'Enabled',
                    bootVirusDetection: 'Disabled',
                    processorNumber: 'Enabled',
                    hddSmarterror: 'Enabled',
                    bootSequence: ['Hard Disk', 'CD-ROM', 'USB', 'Network'],
                    swapFloppy: 'Disabled',
                    bootUpNumLock: 'On',
                    gateA20: 'Fast',
                    typematicRate: 'Fast',
                    typematicDelay: 'Short',
                    securityOption: 'Setup'
                },
                chipsetFeatures: {
                    sdramTiming: 'Manual',
                    sdramCASLatency: '2',
                    agpAperture: '128MB',
                    agpMode: '4X',
                    onboardSound: 'Auto',
                    onboardLan: 'Enabled',
                    usbController: 'Enabled'
                },
                powerManagement: {
                    acpiSuspend: 'S1(POS)',
                    powerButton: 'Instant Off',
                    wakeOnLan: 'Disabled',
                    wakeOnRing: 'Disabled',
                    cpuFanOffInSuspend: 'Enabled',
                    pmEvents: 'Enabled'
                },
                pnpConfiguration: {
                    pnpOsInstalled: 'Yes',
                    resetConfigurationData: 'Disabled',
                    resourcesControlledBy: 'Auto',
                    irqResources: 'PCI/PnP',
                    dmaResources: 'PCI/PnP'
                },
                peripherals: {
                    onboardFdc: 'Enabled',
                    serialPort1: '3F8/IRQ4',
                    serialPort2: 'Disabled',
                    parallelPort: '378/IRQ7',
                    parallelMode: 'ECP+EPP',
                    idePrimaryMaster: 'Auto',
                    idePrimarySlave: 'Auto',
                    ideSecondaryMaster: 'Auto',
                    ideSecondarySlave: 'Auto',
                    usbKeyboardSupport: 'Enabled'
                },
                bootOrder: ['Hard Disk', 'CD-ROM', 'USB', 'Network'],
                quickBoot: true,
                bootNumLock: true,
                bootDelay: 0
            };
            
            this.saveState();
            this.showToast('Optimized defaults loaded');
            this.playNavSound(1200, 200);
            
            // Reload current page if in settings
            if (this.inSettingsPage && this.currentSettingsPage) {
                this.recreateCurrentPage();
            }
        }
    }

    showPasswordModal(passwordType) {
        const modal = document.getElementById('password-modal');
        const title = document.getElementById('password-title');
        const message = document.getElementById('password-message');
        const input = document.getElementById('password-input');
        
        if (passwordType === 'supervisor') {
            title.textContent = 'SET SUPERVISOR PASSWORD';
            message.textContent = 'Enter supervisor password (max 8 characters):';
        } else {
            title.textContent = 'SET USER PASSWORD';
            message.textContent = 'Enter user password (max 8 characters):';
        }
        
        input.value = '';
        modal.style.display = 'block';
        input.focus();
        
        this.currentPasswordType = passwordType;
    }

    handlePasswordModalKey(e) {
        const modal = document.getElementById('password-modal');
        const input = document.getElementById('password-input');
        
        switch(e.key) {
            case 'Enter':
                e.preventDefault();
                const password = input.value.trim();
                
                if (password.length > 0 && password.length <= 8) {
                    if (this.currentPasswordType === 'supervisor') {
                        this.state.supervisorPassword = password;
                        this.state.securityLevel = 'Supervisor';
                    } else {
                        this.state.userPassword = password;
                        if (this.state.securityLevel === 'None') {
                            this.state.securityLevel = 'User';
                        }
                    }
                    
                    this.saveState();
                    this.showToast(`${this.currentPasswordType === 'supervisor' ? 'Supervisor' : 'User'} password set`);
                    modal.style.display = 'none';
                    this.playNavSound(1000, 100);
                } else {
                    this.showToast('Password must be 1-8 characters');
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                modal.style.display = 'none';
                this.playNavSound(500, 50);
                break;
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
        const yesBtn = document.getElementById('exit-yes');
        const noBtn = document.getElementById('exit-no');
        
        if (yesBtn) yesBtn.classList.toggle('selected', this.exitModalIndex === 0);
        if (noBtn) noBtn.classList.toggle('selected', this.exitModalIndex === 1);
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
                messageIndex++;
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
            securityLevel: this.state.securityLevel,
            supervisorPassword: this.state.supervisorPassword,
            userPassword: this.state.userPassword,
            biosFeatures: this.state.biosFeatures,
            chipsetFeatures: this.state.chipsetFeatures,
            powerManagement: this.state.powerManagement,
            pnpConfiguration: this.state.pnpConfiguration,
            peripherals: this.state.peripherals
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
                this.state.bootOrder = state.bootOrder || ['Hard Disk', 'CD-ROM', 'USB', 'Network'];
                this.state.quickBoot = state.quickBoot !== undefined ? state.quickBoot : true;
                this.state.bootNumLock = state.bootNumLock !== undefined ? state.bootNumLock : true;
                this.state.bootDelay = state.bootDelay || 0;
                this.state.securityLevel = state.securityLevel || 'None';
                this.state.supervisorPassword = state.supervisorPassword || '';
                this.state.userPassword = state.userPassword || '';
                this.state.biosFeatures = state.biosFeatures || this.state.biosFeatures;
                this.state.chipsetFeatures = state.chipsetFeatures || this.state.chipsetFeatures;
                this.state.powerManagement = state.powerManagement || this.state.powerManagement;
                this.state.pnpConfiguration = state.pnpConfiguration || this.state.pnpConfiguration;
                this.state.peripherals = state.peripherals || this.state.peripherals;
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

    // Hardware Monitor methods
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
            loadHistory: [],
            
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
                
                // Draw gauge arc
                const value = this.state[gaugeId.replace('-', '')];
                const maxValues = {
                    'cpu-temp': 100,
                    'cpu-voltage': 1.5,
                    'fan-speed': 3000,
                    'cpu-load': 100
                };
                
                const maxValue = maxValues[gaugeId] || 100;
                const angle = (value / maxValue) * Math.PI * 2;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius - 5, 0, angle);
                ctx.lineWidth = 8;
                
                // Color based on value
                let color = '#90ee90';
                if (gaugeId === 'cpu-temp') {
                    if (value > 80) color = '#ff4444';
                    else if (value > 60) color = '#ffaa00';
                } else if (gaugeId === 'cpu-voltage') {
                    if (value > 1.4) color = '#ff4444';
                    else if (value > 1.3) color = '#ffaa00';
                }
                
                ctx.strokeStyle = color;
                ctx.stroke();
                
                // Update display values
                if (gaugeId === 'cpu-temp') {
                    document.getElementById('value-cpu-temp').textContent = `${Math.round(value)}°C`;
                    document.getElementById('status-cpu-temp').textContent = 
                        value > 80 ? 'Critical' : value > 60 ? 'High' : 'Normal';
                    document.getElementById('status-cpu-temp').style.color = 
                        value > 80 ? '#ff4444' : value > 60 ? '#ffaa00' : '#90ee90';
                } else if (gaugeId === 'cpu-voltage') {
                    document.getElementById('value-cpu-voltage').textContent = `${value.toFixed(2)}V`;
                    document.getElementById('status-cpu-voltage').textContent = 
                        value > 1.4 ? 'High' : value > 1.3 ? 'Moderate' : 'Optimal';
                } else if (gaugeId === 'fan-speed') {
                    document.getElementById('value-fan-speed').textContent = `${Math.round(value)} RPM`;
                    document.getElementById('status-fan-speed').textContent = 
                        value > 2000 ? 'High' : value > 1500 ? 'Medium' : 'Low';
                } else if (gaugeId === 'cpu-load') {
                    document.getElementById('value-cpu-load').textContent = `${Math.round(value)}%`;
                    document.getElementById('status-cpu-load').textContent = 
                        value > 80 ? 'High' : value > 50 ? 'Medium' : 'Idle';
                }
            },
            
            initLoadGraph: function() {
                const canvas = document.getElementById('load-graph');
                if (!canvas) return;
                
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'rgba(0, 20, 0, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Initialize load history
                for (let i = 0; i < 60; i++) {
                    this.loadHistory.push(15);
                }
            },
            
            drawLoadGraph: function() {
                const canvas = document.getElementById('load-graph');
                if (!canvas) return;
                
                const ctx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height;
                
                // Clear graph
                ctx.fillStyle = 'rgba(0, 20, 0, 0.3)';
                ctx.fillRect(0, 0, width, height);
                
                // Draw grid
                ctx.strokeStyle = 'rgba(0, 80, 0, 0.3)';
                ctx.lineWidth = 1;
                
                // Horizontal lines
                for (let i = 0; i <= 5; i++) {
                    const y = i * (height / 5);
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                    ctx.stroke();
                }
                
                // Draw load line
                ctx.beginPath();
                ctx.strokeStyle = '#90ee90';
                ctx.lineWidth = 2;
                
                const segmentWidth = width / (this.loadHistory.length - 1);
                
                this.loadHistory.forEach((load, index) => {
                    const x = index * segmentWidth;
                    const y = height - (load / 100) * height;
                    
                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                
                ctx.stroke();
                
                // Draw current load marker
                const currentLoad = this.loadHistory[this.loadHistory.length - 1];
                const lastX = width;
                const lastY = height - (currentLoad / 100) * height;
                
                ctx.beginPath();
                ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#90ee90';
                ctx.fill();
            },
            
            startSimulation: function() {
                this.animationId = requestAnimationFrame(() => this.updateSimulation());
            },
            
            updateSimulation: function() {
                // Simulate random fluctuations
                const time = Date.now() / 1000;
                this.state.cpuLoad = 15 + Math.sin(time * 0.5) * 10 + Math.sin(time * 2) * 5 + Math.random() * 3;
                this.state.cpuLoad = Math.max(0, Math.min(100, this.state.cpuLoad));
                
                this.state.cpuTemp = 45 + (this.state.cpuLoad - 15) * 0.3 + Math.sin(time * 0.3) * 2;
                this.state.cpuTemp = Math.max(30, Math.min(100, this.state.cpuTemp));
                
                this.state.fanSpeed = 1200 + (this.state.cpuTemp - 45) * 20 + Math.sin(time * 0.4) * 50;
                this.state.fanSpeed = Math.max(800, Math.min(3000, this.state.fanSpeed));
                
                this.state.cpuVoltage = 1.2 + Math.sin(time * 0.2) * 0.05 + (this.state.cpuLoad / 100) * 0.1;
                this.state.cpuVoltage = Math.max(1.1, Math.min(1.5, this.state.cpuVoltage));
                
                // Update load history
                this.loadHistory.push(this.state.cpuLoad);
                if (this.loadHistory.length > 60) {
                    this.loadHistory.shift();
                }
                
                // Update voltage displays
                document.getElementById('voltage-12v').textContent = '12.00V';
                document.getElementById('voltage-5v').textContent = '5.00V';
                document.getElementById('voltage-3v').textContent = '3.30V';
                
                // Update all gauges
                Object.keys(this.gauges).forEach(id => this.drawGauge(id));
                
                // Update load graph
                this.drawLoadGraph();
                
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
                
                this.loadHistory = [];
                for (let i = 0; i < 60; i++) {
                    this.loadHistory.push(15);
                }
                
                Object.keys(this.gauges).forEach(id => this.drawGauge(id));
                this.drawLoadGraph();
            },
            
            startStressTest: function() {
                // Create warning overlay
                const warning = document.createElement('div');
                warning.className = 'stress-warning';
                warning.innerHTML = `
                    <h3>STRESS TEST ACTIVE</h3>
                    <p>CPU under maximum load for 10 seconds</p>
                    <p style="font-size: 0.9em; color: #ffaa00;">Monitoring system temperatures...</p>
                `;
                document.getElementById('page-hardware-monitor').appendChild(warning);
                
                const originalLoad = this.state.cpuLoad;
                const interval = setInterval(() => {
                    this.state.cpuLoad = Math.min(100, this.state.cpuLoad + 8);
                    this.state.cpuTemp = Math.min(95, this.state.cpuTemp + 4);
                    this.state.fanSpeed = Math.min(3000, this.state.fanSpeed + 150);
                    
                    Object.keys(this.gauges).forEach(id => this.drawGauge(id));
                    
                    // Update load history
                    this.loadHistory.push(this.state.cpuLoad);
                    if (this.loadHistory.length > 60) {
                        this.loadHistory.shift();
                    }
                    this.drawLoadGraph();
                }, 200);
                
                setTimeout(() => {
                    clearInterval(interval);
                    if (warning.parentNode) {
                        warning.parentNode.removeChild(warning);
                    }
                }, 10000);
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