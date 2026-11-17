import test from 'node:test';
import assert from 'node:assert/strict';
import {progressQuery,progressToggle,PROGRESS_PAGE_SIZE,PROGRESS_JOURNAL_PAGE_SIZE} from './query.ts';
const parse=value=>progressQuery(new URLSearchParams(value));
test('progress defaults to all activity and uses bounded rule/journal pages',()=>{
 assert.deepEqual(parse(''),{from:null,to:null,category:'',implementation:'',enabled:'all',page:1,rule:null,query:''});
 assert.equal(PROGRESS_PAGE_SIZE,50);assert.equal(PROGRESS_JOURNAL_PAGE_SIZE,25);
});
test('progress accepts actual catalog categories, literal searches and explicit ranges',()=>{
 const q=parse('category=invoice_entry&implementation=partial&enabled=disabled&from=2025-01-01&to=2026-11-18&page=2&rule=INV-12&q=%2520');
 assert.equal(q.category,'invoice_entry');assert.equal(q.rule,'INV-12');assert.equal(q.query,'%20');assert.equal(q.page,2);
 assert.equal(parse('category=all&implementation=all').category,'');assert.equal(parse('q='+encodeURIComponent('x'.repeat(250))).query.length,200);
});
test('invalid dates, pages, status filters and rule codes are rejected before SQL',()=>{
 for(const q of ['from=2026-02-30','from=0000-01-01','from=2026-11-18&to=2026-11-17','page=0','page=-1','page=1.2','page=10001','category=invoice','enabled=maybe','implementation=unknown','rule=PAY-01%27%3Bdelete'])assert.throws(()=>parse(q),RangeError,q);
});
test('toggle accepts only an explicit boolean and stable code, never arbitrary catalog fields',()=>{
 assert.deepEqual(progressToggle({ruleCode:'EXP-01',enabled:false}),{ruleCode:'EXP-01',enabled:false});
 for(const input of [null,[],{},'EXP-01',{ruleCode:'EXP-01',enabled:'false'},{ruleCode:'EXP-01',enabled:true,debit_label:'changed'},{ruleCode:"EXP-01';drop",enabled:true},{ruleCode:'x'.repeat(51),enabled:true}])assert.throws(()=>progressToggle(input),RangeError);
});
