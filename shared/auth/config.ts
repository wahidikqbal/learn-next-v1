import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { Role } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import { isPrimaryAdminEmail } from '@/lib/admin-config';

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'database',
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
                const isAdminEmail = isPrimaryAdminEmail(session.user.email);

                session.user.role = isAdminEmail ? Role.ADMIN : user.role;

                if (isAdminEmail && user.role !== Role.ADMIN) {
                    await prisma.user.update({
                        where: {
                            id: user.id,
                        },
                        data: {
                            role: Role.ADMIN,
                        },
                    });
                }
            }
            return session;
        },
        async signIn() {
            return true;
        },
    },
    pages: {
        signIn: '/login',
    },
});
