const { getButtonConfig } = require('./config/db');

const DEFAULTS={
  webapp:{text:'💎 Galería Virtual 💎',style:'primary'},
  modelos:{text:'👑 Lista de Modelos 👑',style:'primary'},
  canal_free:{text:'📢 Canal FREE 📢',style:'primary'},
  bueno:{text:'🟢 BUENO',style:'success'},
  malo:{text:'🔴 MALO',style:'danger'},
  contacto:{text:'📞 CONTACTO',style:'primary'}
};

async function button(key,extra={}){
  const all=await getButtonConfig();
  const c=Object.assign({},DEFAULTS[key]||{text:key,style:'primary'},all[key]||{},extra);
  const out={text:c.text,style:['primary','success','danger'].includes(c.style)?c.style:'primary',...extra};
  if(c.icon_custom_emoji_id)out.icon_custom_emoji_id=String(c.icon_custom_emoji_id);
  return out;
}
async function urlButton(key,url){ return button(key,{url}); }
async function webAppButton(key,url){ return button(key,{web_app:{url}}); }
module.exports={button,urlButton,webAppButton,DEFAULTS};