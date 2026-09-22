// src/middlewares/premium.js - FIX DEFINITIVO

const { getFirestore } = require('../firebase');
const { isAdmin } = require('../utils');

module.exports = async (ctx, next) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) return next();

    // 1. Admin siempre pasa
    if (isAdmin(userId)) {
      ctx.isPremiumUser = true;
      return next();
    }

    // 2. Checar premium de Telegram nativo
    const hasTelegramPremium = ctx.from?.is_premium === true;

    // 3. Checar tu BD de premium (Firestore)
    let hasCustomPremium = false;
    try {
      const db = getFirestore();
      const doc = await db.collection('premium_users').doc(String(userId)).get();
      if (doc.exists) {
        const data = doc.data();
        // Si tiene fecha de expiración, valida
        if (data.expiresAt) {
          hasCustomPremium = data.expiresAt.toDate() > new Date();
        } else {
          hasCustomPremium = true;
        }
      }
    } catch (e) {
      console.log('Error leyendo premium_users:', e.message);
    }

    // 4. Si tiene cualquiera de los 2, pasa
    if (hasTelegramPremium || hasCustomPremium) {
      ctx.isPremiumUser = true;
      return next();
    }

    // Si no es premium, lo marcamos pero DEJAMOS PASAR a start
    // para que no se rompa el bot
    ctx.isPremiumUser = false;
    
    // Solo bloquea galería/fotos, no el /start
    const text = ctx.message?.text || ctx.callbackQuery?.data || '';
    if (text.includes('galeria') || text.includes('fotos')) {
      return ctx.reply('⭐ Esta función es solo para usuarios premium.\n\nUsa /premium para ver cómo obtenerlo.');
    }

    return next();

  } catch (err) {
    console.error('Error en premium middleware:', err);
    return next(); // nunca rompas el bot por premium
  }
};
