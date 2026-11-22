import {
  AnalyticsSnapshot,
  BadgeDefinition,
  BossChallenge,
  CefrLevelCode,
  DailyChallenge,
  GameType,
  GrammarTopic,
  LeaderboardEntry,
  LearningMode,
  MistakeRecord,
  MotivationalQuote,
  PaymentRecord,
  QuestionItem,
  ShopItem,
  SubscriptionPlanCode,
  SubscriptionPlanConfig,
  TopicProgress,
  UserAccount,
} from '../types/gamify.ts';

let authToken: string | null = null;

export function setApiToken(token: string | null) {
  authToken = token;
}

export function getApiToken(): string | null {
  return authToken;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Server xətası (${res.status})`);
  }
  return data as T;
}

export const api = {
  getBootstrap: () =>
    request<{
      topicsCount: number;
      questionsCount: number;
      plans: SubscriptionPlanConfig[];
      adminBootstrap: { requiresFirstRunClaim: boolean; hasEnvPasscode: boolean };
    }>('/api/public/bootstrap'),

  register: (payload: {
    email: string;
    password: string;
    nickname: string;
    fullName?: string;
    mode?: LearningMode;
  }) =>
    request<{ user: UserAccount; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ user: UserAccount; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  demoLogin: () =>
    request<{ user: UserAccount; token: string }>('/api/auth/demo', {
      method: 'POST',
    }),

  claimAdmin: (payload: { email: string; nickname: string; password: string }) =>
    request<{ user: UserAccount; token: string }>('/api/auth/admin/claim', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  loginAdmin: (payload: { email: string; passcode: string }) =>
    request<{ user: UserAccount; token: string }>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () =>
    request<{
      user: UserAccount;
      progress: TopicProgress[];
      badges: { earnedIds: string[]; definitions: BadgeDefinition[] };
      analytics: AnalyticsSnapshot;
      dailyAiUsed: number;
    }>('/api/me'),

  updateMe: (patch: Partial<UserAccount>) =>
    request<{ user: UserAccount }>('/api/me', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  toggleBookmark: (topicId: string) =>
    request<{ bookmarkedTopics: string[]; user: UserAccount }>('/api/me/bookmark', {
      method: 'POST',
      body: JSON.stringify({ topicId }),
    }),

  getTopics: (params?: { mode?: LearningMode; cefrLevel?: CefrLevelCode }) => {
    const qs = new URLSearchParams();
    if (params?.mode) qs.set('mode', params.mode);
    if (params?.cefrLevel) qs.set('cefrLevel', params.cefrLevel);
    return request<{ topics: GrammarTopic[] }>(`/api/topics?${qs.toString()}`);
  },

  getQuestions: (params?: {
    topicId?: string;
    cefrLevel?: CefrLevelCode;
    mode?: LearningMode;
    gameType?: GameType;
  }) => {
    const qs = new URLSearchParams();
    if (params?.topicId) qs.set('topicId', params.topicId);
    if (params?.cefrLevel) qs.set('cefrLevel', params.cefrLevel);
    if (params?.mode) qs.set('mode', params.mode);
    if (params?.gameType) qs.set('gameType', params.gameType);
    return request<{ questions: QuestionItem[] }>(`/api/questions?${qs.toString()}`);
  },

  submitAnswer: (payload: {
    questionId: string;
    submittedAnswer: string;
    mode: LearningMode;
    responseSeconds?: number;
    sessionPerfectSoFar?: boolean;
  }) =>
    request<{
      isCorrect: boolean;
      correctAnswer: string;
      explanationAz: string;
      commonTrapAz?: string;
      xpEarned: number;
      coinsEarned: number;
      user: UserAccount;
      newlyUnlockedBadges: BadgeDefinition[];
      motivationalQuote: MotivationalQuote | null;
      topicProgress: TopicProgress;
    }>('/api/answers/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMistakes: () => request<{ mistakes: MistakeRecord[] }>('/api/mistakes'),

  getShop: () => request<{ items: ShopItem[] }>('/api/shop'),

  buyShopItem: (itemId: string) =>
    request<{ user: UserAccount }>('/api/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    }),

  getDailyChallenge: () =>
    request<{ challenge: DailyChallenge; questions: QuestionItem[]; completedToday: boolean }>(
      '/api/challenges/daily'
    ),

  completeDailyChallenge: () =>
    request<{ user: UserAccount; xpAdded: number; coinsAdded: number }>(
      '/api/challenges/daily/complete',
      { method: 'POST' }
    ),

  getBossChallenges: () =>
    request<{
      challenges: Array<BossChallenge & { questions: QuestionItem[] }>;
      completedIds: string[];
    }>('/api/challenges/boss'),

  completeBossChallenge: (bossId: string, scorePercent: number) =>
    request<{
      passed: boolean;
      user: UserAccount;
      xpAdded: number;
      coinsAdded: number;
      badgeAwarded: BadgeDefinition | null;
    }>('/api/challenges/boss/complete', {
      method: 'POST',
      body: JSON.stringify({ bossId, scorePercent }),
    }),

  getLeaderboard: (period: 'daily' | 'weekly' | 'monthly' | 'overall') =>
    request<{ entries: LeaderboardEntry[]; period: string }>(`/api/leaderboard?period=${period}`),

  getPlans: () => request<{ plans: SubscriptionPlanConfig[] }>('/api/subscriptions'),

  checkoutSubscription: (
    planCode: SubscriptionPlanCode,
    billingCycle: 'monthly' | 'yearly',
    activatePreviewMode: boolean
  ) =>
    request<{ payment: PaymentRecord; user: UserAccount }>('/api/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ planCode, billingCycle, activatePreviewMode }),
    }),

  aiExplain: (payload: {
    topicId?: string;
    questionText?: string;
    userAnswer?: string;
    correctAnswer?: string;
    customPrompt?: string;
  }) =>
    request<{ reply: string; dailyAiUsed: number }>('/api/ai/explain', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  aiHint: (questionId: string) =>
    request<{ hint: string; dailyAiUsed: number }>('/api/ai/hint', {
      method: 'POST',
      body: JSON.stringify({ questionId }),
    }),

  aiGeneratePractice: (topicId: string, saveToBank = false) =>
    request<{ questions: Array<Partial<QuestionItem>>; savedPendingCount: number; dailyAiUsed: number }>(
      '/api/ai/generate-practice',
      {
        method: 'POST',
        body: JSON.stringify({ topicId, saveToBank }),
      }
    ),

  // Admin APIs
  getAdminOverview: () =>
    request<{
      totalUsers: number;
      totalTopics: number;
      totalQuestions: number;
      publishedQuestions: number;
      totalAnswersLogged: number;
      totalAiInteractions: number;
      users: UserAccount[];
      recentAiLogs: any[];
      recentPayments: PaymentRecord[];
      subscriptionPlans: SubscriptionPlanConfig[];
    }>('/api/admin/overview'),

  getAdminQuestions: () => request<{ questions: QuestionItem[] }>('/api/admin/questions'),

  upsertQuestion: (q: Partial<QuestionItem>) =>
    request<{ question: QuestionItem }>('/api/admin/questions', {
      method: 'POST',
      body: JSON.stringify(q),
    }),

  deleteQuestion: (id: string) =>
    request<{ deleted: boolean }>(`/api/admin/questions/${id}`, {
      method: 'DELETE',
    }),

  importQuestionsCsv: (csvText: string) =>
    request<{ importedCount: number; errors: Array<{ row: number; reason: string }> }>(
      '/api/admin/questions/import-csv',
      {
        method: 'POST',
        body: JSON.stringify({ csvText }),
      }
    ),

  updateTopic: (topicId: string, patch: Partial<GrammarTopic>) =>
    request<{ topic: GrammarTopic }>(`/api/admin/topics/${topicId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  adminUpdateUser: (userId: string, patch: { subscriptionPlan?: SubscriptionPlanCode; role?: 'student' | 'admin'; coins?: number }) =>
    request<{ user: UserAccount }>(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  adminUpdatePlanPrice: (code: SubscriptionPlanCode, monthlyPriceAzn: number, yearlyPriceAzn: number) =>
    request<{ plans: SubscriptionPlanConfig[] }>(`/api/admin/plans/${code}`, {
      method: 'PATCH',
      body: JSON.stringify({ monthlyPriceAzn, yearlyPriceAzn }),
    }),
};
