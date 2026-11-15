import {readdirSync,readFileSync, mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {dirname,extname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const extensions=new Set(['.js','.css','.png','.webp','.mp3','.woff2','.txt']);
const folders=['animaciones','circuitos','clasificaciones','interfaz','juego','musica','objetos','personajes','sonidos','vehiculos','promocion/final'];
const signatures=/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----|\b(?:ghp_|github_pat_|sk-proj-|AKIA)[A-Za-z0-9_-]{18,}/;

export function preparePages(output=join(root,'dist-pages')){
  const folder=resolve(output);
  if(!folder.startsWith(resolve(root)+sep)||existsSync(folder))throw Error('El destino debe ser una carpeta nueva dentro del proyecto.');
  mkdirSync(folder,{recursive:true});
  const entries=[];
  function include(rel){
    if(rel==='personajes/arte/piter-laud.png')return;
    const source=join(root,rel);
    if(['.html','.js','.css','.txt',''].includes(extname(rel))&&signatures.test(readFileSync(source,'utf8')))
      throw Error('Posible credencial en '+rel);
    const target=join(folder,rel);
    mkdirSync(dirname(target),{recursive:true});
    copyFileSync(source,target);
    entries.push(rel);
  }
  function walk(rel){
    for(const child of readdirSync(join(root,rel),{withFileTypes:true})){
      if(child.name.startsWith('.'))continue;
      const name=rel+'/'+child.name;
      if(child.isDirectory())walk(name);
      else if(child.isFile()&&extensions.has(extname(name)))include(name);
    }
  }
  for(const file of ['index.html','CNAME','.nojekyll'])include(file);
  for(const directory of folders)walk(directory);
  return {folder,entries};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=preparePages(process.argv[2]);
  console.log(result.entries.length+' archivos publicados desde '+ result.folder);
}
