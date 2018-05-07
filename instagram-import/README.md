The code in this folder is used for importing our restaurant dish review photos from Instagram.

# Installation

The PHP code is based on https://github.com/vintagesucks/instagram-export
To use it, first run `composer install` to install all necessary packages (you may need to install Composer too).
Then, copy `config.sample.php`, edit it with your info and rename it to `config.php`.
Then, run `php export.php`. Your data will be in `export.json`.
You can override the number of restaurants to import by a command line argument, e.g. `php export.php 1`.

Running `node transform.js` will import that data in `restaurants.json`.

# After one or more restaurant visit(s)

1. Run `php export.php 1` (adjust the number accordingly). After that, all visits are in
2. Look in export.json to make sure the data looks ok.
3. Make sure gulp watch is running, then run `node transform.js` to import the new data in `restaurants.json`
4. If thumbnails are not generated, run `gulp thumbnails`
