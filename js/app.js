const firebaseConfig = {
    apiKey: "AIzaSyAEab4hyNrsX-VOvl9M_egOpBe7C5l19tI",
    authDomain: "fe-classes.firebaseapp.com",
    projectId: "fe-classes",
    storageBucket: "fe-classes.firebasestorage.app",
    messagingSenderId: "935342192138",
    appId: "1:935342192138:web:fd01edfb42cb812ff091f3",
    measurementId: "G-7C3LWVYKL2"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (e) {
    console.error("Firebase initialization failed:", e);
    alert("Erro ao conectar com o banco de dados. Verifique o console.");
}

const db = firebase.firestore();

// --- User Identity (Mock Auth) ---
function getUserId() {
    let userId = localStorage.getItem('app_user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('app_user_id', userId);
    }
    console.log("Current User ID:", userId);
    return userId;
}

const USER_ID = getUserId();
const NOTES_DOC_REF = db.collection('users').doc(USER_ID).collection('data').doc('notes');
const EXERCISES_COL_REF = db.collection('users').doc(USER_ID).collection('exercises');


// --- UI Helpers ---
// Note: Elements might not be available immediately if script runs in head, but defer is used.

function updateSaveStatus(status) {
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

        // Hide after 2 seconds
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

// --- Utils ---
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        updateSaveStatus('saving');
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// --- Migration ---
// --- Migration ---
async function migrateDataIfNeeded() {
    const NOTES_STORAGE_KEY = 'appNotesContent';
    const EXERCISE_ANSWERS_KEY = 'exerciseAnswersState';
    const MIGRATED_KEY = 'firebase_migrated_v2'; // Changed to v2 to force retry

    if (localStorage.getItem(MIGRATED_KEY)) {
        console.log("Migration (v2) already performed.");
        return;
    }

    console.log("Starting migration...");
    let migrationSuccess = true;

    // Migrate Notes
    const localNotes = localStorage.getItem(NOTES_STORAGE_KEY);
    if (localNotes) {
        try {
            await NOTES_DOC_REF.set({ content: localNotes }, { merge: true });
            console.log("Notes migrated.");
        } catch (e) {
            console.error("Migration: Failed to migrate notes", e);
            migrationSuccess = false;
        }
    }

    // Migrate Exercises
    const localExercises = JSON.parse(localStorage.getItem(EXERCISE_ANSWERS_KEY) || '{}');
    const batch = db.batch();
    let batchCount = 0;

    for (const [exerciseId, answers] of Object.entries(localExercises)) {
        const docRef = EXERCISES_COL_REF.doc(exerciseId);
        batch.set(docRef, { answers }, { merge: true });
        batchCount++;
    }

    if (batchCount > 0) {
        try {
            await batch.commit();
            console.log("Exercises migrated.");
        } catch (e) {
            console.error("Migration: Failed to migrate exercises", e);
            migrationSuccess = false;
        }
    } else {
        console.log("No exercises to migrate.");
    }

    if (migrationSuccess) {
        localStorage.setItem(MIGRATED_KEY, 'true');
        console.log('Migration completed successfully.');
        alert('Seus dados foram migrados com sucesso para o banco de dados!');
    } else {
        console.warn('Migration failed or partial. Will retry on next load.');
        alert('Erro na migração: Verifique se você liberou as Regras no Firebase Console.');
    }
}

// --- Notes Persistence ---
async function loadNotes() {
    try {
        const doc = await NOTES_DOC_REF.get();
        if (doc.exists) {
            const notesTextarea = document.getElementById('notes-textarea');
            if (notesTextarea) {
                notesTextarea.value = doc.data().content || '';
            }
        }
    } catch (e) {
        console.error("Error loading notes:", e);
    }
}

const saveNotesDebounced = debounce(async (content) => {
    try {
        await NOTES_DOC_REF.set({ content }, { merge: true });
        updateSaveStatus('saved');
    } catch (e) {
        console.error("Error saving notes:", e);
        updateSaveStatus('error');
    }
}, 1000);

// --- Exercises Persistence ---
async function loadExerciseAnswers() {
    try {
        const snapshot = await EXERCISES_COL_REF.get();
        const allAnswers = {};

        snapshot.forEach(doc => {
            allAnswers[doc.id] = doc.data().answers;
        });

        document.querySelectorAll('.exercise-input').forEach(input => {
            const { exerciseId, inputIndex } = input.dataset;
            const val = allAnswers[exerciseId]?.[inputIndex];
            if (val !== undefined) input.value = val;
        });
    } catch (e) {
        console.error("Error loading exercises:", e);
    }
}

// We need to bundle updates per exercise to avoid too many writes if possible, 
// but for simplicity with debounce, we can save the specific exercise doc.
// We'll organize saving by exerciseId.

const pendingExerciseUpdates = {}; // { exerciseId: { inputIndex: value, ... } }

const saveExercisesDebounced = debounce(async () => {
    const batch = db.batch();
    let hasUpdates = false;

    for (const [exerciseId, updates] of Object.entries(pendingExerciseUpdates)) {
        if (Object.keys(updates).length === 0) continue;

        const docRef = EXERCISES_COL_REF.doc(exerciseId);
        // We need to use dot notation for nested updates in Firestore or merge
        // But to just update specific fields inside 'answers' map without overwriting others:
        // Firestore update paths: "answers.0": "val"

        const updateData = {};
        for (const [idx, val] of Object.entries(updates)) {
            updateData[`answers.${idx}`] = val;
        }

        // Check if doc exists first? set with merge should handle creation.
        // However, for nested fields like "answers.0", the parent map "answers" must exist if we use update.
        // easier to use set with merge, but set({answers: {0: val}}, {merge: true}) will overwrite answers map?
        // No, set with merge merges top level fields. nested maps:
        // If we do set({ answers: { [idx]: val } }, { merge: true }), it might overwrite other keys in 'answers' if not careful? 
        // Firestore v9 set with merge behavior on maps: it deep merges. 
        // Let's verify: yes, set(..., {merge: true}) merges fields.

        // Actually, 'answers' is a map. If I do set({ answers: { 1: 'a'} }, { merge: true }), it technically merges 'answers' field.
        // But if 'answers' was { 0: 'b'}, does it become { 0: 'b', 1: 'a' }?
        // YES, Firestore set with merge performs a deep merge on Maps.

        // However, to be extra safe and correct with dot notation which guarantees partial update:
        batch.set(docRef, { answers: updates }, { merge: true });
        hasUpdates = true;
    }

    // Clear pending
    for (const key in pendingExerciseUpdates) delete pendingExerciseUpdates[key];

    if (hasUpdates) {
        try {
            await batch.commit();
            updateSaveStatus('saved');
        } catch (e) {
            console.error("Error saving exercises:", e);
            updateSaveStatus('error');
        }
    }
}, 1500);


document.addEventListener('DOMContentLoaded', async () => {
    // 0. UI Init
    const saveEl = document.getElementById('save-status'); // ensure we grab it if it wasn't caught early
    // 1. Migration
    await migrateDataIfNeeded();

    // 2. Initial Load
    await loadNotes();
    await loadExerciseAnswers();

    // 3. Event Delegation for auto-saving
    document.body.addEventListener('input', (e) => {
        if (e.target.matches('#notes-textarea')) {
            saveNotesDebounced(e.target.value);
        } else if (e.target.matches('.exercise-input')) {
            const { exerciseId, inputIndex } = e.target.dataset;
            if (exerciseId && inputIndex !== undefined) {
                // Queue update
                pendingExerciseUpdates[exerciseId] ??= {};
                pendingExerciseUpdates[exerciseId][inputIndex] = e.target.value;

                saveExercisesDebounced();
            }
        }
    });

    // 3. Tabs Logic
    const tabsNav = document.getElementById('tabs-nav');
    const tabsContent = document.getElementById('tabs-content');

    if (tabsNav && tabsContent) { // Guard in case elements don't exist
        tabsNav.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-button');
            if (!btn) return;

            // Toggle active class on buttons
            Array.from(tabsNav.children).forEach(b => b.classList.toggle('active', b === btn));

            // Toggle visibility of content
            const targetId = `tab-${btn.dataset.tab}`;
            Array.from(tabsContent.children).forEach(content => {
                content.classList.toggle('hidden', content.id !== targetId);
            });
        });
    }

    // 4. Accordion Logic (Allows multiple open)
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;

            // Toggle visibility and open state
            const isOpen = content.classList.toggle('hidden') === false; // toggle returns true if class added (hidden), so false means visible/open
            // Wait, toggle returns 'true' if token is now present. So if hidden is added, it's CLOSED.
            // If hidden is removed (returns false), it's OPEN.

            const isNowOpen = !content.classList.contains('hidden');
            header.classList.toggle('open', isNowOpen);

            const icon = header.querySelector('.accordion-icon');
            if (icon) {
                icon.style.transform = isNowOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
    });
});