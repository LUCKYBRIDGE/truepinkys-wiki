# Truepinkys Wiki Agent Rules

This repository is a static Korean student wiki. Follow these rules when changing wiki content.

## Required Before Adding Knowledge

- Read `docs/wiki-content-guidelines.md` before editing `data/documents.json`.
- Follow the terminology map in `docs/wiki-content-guidelines.md`: user-facing entries are `지식`, sources are `자료`, and internal code/file names may keep `document`.
- Use official, public, or clearly reusable sources first.
- Use only sources whose reuse, citation, or student-facing rewrite conditions are clear enough for new content.
- Do not copy source paragraphs, images, tables, charts, worksheets, or diagrams into the wiki.
- Do not use NamuWiki, blogs, community posts, or unsourced summaries as source material for new knowledge.
- If a source's reuse or citation conditions are unclear, do not use it for new content.
- Historical people, events, and debates may be added only when they are broadly verified and written neutrally.

## Required Fields

Every new knowledge entry in `data/documents.json` must include:

- `id`, `title`, `summary`, `definition`, `documentKind`, `lastReviewed`
- `subjects`, `topicTags`, `aliases`, `keywords`, `searchContexts`
- `chapters`, with large learning units and nested sections
- `quiz`, `related`, `sources`, `copyrightNote`

`quiz` must contain multiple-choice questions with `question`, four `choices`, `answerIndex`, and `explanation`.

Every source must be an object with:

- `publisher`, `title`, `url`, `usedFor`, `license`, `checkedAt`

## Validation

Run this before committing wiki content changes:

```bash
node scripts/validate-wiki-content.mjs
node scripts/validate-curriculum-map.mjs
```

Also run:

```bash
jq empty data/documents.json data/taxonomy.json data/curriculum-map.json
git diff --check
```
