# Migración a Telegram Serverless — Galería Verified Models

## Alcance confirmado
- Repositorio de trabajo: `Nikki-Resendizx/bot-galeria-render`.
- Rama aislada: `migration/tgcloud-serverless`.
- WebApp fuente verificada: `Nikki-Resendizx/Galeria-VerifiedModels`.
- Producción actual: `https://galeria-verifiedmodels.pages.dev/`.
- Repositorios fuente, despliegue Cloudflare Pages y Firebase permanecen intactos.

## Auditoría inicial
La WebApp actual usa Firebase Web SDK directamente en `index.html` y `admin.html`, con colecciones `modelos`, subcolecciones `votos` y `comentarios`, además de endpoints de Cloudflare Pages para notificaciones. El bot destino usa Firebase Admin para `modelos`, `plantillas`, `config`, votos y el índice de Telegram Storage. El registro de usuarios ya está fuera de Firebase, en Telegram Storage.

## Modelo inicial SQLite
`tgcloud/schema.js` incluye modelos, votos, comentarios, plantillas, admins, configuración e índice de archivos de Telegram. Se usa una tabla de votos con índice único por modelo/usuario para impedir votos duplicados.

## Endpoints iniciales
- `listModels`: lista perfiles activos.
- `getModel`: devuelve un perfil.
- `voteModel`: registra un voto validado con el usuario autenticado por Telegram.
- `getComments`: lista comentarios de un perfil.
- `addComment`: registra comentario con límite de longitud y usuario de Telegram validado.

## Pendiente antes de activar
1. Exportar una copia de solo lectura de Firestore (`modelos`, `plantillas`, `config` y subcolecciones `votos`/`comentarios`); conservar Firebase intacto.
2. Importar y conciliar IDs, perfiles, fotos, recuentos de votos y comentarios; verificar recuentos y muestras.
3. Cargar administradores autorizados en `admin_users` y reemplazar el login por contraseña embebida de la WebApp actual por verificación de rol con `ctx.initData.user`.
4. Portar el panel de administración, plantillas, almacenamiento y notificaciones del bot a endpoints/handlers Serverless.
5. Sustituir el acceso directo a Firestore en la copia nueva de la WebApp por `Telegram.WebApp.Serverless.call`; mantener la interfaz y los flujos actuales.
6. Probar lista, filtros, galería, votos únicos, comentarios, edición, borrado, notificaciones y deep links antes de cualquier despliegue de prueba.

## Regla de seguridad
No ejecutar `tgcloud push`, `tgcloud migrate`, cambios de BotFather ni despliegues externos hasta terminar pruebas y recibir autorización específica para esa etapa. No subir tokens, contraseñas ni claves Firebase al repositorio.
