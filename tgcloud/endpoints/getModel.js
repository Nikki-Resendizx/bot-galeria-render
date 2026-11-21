import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { models } from '../schema.js';

export default async function (input = {}) {
  const id = String(input.id || '').trim();
  if (!id) throw new EndpointError('Falta el identificador del perfil.');
  const model = await db.select().from(models).where(eq(models.id, id)).get();
  if (!model || model.active === false) throw new EndpointError('Este perfil no está disponible.');

  return {
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
  };
}
