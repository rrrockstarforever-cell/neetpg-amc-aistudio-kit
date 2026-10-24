# AMC Prep 0.9.3 — design/capability gap audit

## Scope and confidence

Read-only static audit of `C:\ad\amc-ext\src`, the **loaded** generated extension and app bundle, Electron main/preload/blocklist, and all **11** design `code.html` files under `stitch_neet_pg_design_system`. Only this report is written. No rebuild, app launch, database access, account/API request, or production edit was performed. “Implemented” means an executable code path is present, not a runtime acceptance-test pass. Findings apply to the loose app directory, not a separately installed/packaged ASAR.

`C:\ad\amc-app\package.json` is version **0.9.3**, main `electron/main.cjs`. `dist/index.html` loads classic `./assets/amc-ext.js` in the head **before** module `./assets/index-hjpHbpsQ.js`, and `index-BE34466W.css`. Only one hashed index JS is present. `dist/ext.js` (827,828 bytes) is **not referenced** by this entry HTML; do not mistake it for the active extension.

### Active implementation inventory

| File | Bytes | Local modification time |
|---|---:|---|
| `C:\ad\amc-app\dist\assets\amc-ext.js` | 132,492 | 2026-10-24T01:41:40 |
| `C:\ad\amc-app\dist\assets\index-hjpHbpsQ.js` | 996,026 | 2026-10-24T01:36:27 |
| `C:\ad\amc-app\electron\main.cjs` | 17,554 | 2026-10-23T22:45:14 |
| `C:\ad\amc-app\electron\preload.cjs` | 1,591 | 2026-10-23T22:45:14 |

Source files: `analytics.js`, `bank.js`, `bankview.js`, `chat.js`, `files.js`, `index.js`, `retrieval.js`, `rules.js`, `store.js`, `taxonomy.js`, `theme.js`, `style.css` (plus inactive `bank.js.bak3`). Electron has historical `.bak`, `.prechat`, `.prespeech`, `.pretts`, `.prewhisper` files; those are not the entry points. Whisper model/DLLs and speech/TTS helpers are present but were not executed.

## Executive result

1. **SRS is not absent:** FSRS scheduler, persistent cards, insertion helpers and a complete due-card rating screen exist in the main bundle. **That screen is orphaned by current routing.** The live Review route instead mounts the extension's analytics review. “Review later” can save cards that the current nav cannot review.
2. **Medical synonym expansion and master index already work at code level.** They are lexical retrieval + AI query expansion and a normalized cross-book index, **not** MeSH/ICD-11/embedding/HNSW engines.
3. Review has separate exam tabs, subject → topic drill-down, wrong/skipped/correct/all filters and generated-only AI tools. Search/trap/date/confidence/error-frequency filters, explicit flags, and remediation workflows are missing.
4. Exam mode has persisted choices, blind solutions until submit, marking and analysis. **No clock, pause, palette, flag state or per-question timing exists.** It renders all questions as a list. The design itself has a timer/flag and sample jumps, not a complete persisted palette state machine.
5. Browser is a real sandboxed Electron browser with always-on Focuser blocking. **Capture is miswired:** it writes the old Mock Review pending buffer then navigates to the new analytics Review, which never consumes that buffer.
6. Highlights, PDF/OCR library and AI/model/OCR settings are substantial existing features. Enriched highlight/SRS/export workflows, editable bibliographic metadata, library search/sort and storage-management settings remain gaps.
7. **Do not run `node build.mjs`.** Generated-only changes would be lost; reconcile source first in a later authorized implementation task.

## Capability matrix

`—` means the layer is not responsible; “orphaned” means code exists but current router does not reach it.

| Capability / design reference | src extension | loaded generated extension | loaded main bundle | Electron | Verdict |
|---|---|---|---|---|---|
| Flashcards/SRS: highlights + mistake notebook rating/due widgets | Missing | Missing | FSRS, cards CRUD, MCQ insertion, **orphaned** `Nh` due UI | — | Backend/UI code exists; reconnect, do not reinvent scheduler |
| Semantic synonyms: `semantic_medical_search_synonym_engine/code.html`, `#medical-query-input` | Lexical attachment ranking only | Adds library + banks retrieval | `Hh`, `Vh`, `Wp`, `Hp`: optional AI terms + lexical hits | AI transport | Basic search implemented; advanced semantic claims/design actions missing |
| Master index: `master_medical_index_topics/code.html`, `#topic-search-input`, `#filter-condensed`, `#filter-crossyield` | — | — | `Yh`, `Gh`, `Kh`, per-book index, source page links, filters, hide/split | — | Core implemented; synthesis/quiz/flashcard actions missing |
| Review: `mistake_notebook_review/code.html`, `#mistakeSearch`, `#subjectFilter`, `#trapFilter` | Hierarchy + result filters | Adds 3 exam tabs + Ask AI | Routes to extension, logs practice | — | Partial; generated ahead of src |
| Exam runner: `test_runner_active_exam/code.html`, `#exam-timer`, `#flag-btn`, `#flag-icon` | Module analytics | Idempotent module logging/analysis | `AmcModule`, `CmQ`, saved answers, submit, exam scoring | — | Core exam scoring exists; timer/palette/flags missing |
| Browser: `clinical_research_browser/code.html`, `#snap-btn`, `#extract-note-btn`, `#btn-to-mistake`, `#btn-to-ai` | — | — | `Bh`, nav/address/capture controls | WebContentsView + IPC/blocklist | Browser implemented; capture consumer broken; research scratchpad absent |
| Highlights: `clinical_highlights_saved_passages/code.html`, `#highlightSearchInput`, `#quickCaptureForm`, `#exportMenu` | — | — | `Rh`, saved selection/thread/source/search/delete | PDF saving primitive | Basic implemented; category/star/edit/capture/SRS/export absent |
| Library: `library_ocr_knowledge/code.html`, `#ragQueryInput` | File reading helpers | Chat library retrieval/picker | `Ep`, PDF import/OCR/index/subjects/reader | Searchable PDF + save PDF | Core implemented; rich metadata/filter/sort/diagnostics absent |
| Settings: `settings_ai_engine/code.html` | Theme | Enhanced chat model/voice controls + theme | `_h`, provider catalog/auth/test/apply, OCR controls | Native transport/speech | Core implemented; storage/sync/export/SRS reset absent |
| Practice: `practice_module_builder/code.html` | Banks/taxonomy | Banks + retrieval + rules + analytics | AI/notes/mistakes/3 AMC banks, exam/difficulty/topic/tag/mode | — | Large existing builder; no due-SRS pool, presets/reset/custom volume controls |
| Chat: `ai_chat_knowledge_engine/code.html`, `#ai-prompt-input`, `#pattern-drawer` | Base chat/patterns | New composer, retrieval, per-question tools, voice, web/image/slash actions | Bridge and reader overlay | Speech/network | Preserve generated-only functionality; no Anki/SRS sync |
| Analytics: `clinical_progress_accuracy/code.html`, `.exam-tab[data-exam]` | Basic tables/history | Separate exam cohorts | Module scores | — | Real counts/accuracy exist; remediation/history-open/export/coverage/pace projections absent |

The design HTML is a reference prototype: Tailwind config, sample clinical records/counts and small local interactions (filters, class toggles, timer/flag demo, toast). It is **not** a data/backend implementation. Do not import the fictional resident identity, “98.4% confidence”, national percentile, 3072d embeddings, HIPAA/GDPR guarantees, 2.5 GB support, or AVX-512 claims as facts about this app.

## Source/generated drift — baseline and concurrent-change warning

**Concurrent edits detected:** the source findings below describe the source snapshot read at the start of this audit. A final SHA-256 comparison detected changes to all 12 active src files (analytics.js, bank.js, bankview.js, chat.js, files.js, index.js, retrieval.js, rules.js, store.js, style.css, taxonomy.js, theme.js) made by another actor during the audit; this audit did not write them. For example, final src/index.js now includes the generated-only exports and chat.js grew to 64,881 bytes. Consequently the source/generated drift columns are a baseline, not a certification of the concurrently updated source. All eight tracked amc-app files (loaded dist/index, package, JS bundles and Electron entry/blocklist files) remained hash-identical. Re-audit the new source before deciding reconciliation is still needed. Do not build based only on the baseline findings.

`src/index.js` exports base chat/bank/analytics APIs. Loaded generated `window.__amcExt` additionally exports **`explainQ`, `notesQ`, `askQ`, `libContext`**. Its analytics has `progTab/inTab/tabsHtml/bindTabs`, exam-aware history and per-question Ask AI absent from `src/analytics.js`.

Generated labeled sections after the original chat include:
- `// ---- composer, voice, library search, question tools`
- `// ---- MCQ reader inside chat`
- two voice sections (legacy Windows/browser path and later whisper.cpp override)
- `// ---- Grok-style chat features: message actions, follow-ups, read aloud, chat list`
- `// ---- web search, image generation, slash commands (Grok subscription)`

These are executable generated-only code, not stubs to replace. `src/retrieval.js` is BM25-like token ranking; it alone does not reflect current library/bank context. Generated bank code also differs after normal import/export removal, so reconcile **all sections**, not just append the new exports. Main bundle patches (`__amcQTools`, routing, bridge, reader, etc.) are a separate preservation concern.

Future safe approach: snapshot/hash current active artifacts; reconcile generated behavior into source (in an isolated copy), export every referenced API, test parity, then rebuild only with authorization. The head-loaded extension must defer body insertions until DOMContentLoaded. No source reconciliation or build was done here.

## 1. SRS / flashcards

### Existing executable implementation
- Main DB `neetpg`, version **4**, store `cards`, keyPath `id`.
- CRUD: `Ie(record)` put; `Le(id)` get; `Re()` list; `ze(id)` delete.
- `Fm` is the FSRS instance; `Em(new Date)` creates a card. `Lm(record, rating, now=new Date)` computes and returns `{...record,card:next.card,due:next.card.due.getTime()}`. `Rm(record, now)` previews all four ratings and due dates; `zm(date)` formats intervals. Ratings `Im`: Again/Hard/Good/Easy.
- `Vm(record)` inserts **only if id is new**, preserving any existing schedule; adds `card`, numeric `due`, `createdAt`.
- `Um(q, metadata={})`: saves MCQ with id `m:` + `Bm(q.question)`, kind `mcq`, `text`, `options`, `correct:answerIndex`, `explanation`, subject/topic from **metadata** (not automatically q). `Wm(q)` checks existence. `Gm` uses these for “🔁 Review later” / “✓ In Review”.
- `Hm(oldMockQuestion)` schedules incorrect/skipped old mock records with `q:` id, kind `mock`, chosen/correct/explanation/subject/topic.
- `Nh()` loads `Re()`, selects `due<=Date.now()`, reveals answer, calls `Ie(Lm(card,grade))`, shows future next due, and allows removal.

### Wiring gap and extension anchors
`ng()` has `K('review', jsx(__AmcX,{m:'mountReview'}))` (actual string delimiters are backticks). `Nh` has **only its declaration** in application scope and no component reference. Therefore current Review does not show the FSRS deck, while Gm still writes to it. Reconnect as a distinct SRS subview/tab using `Nh` or factor its APIs; **do not replace** analytics Review or wipe `cards`.

Missing beyond reconnection: basic/front-back or cloze flashcard creation, highlight/chat/topic conversion, batch conversion, deck/category management, Anki export/import/sync, retained rating/review-log store and measured retention display. Existing records are MCQ cards. FSRS internals calculate logs, but `Lm` discards the returned log; do not claim retention history exists.

Card schema currently: `{id,kind,text,options,correct,chosen?,explanation,subject,topic,card:{due,stability,difficulty,elapsed_days,scheduled_days,reps,lapses,learning_steps,state,last_review},due:number,createdAt}`. Add optional fields without overwriting `card`/`due`. Existing SRS rows lack exam attribution; do not infer it silently or combine exam statistics. Due UI uses render-time Date.now, not a ticking refresh.

## 2. Semantic medical search / synonyms

Main screen `Hh({onOpen})` uses docs from `ge()`, subject filter, min query length 3, optional checked synonym control. `Vh(query,pin)` makes one AI JSON request `{terms:string}` capped at 25 words, with common medical terms/synonyms/abbreviations. Failure silently falls back to original query. `Hh` runs `Hp(await Wp(filteredDocs), original+' '+terms,12)` and opens `onOpen(docId,page)`.

Retrieval primitives: `Ip(pages)` chunks text with overlap, skips text under 40 chars; `Vp(passages)` builds token postings; `Hp(index,query,n=8)` scores lexical token/phrase overlaps and marks weak matches; `Wp(docs)` caches by doc id/pageCount/addedAt/textChars. Result shape includes `{docId,page,text,score,matched,weak}`. Search heading says scans cannot be searched, but OCR writes the same page text records—wording is stale for OCR-completed books.

Ask-your-books uses `Zh(query,pin)` terms + up to six subtopics and `Qh(query,options)` multi-query retrieval, not a vector engine. Generated `libContext(query)` separately uses cached pages (`PC`, `pagesOf`), token prefilter, `rank`, up to 8 chunks / 12,000 chars, then matches banks `emedici/success/amc`; returns `{block,src}` and explicit no-match guidance. Its page candidates truncate to the **first 2400 chars** after matching anywhere on the page; a hit later in page can be absent from supplied context. `PC` has no clear OCR invalidation API; main `Wp` key can also miss same-length text rewrites. Preserve/fix invalidation when extending retrieval.

Missing design features: displayed/editable expanded-term chips/path; retained lookup history; user aliases/MeSH/ICD mapping; embedding model/HNSW/vector storage; sort and pagination/load-more; exam-weight filtering; actual relevance/confidence calibration; result-specific save/copy/quiz/module actions.

Best insertion: extend `Hh` around stable strings “Add medical synonyms with AI” and `.hit` / `.hit-meta` / `.hit-text`, retain `terms` in state and show it rather than only a “synonyms added” message. Reuse `Vh`, `Wp`, `Hp`, and `amc-open-doc`; avoid creating a competing retrieval database. These main APIs are **not currently in __amcBridge**.

## 3. Master medical index

Implemented `Yh({onOpen})` (“Topics”): one combined index **per subject**. Docs contain `index:[{title,level,page}]`; `ve(docId,index)` saves it and `indexedAt`. `fp(docId,name)` schedules AI indexing with task status/abort; original per-book indexes remain intact. `Gh(indexes,overrides=[])` normalizes via `Wh/Uh`, merges matching normalized titles, accumulates `{docId,page,title}` refs, and sorts alphabetically. It supports override hide/split/join; only **hide/split/reset** are exposed in this UI. `Kh(topics)` finds lexical possibly-related titles but does not merge them.

`Yh` has subject selector, search title/ref text, chapters-only (`level===1`), 2+ references filter, missing-book indexing, counts, page chips, hide/split/reset; limits display to 400. Note “2+ books” is implemented using ref count, so do not extrapolate it into a semantic agreement score. Local keys `neetpg.topicOverrides` (array `{action,keys,title?}`) and transient `neetpg.topicsSubject`. Reader `$m` also has index search, expand/collapse, selected-topic page ranges and note generation (`Ym`, `Xm`).

Missing design: canonical entity IDs/tags/yield metadata, cross-book excerpt/synthesis panel, per-topic AI/MCQ/flashcard/quiz launch, coverage vs external syllabus, full re-index action/embedding stats. Page chips and filters already exist. Extend `.topic`, `.topic-head`, `.topic-refs`, `.topic-detail` inside Yh. Use topic refs for grounding via `be(docId)` and `onOpen(docId,page)`; reuse existing generation/notes paths instead of pretending normalized title matches establish clinical consensus.

## 4. Review / mistake notebook / progress

Generated `mountReview(el)` calls `bindTabs`, loads `allRows().filter(inTab)`, then `latestRows` per `questionKey`. UI: three exam tabs (`neet`,`ini`,`amc`), subject → topic folders (`.an-folder`), latest result statistics, `data-back`, `data-filter=wrong|skipped|correct|all`, expandable `.an-question`, answer choices/explanation/source and allowed clinical image. At question level it mounts Ask AI with `explainQ(row)`, `notesQ(row,{scope:'question'|'topic',depth:'brief'|'standard'|'detailed'})`, `askQ(row,text)`. All return HTML and sources; notesQ persists mocknotes through bridge.

Persistence:
- `amc-ext` DB v1 / `atts` store keyPath `id`.
- `analytics:attempts` → `{id,rows:[...question fields,questionId,subject,system,difficulty,choice,skipped,correct,ts,moduleId?,exam]}`.
- `analytics:module:<mod.id>` → `{id,mod,rows}`.
- localStorage compatibility `amc.attempts` capped **1200**, images omitted; module summaries `amc.module.summaries` capped **250**, generated version includes `exam`.
- `recordAttempt(q,choice,extra={})`, `recordModule(mod)` serialize via `analyticsQueue`; module ingestion idempotent by module id.
- `allRows` merges legacy cache + IDB, avoids duplicate ts/question keys; `latestRows` collapses same question to latest row. No data is intentionally removed by Review.
- `amc.prog.tab` selects exam; missing `exam` counts as **AMC**. `amc-attempts` refresh event. `mountProgress` reports all-attempt counts + subject/difficulty tables and eight recent module summaries **without clickable review links**.

Missing: full-text/subject dropdown independent of drilldown, trap attribution data/UI, date/source/flag/confidence filters, sorting, failure-count badges, explicit unresolved/mastered state, personal annotations, flag toggles, fast drill from chosen rows, SRS panel, export and module-history reopen. Data exists for raw repeat attempts, but no failure-count view. Review latest-state and Progress historical counts must remain distinct.

Exact hook: extend `mountReview` local state and `selected/list` filter before rendering `.an-filters`; compute repeat/error counts from uncollapsed **exam-filtered** rows. Store annotation/flag/remediation metadata separately by `(exam,questionKey)` rather than mutating analytics evidence. Reuse `explainQ/notesQ/askQ`, not new prompts.

Risks: selected subject/topic is not reset when exam tabs change, so a different exam can appear empty until All subjects is clicked. `bindTabs` adds an anonymous element listener with no cleanup; repeated mount into reused elements can accumulate listeners. `questionKey` strips non-ASCII/punctuation from stem when no id, so collisions are possible. `AmcModule` “my mistakes” is legacy-cache-based and separates **AMC vs non-AMC only**, not NEET vs INI; it is not a due-SRS pool.

## 5. Exam runner / timer / palette / flags

`AmcModule` config key `amc.cm.cfg`; current module `amc.cm.cur`; generation log `amc.cm.log`. Initial config `{exam,n:10,diff:'all',lvl:1,src:'ai',spec:'all',subs:[],topics:{},tagMode:'all',tags:[],pres:[],mode:'regular',...saved}`. Meta `{exam,mode,id:Date.now(),answers:{},submitted:false}`, later `{qs,title}`. Questions use `{question,options,answerIndex,explanation,subject,topic,...}`. `saveMod(m)` updates state and localStorage. Exam `CmQ` writes `answers[index]=choice`, disables option changes only after submission, and withholds rationale until `rev=mod.submitted`.

`submit()` confirms, sets `submitted:true,finishedAt:Date.now()`, calls extension `recordModule(fin)`, saves and shows summary. `__cmExam` defines exam marking; score uses correct/wrong/skipped. Regular `Gm` reveals immediately, logs via `window.__amcLog`, has Retry/Review later and question AI tools. In regular mode current module answers are **not** populated by Gm, so refreshing/remounting loses per-card selection UI even though attempts were logged. Module-id/exam association for regular logging needs careful extension rather than assuming exam-mode resume semantics.

**Absent in active module code:** timer/countdown/elapsed, start timestamp, pause accounting, per-question dwell, auto-submit/expiry, current question index, previous/next/jump/palette, visited/answered/flagged/current state and confidence. Existing exam is an all-question scrolling list, not the design's single-question runner. No separate Test Runner nav route. Design `#exam-timer` and flag handler are demo-level and cannot be lifted as persistent logic.

Extension points: `const meta={exam:cfg.exam,...}`, `saveMod`, `submit`, and `if(view==='module'&&mod)` render branch; `CmQ({q,n,ch,onPick,rev})`. Preserve question array/order and option order in an active session. Add optional `runnerVersion,startedAt,deadlineAt,pausedAt,pausedMs,currentIndex,visited,flags,timeByQuestion` with migration defaults; timer must derive from timestamps, not count setInterval ticks. Guard auto-submit against repeat logging and use recordModule idempotency. Keep exam solutions hidden. A palette is new functionality requiring a state model, not styling an existing control.

## 6. Browser and capture pipeline

Renderer `Bh({onCapture})`: URL/search normalizer `zh`, `.browser-page/.browser-stage`, back/forward/reload/stop, address bar, screenshot and page-text capture. Native bridge (preload):

```js
native.browser.open(url?)
native.browser.setBounds(boundsOrNull)
native.browser.go(url)
native.browser.action('back'|'forward'|'reload'|'stop')
native.browser.block() // report only, no setter
native.browser.capture() // PNG base64
native.browser.text() // {title,url,text}
native.browser.onState(cb) // returns unsubscribe
```

Main IPC channels `browser:open`, `:bounds`, `:go`, `:action`, `:block`, `:capture`, `:text`; state event `browser:state`. Uses isolated `WebContentsView`, `persist:browser` session, sandbox/contextIsolation, nodeIntegration false, denied permissions. Main UI has separate storage. `fromMain` gates IPC. `blockOn=true` is fixed. `blocklist.cjs` unions bundled snapshot with **read-only** Focuser DB lists when available, matches parent domains/wildcards. **Never introduce an unblock toggle.**

### Confirmed static wiring defect
`Bh` calls `Th({image:Blob,source})` or `Th({text:text.slice(0,6000),source})`, then `onCapture()`. `Th` writes single in-memory `wh`; `Eh()` consumes it. Only **old `jh()` Mock Review** consumes Eh and OCRs/saves via `Ae/Hm`. Current `ng` passes `onCapture:()=>i('review')`, which mounts **`mountReview`**, not jh. jh has only its declaration and is not routed. Captures therefore never enter visible review or persistent question storage through this route; the pending buffer is overwritten by the next capture/lost on reload.

Repair later by routing capture into a real ingestion panel or exporting/consuming a payload event, not by recreating the browser. Reuse screenshot/OCR parser `vh` and old mock save schema `{id,createdAt,source,text,options,chosen?,correct?,result,subject,topic,explanation,ocrText?,image?}` and `Ae/je/Me` if retaining old questions store. Do not blindly store raw screenshot as an answered/scored question.

Missing design: persistent scratchpad/clips, source URL/DOI/citation extraction, curated result/evidence filters, bookmarks, quick launches, audit log/blocked counter history, selected-text capture, “send to Chat”/“save pearl”. Capture page text currently reads body innerText, **not selected text**, and screenshot captures the browser view. Store URL/time alongside title if adding provenance. External content stays untrusted. No browser/network path was exercised.

## 7. Highlights / saved passages

Main `Be(record)` put, `Ve()` list newest first, `He(id)` delete in `neetpg/highlights`. Selection Ask AI panel (`async function w` near `Be({id:I()...`) saves `{id,createdAt,text,source:{label,docId?,page?},thread:[{role,text,web}]}`. `Rh({onOpen})` lists quote/source/date/full thread, searches text + thread + source.label, offers Open book/Delete.

Missing: categories/subject/tag chips, stars, edit personal memory note, manual quick capture, browser/chat direct save, quiz/flashcard conversion, batch selection/SRS, JSON/PDF/Anki export and retention widgets. Existing save is from the note/selection Ask AI workflow, not universal save across every chat/exam/browser surface. Open book currently calls only docId: **saved source.page is displayed but discarded during navigation**.

Hooks `.sel-panel`, “🔖 Save highlight”, `Rh`, `.sel-quote`; bridge does not expose highlight CRUD. Extend source-aware callbacks to `(docId,page)` using `amc-open-doc` and preserve source/thread. Add optional `subject,tags,starred,memoryNote,updatedAt,srsCardIds,origin` to records. Defaults must support old rows; search currently assumes `thread` and `source.label`, so normalize imports/manual quick captures to the existing shape.

## 8. Library / OCR / metadata

`Ep({onOpen,onCombined})` imports PDFs (file input and dropzone), extracts page text via `ju`, stores original file, auto-detects subject from content, supports manual subject override / AI for unclear, subject groups, per-book AI index, combined subject index, missing-page OCR, forced full OCR, searchable PDF save and delete. Reader includes PDF, index and notes/tools; opening a PDF is not a missing feature.

Import doc shape `{id,name,size,pageCount,textChars,addedAt,needsOcr,ocrPages,subject,subjectSource}`; optional `index,indexedAt`. Pages `{docId,page,text,ocr?,boxes?}`; files stored keyed by doc id. APIs:
- `he(doc,file,pages)` transactional docs/files/pages insert; `ge()` list; `_e(id)` get doc; `ye(id)` original file; `be(id)` ordered pages.
- `ke(docId,subject,source='manual')` updates subject while preserving fields.
- `ve(docId,index)` index write; `Se(docId,page,text)` OCR text + word boxes; `Ce(docId)` recomputes text/OCR totals.
- `pp(docId,name,force?)` background OCR; `fp(docId,name)` background indexing; task bus `ap`, task stop `hp`.
- `we(docId)` deletes docs/files/pages/notes (not every question/highlight/card that may reference a doc).
- `amcSrch(docId,name)` → `native.makeSearchable(bytes,pages,name)` → `pdf:searchable`; never modifies original PDF. PDF save `native.savePdf(html,name)` → `pdf:save`.

Missing design: library search, Recent/Size sort, editable name/author/edition/ISBN/tags/cover, per-book last-opened/reading progress, per-subject semantic graph and direct configured MCQ launches, measured diagnostics (RAM/thread/latency), real vector status. No explicit 2.5 GB validation/support guarantee. Subject grouping and index/OCR progress are real; bibliography and vector badges are not.

Extend `.doc-card/.doc-name/.subject-pick`, `Ep` group sorting and doc update API. Put metadata into existing docs via merge; do not reimport to edit metadata or change document ids. Source deletion policy should retain orphan provenance or warn, not silently cascade away saved highlights/cards. OCR is local; AI classification/indexing/retrieval answer generation can send text to configured providers—do not claim all inference is offline or zero cloud leakage.

## 9. Settings / AI / storage

`_h({notice})` uses `id()` settings read, `od(settings,provider)` config resolution, `ad(settings)` applied write; key `neetpg.ai.settings`. Draft vs applied controls, Test connection through fd, provider catalog `Hu/Wu`, model picker `hh` with live-account/catalog filtering, custom model id, catalog refresh, provider configuration and subscription login/logout flows are already coded. UI states pending login reset when provider changes. Nothing was authenticated or tested here.

OCR `Gf(localStorage)` key **`neetpg.ocr.settings`**, `{mode:'fast'|'compatible',workers:'auto'|'1'|'2'|'4'}`. Compatible forces single worker; fast uses SIMD and fallback; automatic workers capped at 4, lower cap for reported <=4 GiB. It does not establish AVX-512 support. Theme `initTheme` uses `amc.theme` Light/Dark/System via `html[data-theme]`. Generated chat keys include `amc.chat.think/search/lib/effort`; preserve those settings separately from model connection defaults.

Missing settings design: measured memory/live vector status, export all notes/pearls, safe PDF chunk-cache cleanup, reset SRS schedules, cloud/Google Drive sync (explicit “Coming next”/“Coming Soon”, not a functioning feature). No general backup/restore manager. Add opt-in bounded export/reset actions through existing storage APIs; never clear all localStorage/IndexedDB as cleanup. NativeTheme is fixed light at Electron shell level while app HTML theme is controlled separately; do not confuse this comment with absence of dark UI.

## Data/API map for implementation without data loss

| Store / key | Meaning | Existing access |
|---|---|---|
| `neetpg` v4 / docs, files, pages | Book metadata, original PDFs, page text/boxes | `he/ge/_e/ye/be/ke/ve/Se/Ce/we` |
| `neetpg` / notes (byDoc index) | Reader notes | `Te/Ee/De/Oe` |
| `neetpg` / questions | Old screenshot/mock questions | `Ae/je/Me` (currently orphaned jh UI) |
| `neetpg` / mocknotes | Question/tool notes | `Ne/Pe/Fe`, bridge `saveNote:Ne` |
| `neetpg` / cards | Existing FSRS cards | `Ie/Le/Re/ze`, `Vm/Um/Hm/Lm/Rm` |
| `neetpg` / highlights | Saved passages and conversation | `Be/Ve/He` |
| `amc-ext` v1 / atts | Attachment texts, banks, analytics | `putAtt/getAtt/delAtt` internal to extension |
| `bank:amc`, `bank:emedici`, `bank:success` in atts | Bank object/questions, seed metadata | `importBank(file,bank)`, `bankInfo(bank)`, `pickFromBank(options)`, `browseBank`, `bankTree` |
| localStorage `amc.bank.seen` | Separate seen history per bank | `pickFromBank/resetSeen`; do not reset on UI redesign |
| `amc.attempts`, `amc.module.summaries`, `amc.prog.tab` | Compatibility cache, history, selected cohort | Generated analytics functions |
| `amc.cm.cfg`, `amc.cm.cur`, `amc.cm.log` | Practice config/current module/log | `AmcModule`, `saveMod` |
| `amc.chats`, `amc.patterns`, `amc.patterns.hist` | Chats + prompt rules/profile undo | `LS`, chat helpers, `patterns/savePatterns/undoPatterns` |
| `amc.ask.draft`, `amc.ask.hist` | Ask-books state/history | Main Ask screen (preserve) |
| `neetpg.topicOverrides`, `neetpg.indexOpen.<docId>` | Topic edits, reader index expansion | `Jh/Yh`, `Qm/$m` |
| `amc-recalls` v1 / papers | Legacy recall PDF data | `__amcOpen/__amcIo` |
| `persist:browser` | Research-browser cookies/storage | Electron dedicated partition; never use for app records |

### Current explicit bridge boundary

```js
window.__amcBridge = {
  wd, saveNote:Ne, uid:I, loadCatalog:Hu,
  catalog:dv => Wu(dv).filter(e=>Ju(e.id)&&!e.status).sort(Ku),
  fd, yd, sd, id, od, X, providers:()=>[...Zu,...Y()],
  ju, vh, Hf, Gf, pdf:$c, render:__amcRender,
  ge, be, hold:__amcHold, exam:()=>!!__AMCX
};
```

This is the existing public access from generated extension into module internals. **SRS/highlights/doc updates/search-index helpers are not exposed.** Add narrowly scoped bridge entries in a future task if new extension views need them; module functions are not automatically `window` globals. `wd` normalizes notes and `saveNote` writes mocknotes, not highlights or cards. `bridge.exam()` is a boolean mode flag, not NEET-vs-INI discrimination.

Generated `window.__amcExt` exports `mountChat`, bank/taxonomy functions, `recordAttempt`, `recordModule`, `summaryHtml`, `mountReview`, `mountProgress`, `md`, `rulesFor`, and generated-only `explainQ/notesQ/askQ/libContext`. Hooks/events: `amc-attempts` for analytics refresh; `amc-open-doc` with `{docId,page}` to route reader. `__AmcX({m})` calls extension mount and cleanup. Long tasks must use fd/ju/Hf wrapping or `hold` so screen retention works. Keep extension top-level names unique (one concatenated scope).

## Exact re-find anchors

APP = `C:\ad\amc-app\dist\assets\index-hjpHbpsQ.js`; EXT = loaded `amc-ext.js`. Offsets below are **zero-based Python Unicode character offsets after UTF-8 decode and universal newline normalization**, not byte offsets. They are baseline aids only; re-find exact strings and assert uniqueness in application scope before editing. Some minified names also occur inside React's own closure, so never patch a bare name alone.

| File | Exact anchor | Character offset(s) |
|---|---|---:|
| APP | `function ng(){` | 968749 |
| APP | `window.__amcBridge=` | 994145 |
| APP | `function Ep({` | 781573 |
| APP | `function Hh({` | 941582 |
| APP | `async function Vh(e,t)` | 941144 |
| APP | `function Gh(e,t=[]` | 945014 |
| APP | `function Yh({` | 946334 |
| APP | `function Nh(){` | 928917 |
| APP | `function Lm(e,t,n=new Date)` | 819763 |
| APP | `async function Vm(e)` | 820338 |
| APP | `function Gm({` | 820968 |
| APP | `function CmQ({` | 877466 |
| APP | `function AmcModule(){` | 880366 |
| APP | `const meta={exam:cfg.exam` | 882430 |
| APP | `function submit(){` | 888721 |
| APP | `function Rh({` | 936052 |
| APP | `function Bh({` | 937880 |
| APP | `var wh=null,Th=e=>` | 918789 |
| APP | `function jh(){` | 919367 |
| APP | `function _h({` | 903319 |
| APP | `function Gf(e=localStorage)` | 767049 |
| APP | `function pe(){` | 225804 |
| APP | `async function Ie(e)` | 229158 |
| APP | `async function Be(e)` | 229379 |
| EXT | `function progTab()` | 42371 |
| EXT | `function recordAttempt(` | 44983 |
| EXT | `function recordModule(` | 45878 |
| EXT | `async function allRows(` | 46720 |
| EXT | `async function mountReview(` | 48318 |
| EXT | `async function mountProgress(` | 54409 |
| EXT | `async function libContext(` | 83411 |
| EXT | `async function explainQ(` | 93415 |
| EXT | `async function notesQ(` | 94841 |
| EXT | `async function askQ(` | 94291 |
| EXT | `window.__amcExt =` | 118801 |

Stable DOM/data anchor pairs: `Hh` + “Add medical synonyms with AI”; `Yh` + “One combined index per subject”; `Nh` + “Questions you got wrong come back on a schedule”; `Gm` + “🔁 Review later”; `AmcModule` + `amc.cm.cur`; `Rh` + “Passages you saved from Ask AI”; `Bh` + “Capture screenshot → Mock review”; `_h` + “Apply AI model”; generated mountReview + `.an-question`/`data-filter`; Electron `const blockOn = true` + `browser:block`.

## Prioritized implementation backlog (not performed)

**P0 — preservation and broken wiring**
1. Reconcile generated-only source drift before any rebuild; preserve user databases and current session records.
2. Restore reachable SRS due review using existing cards/FSRS; add tab without replacing analytics Review.
3. Repair browser capture ingestion/consumer route; preserve provenance and unknown-answer quarantine.

**P1 — functioning design gaps**
4. Add timestamp-based exam clock/pause/expiry and single-question navigation/palette/flags with saved-state migration; maintain blind exam answers.
5. Add review text/subject/trap/date/flag filters, sorting, repeat counts and explicit remediation/targeted drill; no invented trap attributions.
6. Add highlight quick capture/edit/tags/star plus existing source-page routing fix, SRS conversion and real exports.
7. Add master-index topic actions / excerpt synthesis and search expansion visibility/edit/history, using present grounding/retrieval.

**P2 — library/settings/data management**
8. Add merge-only bibliographic metadata, library query/sort, real task diagnostics.
9. Add bounded backup/export/import/cache management and SRS reset confirmation; cloud sync only if implemented and verified later.
10. Analytics drill-through/remediation/PDF report; show only measured coverage, pace and retention. No national cohort/rank/projection values without a real source.

## Verification limits and integrity

All 11 design code.html files were read and inventoried. Application control flow, storage shapes, bridge exports and Electron IPC were inspected statically. No GUI, AI/OAuth, browser capture, PDF OCR/export, FSRS rating or packaged installer flow was executed. Critical capture/SRS findings follow concrete unconsumed/orphaned routing, not a visual screenshot guess. Design PNGs were not used for visual/layout acceptance; this is a capabilities audit, not a pixel comparison.

No production files were modified. No source rebuild, dependency install, external call or account operation occurred. Only `C:\ad\design\stitch094\gap-audit.md` is the deliverable.
