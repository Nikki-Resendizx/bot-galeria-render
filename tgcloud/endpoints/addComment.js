import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { comments, models } from '../schema.js';

function makeId() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export default async function (input = {}, ctx) {
  const user = ctx.initData?.user;
  const userId = Number(user?.id);
  const modelId = String(input.modelId || '').trim();
  const body = String(input.text || '').trim();
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new EndpointError('No se pudo validar tu cuenta de Telegram.');
  if (!modelId || body.length < 2 || body.length > 500) throw new EndpointError('El comentario debe tener entre 2 y 500 caracteres.');
  const model = await db.select({ id: models.id }).from(models).where(eq(models.id, modelId)).get();
  if (!model) throw new EndpointError('Perfil no encontrado.');

  const row = {
    id: makeId(),
    modelId,
    telegramUserId: userId,
    username: user?.username ? `@${user.username}` : [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Anon',
    text: body,
    createdAt: new Date().toISOString(),
  };
  await db.insert(comments).values(row).run();
  return { ok: true, comment: { id: row.id, username: row.username, text: row.text, createdAt: row.createdAt } };
}
