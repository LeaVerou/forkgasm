var gulp = require("gulp");
var rename = require("gulp-rename");
var postcss = require("gulp-postcss");
var fileinclude = require("gulp-file-include");
var resize = require("gulp-image-resize");
var fs = require("fs");
var path = require("path");
var filter = require("gulp-filter");
var exists = require("file-exists");

gulp.task("css", function () {
	return gulp.src(["**/*.src.css", "!node_modules/**"])
		.pipe(postcss([
			require("postcss-nesting")(),
			require("postcss-selector-matches")({
				lineBreak: true
			}),
			require("autoprefixer")({
				browsers: ["last 2 versions"]
			}),
			require("postcss-custom-properties")({
				preserve: false,
				warnings: false
			})
		]))
		.pipe(rename({ extname: "" }))
		.pipe(rename({ extname: ".css" }))
		.pipe(gulp.dest("."));
});

gulp.task("html", function() {
	return gulp.src(["**/*.tpl.html"])
		.pipe(fileinclude({
			basepath: "templates/"
		}).on("error", function(error) {
			console.error(error);
		}))
		.pipe(rename({ extname: "" }))
		.pipe(rename({ extname: ".html" }))
		.pipe(gulp.dest("."));
});

function makeThumbnails(src, force) {
	if (src) {
		console.log("Making thumbnails for ", src, "...");
		var ret = gulp.src(src);
	}
	else {
		src = ["images/*.jpg", "images/dishes/*.jpg"];

		var ret = gulp.src(src).pipe(filter(async file => {
			var thumbsPath = file.path.replace(/\/[^/]+$/, "/thumbs$&");
			var thumbExists = await exists(thumbsPath);
			return !thumbExists;
		}));
	}

	return ret.pipe(resize({
			width: 140,
			height: 140,
			crop: true,
			upscale: false,
			cover: true,
			noProfile: true,
			sharpen: true,
			filter: "Catrom"
		}))
		.pipe(gulp.dest(file => path.join(path.dirname(file.path), "thumbs")));
}

gulp.task("thumbnails", function() {
	return makeThumbnails(["images/*.jpg", "images/dishes/*.jpg"]);
});

gulp.task("watch", function() {
	gulp.watch(["**/*.src.css"], gulp.series("css"));
	gulp.watch(["**/*.tpl.html", "./templates/*.html"], gulp.series("html"));
	gulp.watch(["images/*.jpg", "images/dishes/*.jpg"], obj => {
		if (obj.type == "deleted") {
			// Delete file
			var thumb = obj.path.replace("/dishes/", "/dishes/thumbs/");
			console.log("Deleting", thumb, "...");
			fs.unlink(thumb, err => {
				if (err && !(err.errno == -2 && err.code == "ENOENT")) {
					console.log("Error:", err);
				}
			});
		}
		else {
			// Regenerate thumbnail
			if (obj.path === undefined) {
				console.log("obj.path is undefined, here is obj:", obj);
			}
			else {
				makeThumbnails(obj.path.replace(process.cwd() + "/", ""));
			}
		}
	});
});

gulp.task("default", gulp.series("css"));
