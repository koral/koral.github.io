// Animation for the landing page hero

var _     = require("lodash");
var paper = require("paper");

var canvas = document.querySelector("#train-canvas");

const TRAIN_FILL = "#ed3832";

const TRAIN_WIDTH           = 380;
const TRAIN_HEIGHT          = 1051;

const SCREEN_MASK_IMAGE     = "/images/train_screen_mask.svg";
const BACKGROUND_IMAGE      = "/images/train_background.svg";

const SCREEN_WIDTH          = 264;
const SCREEN_HEIGHT         = 153;
const SCREEN_MARGIN         = 30;
const SCREEN_LANES          = 5;

const SCREEN_MASK_X         = 190;
const SCREEN_MASK_Y         = 891;

const SHAPE_SPEED           = 80; // px/sec
const SCREEN_SHAPE_INTERVAL = 250;

// Symbols for instancing
var symbolNames;

var symbols      = {};
var laneSymbols  = [];
var screenShapes = [];

var ready        = false;

// Generates lanes in a way that is guaranteed to distribute items througout
// the screen without repetition
var generateLane = function* () {
  var lanes = [];
  var last;

  var generate = () => _.shuffle(_.range(0, SCREEN_LANES));

  while (true) {
    if (lanes.length === 0) {
      do {
        lanes = generate();
      } while (lanes[0] === last);
    }

    last = lanes.shift();
    yield last;
  }
};

var laneGenerator = generateLane();

var addScreenShape = function () {
  var lane = laneGenerator.next().value;

  do {
    var symbolName = _.sample(symbolNames);
  } while (laneSymbols[lane] === symbolName);

  laneSymbols[lane] = symbolName;

  var placed = symbols[symbolName].place();

  screenShapes.push(placed);
  placed.sendToBack();

  var screenX = (SCREEN_WIDTH - SCREEN_MARGIN * 2) / (SCREEN_LANES - 1) * lane;

  placed.position = {
    x: screenX + SCREEN_MASK_X - SCREEN_WIDTH / 2 + SCREEN_MARGIN,
    y: SCREEN_MASK_Y + SCREEN_HEIGHT / 2 + placed.bounds.height,
  };
};

var update = function (e) {
  if (!ready) return;

  _.remove(screenShapes, (shape) => {
    var position = shape.position.y -= SHAPE_SPEED * e.delta;

    if (position < SCREEN_MASK_Y - SCREEN_HEIGHT / 2 - shape.bounds.height) {
      shape.remove();
      return true;
    }
  });
};

var prepareComponents = function () {
  // Prepare symbols
  symbols.circle = new paper.Symbol(new paper.Path.Circle({
    radius:    16,
    fillColor: TRAIN_FILL,
  }));

  symbols.square = new paper.Symbol(new paper.Path.Rectangle({
    size:      [26, 26],
    fillColor: TRAIN_FILL,
  }));

  symbols.triangle = new paper.Symbol(new paper.Path.RegularPolygon({
    sides:     3,
    radius:    20,
    fillColor: TRAIN_FILL,
  }));

  // Cache the keys in symbols
  symbolNames = _.keys(symbols);

  // Load SVGs
  paper.project.importSVG(SCREEN_MASK_IMAGE, (mask) => {
    mask.position  = [SCREEN_MASK_X, SCREEN_MASK_Y];
    mask.fillColor = "white";

    paper.project.importSVG(BACKGROUND_IMAGE, (background) => {
      background.fillColor = TRAIN_FILL;
      mask.insertBelow(background);

      ready = true; // Ready to start drawing
    });
  });

};

var setup = function () {
  paper = new paper.PaperScope();
  paper.setup(canvas);

  // Resize the canvas
  canvas.width  = TRAIN_WIDTH;
  canvas.height = TRAIN_HEIGHT;

  paper.view.viewSize = new paper.Size(TRAIN_WIDTH, TRAIN_HEIGHT);

  prepareComponents();

  // Bind the onFrame method
  paper.view.onFrame = update;
  setInterval(addScreenShape, SCREEN_SHAPE_INTERVAL);
};

var start = function () {
  setup();
};

module.exports = { start };
