// Animation for the landing page hero

var _ = require("lodash");

var fn = require("koral-util/fn");

var container = document.querySelector("#hero");
var canvas    = document.querySelector("#hero-canvas");
var ctx       = canvas.getContext("2d");

// Circle image
const CIRCLE_DIAMETER = 40;
const ANGULAR_VELOCITY = Math.PI / 40; // Radians/sec

var circle = document.createElement("img");
circle.src = "images/circle.svg";

// Circle rings (first one is just the circle)
var rings  = [{ object: circle, angle: 0 }];

var ringRadius = (index) => CIRCLE_DIAMETER / 2 + CIRCLE_DIAMETER * index * 2;

// Generates suitable amounts of circles for each ring
var ringCount = function* () {
  var current = 9; // Minimum amount

  while (true) {
    yield current;

    // Find the closest number that divides 360 evenly
    current += 2;
    while ((360 * 10) % current !== 0) current += 1;
  }
};

var ringCountGenerator = ringCount();

var addRing = function () {
  var nextIndex = rings.length;
  var radius    = ringRadius(nextIndex);
  var offset    = radius - CIRCLE_DIAMETER / 2;
  var count     = ringCountGenerator.next().value;
  var step      = 2 * Math.PI / count;

  var ringCanvas = document.createElement("canvas");
  var ringCtx    = ringCanvas.getContext("2d");

  ringCanvas.width  = radius * 2;
  ringCanvas.height = radius * 2;

  // Move to the center
  ringCtx.translate(radius, radius);

  for (var i = 0; i < count; i += 1) {
    ringCtx.rotate(step);
    ringCtx.drawImage(
      circle, offset - CIRCLE_DIAMETER / 2, -CIRCLE_DIAMETER / 2
    );
  }

  rings.push({ object: ringCanvas, angle: 0 });
};

var resize = _.throttle(function () {
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;

  ctx.restore();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.save();

  // Ensure there are enough rings to fill the screen
  while (ringRadius(rings.length - 1) < (canvas.width / 2)) addRing();
}, 100);

var lastFrameTime = Date.now();

var draw = function () {
  var currentTime = Date.now();
  var delta       = currentTime - lastFrameTime;

  var angularDelta = ANGULAR_VELOCITY * (delta / 1000);

  ctx.clearRect(
    -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height
  );

  _.each(rings, (ring, index) => {
    var direction = 1;

    ring.angle += angularDelta / (index / 5);

    // Reset when overflowing
    if (ring.angle > Math.PI * 2) ring.angle -= Math.PI * 2;

    ctx.save();
    ctx.rotate(ring.angle * direction);
    ctx.drawImage(ring.object, -ring.object.width / 2, -ring.object.height / 2);
    ctx.restore();
  });

  lastFrameTime = currentTime;
  requestAnimationFrame(draw);
};

var start = function () {
  if (circle.complete) {
    next();
  } else {
    circle.onload = next;
  }

  function next() {
    // Resize the window and add rings as necessary
    window.addEventListener("resize", fn.fire(resize));

    canvas.classList.add("hero__canvas--running");

    // Begin rendering
    draw();
  }
};

module.exports = { start };
