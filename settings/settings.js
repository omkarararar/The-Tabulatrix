import { Storage } from '../storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Load config
    const thresholdMs = await Storage.get('idleThreshold', 60 * 60 * 1000);
    const thresholdMins = Math.floor(thresholdMs / 60000);
    const useAi = await Storage.get('enableAi', false);
    const geminiKey = await Storage.get('geminiKey', '');
    
    document.getElementById('idleHours').value = Math.floor(thresholdMins / 60);
    document.getElementById('idleMinutes').value = thresholdMins % 60;
    
    document.getElementById('enableAi').checked = useAi;
    document.getElementById('geminiKey').value = geminiKey;
    
    const uiUpdate = () => {
        const aiEnabled = document.getElementById('enableAi').checked;
        const keyField = document.getElementById('aiKeyField');
        if (aiEnabled) keyField.classList.remove('hidden');
        else keyField.classList.add('hidden');
    };
    
    document.getElementById('enableAi').addEventListener('change', uiUpdate);
    uiUpdate();

    // Save Settings
    document.getElementById('btnSave').addEventListener('click', async () => {
        const hrs = parseInt(document.getElementById('idleHours').value, 10) || 0;
        const mins = parseInt(document.getElementById('idleMinutes').value, 10) || 0;
        const newThresholdMs = ((hrs * 60) + mins) * 60 * 1000;
        
        const newUseAi = document.getElementById('enableAi').checked;
        const newKey = document.getElementById('geminiKey').value;
        
        await Storage.set('idleThreshold', newThresholdMs);
        await Storage.set('enableAi', newUseAi);
        await Storage.set('geminiKey', newKey);
        
        alert('Settings saved successfully!');
    });
});
