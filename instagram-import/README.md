The code in this folder is used for importing our restaurant dish review photos from Instagram.

The PHP code is based on https://github.com/vintagesucks/instagram-export
To use it, first run `composer install` to install all necessary packages (you may need to install Composer too).
Then, copy `config.sample.php`, edit it with your info and rename it to `config.php`.
Then, run `php export.php`. Your data will be in `export.json`.
Running `node transform.js` will import that data in `restaurants.json`.
