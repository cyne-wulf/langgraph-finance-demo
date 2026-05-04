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
document.querySelectorAll("[data-copy]").forEach((button) => {
  const originalLabel = button.textContent;
  button.addEventListener("click", async (event) => {
    event.stopPropagation();
    const copied = await copyText(button.dataset.copy);
    button.textContent = copied ? "Copied" : "Select";
    window.setTimeout(() => {
      button.textContent = originalLabel;
    }, 1500);
  });
});

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Local file presentations can block the async clipboard API.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

document.addEventListener("keydown", (event) => {
  if (event.target.closest("a, button, input, textarea, select")) return;
  if (["ArrowRight", "PageDown", " "].includes(event.key)) show(index + 1);
  if (["ArrowLeft", "PageUp"].includes(event.key)) show(index - 1);
});

show(0);
