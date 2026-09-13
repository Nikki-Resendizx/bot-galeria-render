// Este archivo importa TODOS los módulos para que el bot los cargue
// Orden importa: primero middlewares, luego handlers

require('./start');
require('./galeria');
require('./fotos');
require('./text');
require('./admin');

console.log('✅ V14 Handlers cargados: start, galeria, fotos, text, admin + premium middleware');
