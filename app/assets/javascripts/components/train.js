// Animation for the landing page hero

var _       = require("lodash");
var paperjs = require("paper");
var paper   = new paperjs.PaperScope();

var canvas = document.querySelector("#train-canvas");

const TRAIN_FILL                   = "#ed3832";

// Most values are constants to avoid debugging nightmares

const TRAIN_WIDTH           = 380;
const TRAIN_HEIGHT          = 1051;

const APP_IMAGE             = "/images/train_application.svg";
const SCREEN_MASK_IMAGE     = "/images/train_screen_mask.svg";
const BACKGROUND_IMAGE      = "/images/train_background.svg";

const WIRE_Y                = 696.5;
const WIRE_HEIGHT           = 219;
const WIRE_MASK_HEIGHT      = WIRE_HEIGHT + 100;

const APP_Y                 = 488;
const APP_WIDTH             = TRAIN_WIDTH;

const APP_RECT_WIDTH        = 70;
const APP_RECT_MIN_HEIGHT   = 40;
const APP_RECT_MAX_HEIGHT   = 120;
const APP_RECT_HEIGHT_STEP  = 20;
const APP_RECT_MARGIN       = 5;
const APP_RECT_START_X      = 12;
const APP_RECT_START_Y      = 421;

const SCREEN_WIDTH          = 264;
const SCREEN_HEIGHT         = 154;
const SCREEN_MARGIN         = 30;
const SCREEN_LANES          = 5;
const SCREEN_LANE_RANDOM    = 18;

const SCREEN_MASK_X         = 190;
const SCREEN_MASK_Y         = 891;
const SCREEN_MASK_INSET     = 12;

const WIRE_APP_MASK_X       = TRAIN_WIDTH / 2;
const WIRE_APP_MASK_Y       = 487;

const SHAPE_SPEED           = 80; // px/sec
const SCREEN_SHAPE_INTERVAL = 250;

const SYMBOL_STROKE_WIDTH   = 3.2;
const SYMBOL_ATTRIBUTES     = {
  fillColor:   TRAIN_FILL,
  strokeColor: "white",
  strokeWidth: SYMBOL_STROKE_WIDTH,
};

// Symbols for instancing
var background;
var screenMask;
var symbolNames;

var symbols            = {};
var lastSymbolInLane   = [];
var screenSymbols      = [];

var wireGroup;
var wireMask;
var wireSymbols        = [];

var applicationRects   = [];
var applicationSymbols = [];

var ready              = false;

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
  } while (lastSymbolInLane[lane] === symbolName);

  lastSymbolInLane[lane] = symbolName;

  var placed = symbols[symbolName].place();

  screenSymbols.unshift(placed);
  placed.sendToBack();

  var screenX = (SCREEN_WIDTH - SCREEN_MARGIN * 2) / (SCREEN_LANES - 1) * lane;

  placed.position = {
    x: screenX +
       Math.round(Math.random() * SCREEN_LANE_RANDOM - SCREEN_LANE_RANDOM / 2) +
       SCREEN_MASK_X - SCREEN_WIDTH / 2 + SCREEN_MARGIN,
    y: SCREEN_MASK_Y + SCREEN_HEIGHT / 2 + placed.bounds.height,
  };
};

var addToWire = function (shape) {
  var last = wireSymbols[0];

  // Discard shape if not distant at least 10px from the last one on the wire
  if (last && last.position.y + last.bounds.height / 2 >
              WIRE_Y + WIRE_HEIGHT / 2 - 10) {
    shape.remove();
    return;
  }

  shape.position.x = paper.view.center.x;
  shape.insertAbove(wireMask);
  wireGroup.addChild(shape);
  wireSymbols.unshift(shape);

  shape.position.y = WIRE_Y + WIRE_HEIGHT / 2 + shape.bounds.height / 2;
};

var updateScreen = function (e) {
  _.remove(screenSymbols, (shape) => {
    var position = shape.position.y -= SHAPE_SPEED * e.delta;

    // When out of bound, push the shape to the wire and remove it from screen
    if (position < SCREEN_MASK_Y - SCREEN_HEIGHT / 2 - shape.bounds.height) {
      addToWire(shape);
      return true;
    }
  });
};

var updateWire = function (e) {
  _.remove(wireSymbols, (shape) => {
    var position = shape.position.y -= SHAPE_SPEED * e.delta;

    if (shape.position.y < WIRE_Y - WIRE_HEIGHT / 2) {
      // Consider shape for jumping
      shape.remove();
      return true;
    }
  });
};

var updateApplication = function (e) {
  var last = applicationRects[0];

  if (last === undefined ||
      last.position.x - APP_RECT_WIDTH * 1.5 - APP_RECT_MARGIN * 2) {
    var placed = _.sample(applicationSymbols).place();

    placed.position = [
      APP_RECT_START_X + APP_RECT_WIDTH / 2,
      APP_RECT_START_Y + placed.bounds.height / 2,
    ];

    applicationRects.unshift(placed);
  }
  _.each(applicationRects, (rect) => {
    rect.position.x += SHAPE_SPEED * e.delta;
  });
};

var update = function (e) {
  if (!ready) return;

  updateScreen(e);
  updateWire(e);
  updateApplication(e);
};

var prepareComponents = function () {
  // Prepare screen symbols
  symbols.circle = new paper.Symbol(new paper.Path.Circle(_.defaults({
    radius: 16 + SYMBOL_STROKE_WIDTH / 2,
  }, SYMBOL_ATTRIBUTES)));

  symbols.square = new paper.Symbol(new paper.Path.Rectangle(_.defaults({
    size: 31 + SYMBOL_STROKE_WIDTH / 2,
  }, SYMBOL_ATTRIBUTES)));

  symbols.triangle = new paper.Symbol(new paper.Path.RegularPolygon(_.defaults({
    sides:  3,
    radius: 20 + SYMBOL_STROKE_WIDTH / 2,
  }, SYMBOL_ATTRIBUTES)));

  // Cache the keys in symbols
  symbolNames = _.keys(symbols);

  // Prepare application rectangles
  _.each(_.range(
    APP_RECT_MIN_HEIGHT,
    APP_RECT_MAX_HEIGHT + APP_RECT_HEIGHT_STEP,
    APP_RECT_HEIGHT_STEP
  ), (height) => {
    applicationSymbols.push(new paper.Symbol(new paper.Path.Rectangle({
      size: [APP_RECT_WIDTH, height],
      radius: 20,
      fillColor: TRAIN_FILL,
    })));
  });

  // Load SVGs
  paper.project.importSVG(SCREEN_MASK_IMAGE, (mask) => {
    if (!mask) return;

    screenMask = mask;

    screenMask.position  = [SCREEN_MASK_X, SCREEN_MASK_Y];
    screenMask.fillColor = "white";


    paper.project.importSVG(BACKGROUND_IMAGE, (image) => {
      if (!image) return;

      background = image;

      background.fillColor = TRAIN_FILL;
      screenMask.insertBelow(background);

      paper.project.importSVG(APP_IMAGE, (application) => {
        application.fillColor = TRAIN_FILL;
        application.position.y = APP_Y;
        application.insertBelow(screenMask);

        finalize();
      });
    });
  });

  // Wrap up once everything's loaded
  function finalize() {
    var wire = new paper.Path.Rectangle({
      size:      [2, WIRE_HEIGHT],
      position:  [paper.view.center.x, WIRE_Y],
      fillColor: TRAIN_FILL,
    });

    wireMask = new paper.Path.Rectangle({
      size:     [TRAIN_WIDTH, WIRE_MASK_HEIGHT],
      position: [
        paper.view.center.x,
        WIRE_Y - (WIRE_MASK_HEIGHT - WIRE_HEIGHT) / 2
      ],
      clipMask: true,
      fillColor: "purple",
    });

    wireMask.insertAbove(screenMask);

    wireGroup = new paper.Group(wireMask);
    wireGroup.clipping = true;

    wire.insertBelow(wireGroup);

    ready = true; // Ready to start drawing
    canvas.classList.add("train-canvas--ready");
  }
};

var start = function () {
  document.addEventListener("click", () => {
    // return;
  paper.setup(canvas);

  // Resize the canvas
  canvas.width  = TRAIN_WIDTH;
  canvas.height = TRAIN_HEIGHT;

  paper.view.viewSize = new paper.Size(TRAIN_WIDTH, TRAIN_HEIGHT);

  prepareComponents();

  // Bind the onFrame method
  paper.view.onFrame = update;
  setInterval(addScreenShape, SCREEN_SHAPE_INTERVAL);
  });
};

module.exports = { start };
