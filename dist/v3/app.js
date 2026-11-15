import { estimateMarket, calculateBreakEven, formatINR } from './case-tools.js';

const $ = (selector) => document.querySelector(selector);

const caseForm = $('#case-form');
const caseTitle = $('#case-title');
const caseQuestion = $('#case-question');
const caseRecommendation = $('#case-recommendation');
const builderPreview = $('#builder-preview');
const navigatorAction = $('#navigator-action');
const navigatorTitle = $('#navigator-title');
const navigatorReason = $('#navigator-reason');
const evidencePanel = $('#evidence-panel');
const evidenceInput = $('#evidence-input');
const saveEvidence = $('#save-evidence');
const assumptionInput = $('#assumption-input');
const updateAssumption = $('#update-assumption');
const toolkitStages = {
  frame: {
    kicker: '01 · UNDERSTAND THE ASK', title: 'Turn the brief into a decision.',
    copy: 'Find the decision-maker, objective, constraints, stakeholders and the real question hidden inside the case. Keep facts supplied in the brief separate from your team’s assumptions.',
    status: 'Partly demonstrated in the local preview; structured brief extraction is a planned feature.',
    items: [
      ['Brief-to-decision canvas', 'Capture the objective, decision owner, deadline, constraints and required deliverable.'],
      ['Issue tree & hypothesis board', 'Break the challenge into testable branches; assign owners and mark what is still unknown.'],
      ['Stakeholder & success map', 'Name who is affected and define measurable outcomes before debating solutions.'],
      ['Competition checklist', 'Add the rubric, format, time limit and judging criteria so the team works to the actual brief.']
    ]
  },
  research: {
    kicker: '02 · FIND AND LABEL THE PROOF', title: 'Make research traceable.',
    copy: 'Collect the sources your team actually found, record what each source supports, and mark gaps. Case Room should help organise evidence—not fabricate research or imply that a claim has been verified.',
    status: 'Evidence notes are demonstrated locally; source library, citations and collaborative research are planned.',
    items: [
      ['Source library & citations', 'Save title, publisher, URL, date, excerpt and the specific claim the source supports.'],
      ['Fact / assumption / estimate labels', 'Make the confidence and origin of each input visible to the whole team.'],
      ['Market sizing workspace', 'Show TAM/SAM/SOM or bottom-up math step by step, with editable assumptions and units.'],
      ['Research gap list', 'Turn missing proof into assigned questions, with owner and due time.']
    ]
  },
  decide: {
    kicker: '03 · COMPARE AND COMMIT', title: 'Show why this option wins.',
    copy: 'Compare a small number of strategic choices against the same criteria. Make the financial logic inspectable, stress-test the assumptions, and keep rejected alternatives visible.',
    status: 'A recommendation and assumption link are shown locally; scoring, sensitivity analysis and audit trail are planned.',
    items: [
      ['Option & criteria matrix', 'Compare alternatives against impact, feasibility, cost, risk and rubric fit.'],
      ['Unit economics & investment case', 'Connect price, volume, margin, capacity and investment to a transparent outcome.'],
      ['Sensitivity & scenario checks', 'Change key assumptions and see which conclusion or threshold needs another look.'],
      ['Decision log & dissent', 'Record the choice, rationale, trade-offs, owner and strongest opposing view.']
    ]
  },
  story: {
    kicker: '04 · TURN THE LOGIC INTO A STORY', title: 'Build slides from the argument.',
    copy: 'Move from recommendation to supporting logic, evidence, implementation and risks. The goal is a coherent presentation the team can explain—not a pile of disconnected slides.',
    status: 'A story-to-claim relationship is demonstrated locally; slide planning, export and team editing are planned.',
    items: [
      ['Pyramid / storyline builder', 'Lead with the answer, then arrange reasons and supporting evidence beneath it.'],
      ['Claim-to-source links', 'Keep each key slide claim attached to its evidence or clearly marked assumption.'],
      ['Implementation roadmap', 'Show owners, phases, dependencies, costs, measures and decision gates.'],
      ['Risk & mitigation register', 'Name failure modes, early warning signals, mitigations and contingency plans.']
    ]
  },
  defend: {
    kicker: '05 · REHEARSE AND DEFEND', title: 'Practise the hard questions.',
    copy: 'Rehearse against the rubric, time limit and toughest counterarguments. Capture feedback, spot weak answers and return to the exact assumption or claim that needs work.',
    status: 'A judge-answer field is demonstrated locally; timed rehearsal, rubric feedback and Case Gym are planned.',
    items: [
      ['Judge Q&A & counterarguments', 'Practise “why this?”, “what could break?”, “why now?” and “what did you reject?”'],
      ['Timed presentation rehearsal', 'Run a stopwatch by speaker or slide; note overruns and handoff gaps.'],
      ['Rubric-based review', 'Score the argument against the competition’s own criteria and explain each gap.'],
      ['Case Gym & mini drills', 'Practise original issue-tree, market-sizing, unit-economics and prioritisation questions; review the explanation.']
    ]
  }
};
let guidedCase = false;
let navigatorTarget = 'evidence';
let savedAssumption = assumptionInput.value.trim();

const northstar = {
  title: 'Northstar Foods market expansion',
  question: 'Should Northstar enter two new cities with a meal-kit pilot before expanding nationally?',
  recommendation: 'Run a two-city pilot, then expand if repeat orders meet the target.',
  assumption: 'Customers in the pilot cities will order repeatedly after trying their first box.',
  rationale: 'The pilot keeps risk low while Northstar learns which customers come back.',
  judgeAnswer: 'We will expand only after the repeat-order target is met.'
};

function renderToolkit(stageKey, focusTab = false) {
  const stage = toolkitStages[stageKey];
  if (!stage) return;
  const tab = $(`[data-toolkit="${stageKey}"]`);
  document.querySelectorAll('.toolkit-tab').forEach((button) => {
    const selected = button === tab;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  const panel = $('#toolkit-panel');
  panel.setAttribute('aria-labelledby', tab.id);
  $('#toolkit-kicker').textContent = stage.kicker;
  $('#toolkit-stage-title').textContent = stage.title;
  $('#toolkit-stage-copy').textContent = stage.copy;
  $('#toolkit-stage-status').textContent = stage.status;
  const list = $('#toolkit-feature-list');
  list.replaceChildren(...stage.items.map(([title, copy], index) => {
    const item = document.createElement('article');
    item.className = 'toolkit-feature';
    const number = document.createElement('span');
    number.className = 'toolkit-feature-number';
    number.textContent = String(index + 1).padStart(2, '0');
    const body = document.createElement('div');
    const heading = document.createElement('h4');
    heading.textContent = title;
    const description = document.createElement('p');
    description.textContent = copy;
    body.append(heading, description);
    item.append(number, body);
    return item;
  }));
  if (focusTab) tab.focus();
}

document.querySelectorAll('.toolkit-tab').forEach((button) => {
  button.addEventListener('click', () => renderToolkit(button.dataset.toolkit));
  button.addEventListener('keydown', (event) => {
    const tabs = [...document.querySelectorAll('.toolkit-tab')];
    const index = tabs.indexOf(button);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    renderToolkit(tabs[next].dataset.toolkit, true);
  });
});
renderToolkit('frame');

const savedCaseKey = 'caseroom-v3-case-v1';
const caseSaveStatus = $('#case-save-status');

function readCaseDraft() {
  return {
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    title: caseTitle.value.trim(),
    question: caseQuestion.value.trim(),
    recommendation: caseRecommendation.value.trim(),
    evidence: evidenceInput.value.trim(),
    assumption: assumptionInput.value.trim(),
    rationale: $('#story-text').value.trim(),
    judgeAnswer: $('#judge-text').value.trim(),
    tools: {
      population: $('#market-population').value,
      targetSharePercent: $('#market-segment').value,
      annualSpend: $('#market-spend').value,
      price: $('#unit-price').value,
      variableCost: $('#unit-cost').value,
      fixedCosts: $('#fixed-cost').value
    }
  };
}

function getSavedCase() {
  try {
    const raw = localStorage.getItem(savedCaseKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCaseDraft() {
  if (!caseTitle.value.trim() || !caseQuestion.value.trim()) {
    caseSaveStatus.textContent = 'Add a case title and decision question before saving.';
    caseTitle.focus();
    return;
  }
  try {
    localStorage.setItem(savedCaseKey, JSON.stringify(readCaseDraft()));
    caseSaveStatus.textContent = 'Saved on this browser. It is not synced to teammates.';
  } catch {
    caseSaveStatus.textContent = 'This browser could not save the draft. Download a backup instead.';
  }
}

function applySavedCase(draft) {
  caseTitle.value = draft.title || '';
  caseQuestion.value = draft.question || '';
  caseRecommendation.value = draft.recommendation || '';
  guidedCase = false;
  caseForm.requestSubmit();
  assumptionInput.value = draft.assumption || '';
  $('#story-text').value = draft.rationale || '';
  $('#judge-text').value = draft.judgeAnswer || '';
  evidenceInput.value = draft.evidence || '';
  const tools = draft.tools || {};
  for (const [id, key] of [['market-population','population'],['market-segment','targetSharePercent'],['market-spend','annualSpend'],['unit-price','price'],['unit-cost','variableCost'],['fixed-cost','fixedCosts']]) {
    if (tools[key] !== undefined) $(`#${id}`).value = tools[key];
  }
  caseSaveStatus.textContent = 'Reopened from this browser. Save again after changes.';
  runMarketSizing();
  runBreakEven();
}

$('#save-case').addEventListener('click', saveCaseDraft);
if (getSavedCase()) caseSaveStatus.textContent = 'A saved draft is available in this browser. Choose Reopen saved.';
$('#load-case').addEventListener('click', () => {
  const draft = getSavedCase();
  if (!draft) {
    caseSaveStatus.textContent = 'No saved case was found in this browser yet.';
    return;
  }
  applySavedCase(draft);
});
$('#export-case').addEventListener('click', () => {
  const draft = readCaseDraft();
  const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(draft.title || 'case-room-draft').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'case-room-draft'}.json`;
  link.click();
  URL.revokeObjectURL(url);
  caseSaveStatus.textContent = 'Backup downloaded. Keep it somewhere your team can access.';
});
$('#clear-case').addEventListener('click', () => {
  if (!window.confirm('Delete the saved Case Room draft from this browser?')) return;
  localStorage.removeItem(savedCaseKey);
  window.location.reload();
});

function runMarketSizing() {
  const result = $('#market-result');
  try {
    const estimate = estimateMarket({
      population: $('#market-population').value,
      targetSharePercent: $('#market-segment').value,
      annualSpend: $('#market-spend').value
    });
    result.textContent = `Illustrative target customers: ${Math.round(estimate.customers).toLocaleString('en-IN')} · Annual market estimate: ${formatINR(estimate.annualValue)}`;
  } catch (error) {
    result.textContent = error.message;
  }
}

function runBreakEven() {
  const result = $('#unit-result');
  try {
    const metrics = calculateBreakEven({
      price: $('#unit-price').value,
      variableCost: $('#unit-cost').value,
      fixedCosts: $('#fixed-cost').value
    });
    if (metrics.breakEvenUnits === null) {
      result.textContent = `Contribution is ${formatINR(metrics.contribution)} per unit. The current unit economics do not cover fixed costs; revisit price, cost or the offer.`;
      return;
    }
    result.textContent = `Contribution: ${formatINR(metrics.contribution)} per unit (${(metrics.contributionMargin * 100).toFixed(1)}% margin) · Monthly break-even: ${metrics.breakEvenUnits.toLocaleString('en-IN')} units.`;
  } catch (error) {
    result.textContent = error.message;
  }
}

$('#calculate-market').addEventListener('click', runMarketSizing);
$('#calculate-unit').addEventListener('click', runBreakEven);
runMarketSizing();
runBreakEven();

const drills = [
  {
    prompt: 'A meal-kit pilot has high first-order conversion but weak repeat purchase. Which first analysis best tests whether to expand?',
    choices: ['Compare repeat rates by customer cohort and acquisition channel.', 'Increase the marketing budget in every city.', 'Assume the first-order conversion proves product-market fit.'],
    correct: 0,
    why: 'Cohort and channel cuts help locate where repeat behaviour is weak before a larger rollout. Then test causes with customer evidence.'
  },
  {
    prompt: 'A service has positive contribution per order, but its pilot already runs near capacity. What should the team check before promising rapid growth?',
    choices: ['Only the total addressable market.', 'Capacity, incremental cost and service quality at the next volume step.', 'Whether a competitor used the same slide template.'],
    correct: 1,
    why: 'A profitable order does not prove the operation can scale. Capacity constraints can change cost, delivery quality and the recommendation.'
  },
  {
    prompt: 'A top-down market estimate is large, but the case gives little evidence that customers will switch. What is the most useful next step?',
    choices: ['Treat the full market estimate as forecast revenue.', 'Add another unrelated framework to the deck.', 'Build a bottom-up adoption estimate and label willingness-to-switch as an assumption to test.'],
    correct: 2,
    why: 'A large market is not a sales forecast. Make adoption and switching explicit, then identify what evidence could validate them.'
  }
];
let drillIndex = 0;
let drillScore = 0;
let drillAnswered = false;

function showDrill() {
  const drill = drills[drillIndex];
  $('#drill-prompt').textContent = drill.prompt;
  $('#drill-feedback').textContent = 'Choose the strongest next step.';
  $('#drill-score').textContent = `Practice ${drillIndex + 1} of ${drills.length} · Score ${drillScore}/${drillIndex}`;
  $('#next-drill').textContent = drillIndex === drills.length - 1 ? 'Restart drills ↻' : 'Next question →';
  const options = $('#drill-options');
  options.replaceChildren(...drill.choices.map((choice, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'drill-option';
    button.dataset.answer = String(index);
    button.textContent = choice;
    button.addEventListener('click', () => {
      if (drillAnswered) return;
      drillAnswered = true;
      const correct = index === drill.correct;
      if (correct) drillScore += 1;
      options.querySelectorAll('button').forEach((option) => {
        option.disabled = true;
        if (Number(option.dataset.answer) === drill.correct) option.classList.add('correct');
        else if (option === button) option.classList.add('incorrect');
      });
      $('#drill-feedback').textContent = `${correct ? 'Good call. ' : 'Consider this. '}${drill.why}`;
      $('#drill-score').textContent = `Practice ${drillIndex + 1} of ${drills.length} · Score ${drillScore}/${drillIndex + 1}`;
    });
    return button;
  }));
  drillAnswered = false;
}

$('#next-drill').addEventListener('click', () => {
  if (!drillAnswered) {
    $('#drill-feedback').textContent = 'Pick an answer first to review the reasoning.';
    return;
  }
  drillIndex = (drillIndex + 1) % drills.length;
  if (drillIndex === 0) drillScore = 0;
  showDrill();
});
showDrill();

let timerInterval = null;
let timerRemaining = Number($('#timer-minutes').value) * 60;

function renderTimer() {
  const minutes = Math.floor(timerRemaining / 60);
  const seconds = timerRemaining % 60;
  $('#timer-display').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

$('#timer-minutes').addEventListener('change', () => {
  if (timerInterval) return;
  const minutes = Math.max(1, Math.min(60, Number($('#timer-minutes').value) || 7));
  $('#timer-minutes').value = String(minutes);
  timerRemaining = minutes * 60;
  renderTimer();
});
$('#timer-start').addEventListener('click', () => {
  if (timerInterval) {
    window.clearInterval(timerInterval);
    timerInterval = null;
    $('#timer-start').textContent = 'Resume timer';
    $('#timer-note').textContent = 'Paused. Resume when ready.';
    return;
  }
  $('#timer-start').textContent = 'Pause timer';
  $('#timer-note').textContent = 'Rehearsal is running.';
  timerInterval = window.setInterval(() => {
    timerRemaining = Math.max(0, timerRemaining - 1);
    renderTimer();
    if (timerRemaining === 0) {
      window.clearInterval(timerInterval);
      timerInterval = null;
      $('#timer-start').textContent = 'Start timer';
      $('#timer-note').textContent = 'Time. Note where the team needs to tighten.';
    }
  }, 1000);
});
$('#timer-reset').addEventListener('click', () => {
  if (timerInterval) window.clearInterval(timerInterval);
  timerInterval = null;
  timerRemaining = Number($('#timer-minutes').value) * 60;
  renderTimer();
  $('#timer-start').textContent = 'Start timer';
  $('#timer-note').textContent = 'Ready when your team is.';
});
renderTimer();

function resetLinkedPreview(useFictionalCase) {
  const linkedFields = [...document.querySelectorAll('.linked-field')];
  linkedFields.forEach((row) => {
    row.classList.remove('needs-review');
    row.querySelector('.field-state').textContent = 'Up to date';
  });
  $('#downstream-review').hidden = true;
  evidencePanel.hidden = true;
  evidenceInput.readOnly = false;
  evidenceInput.value = '';
  evidenceInput.setCustomValidity('');
  saveEvidence.disabled = false;
  saveEvidence.textContent = 'Save note ↗';
  evidencePanel.querySelector('label').textContent = 'Evidence or assumption note';
  $('#story-text').value = useFictionalCase ? northstar.rationale : 'Add the reason your recommendation solves the case.';
  $('#judge-text').value = useFictionalCase ? northstar.judgeAnswer : 'Add a likely judge question and your team’s answer.';
  assumptionInput.value = useFictionalCase ? northstar.assumption : 'Add the main assumption behind your team’s recommendation.';
  savedAssumption = assumptionInput.value.trim();
  updateAssumption.disabled = true;
}

function setPreparationStep({ recommendation, fictional }) {
  navigatorTarget = recommendation ? 'evidence' : 'recommendation';
  const missingCall = !recommendation;
  const title = missingCall ? 'Make the recommendation explicit.' : 'Add support for your recommendation.';
  const reason = missingCall
    ? 'Your brief is in the preview, but it needs a specific call before the team can build a defendable argument.'
    : fictional
      ? 'Your pilot choice is clear, but this walkthrough has no evidence attached yet. Add a source or label the point as an assumption.'
      : 'Your recommendation is in the preview. Connect a source or label the key assumption.';
  navigatorTitle.textContent = title;
  navigatorReason.textContent = reason;
  navigatorAction.textContent = missingCall ? 'Add a recommendation →' : 'Review evidence →';
  $('#navigator-target-label').textContent = missingCall ? 'Team recommendation' : 'Evidence & assumptions';
  const progress = fictional ? 68 : recommendation ? 34 : 18;
  $('#navigator-progress').textContent = fictional ? '4 of 6 steps' : recommendation ? '2 of 6 steps' : '1 of 6 steps';
  $('#navigator-progress-bar').style.width = `${progress}%`;
  $('#hero-progress-label').textContent = `${progress}%`;
  $('#hero-progress-bar').style.width = `${progress}%`;
  $('#hero-next-title').textContent = missingCall ? 'Make the recommendation explicit' : fictional ? 'Ground the recommendation' : 'Add support for your recommendation';
  $('#hero-next-copy').textContent = missingCall ? 'Give your team a clear call to test.' : 'Connect a source or label the key assumption.';
}

function openFictionalWalkthrough() {
  guidedCase = true;
  caseTitle.value = northstar.title;
  caseQuestion.value = northstar.question;
  caseRecommendation.value = northstar.recommendation;
  caseForm.requestSubmit();
}

$('#walkthrough-button').addEventListener('click', openFictionalWalkthrough);
caseForm.addEventListener('input', () => { guidedCase = false; });

caseForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = caseTitle.value.trim();
  const question = caseQuestion.value.trim();
  const recommendation = caseRecommendation.value.trim();
  if (!title || !question) return;

  const isFictional = guidedCase;
  resetLinkedPreview(isFictional);
  $('.case-context > h3').textContent = title;
  $('.context-desc').textContent = isFictional ? question : `${question} Your brief appears in this local preview only; it is not saved or shared.`;
  $('#recommendation-text').textContent = recommendation || 'Your team has not written a recommendation yet.';
  $('.context-label').textContent = isFictional ? 'NORTHSTAR FOODS · FICTIONAL WALKTHROUGH' : 'YOUR CASE · LOCAL PREVIEW';
  $('.context-status').textContent = isFictional ? 'Fictional preview' : 'Local · not saved';
  $('.brief-header h2').textContent = title;
  $('.mini-label').textContent = isFictional ? 'FICTIONAL PRODUCT EXAMPLE' : 'YOUR CASE · NOT SAVED';
  setPreparationStep({ recommendation, fictional: isFictional });
  $('#builder-result-title').textContent = title;
  $('#builder-result-copy').textContent = isFictional
    ? 'The fictional Northstar case is ready to explore. Nothing is saved.'
    : 'Your brief appears in the Navigator preview below. Nothing is saved or shared.';
  builderPreview.hidden = false;
  builderPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

$('#go-navigator').addEventListener('click', () => {
  $('#navigator').scrollIntoView({ behavior: 'smooth' });
  window.setTimeout(() => navigatorAction.focus(), 400);
});

function focusRecommendation() {
  $('#guided-start').scrollIntoView({ behavior: 'smooth', block: 'center' });
  caseRecommendation.focus();
}

function focusAssumption() {
  assumptionInput.focus();
  assumptionInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

navigatorAction.addEventListener('click', () => {
  if (navigatorTarget === 'recommendation') return focusRecommendation();
  if (navigatorTarget === 'assumption') return focusAssumption();
  evidencePanel.hidden = false;
  evidenceInput.focus();
  evidencePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

$('#fill-code').addEventListener('click', () => {
  $('#room-code').value = 'TEAM42';
  $('#room-code').focus();
  $('#join-feedback').textContent = '';
  $('#join-feedback').className = 'join-feedback';
});

$('#join-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const submittedCode = $('#room-code').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const accepted = submittedCode === 'TEAM42';
  $('#room-access').hidden = !accepted;
  $('#join-feedback').textContent = accepted
    ? 'Preview opened. This is a fictional room on this device only.'
    : 'That code is not part of this preview. No room details are shown.';
  $('#join-feedback').className = `join-feedback ${accepted ? 'success' : 'error'}`;
  if (accepted) $('#room-access').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

evidenceInput.addEventListener('input', () => evidenceInput.setCustomValidity(''));

assumptionInput.addEventListener('input', () => {
  updateAssumption.disabled = assumptionInput.value.trim() === savedAssumption;
});

updateAssumption.addEventListener('click', () => {
  if (assumptionInput.value.trim() === savedAssumption) return;
  savedAssumption = assumptionInput.value.trim();
  updateAssumption.disabled = true;
  $('#downstream-review').hidden = false;
  document.querySelectorAll('.linked-field').forEach((row) => {
    row.classList.add('needs-review');
    row.querySelector('.field-state').textContent = 'Review this';
  });
  $('#hero-next-title').textContent = 'Review the connected argument';
  $('#hero-next-copy').textContent = 'Your updated assumption may affect the story and judge answer.';
  $('#downstream-review').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

saveEvidence.addEventListener('click', () => {
  const evidence = evidenceInput.value.trim();
  if (!evidence) {
    evidenceInput.setCustomValidity('Add a source note or describe the assumption your team is using.');
    evidenceInput.reportValidity();
    return;
  }
  navigatorTarget = 'assumption';
  navigatorTitle.textContent = 'Stress-test your key assumption.';
  $('#navigator-target-label').textContent = 'Critical assumption';
  navigatorReason.textContent = 'You added a note in this preview. Now check whether your main assumption is strong enough to support the recommendation. The note is not a verified source.';
  navigatorAction.textContent = 'Review the assumption →';
  $('#navigator-progress').textContent = '5 of 6 steps';
  $('#navigator-progress-bar').style.width = '83%';
  $('#hero-progress-label').textContent = '82%';
  $('#hero-progress-bar').style.width = '82%';
  $('#hero-next-title').textContent = 'Stress-test the key assumption';
  $('#hero-next-copy').textContent = 'Check whether your assumption supports the recommendation.';
  evidencePanel.querySelector('label').textContent = 'Evidence / assumption note · added in preview';
  evidenceInput.readOnly = true;
  saveEvidence.textContent = 'Added to preview ✓';
  saveEvidence.disabled = true;
});

$('#review-linked').addEventListener('click', () => {
  $('#linked-fields').scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => {
    const firstNeedsReview = $('.linked-field.needs-review textarea');
    (firstNeedsReview || $('#story-text')).focus();
  }, 400);
});

$('#navigator').addEventListener('input', (event) => {
  if (!event.target.matches('#story-text, #judge-text')) return;
  const row = event.target.closest('.linked-field');
  row.classList.remove('needs-review');
  row.querySelector('.field-state').textContent = 'Updated in preview';
  if (!document.querySelector('.linked-field.needs-review')) $('#downstream-review').hidden = true;
});

$('.rail-menu').addEventListener('click', (event) => {
  const guardrail = $('#navigator-guardrail');
  guardrail.hidden = !guardrail.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!guardrail.hidden));
});
