// Support for generators
import "babel/polyfill";

import train from "./components/train";
import hero from "./components/hero";

document.addEventListener("DOMContentLoaded", function () {
  hero.start();
  train.start();
});
