var fs    = require("fs");
var path  = require("path");
var spawn = require("child_process").spawn;

var bower      = require("gulp-bower");
var del        = require("del");
var ghaml      = require("gulp-haml");
var gulp       = require("gulp");
var haml       = require("hamljs");
var header     = require("gulp-header");
var livereload = require("gulp-livereload");
var mapStream  = require("map-stream");
var minify     = require("gulp-minify-css");
var notify     = require("gulp-notify");
var plumber    = require("gulp-plumber");
var sass       = require("gulp-sass");

var CONFIG = {
  PATHS: {
    PUBLIC: "public",
    SERVER: "node_modules/.bin/http-server",
  },
  LAYOUTS: {
    ORIGIN:  "layouts",
    DEFAULT: "application",
  },
  VIEWS: {
    ORIGIN: "views",
    DEST:   "public",
  },
  STYLESHEETS: {
    ORIGIN: "assets/stylesheets",
    DEST:   "public/stylesheets",
  },
  JAVASCRIPTS: {
    ORIGIN: "assets/javascripts",
    DEST:   "public/javascripts",
  },
  BOWER: {
    DEST: "bower_components",
  },
};

// Helpers

var notice = function (location) {
  return header([
    "/* Don't edit this file directly. Make changes in",
    location,
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

gulp.task("haml", function () {
  var layoutPath = path.join(
    CONFIG.LAYOUTS.ORIGIN, CONFIG.LAYOUTS.DEFAULT + ".haml"
  );

  var layout = fs.readFileSync(layoutPath);

  gulp.src(CONFIG.VIEWS.ORIGIN + "/**/*.haml")
      .pipe(errorHandler())
      .pipe(ghaml({ compiler: "visionmedia" }))
      .pipe(mapStream(function (file, callback) {
        file.contents = new Buffer(haml.render(layout, {
          locals: { content: file.contents }
        }));

        callback(null, file);
      }))
      .pipe(gulp.dest(CONFIG.VIEWS.DEST))
      .pipe(livereload());
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
      .pipe(gulp.dest(CONFIG.STYLESHEETS.DEST))
      .pipe(livereload());
});

gulp.task("javascripts", function () {
  gulp.src(CONFIG.JAVASCRIPTS.ORIGIN  + "/index.js")
      .pipe(errorHandler())
      .pipe(notice(CONFIG.JAVASCRIPTS.ORIGIN))
      .pipe(gulp.dest(CONFIG.JAVASCRIPTS.DEST))
      .pipe(livereload());
});

gulp.task("default", ["bower", "haml", "stylesheets", "javascripts"]);

gulp.task("watch", ["default"], function () {
  livereload.listen();

  gulp.watch(CONFIG.VIEWS.ORIGIN + "/**/*.haml",       ["haml"]);
  gulp.watch(CONFIG.LAYOUTS.ORIGIN + "/**/*.haml",     ["haml"]);
  gulp.watch(CONFIG.STYLESHEETS.ORIGIN + "/**/*.scss", ["stylesheets"]);
  gulp.watch(CONFIG.JAVASCRIPTS.ORIGIN + "/**/*.js",   ["javascripts"]);
});

gulp.task("dev", ["watch"], function () {
  var proc = spawn(CONFIG.PATHS.SERVER, [CONFIG.PATHS.PUBLIC, "-p4000"]);

  /* eslint-disable no-console */
  proc.stdout.on("data", function (data) { console.log(data.toString()); });
  /* eslint-enable */
});

gulp.task("clean", function () {
  del([CONFIG.PATHS.PUBLIC], function (err, deletedFiles) {
    /* eslint-disable no-console */
    console.log("Deleted:", deletedFiles.join(", "));
    /* eslint-enable */
  });
});
