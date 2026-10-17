# Case Room

A browser workspace for PGP/MBA case teams: choose a recommendation, build a six-slide storyline, and rehearse the pitch and judges’ questions. The team’s critical assumption connects all three stages.

## Run locally

From this directory, with Node.js, npm, and Python 3 available:

```sh
npm start
```

Open [localhost:4173](http://localhost:4173). The site is plain HTML, CSS, and browser JavaScript; there are no third-party runtime packages, API keys, accounts, or build step. Any static web server can serve `dist/` directly. Use a server rather than opening `index.html` as a local file, because the app uses JavaScript modules.

## Preparation flow

1. **Decide:** enter the brief and official requirements; compare three alternatives against four weighted criteria; choose a recommendation and record its rationale, evidence, economics, critical assumption, and execution plan.
2. **Storyline:** generate an editable six-slide speaking outline from the team’s inputs. Keep custom edits, review changes to the decision, and explicitly regenerate when ready to replace the outline.
3. **Rehearse and defend:** allocate pitch time, practice slide pacing, and prepare answers to six contextual judge-question templates. Export the preparation as Markdown, a reading copy, a browser-printed PDF, or an editable JSON backup.

Start with the fictional CampusBite case or create a blank case. Example facts and numbers are illustrative. Scores and weights express team judgment; the matrix does not establish the correct answer. Source links are recorded, not fetched or verified. Outlines and questions use templates, not AI research, answer grading, or a simulation of real judges.

## Save and share

Cases save in this browser’s local storage. There is no shared live collaboration or cloud case sync. Export a JSON backup to transfer editable work to another device; Markdown and the reading copy are useful for team review. Browser data can be cleared or unavailable, so keep backups of work you need.

Reloading resets active pitch and answer timers. Saved preparation and the last completed rehearsal remain available when local storage works. A running rehearsal uses its starting slide plan; reset it before changing the practice plan.

## Verify

```sh
npm test
npm run check
```

The first command runs the Node test suite; the second checks JavaScript syntax. Browser verification and release observations belong in `tests/browser-checks.md`. These instructions do not themselves assert that checks or deployment have passed.

## Deploy

Publish the contents of `dist/` on a static host. The existing Sites project identity and static directory are configured in `.openai/hosting.json`. Publishing and changing the hosting audience are separate actions; consult the actual deployment result for its URL and access level. This README does not claim a public launch.

The reviewed scope and acceptance criteria are in `docs/plans/2026-10-17-1539-feat-case-room-competition-plan.md`. Product inspiration, launch hypotheses, and draft copy are in `docs/launch-brief.md`.
