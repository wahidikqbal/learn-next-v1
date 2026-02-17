import Link from 'next/link';
import { Role } from '@prisma/client';
import { requireAdmin } from '@/lib/authz';
import { isPrimaryAdminEmail } from '@/lib/admin-config';
import { deleteAnyPageAction, deleteUserAction, setUserRoleAction } from './actions';
import { listAdminOverview } from '@/features/admin/services/admin.service';
import DeleteUserButton from './DeleteUserButton';
import RoleToggleButton from './RoleToggleButton';
import AppSidebar from '@/shared/ui/navigation/AppSidebar';
import DeletePageButton from '@/app/dashboard/DeletePageButton';
import { getRootDomain } from '@/shared/config/env';

export default async function AdminPage() {
    const session = await requireAdmin();
    const rootDomain = getRootDomain();
    const profileImage = session.user.image || '/default-avatar.svg';
    const profileName = session.user.name?.trim() || session.user.email?.split('@')[0] || 'User';

    const [users, pages] = await listAdminOverview();

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto flex min-h-screen w-full">
                <AppSidebar
                    active="admin"
                    user={{
                        name: profileName,
                        email: session.user.email ?? '',
                        image: profileImage,
                    }}
                    isAdmin
                    footerLink={{ href: '/dashboard', label: 'Dashboard' }}
                />

                <section className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                            <p className="text-sm text-gray-600">Kelola user dan halaman SaaS.</p>
                        </div>
                        <Link
                            href="/dashboard"
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                            User Panel
                        </Link>
                    </div>

                    <section className="mt-8 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                    <h2 className="text-lg font-semibold text-gray-900">Users</h2>
                    <div className="mt-4 space-y-3 md:hidden">
                        {users.map((user) => {
                            const isPrimaryAdmin = isPrimaryAdminEmail(user.email);

                            return (
                            <article key={user.id} className="rounded-lg border border-gray-200 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 break-all">
                                            {user.email ?? '-'}
                                        </p>
                                        <p className="text-xs text-gray-500">{user.name ?? '-'}</p>
                                    </div>
                                    <span
                                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                            user.role === Role.ADMIN
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'bg-slate-100 text-slate-700'
                                        }`}
                                    >
                                        {user.role}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-gray-600">Total page: {user._count.pages}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <RoleToggleButton
                                        action={setUserRoleAction}
                                        userId={user.id}
                                        currentRole={user.role}
                                        disabled={isPrimaryAdmin}
                                    />
                                    <DeleteUserButton
                                        action={deleteUserAction}
                                        userId={user.id}
                                        userEmail={user.email ?? '-'}
                                        disabled={
                                            user.id === session.user.id ||
                                            isPrimaryAdmin
                                        }
                                    />
                                </div>
                            </article>
                        )})}
                    </div>

                    <div className="mt-4 overflow-x-auto hidden md:block">
                        <table className="w-full min-w-[700px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-gray-600">
                                    <th className="py-2 pr-4">Email</th>
                                    <th className="py-2 pr-4">Nama</th>
                                    <th className="py-2 pr-4">Role</th>
                                    <th className="py-2 pr-4">Pages</th>
                                    <th className="py-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => {
                                    const isPrimaryAdmin = isPrimaryAdminEmail(user.email);

                                    return (
                                    <tr key={user.id} className="border-b border-gray-100">
                                        <td className="py-3 pr-4 text-gray-800">{user.email ?? '-'}</td>
                                        <td className="py-3 pr-4 text-gray-700">{user.name ?? '-'}</td>
                                        <td className="py-3 pr-4">
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                                    user.role === Role.ADMIN
                                                        ? 'bg-indigo-100 text-indigo-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4 text-gray-700">{user._count.pages}</td>
                                        <td className="py-3">
                                            <div className="flex gap-2">
                                                <RoleToggleButton
                                                    action={setUserRoleAction}
                                                    userId={user.id}
                                                    currentRole={user.role}
                                                    disabled={isPrimaryAdmin}
                                                />
                                                <DeleteUserButton
                                                    action={deleteUserAction}
                                                    userId={user.id}
                                                    userEmail={user.email ?? '-'}
                                                    disabled={
                                                        user.id === session.user.id ||
                                                        isPrimaryAdmin
                                                    }
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                    </section>

                    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                    <h2 className="text-lg font-semibold text-gray-900">Semua Halaman</h2>
                    <div className="mt-4 space-y-3 md:hidden">
                        {pages.map((page) => (
                            <article key={page.id} className="rounded-lg border border-gray-200 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{page.name}</p>
                                        <p className="text-xs text-gray-500 break-all">{page.owner.email ?? '-'}</p>
                                    </div>
                                    <span
                                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                            page.isPublished
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}
                                    >
                                        {page.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-gray-600 break-all">
                                    {page.subdomain}.{rootDomain}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Link
                                        href={`/edit/${page.id}`}
                                        className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Edit
                                    </Link>
                                    <DeletePageButton
                                        action={deleteAnyPageAction}
                                        pageId={page.id}
                                        pageName={page.name}
                                    />
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="mt-4 overflow-x-auto hidden md:block">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-gray-600">
                                    <th className="py-2 pr-4">Nama</th>
                                    <th className="py-2 pr-4">Owner</th>
                                    <th className="py-2 pr-4">Subdomain</th>
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pages.map((page) => (
                                    <tr key={page.id} className="border-b border-gray-100">
                                        <td className="py-3 pr-4 text-gray-900 font-medium">{page.name}</td>
                                        <td className="py-3 pr-4 text-gray-700">{page.owner.email ?? '-'}</td>
                                        <td className="py-3 pr-4 text-gray-700">{page.subdomain}.{rootDomain}</td>
                                        <td className="py-3 pr-4">
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                                    page.isPublished
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                {page.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/edit/${page.id}`}
                                                    className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    Edit
                                                </Link>
                                                <DeletePageButton
                                                    action={deleteAnyPageAction}
                                                    pageId={page.id}
                                                    pageName={page.name}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </section>
                </section>
            </div>
        </main>
    );
}
