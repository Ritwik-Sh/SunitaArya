// Function to add tilt effect to an element
function addTiltEffect(element) {
  if (!element) return;
  if (navigator.hardwareConcurrency <= 4 || screen.width < 720) {
    element.style.MutationObserver = 'none'; // Disable effect on low-end devices
    element.classList.add('zoom');
    return;
  }
  const handleMove = (e) => {
    const { width, height, left, top } = element.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const rotateX = ((y / height) - 0.5) * 10;
    const rotateY = ((x / width) - 0.5) * 10;
    
    element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };
  
  const handleLeave = () => {
    element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };
  
  element.addEventListener('mousemove', handleMove);
  element.addEventListener('mouseleave', handleLeave);
}

// Initialize tilt effect for existing elements
document.querySelectorAll('.interactive3dtilt').forEach(addTiltEffect);

// Create a MutationObserver to watch for new elements
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Check if it's an element node
        if (node.classList?.contains('interactive3dtilt')) {
          addTiltEffect(node);
        }
        // Check children of added node
        node.querySelectorAll?.('.interactive3dtilt')?.forEach(addTiltEffect);
      }
    });
  });
});

// Start observing the document with the configured parameters
observer.observe(document.body, { childList: true, subtree: true });