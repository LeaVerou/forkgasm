function thumbnail(url) {
	if (!url) {
		return url;
	}

	if (url.indexOf("/images/dishes/") === 0) {
		// Local
		return url.replace("/images/dishes/", "/images/dishes/thumbs/");
	}

	// else it's an Instagram URL
	return url.replace(/\/(e\d5)\//, "/s240x240/$1/");
}


function getAwardURL(award, restaurant) {
	if (!award || !award.startsWith) {
		return null;
	}

	if (award.startsWith("michelin-")) {
		return `https://guide.michelin.com/gr/en/search?q=${restaurant.name}`;
	}

	return "";
}