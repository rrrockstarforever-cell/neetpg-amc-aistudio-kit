# Design HTML functional requirements audit

Source: C:/ad/design/stitch094/stitch_neet_pg_design_system

Audited all 11 code.html files and the single clinical_focus/DESIGN.md. Full source files were loaded and inspected through visible text, controls, inline scripts/events and resources. This is static-source analysis, not browser execution or an audit of the existing Electron app. No application or design source was modified.

Legend: controls specify intended functionality; prototype describes source behavior actually present; sample means illustrative content, not required literal values. Implementation expectations below derive from explicit controls/copy, not screen names.

## Source manifest

| Relative directory (code.html) | Lines | Bytes |
|---|---:|---:|
| ai_chat_knowledge_engine | 425 | 41229 |
| clinical_highlights_saved_passages | 867 | 53145 |
| clinical_progress_accuracy | 644 | 43064 |
| clinical_research_browser | 371 | 35838 |
| library_ocr_knowledge | 504 | 44138 |
| master_medical_index_topics | 847 | 52203 |
| mistake_notebook_review | 703 | 54619 |
| practice_module_builder | 656 | 52208 |
| semantic_medical_search_synonym_engine | 717 | 45340 |
| settings_ai_engine | 400 | 35300 |
| test_runner_active_exam | 385 | 37272 |

The additional DESIGN.md was read in full. It is a design system, not another application screen.

## Shared shell and navigation

- Sidebar: Library, AI Knowledge Engine, Ask Your Books/RAG, Medical Index/Topics, Practice/Modules, Test Runner/Exam, Mistake Notebook, Performance Analytics, Settings. Newer exports also show Highlights/Saved and Clinical Browser. All use hash-placeholder href with data-path identifiers; no supplied routing implementation.
- Normalize conflicting route aliases: ai-chat-knowledge-engine/ai-knowledge-engine; search-medical-index/medical-index-topics; practice-module-builder/practice-modules; test-runner-active-exam/test-runner-exam; review-mistake-notebook/mistake-notebook; settings-ai-subscriptions/settings-engine. Do not create duplicate screens from aliases.
- Ask Your Books has no separately named HTML screen; its concrete feature evidence comes from library RAG and semantic search.
- Stream buttons vary NEET/INI versus AMC CAT or NEET PG versus AMC CLINICAL. They imply persisted exam context. Exam-specific datasets must remain separate, explicitly stated in notebook copy.
- Global search inputs advertise diseases, textbooks, clinical stems, chapters, tables and references; no implementation. Command-K/Command-F hints need platform-appropriate keyboard wiring.
- Theme/Light-Dark buttons appear in several shells; darkMode class configuration is not a working theme toggle. Persist selection and provide actual dark colors.
- Notifications and identity are affordances without supplied notification/profile/login workflows. Do not invent account/billing features from them.
- Countdown, pace, OCR Live, indexed counts, resident identity and version labels are status/sample fields, not required hardcoded values.

## library_ocr_knowledge

**Purpose:** local PDF ingestion, categorized library, OCR diagnostics and grounded retrieval.

**Concrete controls/features:**
1. SIMD 4-Core Active settings button: open engine settings and show actual capability/worker state.
2. Auto-Categorize: categorize imported documents by specialty; mechanism unspecified.
3. Import Medical PDFs plus drop/browse area: native picker and drag-drop ingestion. Copy advertises up to 2.5 GB PDF; implement bounded background handling or disclose actual limit. No file input/ingestion handler supplied.
4. Search books by title/author/specialty; clear icon; By Specialty/Recent/Size sort controls. Filter/group actual documents with empty state.
5. Specialty overflow menus: actions unspecified, not justification to invent destructive menus.
6. Explore Topics, Open Pathology Graph, Organism Directory, Neuroanatomy Map, Surface Markings: document/topic-scoped navigation. Exact graph/map interface unspecified.
7. Generate 50 MCQs, Histology Quiz (40), Generate Gram Qs, Brachial Plexus Qs, Image-Based MCQs: launch builder/generator with source/topic/format context. Counts 50/40 are explicit action presets.
8. Force OCR Rescan icon: re-extract selected source with progress/errors. Export Flashcards icon: actual document-derived card export; format unspecified here.
9. ragQueryInput: retrieve grounded passages. Corpus radios are Books Only/strict local, Books + General Medical Knowledge, Books + Australian Guidelines/eTG; keep scopes distinct.
10. View PDF Page: open actual source at physical/printed page mapping. Launch Deep Clinical Chat and Summarize to Notes: transfer query/evidence/citations or persist summary.

**Prototype:** native inputs/radios only; no JavaScript beyond Tailwind config. No import/OCR/search/RAG/export engine.

**Sample/decorative:** seven books claimed but six cards shown; example titles/covers, sizes/pages, OCR bars, 612 pearls, snippets, 98.6% match, 31,480 chunks, 14.2 ms, 1.2 GB/16 GB. These imply metadata/jobs/diagnostics, not licensed textbook assets. Zero hallucinations and HIPAA/GDPR isolated are unverified claims.

**Offline:** local parser/renderer, OCR/WASM/language data, embedding model/index and original PDFs must be provisioned. Hybrid AI and eTG need network/provider or licensed local corpus. Strict Books Only must not silently upload passages.

## ai_chat_knowledge_engine

**Purpose:** cited medical tutoring, vignette generation and editable persona/prompt rules.

**Concrete controls/features:**
1. Learned Rules & Persona toggle-drawer-btn shows pattern-drawer. Clinical Reasoning Chain chevron implies evidence-summary disclosure, not model internal reasoning access.
2. Send to Mistake Notebook, Copy Stem, Save to Flashcards: save generated content with provenance, copy text, create SRS card. Thumbs up/down record feedback; use unspecified.
3. Four starter buttons fill composer: PPH India/Australia comparison, pediatric stridor differential, Robbins glomerulonephritis synthesis, five AMC snake-envenomation stems.
4. Attach PDF/Book; Deep Reasoning; Search Textbooks; Books & MCQs; Generate Vignettes: document/context, request-mode and output-type controls. Exclusivity unspecified.
5. Engine select shows Claude 3.5 Sonnet Pro Bridge, GPT-4o Clinical Multi-modal, Ollama DeepSeek-R1 32B Medical, Gemini 1.5 Pro 2M RAG. Bind configured available models, not fictitious connections.
6. ai-prompt-input textarea, microphone, Send: compose/send with pending/error/cancel/retry. Shift-Return line break advertised; send keyboard behavior absent.
7. Persona Switch; range difficulty 1..5 initial 5; Add Rule; four remove-rule buttons; Import .json; Export Rules. Persist actual persona/constraints and validate imported schema. Sample AMC persona describes five-option clinical reasoning and safety/ethics context.
8. Auto-Sync to Anki & SRS checkbox: distinguish internal local SRS from external connector.

**Prototype:** drawer visibility and Deep Reasoning CSS toggles; four starter onclick handlers fill textarea. Native select/range/checkbox only. No AI, attachments, rule persistence, speech or sync.

**Sample/decorative:** conversation/timestamps, pre-revealed correct vignette one of ten, board pearl/citations, 14 textbooks/384 notes, 98.4% confidence, 1.4-second response and four rules. Response option cards do not establish a complete exam interaction.

**Offline:** generation needs installed local model/runtime plus retrieval, otherwise cloud auth/network. Dictation needs local speech or disclosed service. Rule JSON/internal SRS can work offline; Anki requires genuine exporter/connector/application.

## semantic_medical_search_synonym_engine

**Controls:** medical-query-input, clear query, Search Repository, subject/book select (All, Microbiology/Virology, Internal Medicine, Pathology, Pharmacology, Pediatrics); AI synonym-expansion checkbox; Edit Synonyms; Semantic Relevancy sort affordance (no alternate options supplied). Run actual scoped retrieval, display original/expanded terms separately and allow edits.

Per-result actions: Open Book at Page 118/1122; Create 5 Qs from passage; Save Highlight; Copy Citation; Add to Study Module; View Diagram & Table; Add to Mistake Note. Resolve source document/page IDs, preserve provenance and route selected passage into generation/module/notebook. Load 25 more matches implies pagination. Recent Clinical Lookups rows plus Clear imply history recall/clear. Exam-weight checkboxes NEET/INI, AMC, USMLE and Apply Weight Filters imply composable filters; overlapping counts must not be summed.

**Prototype:** Enter only briefly scales the first section button; no search. Other fields are native UI, no retrieval/expansion/pagination implementation.

**Sample:** vancomycin query/path, six-synonym claim with five visible chips, 28 results/three illustrated cards, table, match percentages, distribution donut, 8 books/1.42M chunks, MeSH/ICD versions, text-embedding-3-large 3072d and recent queries. Tables/search-term highlighting are supported content types, not literal clinical seed data. Susceptibility image is a remote CSS background.

**Offline:** locally compatible embeddings/index required. Named OpenAI embedding service normally needs internet; cached vectors do not provide offline query embeddings. Changing dimensions/model requires compatible re-indexing. Provision local MeSH/ICD mapping data/licensing. AI expansion/generation need local model or network. Bundle image.

## master_medical_index_topics

**Controls:** Index 1 unindexed book queues real pending source; Target Discipline select scopes Pharmacology, Anatomy, Pathology, Microbiology, Medicine, Surgery, OBG; topic-search-input filters clinical term; Chapters only condensed checkbox changes density; Only topics in 2+ books cross-yield checkbox filters distinct source count. Combine all filters.

Topic cards imply stable topic IDs, aliases/tags, book IDs and page lists. Actions: Generate 10 MCQs, Generate MCQs/Practice, Launch Case Scenario, Ask AI about this topic, Study Flashcards (18), Open PDF to page, View Comparative Excerpts, Cross-Compare, Compare Protocols. Route actual selected topic/evidence; only explicit ten-question action fixes count. Comparative excerpts must preserve source disagreement rather than fabricate consensus.

Cross-Book Synthesis panel shows active entity/excerpts/citations/pearl. Add to Notebook persists cited synthesis. Audio Summary (1m) needs real generation/playback. Launch Cross-Indexed Quiz advertises targeted 15 MCQs. Re-index all queues rebuild with progress/failure and safe replacement.

**Prototype:** keyword filter hides cards. Cross-yield handler only unhides all when unchecked; not a real source-count filter and can override search. No condensed view, discipline switching, topic selection, synthesis or generation logic.

**Sample:** seven antimicrobial topic cards/IDs, two-volume badges, page references, tags, synthesis text, 94.8% predicted AMC yield, coverage bars and 142 MB. Counts/verification/100% agreement labels are not clinical evidence.

**Offline:** local extraction/entity index and stable document locators. AI synthesis/quiz needs local model or internet; audio local TTS or disclosed service.

## practice_module_builder

**Controls and concrete behavior:**
- Recent Presets/Reset: restore stored configuration or coherently reset all fields/summary.
- Exam radios: NEET PG (+4/-1, single best/image-based), INI-CET (+1/-1/3, multiple-completion/assertion-reason), AMC clinical reasoning/triage/ethics. These are supplied copy, not verified current exam policy; store configurable rule snapshots.
- Count 10/20/30/50/100/Custom: actual numeric count; custom needs validated input and eligible-pool checks.
- Difficulty All/High-Yield/Standard/Basics; source checkboxes AI Clinical Vignettes, My Uploaded Books/RAG, Spaced Mistake Bank. Support real selected scope, eligible counts and deduplication.
- Format/tag toggles, Select All/Clear: ClinicalVignette, ImageBased, DrugOfChoice, MultipleStatements, InvestigationOfChoice, AssertionReason, MatchTheFollowing, EmergencyTriage, RecentUpdates, Eponyms/Criteria, Sequencing/Staging. Runner must actually support selected formats.
- Target Weakness Only/Standard Distribution: weighting strategy. Specialty accordion parent/child checkboxes: Pharmacology, Medicine, Pathology/Microbiology and visible subtopics; maintain parent partial state.
- Expand All 16 Subjects: reveal others. Taxonomy conflicts with 19 subjects elsewhere; do not assume either is authoritative.
- Tutor versus Exam Simulation: tutor immediate rationale, pearls/mnemonics, pause/resume/annotation; simulation timer/penalties and hidden solutions until submission. Proctored Pressure wording does not specify webcam proctoring.
- Launch Specification: live count/exam/domain/penalty/citation/duration summary. Generate & Launch Module must produce/select a validated full set then enter runner. Review Solutions & Spaced Retest opens last actual attempt and remediation.

**Prototype:** setCount changes two labels/styles; Custom displays a question mark, no numeric input. Tag/select-all/clear CSS toggles. Three specialty div headers toggle accordions; checkboxes stop propagation. Native radios/checkboxes only. No persisted configuration, pool query or launch.

**Sample:** 12,480 available, 8 books, 142 weak points, 3 specialties/48 subtopics, mastery values, daily pulse, last module, percentile and exam-year pearl. Static selected counts disagree with visible children. Duration/rank/retention formulas absent.

**Offline:** local bank/mistakes can be selected offline; generation needs local/cloud model. Image questions need local assets. National percentile needs genuine reference dataset, not fabricated local estimates.

## test_runner_active_exam

**Controls and concrete behavior:** flag-btn persists per-question review flag; Pause/End Module operate on actual session and distinguish ending from submission. Elapsed/remaining timer depends on execution mode. A-D radios must accept valid answer before reveal; export is post-answer with B checked and others disabled. Confidence High (100%) is status only: no confidence-entry mechanism supplied.

Add Personal High-Yield Note and Save to Notebook persist annotations/pearl with question/source linkage. Rationale panel includes correct/incorrect state, statement-wise explanation, trap, pearl and citations; hide until permitted. Contest Question and Share Stem need defined destination/share method, not fake success.

Previous, Jump 10/11/12/13, Next navigate without losing responses/notes/flags. Submit Test finalizes once, computes exam-specific score and persists review/analytics. Coming Up Next previews have no handler; determine if permitted during simulation. Thin segmented strip is a progress visualization, not supplied numbered palette buttons.

**Prototype:** flag CSS/icon state only; timer increments from sample 862 seconds. Pause does not stop timer; navigation/submit inactive; reload loses state.

**Sample:** Q10/20, VRE multi-statement question, correct B, 68% target accuracy, 82% cohort/faculty badge, citations and next-stem previews. Not a real question bank or validated faculty review.

**Offline:** timer/scoring/navigation/local attempt persistence need no network. Stored explanation works offline; generation needs local/cloud model. Contest/external sharing require service; clipboard/export can be local. Restart recovery and end-of-block/invalid-question states missing.

## mistake_notebook_review

**Controls:** NEET PG/INI-CET/AMC tabs must select separate datasets (copy explicitly forbids adding across exams). mistakeSearch searches stems/traps/citations/IDs. subjectFilter All Subjects (19), Pharmacology, Pathology, Medicine, Pediatrics; trapFilter Conceptual Gap, 50:50 Gamble, Negative Cue Misread, Image Distractor Ambiguity; sort newest/error-frequency/low-confidence. Compose filters and actual counts.

Export Mistake Anki Deck exports actual scoped records. Clinical Rationale accordion reveals references. Per-card Launch 5-Q Re-drill, Remove Flag, Add Private Note and Add to SRS Anki Flashcards require real persistent mutations/context transfer. Later unlabeled icon buttons need accessible names. Review Rationale and Keep in Mastered Bank retain resolved history. Start 15-MCQ Sprint targets unresolved errors and handles insufficient pool. Save to Flashcards saves daily pearl; Review SRS Flashcard Stack opens true due queue.

**Prototype:** tabs change styles only; search filters all article elements and may hide sidebar articles. First rationale accordion toggles inline. No export, remediation, SRS or persistence.

**Sample:** four mistakes with chosen/correct distractors, failed/resolved counts, 38 total/22 corrected/16 unresolved/7 due, attribution bars, +14% score lift, daily pearl and remote renal-biopsy image. Preserve content structure/history, not literal medical examples or projected gains.

**Offline:** local attempts/notebook/SRS work offline; adaptive generation local/cloud. Deck export local-capable; external Anki integration separate. Bundle licensed image or placeholder.

## clinical_progress_accuracy

**Controls:** NEET/INI/AMC tabs filter all metrics/history. Sort Lowest Accuracy/Highest Volume/High-Yield Gap (gap formula unspecified). Seven Remediate buttons launch subject-scoped drills for Biochemistry, Pharmacology, Surgery, Anatomy, OBG, Pathology/Microbiology, Medicine. Advertised full 19-specialty data absent. Mistake Notebook Sync card navigates to corresponding records. Export Report PDF generates genuine selected-exam report. Three Review Answers links open persisted attempt review.

**Dynamic visual features:** coverage, accuracy, response partition, specialty table, difficulty-tier accuracy and module history derived from actual attempts with defined repeat/skip denominators. Static charts imply data-driven visualization, not a mandatory chart library.

**Prototype:** tabs change styles only; all other actions placeholders.

**Sample:** 12,450/18,000, 76.4%, AIR 1,450, national 74.1%, top 3.2%, seven rows, three history entries and cognitive insight. Correct 9,512 + wrong 2,410 + skipped 528 matches 12,450, but accuracy denominator semantics remain unspecified.

**Offline:** local metrics/history/PDF work offline. National rank/percentile needs genuine benchmark data/service and freshness/methodology; show unavailable otherwise. Predictions are not measured outcomes.

## clinical_highlights_saved_passages

**Controls:** Export Notes & Flashcards dropdown offers Anki .apkg/.anki, consolidated PDF, semantic JSON. Actual format writers/downloads required; hash links are not exports. Batch Convert to SRS (6) has no visible selection mechanism: define eligible/selected batch scope explicitly.

highlightSearchInput plus All/Pharmacology/Pathology/Medicine/AMC Guidelines pills must compose filters and real counts. Per card Favorite, More Actions (menu unspecified), Launch 5-Q Quiz, Send to SRS, Edit Note, Share Pearl require persistent content actions and provenance. No full overflow menu specification supplied.

Quick Capture form: pearlInput textarea, pearlSourceInput citation, pearlCategorySelect and Save Pearl; reject blank text and persist safely. Voice dictation and Attach Diagram require permissions/local attachment lifecycle. Copy promises auto-tags/source detection, not an implemented classifier.

SRS buttons Again under 10 minutes, Hard 1 day, Good 3 days, Easy 7 days apply rating and advance actual card queue. Displayed intervals are not a complete scheduling algorithm. Review 7 Due Cards Now opens review; answer-reveal mechanism is absent from sample card. Generate 10-Pearl Brief is contextual AI generation.

**Prototype:** category pills and keyword search independently override visibility. Export dropdown toggles. Quick Capture inserts in-memory card and clears fields, but no persistence/stat updates. Existing static NodeLists exclude new cards from filters. User text/source interpolated into innerHTML is unsafe: render as text. New star/SRS buttons have no handlers.

**Sample:** three saved passages/clinical citations, mechanism SVG, tags, memory anchors, 24 highlights/18 converted/7 due/85% retention, 710/800 projection and mastery bars. Mechanism illustration is not an interactive scientific simulator.

**Offline:** manual CRUD/search/favorites/internal SRS and genuine file export can be local. APKG needs deck writer, PDF renderer. Voice, auto-tagging, briefs and sharing/sync require local tooling or disclosed online dependencies. Live-synced resident wording is not cloud implementation.

## clinical_research_browser

**Controls:** Audit Log shows actual history/blocking/capture events. Back/Forward/Reload need actual isolated browser session; address field is readonly, so editable URL entry is not explicitly supplied. Bookmark icon saves current source. Snap to Mock Review must capture actual page/region and attach to specified mock question. Capture Text saves actual selection with URL/title/date. Clinical Focuser is shield/status plus blocking copy, not a supplied policy editor; define real policy before claiming protection.

Five Quick Launch links: eTG, NBE bulletins, PubMed Central, UpToDate/BMJ, Robbins atlas. They currently point to hash placeholders. Medical query field/search/clear and filter affordances imply actual evidence search; filter text names systematic reviews, clinical practice guidelines, Phase III trials but complete selection logic unspecified. High-Yield Evidence Mode implies prioritization, not evidence certification.

Copy Link/share icon attempts clipboard. Import as Clinical Pearl, View Study PDF, Add Citation to Draft must save provenance/open real source/append to defined draft. Atlas/formulary teaser tiles do not justify building complete databases. Scratchpad clips each have Highlight/Delete; Send to Mistake Notebook and Send to AI Knowledge Chat transfer selected/current clips with citation context. Targeted exam module chips are context tags, not proof of runnable modules.

**Prototype:** screenshot, capture-text, import-pearl and destination buttons only show success toasts. No screenshot, text extraction, note transfer, browser/proxy engine or navigation. Inline clipboard handler copies hardcoded Lancet URL.

**Sample:** mock address, two article excerpts/DOI, 1,480 results, 24,192 blocked sites, TLS/sandbox labels, two clips, cloud session ID. Free Full Text/Grade 1A/guideline copy is unverified, not an entitlement.

**Offline:** new research/web/PDF access requires network and subscription entitlement. Saved clips/downloaded PDFs should remain available offline. Electron remote content needs isolation/navigation policy; never expose application Node privileges. Remote text is untrusted. No real proxy, blocker, TLS enforcement or cloud sync is supplied.

## settings_ai_engine

**Controls:** Save Defaults persists effective settings. Fast SIMD/Standard Tesseract selects supported OCR with fallback. Plus/minus Parallel OCR Workers bounds count to detected resources and updates jobs without UI freeze. Diagnostics must show measured index/jobs/memory, not samples.

Test Connection performs real chosen-provider request; Apply AI Model selects validated available model. Provider tiles say tap to switch: Claude Pro/Max, ChatGPT Plus/Codex, Grok, Gemini, OpenAI API, DeepSeek, Ollama, LM Studio, Together/OpenRouter. They are not credential/login forms or guaranteed connectors. Catalog search filters actual models/tags. models.dev sync needs cache/freshness/offline fallback.

Connect Drive is disabled and explicitly Coming Soon: deferred, not an already functioning feature. Export Notes & Pearls .json saves real versioned records. Clear Cached PDF Chunks needs scope/confirmation and must preserve original PDFs/user records. Reset SRS Leitner Intervals is destructive: confirmation/recovery policy, not silent card/history deletion.

**Prototype:** Tailwind config only; no settings persistence, connection test, auth, model catalog, cleanup or export logic.

**Sample:** 8,644 models/230 providers, 240 ms/200 OK, 4 workers/16 GB/8 cores, 5.8x speedup, 31,480 chunks, 420 MB cache, client hash. AVX2 active versus AVX-512 leveraged copy conflicts; detect hardware. HIPAA/zero telemetry/TLS/training exclusions are not evidence of compliance. Consumer subscription is not automatically a general API credential or authorized integration.

**Offline:** local OCR/storage/JSON and installed local model endpoints work offline. Ollama example 127.0.0.1:11434; LM Studio needs actual configured endpoint. Cloud inference/catalog refresh/future Drive require auth/network. Store secrets OS-protected, never renderer hardcoded. Local OCR does not mean cloud AI requests cannot contain passages; disclose provider boundary.

## DESIGN.md: design-system behavioral requirements

- Inter typography: display 28/34 px (24/30 mobile), H1 22/28, H2 18/24, H3 16/22, reading 15/24, compact 14/22, caption 13/18, badge 11/14, stat 30/36. Use tabular numbers for timers/ranks and legible dose/unit separation.
- Mobile 360-640: one column, 1rem padding; tablet 641-1024: two panes 35/65; desktop 1025+: fixed 220px sidebar, reading max 720px, analytics max 1100px. 4/8px spacing rhythm.
- Explicit behaviors: selected chips; button hover/pressed; MCQ correct/incorrect states; automatically revealed explanation accordion with citations; four SRS feedback actions; form focus/checked states; high-yield/mnemonic callouts; progress green above 75%, red below 50%.
- Semantic violet/amber/green/red must communicate mnemonic/high-yield/success/error without color alone.
- Token conflicts: YAML primary #001432, secondary #00696b, background #f8f9ff versus prose #13294b/#0f8b8d/#f6f7f9. HTML generally uses YAML palette. YAML DEFAULT radius .5rem versus HTML .25rem; prose card/option radii differ. Choose documented authority, do not mix blindly.
- Mobile minimum touch height 48px versus button prose 44px conflicts. Preserve at least 48px target or resolve explicitly. Dense icons need accessible names/focus.
- This file supplies no persistence schema, scoring policy, provider API or complete SRS algorithm.

## External/offline dependency inventory

| Dependency | Screens | Remediation |
|---|---|---|
| cdn.tailwindcss.com runtime | All 11 | Compile/package CSS; no CDN at runtime. |
| Tailwind plugins=forms,container-queries | Highlights, Master Index, Semantic Search | Bundle equivalent generated styles/plugins. |
| Google Fonts Inter 400/500/600/700/800, fonts.googleapis.com/fonts.gstatic.com | All 11 | Self-host licensed font files or local fallback. |
| Material Symbols Outlined (including variable opsz/wght/FILL/GRAD links, sometimes duplicated) | All 11 | Bundle/subset font or local SVGs; otherwise ligature words appear instead of icons. |
| lh3.googleusercontent.com/aida-public remote img | Mistake Notebook renal biopsy | Bundle licensed image or clear local placeholder tied to correct question. |
| lh3.googleusercontent.com/aida-public CSS url background | Semantic Search susceptibility plate | Same; CSS backgrounds also break offline. |
| https://www.thelancet.com/journals/laninf/article/PIIS1473-3099(24)00412-2/fulltext | Research Browser clipboard onclick | Actual external link string, not bundled paper or live retrieved evidence. |
| AI providers, models.dev, medical sites, future cloud/Anki sync | Per-screen notes above | Semantic integrations, not loaded SDKs; distinguish configured/offline/unavailable states. |
| PDF/OCR/embedding/HNSW/speech/export implementations | Library/index/search/chat/notebook/settings | Advertised, not executable engines supplied. Provision local binaries/WASM/models/language data and background jobs. |

Icons include search, timer, tune, bookmark, local_library, menu_book, neurology, clinical_notes, monitoring and the named action symbols; package all used glyphs, not only these examples. No charting/analytics SDK is required by markup: charts are static HTML/SVG/CSS. No functional AI/clinical fetch backend appears in supplied scripts. All screens inherit CDN/font offline risk even when core features are local.

## Cross-screen data contracts implied (not a mandated database)

- Document/OCR job: stable ID/path/hash, title/edition/authors/specialty, physical/printed page mapping, import/index status/errors/progress, worker mode and source licensing.
- Passage/citation: document or URL, page/section/table/figure/chunk locator, text, provenance and retrieval score.
- Topic: canonical ID/name/aliases, specialty/tags, distinct linked document/page refs and selected entity.
- Question: exam, format, stem/options/correct answer(s), rationale/distractors, tags/difficulty, citations/images and generation provenance. Multiple statements in the runner sample use a single combination radio; not proof of all builder formats being implemented.
- Module spec: exam/rule snapshot, count, sources, topics/formats, difficulty/distribution, tutor/simulation, duration and preset metadata.
- Attempt: question order, responses/flags/notes, elapsed/pause state, immutable scoring rule snapshot, per-exam score, finalization and restart recovery.
- Mistake: attempt/question refs, selected/correct response, trap classification, repeat failures, remediation/mastery history and notes.
- Highlight/pearl: text/category/tags/favorite, source, attachments, timestamps and linked question/SRS refs.
- SRS card/review: front/back/source, due time/rating/interval/history. Three-day Leitner copy versus four displayed ratings is not a complete algorithm; document selected policy.
- Chat: messages, attachments, engine/scope/mode/persona/rule snapshot and cited evidence.
- Settings/provider: secure credential refs, capability/configuration, catalog cache, selected model, connection results, theme/stream and worker defaults.
- Research clip: selected text/image, URL/title/date, scratchpad and destination record IDs.
- Analytics: derived real per-exam attempts/review history, explicit repeat/skip denominators and benchmark provenance if available.

### Required integration flows

Library import -> OCR/index -> topics/search/RAG -> chat/builder -> runner -> submission -> analytics/mistakes -> targeted retest/SRS.
Search passage -> exact source PDF page, highlight, note or five-question generation.
Topic comparison -> cited notebook/audio/quiz. Chat generated stem -> notebook/flashcard.
Browser actual capture -> scratchpad -> pearl/notebook/chat or active mock attachment.
Highlights -> internal SRS/Anki/PDF/JSON. Settings export/cleanup/reset must operate on the same records.

## Missing states and acceptance criteria

- Empty/loading/error/offline/no-provider/no-corpus/no-results states are generally absent. Disable unavailable actions honestly; preserve composed input on failures. Toast-only success is not capture/export/generation.
- Compose filters; update counts after CRUD; include new cards in later searches. Validate blank input, custom counts, file/schema types, insufficient pools, missing sources and unsupported question formats.
- Sanitize document/model/remote/user content; never interpolate into raw HTML. Secure remote browser isolation and OS-protected credentials.
- Persist selections/notes/attempts/SRS/settings across restart. Idempotent final submission and permitted pause recovery required. Confirm destructive operations and preserve sources/history.
- No fake connected/200 OK, cohort ranks, projected gains, confidence, compliance or security claims. Hide/label unavailable until real evidence/methodology exists.
- Keyboard semantics for clickable div accordions, associated labels, icon names, visible focus, drawer/dropdown focus restoration and status announcements.
- Offline acceptance: packaged fonts/icons/styles load with network disabled; imported-source search, stored questions/attempts, notes and SRS remain usable. Online-only actions explain dependency.
- Functional acceptance: real selected/generated question set launches, accepts responses, persists across restart, submits once, reviews and updates independent exam analytics/mistakes. Exports open as genuine requested formats; captures contain actual source content.

## Scope cautions

Eleven HTML screens do not mean one supplied screen per sidebar item. No login/billing workflow, functional cloud sync/browser/proxy, question database, guideline entitlement, OCR binary or local model weights are supplied by the audited code.html/DESIGN.md inputs. Existing Electron app was not inspected: this document does not claim these features are absent there; it specifies supplied design requirements and prototype gaps.
