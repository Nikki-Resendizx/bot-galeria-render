# 🚀 Render / Deploy — GALERÍA VERIFIEDMODELS

Configuración de producción del bot Telegram.

## Flujo

GitHub → Render → Bot Telegram → Firebase + Telegram Store + WebApp.

## Render

- Runtime: Node.js
- Build: `npm ci`
- Start: `npm start`
- Health check: `/health`
- Readiness: `/ready`
- Auto deploy: por commit de la rama conectada

## Variables

Las variables secretas se configuran en Render y no se guardan en GitHub:

- `BOT_TOKEN`
- `ADMIN_IDS`
- `CANAL_FREE_URL`
- `STORAGE_GROUP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Variables públicas/configuración:

- `WEBAPP_URL`
- `CANAL_ID`
- `NODE_ENV`

## Comprobación

Después de un deploy:

1. Abrir `/health` y confirmar `ok: true`.
2. Abrir `/ready` y confirmar `bot: running`.
3. Revisar logs de Render.
4. Probar `/start`.
5. Probar `/admin`.
6. Probar lista de modelos, plantilla, botones y Storage.

Las fotografías del bot siguen usando referencias `file_id` de Telegram; Render no es almacenamiento de imágenes.
