const modalTrigger = document.querySelectorAll(`.modalTrigger`);

document.addEventListener(`DOMContentLoaded`, () => {
    modalTrigger.forEach(trigger => {
        trigger.addEventListener(`click`, () => toggle(trigger.getAttribute(`modalToggle`)));
    });
    
    document.querySelectorAll(`.modal`).forEach(modal => {
        modal.addEventListener(`click`, () => {modal.classList.remove(`.active`)});
    })
})

function toggle(trigger) {
    console.log(`triggered`);
    const modal = document.querySelector(trigger);
    if (modal) {
        modal.classList.add(`active`);
    } else {
        console.error(`Modal with selector "${trigger}" not found.`);
    }
}