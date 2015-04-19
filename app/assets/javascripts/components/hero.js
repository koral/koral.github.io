// Animation for the landing page hero

var _ = require("lodash");

var fn = require("koral-util/fn");

var container = document.querySelector("#hero");
var canvas    = document.querySelector("#hero-canvas");
var ctx       = canvas.getContext("2d");

// Circle image
const CIRCLE_DIAMETER = 40;
const ANGULAR_VELOCITY = Math.PI / 25; // Radians/sec

var circle = document.createElement("img");
circle.src = "images/circle.svg";

// Circle rings (first one is just the circle)
var rings = [circle];
var angle = 0; // Current angle of the circles

var addRing = function () {
  var nextIndex = rings.length;
  var size      = CIRCLE_DIAMETER + CIRCLE_DIAMETER * nextIndex * 4;

  var ringCanvas = document.createElement("canvas");
  var ringCtx    = ringCanvas.getContext("2d");

  ringCanvas.width  = size;
  ringCanvas.height = size;

  ringCtx.fillStyle = "rgba(0,0,0,.1)";

  ringCtx.fillRect(0, 0, ringCanvas.width, ringCanvas.height);

  rings.push(ringCanvas);
};

var resize = _.throttle(function () {
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;

  ctx.restore();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.save();
}, 100);

var lastFrameTime = Date.now();

var draw = function () {
  var currentTime = Date.now();
  var delta       = currentTime - lastFrameTime;

  var angularDelta = ANGULAR_VELOCITY * (delta / 1000);

  angle += angularDelta;

  // Reset when overflowing
  if (angle > Math.PI * 2) angle -= Math.PI * 2;

  ctx.clearRect(
    -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height
  );

  _.each(rings, (ring, index) => {
    var direction = index % 2 === 0 ? 1 : -1;

    ctx.save();
    ctx.rotate(angle * direction);
    ctx.drawImage(ring, -ring.width / 2, -ring.height / 2);
    ctx.restore();
  });

  lastFrameTime = currentTime;
  requestAnimationFrame(draw);
};

var start = function () {
  // Bind to resize the window and perform it for the first time
  window.addEventListener("resize", fn.fire(resize));

  addRing();
  addRing();
  addRing();
  addRing();

  draw();
};

module.exports = { start };
