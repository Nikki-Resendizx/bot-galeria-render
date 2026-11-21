import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { models, modelVotes } from '../schema.js';

function makeId() {
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export default async function (input = {}, ctx) {
  const userId = Number(ctx.initData?.user?.id);
  const modelId = String(input.modelId || '').trim();
  const type = String(input.type || '').toLowerCase();
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new EndpointError('No se pudo validar tu cuenta de Telegram.');
  if (!modelId || !['bueno', 'malo'].includes(type)) throw new EndpointError('Voto no válido.');

  const model = await db.select().from(models).where(eq(models.id, modelId)).get();
  if (!model || model.active === false) throw new EndpointError('Modelo no encontrada.');

  const voteId = makeId();
  const inserted = await db.insert(modelVotes).values({
    id: voteId,
    modelId,
    telegramUserId: userId,
    type,
    createdAt: new Date().toISOString(),
  }).onConflictDoNothing().returning().run();

  if (!inserted.rows?.length) {
    return { registered: false, bueno: model.goodVotes || 0, malo: model.badVotes || 0 };
  }

  const nextGood = Number(model.goodVotes || 0) + (type === 'bueno' ? 1 : 0);
  const nextBad = Number(model.badVotes || 0) + (type === 'malo' ? 1 : 0);
  await db.update(models).set({ goodVotes: nextGood, badVotes: nextBad }).where(eq(models.id, modelId)).run();

  return { registered: true, bueno: nextGood, malo: nextBad };
}
