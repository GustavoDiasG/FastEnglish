import { db, USER_ID } from './init.js';
import { debounce } from '../utils/debounce.js';
import { updateSaveStatus } from './persistence.js';

const EXERCISES_COL_REF = db.collection('users').doc(USER_ID).collection('exercises');

export async function loadExerciseAnswers() {
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

const pendingExerciseUpdates = {}; // { exerciseId: { inputIndex: value, ... } }

const saveExercisesDebounced = debounce(async () => {
    const batch = db.batch();
    let hasUpdates = false;

    for (const [exerciseId, updates] of Object.entries(pendingExerciseUpdates)) {
        if (Object.keys(updates).length === 0) continue;

        const docRef = EXERCISES_COL_REF.doc(exerciseId);

        // Firestore set with merge performs a deep merge on Maps.
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

export function initExercises() {
    // Event Delegation for auto-saving
    document.body.addEventListener('input', (e) => {
        if (e.target.matches('.exercise-input')) {
            const { exerciseId, inputIndex } = e.target.dataset;
            if (exerciseId && inputIndex !== undefined) {
                // Queue update
                pendingExerciseUpdates[exerciseId] ??= {};
                pendingExerciseUpdates[exerciseId][inputIndex] = e.target.value;

                updateSaveStatus('saving'); // Trigger saving status immediately
                saveExercisesDebounced();
            }
        }
    });

    loadExerciseAnswers();
}
