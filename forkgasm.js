(function() {

if (location.hostname === "localhost") {
	// We're testing locally, use local URLs

	var rules = new Map([
		[/https?:\/\/get\.mavo\.io\/mavo\./, "http://localhost:8000/dist/mavo."],
		[/https?:\/\/dev\.mavo\.io\/dist\/mavo\./, "http://localhost:8000/dist/mavo."],
		[/https?:\/\/plugins\.mavo\.io\/(?!plugins.json)/, "http://localhost:8002/mavo/plugins/"],
	]);

	if (!self.document) {
		// We're in a service worker! Oh man, we’re living in the future! 🌈🦄


		self.addEventListener("fetch", function(evt) {
			var url = evt.request.url, newURL = url;

			rules.forEach((value, key) => {
				if (key.test(url)) {
					newURL = newURL.replace(key, value);
				}
			});

			if (newURL !== url) {
				var response = fetch(new Request(newURL, evt.request), evt.request)
					.then(res => res.status < 400? res : Promise.reject(res))
					// if that fails, return original request
					.catch(err => fetch(evt.request));

				evt.respondWith(response);
			}
		});


		return;
	}

	var src = document.currentScript ? document.currentScript.src : "forkgasm.js";

	if ("serviceWorker" in navigator ) {
		// Register this script as a service worker
		addEventListener("load", function() {
			navigator.serviceWorker.register(src).catch(e => console.error(e));
		});
	}
}

})();

function thumbnail(url) {
	if (url.indexOf("/images/dishes/") === 0) {
		// Local
		return url.replace("/images/dishes/", "/images/dishes/thumbs/");
	}

	// else it's an Instagram URL
	return url.replace(/\/(e\d5)\//, "/s240x240/$1/");
}
