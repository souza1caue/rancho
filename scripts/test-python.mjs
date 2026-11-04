import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const venv=join(root,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
const python=existsSync(venv)?venv:(process.env.PYTHON||'python');
const result=spawnSync(python,['-m','pytest','--junitxml=reports/pytest.xml',...process.argv.slice(2)],{cwd:root,stdio:'inherit'});
if(result.error){
  console.error('Não foi possível iniciar o Python. Instale Python 3.11+ e execute python -m pip install -r requirements-dev.txt.');
  process.exit(1);
}
process.exit(result.status??1);
