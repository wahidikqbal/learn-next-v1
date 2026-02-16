import { prisma } from '@/shared/lib/prisma';
import type { Prisma } from '@prisma/client';

type CreatePageRecordInput = {
    name: string;
    templateId: string;
    subdomain: string;
    ownerId: string;
    blocks: Prisma.InputJsonValue;
    isPublished?: boolean;
};

type UpdatePageRecordInput = {
    pageId: string;
    data: Prisma.PageUpdateInput;
};

type SetPagePublishedInput = {
    pageId: string;
    isPublished: boolean;
};

export async function findPageById(pageId: string) {
    return prisma.page.findUnique({
        where: { id: pageId },
    });
}

export async function listPagesByOwner(ownerId: string) {
    return prisma.page.findMany({
        where: { ownerId },
        orderBy: { updatedAt: 'desc' },
    });
}

export async function createPageRecord(input: CreatePageRecordInput) {
    return prisma.page.create({
        data: {
            name: input.name,
            templateId: input.templateId,
            subdomain: input.subdomain,
            ownerId: input.ownerId,
            blocks: input.blocks,
            isPublished: input.isPublished ?? false,
        },
    });
}

export async function updatePageRecord(input: UpdatePageRecordInput) {
    return prisma.page.update({
        where: { id: input.pageId },
        data: input.data,
    });
}

export async function deletePageById(pageId: string) {
    return prisma.page.delete({
        where: { id: pageId },
    });
}

export async function setPagePublishedById(input: SetPagePublishedInput) {
    return prisma.page.update({
        where: { id: input.pageId },
        data: { isPublished: input.isPublished },
    });
}
