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

/*<?php
if($_POST){
    $file = 'coordinates.txt';
    $fileContents = file_get_contents('coordinates.txt');
    $save_data = [];
    if($fileContents){
        $save_data = json_decode($fileContents);
    }
    $find = false;
    foreach($save_data as $key => $poly){
        if($poly->id == $_POST['id']){
            $save_data[$key] = $_POST;
            $find = true;
            break;
        }
    }
    if(!$find){
        $save_data[] = $_POST;
    }
    file_put_contents ($file, json_encode($save_data), FILE_TEXT);

}


$fileContents = (file_get_contents('coordinates.txt'));

echo $fileContents;*/
