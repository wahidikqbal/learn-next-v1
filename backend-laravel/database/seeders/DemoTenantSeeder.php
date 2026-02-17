<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoTenantSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = DB::table('tenants')
            ->where('subdomain', 'demo')
            ->first();

        if (!$tenant) {
            $tenantId = (string) Str::uuid();

            DB::table('tenants')->insert([
                'id' => $tenantId,
                'owner_user_id' => 'demo-owner',
                'name' => 'Demo Tenant',
                'subdomain' => 'demo',
                'custom_domain' => null,
                'status' => 'published',
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $tenantId = (string) $tenant->id;
        }

        $this->ensurePageWithPublishedVersion(
            tenantId: $tenantId,
            slug: '/',
            title: 'Home',
            pageType: 'home',
            heading: 'Demo Tenant Home',
            subheading: 'Powered by Laravel public payload',
            seoTitle: 'Demo Tenant',
            seoDescription: 'Demo home page',
        );

        $this->ensurePageWithPublishedVersion(
            tenantId: $tenantId,
            slug: '/about',
            title: 'About',
            pageType: 'about',
            heading: 'About Demo Tenant',
            subheading: 'Halaman tentang dari payload Laravel.',
            seoTitle: 'About Demo Tenant',
            seoDescription: 'Demo about page',
        );

        $this->ensurePageWithPublishedVersion(
            tenantId: $tenantId,
            slug: '/contact',
            title: 'Contact',
            pageType: 'contact',
            heading: 'Contact Demo Tenant',
            subheading: 'Hubungi kami melalui halaman contact ini.',
            seoTitle: 'Contact Demo Tenant',
            seoDescription: 'Demo contact page',
        );

        $navbar = DB::table('navbar_configs')
            ->where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->first();

        if (!$navbar) {
            DB::table('navbar_configs')->insert([
                'id' => (string) Str::uuid(),
                'tenant_id' => $tenantId,
                'version_no' => 1,
                'status' => 'published',
                'items_json' => json_encode([
                    [
                        'id' => 'nav-home',
                        'label' => 'Home',
                        'type' => 'link',
                        'href' => '/',
                        'hidden' => false,
                    ],
                    [
                        'id' => 'nav-about',
                        'label' => 'About',
                        'type' => 'link',
                        'href' => '/about',
                        'hidden' => false,
                    ],
                    [
                        'id' => 'nav-contact',
                        'label' => 'Contact',
                        'type' => 'link',
                        'href' => '/contact',
                        'hidden' => false,
                    ],
                ]),
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function ensurePageWithPublishedVersion(
        string $tenantId,
        string $slug,
        string $title,
        string $pageType,
        string $heading,
        string $subheading,
        string $seoTitle,
        string $seoDescription,
    ): void {
        $page = DB::table('site_pages')
            ->where('tenant_id', $tenantId)
            ->where('slug', $slug)
            ->first();

        if (!$page) {
            $pageId = (string) Str::uuid();
            DB::table('site_pages')->insert([
                'id' => $pageId,
                'tenant_id' => $tenantId,
                'title' => $title,
                'slug' => $slug,
                'page_type' => $pageType,
                'layout_template' => 'default',
                'is_system' => true,
                'is_deleted' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $pageId = (string) $page->id;
        }

        $publishedVersion = DB::table('page_versions')
            ->where('page_id', $pageId)
            ->where('status', 'published')
            ->first();

        if (!$publishedVersion) {
            DB::table('page_versions')->insert([
                'id' => (string) Str::uuid(),
                'page_id' => $pageId,
                'version_no' => 1,
                'status' => 'published',
                'blocks_json' => json_encode([
                    'schemaVersion' => 1,
                    'blocks' => [
                        [
                            'id' => 'hero',
                            'type' => 'hero',
                            'props' => [
                                'heading' => $heading,
                                'subheading' => $subheading,
                                'align' => 'center',
                            ],
                        ],
                    ],
                ]),
                'seo_json' => json_encode([
                    'metaTitle' => $seoTitle,
                    'metaDescription' => $seoDescription,
                    'ogImage' => null,
                ]),
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
