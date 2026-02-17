<?php

use App\Http\Controllers\Api\PublicSite\PublicSiteController;
use Illuminate\Support\Facades\Route;

Route::get('/public/site', [PublicSiteController::class, 'show']);

