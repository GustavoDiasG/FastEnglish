export function initAccordion() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;

            // Toggle visibility and open state
            const isOpen = content.classList.toggle('hidden') === false;

            const isNowOpen = !content.classList.contains('hidden');
            header.classList.toggle('open', isNowOpen);

            const icon = header.querySelector('.accordion-icon');
            if (icon) {
                icon.style.transform = isNowOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
    });
}
