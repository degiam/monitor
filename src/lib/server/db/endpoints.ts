import { db } from './index';
import { endpoints, type Endpoint, type NewEndpoint } from './schema';
import { eq, desc } from 'drizzle-orm';

export async function getAllEndpoints(): Promise<Endpoint[]> {
	return await db.select().from(endpoints).orderBy(desc(endpoints.createdAt));
}

export async function getEndpointById(id: string): Promise<Endpoint | undefined> {
	const results = await db.select().from(endpoints).where(eq(endpoints.id, id)).limit(1);
	return results[0];
}

export async function createEndpoint(data: {
	name: string;
	url: string;
	group?: string;
	interval?: number;
}): Promise<Endpoint> {
	const newEndpoint: NewEndpoint = {
		name: data.name,
		url: data.url,
		group: data.group ?? '',
		interval: data.interval || 60,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	const results = await db.insert(endpoints).values(newEndpoint).returning();
	return results[0];
}

export async function updateEndpoint(
	id: string,
	data: {
		name?: string;
		url?: string;
		group?: string;
		interval?: number;
		lastCheck?: string;
	}
): Promise<Endpoint | undefined> {
	const updateData: Partial<NewEndpoint> = {
		updatedAt: new Date().toISOString()
	};

	if (data.name !== undefined) updateData.name = data.name;
	if (data.url !== undefined) updateData.url = data.url;
	if (data.group !== undefined) updateData.group = data.group;
	if (data.interval !== undefined) updateData.interval = data.interval;
	if (data.lastCheck !== undefined) updateData.lastCheck = data.lastCheck;

	const results = await db
		.update(endpoints)
		.set(updateData)
		.where(eq(endpoints.id, id))
		.returning();

	return results[0];
}

export async function deleteEndpoint(id: string): Promise<boolean> {
	const results = await db.delete(endpoints).where(eq(endpoints.id, id)).returning();
	return results.length > 0;
}
