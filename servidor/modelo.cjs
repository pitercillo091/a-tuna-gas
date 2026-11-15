globalThis.ATunaGas={};
for(const path of [
  'personajes/catalogo','vehiculos/catalogo','circuitos/trazado','circuitos/lopera','circuitos/arjona',
  'circuitos/banos','circuitos/poblaciones','circuitos/ampliacion-1.1','circuitos/catalogo',
  'objetos/pista','juego/carrera','juego/repeticion'
])require('../'+path+'.js');
module.exports=globalThis.ATunaGas;
