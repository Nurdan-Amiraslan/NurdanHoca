export type LearningMode = 'abituriyent' | 'aptis';

export type CefrLevelCode = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type GameType =
  | 'multiple_choice'
  | 'fill_blanks'
  | 'sentence_builder'
  | 'error_detection'
  | 'sentence_transformation'
  | 'matching'
  | 'speed_challenge'
  | 'grammar_battle'
  | 'true_false'
  | 'drag_drop';

export type SubscriptionPlanCode = 'FREE' | 'PREMIUM' | 'PRO';

export type NurdanMood =
  | 'welcome'
  | 'explaining'
  | 'thinking'
  | 'encouraging'
  | 'celebrating'
  | 'correcting';

export type AppView =
  | 'landing'
  | 'register'
  | 'login'
  | 'onboarding'
  | 'mode-select'
  | 'dashboard'
  | 'levels'
  | 'map'
  | 'topic'
  | 'game'
  | 'daily-challenge'
  | 'boss-challenge'
  | 'ai-teacher'
  | 'leaderboard'
  | 'achievements'
  | 'mistakes'
  | 'analytics'
  | 'subscription'
  | 'profile'
  | 'lesson-info'
  | 'admin-dashboard'
  | 'admin-questions'
  | 'admin-users';

export interface UserAccount {
  id: string;
  email: string;
  nickname: string;
  fullName?: string;
  role: 'student' | 'admin';
  activeMode: LearningMode;
  currentCefr: CefrLevelCode;
  xp: number;
  level: number;
  coins: number;
  streakDays: number;
  longestStreak: number;
  lastActiveDate: string;
  dailyGoalTarget: number;
  dailySolvedCount: number;
  totalAnsweredCount: number;
  totalCorrectCount: number;
  subscriptionPlan: SubscriptionPlanCode;
  onboardingCompleted: boolean;
  equippedOutfit: string;
  equippedAccessory: string;
  equippedTheme: string;
  unlockedShopItems: string[];
  bookmarkedTopics: string[];
  seenQuoteIds: string[];
  createdAt: string;
}

export interface TopicExample {
  en: string;
  az: string;
}

export interface GrammarTopic {
  id: string;
  slug: string;
  cefrLevel: CefrLevelCode;
  unitNumber: number;
  unitTitle: string;
  orderIndex: number;
  title: string;
  titleAz: string;
  category: string;
  modes: LearningMode[];
  difficulty: 'Asan' | 'Orta' | 'Çətin' | 'Ekspert';
  explanationAz: string;
  examples: TopicExample[];
  commonMistakesAz: string[];
  estimatedMinutes: number;
  xpReward: number;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface DragDropSlot {
  id: string;
  label: string;
  acceptedItem: string;
}

export interface QuestionItem {
  id: string;
  topicId: string;
  cefrLevel: CefrLevelCode;
  mode: LearningMode | 'both';
  gameType: GameType;
  difficulty: 'Asan' | 'Orta' | 'Çətin' | 'Ekspert';
  promptAz: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  wordTokens?: string[];
  segments?: string[];
  matchingPairs?: MatchingPair[];
  dragItems?: string[];
  dragSlots?: DragDropSlot[];
  explanationAz: string;
  commonTrapAz?: string;
  xpValue: number;
  coinValue: number;
  isPublished: boolean;
  sourceTag: 'dim-aligned' | 'aptis-original' | 'ai-reviewed' | 'admin-added';
  createdAt: string;
}

export interface TopicProgress {
  topicId: string;
  mode: LearningMode;
  attempts: number;
  correct: number;
  completed: boolean;
  stars: number;
  lastPracticedAt: string;
  nextReviewAt: string;
  intervalDays: number;
}

export interface MistakeRecord {
  id: string;
  userId: string;
  questionId: string;
  topicId: string;
  topicTitle: string;
  cefrLevel: CefrLevelCode;
  mode: LearningMode;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  explanationAz: string;
  mistakeCount: number;
  resolved: boolean;
  createdAt: string;
  lastAttemptAt: string;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  titleAz: string;
  descriptionAz: string;
  icon: string;
  color: string;
  requirementText: string;
  xpBonus: number;
  coinBonus: number;
}

export interface ShopItem {
  id: string;
  category: 'outfit' | 'accessory' | 'theme';
  nameAz: string;
  descriptionAz: string;
  priceCoins: number;
  previewColor: string;
  icon: string;
}

export interface DailyChallenge {
  id: string;
  date: string;
  titleAz: string;
  descriptionAz: string;
  targetQuestions: number;
  xpReward: number;
  coinReward: number;
  questionIds: string[];
}

export interface BossChallenge {
  id: string;
  cefrLevel: CefrLevelCode;
  titleAz: string;
  descriptionAz: string;
  timeLimitSeconds: number;
  passPercent: number;
  xpReward: number;
  coinReward: number;
  badgeName: string;
  questionIds: string[];
}

export interface MotivationalQuote {
  id: string;
  textEn: string;
  author: string;
  encouragementAz: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  xp: number;
  streakDays: number;
  level: number;
  cefrLevel: CefrLevelCode;
  mode: LearningMode;
  equippedAccessory: string;
}

export interface SubscriptionPlanConfig {
  code: SubscriptionPlanCode;
  nameAz: string;
  taglineAz: string;
  monthlyPriceAzn: number;
  yearlyPriceAzn: number;
  dailyAiLimit: number;
  dailyQuestionLimit: number;
  unlockedCefr: CefrLevelCode[];
  bossChallengesIncluded: boolean;
  analyticsDepth: 'Əsas' | 'Tam' | 'Limitsiz';
  featuresAz: string[];
}

export interface PaymentRecord {
  id: string;
  userId: string;
  planCode: SubscriptionPlanCode;
  billingCycle: 'monthly' | 'yearly';
  amountAzn: number;
  status: 'pending_gateway' | 'completed' | 'cancelled';
  providerNote: string;
  createdAt: string;
}

export interface AiInteractionLog {
  id: string;
  userId: string;
  topicId?: string;
  actionType: 'explain' | 'hint' | 'chat' | 'generate_practice';
  promptSummary: string;
  responsePreview: string;
  createdAt: string;
}

export interface AnalyticsSnapshot {
  accuracyPercent: number;
  totalAnswered: number;
  totalCorrect: number;
  totalMistakes: number;
  averageResponseSeconds: number;
  cefrMastery: Record<CefrLevelCode, number>;
  weeklyActivity: Array<{
    day: string;
    solved: number;
    correct: number;
    xp: number;
  }>;
  strongestTopics: Array<{ topicId: string; title: string; accuracy: number; attempts: number }>;
  weakestTopics: Array<{ topicId: string; title: string; accuracy: number; attempts: number }>;
  dueForReviewCount: number;
}
