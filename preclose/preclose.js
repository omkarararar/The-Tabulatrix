import { animate } from '../assets/lib/motion.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initial entrance animation
    animate('#precloseDialog', 
        { opacity: [0, 1], y: [20, 0] },
        { duration: 0.3, easing: "ease-out" }
    );

    let countdown = 60;
    const countdownEl = document.getElementById('countdown');
    
    // Setup countdown timer
    const interval = setInterval(() => {
        countdown--;
        countdownEl.textContent = `${countdown}s`;
        if (countdown <= 0) {
            clearInterval(interval);
            // TODO: Execute close action via message to background script
            window.close(); // Close the popup for MVP
        }
    }, 1000);

    // Button event listeners
    document.getElementById('btnClose').addEventListener('click', () => {
        // Trigger close tab logic
        window.close();
    });

    document.getElementById('btnSnooze').addEventListener('click', () => {
        // Trigger snooze logic (2 hours)
        window.close();
    });

    document.getElementById('btnSchedule').addEventListener('click', () => {
        // Show inline date picker, hide other buttons
        document.getElementById('datePicker').classList.remove('hidden');
        
        animate('#datePicker', 
            { opacity: [0, 1], height: [0, 'auto'] },
            { duration: 0.2 }
        );
    });
});
