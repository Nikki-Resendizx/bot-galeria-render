# VerifiedModels Bot — Firebase

El bot usa Firebase Admin SDK para sincronizar datos de modelos y votos. Las fotos propias del bot se almacenan en Telegram como file_id.

## Variables de Render

Configura BOT_TOKEN, ADMIN_ID o ADMIN_IDS, WEBAPP_URL, CANAL_FREE_URL (opcional), FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.

La cuenta de servicio se obtiene desde Firebase Console > Project settings > Service accounts. No subas el JSON de la cuenta de servicio a GitHub.

## Variables de plantillas

{mencion}
{nombre}
{usuario}
{username}
{nombre_completo}
{perfil}
{edad}
{nacionalidad}
{servicios}
{descripcion}
{canal_free}
{votosBueno}
{votosMalo}
{total_votos}
{porcentaje_bueno}

## Fotos Telegram

Foto con caption /bienvenida = foto de bienvenida.
Foto con caption /galeria = foto de galería.
Foto con caption /plantilla_foto ID = foto de esa plantilla.

## Plantillas

Crear: /plantilla nombre | texto con {perfil} {edad} {votosBueno}
Enviar: /enviarplantilla plantilla_id | modelo_id
Listar: /plantillas

Las fotos de Telegram no se descargan ni se guardan en Firebase Storage.
