// src/middlewares/premium.js - ESTABLE v14 para Firebase v10
const { db } = require('../firebase');
const { doc, getDoc } = require('firebase/firestore');

module.exports = async (ctx, next) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const ADMIN_IDS = [8719034760]; // <-- pon tu ID aquí
    if (ADMIN_IDS.includes(userId)) {
      ctx.isPremiumUser = true;
      return next();
    }

    const hasTelegramPremium = ctx.from?.is_premium === true;
    let hasCustomPremium = false;

    try {
      if (db) {
        const ref = doc(db, 'premium_users', String(userId));
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.expiresAt && data.expiresAt.toDate) {
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

    const text = (ctx.message?.text || ctx.callbackQuery?.data || '').toLowerCase();
    if (!ctx.isPremiumUser && (text.includes('galeria') || text.includes('ver_fotos') || text.includes('lista'))) {
      return ctx.reply('⭐ Esta función es solo para usuarios premium.\n\nUsa /premium para ver como obtenerlo.');
    }

    return next();
  } catch (err) {
    console.error('Premium error:', err);
    return next();
  }
};
