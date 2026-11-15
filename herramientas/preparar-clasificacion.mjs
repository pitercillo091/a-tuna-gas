import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../',import.meta.url));
const modelFiles = [
  'personajes/catalogo.js','vehiculos/catalogo.js','circuitos/trazado.js','circuitos/lopera.js',
  'circuitos/arjona.js','circuitos/banos.js','circuitos/poblaciones.js','circuitos/ampliacion-1.1.js',
  'circuitos/catalogo.js','objetos/pista.js','juego/carrera.js','juego/repeticion.js'
];
const read = path => readFileSync(join(root,path),'utf8').trimEnd();

export function bundleRanking() {
  const game = ['globalThis.ATunaGas = {};',...modelFiles.map(read),'export default globalThis.ATunaGas;'].join('\n;\n');
  return [
    {name:'index.ts',content:read('servidor/supabase/index.ts')},
    {name:'ranking.mjs',content:read('servidor/supabase/ranking.mjs')},
    {name:'reglas-ranking.mjs',content:read('servidor/reglas-ranking.mjs')},
    {name:'motor.mjs',content:game}
  ];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const path = process.argv[2] && resolve(process.argv[2]);
  if (!path) throw Error('Indica la carpeta destino para la función de clasificación.');
  mkdirSync(path,{recursive:true});
  for (const file of bundleRanking()) writeFileSync(join(path,file.name),file.content + '\n');
}
