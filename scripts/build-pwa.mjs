import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const files=[];
function walk(dir){for(const entry of readdirSync('dist'+dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())walk(path);else if(!['_headers','sw.js'].includes(entry.name))files.push(path)}}
walk('');
const hash=createHash('sha256');
for(const file of files.sort())hash.update(file).update(readFileSync('dist'+file));
const version=hash.digest('hex').slice(0,16);
const template=readFileSync('scripts/sw-template.js','utf8').replace('__CACHE_NAME__','rancho-shell-'+version).replace('__PRECACHE__',JSON.stringify(files));
writeFileSync('dist/sw.js',template);
console.log(`PWA: ${files.length} arquivos preparados para uso offline (${version}).`);
