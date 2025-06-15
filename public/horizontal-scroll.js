document.addEventListener('DOMContentLoaded', () => {
    const timelineSection = document.getElementById('section3');
    const horizontalScroll = timelineSection.querySelector('.horizontal-scroll-inner');
    const progressBar = document.querySelector('.timeline-progress-bar');
    
    let currentTransform = 0;
    const SCROLL_STEP = 150;
    
    // Function to check if we're at horizontal bounds
    function isAtHorizontalBound(direction) {
        const maxScroll = horizontalScroll.scrollWidth - timelineSection.clientWidth;
        return (direction < 0 && currentTransform >= 0) || 
               (direction > 0 && -currentTransform >= maxScroll);
    }    // Function to check if timeline should be active
    function isTimelineActive() {
        const rect = timelineSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Timeline is active when it's at least 40% visible and roughly in view
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const isEnoughVisible = visibleHeight > rect.height * 0.4;
        const isInView = rect.top <= 0 && rect.bottom >= windowHeight * 0.7;

        return isEnoughVisible && isInView;
    }

    // Function to update horizontal scroll position
    function updateScrollPosition(delta) {
        const maxScroll = horizontalScroll.scrollWidth - timelineSection.clientWidth;
        const newTransform = Math.max(Math.min(currentTransform - delta, 0), -maxScroll);
        
        if (newTransform !== currentTransform) {
            currentTransform = newTransform;
            horizontalScroll.style.transform = `translateX(${currentTransform}px)`;
            
            if (progressBar) {
                const progress = (-currentTransform / maxScroll) * 100;
                progressBar.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
            }
            return true;
        }
        return false;
    }

    // Handle wheel events
    window.addEventListener('wheel', (e) => {
        if (isTimelineActive()) {
            const delta = e.deltaY;
            if (!isAtHorizontalBound(delta) && updateScrollPosition(delta)) {
                e.preventDefault();
            }
        }
    }, { passive: false });

    // Keyboard navigation with vertical scroll at bounds
    window.addEventListener('keydown', (e) => {
        const rect = timelineSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (!isVisible) return;        
        switch(e.key) {            
            case 'ArrowRight':
            case 'ArrowDown':
            case 'pageDown':
                if (isAtHorizontalBound(SCROLL_STEP)) {
                    // At right bound, allow scrolling down
                    if (e.key === 'ArrowDown' || e.key === 'pageDown') {
                        window.scrollBy({
                            top: window.innerHeight * 0.5,
                            behavior: 'smooth'
                        });
                    }
                } else {
                    e.preventDefault();
                    updateScrollPosition(SCROLL_STEP);
                }
                break;
                
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'pageUp':
                if (isAtHorizontalBound(-SCROLL_STEP)) {
                    // At left bound, allow scrolling up
                    if (e.key === 'ArrowUp' || e.key === 'pageUp') {
                        window.scrollBy({
                            top: -window.innerHeight * 0.5,
                            behavior: 'smooth'
                        });
                    }
                } else {
                    e.preventDefault();
                    updateScrollPosition(-SCROLL_STEP);
                }
                break;

            case 'Home':
                if (isTimelineActive()) {
                    e.preventDefault();
                    currentTransform = 0;
                    horizontalScroll.style.transform = `translateX(0)`;
                    if (progressBar) progressBar.style.width = '0%';
                }
                break;

            case 'End':
                if (isTimelineActive()) {
                    e.preventDefault();
                    const maxScroll = horizontalScroll.scrollWidth - timelineSection.clientWidth;
                    currentTransform = -maxScroll;
                    horizontalScroll.style.transform = `translateX(${-maxScroll}px)`;
                    if (progressBar) progressBar.style.width = '100%';
                }
                break;
        }
    });

    // Touch handling
    let touchStartX = 0;
    let lastTouchX = 0;
    let isSwiping = false;

    timelineSection.addEventListener('touchstart', (e) => {
        touchStartX = lastTouchX = e.touches[0].clientX;
        horizontalScroll.style.transition = 'none';
    }, { passive: true });

    timelineSection.addEventListener('touchmove', (e) => {
        if (!isTimelineActive()) return;

        const touchCurrentX = e.touches[0].clientX;
        const deltaX = lastTouchX - touchCurrentX;

        if (Math.abs(deltaX) > 5) {
            isSwiping = true;
        }

        if (isSwiping && !isAtHorizontalBound(-deltaX)) {
            updateScrollPosition(deltaX);
            lastTouchX = touchCurrentX;
            e.preventDefault();
        }
    }, { passive: false });

    timelineSection.addEventListener('touchend', () => {
        horizontalScroll.style.transition = 'transform 0.3s ease-out';
        isSwiping = false;
    }, { passive: true });

    // Initialize
    horizontalScroll.style.transition = 'transform 0.3s ease-out';
});
