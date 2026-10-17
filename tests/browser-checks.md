# Browser acceptance

Manual acceptance through CUA in a new isolated http://localhost:4173 tab; user preview at 127.0.0.1 was not touched. Desktop viewport 1440 × 1000.

## Passed

- New blank case accepts case name/team/decision/goal/constraints; all persisted after reload. Separate sample remains in saved-case library.
- Decide accordion opens only one section; next-step guidance opens the evidence section.
- Matrix at 95% total withholds rankings and explains the invalid total. At a 4.00/4.00 tie, both leaders are named; original scores restored.
- Custom slide headline survives decision changes; visible warning says custom edits are preserved and outline needs review.
- Judge Q&A notes and prepared checkbox save. Changing the critical assumption preserves answer notes, clears prepared, and shows case-context-changed warning. Q&A opens one question at a time.
- Pitch start, pause, resume, next-slide through all six, finish. Last completed total and six per-slide durations persist after reload; running timers reset as described. Short bounded rehearsal, not a five-minute endurance run.
- Editable JSON backup downloaded through UI; browser returned an actual download file path.

## Final completed checks

- HTML reading copy and Markdown exported via UI; browser returned actual file paths for all three formats.
- Own JSON backup reimported through file chooser. Saved cases increased from 2 to 3, with explicit “Backup imported as a new case” notice; decision edits and saved rehearsal summary survived.
- Keyboard ArrowRight moves Decide → Storyline with selected state and focus. Export Escape dismisses dialog and restores focus to export button.
- Latest final evidence-section “Shape the story” transition focuses Storyline and scrolls to editor start once its smooth scroll settles.
- At 390 × 844, rehearsal and Judge Q&A tabs and export dialog open successfully; responsive rehearsal screenshot visually inspected. Document width and scroll width are both 390px (no page horizontal overflow).
- Desktop screenshot: ../case-room-qa-desktop.jpg. Mobile screenshot: ../case-room-qa-mobile.jpg. Temporary viewport override reset after QA.

Limits: no five-minute endurance timer run, no native Print/PDF dialog acceptance, no exhaustive screen-reader or device coverage. No functional bugs found in completed checks.
