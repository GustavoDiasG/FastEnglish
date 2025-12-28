export async function loadTabsContent() {
    const tabs = ['plano', 'gramatica', 'glossario', 'exercicios', 'anotacoes', 'links', 'metodologia'];
    const saves = tabs.map(async (tab) => {
        try {
            const response = await fetch(`sections/${tab}.html`);
            if (!response.ok) throw new Error(`Status ${response.status}`);
            const html = await response.text();
            const container = document.getElementById(`tab-${tab}`);
            if (container) {
                container.innerHTML = html;
            }
        } catch (e) {
            console.error(`Error loading tab ${tab}:`, e);
            const container = document.getElementById(`tab-${tab}`);
            if (container) {
                container.innerHTML = `<div class="p-4 text-red-600 bg-red-50 border border-red-200 rounded">
                    Erro ao carregar conteúdo da aba <b>${tab}</b>.<br>
                    Verifique se você está rodando um servidor local (http://localhost) e não abrindo o arquivo diretamente (file://).<br>
                    Erro técnico: ${e.message}
                 </div>`;
            }
        }
    });
    await Promise.all(saves);
}

export function initTabs() {
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
}
