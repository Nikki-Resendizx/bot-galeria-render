const { Markup }=require('telegraf');
const { isAdmin,escapeHtml }=require('../utils');
const { getPlantillas,getModelos,getBotMedia,getUsers,getConfig,getStorage }=require('../config/db');

const panelKeyboard=()=>Markup.inlineKeyboard([
  [Markup.button.callback('👋 BIENVENIDA','adm_bienvenida'),Markup.button.callback('🖼️ GALERÍA','adm_galeria')],
  [Markup.button.callback('💃 MODELOS','adm_modelos'),Markup.button.callback('📝 PLANTILLAS','adm_plantillas')],
  [Markup.button.callback('👥 USUARIOS','adm_usuarios'),Markup.button.callback('👑 ADMINS','adm_admins')],
  [Markup.button.callback('🔘 BOTONES','adm_botones'),Markup.button.callback('📊 ESTADÍSTICAS','adm_stats')],
  [Markup.button.callback('📦 STORAGE TELEGRAM','adm_storage')],
  [Markup.button.callback('🔄 RECARGAR','adm_reload')]
]);

async function showPanel(ctx, edit=false){
  const [p,m,media,users,storage]=await Promise.all([getPlantillas(),getModelos(),getBotMedia(),getUsers(),getStorage()]);
  const linked=Object.keys(storage.topics||{}).length;
  const text='👑 <b>PANEL DE ADMIN VERIFIEDMODELS</b> 👑\n\n'+
    '👋 Bienvenida: '+(media.bienvenida?'✅':'❌')+'\n'+
    '🖼️ Galería: '+(media.galeria?'✅':'❌')+'\n'+
    '💃 Modelos en Firebase: <b>'+m.length+'</b>\n'+
    '📝 Plantillas: <b>'+Object.keys(p).length+'</b>\n'+
    '👥 Usuarios: <b>'+users.length+'</b>\n'+
    '📦 Temas Storage vinculados: <b>'+linked+'/6</b>\n\n'+
    '☁️ Firebase → información de modelos\n'+
    '📸 Telegram → fotografías del bot\n\n'+
    '<i>Selecciona una sección:</i>';
  if(edit){
    try{return await ctx.editMessageText(text,{parse_mode:'HTML',...panelKeyboard()});}catch(e){}
  }
  return ctx.reply(text,{parse_mode:'HTML',...panelKeyboard()});
}

module.exports=bot=>{
  bot.command('admin',async ctx=>{if(!await isAdmin(ctx.from.id))return;return showPanel(ctx);});

  bot.action(/^adm_(?!reload$).+/,async ctx=>{
    if(!await isAdmin(ctx.from.id))return ctx.answerCbQuery('Sin permiso');
    await ctx.answerCbQuery();
    const a=ctx.callbackQuery.data;

    if(a==='adm_bienvenida'){
      return ctx.reply('👋 <b>BIENVENIDA</b>\n\n📝 Texto: /bienvenida TU TEXTO\n📸 Foto: envía una foto con caption /bienvenida\n\nVariables disponibles: {mencion}, {nombre}, {usuario}, {username}, {nombre_completo}',{parse_mode:'HTML'});
    }
    if(a==='adm_galeria'){
      return ctx.reply('🖼️ <b>GALERÍA</b>\n\n📸 Envía una foto con caption /galeria\n🌐 La galería WebApp sigue usando '+escapeHtml(process.env.WEBAPP_URL||'la URL configurada')+'.',{parse_mode:'HTML'});
    }
    if(a==='adm_modelos'){
      const m=await getModelos();
      const rows=m.slice(0,50).map(x=>'• <code>'+escapeHtml(x.id)+'</code> — '+escapeHtml(x.perfil||x.username||x.id)+' | 👍 '+Number(x.votosBueno||0)+' 👎 '+Number(x.votosMalo||0));
      return ctx.reply('💃 <b>MODELOS</b>\n\n'+(rows.join('\n')||'Sin modelos')+'\n\n📸 Para guardar una foto del BOT:\n<code>/foto_modelo ID</code> y después envía la foto.',{parse_mode:'HTML'});
    }
    if(a==='adm_plantillas'){
      const p=await getPlantillas();
      const rows=Object.keys(p).map(id=>'• <code>'+escapeHtml(id)+'</code> — '+escapeHtml(p[id].nombre||id));
      return ctx.reply('📝 <b>PLANTILLAS</b>\n\n'+(rows.join('\n')||'Sin plantillas')+'\n\n➕ Crear: /plantilla nombre | texto\n📸 Foto: /plantilla_foto ID + foto',{parse_mode:'HTML'});
    }
    if(a==='adm_usuarios'){
      const u=await getUsers();
      const rows=u.slice(0,50).map(x=>'• <code>'+escapeHtml(x.id)+'</code> — '+escapeHtml(x.username?'@'+x.username:(x.first_name||'Sin nombre'))+(x.baneado?' 🔴 BANEADO':' 🟢'));
      return ctx.reply('👥 <b>USUARIOS</b>\n\n'+(rows.join('\n')||'Sin usuarios')+'\n\nEsta vista muestra los usuarios registrados por /start.',{parse_mode:'HTML'});
    }
    if(a==='adm_admins'){
      const c=await getConfig();
      const admins=Array.isArray(c.admins)?c.admins.map(String):[];
      const env=String(process.env.ADMIN_IDS||process.env.ADMIN_ID||'').split(',').map(x=>x.trim()).filter(Boolean);
      const all=[...new Set([...env,...admins])];
      return ctx.reply('👑 <b>ADMINS</b>\n\n'+(all.map(id=>'• <code>'+id+'</code>').join('\n')||'No hay admins configurados')+'\n\nPara agregar administradores usaremos la configuración segura del bot.',{parse_mode:'HTML'});
    }
    if(a==='adm_botones'){
      return ctx.reply('🔘 <b>BOTONES</b>\n\nLa configuración de textos/enlaces de botones se mantendrá en Firebase.\n\n⚠️ Telegram no permite cambiar libremente el color real de un botón inline; sí podemos cambiar texto, emoji, enlace y disposición.',{parse_mode:'HTML'});
    }
    if(a==='adm_stats'){
      const [m,u]=await Promise.all([getModelos(),getUsers()]);
      const bueno=m.reduce((n,x)=>n+Number(x.votosBueno||0),0);
      const malo=m.reduce((n,x)=>n+Number(x.votosMalo||0),0);
      return ctx.reply('📊 <b>ESTADÍSTICAS</b>\n\n👥 Usuarios: '+u.length+'\n💃 Modelos: '+m.length+'\n👍 Votos buenos: '+bueno+'\n👎 Votos malos: '+malo+'\n🗳️ Total votos: '+(bueno+malo),{parse_mode:'HTML'});
    }
    if(a==='adm_storage'){
      const s=await getStorage();
      const keys=['bienvenida','galeria','modelos','plantillas','botones','otros'];
      return ctx.reply('📦 <b>STORAGE TELEGRAM</b>\n\nGrupo: '+escapeHtml(String(s.group_id||'❌ no vinculado'))+'\n\n'+keys.map(k=>'• '+k+': '+(s.topics?.[k]?.message_thread_id?'✅':'❌')).join('\n')+'\n\nCada foto del bot se publica en su tema y se conserva mediante file_id.',{parse_mode:'HTML'});
    }
    return showPanel(ctx);
  });

  bot.action('adm_reload',async ctx=>{
    if(!await isAdmin(ctx.from.id))return ctx.answerCbQuery('Sin permiso');
    await ctx.answerCbQuery('Configuración recargada');
    return showPanel(ctx,true);
  });
};