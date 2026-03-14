import { Storage } from '../storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Load config
    const threshold = await Storage.get('idleThreshold', 30);
    const useAi = await Storage.get('enableAi', false);
    const geminiKey = await Storage.get('geminiKey', '');
    
    document.getElementById('idleThreshold').value = threshold;
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
        const newThreshold = parseInt(document.getElementById('idleThreshold').value, 10);
        const newUseAi = document.getElementById('enableAi').checked;
        const newKey = document.getElementById('geminiKey').value;
        
        await Storage.set('idleThreshold', newThreshold);
        await Storage.set('enableAi', newUseAi);
        await Storage.set('geminiKey', newKey);
        
        alert('Settings saved successfully!');
    });
});
