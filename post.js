// post.js - Power-On Self-Test Simulation

class POSTSequence {
    constructor() {
        this.messagesEl = document.getElementById('post-messages');
        this.memoryCounterEl = document.getElementById('memory-counter');
        this.currentLine = 0;
        this.memoryKB = 0;
        this.totalMemory = 32768; // 32MB for retro feel
        this.speed = 30; // ms between lines
        this.sequence = this.getPOSTSequence();
        this.beepSound = document.getElementById('post-beep');
    }

    getPOSTSequence() {
        return [
            { text: "PhoenixBIOS 4.0 Release 6.0", delay: 200 },
            { text: "Energy Star Ally", delay: 100 },
            { text: "Copyright 1985-2003 Phoenix Technologies Ltd.", delay: 150 },
            { text: "All Rights Reserved", delay: 100 },
            { text: "", delay: 200 }, // Empty line for spacing
            
            // CPU Detection
            { text: "Detecting Primary Master... ST310211A", delay: 120 },
            { text: "Detecting Primary Slave... None", delay: 80 },
            { text: "Detecting Secondary Master... CD-ROM DRIVE", delay: 100 },
            { text: "Detecting Secondary Slave... None", delay: 80 },
            
            // CPU Info
            { text: "Main Processor: Intel Pentium III 1000MHz", delay: 150 },
            { text: "CPU Clock: 1000MHz", delay: 80 },
            { text: "CPU ID: 0F24 Patch ID: 08", delay: 80 },
            
            // Memory Test Start
            { text: "Memory Test: ", delay: 200, special: "memory_test" },
            
            // Hardware
            { text: "Award Plug and Play BIOS Extension v1.0A", delay: 120 },
            { text: "Initialize Plug and Play Cards...", delay: 100 },
            { text: "PNP Init Completed", delay: 80, status: "ok" },
            
            // Final Checks
            { text: "Detecting Serial Ports...", delay: 100 },
            { text: "Serial Port 1: 3F8", delay: 60, status: "ok" },
            { text: "Serial Port 2: 2F8", delay: 60, status: "ok" },
            { text: "Detecting Parallel Ports...", delay: 100 },
            { text: "Parallel Port: 378", delay: 60, status: "ok" },
            
            // Boot Start
            { text: "Searching for Boot Record from IDE-0...", delay: 300 },
            { text: "Boot from CD-ROM:", delay: 200 },
            { text: "Press any key to boot from CD-ROM...", delay: 250, blink: true }
        ];
    }

    async playBeep(frequency = 800, duration = 100) {
        if (!this.beepSound || !this.beepSound.play) return;
        
        try {
            // Create Web Audio beep if MP3 not available
            if (this.beepSound.src === "") {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'square';
                
                gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration/1000);
                
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + duration/1000);
            } else {
                this.beepSound.currentTime = 0;
                await this.beepSound.play();
            }
        } catch (e) {
            console.log("Audio not supported:", e);
        }
    }

    addLine(text, status = null, blink = false) {
        const line = document.createElement('div');
        line.className = 'post-line';
        line.innerHTML = text;
        
        if (status === 'ok') {
            line.innerHTML += `<span class="status-ok"> [OK]</span>`;
        } else if (status === 'fail') {
            line.innerHTML += `<span class="status-fail"> [FAIL]</span>`;
        }
        
        if (blink) {
            line.style.animation = 'typeIn 0.3s forwards, blink 1s infinite';
        }
        
        this.messagesEl.appendChild(line);
        
        // Auto-scroll to bottom
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }

    updateMemoryCounter() {
        if (this.memoryKB < this.totalMemory) {
            this.memoryKB += 64; // Increment by 64KB each step
            if (this.memoryKB > this.totalMemory) {
                this.memoryKB = this.totalMemory;
            }
            this.memoryCounterEl.textContent = `Memory Test: ${this.memoryKB} KB OK`;
        }
    }

    async start() {
        // Initial beep
        await this.playBeep(1200, 100);
        
        for (const step of this.sequence) {
            await this.delay(step.delay || this.speed);
            
            if (step.special === 'memory_test') {
                // Start memory counter animation
                this.startMemoryCounter();
                this.addLine(step.text);
            } else {
                this.addLine(step.text, step.status, step.blink);
                
                // Play beep for certain events
                if (step.status === 'ok') {
                    this.playBeep(1000, 50);
                } else if (step.status === 'fail') {
                    this.playBeep(400, 200);
                }
            }
        }
        
        // POST Complete - Ready for BIOS menu
        await this.delay(1000);
        this.onPOSTComplete();
    }

    startMemoryCounter() {
        const interval = setInterval(() => {
            this.updateMemoryCounter();
            if (this.memoryKB >= this.totalMemory) {
                clearInterval(interval);
                this.addLine("Memory Test Completed", "ok");
                this.playBeep(1000, 50);
            }
        }, 30);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    onPOSTComplete() {
        // Trigger transition to BIOS menu
        document.getElementById('post-sequence').classList.add('hidden');
        document.getElementById('bios-menu').classList.remove('hidden');
        
        // Initialize BIOS menu system (Step 2)
        if (window.BIOSMenu) {
            window.BIOSMenu.init();
        }
        
        // Play completion beep
        this.playBeep(1200, 150);
    }
}

// Keyboard listener for BIOS entry
document.addEventListener('keydown', (e) => {
    // DEL key to enter setup
    if (e.key === 'Delete' || e.keyCode === 46) {
        e.preventDefault();
        const post = new POSTSequence();
        post.onPOSTComplete(); // Skip to BIOS directly for testing
    }
    
    // F12 for boot menu
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        alert('Boot Menu: Would show boot devices here');
    }
});

// Start POST sequence when page loads
window.addEventListener('load', () => {
    const post = new POSTSequence();
    post.start();
});