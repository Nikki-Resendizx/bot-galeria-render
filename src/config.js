module.exports = {
  WEBAPP_URL: "https://galeria-verifiedmodels.pages.dev",
  CANAL_OFICIAL: "http://t.me/VerifiedModels_VIP",
  ADMIN_IDS_ENV: (process.env.ADMIN_IDS||"").split(",").map(s=>s.trim()).filter(Boolean),
  DEFAULT_BOTONES: {
    bienvenida: {
      galeria_virtual: { text:"💖 VER GALERÍA VIRTUAL 💖", style:"primary", type:"webapp" },
      lista_modelos: { text:"👑 VER LISTA DE MODELOS 👑", style:"danger", type:"callback", data:"lista" },
      canal_oficial: { text:"💎 CANAL OFICIAL 💎", style:"success", type:"url", url:"http://t.me/VerifiedModels_VIP" }
    },
    galeria: {
      modelo_style_1:"primary", modelo_color_1:"🔵",
      modelo_style_2:"danger", modelo_color_2:"🔴",
      canal_oficial: { text:"💎 CANAL OFICIAL 💎", style:"success", url:"http://t.me/VerifiedModels_VIP" },
      galeria_virtual: { text:"💖 VER GALERÍA VIRTUAL 💖", style:"primary", type:"webapp" }
    },
    plantilla: {
      perfil_completo: { text:"💖 VER PERFIL COMPLETO 💖", style:"primary", type:"webapp" },
      bueno: { text:"👍🏻 Bueno", style:"success", type:"voto" },
      malo: { text:"👎🏻 Malo", style:"danger", type:"voto" },
      canal_free: { text:"CANAL FREE", style:"primary", type:"url" },
      contactame: { text:"CONTACTAME", style:"primary", type:"url" },
      volver: { text:"VOLVER", style:"danger", type:"callback", data:"lista" },
      inicio: { text:"INICIO", style:"danger", type:"callback", data:"inicio" }
    }
  }
};
