const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(__dirname + '/config.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
function config(env) { const exports={}; vm.runInNewContext(source,{exports,process:{env}}); return exports; }
test('localhost cannot silently fall back to the production database',()=>{
 assert.throws(()=>config({NODE_ENV:'development'}).supabaseConfig(),/develop Supabase branch/);
 const c=config({NODE_ENV:'development',NEXT_PUBLIC_SUPABASE_URL:'https://develop.example',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'public-develop'}).supabaseConfig();
 assert.equal(c.url,'https://develop.example'); assert.equal(c.key,'public-develop');
});
test('production keeps its existing public configuration and supports explicit overrides',()=>{
 assert.equal(config({NODE_ENV:'production'}).supabaseConfig().url,'https://inzobaubbikyiekcfarj.supabase.co');
 assert.equal(config({NODE_ENV:'production',NEXT_PUBLIC_SUPABASE_URL:'https://explicit.example',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'explicit'}).supabaseConfig().key,'explicit');
});
