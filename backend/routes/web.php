<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['app' => 'Sinal RH API', 'version' => '1.0.0']);
});
