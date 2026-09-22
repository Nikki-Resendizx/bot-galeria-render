// src/middlewares/premium.js - VERSION ESTABLE PARA RENDER
const { getFirestore } = require('../firebase');

module.exports = async (ctx, next) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const ADMIN_IDS = [8719034760]; // <-- CAMBIA ESTO por tu ID de Telegram
    if (ADMIN_IDS.includes(userId)) {
      ctx.isPremiumUser = true;
      return next();
    }

    const hasTelegramPremium = ctx.from?.is_premium === true;

    let hasCustomPremium = false;
    try {
      const db = getFirestore();
      if (db) {
        const doc = await db.collection('premium_users').doc(String(userId)).get();
        if (doc.exists) {
          const data = doc.data();
          if (data.expiresAt) {
            hasCustomPremium = data.expiresAt.toDate() > new Date();
          } else {
            hasCustomPremium = data.active!== false;
          }
        }
      }
    } catch (e) {
      console.log('Firestore premium skip:', e.message);
    }

    ctx.isPremiumUser = hasTelegramPremium || hasCustomPremium;

    const text = ctx.message?.text || ctx.callbackQuery?.data || '';
    if (!ctx.isPremiumUser && (text.includes('galeria') || text.includes('ver_fotos'))) {
      return ctx.reply('⭐ Esta funcion es solo para usuarios premium.\n\nUsa /premium para ver como obtenerlo.');
    }

    return next();
  } catch (err) {
    console.error('Premium error:', err);
    return next();
  }
};
