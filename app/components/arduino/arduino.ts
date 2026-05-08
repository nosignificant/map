let socket;
let sensorVal = 0;
const imgs = {};
let currentImg = null;

function preload() {
  imgs.weak = loadImage("weak.png");
  imgs.medium = loadImage("medium.png");
  imgs.strong = loadImage("strong.png");
}

function setup() {
  createCanvas(400, 400);
  socket = new WebSocket("ws://localhost:8080");

  socket.onmessage = (event) => {
    sensorVal = int(event.data);

    if (sensorVal <= 200) {
      currentImg = imgs.weak;
    } else if (sensorVal <= 500) {
      currentImg = imgs.medium;
    } else {
      currentImg = imgs.strong;
    }
  };
}

function draw() {
  background(220);
  if (currentImg) {
    image(currentImg, 0, 0, width, height);
  }
  text("센서값: " + sensorVal, 20, 20);
}
