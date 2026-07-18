// Welcome view: markup is static in index.html; this module only wires it up.

export function initWelcome({ onStart }) {
  document.getElementById("start-button").addEventListener("click", onStart);
}
