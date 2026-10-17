import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sampleCase, questions, prepareAnswer, answerPrepared, questionContext,
  decisionFingerprint, parseBackup, restoreLibrary, markdown,
} from '../dist/core.js';
import {caseMarkup, standaloneHtml} from '../dist/view.js';

const backup = b => JSON.stringify({app:'case-room', version:1, case:b});
const libraryBackup = (cases, activeId) => JSON.stringify({version:1, activeId, cases});

function editedCase() {
  const b = sampleCase();
  Object.assign(b, {
    sample:false, name:'Metro Meals: team final', team:'Team Banyan', date:'2026-10-17',
    decision:'Choose the next two-campus pilot.', objective:'Retain 450 paid subscribers.',
    constraints:'₹4 lakh budget; one operator.', mustAnswer:'Show payback and an exit gate.',
    recommendation:'2', rationale:'Choose employer partnerships for prepaid demand.',
    assumption:'At least 70% of employers renew after the pilot.',
    economics:'₹420 CAC / ₹210 contribution = two-month assumed payback.',
    objection:'An employer could withdraw the subsidy.', response:'Cap exposure per employer.',
    implementation:'Week 1: Kavya signs two employers; gate: 80 paid seats.',
    pitchMinutes:'6', updatedAt:'2026-10-17T10:10:00.000Z',
  });
  b.options = [
    {name:'Campus kiosks', description:'Direct demand; higher fixed cost.'},
    {name:'Ambassadors', description:'Referral demand; retention uncertain.'},
    {name:'Employer partnerships', description:'Prepaid cohorts; concentration risk.'},
  ];
  b.criteria = [{name:'Retention',weight:'40'},{name:'Capacity',weight:'20'},{name:'Payback',weight:'30'},{name:'Learning',weight:'10'}];
  b.scores = [['2','3','2','4'],['4','4','3','5'],['5','3','5','3']];
  b.claims = Array.from({length:3}, (_,i) => ({
    claim:`Pilot evidence ${i+1}: employer demand`, source:`Interview ledger ${i+1}`,
    url:`https://example.com/research/${i+1}?cohort=paid&campus=pune`,
    date:'2026-10-16', locator:`Page ${i+2}, table ${i+1}`,
  }));
  b.slides = Array.from({length:6}, (_,i) => ({
    headline:`Team-authored headline ${i+1}`, points:`Speaking note ${i+1}: explain the employer pilot.\nKeep the downside visible.`,
    seconds:String([30,45,60,90,75,60][i]), essential:i!==2,
  }));
  b.storyFingerprint = decisionFingerprint(b);
  for (const q of questions(b)) b.answers[q.id] = prepareAnswer(q, `Our ${q.id} answer: test before scaling.`);
  b.answers.execution.ready = false;
  b.lastRehearsal = {seconds:372, splits:[31,46,65,92,77,61].map((seconds,slide) => ({slide,seconds}))};
  return b;
}

test('editable backup round-trip preserves every case field, six custom slides, evidence, answer notes and rehearsal', () => {
  const b = editedCase(), imported = parseBackup(backup(b));
  assert.notEqual(imported.id, b.id, 'an imported backup is a new copy');
  assert.deepEqual({...imported, id:b.id}, b);
  assert.equal(imported.slides.length, 6);
  for (const q of questions(imported)) {
    assert.equal(imported.answers[q.id].context, questionContext(q));
    assert.equal(answerPrepared(imported,q), q.id!=='execution');
  }
  assert.equal(imported.answers.execution.text, b.answers.execution.text, 'draft notes survive');
});

test('each import creates a distinct case without mutating its source', () => {
  const b = editedCase(), serialized = backup(b), first = parseBackup(serialized), second = parseBackup(serialized);
  assert.notEqual(first.id, second.id);
  assert.notEqual(first.id, b.id);
  first.slides[0].points = 'Imported copy only';
  assert.equal(backup(b), serialized);
  assert.notEqual(second.slides[0].points, first.slides[0].points);
});

test('malformed JSON and unsupported backup envelopes reject without changing current work', () => {
  const current = editedCase(), original = backup(current);
  for (const raw of ['{', 'null', '[]', JSON.stringify({app:'other-app',version:1,case:current}), JSON.stringify({app:'case-room',version:2,case:current})]) {
    assert.throws(() => parseBackup(raw));
    assert.equal(backup(current), original);
  }
});

test('backup rejects malformed fixed-size top-level arrays', () => {
  for (const [field,value] of [
    ['options',[]], ['options',{}], ['criteria',null], ['criteria',Array(3).fill({})],
    ['scores',[]], ['scores',{}], ['slides',Array(5).fill({})], ['claims',{}], ['claims',null],
  ]) {
    const b = editedCase(); b[field] = value;
    assert.throws(() => parseBackup(backup(b)), `must reject malformed ${field}`);
  }
});

test('backup rejects malformed score rows instead of silently fabricating a four-column matrix', () => {
  for (const row of [null, {}, '1234', ['1'], ['1','2','3','4','5']]) {
    const b = editedCase(); b.scores[0] = row;
    assert.throws(() => parseBackup(backup(b)), `must reject malformed score row ${JSON.stringify(row)}`);
  }
});

test('backup rejects wrong evidence array lengths instead of discarding or inventing records', () => {
  for (const count of [0,2,4]) {
    const b = editedCase(); b.claims = Array.from({length:count}, () => ({...b.claims[0]}));
    assert.throws(() => parseBackup(backup(b)), `must reject ${count} evidence records`);
  }
});

test('restore preserves two distinct cases, their IDs, and the selected active case', () => {
  const first = editedCase(), second = editedCase();
  second.name = 'A separate competition'; second.answers.rival.text = 'A different answer';
  const restored = restoreLibrary(libraryBackup([first,second],second.id));
  assert.equal(restored.version, 1);
  assert.equal(restored.activeId, second.id);
  assert.deepEqual(restored.cases, [first,second]);
  restored.cases[0].slides[0].headline = 'A local edit';
  assert.notEqual(restored.cases[1].slides[0].headline, 'A local edit');
});

test('restore rejects duplicate case IDs, empty libraries and unsupported versions; missing active ID falls back', () => {
  const b = editedCase();
  assert.throws(() => restoreLibrary(libraryBackup([b,b],b.id)));
  assert.throws(() => restoreLibrary(libraryBackup([],b.id)));
  assert.throws(() => restoreLibrary(JSON.stringify({version:2,cases:[b],activeId:b.id})));
  assert.equal(restoreLibrary(libraryBackup([b],'missing')).activeId, b.id);
});

test('Markdown and standalone HTML contain actual decision, source details, six custom slides, answers and rehearsal', () => {
  const b = editedCase(), md = markdown(b), html = standaloneHtml(b,'body{color:#111}');
  for (const output of [md,html]) {
    for (const value of [b.name,b.team,b.decision,b.objective,b.constraints,b.mustAnswer,b.rationale,b.assumption,b.economics,b.objection,b.response,b.implementation]) {
      assert.ok(output.includes(value), `missing case content: ${value}`);
    }
    for (const option of b.options) { assert.ok(output.includes(option.name)); assert.ok(output.includes(option.description)); }
    for (const criterion of b.criteria) assert.ok(output.includes(criterion.name));
    for (const slide of b.slides) { assert.ok(output.includes(slide.headline)); assert.ok(output.includes(slide.points)); }
    for (const claim of b.claims) {
      for (const key of ['claim','source','date','locator']) assert.ok(output.includes(claim[key]));
    }
    for (const answer of Object.values(b.answers)) assert.ok(output.includes(answer.text));
    for (const time of ['06:12','00:31','00:46','01:05','01:32','01:17','01:01']) assert.ok(output.includes(time), `missing rehearsal time ${time}`);
  }
  assert.ok(md.includes(b.claims[0].url));
  assert.ok(html.includes(b.claims[0].url.replaceAll('&','&amp;')));
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('body{color:#111}'));
  assert.match(md, /Status: Needs work/);
  assert.match(html, /Needs review \/ preparation/);
});

test('HTML renders hostile entered text as escaped text in titles, narrative, slides, evidence and answers', () => {
  const b = editedCase(), attack = '\"\'><script>alert(1)</script><img src=x onerror=alert(2)>&';
  b.name = attack; b.rationale = attack; b.slides[0].headline = attack; b.slides[0].points = attack;
  b.claims[0].claim = attack; b.claims[0].source = attack; b.claims[0].locator = attack;
  b.answers.rival.text = attack;
  const html = standaloneHtml(b,'');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img '));
  assert.ok(!html.includes(attack));
  assert.ok(html.includes('&quot;&#39;&gt;&lt;script&gt;alert(1)&lt;/script&gt;&lt;img src=x onerror=alert(2)&gt;&amp;'));
  assert.match(html, /<title>&quot;&#39;&gt;&lt;script&gt;/);
});

test('exported source links allow HTTP/HTTPS and reject executable, relative and credential-bearing URLs', () => {
  for (const url of ['javascript:alert(1)','data:text/html,<script>alert(1)</script>','vbscript:msgbox(1)','/relative-source','https://user:secret@example.com/research']) {
    const b = editedCase(); b.claims = b.claims.map(c => ({...c,url}));
    const html = caseMarkup(b,true), md = markdown(b);
    assert.ok(!html.includes('<a href='), `unsafe URL became clickable: ${url}`);
    assert.ok(!md.includes(url), `unsafe URL escaped into Markdown: ${url}`);
    assert.match(html, /No valid source link/);
    assert.match(md, /No valid HTTP\/HTTPS source link/);
  }
  const b = editedCase(); b.claims[0].url = 'https://example.com/?q=" onclick="alert(1)&topic=case';
  const html = caseMarkup(b,true);
  assert.ok(html.includes('href="https://example.com/?q=%22%20onclick=%22alert(1)&amp;topic=case"'));
  assert.ok(!html.includes(' onclick="alert(1)'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
});

test('changed critical assumption preserves notes but invalidates prepared status through backup restore and both exports', () => {
  const b = editedCase(), oldAnswer = {...b.answers.assumption};
  assert.equal(answerPrepared(b,questions(b).find(q => q.id==='assumption')), true);
  b.assumption = 'Employer renewals may fall to 25%.';
  const imported = parseBackup(backup(b)), q = questions(imported).find(q => q.id==='assumption');
  assert.equal(imported.answers.assumption.text, oldAnswer.text);
  assert.equal(imported.answers.assumption.context, oldAnswer.context, 'retain the context in which the answer was prepared');
  assert.equal(imported.answers.assumption.ready, false);
  assert.equal(answerPrepared(imported,q), false);
  const md = markdown(imported), html = standaloneHtml(imported,'');
  assert.ok(md.includes(`### ${q.question}\nAnswer: ${oldAnswer.text}\nStatus: Needs work`));
  assert.ok(html.includes(`<p>${oldAnswer.text}</p><p class="formula-note">Needs review / preparation</p>`));
  assert.ok(md.includes(b.assumption)); assert.ok(html.includes(b.assumption));
  assert.equal(restoreLibrary(libraryBackup([b],b.id)).cases[0].answers.assumption.ready, false);
});

test('long accepted brief inputs retain current storyline and prepared answers after reload and import',()=>{
 const b=editedCase();b.constraints='Budget constraint. '.repeat(400);b.mustAnswer='Required deliverable. '.repeat(400);
 b.storyFingerprint=decisionFingerprint(b);
 for(const q of questions(b))b.answers[q.id]=prepareAnswer(q,'Our answer addresses the complete current brief.');
 const serialized=backup(b);assert.ok(serialized.length<1000000);
 for(const restored of [parseBackup(serialized),restoreLibrary(libraryBackup([b],b.id)).cases[0]]){
  assert.equal(restored.constraints,b.constraints);assert.equal(restored.mustAnswer,b.mustAnswer);
  assert.equal(restored.storyFingerprint,decisionFingerprint(restored),'unchanged storyline must remain current');
  for(const q of questions(restored))assert.equal(answerPrepared(restored,q),true,`${q.id} answer must remain prepared`);
 }
 assert.ok(b.storyFingerprint.length<100,'derived fingerprint must not duplicate the brief');
 for(const answer of Object.values(b.answers))assert.ok(answer.context.length<100,'derived answer context must stay bounded');
});
