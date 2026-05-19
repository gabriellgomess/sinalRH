<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['app' => 'Radar Pessoas API', 'version' => '1.0.0']);
});
