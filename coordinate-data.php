<?php
if($_POST){
    $file = 'coordinates.txt';
    $fileContents = file_get_contents('coordinates.txt');
    $save_data = [];
    if($fileContents){
        $save_data = json_decode($fileContents);
    }
    $save_data[] = $_POST;
    file_put_contents ($file, json_encode($save_data), FILE_TEXT);

}


$fileContents = (file_get_contents('coordinates.txt'));

echo $fileContents;

