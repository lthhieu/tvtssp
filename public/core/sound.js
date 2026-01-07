const sounds = {
  buffet: new Audio("/sound/ting.mp3"),
  gym: new Audio("/sound/boom.mp3"),
  zoo: new Audio("/sound/fun.mp3"),
  spa: new Audio("/sound/bell.mp3")
};

function playSound(zone) {
  if (sounds[zone]) sounds[zone].play();
}
