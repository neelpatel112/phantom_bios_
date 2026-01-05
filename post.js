// post.js - Enhanced POST Sequence

class POSTSequence {
    constructor() {
        this.messagesEl = document.getElementById('post-messages');
        this.memoryCounterEl = document.getElementById('memory-counter');
        this.currentLine = 0;
        this.memoryKB = 0;
        this.totalMemory = 65536; // 64MB
        this.speed = 25;
        this.sequence = this.getPOSTSequence();
        this.beepSound = document.getElementById('post-beep');
    }

    getPOSTSequence() {
        return [
            { text: "PHANTOM BIOS v2.0", delay: 250 },
            { text: "Copyright (C) 2026 Phantom Systems", delay: 180 },
            { text: "All Rights Reserved", delay: 120 },
            { text: "", delay: 200 },
            
            { text: "System Initialization...", delay: 150 },
            { text: "Testing RAM: ", delay: 200, special: "memory_test" },
            
            { text: "CPU: Intel Pentium III 1000MHz (100.0x10.0)", delay: 120 },
            { text: "CPU ID: 0F24  Stepping: 08", delay: 100 },
            { text: "L1 Cache: 32KB, L2 Cache: 256KB", delay: 100 },
            
            { text: "Detecting IDE Drives...", delay: 150 },
            { text: "Primary Master: ST310211A (10GB)", delay: 80, status: "ok" },
            { text: "Primary Slave: None", delay: 60, status: "ok" },
            { text: "Secondary Master: CD-ROM Drive", delay: 80, status: "ok" },
            { text: "Secondary Slave: None", delay: 60, status: "ok" },
            
            { text: "Initializing USB Controllers...", delay: 150 },
            { text: "USB Controller: OHCI", delay: 80, status: "ok" },
            { text: "4 USB Ports Available", delay: 60, status: "ok" },
            
            { text: "Detecting Serial Ports...", delay: 120 },
            { text: "COM1: 3F8 IRQ4", delay: 60, status: "ok" },
            { text: "COM2: 2F8 IRQ3", delay: 60, status: "ok" },
            
            { text: "Detecting Parallel Port...", delay: 120 },
            { text: "LPT1: 378 IRQ7", delay: 60, status: "ok" },
            
            { text: "Plug and Play BIOS Extension v1.0A", delay: 100 },
            { text: "PNP Init Completed", delay: 80, status: "ok" },
            
            { text: "Checking NVRAM...", delay: 150 },
            { text: "CMOS Battery: Good", delay: 80, status: "ok" },
            { text: "NVRAM Checksum: Verified", delay: 80, status: "ok" },
            
            { text: "Building DMI Pool...", delay: 200 },
            { text: "DMI Pool: 256KB", delay: 80, status: "ok" },
            
            { text: "ACPI Enabled", delay: 100 },
            { text: "Enabling ACPI Mode...", delay: 150 },
            { text: "ACPI Tables Installed", delay: 80, status: "ok" },
            
            { text: "Initializing Video...", delay: 200 },
            { text: "VGA BIOS Detected", delay: 100, status: "ok" },
            { text: "Video Memory: 8MB", delay: 80, status: "ok" },
            
            { text: "System Configuration Valid", delay: 150, status: "ok" },
            { text: "", delay: 200 },
            
            { text: "Boot Device Priority:", delay: 150 },
            { text: "1. Hard Disk", delay: 100 },
            { text: "2. CD-ROM Drive", delay: 100 },
            { text: "3. Network", delay: 100 },
            { text: "4. USB Device", delay: 100 },
            
            { text: "", delay: 300 },
            { text: "Press DEL to enter SETUP, F12 for Boot Menu", delay: 250, blink: true }
        ];
    }

    async playBeep(frequency = 800, duration = 100) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration/1000);
        } catch (e) {
            console.log("Audio context not available");
        }
    }

    addLine(text, status = null, blink = false) {
        const line = document.createElement('div');
        line.className = 'post-line';
        
        let html = text;
        if (status === 'ok') {
            html += `<span class="status-ok"> [OK]</span>`;
        } else if (status === 'fail') {
            html += `<span class="status-fail"> [FAIL]</span>`;
        }
        
        line.innerHTML = html;
        
        if (blink) {
            line.style.animation = 'typeIn 0.3s forwards, blink 1s infinite';
        }
        
        this.messagesEl.appendChild(line);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }

    updateMemoryCounter() {
        if (this.memoryKB < this.totalMemory) {
            this.memoryKB += 128;
            if (this.memoryKB > this.totalMemory) {
                this.memoryKB = this.totalMemory;
            }
            this.memoryCounterEl.textContent = `Memory Test: ${this.memoryKB} KB OK`;
        }
    }

    async start() {
        await this.playBeep(1200, 120);
        
        for (const step of this.sequence) {
            await this.delay(step.delay || this.speed);
            
            if (step.special === 'memory_test') {
                this.startMemoryCounter();
                this.addLine(step.text);
            } else {
                this.addLine(step.text, step.status, step.blink);
                
                if (step.status === 'ok') {
                    await this.playBeep(1000, 50);
                }
            }
        }
        
        await this.delay(800);
        this.onPOSTComplete();
    }

    startMemoryCounter() {
        const interval = setInterval(() => {
            this.updateMemoryCounter();
            if (this.memoryKB >= this.totalMemory) {
                clearInterval(interval);
                this.addLine("RAM Test: 65536K OK", "ok");
                this.playBeep(1200, 80);
            }
        }, 20);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    onPOSTComplete() {
        document.getElementById('post-sequence').classList.add('hidden');
        document.getElementById('bios-menu').classList.remove('hidden');
        
        if (window.BIOSMenu) {
            window.BIOSMenu.init();
        }
        
        this.playBeep(1200, 150);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.keyCode === 46) {
        e.preventDefault();
        const post = new POSTSequence();
        post.onPOSTComplete();
    }
    
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        // Simulate boot menu
        const modal = document.createElement('div');
        modal.className = 'exit-modal';
        modal.innerHTML = `
            <div style="text-align: center; color: #90ee90; padding: 30px;">
                <h3>BOOT MENU</h3>
                <p style="color: #aaa; margin: 20px 0;">Select boot device:</p>
                <div style="margin: 20px;">
                    <div class="boot-device-item" style="cursor: pointer; margin: 10px 0;" onclick="window.open('https://macoswebemulator.vercel.app','_blank')">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="font-size: 1.5em;">💾</div>
                            <div>
                                <div style="color: #fff; font-weight: bold;">Hard Disk (macOS)</div>
                                <div style="color: #aaa; font-size: 0.9em;">ST310211A</div>
                            </div>
                        </div>
                    </div>
                    <div class="boot-device-item" style="cursor: pointer; margin: 10px 0;" onclick="window.open('https://windows-8-web-os.vercel.app','_blank')">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="font-size: 1.5em;">💿</div>
                            <div>
                                <div style="color: #fff; font-weight: bold;">CD-ROM (Windows 8)</div>
                                <div style="color: #aaa; font-size: 0.9em;">ATAPI CD-ROM</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="margin-top: 30px; color: #666; font-size: 0.9em;">
                    Press ESC to cancel
                </div>
            </div>
        `;
        document.getElementById('bios-screen').appendChild(modal);
        
        const removeModal = () => {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
            document.removeEventListener('keydown', escHandler);
        };
        
        const escHandler = (e) => {
            if (e.key === 'Escape') removeModal();
        };
        
        document.addEventListener('keydown', escHandler);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) removeModal();
        });
    }
});

// Start POST on load
window.addEventListener('load', () => {
    const post = new POSTSequence();
    post.start();
});