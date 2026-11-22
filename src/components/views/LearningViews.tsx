import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Heart,
  Lock,
  Play,
  Sparkles,
  Swords,
  Volume2,
  X,
} from 'lucide-react';
import {
  BossChallenge,
  CefrLevelCode,
  DailyChallenge,
  GrammarTopic,
  TopicProgress,
  UserAccount,
} from '../../types/gamify.ts';

const CEFR_META: Record<CefrLevelCode, { labelAz: string; descAz: string; color: string }> = {
  A1: { labelAz: 'A1 Başlanğıc', descAz: '16 təməl qrammatika mövzusu', color: '#10b981' },
  A2: { labelAz: 'A2 İbtidai', descAz: '13 zaman, modal və şərt mövzusu', color: '#06b6d4' },
  B1: { labelAz: 'B1 Orta', descAz: '12 DİM & Aptis əsas mövzusu', color: '#4f46e5' },
  B2: { labelAz: 'B2 Yuxarı', descAz: '12 mürəkkəb sintaksis mövzusu', color: '#8b5cf6' },
  C1: { labelAz: 'C1 İrəli', descAz: '12 ekspert üslub və inversiya mövzusu', color: '#f59e0b' },
};

interface MapViewProps {
  user: UserAccount;
  topics: GrammarTopic[];
  progress: TopicProgress[];
  dailyChallenge: DailyChallenge | null;
  bossChallenges: BossChallenge[];
  unlockedCefrByPlan: CefrLevelCode[];
  onStartTopicPractice: (topic: GrammarTopic) => void;
  onOpenTopicDetail: (topic: GrammarTopic) => void;
  onOpenDailyChallenge: () => void;
  onOpenBossChallenge: (cefr: CefrLevelCode) => void;
}

export const GrammarMapView: React.FC<MapViewProps> = ({
  user,
  topics,
  progress,
  dailyChallenge,
  bossChallenges,
  unlockedCefrByPlan,
  onStartTopicPractice,
  onOpenTopicDetail,
  onOpenDailyChallenge,
  onOpenBossChallenge,
}) => {
  const [selectedCefr, setSelectedCefr] = useState<CefrLevelCode>(user.currentCefr || 'A1');
  const [drawerTopic, setDrawerTopic] = useState<GrammarTopic | null>(null);

  const levelTopics = useMemo(
    () => topics.filter((t) => t.cefrLevel === selectedCefr).sort((a, b) => a.orderIndex - b.orderIndex),
    [topics, selectedCefr]
  );

  const levelStats = useMemo(() => {
    const res: Record<CefrLevelCode, { total: number; completed: number; pct: number }> = {
      A1: { total: 0, completed: 0, pct: 0 },
      A2: { total: 0, completed: 0, pct: 0 },
      B1: { total: 0, completed: 0, pct: 0 },
      B2: { total: 0, completed: 0, pct: 0 },
      C1: { total: 0, completed: 0, pct: 0 },
    };
    (['A1', 'A2', 'B1', 'B2', 'C1'] as CefrLevelCode[]).forEach((lvl) => {
      const list = topics.filter((t) => t.cefrLevel === lvl);
      const done = list.filter((t) => progress.some((p) => p.topicId === t.id && p.completed)).length;
      res[lvl] = {
        total: list.length,
        completed: done,
        pct: list.length > 0 ? Math.round((done / list.length) * 100) : 0,
      };
    });
    return res;
  }, [topics, progress]);

  const activeIndex = useMemo(() => {
    const firstIncomplete = levelTopics.findIndex(
      (t) => !progress.some((p) => p.topicId === t.id && p.completed)
    );
    return firstIncomplete === -1 ? Math.max(0, levelTopics.length - 1) : firstIncomplete;
  }, [levelTopics, progress]);

  const activeBoss = bossChallenges.find((b) => b.cefrLevel === selectedCefr);
  const planLocked = !unlockedCefrByPlan.includes(selectedCefr) && user.role !== 'admin';

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5 pb-10">
      {/* CEFR Level Selector Rail */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-display font-extrabold uppercase tracking-wider text-[#464553]">
            CEFR İmtahan Səviyyəsi
          </span>
          <span className="text-xs font-bold text-[#1f108e]">
            {user.activeMode === 'abituriyent' ? 'Abituriyent (DİM)' : 'Aptis ESOL'}
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {(['A1', 'A2', 'B1', 'B2', 'C1'] as CefrLevelCode[]).map((lvl) => {
            const stat = levelStats[lvl];
            const isActive = selectedCefr === lvl;
            const lockedByPlan = !unlockedCefrByPlan.includes(lvl) && user.role !== 'admin';
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedCefr(lvl)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl font-display font-bold text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1f108e] text-white shadow-[0_3px_0_0_#0f0069]'
                    : lockedByPlan
                      ? 'bg-[#f2f4f6] text-[#777584]'
                      : 'bg-[#e6e8ea] text-[#191c1e] shadow-[0_2px_0_0_#c8c4d5]'
                }`}
              >
                {lockedByPlan ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : stat.pct === 100 ? (
                  <CheckCircle2 className="w-4 h-4 text-[#2dc68d]" />
                ) : (
                  <span>🎯</span>
                )}
                <span>{CEFR_META[lvl].labelAz}</span>
                <span className="font-mono tabular-nums opacity-80">{stat.pct}%</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Unit Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-[#3730a3] text-white p-5 shadow-[0_5px_0_0_#1f108e]">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider text-[#c3c0ff]">
            {selectedCefr} Bölmə Xəritəsi
          </span>
          <span className="font-mono text-[#6ffbbe] tabular-nums">
            {levelStats[selectedCefr].completed}/{levelStats[selectedCefr].total} Mövzu
          </span>
        </div>
        <h2 className="font-display font-extrabold text-xl mt-1">
          {levelTopics[0]?.unitTitle || `${selectedCefr} Qrammatika Qülləsi`}
        </h2>
        <p className="text-xs text-[#c3c0ff] mt-1">{CEFR_META[selectedCefr].descAz}</p>
        <div className="w-full h-2.5 bg-[#1f108e] rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-[#6ffbbe] rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, levelStats[selectedCefr].pct)}%` }}
          />
        </div>
      </section>

      {/* Friendly Zero-Hearts Banner */}
      <div className="flex items-center gap-2.5 bg-[#f2f4f6] px-4 py-2.5 rounded-2xl border border-[#e0e3e5]">
        <Heart className="w-4 h-4 text-[#1f108e] shrink-0" />
        <p className="text-xs text-[#464553]">
          <strong className="text-[#191c1e]">Can itkisi yoxdur:</strong> Rahat öyrən, səhvlərindən nəticə çıxararaq xal topla!
        </p>
      </div>

      {planLocked && (
        <div className="bg-[#fef3c7] text-[#92400e] rounded-2xl p-4 text-xs font-semibold flex items-center justify-between gap-3">
          <span>
            {selectedCefr} səviyyəsi cari <strong>{user.subscriptionPlan}</strong> planınıza daxil deyil. Mövzu qaydalarını oxuya bilərsiniz, tam testlər üçün planı yeniləyin.
          </span>
        </div>
      )}

      {/* Winding Quest Path */}
      <section className="relative flex flex-col items-center py-4 gap-8">
        {levelTopics.map((topic, idx) => {
          const tp = progress.find((p) => p.topicId === topic.id);
          const isCompleted = Boolean(tp?.completed);
          const isCurrent = idx === activeIndex;
          const offsetClass =
            idx % 4 === 1
              ? '-translate-x-10 sm:-translate-x-14'
              : idx % 4 === 3
                ? 'translate-x-10 sm:translate-x-14'
                : '';

          return (
            <div key={topic.id} className={`relative z-10 flex flex-col items-center ${offsetClass}`}>
              {isCurrent && (
                <div className="mb-2 animate-bounce bg-[#712ae2] text-white px-3 py-1 rounded-2xl text-[11px] font-display font-extrabold uppercase tracking-wider shadow-[0_3px_0_0_#25005a]">
                  ⚡ İndi Buradasan!
                </div>
              )}

              {isCompleted && (
                <div className="flex items-center gap-0.5 mb-1 text-xs">
                  {Array.from({ length: Math.max(1, tp?.stars || 3) }).map((_, s) => (
                    <span key={s}>⭐</span>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setDrawerTopic(topic)}
                className={`relative rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'w-22 h-22 bg-[#712ae2] text-white shadow-[0_6px_0_0_#25005a] active:translate-y-1'
                    : isCompleted
                      ? 'w-20 h-20 bg-[#004d33] text-[#6ffbbe] shadow-[0_5px_0_0_#002113] active:translate-y-1'
                      : 'w-18 h-18 bg-white text-[#1f108e] border-2 border-[#c8c4d5] shadow-[0_4px_0_0_#c8c4d5] active:translate-y-0.5'
                }`}
              >
                {isCurrent ? (
                  <>
                    <Play className="w-7 h-7 fill-current" />
                    <span className="text-[10px] font-display font-extrabold uppercase">BAŞLA</span>
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle2 className="w-7 h-7" />
                    <span className="text-[10px] font-mono font-bold text-white">+{topic.xpReward} XP</span>
                  </>
                ) : (
                  <span className="font-mono font-extrabold text-sm">{idx + 1}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDrawerTopic(topic)}
                className="mt-2 bg-white px-3.5 py-1.5 rounded-2xl shadow-[0_2px_0_0_#e0e3e5] border border-[#e0e3e5] text-center max-w-[230px] cursor-pointer hover:border-[#712ae2]"
              >
                <div className="text-xs font-display font-bold text-[#191c1e]">
                  {idx + 1}. {topic.title}
                </div>
                <div className="text-[11px] text-[#464553] truncate">{topic.titleAz}</div>
              </button>
            </div>
          );
        })}

        {/* Unit Boss Challenge Gate */}
        {activeBoss && (
          <div className="w-full mt-2 bg-gradient-to-b from-[#3730a3] to-[#1f108e] text-white rounded-3xl p-6 shadow-[0_6px_0_0_#0f0069]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-display font-extrabold uppercase tracking-wider bg-[#6ffbbe] text-[#002113] px-3 py-1 rounded-full">
                👑 UNIT BOSS CHALLENGE
              </span>
              <span className="text-xs font-mono font-bold text-[#6ffbbe] inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {Math.round(activeBoss.timeLimitSeconds / 60)} Dəqiqə
              </span>
            </div>
            <h3 className="font-display font-extrabold text-xl">{activeBoss.titleAz}</h3>
            <p className="text-xs text-[#c3c0ff] mt-1">{activeBoss.descriptionAz}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-bold">
              <span className="bg-white/15 px-2.5 py-1 rounded-xl text-[#6ffbbe]">
                ⚡ +{activeBoss.xpReward} XP
              </span>
              <span className="bg-white/15 px-2.5 py-1 rounded-xl text-[#6ffbbe]">
                🪙 {activeBoss.coinReward} Sikkə
              </span>
              <span className="bg-white/15 px-2.5 py-1 rounded-xl">
                🎖️ '{activeBoss.badgeName}' Nişanı
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenBossChallenge(selectedCefr)}
              className="w-full mt-4 py-3.5 rounded-2xl bg-[#712ae2] text-white font-display font-extrabold uppercase tracking-wide tactile-btn-secondary flex items-center justify-center gap-2 cursor-pointer"
            >
              <Swords className="w-5 h-5" />
              <span>Boss Döyüşünə Başla</span>
            </button>
          </div>
        )}
      </section>

      {/* Daily Quest Card */}
      {dailyChallenge && (
        <section className="bg-white rounded-3xl p-5 shadow-[0_3px_0_0_#e0e3e5] border border-[#e0e3e5]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#e2dfff] flex items-center justify-center text-2xl shrink-0">
                🎯
              </div>
              <div>
                <div className="text-[11px] font-display font-extrabold uppercase tracking-wider text-[#712ae2]">
                  Günün Missiyası
                </div>
                <h4 className="font-display font-bold text-base text-[#191c1e]">
                  {dailyChallenge.titleAz}
                </h4>
              </div>
            </div>
            <span className="bg-[#f2f4f6] px-2.5 py-1 rounded-full font-mono text-xs font-extrabold text-[#1f108e] shrink-0">
              +{dailyChallenge.xpReward} XP
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex-1 bg-[#e6e8ea] h-3 rounded-full overflow-hidden">
              <div
                className="bg-[#712ae2] h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.round((user.dailySolvedCount / Math.max(1, dailyChallenge.targetQuestions)) * 100))}%`,
                }}
              />
            </div>
            <button
              type="button"
              onClick={onOpenDailyChallenge}
              className="px-4 py-2 rounded-xl bg-[#eaddff] text-[#25005a] font-display font-bold text-xs cursor-pointer hover:bg-[#d2bbff]"
            >
              Davam et →
            </button>
          </div>
        </section>
      )}

      {/* Quick Start Modal Drawer */}
      {drawerTopic && (
        <div
          className="fixed inset-0 z-50 bg-[#191c1e]/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setDrawerTopic(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl relative flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDrawerTopic(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#464553]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-xs font-display font-extrabold uppercase text-[#712ae2]">
              {drawerTopic.cefrLevel} Səviyyə · {drawerTopic.category}
            </div>
            <h3 className="font-display font-extrabold text-xl text-[#191c1e]">
              {drawerTopic.title}
            </h3>
            <p className="text-sm text-[#464553] line-clamp-3">{drawerTopic.explanationAz}</p>

            <div className="grid grid-cols-2 gap-2.5 my-1">
              <div className="p-3 rounded-2xl bg-[#f2f4f6]">
                <div className="text-[11px] text-[#777584]">Təcrübə Mükafatı</div>
                <div className="font-display font-bold text-base text-[#1f108e]">
                  ⚡ +{drawerTopic.xpReward} XP
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#f2f4f6]">
                <div className="text-[11px] text-[#777584]">Təxmini Müddət</div>
                <div className="font-display font-bold text-base text-[#191c1e]">
                  ⏱️ {drawerTopic.estimatedMinutes} Dəq
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const t = drawerTopic;
                setDrawerTopic(null);
                onStartTopicPractice(t);
              }}
              className="w-full py-3.5 rounded-2xl bg-[#1f108e] text-white font-display font-extrabold uppercase text-sm tactile-btn-primary flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Dərsə Başla</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const t = drawerTopic;
                setDrawerTopic(null);
                onOpenTopicDetail(t);
              }}
              className="w-full py-3 rounded-2xl bg-[#e6e8ea] text-[#191c1e] font-display font-bold text-sm cursor-pointer"
            >
              Qısa Qaydaları Oxu (Xülasə)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface LevelsViewProps {
  topics: GrammarTopic[];
  progress: TopicProgress[];
  unlockedCefrByPlan: CefrLevelCode[];
  isAdmin: boolean;
  onOpenTopic: (topic: GrammarTopic) => void;
  onPracticeTopic: (topic: GrammarTopic) => void;
}

export const LevelsView: React.FC<LevelsViewProps> = ({
  topics,
  progress,
  unlockedCefrByPlan,
  isAdmin,
  onOpenTopic,
  onPracticeTopic,
}) => {
  const [filterLevel, setFilterLevel] = useState<CefrLevelCode>('A1');
  const filtered = topics.filter((t) => t.cefrLevel === filterLevel);
  const locked = !unlockedCefrByPlan.includes(filterLevel) && !isAdmin;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-[#191c1e]">
          CEFR Qrammatika Kurikulumu (A1–C1)
        </h1>
        <p className="text-sm text-[#464553] mt-1">
          Ümumilikdə {topics.length} mövzu · Azərbaycan dilində izah, nümunələr və tipik səhvlər
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(['A1', 'A2', 'B1', 'B2', 'C1'] as CefrLevelCode[]).map((lvl) => {
          const list = topics.filter((t) => t.cefrLevel === lvl);
          const done = list.filter((t) => progress.some((p) => p.topicId === t.id && p.completed)).length;
          const active = filterLevel === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setFilterLevel(lvl)}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-2 ${
                active
                  ? 'bg-[#1f108e] text-white border-[#1f108e] shadow-[0_4px_0_0_#0f0069]'
                  : 'bg-white text-[#191c1e] border-[#e0e3e5]'
              }`}
            >
              <div className="font-display font-extrabold text-lg">{lvl}</div>
              <div className={`text-xs mt-0.5 ${active ? 'text-[#c3c0ff]' : 'text-[#464553]'}`}>
                {done}/{list.length} tamamlanıb
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((topic, idx) => {
          const prog = progress.find((p) => p.topicId === topic.id);
          return (
            <div
              key={topic.id}
              className="bg-white rounded-2xl p-5 border border-[#e0e3e5] shadow-[0_2px_0_0_#e0e3e5] flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#464553]">
                  <span className="font-mono font-bold text-[#712ae2]">
                    #{idx + 1} · {topic.category} · {topic.difficulty}
                  </span>
                  {prog?.completed ? (
                    <span className="text-[#004d33] font-bold">✓ Tamamlanıb</span>
                  ) : (
                    <span>{prog ? `${prog.attempts} cəhd` : 'Yeni'}</span>
                  )}
                </div>
                <h3 className="font-display font-extrabold text-lg text-[#191c1e] mt-1">
                  {topic.title}
                </h3>
                <div className="text-xs font-semibold text-[#3730a3]">{topic.titleAz}</div>
                <p className="text-xs text-[#464553] mt-2 line-clamp-2 leading-relaxed">
                  {topic.explanationAz}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenTopic(topic)}
                  className="flex-1 py-2.5 rounded-xl bg-[#f2f4f6] text-[#191c1e] font-display font-bold text-xs hover:bg-[#e6e8ea] cursor-pointer"
                >
                  Qaydanı Oxu
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => onPracticeTopic(topic)}
                  className={`flex-1 py-2.5 rounded-xl font-display font-bold text-xs cursor-pointer ${
                    locked
                      ? 'bg-[#e0e3e5] text-[#777584] cursor-not-allowed'
                      : 'bg-[#1f108e] text-white tactile-btn-primary'
                  }`}
                >
                  {locked ? 'Plan Tələb Olunur' : 'Məşq Et'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface TopicDetailProps {
  topic: GrammarTopic;
  isBookmarked: boolean;
  progress?: TopicProgress;
  onToggleBookmark: () => void;
  onStartPractice: () => void;
  onAskNurdan: () => void;
  onBack: () => void;
}

export const TopicDetailView: React.FC<TopicDetailProps> = ({
  topic,
  isBookmarked,
  progress,
  onToggleBookmark,
  onStartPractice,
  onAskNurdan,
  onBack,
}) => {
  function speakEnglish(text: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-GB';
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5 pb-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-2 rounded-xl bg-[#e6e8ea] text-xs font-bold text-[#191c1e] cursor-pointer"
        >
          ← Mövzulara Qayıt
        </button>
        <button
          type="button"
          onClick={onToggleBookmark}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
            isBookmarked ? 'bg-[#6ffbbe] text-[#002113]' : 'bg-[#f2f4f6] text-[#1f108e]'
          }`}
        >
          {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          <span>{isBookmarked ? 'Qeyd Dəftərindədir' : 'Qeyd Dəftərinə Əlavə Et (+10 XP)'}</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-[0_4px_0_0_#d8dadc] border border-[#e0e3e5] flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-display font-extrabold uppercase text-[#712ae2]">
            {topic.cefrLevel} · {topic.category} · {topic.difficulty}
          </div>
          {progress && (
            <div className="text-xs font-mono font-bold text-[#004d33]">
              Tamamlanma: {progress.correct}/{progress.attempts} doğru
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#191c1e]">
            {topic.title}
          </h1>
          <div className="text-base font-semibold text-[#3730a3] mt-0.5">{topic.titleAz}</div>
        </div>

        {/* Azerbaijani Explanation */}
        <div className="bg-[#f2f4f6] rounded-2xl p-4 sm:p-5">
          <h2 className="font-display font-bold text-sm uppercase tracking-wider text-[#1f108e] mb-2">
            Azərbaycan Dilində Qrammatik İzah
          </h2>
          <p className="text-sm sm:text-base text-[#191c1e] leading-relaxed">{topic.explanationAz}</p>
        </div>

        {/* English Examples */}
        <div>
          <h2 className="font-display font-bold text-sm uppercase tracking-wider text-[#464553] mb-2.5">
            İngilis Dilində Nümunələr
          </h2>
          <div className="flex flex-col gap-2.5">
            {topic.examples.map((ex, i) => (
              <div
                key={i}
                className="bg-white border border-[#e0e3e5] rounded-2xl p-3.5 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-display font-bold text-sm sm:text-base text-[#191c1e]">
                    {ex.en}
                  </div>
                  <div className="text-xs text-[#464553] mt-0.5">{ex.az}</div>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish(ex.en)}
                  className="w-10 h-10 rounded-full bg-[#eaddff] text-[#25005a] flex items-center justify-center shrink-0 cursor-pointer"
                  title="Səsləndir"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Common Azerbaijani Mistakes */}
        <div className="bg-[#ffdad6]/50 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 font-display font-bold text-sm text-[#93000a]">
            <AlertTriangle className="w-4 h-4" />
            <span>Azərbaycanlı Öyrənənlərin Tipik Səhvləri</span>
          </div>
          <ul className="space-y-1.5 text-sm text-[#191c1e]">
            {topic.commonMistakesAz.map((m, idx) => (
              <li key={idx} className="leading-relaxed">
                • {m}
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onStartPractice}
            className="py-3.5 px-5 rounded-2xl bg-[#1f108e] text-white font-display font-extrabold text-sm tactile-btn-primary cursor-pointer"
          >
            🎮 Bu Mövzuda Məşq Et (+{topic.xpReward} XP)
          </button>
          <button
            type="button"
            onClick={onAskNurdan}
            className="py-3.5 px-5 rounded-2xl bg-[#eaddff] text-[#25005a] font-display font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#712ae2]" />
            <span>Nurdan Teacher-dən Soruş</span>
          </button>
        </div>
      </div>
    </div>
  );
};
