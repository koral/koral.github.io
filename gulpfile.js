var bower   = require("gulp-bower");
var gulp    = require("gulp");
var header  = require("gulp-header");
var minify  = require("gulp-minify-css");
var notify  = require("gulp-notify");
var plumber = require("gulp-plumber");
var sass    = require("gulp-sass");

var CONFIG = {
  STYLESHEETS: {
    ORIGIN: "./assets/stylesheets",
    DEST:   "./public/stylesheets",
  },
  JAVASCRIPTS: {
    ORIGIN: "./assets/javascripts",
    DEST:   "./public/javascripts",
  },
  BOWER: {
    DEST: "./bower_components",
  },
};

// Helpers

var notice = function (location) {
  return header([
    "/* Don't edit this file directly. Make changes in",
    location.replace("./", ""),
    "instead. */\n",
  ].join(" "));
};

var errorHandler = function () {
  return plumber({
    errorHandler: notify.onError({
      sound:   "Glass",
      message: "Error: <%= error.message %>",
    }),
  });
};

// Tasks

gulp.task("bower", function () {
  bower()
    .pipe(gulp.dest(CONFIG.BOWER.DEST));
});

gulp.task("stylesheets", function () {
  gulp.src(CONFIG.STYLESHEETS.ORIGIN + "/application.scss")
      .pipe(errorHandler())
      .pipe(sass({
        includePaths: [
          CONFIG.BOWER.DEST + "/bootstrap-sass-official/assets/stylesheets"
        ],
      }))
      .pipe(minify())
      .pipe(notice(CONFIG.STYLESHEETS.ORIGIN))
      .pipe(gulp.dest(CONFIG.STYLESHEETS.DEST));
});

gulp.task("javascripts", function () {
  gulp.src(CONFIG.JAVASCRIPTS.ORIGIN  + "/index.js")
      .pipe(errorHandler())
      .pipe(notice(CONFIG.JAVASCRIPTS.ORIGIN))
      .pipe(gulp.dest(CONFIG.JAVASCRIPTS.DEST));
});

gulp.task("default", ["bower", "stylesheets", "javascripts"]);

gulp.task("watch", ["default"], function () {
  gulp.watch(CONFIG.STYLESHEETS.ORIGIN + "/**/*.scss", ["stylesheets"]);
  gulp.watch(CONFIG.JAVASCRIPTS.ORIGIN + "/**/*.js",   ["javascripts"]);
});
