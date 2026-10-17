import test from 'node:test';import assert from 'node:assert/strict';import {sampleCase,blankCase,questions,answerPrepared,prepareAnswer,syncAnswers} from '../dist/core.js';
test('questions use entered recommendation and assumption',()=>{const b=sampleCase(),q=questions(b);assert.equal(q.length,6);assert.ok(q[0].question.includes('Student ambassadors'));assert.ok(q[1].question.includes(b.assumption));});
test('blank case questions expose missing content',()=>{const q=questions(blankCase());assert.ok(q[0].hint.includes('incomplete'));assert.ok(q[2].hint.includes('blank'));});
test('changed context preserves draft notes and invalidates prepared status',()=>{const b=sampleCase(),q=questions(b).find(q=>q.id==='assumption');b.answers[q.id]=prepareAnswer(q,'Test a 50-student pilot before scale.');assert.equal(answerPrepared(b,q),true);b.assumption='Acquisition cost could double';const revised=questions(b).find(q=>q.id==='assumption');assert.equal(answerPrepared(b,revised),false);assert.equal(b.answers[q.id].text,'Test a 50-student pilot before scale.');});

test('each evidence detail invalidates preparation even when the citation count stays the same',()=>{
 for(const key of ['claim','source','url','date','locator']){
  const b=sampleCase();b.claims.forEach((c,i)=>Object.assign(c,{source:'Pilot report',url:`https://example.com/${i}`,date:'2026-10-17',locator:'Page 2'}));
  const q=questions(b).find(q=>q.id==='evidence'),notes='The pilot report supports our channel choice.';
  b.answers.evidence=prepareAnswer(q,notes);
  b.claims[0][key]=key==='url'?'https://example.com/revised':key==='date'?'2026-10-16':'Revised '+b.claims[0][key];
  const revised=questions(b).find(q=>q.id==='evidence');assert.equal(revised.hint,q.hint);
  assert.equal(answerPrepared(b,revised),false,`changed ${key} must require review`);syncAnswers(b);
  assert.equal(b.answers.evidence.ready,false);assert.equal(b.answers.evidence.text,notes);
 }
});

test('prepared answers track supporting recommendation, trade-off and mitigation facts',()=>{
 for(const [id,edit] of [
  ['rival',b=>b.options[0].description='Now requires an exclusive campus contract.'],
  ['rival',b=>b.criteria[0].name='Revenue rather than reach'],
  ['assumption',b=>b.response='Close the pilot if retention falls below 50%.'],
  ['economics',b=>b.assumption='Acquisition cost may double.'],
  ['execution',b=>b.constraints='Only one operator is available.'],
  ['evidence',b=>b.rationale='Choose a different segment based on the pilot.'],
  ['brief',b=>b.implementation='Delay the pilot by six months.'],
  ...['rival','assumption','economics','execution','evidence','brief'].map(id=>[id,b=>b.recommendation='0']),
 ]){
  const b=sampleCase(),q=questions(b).find(q=>q.id===id);b.answers[id]=prepareAnswer(q,'Review these supporting facts.');edit(b);
  assert.equal(answerPrepared(b,questions(b).find(q=>q.id===id)),false,`${id} supporting facts changed`);
  assert.equal(b.answers[id].text,'Review these supporting facts.');
 }
});
