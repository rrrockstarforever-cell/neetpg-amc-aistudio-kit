Build a responsive single-page web app, "NEET PG / AMC Prep", a study tool for medical PG exams, using React + Tailwind and local browser storage (IndexedDB/localStorage). No backend.

Visual system (authoritative, from the Stitch export): follow `design/clinical_focus/DESIGN.md` exactly. Use the YAML tokens in its front matter as the source of truth.
- Font: Inter (weights 400/500/600/700/800), with the type scale in DESIGN.md. Do NOT substitute a system font.
- Light theme only: off-white canvas `#f6f7f9`, white cards `#ffffff`, hairline borders `#e3e7ee`, text `#1c2430`, secondary text `#667085`. Do NOT build a dark theme.
- Navy `#13294b` for headers and the fixed 220px desktop sidebar with a light lavender/white body; Clinical Teal `#0f8b8d` for primary actions, active tabs, selected chips and progress; High-Yield Amber `#f2a541` pearls; Mnemonic Violet `#8b6fd6` hooks; Success `#1f9d55` and Error `#d64545` for MCQ feedback and the SRS buttons (Again/Hard/Good/Easy).
- Radii: 8px for buttons, inputs and option rows; 16px for cards and question shells; pill shape for chips and nav pills. Buttons 44px high, option rows at least 48px.
- Layout: mobile 1rem padding, single column; tablet 2-column (35/65); desktop 220px sidebar with a centered reading column capped at 720px (analytics up to 1100px).

Match each screen in `design/<screen>/screen.png` and `design/<screen>/code.html`. Those screenshots are the visual reference. Where they disagree with the prose in DESIGN.md, the screenshot wins.

Screens (sidebar): Library & OCR, Chat (AI knowledge engine), Ask your books, Search (editable synonym chips, history, paged results, open source page), Topics (per-subject index, compare excerpts), Practice builder, Test runner (timer, palette, flag, pause), Mistake notebook (notes, trap tags, flags, mastered, add to SRS, Anki TSV/JSON export), Flashcards & SRS (reveal, Again/Hard/Good/Easy with real next-due times, FSRS-style), Progress (real metrics only), Highlights (capture, star, private note, subject filter, convert to card), Research browser + scratchpad, Settings (AI provider; keys stored locally, never exported), Data & exports (versioned JSON backup, merge import that never overwrites schedules, Anki TSV, PDF; no "clear all data").

Rules: no fake metrics or placeholders presented as data; all user-supplied text rendered as text, never HTML; keyboard focus styles; works at 980x700 and 1500x900. See `requirements.md` for exact behaviour and `gap-audit.md` for the features that must be fully functional. Use `reference-extension/src` as the behavioural reference for logic.
