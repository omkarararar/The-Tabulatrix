import { Storage } from '../storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Self-close if already onboarded
    const isComplete = await Storage.get('onboardingComplete', false);
    if (isComplete) {
        window.close();
        return;
    }

    let currentStep = 1;
    let selectedThresholdMs = 60 * 60 * 1000; // Default 1 hour

    const showStep = (step) => {
        document.querySelectorAll('.step').forEach(el => {
            el.classList.remove('active');
            setTimeout(() => el.style.display = 'none', 300);
        });
        
        document.querySelectorAll('.dot').forEach((el, idx) => {
            el.classList.toggle('active', idx < step);
        });

        const next = document.getElementById(`step${step}`);
        if (next) {
            setTimeout(() => {
                next.style.display = 'flex';
                // Trigger flow after display block
                setTimeout(() => next.classList.add('active'), 10);
            }, 300);
        }
        currentStep = step;
    };

    // Step 1 Events
    document.getElementById('btnNext1').addEventListener('click', () => showStep(2));

    // Step 2 Events
    const pills = document.querySelectorAll('.pill');
    const customInput = document.getElementById('customInputWrapper');
    const customHoursField = document.getElementById('customHours');
    const customMinsField = document.getElementById('customMinutes');

    const recalculateCustomThreshold = () => {
        const h = parseInt(customHoursField.value, 10) || 0;
        const m = parseInt(customMinsField.value, 10) || 0;
        selectedThresholdMs = ((h * 60) + m) * 60 * 1000;
    };

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            const val = pill.getAttribute('data-val');
            if (val === 'custom') {
                customInput.classList.remove('hidden');
                recalculateCustomThreshold();
            } else {
                customInput.classList.add('hidden');
                selectedThresholdMs = parseInt(val, 10) * 60 * 1000;
            }
        });
    });

    customHoursField.addEventListener('input', recalculateCustomThreshold);
    customMinsField.addEventListener('input', recalculateCustomThreshold);

    document.getElementById('btnBack2').addEventListener('click', () => showStep(1));
    document.getElementById('btnNext2').addEventListener('click', () => showStep(3));

    // Step 3 Events (Completion)
    const toggleBtn = document.getElementById('btnToggleVisibility');
    const keyInput = document.getElementById('wizardApiKey');

    toggleBtn.addEventListener('click', () => {
        if (keyInput.type === 'password') {
            keyInput.type = 'text';
            toggleBtn.textContent = 'Hide Key';
        } else {
            keyInput.type = 'password';
            toggleBtn.textContent = 'Show Key';
        }
    });

    const finalizeSetup = async (saveKey = false) => {
        // As requested: { idleThreshold: milliseconds, geminiKey: string | null, onboardingComplete: true }
        await Storage.set('idleThreshold', selectedThresholdMs); 
        
        if (saveKey) {
            await Storage.set('geminiKey', keyInput.value.trim());
            if (keyInput.value.trim().length > 0) {
                await Storage.set('enableAi', true);
            }
        } else {
            await Storage.set('geminiKey', null);
        }
        
        await Storage.set('onboardingComplete', true);
        window.close();
    };

    document.getElementById('btnSkip3').addEventListener('click', () => finalizeSetup(false));
    document.getElementById('btnFinish').addEventListener('click', () => finalizeSetup(true));
});
