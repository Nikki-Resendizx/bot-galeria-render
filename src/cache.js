const { getConfig }=require('./config/db'); let value=null,time=0;
async function getCachedConfig(){if(value&&Date.now()-time<60000)return value;value=await getConfig();time=Date.now();return value;}
function clearCache(){value=null;time=0;} module.exports={getConfig:getCachedConfig,clearCache};