// Support for generators
import "babel/polyfill";

import * as train from "./components/train";
import * as hero from "./components/hero";

document.addEventListener("DOMContentLoaded", () => {
  hero.start();
  train.start();
});
