// The tiny mono labels in cell corners. Each prints a live value the page really has —
// the sphere's state, scroll progress, a hovered cell's clip-path — never decoration.
export function readout(name, text) {
  document.querySelectorAll(`[data-readout="${name}"]`).forEach(el => { el.textContent = text; });
}
