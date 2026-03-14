import { Storage } from '../storage.js';

document.addEventListener('DOMContentLoaded', () => {
    
    const showStep = (stepNum) => {
        document.querySelectorAll('.step').forEach(el => el.classList.add('hidden'));
        document.getElementById(`step${stepNum}`).classList.remove('hidden');
    };

    document.getElementById('btnNext1').addEventListener('click', () => showStep(2));
    
    document.getElementById('btnNext2').addEventListener('click', async () => {
        const key = document.getElementById('wizardGeminiKey').value;
        if (key) {
            await Storage.set('geminiKey', key);
            await Storage.set('enableAi', true);
        }
        showStep(3);
    });
    
    document.getElementById('btnSkip2').addEventListener('click', () => showStep(3));

    document.getElementById('btnNext3').addEventListener('click', async () => {
        const hrs = parseInt(document.getElementById('wizardHours').value, 10) || 0;
        const mins = parseInt(document.getElementById('wizardMinutes').value, 10) || 0;
        const threshold = (hrs * 60) + mins;
        
        await Storage.set('idleThreshold', threshold);
        showStep(4);
    });

    document.getElementById('btnFinish').addEventListener('click', () => {
        window.close();
    });
});
