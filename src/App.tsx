import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from './components/layout/AppShell.tsx';
import { GameEngine } from './components/games/GameEngine.tsx';
import { AdminPanelView } from './components/views/AdminViews.tsx';
import {
  AnalyticsView,
  DashboardView,
  MistakeArchiveView,
} from './components/views/DashboardAndAnalyticsViews.tsx';
import {
  AchievementsShopView,
  BossChallengeView,
  DailyChallengeView,
  LeaderboardView,
  LessonInfoView,
  ProfileView,
  SubscriptionView,
} from './components/views/GamificationAndAccountViews.tsx';
import {
  GrammarMapView,
  LevelsView,
  TopicDetailView,
} from './components/views/LearningViews.tsx';
import { NurdanTeacherView } from './components/views/NurdanTeacherView.tsx';
import {
  AuthView,
  LandingView,
  ModeSelectOnboardingView,
} from './components/views/PublicViews.tsx';
import { api, setApiToken } from './services/api.ts';
import {
  AnalyticsSnapshot,
  AppView,
  BadgeDefinition,
  BossChallenge,
  CefrLevelCode,
  DailyChallenge,
  GameType,
  GrammarTopic,
  LearningMode,
  MistakeRecord,
  QuestionItem,
  SubscriptionPlanConfig,
  TopicProgress,
  UserAccount,
} from './types/gamify.ts';

const EMPTY_ANALYTICS: AnalyticsSnapshot = {
  accuracyPercent: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  totalMistakes: 0,
  averageResponseSeconds: 0,
  cefrMastery: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 },
  weeklyActivity: [],
  strongestTopics: [],
  weakestTopics: [],
  dueForReviewCount: 0,
};

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [plans, setPlans] = useState<SubscriptionPlanConfig[]>([]);
  const [requiresFirstRunAdminClaim, setRequiresFirstRunAdminClaim] = useState(false);

  // Authenticated state (Bearer token stored strictly in memory inside api.ts)
  const [user, setUser] = useState<UserAccount | null>(null);
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot>(EMPTY_ANALYTICS);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [badgeDefinitions, setBadgeDefinitions] = useState<BadgeDefinition[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [bossChallenges, setBossChallenges] = useState<BossChallenge[]>([]);
  const [dailyAiUsed, setDailyAiUsed] = useState(0);

  // Contextual navigation states
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);
  const [gameQuestions, setGameQuestions] = useState<QuestionItem[]>([]);
  const [gameTitle, setGameTitle] = useState('Qrammatika Oyunu');
  const [gameSubtitle, setGameSubtitle] = useState<string | undefined>(undefined);
  const [aiContextTopicId, setAiContextTopicId] = useState<string | undefined>(undefined);
  const [aiContextMistake, setAiContextMistake] = useState<MistakeRecord | null>(null);
  const [bossTargetCefr, setBossTargetCefr] = useState<CefrLevelCode | undefined>(undefined);
  const [loadingSession, setLoadingSession] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 4000);
  }, []);

  useEffect(() => {
    api
      .getBootstrap()
      .then((res) => {
        setPlans(res.plans);
        setRequiresFirstRunAdminClaim(res.adminBootstrap.requiresFirstRunClaim);
      })
      .catch(() => {
        // Ignore initial bootstrap network hiccup
      });
  }, []);

  const refreshAuthedData = useCallback(async (modeOverride?: LearningMode) => {
    const meRes = await api.getMe();
    setUser(meRes.user);
    setProgress(meRes.progress);
    setEarnedBadgeIds(meRes.badges.earnedIds);
    setBadgeDefinitions(meRes.badges.definitions);
    setAnalytics(meRes.analytics);
    setDailyAiUsed(meRes.dailyAiUsed);

    const activeMode = modeOverride || meRes.user.activeMode;
    const [topicsRes, mistakesRes, dailyRes, bossRes] = await Promise.all([
      api.getTopics({ mode: activeMode }),
      api.getMistakes(),
      api.getDailyChallenge(),
      api.getBossChallenges(),
    ]);
    setTopics(topicsRes.topics);
    setMistakes(mistakesRes.mistakes);
    setDailyChallenge(dailyRes.challenge);
    setBossChallenges(bossRes.challenges);
  }, []);

  const handleAuthSuccess = async (
    authedUser: UserAccount,
    token: string,
    nextView?: 'onboarding' | 'dashboard' | 'admin-dashboard'
  ) => {
    setApiToken(token);
    setUser(authedUser);
    setLoadingSession(true);
    try {
      await refreshAuthedData(authedUser.activeMode);
      if (authedUser.role === 'admin') {
        setRequiresFirstRunAdminClaim(false);
      }
      setView(nextView || (authedUser.onboardingCompleted ? 'dashboard' : 'onboarding'));
    } finally {
      setLoadingSession(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoadingSession(true);
    try {
      const res = await api.demoLogin();
      await handleAuthSuccess(res.user, res.token, 'dashboard');
    } catch (err: any) {
      showToast(err?.message || 'Sınaq girişi mümkün olmadı.');
    } finally {
      setLoadingSession(false);
    }
  };

  const handleLogout = () => {
    setApiToken(null);
    setUser(null);
    setProgress([]);
    setMistakes([]);
    setView('landing');
  };

  const handleSwitchMode = async (mode: LearningMode) => {
    if (!user) return;
    try {
      const res = await api.updateMe({ activeMode: mode });
      setUser(res.user);
      const topicsRes = await api.getTopics({ mode });
      setTopics(topicsRes.topics);
      showToast(
        mode === 'abituriyent'
          ? 'Abituriyent (DİM) rejiminə keçid edildi.'
          : 'Aptis ESOL (CEFR A1–C1) rejiminə keçid edildi.'
      );
    } catch (err: any) {
      showToast(err?.message || 'Rejim dəyişdirilmədi.');
    }
  };

  const activePlan = useMemo(
    () => plans.find((p) => p.code === (user?.subscriptionPlan || 'FREE')),
    [plans, user?.subscriptionPlan]
  );

  const unlockedCefrByPlan: CefrLevelCode[] = activePlan?.unlockedCefr || ['A1', 'A2', 'B1', 'B2'];
  const dailyAiLimit = activePlan?.dailyAiLimit ?? 15;

  // Launch Game Helpers
  const startTopicGame = async (topic: GrammarTopic) => {
    if (!user) return;
    try {
      const res = await api.getQuestions({ topicId: topic.id, mode: user.activeMode });
      let list = res.questions;
      if (list.length === 0) {
        const levelFallback = await api.getQuestions({
          cefrLevel: topic.cefrLevel,
          mode: user.activeMode,
        });
        list = levelFallback.questions.slice(0, 6);
      }
      if (list.length === 0) {
        showToast('Bu mövzuda hələ dərc edilmiş sual yoxdur.');
        return;
      }
      setGameQuestions(list);
      setGameTitle(`${topic.cefrLevel}: ${topic.title}`);
      setGameSubtitle(topic.titleAz);
      setView('game');
    } catch (err: any) {
      showToast(err?.message || 'Suallar yüklənmədi.');
    }
  };

  const startGameByType = async (gameType: GameType) => {
    if (!user) return;
    try {
      const res = await api.getQuestions({ gameType, mode: user.activeMode });
      let list = res.questions;
      if (list.length === 0) {
        const fallback = await api.getQuestions({ mode: user.activeMode });
        list = fallback.questions.slice(0, 8);
      }
      setGameQuestions(list.slice(0, 10));
      setGameTitle('İnteraktiv Oyun Seansı');
      setGameSubtitle(`${user.activeMode === 'abituriyent' ? 'Abituriyent' : 'Aptis ESOL'} · Qarışıq suallar`);
      setView('game');
    } catch (err: any) {
      showToast(err?.message || 'Oyun başladılmadı.');
    }
  };

  const startMistakeMarathon = async () => {
    if (!user) return;
    const unresolved = mistakes.filter((m) => !m.resolved);
    try {
      const res = await api.getQuestions({ mode: user.activeMode });
      const targetIds = new Set(unresolved.map((m) => m.questionId));
      let list = res.questions.filter((q) => targetIds.has(q.id));
      if (list.length === 0) {
        list = res.questions.slice(0, 10);
      }
      setGameQuestions(list.slice(0, 10));
      setGameTitle('Səhvlər Marafonu (10 Sual)');
      setGameSubtitle('Səhvlərini düzəlt, +80 XP bonusunu qazan!');
      setView('game');
    } catch (err: any) {
      showToast(err?.message || 'Marafon başladılmadı.');
    }
  };

  const retrySingleMistake = async (mistake: MistakeRecord) => {
    if (!user) return;
    try {
      const res = await api.getQuestions({ topicId: mistake.topicId });
      const exact = res.questions.find((q) => q.id === mistake.questionId);
      const list = exact ? [exact] : res.questions.slice(0, 3);
      if (list.length === 0) {
        showToast('Sual tapılmadı.');
        return;
      }
      setGameQuestions(list);
      setGameTitle(`Təkrar Məşq: ${mistake.topicTitle}`);
      setGameSubtitle('Düzgün həll etdikdə Səhvlər Arxivində həll olunmuş kimi işarələnir');
      setView('game');
    } catch (err: any) {
      showToast(err?.message || 'Sual açılmadı.');
    }
  };

  const handleNavigate = (nextView: AppView) => {
    if (nextView === 'game' && gameQuestions.length === 0 && user) {
      startGameByType('multiple_choice');
      return;
    }
    setView(nextView);
  };

  // ==================== PUBLIC / PRE-AUTH VIEWS ====================
  if (!user) {
    if (view === 'lesson-info') {
      return (
        <div className="min-h-screen bg-[#f7f9fb] p-4 sm:p-8">
          <LessonInfoView onBack={() => setView('landing')} />
        </div>
      );
    }

    if (view === 'login' || view === 'register') {
      return (
        <AuthView
          initialTab={view === 'register' ? 'register' : 'login'}
          requiresFirstRunAdminClaim={requiresFirstRunAdminClaim}
          onSuccess={handleAuthSuccess}
          onBackLanding={() => setView('landing')}
        />
      );
    }

    return (
      <LandingView
        plans={plans}
        onGoLogin={() => setView('login')}
        onGoRegister={() => setView('register')}
        onQuickDemo={handleQuickDemo}
        onGoLessonInfo={() => setView('lesson-info')}
      />
    );
  }

  // ==================== ONBOARDING / MODE SELECTION ====================
  if (view === 'onboarding' || view === 'mode-select') {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-4">
        <ModeSelectOnboardingView
          user={user}
          onSaveOnboarding={async (patch) => {
            const res = await api.updateMe(patch);
            setUser(res.user);
            await refreshAuthedData(res.user.activeMode);
            setView('dashboard');
          }}
        />
      </div>
    );
  }

  // ==================== AUTHENTICATED SHELL ====================
  return (
    <AppShell
      user={user}
      currentView={view}
      onNavigate={handleNavigate}
      onSwitchMode={handleSwitchMode}
      onLogout={handleLogout}
    >
      {toastMsg && (
        <div className="mb-4 rounded-2xl bg-[#1f108e] text-white px-4 py-3 text-xs font-bold shadow-md flex items-center justify-between">
          <span>{toastMsg}</span>
          <button type="button" onClick={() => setToastMsg(null)} className="underline ml-4">
            Bağla
          </button>
        </div>
      )}

      {loadingSession && (
        <div className="mb-4 rounded-2xl bg-[#e2dfff] text-[#1f108e] px-4 py-3 text-xs font-bold">
          Məlumatlar sinxronlaşdırılır...
        </div>
      )}

      {view === 'dashboard' && (
        <DashboardView
          user={user}
          analytics={analytics}
          mistakes={mistakes}
          topics={topics}
          progress={progress}
          onStartMistakeMarathon={startMistakeMarathon}
          onRetrySingleMistake={retrySingleMistake}
          onStartGameType={startGameByType}
          onOpenAiTeacher={(topicId, mistake) => {
            setAiContextTopicId(topicId);
            setAiContextMistake(mistake || null);
            setView('ai-teacher');
          }}
          onOpenTopic={(topic) => {
            setSelectedTopic(topic);
            setView('topic');
          }}
          onNavigateMistakes={() => setView('mistakes')}
          onNavigateMap={() => setView('map')}
        />
      )}

      {view === 'map' && (
        <GrammarMapView
          user={user}
          topics={topics}
          progress={progress}
          dailyChallenge={dailyChallenge}
          bossChallenges={bossChallenges}
          unlockedCefrByPlan={unlockedCefrByPlan}
          onStartTopicPractice={startTopicGame}
          onOpenTopicDetail={(topic) => {
            setSelectedTopic(topic);
            setView('topic');
          }}
          onOpenDailyChallenge={() => setView('daily-challenge')}
          onOpenBossChallenge={(cefr) => {
            setBossTargetCefr(cefr);
            setView('boss-challenge');
          }}
        />
      )}

      {view === 'levels' && (
        <LevelsView
          topics={topics}
          progress={progress}
          unlockedCefrByPlan={unlockedCefrByPlan}
          isAdmin={user.role === 'admin'}
          onOpenTopic={(topic) => {
            setSelectedTopic(topic);
            setView('topic');
          }}
          onPracticeTopic={startTopicGame}
        />
      )}

      {view === 'topic' && selectedTopic && (
        <TopicDetailView
          topic={selectedTopic}
          isBookmarked={user.bookmarkedTopics.includes(selectedTopic.id)}
          progress={progress.find((p) => p.topicId === selectedTopic.id)}
          onToggleBookmark={async () => {
            const res = await api.toggleBookmark(selectedTopic.id);
            setUser(res.user);
            showToast(
              res.bookmarkedTopics.includes(selectedTopic.id)
                ? 'Qayda Qeyd Dəftərinə əlavə edildi!'
                : 'Qayda Qeyd Dəftərindən çıxarıldı.'
            );
          }}
          onStartPractice={() => startTopicGame(selectedTopic)}
          onAskNurdan={() => {
            setAiContextTopicId(selectedTopic.id);
            setAiContextMistake(null);
            setView('ai-teacher');
          }}
          onBack={() => setView('map')}
        />
      )}

      {view === 'game' && (
        <GameEngine
          questions={gameQuestions}
          mode={user.activeMode}
          titleAz={gameTitle}
          subtitleAz={gameSubtitle}
          onUserUpdated={(updatedUser) => setUser(updatedUser)}
          onExit={async () => {
            await refreshAuthedData();
            setView('dashboard');
          }}
          onSessionCompleted={async () => {
            await refreshAuthedData();
          }}
        />
      )}

      {view === 'daily-challenge' && (
        <DailyChallengeView
          user={user}
          onUserUpdated={(updatedUser) => setUser(updatedUser)}
          onExit={async () => {
            await refreshAuthedData();
            setView('map');
          }}
        />
      )}

      {view === 'boss-challenge' && (
        <BossChallengeView
          user={user}
          initialCefr={bossTargetCefr}
          onUserUpdated={(updatedUser) => {
            setUser(updatedUser);
            refreshAuthedData();
          }}
        />
      )}

      {view === 'ai-teacher' && (
        <NurdanTeacherView
          user={user}
          topics={topics}
          analytics={analytics}
          initialTopicId={aiContextTopicId}
          initialMistake={aiContextMistake}
          dailyAiUsed={dailyAiUsed}
          dailyAiLimit={dailyAiLimit}
          onUserUpdated={(u) => setUser(u)}
          onAiUsedUpdated={(c) => setDailyAiUsed(c)}
          onOpenTopic={(topic) => {
            setSelectedTopic(topic);
            setView('topic');
          }}
          onStartTopicPractice={startTopicGame}
        />
      )}

      {view === 'mistakes' && (
        <MistakeArchiveView
          mistakes={mistakes}
          onRetrySingleMistake={retrySingleMistake}
          onStartMistakeMarathon={startMistakeMarathon}
          onOpenAiTeacher={(topicId, mistake) => {
            setAiContextTopicId(topicId);
            setAiContextMistake(mistake || null);
            setView('ai-teacher');
          }}
        />
      )}

      {view === 'analytics' && (
        <AnalyticsView
          analytics={analytics}
          topics={topics}
          onOpenTopic={(topic) => {
            setSelectedTopic(topic);
            setView('topic');
          }}
        />
      )}

      {view === 'leaderboard' && <LeaderboardView currentUser={user} />}

      {view === 'achievements' && (
        <AchievementsShopView
          user={user}
          earnedBadgeIds={earnedBadgeIds}
          badgeDefinitions={badgeDefinitions}
          onUserUpdated={(u) => setUser(u)}
        />
      )}

      {view === 'subscription' && (
        <SubscriptionView
          user={user}
          plans={plans}
          onUserUpdated={(u) => setUser(u)}
        />
      )}

      {view === 'profile' && (
        <ProfileView
          user={user}
          topics={topics}
          onUserUpdated={(u) => setUser(u)}
          onOpenTopic={(topic) => {
            setSelectedTopic(topic);
            setView('topic');
          }}
        />
      )}

      {view === 'lesson-info' && <LessonInfoView onBack={() => setView('dashboard')} />}

      {(view === 'admin-dashboard' || view === 'admin-questions' || view === 'admin-users') &&
        user.role === 'admin' && (
          <AdminPanelView
            topics={topics}
            initialTab={
              view === 'admin-questions'
                ? 'questions'
                : view === 'admin-users'
                ? 'users'
                : 'overview'
            }
            onTopicsChanged={() => refreshAuthedData()}
          />
        )}
    </AppShell>
  );
}
