import { db, USER_ID } from './init.js';
import { debounce } from '../utils/debounce.js';

export function updateSaveStatus(status) {
    const saveStatusEl = document.getElementById('save-status');
    const saveStatusText = document.getElementById('save-status-text');

    if (!saveStatusEl || !saveStatusText) return;

    saveStatusEl.className = 'visible'; // Always visible when interacting

    if (status === 'saving') {
        saveStatusEl.classList.add('saving');
        saveStatusEl.classList.remove('saved');
        saveStatusText.textContent = 'Saving...';
    } else if (status === 'saved') {
        saveStatusEl.classList.remove('saving');
        saveStatusEl.classList.add('saved');
        saveStatusText.textContent = 'Saved';

        // Hide after 10 seconds
        setTimeout(() => {
            if (saveStatusText.textContent === 'Saved') {
                saveStatusEl.classList.remove('visible');
            }
        }, 10000);
    } else if (status === 'error') {
        saveStatusEl.classList.remove('saving', 'saved');
        saveStatusText.textContent = 'Error saving';
    }
}

function getDataDocRef(docKey) {
    return db.collection('users').doc(USER_ID).collection('data').doc(docKey);
}

export async function setupPersistence(docKey, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const docRef = getDataDocRef(docKey);

    // 1. Load initial data
    try {
        const doc = await docRef.get();
        if (doc.exists) {
            element.value = doc.data().content || '';
        }
    } catch (e) {
        console.error(`Error loading ${docKey}:`, e);
    }

    // 2. Setup generic save with debounce
    const debouncedSave = debounce(async (content) => {
        try {
            await docRef.set({ content }, { merge: true });
            updateSaveStatus('saved');
        } catch (e) {
            console.error(`Error saving ${docKey}:`, e);
            updateSaveStatus('error');
        }
    }, 1000);

    // 3. Add listener
    element.addEventListener('input', (e) => {
        updateSaveStatus('saving'); // Trigger saving status immediately
        debouncedSave(e.target.value);
    });
}
