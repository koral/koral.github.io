var fs    = require("fs");
var path  = require("path");
var child = require("child_process");

var babelify   = require("babelify");
var bower      = require("gulp-bower");
var browserify = require("browserify");
var buffer     = require("vinyl-buffer");
var del        = require("del");
var ghaml      = require("gulp-haml");
var glob       = require("gulp-css-globbing");
var gulp       = require("gulp");
var gutil      = require("gulp-util");
var haml       = require("haml");
var header     = require("gulp-header");
var kexec      = require("kexec");
var livereload = require("gulp-livereload");
var mapStream  = require("map-stream");
var minify     = require("gulp-minify-css");
var notifier   = require("node-notifier");
var notify     = require("gulp-notify");
var plumber    = require("gulp-plumber");
var sass       = require("gulp-sass");
var source     = require("vinyl-source-stream");
var uglify     = require("gulp-uglify");

var CONFIG = {
  PATHS: {
    PUBLIC:   "public",
    APP:      "app",
    SERVER:   "node_modules/.bin/http-server",
    GULPFILE: "gulpfile.js",
  },
  LAYOUTS: {
    SRC:     "app/layouts",
    DEFAULT: "application",
  },
  VIEWS: {
    SRC:  "app/views",
    DEST: "public",
  },
  STYLESHEETS: {
    SRC:  "app/assets/stylesheets",
    DEST: "public/stylesheets",
  },
  JAVASCRIPTS: {
    SRC:     "app/assets/javascripts",
    DEFAULT: "index.js",
    DEST:    "public/javascripts",
  },
  IMAGES: {
    SRC:  "app/assets/images",
    DEST: "public/images",
  },
  FONTS: {
    SRC:  "app/assets/fonts",
    DEST: "public/fonts",
  },
  STATIC: {
    SRC:  "static",
    DEST: "public",
  },
  BOWER: {
    DEST: "bower_components",
  },
};

// Environment

process.env.NODE_ENV = process.env.NODE_ENV || "development";
var production       = process.env.NODE_ENV === "production";

/* eslint-disable no-console */
if (production) console.warn("Running in the 'production' environment.");
/* eslint-enable */

// Helpers

var notice = function (location) {
  return header([
    "/* NOTE: Don't edit this file. Work from",
    location,
    "instead. */\n",
  ].join(" "));
};

var error = function () {
  return notify.onError({
    sound:   "Glass",
    message: "Error: <%= error.message %>",
  });
};

var errorHandler = function () {
  return plumber({ errorHandler: error() });
};

var devLivereload = function () {
  return production ? gutil.noop() : livereload();
};

// Tasks

gulp.task("bower", function () {
  bower()
    .pipe(gulp.dest(CONFIG.BOWER.DEST));
});

gulp.task("views", function () {
  var src    = path.join(CONFIG.LAYOUTS.SRC, CONFIG.LAYOUTS.DEFAULT + ".haml");
  var layout = haml(fs.readFileSync(src, "utf-8"));

  gulp.src(CONFIG.VIEWS.SRC + "/**/*.haml")
      .pipe(errorHandler())
      .pipe(ghaml())
      .pipe(mapStream(function (file, callback) {
        file.contents = new Buffer(layout({ content: file.contents }));
        callback(null, file);
      }))
      .pipe(gulp.dest(CONFIG.VIEWS.DEST))
      .pipe(devLivereload());
});

gulp.task("stylesheets", function () {
  gulp.src(CONFIG.STYLESHEETS.SRC + "/application.scss")
      .pipe(errorHandler())
      .pipe(glob({ extensions: [".css", ".scss"] }))
      .pipe(sass({
        includePaths: [
          CONFIG.STYLESHEETS.SRC,
          CONFIG.BOWER.DEST + "/bootstrap-sass-official/assets/stylesheets",
          CONFIG.BOWER.DEST + "/bourbon/app/assets/stylesheets",
        ],
      }))
      .pipe(notice(CONFIG.STYLESHEETS.SRC))
      .pipe(production ? minify({ keepSpecialComments: 0 }) : gutil.noop())
      .pipe(gulp.dest(CONFIG.STYLESHEETS.DEST))
      .pipe(devLivereload());
});

gulp.task("javascripts", function () {
  var src = browserify({
    entries:    [
      "./" + CONFIG.JAVASCRIPTS.SRC + "/" + CONFIG.JAVASCRIPTS.DEFAULT
    ],
    extensions: [".jsx"],
    debug:      true,
  });

  src.transform(babelify.configure({
    sourceMapRelative: __dirname + CONFIG.JAVASCRIPTS.SRC,
    blacklist:         ["useStrict"],
  }));

  return src.bundle()
            .on("error", error())
            .pipe(source(CONFIG.JAVASCRIPTS.DEFAULT))
            .pipe(buffer())
            .pipe(notice(CONFIG.JAVASCRIPTS.SRC))
            .pipe(production ? uglify() : gutil.noop())
            .pipe(gulp.dest(CONFIG.JAVASCRIPTS.DEST))
            .pipe(devLivereload());
});

gulp.task("images", function () {
  gulp.src(CONFIG.IMAGES.SRC + "/**/*")
      .pipe(gulp.dest(CONFIG.IMAGES.DEST));
});

gulp.task("fonts", function () {
  gulp.src(CONFIG.FONTS.SRC + "/**/*")
      .pipe(gulp.dest(CONFIG.FONTS.DEST));
});

gulp.task("static", function () {
  gulp.src(CONFIG.STATIC.SRC + "/**/*")
      .pipe(gulp.dest(CONFIG.STATIC.DEST));
});

gulp.task("default", [
  "bower", "views", "stylesheets", "javascripts", "images", "fonts", "static"
]);

gulp.task("reload", function () {
  notifier.notify({
    title: "Gulp",
    message: "Reloading gulpfile.js",
    sound: "Pop"
  });
  /* eslint-disable no-console */
  console.log("Reloading gulpfile.js");
  /* eslint-enable */
  kexec(process.argv.join(" "));
});

gulp.task("watch", ["default"], function () {
  livereload.listen();

  gulp.watch(CONFIG.VIEWS.SRC + "/**/*.haml",       ["views"]);
  gulp.watch(CONFIG.LAYOUTS.SRC + "/**/*.haml",     ["views"]);
  gulp.watch(CONFIG.STYLESHEETS.SRC + "/**/*.scss", ["stylesheets"]);
  gulp.watch(CONFIG.JAVASCRIPTS.SRC + "/**/*.js",   ["javascripts"]);
  gulp.watch(CONFIG.IMAGES.SRC + "/**/*",           ["images"]);
  gulp.watch(CONFIG.FONTS.SRC + "/**/*",            ["fonts"]);
  gulp.watch(CONFIG.STATIC.SRC + "/**/*",           ["static"]);

  gulp.watch(CONFIG.PATHS.GULPFILE, ["reload"]);
});

gulp.task("dev", ["watch"], function () {
  var proc = child.spawn(CONFIG.PATHS.SERVER, [CONFIG.PATHS.PUBLIC, "-p4000"]);

  /* eslint-disable no-console */
  proc.stdout.on("data", function (data) { console.log(data.toString()); });
  /* eslint-enable */
});

gulp.task("deploy", ["default"], function () {
  /* eslint-disable no-console */
  if (!production) {
    console.log("Re-running the task in the production environment...");
    kexec("NODE_ENV=production " + process.argv.join(" "));
  }

  var branch = child.execSync("git symbolic-ref --short -q HEAD 2>/dev/null")
                    .toString()
                    .trim();

  if (branch !== "master") throw new Error("Can only deploy from master");

  console.log("Switching to gh-pages...");
  child.execSync("git checkout gh-pages");

  console.log("Adding contents of master into gh-pages...");
  child.execSync("git checkout master -- public");

  console.log("Moving the contents of the public directory to the root...");
  child.execSync("rsync -a " + CONFIG.PATHS.PUBLIC + "/ .");

  console.log("Removing redundant files...");
  del.sync([
    CONFIG.PATHS.PUBLIC,
    CONFIG.PATHS.APP,
    ".eslintrc",
    "gulpfile.js",
    "bower.json",
    "package.json",
  ]);

  console.log("Committing...");
  child.execSync("git add .");
  child.execSync("git commit -am 'Update gh-pages'");

  console.log("Pushing...");
  child.execSync("git push origin gh-pages");

  console.log("Switching back to " + branch + "...");
  child.execSync("git checkout master");
  /* eslint-enable */
});

gulp.task("clean", function () {
  del([CONFIG.PATHS.PUBLIC], function (err, deletedFiles) {
    /* eslint-disable no-console */
    console.log("Deleted:", deletedFiles.join(", "));
    /* eslint-enable */
  });
});
