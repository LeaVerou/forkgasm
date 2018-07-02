<?php
set_time_limit(0);
date_default_timezone_set('UTC');

require __DIR__.'/vendor/autoload.php';
require __DIR__.'/config.php';

$debug = false;
$truncatedDebug = false;

$ig = new \InstagramAPI\Instagram($debug, $truncatedDebug);
try {
	$ig->login($username, $password);
} catch (\Exception $e) {
	echo 'Login error: ' . $e . "\n";
	exit(0);
}

$file = fopen('export.json', 'w');

$user = $ig->people->getInfoByName($exportedAccount)->getUser();
$mediaCount = $user->getMediaCount();
$cutoff = strtotime($cutoff);
$places_count = 0;

if ($argv[1]) {
	$places_cutoff = $argv[1];
}

function removeNulls(&$array) {
	foreach ($array as $key => $value) {
		if (is_array($value)) {
			$array[$key] = removeNulls($value);
		}

		if ($value === NULL) {
			unset($array[$key]);
		}
	}

	return $array;
}

try {
	$i = 0;
	$maxId = null;
	echo "Exporting items for user: $exportedAccount \n";
	fwrite($file, "[" . "\n");

	do {
		$response = $ig->timeline->getUserFeed($user->getPk(), $maxId);

		foreach ($response->getItems() as $item) {
			$item = json_decode(json_encode($item), true);
			$obj = array();
			$obj['date'] = $item['taken_at'];
			$obj['image'] = $item['image_versions2']['candidates'][0]['url'];
			$obj['caption'] = $item['caption']['text'];
			$obj['location'] = array_filter((array) $item['location']);
			$obj['instagram_url'] = 'https://www.instagram.com/p/' . $item['code'];

			unset($obj['location']['external_source']);

			if ($obj['location']['short_name'] === $obj['location']['name']) {
				unset($obj['location']['short_name']);
			}

			if ($last_place != $item['location']['pk']) {
				$places_count++;
			}

			if ($obj['date'] < $cutoff or ($places_cutoff and $places_count > $places_cutoff)) {
				break 2;
			}

			if ($item['media_type'] == 2) {
				$obj['type'] = "video";
			}

			$json = json_encode($obj, JSON_PRETTY_PRINT);

			if ($i > 0) {
				fwrite($file, ", " . "\n");
			}

			fwrite($file, $json);
			$i++;
			$last_place = $item['location']['pk'];
		}

		$maxId = $response->getNextMaxId();
		echo "Sleeping for 4s... Count: $i/$mediaCount items \n";
		sleep(4);
	} while ($maxId !== null);

	fwrite($file, "]" . "\n");
} catch (\Exception $e) {
	echo 'Something went wrong: '. $e ."\n";
	exit(0);
}

fclose($file);

echo "done :)" ."\n";
