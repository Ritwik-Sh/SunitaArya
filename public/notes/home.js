notesList = [
    { title: "Skeletal System", path: "skeletalSystem.html", icon: "fa-solid fa-bone" },
    { title: "Muscles and Muscle Tissue", path: "load.html?doc=Muscles and Muscle Tissue.pdf", icon: "fa-solid fa-dumbbell" },,
    { title: "Transcription, Translation and Termination", path: "transcription-translation-termination.html", icon: "fa-solid fa-dna"}
]
const noteContainer = document.getElementById('noteContainer');
document.addEventListener('DOMContentLoaded', () => {
    notesList.forEach(note => {
        noteItem = document.createElement('a');
        noteItem.classList.add('noteItem', 'interactive3dtilt');
        noteItem.innerHTML = `<span class="${note.icon}"></span>` + note.title;
        noteItem.href = note.path;
        noteContainer.appendChild(noteItem);
        console.log('loaded ', note.title)
    })
});