const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const root = path.resolve(__dirname,'..');

function load(file,mocks={}) {
  const module={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  new Function('require','module','exports',code)(name=>name.endsWith('.css')?{}:Object.hasOwn(mocks,name)?mocks[name]:require(name),module,module.exports);
  return module.exports;
}
const redirect=destination=>{throw new Error(`redirect:${destination}`);};

test('Anonymous root renders the approved landing; authenticated visitors go directly to reports',async()=>{
  let user=null;
  const page=load('app/page.tsx',{
    'next/navigation':{redirect},
    'next/font/local':()=>({variable:'local-font'}),
    'next/image':({alt,src})=>React.createElement('img',{alt,src}),
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user}})}})},
    '@/lib/supabase/config':{allowedEmailDomain:'chicagobrass.com',microsoftLoginEnabled:false},
    '@/components/LoginForm':{LoginForm:()=>React.createElement('form',{'aria-label':'Sign in'})},
  });
  const html=renderToStaticMarkup(await page.default({searchParams:Promise.resolve({error:'link'})}));
  assert.match(html,/<h1>Chicago Brass<\/h1>/);assert.match(html,/Finance workspace/);
  assert.match(html,/finance-landing-background\.png/);assert.match(html,/role="alert"/);
  assert.ok(!html.includes('brand-mark'));assert.ok(!html.includes('Create account'));
  user={id:'approved-user'};
  await assert.rejects(()=>page.default({searchParams:Promise.resolve({})}),/redirect:\/income-statement/);
});

test('Legacy login links preserve callback failures and resolve to the landing page',async()=>{
  const page=load('app/login/page.tsx',{'next/navigation':{redirect}});
  await assert.rejects(()=>page.default({searchParams:Promise.resolve({})}),/^Error: redirect:\/$/);
  await assert.rejects(()=>page.default({searchParams:Promise.resolve({error:'link'})}),/redirect:\/\?error=link/);
});

test('Landing stays public while report authorization and the app allowlist remain enforced',async()=>{
  let user=null,role=null,roleChecks=0;
  const response={cookies:{set(){}}};
  const middleware=load('middleware.ts',{
    '@supabase/ssr':{createServerClient:()=>({auth:{getUser:async()=>({data:{user}})},rpc:async()=>{roleChecks++;return{data:role,error:null};}})},
    'next/server':{NextResponse:{next:()=>response,redirect:url=>({destination:String(url)})}},
    '@/lib/supabase/config':{supabaseConfig:()=>({url:'https://example.invalid',key:'public-test-key'})},
  }).middleware;
  const request=pathname=>({nextUrl:{pathname,clone:()=>new URL('http://localhost:3010'+pathname)},cookies:{getAll:()=>[]}});
  assert.equal(await middleware(request('/')),response);
  assert.equal((await middleware(request('/general-ledger'))).destination,'http://localhost:3010/');
  assert.equal(roleChecks,0);
  user={id:'unapproved'};
  assert.equal((await middleware(request('/income-statement'))).destination,'http://localhost:3010/not-authorized');
  role='viewer';
  assert.equal(await middleware(request('/income-statement')),response);
  assert.equal(roleChecks,2);
});

test('Callback failures and signout return to the new landing instead of the old screen',async()=>{
  const destinations=[];
  const server={'next/server':{NextResponse:{redirect:(url,options)=>{destinations.push([String(url),options]);return String(url);}}},'@/lib/supabase/server':{createClient:async()=>({auth:{signOut:async()=>({error:null})}})}};
  await load('app/auth/callback/route.ts',server).GET({url:'http://localhost:3010/auth/callback'});
  await load('app/auth/signout/route.ts',server).POST({url:'http://localhost:3010/auth/signout'});
  assert.deepEqual(destinations,[['http://localhost:3010/?error=link',undefined],['http://localhost:3010/',{status:303}]]);
});

function find(element,predicate) {
  if (!element || typeof element!=='object') return undefined;
  if (predicate(element)) return element;
  return React.Children.toArray(element.props?.children).map(child=>find(child,predicate)).find(Boolean);
}
function formHarness(signIn,microsoftEnabled=false) {
  const state=[];let cursor=0;
  const hooks={...React,useState:initial=>{const index=cursor++;if(!(index in state))state[index]=initial;return[state[index],value=>{state[index]=value;}];}};
  const calls=[];
  const LoginForm=load('components/LoginForm.tsx',{
    react:hooks,
    '@/lib/supabase/client':{createClient:()=>({auth:{signInWithPassword:async data=>{calls.push(data);return signIn(data);},signInWithOAuth:signIn}})},
    './ReportIcons':{ReportIcon:()=>null},
  }).LoginForm;
  const render=()=>{cursor=0;return LoginForm({domain:'chicagobrass.com',microsoftEnabled});};
  const field=id=>find(render(),node=>node.props?.id===id);
  const submit=()=>find(render(),node=>node.type==='form').props.onSubmit({preventDefault(){}});
  return{render,field,submit,calls};
}

test('Sign-in retains autocomplete, rejects other domains and supports password visibility',async()=>{
  const h=formHarness(async()=>({error:null}));
  assert.equal(h.field('email').props.autoComplete,'username');
  assert.equal(h.field('password').props.autoComplete,'current-password');
  const toggle=find(h.render(),node=>node.props?.['aria-label']==='Show password');
  assert.equal(toggle.props.type,'button');toggle.props.onClick();
  assert.equal(h.field('password').props.type,'text');
  assert.equal(find(h.render(),node=>node.props?.['aria-label']==='Hide password').props['aria-pressed'],true);
  h.field('email').props.onChange({target:{value:'someone@example.com'}});
  await h.submit();assert.equal(h.calls.length,0);
  assert.match(find(h.render(),node=>node.props?.role==='alert').props.children,/Use your @chicagobrass.com/);
});

test('Successful sign-in normalizes email and redirects to reports',async()=>{
  const h=formHarness(async()=>({error:null}));
  const previous=global.window;let destination;
  global.window={location:{assign:url=>{destination=url;}}};
  try {
    h.field('email').props.onChange({target:{value:'  TEST@CHICAGOBRASS.COM '}});
    h.field('password').props.onChange({target:{value:'fixture-password'}});
    await h.submit();
    assert.deepEqual(h.calls,[{email:'test@chicagobrass.com',password:'fixture-password'}]);
    assert.equal(destination,'/income-statement');
  } finally {global.window=previous;}
});

test('Pending sign-in disables controls; credential and network errors allow another attempt',async()=>{
  let finish;
  const h=formHarness(()=>new Promise(resolve=>{finish=resolve;}));
  h.field('email').props.onChange({target:{value:'test@chicagobrass.com'}});
  const pending=h.submit();
  assert.equal(h.field('password').props.disabled,true);
  assert.equal(find(h.render(),node=>node.type==='form').props['aria-busy'],true);
  finish({error:new Error('private provider detail')});await pending;
  assert.equal(h.field('password').props.disabled,false);
  assert.match(find(h.render(),node=>node.props?.role==='alert').props.children,/Email or password is incorrect/);
  const offline=formHarness(async()=>{throw new Error('network unavailable');});
  offline.field('email').props.onChange({target:{value:'test@chicagobrass.com'}});
  await offline.submit();
  assert.equal(offline.field('password').props.disabled,false);
  assert.match(find(offline.render(),node=>node.props?.role==='alert').props.children,/couldn't connect/);
});

test('Microsoft sign-in remains optional and uses the existing callback path',async()=>{
  const previous=global.window;global.window={location:{origin:'http://localhost:3010'}};
  let request;
  try {
    const disabled=formHarness(async()=>({error:null}));
    assert.equal(find(disabled.render(),node=>node.props?.onClick && node.props.children==='Sign in with Microsoft'),undefined);
    const enabled=formHarness(async value=>{request=value;return{error:new Error('Microsoft unavailable')};},true);
    await find(enabled.render(),node=>node.props?.children==='Sign in with Microsoft').props.onClick();
    assert.equal(request.provider,'azure');assert.equal(request.options.redirectTo,'http://localhost:3010/auth/callback');
    assert.equal(enabled.field('email').props.disabled,false);
  } finally {global.window=previous;}
});
