import { table, integer, text, boolean, json, index, uniqueIndex } from 'sdk/db';

export const models = table('models', {
  id: text('id').primaryKey(),
  legacyId: text('legacy_id').unique(),
  photo: text('photo'),
  photo2: text('photo_2'),
  photo3: text('photo_3'),
  photo4: text('photo_4'),
  profile: text('profile').notNull(),
  username: text('username'),
  age: text('age'),
  nationality: text('nationality'),
  services: json('services'),
  description: text('description'),
  freeChannel: text('free_channel'),
  goodVotes: integer('good_votes').notNull().default(0),
  badVotes: integer('bad_votes').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (t) => ({
  profileIdx: index('idx_models_profile').on(t.profile),
  nationalityIdx: index('idx_models_nationality').on(t.nationality),
  activeIdx: index('idx_models_active').on(t.active),
}));

export const modelVotes = table('model_votes', {
  id: text('id').primaryKey(),
  modelId: text('model_id').notNull(),
  telegramUserId: integer('telegram_user_id').notNull(),
  type: text('type').notNull(),
  createdAt: text('created_at'),
}, (t) => ({
  uniqueVoter: uniqueIndex('uidx_model_votes_user').on(t.modelId, t.telegramUserId),
  modelIdx: index('idx_model_votes_model').on(t.modelId),
}));

export const comments = table('comments', {
  id: text('id').primaryKey(),
  modelId: text('model_id').notNull(),
  telegramUserId: integer('telegram_user_id').notNull(),
  username: text('username'),
  text: text('text').notNull(),
  createdAt: text('created_at'),
}, (t) => ({
  modelIdx: index('idx_comments_model').on(t.modelId),
  dateIdx: index('idx_comments_created').on(t.createdAt),
}));

export const templates = table('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  body: text('body'),
  mediaFileId: text('media_file_id'),
  updatedAt: text('updated_at'),
});

export const adminUsers = table('admin_users', {
  telegramId: integer('telegram_id').primaryKey(),
  role: text('role').notNull().default('admin'),
  active: boolean('active').notNull().default(true),
  createdAt: text('created_at'),
});

export const settings = table('settings', {
  key: text('key').primaryKey(),
  value: json('value'),
  updatedAt: text('updated_at'),
});

export const storageIndex = table('storage_index', {
  key: text('key').primaryKey(),
  value: json('value'),
  updatedAt: text('updated_at'),
});
