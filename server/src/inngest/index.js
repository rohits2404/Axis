import { Inngest } from "inngest";
import { prisma } from "../db.js";

// Create Inngest client
export const inngest = new Inngest({ id: "project-management" });

/* =========================
   USER SYNC
========================= */

const syncUserCreation = inngest.createFunction(
    { id: "sync-user-from-clerk" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        const { data } = event;

        await prisma.user.upsert({
            where: { id: data.id },
            update: {
                email: data?.email_addresses?.[0]?.email_address ?? null,
                name: `${data?.first_name ?? ""} ${data?.last_name ?? ""}`.trim(),
                image: data?.image_url ?? null,
            },
            create: {
                id: data.id,
                email: data?.email_addresses?.[0]?.email_address ?? null,
                name: `${data?.first_name ?? ""} ${data?.last_name ?? ""}`.trim(),
                image: data?.image_url ?? null,
            },
        });
    }
);

const syncUserDeletion = inngest.createFunction(
    { id: "delete-user-from-clerk" },
    { event: "clerk/user.deleted" },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.deleteMany({
            where: { 
                id: data.id 
            },
        });
    }
);

const syncUserUpdation = inngest.createFunction(
    { id: "update-user-from-clerk" },
    { event: "clerk/user.updated" },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.upsert({
            where: { 
                id: data.id 
            },
            update: {
                email: data?.email_addresses?.[0]?.email_address ?? null,
                name: `${data?.first_name ?? ""} ${data?.last_name ?? ""}`.trim(),
                image: data?.image_url ?? null,
            },
            create: {
                id: data.id,
                email: data?.email_addresses?.[0]?.email_address ?? null,
                name: `${data?.first_name ?? ""} ${data?.last_name ?? ""}`.trim(),
                image: data?.image_url ?? null,
            },
        });
    }
);

/* =========================
   WORKSPACE SYNC
========================= */

const syncWorkspaceCreation = inngest.createFunction(
    { id: "sync-workspace-from-clerk" },
    { event: "clerk/organization.created" },
    async ({ event }) => {
        const { data } = event;
        // Create or update workspace
        await prisma.workspace.upsert({
            where: { id: data.id },
            update: {
                name: data.name,
                slug: data.slug,
                image_url: data.image_url ?? null,
            },
            create: {
                id: data.id,
                name: data.name,
                slug: data.slug,
                ownerId: data.created_by,
                image_url: data.image_url ?? null,
            },
        });
        // Ensure owner is added as ADMIN member
        await prisma.workspaceMember.upsert({
            where: {
                userId_workspaceId: {
                    userId: data.created_by,
                    workspaceId: data.id,
                },
            },
            update: {
                role: "ADMIN",
            },
            create: {
                userId: data.created_by,
                workspaceId: data.id,
                role: "ADMIN",
            },
        });
    }
);

const syncWorkspaceUpdation = inngest.createFunction(
    { id: "update-workspace-from-clerk" },
    { event: "clerk/organization.updated" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.upsert({
            where: { 
                id: data.id 
            },
            update: {
                name: data.name,
                slug: data.slug,
                image_url: data.image_url ?? null,
            },
            create: {
                id: data.id,
                name: data.name,
                slug: data.slug,
                ownerId: data.created_by ?? null,
                image_url: data.image_url ?? null,
            },
        });
    }
);

const syncWorkspaceDeletion = inngest.createFunction(
    { id: "delete-workspace-from-clerk" },
    { event: "clerk/organization.deleted" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.deleteMany({
            where: { 
                id: data.id 
            },
        });
    }
);

const syncWorkspaceMemberCreation = inngest.createFunction(
    { id: "sync-workspace-member-from-clerk" },
    { event: "clerk/organizationInvitation.accepted" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspaceMember.upsert({
            where: {
                userId_workspaceId: {
                    userId: data.user_id,
                    workspaceId: data.organization_id,
                },
            },
            update: {
                role: String(data.role_name).toUpperCase(),
            },
            create: {
                userId: data.user_id,
                workspaceId: data.organization_id,
                role: String(data.role_name).toUpperCase(),
            },
        });
    }
);

/* =========================
   EXPORT FUNCTIONS
========================= */

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    syncWorkspaceCreation,
    syncWorkspaceUpdation,
    syncWorkspaceDeletion,
    syncWorkspaceMemberCreation,
];