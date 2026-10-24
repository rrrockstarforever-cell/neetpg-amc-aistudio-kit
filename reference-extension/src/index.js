import { mount, md } from './chat.js';
import { patterns } from './store.js';
import { importBank, bankInfo, pickFromBank, resetSeen, seedBundledBank, browseBank, imageExamples, bankTree } from './bank.js';
import { toggleKey, countSelected, isSelected } from './taxonomy.js';
import { rulesPrompt, detectTarget, detectExam } from './rules.js';
import { initTheme } from './theme.js';
import { mountBank } from './bankview.js';
import { mountHighlights094, mountSrs094, mountResearch094, mountStorage094 } from './workspace.js';
import { mountLibrary094, mountSearch094, mountTopics094 } from './knowledge094.js';
import { recordAttempt, recordModule, summaryHtml, mountReview, mountProgress } from './analytics.js';
// Entry point: chat, banks, theme, analytics and the rules hook used by every AI call.








window.__amcExt = {
 cfRunnerInit,cfRunnerElapsed,cfRunnerRemaining,cfRunnerPause,cfRunnerJump,cfRunnerPick,cfRunnerFlag,cfRunnerLabel,
 cfPreset094,cfCapture094,saveQuestionPearl094,invalidatePages094,

  mountChat: mount, explainQ, notesQ, askQ, libContext, importBank, bankInfo, pickFromBank, resetSeen, seedBundledBank, browseBank, imageExamples,
  mountBank, bankTree, toggleKey, countSelected, isSelected, recordAttempt, recordModule, summaryHtml, mountReview, mountProgress,
  mountHighlights094, mountSrs094, mountResearch094, mountStorage094, mountLibrary094, mountSearch094, mountTopics094,
  md,
  rulesFor(messages, json) {
    try {
      const p = patterns();
      if (!p.rules.length && !p.profiles.length && !p.boost) return '';
      return rulesPrompt(p, { target: detectTarget(messages, json), exam: detectExam(messages, window.__amcBridge?.exam?.()) });
    } catch { return ''; }
  }
};
initTheme();
seedBundledBank('emedici').catch(() => {}); seedBundledBank('success').catch(() => {});


cfInit094();
