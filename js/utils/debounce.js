export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        // Removed updateSaveStatus('saving') from here to keep it pure
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}
