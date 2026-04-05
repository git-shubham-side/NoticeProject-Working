import type { NoticeCategory } from '@/types';

type ClassificationResult = {
  category: NoticeCategory;
  confidence: number;
  matchedKeywords: string[];
  reason: string;
};

const CATEGORY_KEYWORDS: Record<NoticeCategory, string[]> = {
  academic: [
    'assignment',
    'lecture',
    'classroom',
    'syllabus',
    'attendance',
    'semester',
    'lab',
    'project',
    'submission',
    'academic',
  ],
  administrative: [
    'office',
    'circular',
    'administration',
    'fee',
    'document',
    'policy',
    'registration',
    'identity card',
    'library',
    'hostel',
  ],
  events: [
    'event',
    'seminar',
    'webinar',
    'workshop',
    'conference',
    'meetup',
    'session',
    'celebration',
  ],
  examinations: [
    'exam',
    'examination',
    'mid-term',
    'end semester',
    'hall ticket',
    'invigilator',
    'result',
    'marks',
    'test',
    'quiz',
  ],
  sports: [
    'sport',
    'sports',
    'football',
    'cricket',
    'volleyball',
    'kabaddi',
    'tournament',
    'match',
    'athletics',
    'coach',
  ],
  cultural: [
    'cultural',
    'dance',
    'music',
    'drama',
    'festival',
    'art',
    'competition',
    'rangoli',
    'singing',
    'celebration',
  ],
  placement: [
    'placement',
    'internship',
    'recruitment',
    'company',
    'interview',
    'resume',
    'aptitude',
    'job',
    'career',
    'drive',
  ],
  other: [],
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
}

export function classifyNoticeContent(input: { title?: string; content?: string }) : ClassificationResult {
  const haystack = normalize(`${input.title ?? ''} ${input.content ?? ''}`);
  const scores = Object.entries(CATEGORY_KEYWORDS).map(([category, keywords]) => {
    const matchedKeywords = keywords.filter((keyword) => haystack.includes(keyword));
    const titleBonus = keywords.filter((keyword) => normalize(input.title ?? '').includes(keyword)).length;
    const score = matchedKeywords.length + titleBonus * 1.5;

    return {
      category: category as NoticeCategory,
      matchedKeywords,
      score,
    };
  });

  const best = scores.sort((left, right) => right.score - left.score)[0];

  if (!best || best.score <= 0) {
    return {
      category: 'other',
      confidence: 0.2,
      matchedKeywords: [],
      reason: 'No strong keyword match was found, so this notice is classified as Other.',
    };
  }

  const totalSignals = scores.reduce((sum, item) => sum + item.score, 0) || best.score;
  const confidence = Math.min(0.95, Math.max(0.35, best.score / totalSignals));

  return {
    category: best.category,
    confidence,
    matchedKeywords: best.matchedKeywords,
    reason: `Matched keywords for ${best.category}: ${best.matchedKeywords.join(', ') || 'content pattern match'}.`,
  };
}
