const { getConfig } = require('./cache');
const { ADMIN_IDS_ENV } = require('./config');
async function isAdmin(ctx){ let id=String(ctx.from?.id||""); if(ADMIN_IDS_ENV.includes(id)) return true; let c=await getConfig(); if(c.admins?.includes(id)) return true; if(ADMIN_IDS_ENV.length===0) return true; return false; }
function getMencion(ctx){ let n=(ctx.from.first_name||"").replace(/</g,'').replace(/>/g,''); return n? `<a href="tg://user?id=${ctx.from.id}">${n}</a>` : ""; }
function replaceVars(str,m={},ctx=null){
  if(!str) return ""; let total=(m.votosMalo||0)+(m.votosBueno||0); let pBueno=total?Math.round((m.votosBueno||0)/total*100):0; let pMalo=total?Math.round((m.votosMalo||0)/total*100):0;
  let Lista=m.servicios?.map(s=>`• ${s}`).join('\n')||'• -'; let mencion=ctx?getMencion(ctx):"{mencion}";
  return str.replaceAll('{mencion}',mencion).replaceAll('{perfil}',m.perfil||'').replaceAll('@{username}',m.username?`@${m.username}`:'').replaceAll('{username}',m.username||'').replaceAll('{edad}',String(m.edad||'')).replaceAll('{nacionalidad}',m.nacionalidad||'').replaceAll('{Lista_servicios}',Lista).replaceAll('{descripcion}',m.descripcion||'').replaceAll('{Votos}',String(total)).replaceAll('{porcentaje_buenos}%',`${pBueno}%`).replaceAll('{porcentaje_buenos}',String(pBueno)).replaceAll('{porcentaje_malos}%',`${pMalo}%`).replaceAll('{porcentaje_malos}',String(pMalo));
}
module.exports={ isAdmin, getMencion, replaceVars };
