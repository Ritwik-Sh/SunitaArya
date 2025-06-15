const cards = document.querySelectorAll(".interactive3dtilt");
cards.forEach(card => {
  card.addEventListener("mousemove", (e) => {
    const { width, height, left, top } = card.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const rotateX = ((y / height) - 0.5) * 30;
    const rotateY = ((x / width) - 0.5) * -30;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = `rotateX(0deg) rotateY(0deg)`;
  });
});