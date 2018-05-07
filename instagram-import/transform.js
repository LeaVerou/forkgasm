const fs = require("fs");
const stable = require("stable");
const https = require("https");
const { URL } = require("url");

var input = process.argv[2] || "export.json";
var output = process.argv[3] || "../restaurants.json";
var initial = process.argv[4] || "../restaurants.json";

var initialData = initial? readJSON(initial).then(data => {
	var ret = {};
	// Properties need to not match ^\d+$, otherwise insertion order is not maintaained
	// See https://bugs.chromium.org/p/v8/issues/detail?id=164
	data.restaurant.forEach(r => ret["pk" + r.pk] = r);
	return ret;
}) : Promise.resolve({});

initialData.then(restaurants => {
	return readJSON(input).then(data => {
		data = data.photo || data || [];

		for (var photo of data) {
			let loc, restaurant;

			if (photo.location) {
				loc = photo.location;
				restaurant = restaurants["pk" + loc.pk];

				if (!restaurant) {
					if (!photo.caption) {
						// Not a restaurant and no caption? Dump.
						return;
					}

					// Initialize restaurant
					restaurant = Object.assign({
						id: idify(loc.name),
						name: "",
						dishes: 0,
						visit: [],
					}, loc);

					restaurants["pk" + loc.pk] = restaurant;
				}

				// Calculate rating
				var caption = photo.caption;

				if (caption) {
					var ratingRegex = /[\d.]+\/10/;
					var index = caption.search(ratingRegex);

					if (index > -1) {
						var ratings = caption.match(/[\d.]+(?=\/10)/g);

						if (ratings.length > 1) {
							// More than 1 ratings
							var lea = caption.match(/[\d.]+(?=\/10 (for|from) (me|Lea))/g);
							var chris = caption.match(/[\d.]+(?=\/10 (for|from) Chris)/g);

							if (lea && chris) {
								// Separate ratings
								photo.rating = [+lea[0], +chris[0]];
							}
							else {
								// Probably a guest rating or separate dishes, just keep first rating
								photo.rating = +ratings[0];
							}
						}
						else if (ratings.length == 1) {
							photo.rating = +ratings[0];
						}

						// Separate dish name and comment
						photo.name = caption.slice(0, index).trim();
						photo.comment = caption.slice(index);

						if (typeof photo.rating === "number") {
							photo.comment = photo.comment.replace(photo.rating + "/10", "");
						}

						photo.comment = photo.comment.trim();

						if (!photo.comment) {
							delete photo.comment;
						}
					}
					else {
						// No rating
						photo.name = caption;
					}

					delete photo.caption;
				}

				photo.date = new Date(photo.date * 1000).toISOString().match(/^[\d-]+/)[0];

				// Download image from Instagram
				let url = new URL(photo.image);
				let filename = url.pathname.match(/[^\/]+$/);
				let imagePath = "/images/dishes/" + filename;
				let tempPath = "../images/dishes" + filename + ".tmp";
				let file = fs.createWriteStream(tempPath);

				file.on("error", err => {
					console.log("Error while writing stream", err);
					process.exit();
				});

				https.get(photo.image, function(response) {
					response.pipe(file);

					response.on("end", () => {
						var cwd = process.cwd();

						// Move from temporary location to proper location
						fs.rename(cwd + "/" + tempPath, cwd + "/.." + imagePath, err => {
							if (err) {
								console.log("Error", err);
							}
							else {
								console.log(`Downloaded ${imagePath} successfully!`);
							}
						});
					});
				});

				photo.image = imagePath;

				let visit;

				for (let v of restaurant.visit) {
					if (v.date == photo.date) {
						visit = v;
						break;
					}
				}

				if (!visit) {
					visit = {date: photo.date, dish: []};
					restaurant.visit.push(visit);
				}

				delete photo.date;
				delete photo.location;
				visit.dish.unshift(photo);
				restaurant.dishes++;
			}
		}

		// Turn from object literal to array
		restaurants = stable(Object.values(restaurants), (a, b) => b.dishes - a.dishes);

		// Merge consecutive visits (probably due to timezone issues)
		// This assumes we never visit the same restaurant two days in a row
		restaurants.forEach(r => {
			for (var i=1, v; v = r.visit[i]; i++) {
				var prev = r.visit[i - 1];

				if (Math.abs(new Date(v.date) - new Date(prev.date)) === 86400000) {
					v.dish = [...v.dish, ...prev.dish];
					r.visit.splice(i-1, 1);
					i--;
				}
			}

			// Sort visits by date in descending order
			r.visit = stable(r.visit, (a, b) => new Date(b.date) - new Date(a.date));
		});

		return writeFile(output, JSON.stringify({restaurant: restaurants}, null, "\t")).then(err => {
			console.log("Finished writing data successfully!");
		});
	});
})
.catch(err => console.log("Error:", err));

function idify(str) {
	var ret = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Convert accented letters to ASCII
			.replace(/[^\w\s-]/g, "") // Remove remaining non-ASCII characters
			.trim().replace(/\s+/g, "-") // Convert whitespace to hyphens
			.toLowerCase();

	if (!ret) {
		// Foreign name
		ret = str.trim().replace(/\s+/g, "-") // Convert whitespace to hyphens
				.toLowerCase();
	}

	return ret;
}

function readJSON(file) {
	return readFile(file, "utf8").then(data => data? JSON.parse(data) : Promise.reject());
}

function readFile(file, encoding) {
	return new Promise((resolve, reject) => {
		fs.readFile(file, encoding, (err, data) => {
			if (err) {
				reject(err);
			}
			else {
				resolve(data);
			}
		});
	});
}

function writeFile(file, data) {
	return new Promise((resolve, reject) => {
		fs.writeFile(file, data, err => {
			if (err) {
				reject(err);
			}
			else {
				resolve(data);
			}
		});
	});
}
