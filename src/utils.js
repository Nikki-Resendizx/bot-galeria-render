const { getConfig }=require('./cache');

const TEMPLATE_VARIABLES = Object.freeze([
  { key: 'mencion', label: 'Mención del usuario que abrió el perfil', example: '{mencion}' },
  { key: 'nombre', label: 'Nombre del usuario que abrió el perfil', example: '{nombre}' },
  { key: 'usuario', label: 'Usuario de Telegram con @ (alias de username)', example: '{usuario}' },
  { key: 'username', label: 'Username de Telegram sin @ (alias de usuario)', example: '{username}' },
  { key: 'nombre_completo', label: 'Nombre y apellido del usuario', example: '{nombre_completo}' },
  { key: 'perfil', label: 'Nombre/perfil de la modelo', example: '{perfil}' },
  { key: 'edad', label: 'Edad', example: '{edad}' },
  { key: 'nacionalidad', label: 'Nacionalidad', example: '{nacionalidad}' },
  { key: 'servicios', label: 'Servicios', example: '{servicios}' },
  { key: 'Lista_servicios', label: 'Servicios en lista para texto normal', example: '{Lista_servicios}' },
  { key: 'Lista_servicios_expandible', label: 'Servicios para bloque desplegable de Artículo (Rich Message)', example: '{Lista_servicios_expandible}' },
  { key: 'descripcion', label: 'Descripción', example: '{descripcion}' },
  { key: 'votosBueno', label: 'Votos positivos', example: '{votosBueno}' },
  { key: 'votosMalo', label: 'Votos negativos', example: '{votosMalo}' },
  { key: 'votos', label: 'Total de votos (alias)', example: '{votos}' },
  { key: 'total_votos', label: 'Total de votos', example: '{total_votos}' },
  { key: 'porcentajeBueno', label: 'Porcentaje positivo', example: '{porcentajeBueno}' },
  { key: 'porcentajeMalo', label: 'Porcentaje negativo', example: '{porcentajeMalo}' },
  { key: 'canalFree', label: 'Canal Free', example: '{canalFree}' },
  { key: 'contacto', label: 'Contacto', example: '{contacto}' }
]);

function templateVariablesHelp() {
  return TEMPLATE_VARIABLES.map(v => '<code>' + escapeHtml(v.example) + '</code> — ' + escapeHtml(v.label)).join('\n');
}

function envAdmins(){return String(process.env.ADMIN_IDS||process.env.ADMIN_ID||'').split(',').map(x=>x.trim()).filter(Boolean);}
async function isAdmin(id){const uid=String(typeof id==='object'?(id.from?.id||id.id||''):(id||''));if(envAdmins().includes(uid))return true;try{const c=await getConfig();return Array.isArray(c.admins)&&c.admins.map(String).includes(uid);}catch(e){return false;}}
function escapeHtml(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function formatearListaServicios(value, options={}){
  if(value===null||value===undefined) return '';
  let items=[];
  if(Array.isArray(value)) items=value;
  else {
    const raw=String(value).trim();
    if(!raw) return '';
    // Acepta JSON de arrays por compatibilidad con datos guardados.
    try {
      const parsed=JSON.parse(raw);
      if(Array.isArray(parsed)) items=parsed;
      else items=raw.split(/\r?\n|\s*[,;]\s*/);
    } catch(e) {
      items=raw.split(/\r?\n|\s*[,;]\s*/);
    }
  }
  const clean=[];
  const seen=new Set();
  for(const item of items){
    const text=String(item??'').replace(/^[-•▪◦*]+\s*/,'').trim();
    if(!text) continue;
    const key=text.toLocaleLowerCase();
    if(seen.has(key)) continue;
    seen.add(key);
    clean.push(text);
  }
  if(options.rich) { if(!clean.length) return ''; return '<ul>'+clean.map(item=>'<li>'+escapeHtml(item)+'</li>').join('')+'</ul>'; }
  return clean.map(item=>'• '+escapeHtml(item)).join('\n');
}

function replaceVars(text,ctx,model,options={}){
  model=model||{};
  const f=ctx?.from||{};
  const name=f.first_name||'bebé';
  const tgUsername=f.username ? String(f.username).replace(/^@/,'') : '';
  const displayUsername=tgUsername ? '@'+tgUsername : name;
  const full=[f.first_name,f.last_name].filter(Boolean).join(' ')||name;
  const total=Number(model.votosBueno||0)+Number(model.votosMalo||0);
  const vars={
    mencion:f.id?'<a href="tg://user?id='+f.id+'">'+escapeHtml(name)+'</a>':escapeHtml(name),
    nombre:escapeHtml(name),
    usuario:escapeHtml(displayUsername),
    username:escapeHtml(model.username ? String(model.username).replace(/^@/,'') : tgUsername),
    nombre_completo:escapeHtml(full),
    perfil:escapeHtml(model.perfil||''),
    edad:escapeHtml(model.edad??''),
    nacionalidad:escapeHtml(model.nacionalidad||''),
    servicios:escapeHtml(model.servicios||model.servicios_lista||model.Lista_servicios||''),
    servicios_lista:escapeHtml(model.servicios_lista||model.servicios||''),
    Lista_servicios:formatearListaServicios(model.Lista_servicios||model.servicios_lista||model.servicios||'',options),
    // Variable exclusiva para el bloque desplegable de un Artículo/Rich Message.
    // Devuelve una lista HTML válida para el renderizador Rich, sin alterar
    // el comportamiento de {Lista_servicios} fuera de ese bloque.
    Lista_servicios_expandible:formatearListaServicios(model.Lista_servicios||model.servicios_lista||model.servicios||'',{rich:true}),
    descripcion:escapeHtml(model.descripcion||''),
    canal_free:escapeHtml(model.canal_free||model.canalFree||''),
    canalFree:escapeHtml(model.canalFree||model.canal_free||''),
    contacto:escapeHtml(model.contacto||''),
    votosBueno:Number(model.votosBueno||0),
    votosMalo:Number(model.votosMalo||0),
    Votos:Number(model.votos||total),
    votos:total,
    total_votos:total,
    porcentaje_bueno:total?Math.round(Number(model.votosBueno||0)*100/total):0,
    porcentaje_malo:total?Math.round(Number(model.votosMalo||0)*100/total):0,
    porcentajeBueno:total?Math.round(Number(model.votosBueno||0)*100/total):0,
    porcentajeMalo:total?Math.round(Number(model.votosMalo||0)*100/total):0,
    porcentaje_buenos:total?Math.round(Number(model.votosBueno||0)*100/total):0,
    porcentaje_malos:total?Math.round(Number(model.votosMalo||0)*100/total):0
  };
  const sourceText = String(text||'');
  return sourceText.replace(/\{([a-zA-Z0-9_]+)\}/g,(match,k,offset)=>{
    if(!Object.prototype.hasOwnProperty.call(vars,k)) return match;
    return vars[k];
  });
}

function replaceVarsInRich(value,ctx,model,options={}){
  if(typeof value==='string') return replaceVars(value,ctx,model,options);
  if(Array.isArray(value)) return value.map(v=>replaceVarsInRich(v,ctx,model,options));
  if(value && typeof value==='object') {
    const out={};
    for(const [key,val] of Object.entries(value)) out[key]=replaceVarsInRich(val,ctx,model,options);
    return out;
  }
  return value;
}

function entityTag(entity, visible){
  const type=entity.type;
  const value=escapeHtml(visible);
  if(type==='bold') return ['<b>','</b>'];
  if(type==='italic') return ['<i>','</i>'];
  if(type==='underline') return ['<u>','</u>'];
  if(type==='strikethrough') return ['<s>','</s>'];
  if(type==='spoiler') return ['<tg-spoiler>','</tg-spoiler>'];
  if(type==='blockquote') return ['<blockquote>','</blockquote>'];
  if(type==='expandable_blockquote') return ['<blockquote expandable>','</blockquote>'];
  if(type==='code') return ['<code>','</code>'];
  if(type==='pre') {
    const lang=entity.language ? ' class="language-'+escapeHtml(String(entity.language).replace(/[^a-zA-Z0-9_+-]/g,''))+'"' : '';
    return ['<pre'+lang+'>','</pre>'];
  }
  if(type==='text_link' && entity.url) return ['<a href="'+escapeHtml(entity.url)+'">','</a>'];
  if(type==='text_mention' && entity.user?.id) return ['<a href="tg://user?id='+String(entity.user.id)+'">','</a>'];
  if(type==='custom_emoji' && entity.custom_emoji_id) {
    return ['<tg-emoji emoji-id="'+escapeHtml(entity.custom_emoji_id)+'">','</tg-emoji>'];
  }
  return ['', ''];
}

function textoConPremiumToHtml(text, entities = []) {
  const source=String(text||'');
  const list=(Array.isArray(entities)?entities:[])
    .filter(e=>Number.isFinite(Number(e.offset)) && Number.isFinite(Number(e.length)) && Number(e.length)>0)
    .map(e=>({...e,offset:Number(e.offset),length:Number(e.length)}))
    .filter(e=>e.offset>=0 && e.offset+e.length<=source.length)
    .sort((a,b)=>a.offset-b.offset || b.length-a.length);
  if(!list.length) return {html:escapeHtml(source),ids:[]};

  const starts=new Map(), ends=new Map();
  for(const e of list){
    const tag=entityTag(e,source.slice(e.offset,e.offset+e.length));
    if(!tag[0]&&!tag[1]) continue;
    if(!starts.has(e.offset)) starts.set(e.offset,[]);
    if(!ends.has(e.offset+e.length)) ends.set(e.offset+e.length,[]);
    starts.get(e.offset).push({e,tag});
    ends.get(e.offset+e.length).push({e,tag});
  }

  const points=new Set([0,source.length]);
  for(const e of list){points.add(e.offset);points.add(e.offset+e.length);}
  const ordered=[...points].sort((a,b)=>a-b);
  let html='';
  for(let i=0;i<ordered.length-1;i++){
    const pos=ordered[i], next=ordered[i+1];
    const close=ends.get(pos)||[];
    for(const item of close.sort((a,b)=>b.e.offset-a.e.offset || a.e.length-b.e.length)) html+=item.tag[1];
    const open=starts.get(pos)||[];
    for(const item of open.sort((a,b)=>b.e.length-a.e.length)) html+=item.tag[0];
    html+=escapeHtml(source.slice(pos,next));
  }
  const close=ends.get(source.length)||[];
  for(const item of close.sort((a,b)=>b.e.offset-a.e.offset || a.e.length-b.e.length)) html+=item.tag[1];

  return {
    html,
    ids:list.filter(e=>e.type==='custom_emoji'&&e.custom_emoji_id).map(e=>String(e.custom_emoji_id))
  };
}

function esRichMessage(text){
  return /<(?:h[1-6]|p|ul|ol|li|table|thead|tbody|tr|th|td|blockquote|details|summary|hr\/?|img\b|aside|footer|pre\b|tg-collage|tg-slideshow|tg-math-block|tg-document|tg-map|tg-button-row)\b/i.test(String(text||''));
}

function prepararRichMessage(text, format='HTML'){
  const source=String(text||'');
  if(format==='Markdown') return {markdown:source};
  return {html:source};
}

function detectarFormatoTelegram(text,entities=[]){
  if(Array.isArray(entities)&&entities.length) return 'entities';
  const s=String(text||'');
  if(/<(?:b|strong|i|em|u|s|strike|del|code|pre|a\b|tg-emoji\b|blockquote\b)[^>]*>/i.test(s)) return 'HTML';
  if(/\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\[[^\]]+\]\([^)]*\)/.test(s)) return 'MarkdownV2';
  return 'plain';
}

function prepararTextoTelegram(text,entities=[]){
  const source=String(text||''), formato=detectarFormatoTelegram(source,entities);
  if(formato==='entities') return {text:source,entities,parse_mode:undefined,formato};
  if(formato==='HTML') return {text:source,entities:undefined,parse_mode:'HTML',formato};
  if(formato==='MarkdownV2') return {text:source,entities:undefined,parse_mode:'MarkdownV2',formato};
  return {text:source,entities:undefined,parse_mode:undefined,formato};
}
function slugify(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60)||('plantilla_'+Date.now());}

module.exports={isAdmin,escapeHtml,replaceVars,replaceVarsInRich,formatearListaServicios,esRichMessage,prepararRichMessage,TEMPLATE_VARIABLES,templateVariablesHelp,textoConPremiumToHtml,detectarFormatoTelegram,prepararTextoTelegram,slugify};
