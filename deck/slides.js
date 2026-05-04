const slides = [...document.querySelectorAll(".slide")];
const counter = document.querySelector("#counter");
let index = 0;

function show(nextIndex) {
  index = Math.max(0, Math.min(slides.length - 1, nextIndex));
  slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === index));
  counter.textContent = `${index + 1} / ${slides.length}`;
}

document.querySelector("#prev").addEventListener("click", () => show(index - 1));
document.querySelector("#next").addEventListener("click", () => show(index + 1));
document.addEventListener("keydown", (event) => {
  if (["ArrowRight", "PageDown", " "].includes(event.key)) show(index + 1);
  if (["ArrowLeft", "PageUp"].includes(event.key)) show(index - 1);
});

show(0);
