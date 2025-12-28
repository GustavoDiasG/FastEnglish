import './firebase/init.js';
import { setupPersistence } from './firebase/persistence.js';
import { initExercises } from './firebase/exercises.js';
import { initTabs, loadTabsContent } from './ui/tabs.js';
import { initAccordion } from './ui/accordion.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 0. Load HTML Content
    await loadTabsContent();

    // 2. Initial Load & Persistence
    initExercises();

    // Setup Persistence for Notes and Links
    setupPersistence('notes', 'notes-textarea');
    setupPersistence('links', 'links-textarea');

    // 3. Tabs Logic
    initTabs();

    // 4. Accordion Logic
    initAccordion();
});
