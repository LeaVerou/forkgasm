(function() {

var rules = new Map([
	[/https?:\/\/get\.mavo\.io\/mavo\./, "http://localhost:8000/dist/mavo."],
	[/https?:\/\/dev\.mavo\.io\/dist\/mavo\./, "http://localhost:8000/dist/mavo."],
	[/https?:\/\/plugins\.mavo\.io\/(?!plugins.json)/, "http://localhost:8003/"],
]);

if (!self.document) {
	// We're in a service worker! Oh man, we’re living in the future! 🌈🦄
	if (location.hostname === "localhost") {
		// We're testing locally, use local URLs
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
	}

	return;
}

var src = document.currentScript ? document.currentScript.src : "debug.js";

if ("serviceWorker" in navigator) {
	// Register this script as a service worker
	addEventListener("load", function() {
		navigator.serviceWorker.register(src).catch(e => console.error(e));
	});
}


})();
