const { isAdmin,slugify,escapeHtml }=require('../utils');
const { saveConfig,getPlantillas,savePlantilla,deletePlantilla,getBotMedia,saveBotMedia,saveTemplateMedia,getModelo,saveModelBotMedia }=require('../config/db');
const { publishPhotoToStorage }=require('../storage');

module.exports=bot=>{
  bot.command('bienvenida',async ctx=>{
    if(!await isAdmin(ctx.from.id))return;
    const t=ctx.message.text.replace(/^\/bienvenida\s*/,'').trim();
    if(!t)return ctx.reply('Uso: /bienvenida texto con {mencion} 💎');
    await saveConfig({bienvenida_texto:t});
    return ctx.reply('✅ Texto de bienvenida guardado.');
  });

  bot.command('plantilla',async ctx=>{
    if(!await isAdmin(ctx.from.id))return;
    const a=ctx.message.text.replace(/^\/plantilla\s*/,'').split('|');
    if(a.length<2)return ctx.reply('Uso: /plantilla nombre | texto con {perfil} {edad} {votosBueno}');
    const nombre=a.shift().trim(),texto=a.join('|').trim(),id=slugify(nombre);
    await savePlantilla(id,{nombre,texto});
    return ctx.reply('✅ Plantilla '+escapeHtml(nombre)+' guardada. ID: '+id,{parse_mode:'HTML'});
  });

  bot.command('delplantilla',async ctx=>{
    if(!await isAdmin(ctx.from.id))return;
    const id=ctx.message.text.replace(/^\/delplantilla\s*/,'').trim();
    if(!id)return ctx.reply('Uso: /delplantilla ID');
    await deletePlantilla(id);
    return ctx.reply('🗑️ Plantilla eliminada.');
  });

  bot.command('plantillas',async ctx=>{
    if(!await isAdmin(ctx.from.id))return;
    const p=await getPlantillas(),rows=Object.keys(p).map(id=>'• <code>'+id+'</code> — '+escapeHtml(p[id].nombre||id));
    return ctx.reply('💎 <b>PLANTILLAS</b>\n\n'+(rows.join('\n')||'Sin plantillas'),{parse_mode:'HTML'});
  });

  bot.command('foto_modelo',async ctx=>{
    if(!await isAdmin(ctx.from.id))return;
    const id=ctx.message.text.replace(/^\/foto_modelo\s*/i,'').trim();
    if(!id)return ctx.reply('Uso: /foto_modelo ID_MODELO\n\nDespués envía la foto.');
    const model=await getModelo(id);
    if(!model)return ctx.reply('❌ No encontré esa modelo en Firebase.');
    return ctx.reply('📸 Ahora envía la foto con caption <code>/foto_modelo '+escapeHtml(id)+'</code>,{parse_mode:'HTML'});
  });

  bot.on('photo',async(ctx,next)=>{
    if(!await isAdmin(ctx.from.id))return next();
    const p=ctx.message.photo?.at(-1),c=String(ctx.message.caption||'').trim();
    if(!p)return next();

    try{
      if(c==='/bienvenida'){
        const r=await publishPhotoToStorage(ctx.telegram,'bienvenida',p.file_id,'👋 BIENVENIDA');
        await saveBotMedia('bienvenida',r.fileId);
        return ctx.reply('✅ Bienvenida guardada en 📦 Telegram Storage.');
      }

      if(c==='/galeria'){
        const r=await publishPhotoToStorage(ctx.telegram,'galeria',p.file_id,'🖼️ GALERÍA');
        await saveBotMedia('galeria',r.fileId);
        return ctx.reply('✅ Galería guardada en 📦 Telegram Storage.');
      }

      const x=c.match(/^\/plantilla_foto\s+(.+)$/i);
      if(x){
        const id=slugify(x[1]),q=await getPlantillas();
        if(!q[id])return ctx.reply('❌ Plantilla inexistente.');
        const r=await publishPhotoToStorage(ctx.telegram,'plantillas',p.file_id,'📝 PLANTILLA: '+id);
        await saveTemplateMedia(id,r.fileId);
        return ctx.reply('✅ Foto de plantilla guardada en 📦 Telegram Storage.');
      }

      const y=c.match(/^\/foto_modelo\s+(.+)$/i);
      if(y){
        const id=y[1].trim();
        const model=await getModelo(id);
        if(!model)return ctx.reply('❌ Modelo inexistente en Firebase.');
        const r=await publishPhotoToStorage(ctx.telegram,'modelos',p.file_id,'💃 MODELO ID: '+id);
        await saveModelBotMedia(id,{file_id:r.fileId,message_id:r.message.message_id,message_thread_id:r.message.message_thread_id});
        return ctx.reply('✅ Foto del bot guardada para '+escapeHtml(model.perfil||model.username||id)+' en 📦 Telegram Storage.',{parse_mode:'HTML'});
      }
    }catch(e){
      console.error('Error guardando media:',e);
      return ctx.reply('❌ No pude guardar la foto. Revisa que los 6 temas estén vinculados y que el bot pueda enviar fotos al grupo.');
    }

    return next();
  });

  bot.command('media',async ctx=>{
    if(!await isAdmin(ctx.from.id))return;
    const m=await getBotMedia();
    return ctx.reply('📸 <b>MEDIA TELEGRAM</b>\n👋 Bienvenida: '+(m.bienvenida?'✅':'❌')+'\n🖼️ Galería: '+(m.galeria?'✅':'❌')+'\n\nEnvía:\n/bienvenida + foto\n/galeria + foto\n/foto_modelo ID + foto\n/plantilla_foto ID + foto',{parse_mode:'HTML'});
  });
};