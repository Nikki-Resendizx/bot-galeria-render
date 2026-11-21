import { db, EndpointError } from 'sdk';
import { desc, eq } from 'sdk/db';
import { comments, models } from '../schema.js';

export default async function (input = {}, ctx) {
  const modelId = String(input.modelId || '').trim();
  if (!modelId) throw new EndpointError('Falta el perfil.');
  const model = await db.select({ id: models.id }).from(models).where(eq(models.id, modelId)).get();
  if (!model) throw new EndpointError('Perfil no encontrado.');
  const rows = await db.select().from(comments)
    .where(eq(comments.modelId, modelId))
    .orderBy(desc(comments.createdAt))
    .limit(100)
    .all();
  return rows.map(row => ({
    id: row.id,
    username: 'Anon',
    text: row.text,
    createdAt: row.createdAt,
    mine: Number(row.telegramUserId) === Number(ctx.initData?.user?.id),
  }));
}
