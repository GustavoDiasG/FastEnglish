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

function loadCustomGlossary() {
    const tbody = document.getElementById('glossary-tbody');
    if (!tbody) return;

    // Remove todas as linhas adicionadas dinamicamente
    const dynamicRows = tbody.querySelectorAll('.custom-term-row');
    dynamicRows.forEach(row => row.remove());

    const customTermsJson = localStorage.getItem(CUSTOM_GLOSSARY_KEY);
    let customTerms = customTermsJson ? JSON.parse(customTerms) : [];

    // Adiciona as linhas customizadas no final da tabela
    customTerms.forEach(term => {
        const newRow = tbody.insertRow();
        newRow.classList.add('custom-term-row', 'bg-amber-50'); // Estilo levemente diferente para customizados
        newRow.innerHTML = `
                    <td class="py-4 px-4 font-medium">${term.en}</td>
                    <td class="py-4 px-4">${term.pt}</td>
                    <td class="py-4 px-4 text-sm">${term.def}</td>
                `;
    });
}

function addCustomTerm() {
    const en = document.getElementById('new-term-en').value.trim();
    const pt = document.getElementById('new-term-pt').value.trim();
    const def = document.getElementById('new-term-def').value.trim();

    if (!en || !pt || !def) {
        alert('Por favor, preencha todos os campos do novo termo.');
        return;
    }

    const newTerm = { en, pt, def };

    const customTermsJson = localStorage.getItem(CUSTOM_GLOSSARY_KEY);
    let customTerms = customTermsJson ? JSON.parse(customTerms) : [];

    customTerms.push(newTerm);

    localStorage.setItem(CUSTOM_GLOSSARY_KEY, JSON.stringify(customTerms));

    // Limpa inputs
    document.getElementById('new-term-en').value = '';
    document.getElementById('new-term-pt').value = '';
    document.getElementById('new-term-def').value = '';

    // Recarrega e re-renderiza o glossário, incluindo o novo termo
    loadCustomGlossary();

    // Dispara o evento de pesquisa para garantir que o filtro esteja ativo (se estiver digitado algo)
    const glossSearch = document.getElementById('glossary-search');
    if (glossSearch) glossSearch.dispatchEvent(new Event('keyup'));

    // Mensagem de sucesso (comportamento de "alert" simulado, mas aqui usando um alert padrão, pois é um ambiente sandboxed)
    console.log(`Termo '${en}' adicionado com sucesso!`);
    alert(`Termo '${en}' adicionado com sucesso!`);
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
    loadCustomGlossary(); // Carrega termos customizados ao iniciar
    loadExerciseAnswers(); // Carrega respostas dos exercícios ao iniciar

    const notesTextarea = document.getElementById('notes-textarea');
    if (notesTextarea) {
        // Salva automaticamente a cada alteração
        notesTextarea.addEventListener('input', saveNotes);
    }

    const addTermButton = document.getElementById('add-term-button');
    if (addTermButton) {
        addTermButton.addEventListener('click', addCustomTerm);
    }

    // Adiciona listener para salvar as respostas dos exercícios
    document.querySelectorAll('.exercise-input').forEach(input => {
        input.addEventListener('input', saveExerciseAnswers);
    });


    const tabsNav = document.getElementById('tabs-nav');
    const tabsContent = document.getElementById('tabs-content').children;
    const glossSearch = document.getElementById('glossary-search');
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

    // --- Lógica de Pesquisa do Glossário ---
    if (glossSearch) {
        glossSearch.addEventListener('keyup', () => {
            const filter = glossSearch.value.toLowerCase();

            // Re-obtem as linhas, incluindo as dinâmicas
            const allTableRows = document.getElementById('glossary-tbody').getElementsByTagName('tr');

            Array.from(allTableRows).forEach(row => {
                const rowText = row.textContent || row.innerText;
                if (rowText.toLowerCase().indexOf(filter) > -1) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            });
        });
    }

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