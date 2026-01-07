const socket = io();

function fakeDetectFace() {
  // 👉 TEST GIẢ: mỗi lần bấm là 1 HS
  const face_id = "HS_" + Math.floor(Math.random() * 100);
  const image = "https://via.placeholder.com/300x300.png?text=" + face_id;

  socket.emit("zone-face", {
    face_id,
    zone: ZONE,
    image
  });
}

socket.on("zone-ok", data => {
  showFace(data.image);
  showMessage(`✅ Mời vào khu ${data.zone.toUpperCase()}`);
  glowFrame(data.zone);
  playSound(data.zone);
});

socket.on("zone-denied", data => {
  showMessage(data.message);
});
