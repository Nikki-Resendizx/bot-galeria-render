const { getConfig }=require('./cache');
function envAdmins(){return String(process.env.ADMIN_IDS||process.env.ADMIN_ID||'').split(',').map(x=>x.trim()).filter(Boolean);}
async function isAdmin(id){const uid=String(typeof id==='object'?(id.from?.id||id.id||''):(id||''));if(envAdmins().includes(uid))return true;try{const c=await getConfig();return Array.isArray(c.admins)&&c.admins.map(String).includes(uid);}catch(e){return false;}}
function escapeHtml(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function replaceVars(text,ctx,model){model=model||{};const f=ctx?.from||{},name=f.first_name||'bebé',username=f.username?'@'+f.username:name,full=[f.first_name,f.last_name].filter(Boolean).join(' ')||name,total=Number(model.votosBueno||0)+Number(model.votosMalo||0);const vars={mencion:f.id?'<a href="tg://user?id='+f.id+'">'+escapeHtml(name)+'</a>':escapeHtml(name),nombre:escapeHtml(name),usuario:escapeHtml(username),username:escapeHtml(model.username ? String(model.username).replace(/^@/,'') : username),nombre_completo:escapeHtml(full),perfil:escapeHtml(model.perfil||''),edad:escapeHtml(model.edad??''),nacionalidad:escapeHtml(model.nacionalidad||''),servicios:escapeHtml(model.servicios||''),servicios_lista:escapeHtml(model.servicios_lista||model.servicios||''),Lista_servicios:escapeHtml(model.Lista_servicios||model.servicios_lista||model.servicios||''),descripcion:escapeHtml(model.descripcion||''),canal_free:escapeHtml(model.canal_free||model.canalFree||''),canalFree:escapeHtml(model.canalFree||model.canal_free||''),contacto:escapeHtml(model.contacto||''),votosBueno:Number(model.votosBueno||0),votosMalo:Number(model.votosMalo||0),Votos:Number(model.votos||Number(model.votosBueno||0)+Number(model.votosMalo||0)),total_votos:total,votos:total,porcentaje_bueno:total?Math.round(Number(model.votosBueno||0)*100/total):0,porcentaje_malo:total?Math.round(Number(model.votosMalo||0)*100/total):0,porcentajeBueno:total?Math.round(Number(model.votosBueno||0)*100/total):0,porcentajeMalo:total?Math.round(Number(model.votosMalo||0)*100/total):0,porcentaje_buenos:total?Math.round(Number(model.votosBueno||0)*100/total):0,porcentaje_malos:total?Math.round(Number(model.votosMalo||0)*100/total):0};return String(text||'').replace(/\{([a-zA-Z0-9_]+)\}/g,(_,k)=>Object.prototype.hasOwnProperty.call(vars,k)?vars[k]:'{'+k+'}');}

function textoConPremiumToHtml(text, entities = []) {
  const source = String(text || '');
  const customs = (Array.isArray(entities) ? entities : []).filter(e => e.type === 'custom_emoji' && e.custom_emoji_id).map(e => ({ offset: Number(e.offset || 0), length: Number(e.length || 0), id: String(e.custom_emoji_id) })).sort((a,b) => a.offset-b.offset);
  if (!customs.length) return { html: escapeHtml(source), ids: [] };
  let html = '', cursor = 0;
  for (const e of customs) { if (e.offset < cursor || e.offset > source.length) continue; html += escapeHtml(source.slice(cursor,e.offset)); const visible=source.slice(e.offset,e.offset+e.length); html += '<tg-emoji emoji-id="'+escapeHtml(e.id)+'">'+escapeHtml(visible)+'</tg-emoji>'; cursor=e.offset+e.length; }
  html += escapeHtml(source.slice(cursor));
  return { html, ids: customs.map(e => e.id) };
}
function detectarFormatoTelegram(text, entities = []) {
  if (Array.isArray(entities) && entities.some(e => e.type === 'custom_emoji')) return 'entities';
  const s=String(text||'');
  if (/<(?:b|strong|i|em|u|s|strike|del|code|pre|a\\b|tg-emoji\\b)[^>]*>/i.test(s)) return 'HTML';
  if (/\\*\\*[^*]+\\*\\*|__[^_]+__|~~[^~]+~~|\\[[^\\]]+\\]\\([^)]*\\)/.test(s)) return 'MarkdownV2';
  return 'plain';
}
function prepararTextoTelegram(text, entities = []) {
  const source=String(text||''), formato=detectarFormatoTelegram(source,entities);
  if(formato==='entities') return {text:source,entities,parse_mode:undefined,formato};
  if(formato==='HTML') return {text:source,entities:undefined,parse_mode:'HTML',formato};
  if(formato==='MarkdownV2') return {text:source,entities:undefined,parse_mode:'MarkdownV2',formato};
  return {text:source,entities:undefined,parse_mode:undefined,formato};
}
function slugify(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60)||('plantilla_'+Date.now());}
module.exports={isAdmin,escapeHtml,replaceVars,textoConPremiumToHtml,detectarFormatoTelegram,prepararTextoTelegram,slugify};
