import test from 'node:test';
import assert from 'node:assert/strict';
import {inDatabaseRegion} from './database-region.ts';

const environment={projectUrl:'https://finance.example',executionRegion:'ap-northeast-2',webhookSecret:'test-secret'};
const body={runKey:'same-key',dryRun:false,source:{tableId:'table',recordId:'record'}};
const request=(headers={})=>new Request('https://untrusted.example/ledger-daily?forceFunctionRegion=ap-northeast-2',{method:'POST',headers:{'Content-Type':'application/json','x-ledger-secret':'test-secret',...headers},body:JSON.stringify(body)});

test('authenticated ledger requests forward once to the trusted project in the database region, preserving the full request and response',async()=>{
  for(const name of ['ledger-daily','ledger-payment','ledger-reversal']){
    let forwarded=0;
    const response=await inDatabaseRegion(request(),name,environment,()=>assert.fail('No local execution'),async(url,options)=>{
      forwarded++;assert.equal(url.origin,environment.projectUrl);assert.equal(url.pathname,'/functions/v1/'+name);assert.equal(url.searchParams.get('forceFunctionRegion'),'us-west-2');
      const received=new Request(url,options);assert.equal(received.headers.get('x-region'),'us-west-2');assert.equal(received.headers.get('x-ledger-secret'),'test-secret');assert.deepEqual(await received.json(),body);
      assert.equal(options.redirect,'error');return Response.json({busy:true,runKey:body.runKey},{status:409,headers:{'Cache-Control':'no-store'}});
    });
    assert.equal(forwarded,1);assert.equal(response.status,409);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.deepEqual(await response.json(),{busy:true,runKey:'same-key'});
  }
});

test('local execution, unauthorized and non-POST requests keep the existing handler validation',async()=>{
  for(const [req,env] of [[request(),{...environment,executionRegion:'us-west-2'}],[request(),{...environment,executionRegion:''}],[request({'x-ledger-secret':'wrong'}),environment],[request(),{...environment,webhookSecret:''}],[new Request('https://finance.example'),environment]]){
    let called=0;const response=await inDatabaseRegion(req,'ledger-daily',env,async received=>{called++;assert.equal(received,req);return new Response('handled');},()=>assert.fail('Must not forward'));
    assert.equal(called,1);assert.equal(await response.text(),'handled');
  }
});

test('lost regional response never automatically retries a possibly completed write',async()=>{
  let calls=0;const response=await inDatabaseRegion(request(),'ledger-daily',environment,()=>assert.fail(),async()=>{calls++;throw Error('network');});
  assert.equal(calls,1);assert.equal(response.status,503);assert.match((await response.json()).error,/same request and runKey/);
});

test('a gateway region mismatch fails without a forwarding loop',async()=>{
  const response=await inDatabaseRegion(request({'x-region':'us-west-2'}),'ledger-daily',environment,()=>assert.fail(),()=>assert.fail('Loop'));
  assert.equal(response.status,503);
});
