const NOTES_STORAGE_KEY = 'appNotesContent';
const CUSTOM_GLOSSARY_KEY = 'customGlossary';
const EXERCISE_ANSWERS_KEY = 'exerciseAnswersState';

function loadNotes() {
    const notesTextarea = document.getElementById('notes-textarea');
    if (notesTextarea) {
        const savedContent = localStorage.getItem(NOTES_STORAGE_KEY);
        if (savedContent) {
            notesTextarea.value = savedContent;
        }
    }
}

function saveNotes() {
    const notesTextarea = document.getElementById('notes-textarea');
    if (notesTextarea) {
        localStorage.setItem(NOTES_STORAGE_KEY, notesTextarea.value);
    }
}



// --- Funções de Persistência dos Exercícios ---
function saveExerciseAnswers() {
    const answers = {};
    const exerciseSections = document.querySelectorAll('#exercicios-accordion > div');

    exerciseSections.forEach((section) => {
        const inputs = section.querySelectorAll('.accordion-content .exercise-input');
        inputs.forEach((input, inputIndex) => {
            const exerciseId = input.getAttribute('data-exercise-id');
            const inputIndexAttr = input.getAttribute('data-input-index');
            if (exerciseId && inputIndexAttr !== null) {
                if (!answers[exerciseId]) {
                    answers[exerciseId] = {};
                }
                answers[exerciseId][inputIndexAttr] = input.value;
            }
        });
    });

    localStorage.setItem(EXERCISE_ANSWERS_KEY, JSON.stringify(answers));
}

function loadExerciseAnswers() {
    const savedAnswersJson = localStorage.getItem(EXERCISE_ANSWERS_KEY);
    if (!savedAnswersJson) return;

    const savedAnswers = JSON.parse(savedAnswersJson);
    const exerciseSections = document.querySelectorAll('#exercicios-accordion > div');

    exerciseSections.forEach((section) => {
        const inputs = section.querySelectorAll('.accordion-content .exercise-input');
        inputs.forEach((input) => {
            const exerciseId = input.getAttribute('data-exercise-id');
            const inputIndexAttr = input.getAttribute('data-input-index');

            if (exerciseId && inputIndexAttr !== null && savedAnswers[exerciseId] && savedAnswers[exerciseId][inputIndexAttr] !== undefined) {
                input.value = savedAnswers[exerciseId][inputIndexAttr];
            }
        });
    });
}
// --- Fim das Funções de Persistência dos Exercícios ---


document.addEventListener('DOMContentLoaded', () => {
    loadNotes();

    loadExerciseAnswers(); // Carrega respostas dos exercícios ao iniciar

    const notesTextarea = document.getElementById('notes-textarea');
    if (notesTextarea) {
        // Salva automaticamente a cada alteração
        notesTextarea.addEventListener('input', saveNotes);
    }



    // Adiciona listener para salvar as respostas dos exercícios
    document.querySelectorAll('.exercise-input').forEach(input => {
        input.addEventListener('input', saveExerciseAnswers);
    });


    const tabsNav = document.getElementById('tabs-nav');
    const tabsContent = document.getElementById('tabs-content').children;

    const accordions = document.querySelectorAll('.accordion-header');

    // --- Lógica das Abas (Tabs) ---
    tabsNav.addEventListener('click', (e) => {
        const clickedButton = e.target.closest('button.tab-button');
        if (!clickedButton) return;

        const tabId = clickedButton.getAttribute('data-tab');

        // Desativa todas as abas
        Array.from(tabsNav.children).forEach(button => {
            button.classList.remove('active');
        });
        Array.from(tabsContent).forEach(content => {
            content.classList.add('hidden');
        });

        // Ativa a aba clicada
        clickedButton.classList.add('active');
        document.getElementById('tab-' + tabId).classList.remove('hidden');
    });



    // --- Lógica do Sanfona (Accordion) - AGORA PERMITE MÚLTIPLOS ABERTOS ---
    accordions.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.accordion-icon');

            // Apenas alterna o item clicado, sem fechar os outros
            content.classList.toggle('hidden');
            header.classList.toggle('open');

            if (header.classList.contains('open')) {
                icon.style.transform = 'rotate(180deg)';
            } else {
                icon.style.transform = 'rotate(0deg)';
            }
        });
    });

});
