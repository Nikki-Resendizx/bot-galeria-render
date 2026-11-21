import { db } from 'sdk';
import { asc, eq } from 'sdk/db';
import { models } from '../schema.js';

export default async function (input = {}) {
  const rows = await db.select().from(models)
    .where(eq(models.active, true))
    .orderBy(asc(models.profile))
    .limit(Math.min(Math.max(Number(input.limit) || 200, 1), 500))
    .all();

  return rows.map(model => ({
    id: model.id,
    foto: model.photo || '',
    foto2: model.photo2 || '',
    foto3: model.photo3 || '',
    foto4: model.photo4 || '',
    perfil: model.profile,
    username: model.username || '',
    edad: model.age || '',
    nacionalidad: model.nationality || '',
    servicios: model.services || [],
    descripcion: model.description || '',
    canal_free: model.freeChannel || '',
    votosBueno: model.goodVotes || 0,
    votosMalo: model.badVotes || 0,
    createdAt: model.createdAt || null,
  }));
}
