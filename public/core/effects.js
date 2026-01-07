function glowFrame(zone) {
  const frame = document.getElementById("frame");
  frame.className = "";

  const map = {
    buffet: "glow-green",
    gym: "glow-red",
    zoo: "glow-orange",
    spa: "glow-blue"
  };
  frame.classList.add(map[zone]);
}

function showFace(img) {
  document.getElementById("frame").innerHTML =
    `<img src="${img}" />`;
}

function showMessage(text) {
  document.getElementById("message").innerText = text;
}
