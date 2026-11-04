import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';

/** Adapter de testes: executa as consultas reais do handler em SQLite em memória. */
export function createTestDatabase(){
  const sql=new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../../migrations/0001_cloud.sql',import.meta.url),'utf8'));
  const prepare=query=>({bind(...params){
    const statement=sql.prepare(query);
    return {
      first:async()=>statement.get(...params)||null,
      all:async()=>({results:statement.all(...params)}),
      run:async()=>statement.run(...params),
      _query:query,_params:params
    };
  }});
  const DB={prepare,async batch(statements){
    sql.exec('BEGIN');
    try{
      const results=statements.map(item=>{
        const statement=sql.prepare(item._query);
        return /RETURNING|^SELECT/i.test(item._query)
          ?{results:statement.all(...item._params)}
          :{results:[],meta:statement.run(...item._params)};
      });
      sql.exec('COMMIT');
      return results;
    }catch(error){sql.exec('ROLLBACK');throw error}
  }};
  return {DB,close:()=>sql.close()};
}
