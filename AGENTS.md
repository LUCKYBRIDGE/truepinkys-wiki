# Truepinkys Wiki Agent Rules

This repository is a static Korean student wiki. Follow these rules when changing wiki content.

## Required Before Adding Knowledge

- Read `docs/wiki-content-guidelines.md` before editing files under `data/source/knowledge`.
- Follow the terminology map in `docs/wiki-content-guidelines.md`: user-facing entries are `지식`, sources are `자료`, and internal code/file names may keep `document`.
- Add and revise knowledge entries one by one. Do not bulk-generate knowledge by reusing the same chapter frame, examples, quiz pattern, or source note with only the title changed.
- Do not bulk-check knowledge entries and then bulk-edit them. Read one knowledge file, judge that file's title, definition, structure, body, quiz, related links, and sources, edit that file if needed, validate the JSON, then move to the next file.
- When revising existing knowledge, work in `data/source/knowledge-order.json` order unless the user names a specific entry. Do not only pick likely-problem entries.
- If a requested revision spans many entries, keep an explicit progress list with each entry marked `유지`, `부분 수정`, or `재구성`. Do not mark entries complete without reading their full source JSON.
- For each entry, review the page structure as a whole: `definition` is the detail page `핵심 뜻`, `summary` is only for cards/search/list pages, and the first body paragraph should not repeat the definition unless the section needs a more specific restatement.
- Finish reviewing one knowledge entry before moving to the next, including quizzes and sources affected by the edit.
- Avoid content rewrite scripts for source knowledge unless the user explicitly requests a mechanical migration. Scripts may be used for validation, inventory, or generated files, but source content decisions must be made entry by entry.
- Before creating a new knowledge entry, decide whether the idea should be a separate entry, merged into an existing entry, or combined with nearby concepts.
- Existing-entry revisions and new-entry additions use different gates. For existing entries, preserve correct content and only change what fails the guideline. For new entries, run the creation gate first: separate-entry need, overlap with existing entries, scope, source availability, category placement, related links, and quiz plan.
- Do not add a new knowledge file until the source/copyright basis and entry scope are clear enough to write a student-facing encyclopedia entry.
- Use official, public, or clearly reusable sources first.
- Use only sources whose reuse, citation, or student-facing rewrite conditions are clear enough for new content.
- Do not copy source paragraphs, images, tables, charts, worksheets, or diagrams into the wiki.
- Do not use NamuWiki, blogs, community posts, or unsourced summaries as source material for new knowledge.
- If a source's reuse or citation conditions are unclear, do not use it for new content.
- Historical people, events, and debates may be added only when they are broadly verified and written neutrally.

## Required Fields

Every new knowledge entry in `data/source/knowledge/**/*.json` must include:

- `id`, `title`, `summary`, `definition`, `lastReviewed`
- `subjects`, `mainTopic`, `subTopicPath`, `categoryPaths`, `topicTags`, `aliases`, `keywords`, `searchContexts`
- `chapters`, with large learning units and nested sections
- `quiz`, `related`, `sources`, `copyrightNote`

`quiz` must contain multiple-choice questions with `question`, four `choices`, `answerIndex`, and `explanation`. When a quiz is newly written or substantially revised, add `choiceExplanations` with four entries in the same order as `choices`.

Quiz writing rules:

- Write and revise quiz questions one knowledge entry at a time after reading that entry.
- Do not bulk-generate quizzes by swapping only the title, answer word, or category.
- A blank-fill multiple-choice question may use `type: "blank"` and must include `____` in the question.
- Add at most one blank-fill question per knowledge entry, and only when the blank checks a meaningful core term, year, person, cause, result, or principle.
- Do not force every knowledge entry into a fixed 3-question or 4-question count. Short entries may have fewer questions if more would be artificial.
- Avoid generic explanations such as “빈칸에는 ...이 들어갑니다.” Explain why the answer matters in that knowledge context.
- For `choiceExplanations`, the correct choice explains why it is correct. Each wrong choice must identify the specific wrong information in that option, not just say that the option is wrong.

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
jq empty data/source/taxonomy.json data/source/curriculum-map.json data/source/knowledge/digital/ai.json data/generated/knowledge-index.json data/generated/search-index.json data/generated/quiz-index.json
git diff --check
```
