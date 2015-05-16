// Animation for the landing page hero

var _     = require("lodash");
var paper = require("paper");

var fn = require("koral-util/fn");

var container = document.querySelector("#hero");
var canvas    = document.querySelector("#hero-canvas");

// Circle parameters
const ANGULAR_VELOCITY = Math.PI / 40; // Radians/sec
const CIRCLE_RADIUS    = 20;
const CIRCLE_COLOR     = "rgba(0,0,0,.1)";

// Circle rings
var rings  = [];
var circle = null;

var ringRadius = (index) => CIRCLE_RADIUS + CIRCLE_RADIUS * index * 4;
var ringOffset = (index) => ringRadius(index) - CIRCLE_RADIUS;

// Generates suitable amounts of circles for each ring
var ringCountGenerator = function* () {
  var current = 9; // Minimum amount

  while (true) {
    yield current;

    // Find the closest number that divides 360 evenly
    current += 2;
    while ((360 * 10) % current !== 0) current += 1;
  }
};

var ringCount = ringCountGenerator();

var addRing = function () {
  var nextIndex = rings.length;

  var items = null;

  if (nextIndex === 0) {
    items = [circle.place()];
  } else {
    var count  = ringCount.next().value;

    items = _.times(count, () => {
      return circle.place();
    });
  }

  // Add the new ring
  rings.push({ items, angle: 0 });
};

var resize = _.throttle(function () {
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;

  paper.view.viewSize = new paper.Size(canvas.width, canvas.height);

  // Ensure there are enough rings to fill the screen
  while (ringRadius(rings.length - 1) < (canvas.width / 2)) addRing();
});

var draw = function (e) {
  var angularDelta = ANGULAR_VELOCITY * (e.delta);

  // Special case to position the middle circle (ring 0)
  rings[0].items[0].position = paper.view.center;

  // Draw each circle in each ring in the right place, skipping ring 0 (the
  // middle cirlce)
  _.each(rings, (ring, index) => {
    if (index === 0) return;

    var offset = ringOffset(index);
    var count  = ring.items.length;
    var step   = 2 * Math.PI / count;

    // Apply a modifier on the angular velocity inversely proportional to the
    // current index
    ring.angle += angularDelta / (index / 5);

    // Reset when overflowing
    if (ring.angle > Math.PI * 2) ring.angle -= Math.PI * 2;

    // Position every circle in the right place
    for (let i = 0; i < count; i += 1) {
      let angle = i * step + ring.angle;
      let circle = ring.items[i];

      circle.position.x = paper.view.center.x + Math.cos(angle) * offset;
      circle.position.y = paper.view.center.y + Math.sin(angle) * offset;
    }
  });
};

var setup = function () {
  paper.setup(canvas);

  circle = new paper.Symbol(new paper.Path.Circle({
    radius: CIRCLE_RADIUS,
    fillColor: CIRCLE_COLOR,
  }));

  // Bind the onFrame method
  paper.view.onFrame = draw;

  // Handle resizing
  window.addEventListener("resize", fn.fire(resize));
};

var start = function () {
  setup();
  container.classList.add("hero--ready");
};

module.exports = { start };
