import type { LanguageCode, Notice, NoticeCategory, NoticePriority, NoticeTranslation } from '@/types';

type AssistantInput = {
  title: string;
  content: string;
  priority?: NoticePriority;
  category?: NoticeCategory;
  languages?: LanguageCode[];
};

const LANGUAGE_LABELS = {
  hi: {
    titlePrefix: 'Hindi Translation',
    contentPrefix: 'Hindi',
    summaryPrefix: 'Hindi Summary',
  },
  mr: {
    titlePrefix: 'Marathi Translation',
    contentPrefix: 'Marathi',
    summaryPrefix: 'Marathi Summary',
  },
} satisfies Record<Exclude<LanguageCode, 'en'>, {
  titlePrefix: string;
  contentPrefix: string;
  summaryPrefix: string;
}>;

const COMMON_REPLACEMENTS = {
  hi: [
    [/\bnotice\b/gi, 'सूचना'],
    [/\bstudent(s)?\b/gi, 'छात्र'],
    [/\bteacher(s)?\b/gi, 'शिक्षक'],
    [/\bclass\b/gi, 'कक्षा'],
    [/\bdepartment\b/gi, 'विभाग'],
    [/\bexam(s|ination)?\b/gi, 'परीक्षा'],
    [/\bdeadline\b/gi, 'अंतिम तिथि'],
    [/\burgent\b/gi, 'अति आवश्यक'],
    [/\bassignment\b/gi, 'असाइनमेंट'],
    [/\blibrary\b/gi, 'पुस्तकालय'],
    [/\bworkshop\b/gi, 'कार्यशाला'],
    [/\bcollege\b/gi, 'कॉलेज'],
  ],
  mr: [
    [/\bnotice\b/gi, 'सूचना'],
    [/\bstudent(s)?\b/gi, 'विद्यार्थी'],
    [/\bteacher(s)?\b/gi, 'शिक्षक'],
    [/\bclass\b/gi, 'वर्ग'],
    [/\bdepartment\b/gi, 'विभाग'],
    [/\bexam(s|ination)?\b/gi, 'परीक्षा'],
    [/\bdeadline\b/gi, 'अंतिम मुदत'],
    [/\burgent\b/gi, 'तातडीचे'],
    [/\bassignment\b/gi, 'असाइनमेंट'],
    [/\blibrary\b/gi, 'ग्रंथालय'],
    [/\bworkshop\b/gi, 'कार्यशाळा'],
    [/\bcollege\b/gi, 'महाविद्यालय'],
  ],
} satisfies Record<Exclude<LanguageCode, 'en'>, Array<[RegExp, string]>>;

function normalizeWhitespace(value: string) {
  return value.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

function sentenceCase(value: string) {
  const cleaned = normalizeWhitespace(value);
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : cleaned;
}

function splitSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+/)
    .map(part => part.trim())
    .filter(Boolean);
}

function getPriorityLead(priority?: NoticePriority) {
  switch (priority) {
    case 'urgent':
      return 'Immediate attention required.';
    case 'high':
      return 'Please review this update soon.';
    case 'medium':
      return 'Please note the following update.';
    default:
      return 'For your information.';
  }
}

function localizeText(language: Exclude<LanguageCode, 'en'>, value: string) {
  return COMMON_REPLACEMENTS[language].reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value,
  );
}

export function generateNoticeSuggestion(input: AssistantInput) {
  const normalizedTitle = sentenceCase(input.title || 'Notice update');
  const normalizedContent = normalizeWhitespace(input.content);
  const sentences = splitSentences(normalizedContent);
  const summarySource = sentences[0] || normalizedContent || normalizedTitle;
  const summary = summarySource.length > 160 ? `${summarySource.slice(0, 157)}...` : summarySource;
  const polishedTitle = normalizedTitle.includes(':')
    ? normalizedTitle
    : `${normalizedTitle}${input.priority === 'urgent' ? ' - Immediate Action Required' : ''}`;
  const polishedContent = [getPriorityLead(input.priority), ...sentences].join('\n\n').trim();

  const translations = (input.languages ?? [])
    .filter((language): language is Exclude<LanguageCode, 'en'> => language !== 'en')
    .map(language =>
      buildTranslationDraft({
        language,
        title: polishedTitle,
        content: polishedContent,
        summary,
      }),
    );

  return {
    polishedTitle,
    polishedContent,
    summary,
    translations,
  };
}

export function buildTranslationDraft(input: {
  language: Exclude<LanguageCode, 'en'>;
  title: string;
  content: string;
  summary?: string;
}): NoticeTranslation {
  const labels = LANGUAGE_LABELS[input.language];

  return {
    language: input.language,
    title: `${labels.titlePrefix}: ${localizeText(input.language, input.title)}`,
    content: `${labels.contentPrefix}: ${localizeText(input.language, input.content)}`,
    summary: input.summary
      ? `${labels.summaryPrefix}: ${localizeText(input.language, input.summary)}`
      : undefined,
    generatedBy: 'assistant',
  };
}

export function getLocalizedNoticeContent(
  notice: Pick<Notice, 'title' | 'content' | 'summary' | 'translations'>,
  language: LanguageCode,
) {
  if (language === 'en') {
    return {
      title: notice.title,
      content: notice.content,
      summary: notice.summary,
      language,
      translated: false,
    };
  }

  const savedTranslation = notice.translations?.find(item => item.language === language);
  const translation =
    savedTranslation ??
    buildTranslationDraft({
      language,
      title: notice.title,
      content: notice.content,
      summary: notice.summary,
    });

  return {
    title: translation.title,
    content: translation.content,
    summary: translation.summary ?? notice.summary,
    language,
    translated: true,
  };
}
