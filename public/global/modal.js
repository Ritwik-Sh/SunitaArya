document.addEventListener('DOMContentLoaded', () => {
    // Handle dynamic modal triggers
    document.body.addEventListener('click', (e) => {
        const trigger = e.target.closest('.modalTrigger');
        if (trigger) {
            toggle(trigger.getAttribute('modalToggle'));
        }
    });

    // Handle modal dismissal
    document.body.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal && e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Handle close buttons
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-modal')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        }
    });
});

function toggle(trigger) {
    if (!trigger) return;
    
    const modal = document.querySelector(trigger);
    if (modal) {
        modal.classList.add('active');
        
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
        
        // Add one-time event listener to restore body scrolling when modal closes
        const handleModalClose = () => {
            document.body.style.overflow = '';
            modal.removeEventListener('transitionend', handleModalClose);
        };
        modal.addEventListener('transitionend', handleModalClose);
    } else {
        console.error(`Modal with selector "${trigger}" not found.`);
    }
}