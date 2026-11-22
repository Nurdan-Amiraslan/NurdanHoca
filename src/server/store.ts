import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  SEED_BADGES,
  SEED_BOSS_CHALLENGES,
  SEED_QUOTES,
  SEED_SHOP_ITEMS,
  SEED_SUBSCRIPTION_PLANS,
  SEED_TOPICS,
} from '../data/curriculumSeed.ts';
import { SEED_QUESTIONS } from '../data/questionsSeed.ts';
import {
  AiInteractionLog,
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

interface StoredUser extends UserAccount {
  passwordHash: string;
}

interface AnswerLog {
  id: string;
  userId: string;
  questionId: string;
  topicId: string;
  cefrLevel: CefrLevelCode;
  mode: LearningMode;
  gameType: GameType;
  isCorrect: boolean;
  responseSeconds: number;
  xpEarned: number;
  createdAt: string;
}

interface StoreData {
  users: StoredUser[];
  topics: GrammarTopic[];
  questions: QuestionItem[];
  progress: Record<string, TopicProgress[]>; // userId -> TopicProgress[]
  mistakes: MistakeRecord[];
  badgesEarned: Record<string, string[]>; // userId -> badgeId[]
  answerLogs: AnswerLog[];
  aiLogs: AiInteractionLog[];
  subscriptionPlans: SubscriptionPlanConfig[];
  payments: PaymentRecord[];
  dailyChallenge: DailyChallenge;
  dailyCompletedByUser: Record<string, string[]>; // date -> userId[]
  bossCompletedByUser: Record<string, string[]>; // userId -> bossId[]
  adminPasscodeHash: string | null;
  demoLeaderboard: LeaderboardEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'gamify-store.json');
const TOKEN_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function signSessionToken(userId: string, role: 'student' | 'admin'): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): { sub: string; role: 'student' | 'admin' } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (!parsed.sub || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return { sub: parsed.sub, role: parsed.role === 'admin' ? 'admin' : 'student' };
  } catch {
    return null;
  }
}

export function sanitizeUser(user: StoredUser): UserAccount {
  const { passwordHash: _ignored, ...safe } = user;
  return safe;
}

function buildInitialDailyChallenge(): DailyChallenge {
  return {
    id: `daily-${todayIsoDate()}`,
    date: todayIsoDate(),
    titleAz: 'Günün Qrammatika Missiyası: DİM & Aptis Qarışığı',
    descriptionAz: 'Müxtəlif mövzulardan 5 sualı tamamla, bonus XP və qızıl sikkə qazan.',
    targetQuestions: 5,
    xpReward: 100,
    coinReward: 35,
    questionIds: ['q-a1-2', 'q-a2-1', 'q-b1-1', 'q-b1-3', 'q-a2-5'],
  };
}

function createInitialStore(): StoreData {
  const demoStudentId = 'student-aysel-demo';
  const today = todayIsoDate();
  const demoStudent: StoredUser = {
    id: demoStudentId,
    email: 'aysel.demo@gamify.az',
    nickname: 'Aysel_2025',
    fullName: 'Aysel Məmmədova',
    role: 'student',
    activeMode: 'abituriyent',
    currentCefr: 'B1',
    xp: 640,
    level: 5,
    coins: 210,
    streakDays: 5,
    longestStreak: 7,
    lastActiveDate: today,
    dailyGoalTarget: 20,
    dailySolvedCount: 8,
    totalAnsweredCount: 18,
    totalCorrectCount: 15,
    subscriptionPlan: 'PREMIUM',
    onboardingCompleted: true,
    equippedOutfit: 'outfit_classic',
    equippedAccessory: 'acc_smart_glasses',
    equippedTheme: 'theme_indigo',
    unlockedShopItems: ['outfit_classic', 'acc_none', 'acc_smart_glasses', 'theme_indigo'],
    bookmarkedTopics: ['a2-present-perfect', 'b1-second-conditional'],
    seenQuoteIds: ['q-01'],
    createdAt: '2026-01-05T09:00:00Z',
    passwordHash: hashPassword('gamify-demo-student'),
  };

  const initialProgress: TopicProgress[] = [
    {
      topicId: 'a1-verb-to-be',
      mode: 'abituriyent',
      attempts: 5,
      correct: 5,
      completed: true,
      stars: 3,
      lastPracticedAt: '2026-01-18T12:00:00Z',
      nextReviewAt: '2026-01-25T12:00:00Z',
      intervalDays: 7,
    },
    {
      topicId: 'a1-articles',
      mode: 'abituriyent',
      attempts: 6,
      correct: 5,
      completed: true,
      stars: 3,
      lastPracticedAt: '2026-01-19T12:00:00Z',
      nextReviewAt: '2026-01-22T12:00:00Z',
      intervalDays: 3,
    },
    {
      topicId: 'a2-present-perfect',
      mode: 'abituriyent',
      attempts: 4,
      correct: 3,
      completed: true,
      stars: 2,
      lastPracticedAt: '2026-01-20T12:00:00Z',
      nextReviewAt: new Date(Date.now() - 86400000).toISOString(),
      intervalDays: 1,
    },
    {
      topicId: 'b1-second-conditional',
      mode: 'abituriyent',
      attempts: 3,
      correct: 2,
      completed: false,
      stars: 1,
      lastPracticedAt: '2026-01-20T15:00:00Z',
      nextReviewAt: new Date(Date.now() - 3600000).toISOString(),
      intervalDays: 1,
    },
  ];

  const initialMistakes: MistakeRecord[] = [
    {
      id: 'm-demo-1',
      userId: demoStudentId,
      questionId: 'q-a2-1',
      topicId: 'a2-present-perfect',
      topicTitle: 'Present Perfect',
      cefrLevel: 'A2',
      mode: 'abituriyent',
      questionText: 'She _____ to Paris three times in her life, and she _____ there last spring.',
      userAnswer: 'has been / has gone',
      correctAnswer: 'has been / went',
      explanationAz:
        '"In her life" həyat təcrübəsini bildirdiyi üçün Present Perfect ("has been"), "last spring" isə dəqiq keçmiş vaxt göstərdiyi üçün Past Simple ("went") tələb edir.',
      mistakeCount: 1,
      resolved: false,
      createdAt: '2026-01-19T14:20:00Z',
      lastAttemptAt: '2026-01-19T14:20:00Z',
    },
    {
      id: 'm-demo-2',
      userId: demoStudentId,
      questionId: 'q-a2-2',
      topicId: 'a2-first-conditional',
      topicTitle: 'First Conditional',
      cefrLevel: 'A2',
      mode: 'abituriyent',
      questionText: 'If it / will rain tomorrow, / we will stay / at home and revise.',
      userAnswer: 'we will stay',
      correctAnswer: 'will rain tomorrow,',
      explanationAz: 'First Conditional-da "If" budaq cümləsində gələcək zaman ("will") işlənmir! Düzgün forma: "If it rains tomorrow".',
      mistakeCount: 1,
      resolved: false,
      createdAt: '2026-01-20T10:15:00Z',
      lastAttemptAt: '2026-01-20T10:15:00Z',
    },
  ];

  return {
    users: [demoStudent],
    topics: SEED_TOPICS,
    questions: SEED_QUESTIONS,
    progress: {
      [demoStudentId]: initialProgress,
    },
    mistakes: initialMistakes,
    badgesEarned: {
      [demoStudentId]: ['badge-grammar-beginner'],
    },
    answerLogs: [
      {
        id: 'al-1',
        userId: demoStudentId,
        questionId: 'q-a1-1',
        topicId: 'a1-verb-to-be',
        cefrLevel: 'A1',
        mode: 'abituriyent',
        gameType: 'multiple_choice',
        isCorrect: true,
        responseSeconds: 12,
        xpEarned: 15,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'al-2',
        userId: demoStudentId,
        questionId: 'q-a1-2',
        topicId: 'a1-articles',
        cefrLevel: 'A1',
        mode: 'abituriyent',
        gameType: 'multiple_choice',
        isCorrect: true,
        responseSeconds: 16,
        xpEarned: 20,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'al-3',
        userId: demoStudentId,
        questionId: 'q-a2-1',
        topicId: 'a2-present-perfect',
        cefrLevel: 'A2',
        mode: 'abituriyent',
        gameType: 'multiple_choice',
        isCorrect: false,
        responseSeconds: 22,
        xpEarned: 3,
        createdAt: new Date().toISOString(),
      },
    ],
    aiLogs: [],
    subscriptionPlans: SEED_SUBSCRIPTION_PLANS,
    payments: [],
    dailyChallenge: buildInitialDailyChallenge(),
    dailyCompletedByUser: {},
    bossCompletedByUser: {},
    adminPasscodeHash: null,
    demoLeaderboard: [
      {
        rank: 1,
        userId: 'npc-1',
        nickname: 'Nigar_C1_Pro',
        xp: 2840,
        streakDays: 19,
        level: 18,
        cefrLevel: 'C1',
        mode: 'aptis',
        equippedAccessory: 'acc_scholar_crown',
      },
      {
        rank: 2,
        userId: 'npc-2',
        nickname: 'Murad_Baku99',
        xp: 2390,
        streakDays: 14,
        level: 15,
        cefrLevel: 'B2',
        mode: 'abituriyent',
        equippedAccessory: 'acc_golden_pin',
      },
      {
        rank: 3,
        userId: 'npc-3',
        nickname: 'Laman_DIM700',
        xp: 1950,
        streakDays: 11,
        level: 13,
        cefrLevel: 'B2',
        mode: 'abituriyent',
        equippedAccessory: 'acc_smart_glasses',
      },
      {
        rank: 4,
        userId: 'npc-4',
        nickname: 'Kamran_Aptis',
        xp: 1620,
        streakDays: 8,
        level: 11,
        cefrLevel: 'B1',
        mode: 'aptis',
        equippedAccessory: 'acc_none',
      },
      {
        rank: 5,
        userId: 'npc-5',
        nickname: 'Fidan_Ganja',
        xp: 1180,
        streakDays: 6,
        level: 8,
        cefrLevel: 'A2',
        mode: 'abituriyent',
        equippedAccessory: 'acc_smart_glasses',
      },
    ],
  };
}

class GamifyStore {
  private data: StoreData;

  constructor() {
    this.data = this.load();
  }

  private load(): StoreData {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as StoreData;
        if (parsed && Array.isArray(parsed.topics) && Array.isArray(parsed.questions)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed loading store file, creating fresh store:', err);
    }
    const fresh = createInitialStore();
    this.save(fresh);
    return fresh;
  }

  private save(nextData?: StoreData) {
    const target = nextData || this.data;
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpPath = `${STORE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(target, null, 2), 'utf-8');
    fs.renameSync(tmpPath, STORE_PATH);
  }

  public getBootstrapStatus() {
    const hasEnvPasscode = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0);
    const hasClaimedAdmin = Boolean(this.data.adminPasscodeHash);
    return {
      requiresFirstRunClaim: !hasEnvPasscode && !hasClaimedAdmin,
      hasEnvPasscode,
    };
  }

  public claimInitialAdmin(email: string, nickname: string, password: string): { user: UserAccount; token: string } {
    const status = this.getBootstrapStatus();
    if (!status.requiresFirstRunClaim) {
      throw new Error('Admin hesabı artıq konfiqurasiya edilib.');
    }
    if (!email || !password || password.length < 6) {
      throw new Error('E-poçt və ən azı 6 simvollu şifrə tələb olunur.');
    }
    this.data.adminPasscodeHash = hashPassword(password);
    let existing = this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      existing.role = 'admin';
      existing.passwordHash = hashPassword(password);
      existing.subscriptionPlan = 'PRO';
    } else {
      existing = {
        id: `admin-${crypto.randomUUID()}`,
        email: email.trim().toLowerCase(),
        nickname: nickname.trim() || 'Nurdan_Admin',
        fullName: 'Platforma Administratoru',
        role: 'admin',
        activeMode: 'abituriyent',
        currentCefr: 'C1',
        xp: 0,
        level: 1,
        coins: 500,
        streakDays: 1,
        longestStreak: 1,
        lastActiveDate: todayIsoDate(),
        dailyGoalTarget: 20,
        dailySolvedCount: 0,
        totalAnsweredCount: 0,
        totalCorrectCount: 0,
        subscriptionPlan: 'PRO',
        onboardingCompleted: true,
        equippedOutfit: 'outfit_violet_scholar',
        equippedAccessory: 'acc_golden_pin',
        equippedTheme: 'theme_royal_gold',
        unlockedShopItems: SEED_SHOP_ITEMS.map((i) => i.id),
        bookmarkedTopics: [],
        seenQuoteIds: [],
        createdAt: new Date().toISOString(),
        passwordHash: hashPassword(password),
      };
      this.data.users.push(existing);
    }
    this.save();
    return {
      user: sanitizeUser(existing),
      token: signSessionToken(existing.id, 'admin'),
    };
  }

  public verifyAdminPasscode(passcode: string): boolean {
    const envCode = process.env.ADMIN_PASSCODE?.trim();
    if (envCode) {
      const a = Buffer.from(passcode);
      const b = Buffer.from(envCode);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    }
    if (this.data.adminPasscodeHash) {
      return verifyPassword(passcode, this.data.adminPasscodeHash);
    }
    return false;
  }

  public registerUser(input: {
    email: string;
    password: string;
    nickname: string;
    fullName?: string;
    mode?: LearningMode;
  }): { user: UserAccount; token: string } {
    const cleanEmail = input.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Düzgün e-poçt ünvanı daxil edin.');
    }
    if (!input.password || input.password.length < 6) {
      throw new Error('Şifrə ən azı 6 simvol olmalıdır.');
    }
    if (this.data.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Bu e-poçt ünvanı ilə artıq hesab mövcuddur.');
    }
    const nickname = (input.nickname || cleanEmail.split('@')[0]).trim().slice(0, 20);
    const newUser: StoredUser = {
      id: `user-${crypto.randomUUID()}`,
      email: cleanEmail,
      nickname,
      fullName: input.fullName?.trim() || nickname,
      role: 'student',
      activeMode: input.mode || 'abituriyent',
      currentCefr: 'A1',
      xp: 0,
      level: 1,
      coins: 50,
      streakDays: 1,
      longestStreak: 1,
      lastActiveDate: todayIsoDate(),
      dailyGoalTarget: 20,
      dailySolvedCount: 0,
      totalAnsweredCount: 0,
      totalCorrectCount: 0,
      subscriptionPlan: 'FREE',
      onboardingCompleted: false,
      equippedOutfit: 'outfit_classic',
      equippedAccessory: 'acc_none',
      equippedTheme: 'theme_indigo',
      unlockedShopItems: ['outfit_classic', 'acc_none', 'theme_indigo'],
      bookmarkedTopics: [],
      seenQuoteIds: [],
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(input.password),
    };
    this.data.users.push(newUser);
    this.save();
    return {
      user: sanitizeUser(newUser),
      token: signSessionToken(newUser.id, newUser.role),
    };
  }

  public loginUser(email: string, password: string): { user: UserAccount; token: string } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.data.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new Error('E-poçt və ya şifrə yanlışdır.');
    }
    this.touchDailyStreak(user);
    this.save();
    return {
      user: sanitizeUser(user),
      token: signSessionToken(user.id, user.role),
    };
  }

  public loginAdminWithPasscode(email: string, passcode: string): { user: UserAccount; token: string } {
    if (!this.verifyAdminPasscode(passcode)) {
      throw new Error('Administrator kodu yanlışdır.');
    }
    const cleanEmail = (email || 'admin@gamify.az').trim().toLowerCase();
    let adminUser = this.data.users.find((u) => u.role === 'admin' && u.email.toLowerCase() === cleanEmail);
    if (!adminUser) {
      adminUser = this.data.users.find((u) => u.role === 'admin');
    }
    if (!adminUser) {
      adminUser = {
        id: `admin-${crypto.randomUUID()}`,
        email: cleanEmail,
        nickname: 'Nurdan_Admin',
        fullName: 'Platforma Administratoru',
        role: 'admin',
        activeMode: 'abituriyent',
        currentCefr: 'C1',
        xp: 0,
        level: 1,
        coins: 500,
        streakDays: 1,
        longestStreak: 1,
        lastActiveDate: todayIsoDate(),
        dailyGoalTarget: 20,
        dailySolvedCount: 0,
        totalAnsweredCount: 0,
        totalCorrectCount: 0,
        subscriptionPlan: 'PRO',
        onboardingCompleted: true,
        equippedOutfit: 'outfit_violet_scholar',
        equippedAccessory: 'acc_golden_pin',
        equippedTheme: 'theme_royal_gold',
        unlockedShopItems: SEED_SHOP_ITEMS.map((i) => i.id),
        bookmarkedTopics: [],
        seenQuoteIds: [],
        createdAt: new Date().toISOString(),
        passwordHash: hashPassword(passcode),
      };
      this.data.users.push(adminUser);
      this.save();
    }
    return {
      user: sanitizeUser(adminUser),
      token: signSessionToken(adminUser.id, 'admin'),
    };
  }

  public getDemoSession(): { user: UserAccount; token: string } {
    const demo = this.data.users.find((u) => u.id === 'student-aysel-demo') || this.data.users[0];
    this.touchDailyStreak(demo);
    this.save();
    return {
      user: sanitizeUser(demo),
      token: signSessionToken(demo.id, demo.role),
    };
  }

  public getUserById(userId: string): UserAccount | null {
    const user = this.data.users.find((u) => u.id === userId);
    return user ? sanitizeUser(user) : null;
  }

  private getStoredUser(userId: string): StoredUser {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('İstifadəçi tapılmadı.');
    return user;
  }

  private touchDailyStreak(user: StoredUser) {
    const today = todayIsoDate();
    if (user.lastActiveDate === today) return;
    const prev = new Date(user.lastActiveDate);
    const curr = new Date(today);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      user.streakDays += 1;
    } else if (diffDays > 1) {
      user.streakDays = 1;
    }
    if (user.streakDays > user.longestStreak) {
      user.longestStreak = user.streakDays;
    }
    user.dailySolvedCount = 0;
    user.lastActiveDate = today;
  }

  public updateProfile(
    userId: string,
    patch: Partial<{
      nickname: string;
      fullName: string;
      activeMode: LearningMode;
      currentCefr: CefrLevelCode;
      dailyGoalTarget: number;
      onboardingCompleted: boolean;
      equippedOutfit: string;
      equippedAccessory: string;
      equippedTheme: string;
    }>
  ): UserAccount {
    const user = this.getStoredUser(userId);
    if (patch.nickname !== undefined && patch.nickname.trim().length >= 2) {
      user.nickname = patch.nickname.trim().slice(0, 20);
    }
    if (patch.fullName !== undefined) {
      user.fullName = patch.fullName.trim().slice(0, 60);
    }
    if (patch.activeMode === 'abituriyent' || patch.activeMode === 'aptis') {
      user.activeMode = patch.activeMode;
    }
    if (patch.currentCefr && ['A1', 'A2', 'B1', 'B2', 'C1'].includes(patch.currentCefr)) {
      user.currentCefr = patch.currentCefr;
    }
    if (typeof patch.dailyGoalTarget === 'number' && patch.dailyGoalTarget >= 5 && patch.dailyGoalTarget <= 100) {
      user.dailyGoalTarget = patch.dailyGoalTarget;
    }
    if (typeof patch.onboardingCompleted === 'boolean') {
      user.onboardingCompleted = patch.onboardingCompleted;
    }
    if (patch.equippedOutfit && user.unlockedShopItems.includes(patch.equippedOutfit)) {
      user.equippedOutfit = patch.equippedOutfit;
    }
    if (patch.equippedAccessory && user.unlockedShopItems.includes(patch.equippedAccessory)) {
      user.equippedAccessory = patch.equippedAccessory;
    }
    if (patch.equippedTheme && user.unlockedShopItems.includes(patch.equippedTheme)) {
      user.equippedTheme = patch.equippedTheme;
    }
    this.save();
    return sanitizeUser(user);
  }

  public toggleBookmarkTopic(userId: string, topicId: string): string[] {
    const user = this.getStoredUser(userId);
    const exists = user.bookmarkedTopics.includes(topicId);
    if (exists) {
      user.bookmarkedTopics = user.bookmarkedTopics.filter((id) => id !== topicId);
    } else {
      user.bookmarkedTopics.push(topicId);
      user.xp += 10;
      user.level = Math.floor(user.xp / 160) + 1;
    }
    this.save();
    return user.bookmarkedTopics;
  }

  public getTopics(filter?: { mode?: LearningMode; cefrLevel?: CefrLevelCode }): GrammarTopic[] {
    return this.data.topics.filter((t) => {
      if (filter?.cefrLevel && t.cefrLevel !== filter.cefrLevel) return false;
      if (filter?.mode && !t.modes.includes(filter.mode)) return false;
      return true;
    });
  }

  public getQuestions(filter?: {
    topicId?: string;
    cefrLevel?: CefrLevelCode;
    mode?: LearningMode;
    gameType?: GameType;
    includeUnpublished?: boolean;
  }): QuestionItem[] {
    return this.data.questions.filter((q) => {
      if (!filter?.includeUnpublished && !q.isPublished) return false;
      if (filter?.topicId && q.topicId !== filter.topicId) return false;
      if (filter?.cefrLevel && q.cefrLevel !== filter.cefrLevel) return false;
      if (filter?.mode && q.mode !== 'both' && q.mode !== filter.mode) return false;
      if (filter?.gameType && q.gameType !== filter.gameType) return false;
      return true;
    });
  }

  public getUserProgress(userId: string): TopicProgress[] {
    return this.data.progress[userId] || [];
  }

  public getUserMistakes(userId: string): MistakeRecord[] {
    return this.data.mistakes
      .filter((m) => m.userId === userId)
      .sort((a, b) => new Date(b.lastAttemptAt).getTime() - new Date(a.lastAttemptAt).getTime());
  }

  public getUserBadges(userId: string): { earnedIds: string[]; definitions: BadgeDefinition[] } {
    return {
      earnedIds: this.data.badgesEarned[userId] || [],
      definitions: SEED_BADGES,
    };
  }

  public getShopCatalog(): ShopItem[] {
    return SEED_SHOP_ITEMS;
  }

  public buyShopItem(userId: string, itemId: string): UserAccount {
    const user = this.getStoredUser(userId);
    const item = SEED_SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) throw new Error('Məhsul tapılmadı.');
    if (user.unlockedShopItems.includes(itemId)) {
      if (item.category === 'outfit') user.equippedOutfit = itemId;
      if (item.category === 'accessory') user.equippedAccessory = itemId;
      if (item.category === 'theme') user.equippedTheme = itemId;
      this.save();
      return sanitizeUser(user);
    }
    if (user.coins < item.priceCoins) {
      throw new Error(`Kifayət qədər sikkə yoxdur (Tələb olunur: ${item.priceCoins}).`);
    }
    user.coins -= item.priceCoins;
    user.unlockedShopItems.push(itemId);
    if (item.category === 'outfit') user.equippedOutfit = itemId;
    if (item.category === 'accessory') user.equippedAccessory = itemId;
    if (item.category === 'theme') user.equippedTheme = itemId;
    this.save();
    return sanitizeUser(user);
  }

  private evaluateAnswerMatch(question: QuestionItem, submitted: string): boolean {
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    const subNorm = norm(submitted);
    if (subNorm === norm(question.correctAnswer)) return true;
    if (question.acceptedAnswers?.some((a) => norm(a) === subNorm)) return true;
    return false;
  }

  private pickNextMotivationalQuote(user: StoredUser): MotivationalQuote {
    let unseen = SEED_QUOTES.filter((q) => !user.seenQuoteIds.includes(q.id));
    if (unseen.length === 0) {
      user.seenQuoteIds = [];
      unseen = SEED_QUOTES;
    }
    const chosen = unseen[0];
    user.seenQuoteIds.push(chosen.id);
    return chosen;
  }

  private evaluateAndAwardBadges(
    user: StoredUser,
    question: QuestionItem,
    isCorrect: boolean,
    sessionPerfect?: boolean
  ): BadgeDefinition[] {
    const current = new Set(this.data.badgesEarned[user.id] || []);
    const newlyAwarded: BadgeDefinition[] = [];
    const logs = this.data.answerLogs.filter((l) => l.userId === user.id);

    const award = (badgeId: string) => {
      if (!current.has(badgeId)) {
        const def = SEED_BADGES.find((b) => b.id === badgeId);
        if (def) {
          current.add(badgeId);
          user.xp += def.xpBonus;
          user.coins += def.coinBonus;
          newlyAwarded.push(def);
        }
      }
    };

    if (user.totalAnsweredCount >= 5) award('badge-grammar-beginner');
    if (user.totalAnsweredCount >= 50) award('badge-consistency-master');
    if (user.streakDays >= 7) award('badge-weekly-warrior');
    if (sessionPerfect && isCorrect) award('badge-perfect-score');

    const topic = this.data.topics.find((t) => t.id === question.topicId);
    const tenseCorrect = logs.filter((l) => {
      const t = this.data.topics.find((tp) => tp.id === l.topicId);
      return l.isCorrect && t?.category === 'Zamanlar';
    }).length;
    if (tenseCorrect >= 5 || (isCorrect && topic?.category === 'Zamanlar' && user.xp >= 700)) {
      award('badge-tense-master');
    }

    const articleCorrect = logs.filter((l) => l.isCorrect && l.topicId === 'a1-articles').length;
    if (articleCorrect >= 1 && isCorrect && question.topicId === 'a1-articles') {
      award('badge-article-expert');
    }

    const builderCorrect = logs.filter((l) => l.isCorrect && l.gameType === 'sentence_builder').length;
    if (builderCorrect >= 2 && isCorrect && question.gameType === 'sentence_builder') {
      award('badge-sentence-builder');
    }

    const advCorrect = logs.filter(
      (l) => l.isCorrect && (l.cefrLevel === 'B2' || l.cefrLevel === 'C1')
    ).length;
    if (advCorrect >= 3) {
      award('badge-advanced-expert');
    }

    const bossWins = (this.data.bossCompletedByUser[user.id] || []).length;
    if (user.xp >= 500 && bossWins >= 1) {
      award('badge-grammar-champion');
    }

    this.data.badgesEarned[user.id] = Array.from(current);
    return newlyAwarded;
  }

  public submitAnswer(
    userId: string,
    payload: {
      questionId: string;
      submittedAnswer: string;
      mode: LearningMode;
      responseSeconds?: number;
      sessionPerfectSoFar?: boolean;
    }
  ): {
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
  } {
    const user = this.getStoredUser(userId);
    this.touchDailyStreak(user);

    const plan = this.getSubscriptionPlans().find((p) => p.code === user.subscriptionPlan)!;
    if (user.dailySolvedCount >= plan.dailyQuestionLimit) {
      throw new Error(
        `Gündəlik sual limitinizə (${plan.dailyQuestionLimit}) çatdınız. Limitsiz məşq üçün planınızı yeniləyin.`
      );
    }

    const question = this.data.questions.find((q) => q.id === payload.questionId);
    if (!question) throw new Error('Sual tapılmadı.');

    const isCorrect = this.evaluateAnswerMatch(question, payload.submittedAnswer);
    const xpEarned = isCorrect ? question.xpValue : 3; // Positive reinforcement, zero lives/hearts loss
    const coinsEarned = isCorrect ? question.coinValue : 1;

    user.xp += xpEarned;
    user.level = Math.floor(user.xp / 160) + 1;
    user.coins += coinsEarned;
    user.dailySolvedCount += 1;
    user.totalAnsweredCount += 1;
    if (isCorrect) {
      user.totalCorrectCount += 1;
    }

    // Answer log
    this.data.answerLogs.push({
      id: `al-${crypto.randomUUID()}`,
      userId: user.id,
      questionId: question.id,
      topicId: question.topicId,
      cefrLevel: question.cefrLevel,
      mode: payload.mode,
      gameType: question.gameType,
      isCorrect,
      responseSeconds: Math.max(1, Math.min(300, payload.responseSeconds || 15)),
      xpEarned,
      createdAt: new Date().toISOString(),
    });

    // Update topic progress + spaced repetition interval
    const userProg = this.data.progress[user.id] || [];
    let topicProg = userProg.find(
      (p) => p.topicId === question.topicId && p.mode === payload.mode
    );
    if (!topicProg) {
      topicProg = {
        topicId: question.topicId,
        mode: payload.mode,
        attempts: 0,
        correct: 0,
        completed: false,
        stars: 0,
        lastPracticedAt: new Date().toISOString(),
        nextReviewAt: new Date().toISOString(),
        intervalDays: 1,
      };
      userProg.push(topicProg);
    }
    topicProg.attempts += 1;
    if (isCorrect) {
      topicProg.correct += 1;
      topicProg.intervalDays = Math.min(30, topicProg.intervalDays * 2);
    } else {
      topicProg.intervalDays = 1; // Spaced repetition brings weak topics back tomorrow
    }
    const accuracy = topicProg.correct / Math.max(1, topicProg.attempts);
    topicProg.completed = topicProg.attempts >= 2 && accuracy >= 0.6;
    topicProg.stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : accuracy >= 0.5 ? 1 : 0;
    topicProg.lastPracticedAt = new Date().toISOString();
    topicProg.nextReviewAt = new Date(
      Date.now() + topicProg.intervalDays * 24 * 60 * 60 * 1000
    ).toISOString();
    this.data.progress[user.id] = userProg;

    // Update Mistake Archive
    const topic = this.data.topics.find((t) => t.id === question.topicId);
    const existingMistake = this.data.mistakes.find(
      (m) => m.userId === user.id && m.questionId === question.id
    );
    if (!isCorrect) {
      if (existingMistake) {
        existingMistake.mistakeCount += 1;
        existingMistake.userAnswer = payload.submittedAnswer;
        existingMistake.resolved = false;
        existingMistake.lastAttemptAt = new Date().toISOString();
      } else {
        this.data.mistakes.push({
          id: `m-${crypto.randomUUID()}`,
          userId: user.id,
          questionId: question.id,
          topicId: question.topicId,
          topicTitle: topic?.title || question.topicId,
          cefrLevel: question.cefrLevel,
          mode: payload.mode,
          questionText: question.questionText,
          userAnswer: payload.submittedAnswer,
          correctAnswer: question.correctAnswer,
          explanationAz: question.explanationAz,
          mistakeCount: 1,
          resolved: false,
          createdAt: new Date().toISOString(),
          lastAttemptAt: new Date().toISOString(),
        });
      }
    } else if (existingMistake) {
      existingMistake.resolved = true;
      existingMistake.lastAttemptAt = new Date().toISOString();
    }

    const newlyUnlockedBadges = this.evaluateAndAwardBadges(
      user,
      question,
      isCorrect,
      payload.sessionPerfectSoFar
    );

    // Every 10 completed questions (regardless of correct/incorrect), show a non-repeating famous quote
    const motivationalQuote =
      user.totalAnsweredCount > 0 && user.totalAnsweredCount % 10 === 0
        ? this.pickNextMotivationalQuote(user)
        : null;

    this.save();
    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanationAz: question.explanationAz,
      commonTrapAz: question.commonTrapAz,
      xpEarned,
      coinsEarned,
      user: sanitizeUser(user),
      newlyUnlockedBadges,
      motivationalQuote,
      topicProgress: topicProg,
    };
  }

  public getDailyChallenge(userId: string): {
    challenge: DailyChallenge;
    questions: QuestionItem[];
    completedToday: boolean;
  } {
    const today = todayIsoDate();
    if (this.data.dailyChallenge.date !== today) {
      this.data.dailyChallenge = buildInitialDailyChallenge();
      this.save();
    }
    const questions = this.data.dailyChallenge.questionIds
      .map((id) => this.data.questions.find((q) => q.id === id))
      .filter((q): q is QuestionItem => Boolean(q));
    const completedToday = (this.data.dailyCompletedByUser[today] || []).includes(userId);
    return {
      challenge: this.data.dailyChallenge,
      questions,
      completedToday,
    };
  }

  public completeDailyChallenge(userId: string): { user: UserAccount; xpAdded: number; coinsAdded: number } {
    const user = this.getStoredUser(userId);
    const today = todayIsoDate();
    const completedList = this.data.dailyCompletedByUser[today] || [];
    if (completedList.includes(userId)) {
      return { user: sanitizeUser(user), xpAdded: 0, coinsAdded: 0 };
    }
    completedList.push(userId);
    this.data.dailyCompletedByUser[today] = completedList;
    const xpAdded = this.data.dailyChallenge.xpReward;
    const coinsAdded = this.data.dailyChallenge.coinReward;
    user.xp += xpAdded;
    user.level = Math.floor(user.xp / 160) + 1;
    user.coins += coinsAdded;
    this.save();
    return { user: sanitizeUser(user), xpAdded, coinsAdded };
  }

  public getBossChallenges(userId: string): {
    challenges: BossChallenge[];
    completedIds: string[];
  } {
    return {
      challenges: SEED_BOSS_CHALLENGES,
      completedIds: this.data.bossCompletedByUser[userId] || [],
    };
  }

  public completeBossChallenge(
    userId: string,
    bossId: string,
    scorePercent: number
  ): {
    passed: boolean;
    user: UserAccount;
    xpAdded: number;
    coinsAdded: number;
    badgeAwarded: BadgeDefinition | null;
  } {
    const user = this.getStoredUser(userId);
    const boss = SEED_BOSS_CHALLENGES.find((b) => b.id === bossId);
    if (!boss) throw new Error('Boss sınağı tapılmadı.');
    const passed = scorePercent >= boss.passPercent;
    if (!passed) {
      return { passed: false, user: sanitizeUser(user), xpAdded: 0, coinsAdded: 0, badgeAwarded: null };
    }

    const done = this.data.bossCompletedByUser[userId] || [];
    let xpAdded = 0;
    let coinsAdded = 0;
    let badgeAwarded: BadgeDefinition | null = null;

    if (!done.includes(bossId)) {
      done.push(bossId);
      this.data.bossCompletedByUser[userId] = done;
      xpAdded = boss.xpReward;
      coinsAdded = boss.coinReward;
      user.xp += xpAdded;
      user.coins += coinsAdded;
      user.level = Math.floor(user.xp / 160) + 1;

      const badgeDef = SEED_BADGES.find((b) => b.name === boss.badgeName);
      if (badgeDef) {
        const current = new Set(this.data.badgesEarned[userId] || []);
        if (!current.has(badgeDef.id)) {
          current.add(badgeDef.id);
          this.data.badgesEarned[userId] = Array.from(current);
          badgeAwarded = badgeDef;
        }
      }
      // Unlock next CEFR automatically upon passing Boss
      const order: CefrLevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
      const idx = order.indexOf(boss.cefrLevel);
      if (idx >= 0 && idx + 1 < order.length) {
        const nextCefr = order[idx + 1];
        if (order.indexOf(user.currentCefr) <= idx) {
          user.currentCefr = nextCefr;
        }
      }
    }
    this.save();
    return {
      passed: true,
      user: sanitizeUser(user),
      xpAdded,
      coinsAdded,
      badgeAwarded,
    };
  }

  public getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'overall'): LeaderboardEntry[] {
    const factor = period === 'daily' ? 0.15 : period === 'weekly' ? 0.45 : period === 'monthly' ? 0.78 : 1;
    const realEntries: LeaderboardEntry[] = this.data.users
      .filter((u) => u.role === 'student')
      .map((u) => ({
        rank: 0,
        userId: u.id,
        nickname: u.nickname, // Nickname only, no PII!
        xp: Math.max(10, Math.round(u.xp * factor)),
        streakDays: u.streakDays,
        level: u.level,
        cefrLevel: u.currentCefr,
        mode: u.activeMode,
        equippedAccessory: u.equippedAccessory,
      }));

    const npcEntries: LeaderboardEntry[] = this.data.demoLeaderboard.map((e) => ({
      ...e,
      xp: Math.round(e.xp * factor),
    }));

    return [...realEntries, ...npcEntries]
      .sort((a, b) => b.xp - a.xp)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }

  public getAnalytics(userId: string): AnalyticsSnapshot {
    const user = this.getStoredUser(userId);
    const logs = this.data.answerLogs.filter((l) => l.userId === userId);
    const prog = this.data.progress[userId] || [];
    const totalAnswered = Math.max(user.totalAnsweredCount, logs.length);
    const totalCorrect = Math.max(user.totalCorrectCount, logs.filter((l) => l.isCorrect).length);
    const accuracyPercent = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const avgSec =
      logs.length > 0
        ? Math.round(logs.reduce((acc, l) => acc + l.responseSeconds, 0) / logs.length)
        : 16;

    const cefrMastery: Record<CefrLevelCode, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
    (['A1', 'A2', 'B1', 'B2', 'C1'] as CefrLevelCode[]).forEach((lvl) => {
      const topicsInLvl = this.data.topics.filter((t) => t.cefrLevel === lvl);
      const completedInLvl = prog.filter((p) => {
        const t = topicsInLvl.find((tp) => tp.id === p.topicId);
        return t && p.completed;
      }).length;
      cefrMastery[lvl] =
        topicsInLvl.length > 0 ? Math.round((completedInLvl / topicsInLvl.length) * 100) : 0;
    });

    const dayNames = ['B.e', 'Ç.a', 'Çər', 'C.a', 'Cüm', 'Şən', 'Baz'];
    const weeklyActivity = dayNames.map((day, idx) => {
      const base = logs.length > 0 ? Math.max(2, (idx * 3 + totalAnswered) % 14) : 0;
      const correct = Math.max(0, Math.round(base * (accuracyPercent / 100)));
      return {
        day,
        solved: idx === 6 ? user.dailySolvedCount : base,
        correct: idx === 6 ? Math.round(user.dailySolvedCount * 0.85) : correct,
        xp: (idx === 6 ? user.dailySolvedCount : base) * 18,
      };
    });

    const topicStats = prog.map((p) => {
      const topic = this.data.topics.find((t) => t.id === p.topicId);
      return {
        topicId: p.topicId,
        title: topic?.title || p.topicId,
        accuracy: p.attempts > 0 ? Math.round((p.correct / p.attempts) * 100) : 0,
        attempts: p.attempts,
      };
    });

    const strongestTopics = [...topicStats].sort((a, b) => b.accuracy - a.accuracy).slice(0, 4);
    const weakestTopics = [...topicStats].sort((a, b) => a.accuracy - b.accuracy).slice(0, 4);
    const now = Date.now();
    const dueForReviewCount = prog.filter((p) => new Date(p.nextReviewAt).getTime() <= now).length;

    return {
      accuracyPercent,
      totalAnswered,
      totalCorrect,
      totalMistakes: this.data.mistakes.filter((m) => m.userId === userId && !m.resolved).length,
      averageResponseSeconds: avgSec,
      cefrMastery,
      weeklyActivity,
      strongestTopics,
      weakestTopics,
      dueForReviewCount,
    };
  }

  public getSubscriptionPlans(): SubscriptionPlanConfig[] {
    return this.data.subscriptionPlans;
  }

  public updateSubscriptionPlanPrice(
    code: SubscriptionPlanCode,
    monthlyPriceAzn: number,
    yearlyPriceAzn: number
  ): SubscriptionPlanConfig[] {
    const plan = this.data.subscriptionPlans.find((p) => p.code === code);
    if (!plan) throw new Error('Plan tapılmadı.');
    plan.monthlyPriceAzn = Math.max(0, Number(monthlyPriceAzn));
    plan.yearlyPriceAzn = Math.max(0, Number(yearlyPriceAzn));
    this.save();
    return this.data.subscriptionPlans;
  }

  public prepareSubscriptionCheckout(
    userId: string,
    planCode: SubscriptionPlanCode,
    billingCycle: 'monthly' | 'yearly',
    activatePreviewMode?: boolean
  ): { payment: PaymentRecord; user: UserAccount } {
    const user = this.getStoredUser(userId);
    const plan = this.data.subscriptionPlans.find((p) => p.code === planCode);
    if (!plan) throw new Error('Plan tapılmadı.');
    const amountAzn = billingCycle === 'yearly' ? plan.yearlyPriceAzn : plan.monthlyPriceAzn;
    const isFree = planCode === 'FREE';
    const payment: PaymentRecord = {
      id: `pay-${crypto.randomUUID()}`,
      userId,
      planCode,
      billingCycle,
      amountAzn,
      status: isFree || activatePreviewMode ? 'completed' : 'pending_gateway',
      providerNote: isFree
        ? 'Pulsuz plan aktivləşdirildi'
        : activatePreviewMode
          ? 'Önizləmə test aktivasiyası (real ödəniş şlüzü qoşulduqda avtomatik təsdiqlənəcək)'
          : 'Ödəniş şlüzü (Kapital / Azericard / Stripe) qoşulması gözlənilir',
      createdAt: new Date().toISOString(),
    };
    this.data.payments.push(payment);
    if (isFree || activatePreviewMode) {
      user.subscriptionPlan = planCode;
    }
    this.save();
    return { payment, user: sanitizeUser(user) };
  }

  public logAiInteraction(log: Omit<AiInteractionLog, 'id' | 'createdAt'>) {
    this.data.aiLogs.push({
      ...log,
      id: `ai-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    });
    if (this.data.aiLogs.length > 200) {
      this.data.aiLogs = this.data.aiLogs.slice(-200);
    }
    this.save();
  }

  public getDailyAiCount(userId: string): number {
    const today = todayIsoDate();
    return this.data.aiLogs.filter((l) => l.userId === userId && l.createdAt.startsWith(today)).length;
  }

  // ======================== ADMIN OPERATIONS ========================
  public validateQuestionPayload(q: Partial<QuestionItem>): string | null {
    if (!q.topicId || !this.data.topics.some((t) => t.id === q.topicId)) {
      return 'Etibarlı qrammatika mövzusu (topicId) seçilməlidir.';
    }
    if (!q.questionText || q.questionText.trim().length < 5) {
      return 'Sual mətni ən azı 5 simvol olmalıdır.';
    }
    if (!q.correctAnswer || q.correctAnswer.trim().length < 1) {
      return 'Düzgün cavab boş ola bilməz.';
    }
    if (!q.explanationAz || q.explanationAz.trim().length < 10) {
      return 'Azərbaycan dilində izah (ən azı 10 simvol) mütləqdir.';
    }
    if (!q.cefrLevel || !['A1', 'A2', 'B1', 'B2', 'C1'].includes(q.cefrLevel)) {
      return 'CEFR səviyyəsi A1–C1 arası olmalıdır.';
    }
    const duplicate = this.data.questions.find(
      (existing) =>
        existing.id !== q.id &&
        existing.questionText.trim().toLowerCase() === q.questionText!.trim().toLowerCase()
    );
    if (duplicate) {
      return 'Eyni mətnli təkrar sual bazada artıq mövcuddur.';
    }
    return null;
  }

  public upsertQuestion(input: Partial<QuestionItem>): QuestionItem {
    const validationError = this.validateQuestionPayload(input);
    if (validationError) {
      throw new Error(validationError);
    }
    if (input.id) {
      const idx = this.data.questions.findIndex((q) => q.id === input.id);
      if (idx >= 0) {
        this.data.questions[idx] = {
          ...this.data.questions[idx],
          ...input,
        } as QuestionItem;
        this.save();
        return this.data.questions[idx];
      }
    }
    const created: QuestionItem = {
      id: `q-custom-${crypto.randomUUID().slice(0, 8)}`,
      topicId: input.topicId!,
      cefrLevel: input.cefrLevel!,
      mode: input.mode || 'both',
      gameType: input.gameType || 'multiple_choice',
      difficulty: input.difficulty || 'Orta',
      promptAz: input.promptAz?.trim() || 'Düzgün variantı seçin.',
      questionText: input.questionText!.trim(),
      options: input.options,
      correctAnswer: input.correctAnswer!.trim(),
      acceptedAnswers: input.acceptedAnswers,
      wordTokens: input.wordTokens,
      segments: input.segments,
      matchingPairs: input.matchingPairs,
      dragItems: input.dragItems,
      dragSlots: input.dragSlots,
      explanationAz: input.explanationAz!.trim(),
      commonTrapAz: input.commonTrapAz?.trim(),
      xpValue: Number(input.xpValue) || 20,
      coinValue: Number(input.coinValue) || 7,
      isPublished: input.isPublished !== undefined ? input.isPublished : true,
      sourceTag: input.sourceTag || 'admin-added',
      createdAt: new Date().toISOString(),
    };
    this.data.questions.unshift(created);
    this.save();
    return created;
  }

  public deleteQuestion(questionId: string) {
    this.data.questions = this.data.questions.filter((q) => q.id !== questionId);
    this.save();
  }

  public importQuestionsCsv(csvText: string): {
    importedCount: number;
    errors: Array<{ row: number; reason: string }>;
  } {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      throw new Error('CSV faylında başlıq sətri və ən azı 1 sual sətri olmalıdır.');
    }
    const errors: Array<{ row: number; reason: string }> = [];
    let importedCount = 0;

    // Expected columns: topicId,cefrLevel,mode,gameType,promptAz,questionText,optionsPipe,correctAnswer,explanationAz
    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvRow(lines[i]);
      if (cols.length < 9) {
        errors.push({ row: i + 1, reason: 'Sütun sayı natamamdır (9 sütun tələb olunur).' });
        continue;
      }
      const [topicId, cefrLevel, mode, gameType, promptAz, questionText, optionsPipe, correctAnswer, explanationAz] =
        cols;
      try {
        this.upsertQuestion({
          topicId,
          cefrLevel: cefrLevel as CefrLevelCode,
          mode: (mode as LearningMode | 'both') || 'both',
          gameType: (gameType as GameType) || 'multiple_choice',
          promptAz,
          questionText,
          options: optionsPipe ? optionsPipe.split('|').map((s) => s.trim()) : undefined,
          correctAnswer,
          explanationAz,
          sourceTag: 'admin-added',
          isPublished: true,
        });
        importedCount += 1;
      } catch (err: any) {
        errors.push({ row: i + 1, reason: err?.message || 'Validasiya xətası' });
      }
    }
    return { importedCount, errors };
  }

  private parseCsvRow(row: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (inQuotes && row[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  }

  public updateTopic(topicId: string, patch: Partial<GrammarTopic>): GrammarTopic {
    const idx = this.data.topics.findIndex((t) => t.id === topicId);
    if (idx < 0) throw new Error('Mövzu tapılmadı.');
    this.data.topics[idx] = { ...this.data.topics[idx], ...patch, id: topicId };
    this.save();
    return this.data.topics[idx];
  }

  public getAdminOverview() {
    const students = this.data.users.map(sanitizeUser);
    return {
      totalUsers: students.length,
      totalTopics: this.data.topics.length,
      totalQuestions: this.data.questions.length,
      publishedQuestions: this.data.questions.filter((q) => q.isPublished).length,
      totalAnswersLogged: this.data.answerLogs.length,
      totalAiInteractions: this.data.aiLogs.length,
      users: students,
      recentAiLogs: this.data.aiLogs.slice(-15).reverse(),
      recentPayments: this.data.payments.slice(-15).reverse(),
      subscriptionPlans: this.data.subscriptionPlans,
    };
  }

  public adminUpdateUser(
    targetUserId: string,
    patch: Partial<{ subscriptionPlan: SubscriptionPlanCode; role: 'student' | 'admin'; coins: number }>
  ): UserAccount {
    const user = this.getStoredUser(targetUserId);
    if (patch.subscriptionPlan) user.subscriptionPlan = patch.subscriptionPlan;
    if (patch.role) user.role = patch.role;
    if (typeof patch.coins === 'number') user.coins = Math.max(0, patch.coins);
    this.save();
    return sanitizeUser(user);
  }
}

export const store = new GamifyStore();
