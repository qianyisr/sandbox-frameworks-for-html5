<?php
//header('Cache-Control: no-cache, must-revalidate');
//header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Content-type: application/json');

$start = isset($_GET['start']) ? (int)$_GET['start'] : 0;
$count = isset($_GET['count']) ? min((int)$_GET['count'], 2000) : 100;


$data = array();
for ( $i = $start; $i < 99; $i++ ) {
	$pos = $i*250;
	$pos1 = ($i+1)*250;
	$data[] = '<div class="img" style="/*background: url(http://lorempixel.com/300/200/?id='.rand(1,9).')*/"><p>index: '.$i.'</p><p>top: '.$pos.'</p><p>top: '.$pos1.'</p></div>';
}

echo json_encode($data);
