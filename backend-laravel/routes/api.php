<?php

use App\Http\Controllers\Api\Navbar\TenantNavbarController;
use App\Http\Controllers\Api\PublicSite\PublicSiteController;
use App\Http\Controllers\Api\SitePage\OwnerSiteController;
use App\Http\Controllers\Api\SitePage\PageController;
use App\Http\Controllers\Api\SitePage\TenantPageController;
use Illuminate\Support\Facades\Route;

Route::get('/public/site', [PublicSiteController::class, 'show']);
Route::get('/owners/{ownerUserId}/pages', [TenantPageController::class, 'indexByOwner']);
Route::post('/owners/{ownerUserId}/sites/bootstrap', [OwnerSiteController::class, 'bootstrap']);
Route::get('/tenants/{tenantId}/pages', [TenantPageController::class, 'index']);
Route::post('/tenants/{tenantId}/pages', [TenantPageController::class, 'store']);
Route::get('/tenants/{tenantId}/navbar', [TenantNavbarController::class, 'show']);
Route::put('/tenants/{tenantId}/navbar', [TenantNavbarController::class, 'saveDraft']);
Route::post('/tenants/{tenantId}/navbar/publish', [TenantNavbarController::class, 'publish']);
Route::get('/pages/{pageId}', [PageController::class, 'show']);
Route::patch('/pages/{pageId}', [PageController::class, 'update']);
Route::delete('/pages/{pageId}', [PageController::class, 'destroy']);
Route::put('/pages/{pageId}/draft', [PageController::class, 'saveDraft']);
Route::post('/pages/{pageId}/publish', [PageController::class, 'publish']);
Route::post('/pages/{pageId}/unpublish', [PageController::class, 'unpublish']);
