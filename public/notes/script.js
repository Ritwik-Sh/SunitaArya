let currentSlideIndex = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

document.getElementById('totalSlides').textContent = totalSlides;

function showSlide(index) {
    // Remove all position classes
    slides.forEach(slide => {
        slide.classList.remove('active', 'prev');
        // Reset transform for slides after the target
        slide.style.transform = 'translateX(110%)';
    });

    // Set previous slides
    for (let i = 0; i < index; i++) {
        slides[i].classList.add('prev');
    }

    // Set active slide
    slides[index].classList.add('active');
    slides[index].style.transform = 'translateX(0)';

    document.getElementById('currentSlide').textContent = index + 1;
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').disabled = index === totalSlides - 1;
}

function changeSlide(direction) {
    const newIndex = currentSlideIndex + direction;
    if (newIndex >= 0 && newIndex < totalSlides) {
        currentSlideIndex = newIndex;
        showSlide(currentSlideIndex);
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') changeSlide(-1);
    if (e.key === 'ArrowRight') changeSlide(1);
});

// Initialize
showSlide(0);

// Fullscreen toggle
const fsBtn = document.getElementById('fullscreenBtn');
const presentationContainer = document.querySelector('.presentation-container');

function isFullscreen() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || document.mozFullScreenElement;
}

function updateFsButton() {
    if (isFullscreen()) {
        fsBtn.classList.add('fa-compress');
        fsBtn.classList.remove('fa-expand');
    } else {
        fsBtn.classList.add('fa-expand');
        fsBtn.classList.remove('fa-compress');
    }
}

fsBtn.addEventListener('click', () => {
    if (!isFullscreen()) {
        if (presentationContainer.requestFullscreen) {
            presentationContainer.requestFullscreen();
        } else if (presentationContainer.webkitRequestFullscreen) { /* Safari */
            presentationContainer.webkitRequestFullscreen();
        } else if (presentationContainer.msRequestFullscreen) { /* IE11 */
            presentationContainer.msRequestFullscreen();
        }
        slides.forEach(slide => slide.style.margin = '0');
        document.querySelector('.controls').style.height = '8vh'
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        slides.forEach(slide => slide.style.margin = '20px');
        document.querySelector('.controls').style.height = '';
    }
});

// Update button on change (cross-browser)
['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
    document.addEventListener(evt, updateFsButton);
});

// ensure correct initial state
updateFsButton();

// Print whole presentation function
function printPresentation() {
    try {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            // Popup blocked - fallback to printing current slide
            console.warn('Popup blocked. Falling back to window.print() for current view.');
            window.print();
            return;
        }

        // Build printable HTML: include minimal styles for readability
        const doc = printWindow.document;
        doc.open();
        doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Print Presentation</title>`);
        // Inline minimal styles (keeps look similar to screen)
        doc.write(`<style>
                    body{font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin:0; padding:20px; background:#fff; color:#111}
                    .print-slide{page-break-after:always; padding:20px; border-bottom:1px solid #ddd}
                    h1,h2,h3{color:#111}
                </style>`);
        doc.write(`</head><body>`);

        // Clone each slide's inner content into the print window
        slides.forEach((slide, i) => {
            const cloned = slide.cloneNode(true);
            // Remove interactive elements and classes not needed for print
            cloned.classList.remove('active');
            cloned.style.display = 'block';
            cloned.style.margin = '0 0 30px 0';
            cloned.querySelectorAll('.control-btn, #prevBtn, #nextBtn, #fullscreenBtn, #printBtn').forEach(n => n && n.remove());
            doc.write(`<div class="print-slide">${cloned.innerHTML}</div>`);
        });

        doc.write(`</body></html>`);
        doc.close();

        // Wait a tick for content to render then print
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            // close after printing
            printWindow.close();
        }, 300);
    } catch (err) {
        console.error('Print failed, falling back to window.print()', err);
        window.print();
    }
}

// Attach to the print button
const printBtn = document.getElementById('printBtn');
if (printBtn) printBtn.addEventListener('click', printPresentation);

// // --- Wheel (horizontal) and touch swipe navigation ---
// // We add a small cooldown to avoid multiple rapid triggers from sensitive devices.
// (function () {
//     let wheelCooldown = false;
//     const WHEEL_COOLDOWN_MS = 200; // ms

//     function onWheel(e) {
//         // If vertical scrolling with shiftKey (or trackpad horizontal), prefer horizontal delta
//         const deltaX = e.deltaX;
//         const deltaY = e.deltaY;

//         // If both are small, ignore
//         if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return;

//         // Determine primary direction: horizontal delta if present, otherwise use vertical as fallback
//         // const primary = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
//         const primary = deltaX;

//         if (wheelCooldown) return;
//         wheelCooldown = true;
//         setTimeout(() => wheelCooldown = false, WHEEL_COOLDOWN_MS);

//         if (primary > 0) {
//             // positive delta -> scroll rightwards on most devices -> next
//             changeSlide(1);
//         } else if (primary < 0) {
//             changeSlide(-1);
//         }
//     }

//     // Touch swipe support
//     let touchStartX = null;
//     let touchStartY = null;
//     let touchLocked = false;
//     const TOUCH_THRESHOLD = 40; // px
//     const TOUCH_LOCK_MS = 250;

//     function onTouchStart(e) {
//         if (!e.touches || e.touches.length === 0) return;
//         touchStartX = e.touches[0].clientX;
//         touchStartY = e.touches[0].clientY;
//         touchLocked = false;
//     }

//     function onTouchMove(e) {
//         // prevent vertical page scroll from interfering when swiping horizontally
//         // but only when the horizontal movement is significant
//         if (!touchStartX || !e.touches || e.touches.length === 0) return;
//         const dx = e.touches[0].clientX - touchStartX;
//         const dy = e.touches[0].clientY - touchStartY;

//         if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
//             // indicate we want horizontal swipe behavior
//             e.preventDefault();
//         }
//     }

//     function onTouchEnd(e) {
//         if (touchLocked) return;
//         if (touchStartX === null) return;

//         // Try to get the changedTouches or fallback to last known touch
//         const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
//         if (!touch) {
//             touchStartX = null;
//             touchStartY = null;
//             return;
//         }

//         const dx = touch.clientX - touchStartX;
//         const dy = touch.clientY - touchStartY;

//         if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > TOUCH_THRESHOLD) {
//             touchLocked = true;
//             setTimeout(() => touchLocked = false, TOUCH_LOCK_MS);
//             if (dx < 0) {
//                 changeSlide(1); // swipe left -> next
//             } else {
//                 changeSlide(-1); // swipe right -> previous
//             }
//         }

//         touchStartX = null;
//         touchStartY = null;
//     }

//     // Use passive: false for touchmove so we can call preventDefault when needed
//     window.addEventListener('wheel', onWheel, { passive: true });
//     window.addEventListener('touchstart', onTouchStart, { passive: true });
//     window.addEventListener('touchmove', onTouchMove, { passive: false });
//     window.addEventListener('touchend', onTouchEnd, { passive: true });
// })();