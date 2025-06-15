let currentActiveIdx = -1;

// Arrange nav items in a circle and allow dial rotation
document.addEventListener('DOMContentLoaded', function () {
    const circle = document.querySelector('.circular-menu');
    const menu = document.querySelector('.circular-menu ul');
    const items = menu.querySelectorAll('li');
    const step = (2 * Math.PI) / items.length;

    function arrangeItems(rotation = 0) {
        // Fixed dimensions to ensure perfect circle
        const center = menu.offsetWidth / 2;
        const radius = menu.offsetWidth * 0.38; // Use 38% of width for radius
        var audio = new Audio('click.wav');
        audio.play();
        items.forEach((item, i) => {
            const angle = (i * step - Math.PI / 2) + (rotation * Math.PI / 180);
            // Calculate position on the circle
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            circle.style.setProperty('--rotation', `${rotation}deg`);
            
            // Position the item and rotate it to follow circle tangent
            item.style.left = `${x}px`;
            item.style.top = `${y}px`;
            item.style.transform = `translate(-50%, -50%) rotate(${angle * 180 / Math.PI}deg)`;
        });
        
        // Remove the menu rotation - items will move individually
        menu.style.transform = '';
    }
    arrangeItems();    // Scroll-spy
    const sections = document.querySelectorAll('section.section');
    const navLinks = document.querySelectorAll('.circular-menu a');
    const icons = document.querySelectorAll('.circular-menu span');
    
    // Debug helper
    console.log('Number of sections:', sections.length);
    console.log('Number of nav links:', navLinks.length);
    console.log('Number of icons:', icons.length);
    
    function onScroll() {
        // Find the section with the largest visible height in the viewport
        let maxVisible = 0;
        let activeIdx = -1;
        
        sections.forEach((section, idx) => {
            const rect = section.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const sectionTop = rect.top;
            const sectionBottom = rect.bottom;
            
            // Consider a section visible if it takes up at least 40% of the viewport
            const visibleTop = Math.max(sectionTop, 0);
            const visibleBottom = Math.min(sectionBottom, windowHeight);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            const visibleRatio = visibleHeight / windowHeight;
            
            if (visibleRatio > 0.2 && visibleHeight > maxVisible) {
                maxVisible = visibleHeight;
                activeIdx = idx;
            }
        });        if (activeIdx !== -1 && activeIdx !== currentActiveIdx) {
            
            // Remove active class from all links
            navLinks.forEach(link => link.classList.remove('active'));
            
            // Hide all icons
            icons.forEach(icon => icon.style.display = 'none');
            
            // Make sure we don't try to access non-existent elements
            if (activeIdx < navLinks.length && activeIdx < icons.length) {
                // Show active icon and add active class to link
                icons[activeIdx].style.display = 'block';
                navLinks[activeIdx].classList.add('active');
                
                // Rotate menu to align with active section
                const degStep = 360 / items.length;
                const rotation = 90 - activeIdx * degStep;
                arrangeItems(rotation);
                currentActiveIdx = activeIdx;
            }
        }
    }
    window.addEventListener('scroll', onScroll);
    onScroll();

    // Smooth scroll
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.getElementById(this.dataset.section);
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 40,
                    behavior: 'smooth'
                });
            }
        });
    });

    circle.addEventListener('scroll', function (e) {
        window.scrollTo({
            top: e.target.scrollTop,
            behavior: 'smooth'
        });
    });
});
