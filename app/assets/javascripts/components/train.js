// Animation for the landing page hero

import { PaperScope } from "paper";
import _ from "lodash";

var paper = new PaperScope();

window.paper = paper;

var canvas = document.querySelector("#train-canvas");

// Most values are constants to avoid debugging nightmares

const TRAIN_FILL              = "#ed3832";

const ANIMATION_SPEED         = 1;

const TRAIN_WIDTH             = 380;
const TRAIN_HEIGHT            = 1051;

const APP_IMAGE               = "/images/train_application.svg";
const SCREEN_MASK_IMAGE       = "/images/train_screen_mask.svg";
const BACKGROUND_IMAGE        = "/images/train_background.svg";

const WIRE_Y                  = 696.5;
const WIRE_HEIGHT             = 219;
const WIRE_MASK_HEIGHT        = WIRE_HEIGHT + 100;
const WIRE_MORPH_THRESHOLD    = WIRE_Y - WIRE_HEIGHT / 2 - 20;

const APP_Y                   = 488;

const APP_RECT_WIDTH          = 70;
const APP_RECT_MIN_HEIGHT     = 40;
const APP_RECT_MAX_HEIGHT     = 120;
const APP_RECT_HEIGHT_STEP    = 20;
const APP_RECT_MARGIN         = 5;
const APP_RECT_START_X        = 12;
const APP_RECT_START_Y        = 421;

const APP_RECT_ANIMATION_TIME = 0.3 * ANIMATION_SPEED; // s

const APP_MASK_WIDTH          = 370;
const APP_MASK_HEIGHT         = 168;
const APP_MASK_X              = TRAIN_WIDTH / 2;
const APP_MASK_Y              = 505;

const SCREEN_WIDTH            = 264;
const SCREEN_HEIGHT           = 154;
const SCREEN_MARGIN           = 30;
const SCREEN_LANES            = 5;
const SCREEN_LANE_RANDOM      = 18;

const SCREEN_MASK_X           = 190;
const SCREEN_MASK_Y           = 891;

const WIRE_SHAPE_MARGIN       = 30;

const SHAPE_SPEED             = 60 / ANIMATION_SPEED; // px/sec
const RECT_SPEED              = 60 / ANIMATION_SPEED;
const SCREEN_SHAPE_INTERVAL   = 320 * ANIMATION_SPEED;

const SYMBOL_STROKE_WIDTH     = 3.2;
const SYMBOL_ATTRIBUTES       = {
  fillColor:   TRAIN_FILL,
  strokeColor: "white",
  strokeWidth: SYMBOL_STROKE_WIDTH,
};

// Symbols for instancing
var background;
var screenMask;
var symbolNames;

var symbols          = {};
var lastSymbolInLane = [];
var screenSymbols    = [];

var wireGroup;
var wireMask;
var wireSymbols      = [];

var appGroup;
var morph            = {};
var appRects         = [];
var appSymbols       = [];

var ready            = false;

// Generates lanes in a way that is guaranteed to distribute items througout
// the screen without repetition
function* generateLane() {
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
}

var laneGenerator = generateLane();

function addScreenShape() {
  if (!document.hasFocus()) return;

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
}

function addToWire(shape) {
  var last = wireSymbols[0];

  // Discard shape if not distant at least 10px from the last one on the wire
  if (last && last.position.y + last.bounds.height / 2 >
              WIRE_Y + WIRE_HEIGHT / 2 - WIRE_SHAPE_MARGIN) {
    shape.remove();
    return;
  }

  shape.position.x = paper.view.center.x;
  shape.insertAbove(wireMask);
  wireGroup.addChild(shape);
  wireSymbols.unshift(shape);

  shape.position.y = WIRE_Y + WIRE_HEIGHT / 2 + shape.bounds.height / 2;
}

function startMorph(shape) {
  var latest = appRects[0];

  var nextSymbol;

  do {
    nextSymbol = _.sample(appSymbols);
  } while (latest && (nextSymbol === latest.symbol));

  morph.ongoing = true;
  morph.rect    = nextSymbol.place();
  morph.shape   = shape;

  // Put rect in the final position
  morph.rect.position = appRectStartPosition(morph.rect);

  morph.matrix  = morph.rect.matrix.clone();

  morph.start   = shape.position.clone();
  morph.current = morph.start;
  morph.target  = morph.rect.position.clone();

  // Calculate the vector
  morph.vector = morph.target.subtract(shape.position);
  morph.length = morph.vector.length;
  morph.speed  = morph.length / APP_RECT_ANIMATION_TIME;

  morph.rect.position = morph.start;
}

function appRectStartPosition(rect) {
  return new paper.Point(
    APP_RECT_START_X + APP_RECT_WIDTH / 2,
    APP_RECT_START_Y + rect.bounds.height / 2
  );
}

function addToApp(rect) {
  var latest = appRects[0];

  var position = appRectStartPosition(rect);

  if (latest) {
    rect.position = [
      latest.position.x - latest.bounds.width - APP_RECT_MARGIN * 2,
      position.y,
    ];
  } else {
    rect.position = position;
  }

  appGroup.addChild(rect);

  appRects.unshift(rect);
}

function updateScreen(e) {
  _.remove(screenSymbols, (shape) => {
    var position = shape.position.y -= SHAPE_SPEED * e.delta;

    // When out of bound, push the shape to the wire and remove it from screen
    if (position < SCREEN_MASK_Y - SCREEN_HEIGHT / 2 - shape.bounds.height) {
      addToWire(shape);
      return true;
    }
  });
}

function updateWire(e) {
  _.remove(wireSymbols, (shape) => {
    shape.position.y -= SHAPE_SPEED * e.delta;

    if (!morph.ongoing &&
        (shape.position.y - shape.bounds.height / 2 < WIRE_MORPH_THRESHOLD)) {
      var latest = appRects[0];

      // What will be the distance of the latest when the anim's over?
      var animationDelta = RECT_SPEED * APP_RECT_ANIMATION_TIME;

      if (!latest || (latest.position.x + animationDelta -
          APP_RECT_WIDTH * 1.5 - APP_RECT_MARGIN * 2 >= APP_RECT_START_X)) {
        startMorph(shape);

        // Finally, remove this shape from wireSymbols
        return true;
      }
    }
  });
}

function updateMorph(e) {
  if (!morph.shape || !morph.ongoing) return;

  var segment = new paper.Point({
    length: e.delta * morph.speed,
    angle:  morph.vector.angle,
  });

  morph.current = morph.current.add(segment);

  var angle = morph.current.getDirectedAngle(morph.target);
  var distance = morph.current.getDistance(morph.target);

  var shapeScale = distance / morph.length;
  var rectScale  = Math.abs(shapeScale - 1);

  morph.rect.matrix = morph.matrix.clone();
  morph.shape.matrix = morph.matrix.clone();

  morph.rect.scale(rectScale);
  morph.shape.scale(shapeScale);

  morph.rect.position = morph.current;
  morph.shape.position = morph.current;

  if (Math.abs(distance) < 2 || angle < 0) {
    morph.ongoing = false;
    addToApp(morph.rect);
  }
}

function updateApplication(e) {
  _.remove(appRects, (rect) => {
    rect.position.x += RECT_SPEED * e.delta;

    if (rect.position.x > APP_MASK_X + (APP_MASK_WIDTH + APP_RECT_WIDTH) / 2) {
      rect.remove();
      return true;
    }
  });
}

function update(e) {
  // Skip frames when gaps happen
  if (!ready || e.delta > 1) return;

  updateScreen(e);
  updateWire(e);
  updateMorph(e);
  updateApplication(e);
}

function prepareComponents() {
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

  // Prepare app rectangles
  _.each(_.range(
    APP_RECT_MIN_HEIGHT,
    APP_RECT_MAX_HEIGHT + APP_RECT_HEIGHT_STEP,
    APP_RECT_HEIGHT_STEP
  ), (height) => {
    appSymbols.push(new paper.Symbol(new paper.Path.Rectangle({
      size: [APP_RECT_WIDTH, height],
      radius: 2,
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

      paper.project.importSVG(APP_IMAGE, (app) => {
        app.fillColor = TRAIN_FILL;
        app.position.y = APP_Y;
        app.insertBelow(screenMask);

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

    var appMask = new paper.Path.Rectangle({
      size: [APP_MASK_WIDTH, APP_MASK_HEIGHT],
      position: [APP_MASK_X, APP_MASK_Y],
      clipMask: true,
      // fillColor: "purple"
    });

    appGroup = new paper.Group(appMask);
    appGroup.clipped = true;

    ready = true; // Ready to start drawing
    canvas.classList.add("train-canvas--ready");
  }
}

export function start() {
  paper.setup(canvas);

  // Resize the canvas
  canvas.width  = TRAIN_WIDTH;
  canvas.height = TRAIN_HEIGHT;

  paper.view.viewSize = new paper.Size(TRAIN_WIDTH, TRAIN_HEIGHT);

  prepareComponents();

  // Bind the onFrame method
  paper.view.onFrame = update;
  setInterval(addScreenShape, SCREEN_SHAPE_INTERVAL);
}
