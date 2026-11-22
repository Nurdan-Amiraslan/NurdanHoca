import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock,
  Flame,
  Gamepad2,
  Heart,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AnalyticsSnapshot,
  CefrLevelCode,
  GameType,
  GrammarTopic,
  MistakeRecord,
  TopicProgress,
  UserAccount,
} from '../../types/gamify.ts';
import { StudentAvatar } from '../avatar/StudentAvatar.tsx';

const GAME_MODES: Array<{
  type: GameType;
  labelAz: string;
  descAz: string;
  badge: string;
}> = [
  { type: 'multiple_choice', labelAz: 'Çoxseçimli Test', descAz: 'DİM & Aptis formatında seçimlər', badge: 'Klassik' },
  { type: 'fill_blanks', labelAz: 'Boşluğu Tamamla', descAz: 'Dəqiq zaman və önlük yazımı', badge: 'Yazı' },
  { type: 'sentence_builder', labelAz: 'Cümlə Qurucusu', descAz: 'Söz bloklarını ardıcıl düz', badge: 'Sintaksis' },
  { type: 'error_detection', labelAz: 'Səhvi Tap', descAz: 'Xətalı hissəni aşkar et', badge: 'DİM' },
  { type: 'sentence_transformation', labelAz: 'Cümlə Çevirmə', descAz: 'Passive, Reported, Inversiya', badge: 'İrəli' },
  { type: 'matching', labelAz: 'Uyğunlaşdırma', descAz: 'Qrammatik cütləri birləşdir', badge: 'Məntiq' },
  { type: 'speed_challenge', labelAz: 'Sürət Yarışı', descAz: 'Taymerlə sürətli qərar ver', badge: 'Sürət' },
  { type: 'grammar_battle', labelAz: 'Qrammatika Döyüşü', descAz: 'AI rəqibinə qarşı dueldə yarış', badge: 'Duel' },
  { type: 'true_false', labelAz: 'Doğru / Yanlış', descAz: 'Cümlənin düzgünlüyünü yoxla', badge: 'Tez' },
  { type: 'drag_drop', labelAz: 'Sürüşdür & Yerləşdir', descAz: 'Sözləri doğru xanalara qoy', badge: 'İnteraktiv' },
];

interface DashboardViewProps {
  user: UserAccount;
  analytics: AnalyticsSnapshot;
  mistakes: MistakeRecord[];
  topics: GrammarTopic[];
  progress: TopicProgress[];
  onStartMistakeMarathon: () => void;
  onRetrySingleMistake: (mistake: MistakeRecord) => void;
  onStartGameType: (gameType: GameType) => void;
  onOpenAiTeacher: (topicId?: string, mistake?: MistakeRecord) => void;
  onOpenTopic: (topic: GrammarTopic) => void;
  onNavigateMistakes: () => void;
  onNavigateMap: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  analytics,
  mistakes,
  topics,
  progress,
  onStartMistakeMarathon,
  onRetrySingleMistake,
  onStartGameType,
  onOpenAiTeacher,
  onOpenTopic,
  onNavigateMistakes,
  onNavigateMap,
}) => {
  const unresolvedMistakes = useMemo(
    () => mistakes.filter((m) => !m.resolved),
    [mistakes]
  );

  const xpForCurrentLevel = (user.level - 1) * 150;
  const xpIntoLevel = Math.max(0, user.xp - xpForCurrentLevel);
  const xpNeededForNext = Math.max(0, 150 - xpIntoLevel);
  const levelPercent = Math.min(100, Math.round((xpIntoLevel / 150) * 100));

  const dueReviewTopics = useMemo(() => {
    const now = Date.now();
    return progress
      .filter((p) => p.mode === user.activeMode && new Date(p.nextReviewAt).getTime() <= now)
      .map((p) => topics.find((t) => t.id === p.topicId))
      .filter((t): t is GrammarTopic => Boolean(t))
      .slice(0, 3);
  }, [progress, topics, user.activeMode]);

  const weakestTopicObj = useMemo(() => {
    const weak = analytics.weakestTopics[0];
    if (!weak) return topics.find((t) => t.cefrLevel === user.currentCefr) || topics[0];
    return topics.find((t) => t.id === weak.topicId) || topics[0];
  }, [analytics.weakestTopics, topics, user.currentCefr]);

  const strongestTopicObj = useMemo(() => {
    const strong = analytics.strongestTopics[0];
    if (!strong) return topics[0];
    return topics.find((t) => t.id === strong.topicId) || topics[0];
  }, [analytics.strongestTopics, topics]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Top Profile HUD Card */}
      <section className="rounded-3xl bg-white p-6 shadow-sm border border-[#e0e3e5] flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <StudentAvatar
                outfit={user.equippedOutfit}
                accessory={user.equippedAccessory}
                size={68}
                nickname={user.nickname}
              />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#2dc68d] text-[#003421] font-mono text-[11px] font-extrabold border-2 border-white">
                ★ {user.level}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl text-[#191c1e]">
                  {user.nickname}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#e2dfff] text-[#1f108e] text-xs font-bold">
                  {user.activeMode === 'abituriyent' ? 'Abituriyent (DİM Qəbul)' : 'Aptis ESOL Hazırlıq'}
                </span>
              </div>
              <p className="text-xs text-[#464553] mt-1">
                Gündəlik hədəf: <strong className="text-[#1f108e]">{user.dailySolvedCount}/{user.dailyGoalTarget} sual</strong> · Abunəlik: <strong>{user.subscriptionPlan}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateMap}
            className="tactile-btn-primary px-5 py-3 rounded-2xl bg-[#1f108e] text-white font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Dərs Xəritəsinə Davam Et</span>
          </button>
        </div>

        {/* 4 Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-[#f2f4f6] p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffedd5] text-[#ea580c] flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono font-extrabold text-lg text-[#191c1e] tabular-nums">
                {user.streakDays} Gün
              </div>
              <div className="text-[11px] text-[#464553] font-medium">Seriya</div>
            </div>
          </div>
          <div className="rounded-2xl bg-[#f2f4f6] p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e2dfff] text-[#1f108e] flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono font-extrabold text-lg text-[#1f108e] tabular-nums">
                {user.xp}
              </div>
              <div className="text-[11px] text-[#464553] font-medium">Ümumi XP</div>
            </div>
          </div>
          <div className="rounded-2xl bg-[#f2f4f6] p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono font-extrabold text-lg text-[#191c1e] tabular-nums">
                {user.coins}
              </div>
              <div className="text-[11px] text-[#464553] font-medium">Qızıl Sikkə</div>
            </div>
          </div>
          <div className="rounded-2xl bg-[#f2f4f6] p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d1fae5] text-[#004d33] flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono font-extrabold text-lg text-[#004d33] tabular-nums">
                {user.currentCefr}
              </div>
              <div className="text-[11px] text-[#464553] font-medium">Səviyyə {user.level}</div>
            </div>
          </div>
        </div>

        {/* Next Level XP Progress */}
        <div className="rounded-2xl bg-[#f2f4f6] p-4">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-[#191c1e]">Səviyyə {user.level + 1}-ə Doğru</span>
            <span className="font-mono text-[#1f108e] tabular-nums">
              {levelPercent}% ({xpNeededForNext} XP qaldı)
            </span>
          </div>
          <div className="h-3 rounded-full bg-[#e0e3e5] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1f108e] to-[#712ae2] transition-all duration-500"
              style={{ width: `${levelPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Teaching Analytics & CEFR Mastery Matrix */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-[#191c1e]">Tədris Analitikası</h2>
            <span className="text-xs text-[#464553] font-medium">Canlı Nəticələr</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white p-4 border border-[#e0e3e5] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-4 h-4 text-[#004d33]" />
                <span className="px-2 py-0.5 rounded-full bg-[#d1fae5] text-[#004d33] text-[10px] font-bold">
                  Dəqiq
                </span>
              </div>
              <div className="font-mono font-extrabold text-2xl text-[#191c1e] tabular-nums">
                {analytics.accuracyPercent}%
              </div>
              <div className="text-[11px] text-[#464553] mt-0.5">Dəqiqlik</div>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-[#e0e3e5] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-4 h-4 text-[#1f108e]" />
                <span className="text-[10px] text-[#ba1a1a] font-bold">
                  {analytics.totalMistakes} xəta
                </span>
              </div>
              <div className="font-mono font-extrabold text-2xl text-[#191c1e] tabular-nums">
                {analytics.totalAnswered}
              </div>
              <div className="text-[11px] text-[#464553] mt-0.5">
                {analytics.totalCorrect} Düzgün
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-[#e0e3e5] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-4 h-4 text-[#712ae2]" />
                <span className="px-2 py-0.5 rounded-full bg-[#eaddff] text-[#712ae2] text-[10px] font-bold">
                  Sürət
                </span>
              </div>
              <div className="font-mono font-extrabold text-2xl text-[#191c1e] tabular-nums">
                {analytics.averageResponseSeconds}s
              </div>
              <div className="text-[11px] text-[#464553] mt-0.5">Ortalama / sual</div>
            </div>
          </div>

          {/* Mistake Marathon Banner (from screen_e53e0cc8) */}
          <div className="rounded-3xl bg-gradient-to-br from-[#1f108e] to-[#712ae2] p-5 text-white shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider">
                Sprinter Rejimi
              </span>
              <span className="text-xs font-mono font-bold text-[#6ffbbe]">⚡ +80 XP Bonus</span>
            </div>
            <div>
              <h3 className="font-display font-extrabold text-xl">
                Səhvlər Marafonu ({Math.min(10, Math.max(1, unresolvedMistakes.length || 10))} Sual)
              </h3>
              <p className="text-xs text-white/85 mt-1">
                Zəif nöqtələri dərhal aradan qaldır və qəbul sınaqlarına tam hazırlaş!
              </p>
            </div>
            <button
              type="button"
              onClick={onStartMistakeMarathon}
              className="tactile-btn-emerald w-full py-3 rounded-2xl bg-[#2dc68d] text-[#003421] font-display font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Marafonu Başla</span>
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CEFR Mastery Matrix SVG Rings */}
        <div className="lg:col-span-7 rounded-3xl bg-white p-5 border border-[#e0e3e5] shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-[#191c1e]">
                CEFR Mənimsəmə Matrisi
              </h2>
              <p className="text-xs text-[#464553]">
                65 Qrammatika mövzusu üzrə real irəliləyiş faizləri
              </p>
            </div>
            <span className="text-xs font-bold text-[#1f108e]">
              {user.activeMode === 'abituriyent' ? 'DİM İngilis Dili' : 'Aptis ESOL CEFR'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-4 items-center">
            {(['A1', 'A2', 'B1', 'B2', 'C1'] as CefrLevelCode[]).map((lvl) => {
              const pct = analytics.cefrMastery[lvl] || 0;
              const radius = 26;
              const circ = 2 * Math.PI * radius;
              const offset = circ - (pct / 100) * circ;
              const strokeColor =
                pct >= 80 ? '#2dc68d' : pct >= 40 ? '#712ae2' : '#1f108e';

              return (
                <div key={lvl} className="flex flex-col items-center text-center gap-2">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        fill="none"
                        stroke="#eceef0"
                        strokeWidth="6"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                      />
                    </svg>
                    <span className="absolute font-mono font-extrabold text-xs text-[#191c1e] tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div>
                    <div className="font-display font-extrabold text-sm text-[#191c1e]">{lvl}</div>
                    <div className="text-[10px] text-[#464553]">
                      {pct >= 85 ? 'Usta' : pct >= 40 ? 'Aktiv' : 'Açıq'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spaced Repetition Review Queue */}
          <div className="rounded-2xl bg-[#f2f4f6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#eaddff] text-[#712ae2] flex items-center justify-center shrink-0">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#191c1e]">
                  Aralıqlı Təkrar Növbəsi: {analytics.dueForReviewCount} mövzu gözləyir
                </div>
                <div className="text-[11px] text-[#464553]">
                  Unutma əyrisinə görə bu gün təkrar edilməsi tövsiyə olunur.
                </div>
              </div>
            </div>
            {dueReviewTopics.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenTopic(dueReviewTopics[0])}
                className="px-3.5 py-2 rounded-xl bg-[#1f108e] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                Təkrarla: {dueReviewTopics[0].title}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 10 Interactive Game Modes Launcher */}
      <section className="rounded-3xl bg-white p-5 border border-[#e0e3e5] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-display font-bold text-lg text-[#191c1e] flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-[#712ae2]" />
              10 İnteraktiv Oyun Mexanikası
            </h2>
            <p className="text-xs text-[#464553]">
              İstədiyin oyun növünü seçərək dərhal məşqə başla (Can itkisi yoxdur!)
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004d33] bg-[#d1fae5] px-3 py-1 rounded-full self-start">
            <Heart className="w-3.5 h-3.5" /> Limitsiz Təcrübə
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {GAME_MODES.map((g) => (
            <button
              key={g.type}
              type="button"
              onClick={() => onStartGameType(g.type)}
              className="group text-left rounded-2xl bg-[#f7f9fb] hover:bg-[#e2dfff]/50 border border-[#e0e3e5] hover:border-[#3730a3] p-3.5 transition-all cursor-pointer flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-[#eaddff] text-[#25005a] text-[10px] font-bold">
                  {g.badge}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#464553] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div>
                <div className="font-display font-bold text-sm text-[#191c1e]">{g.labelAz}</div>
                <div className="text-[11px] text-[#464553] mt-0.5 line-clamp-2">{g.descAz}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Mistake Archive Preview + AI Personal Recommendations */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#ba1a1a]" />
              <h2 className="font-display font-bold text-lg text-[#191c1e]">
                Səhvlər Arxivi & Xəta Təhlili
              </h2>
            </div>
            <button
              type="button"
              onClick={onNavigateMistakes}
              className="text-xs font-bold text-[#1f108e] hover:underline cursor-pointer"
            >
              Hamısına bax ({unresolvedMistakes.length}) →
            </button>
          </div>

          {unresolvedMistakes.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 border border-[#e0e3e5] text-center">
              <CheckCircle2 className="w-10 h-10 text-[#2dc68d] mx-auto mb-2" />
              <div className="font-display font-bold text-base text-[#191c1e]">
                Hazırda həll olunmamış xətan yoxdur!
              </div>
              <p className="text-xs text-[#464553] mt-1">
                Yeni suallar işlədikcə çətinlik çəkdiyin nümunələr avtomatik burada toplanacaq.
              </p>
            </div>
          ) : (
            unresolvedMistakes.slice(0, 2).map((m) => (
              <div
                key={m.id}
                className="rounded-3xl bg-white p-5 border border-[#e0e3e5] shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#e2dfff] text-[#1f108e] text-xs font-bold">
                      {m.topicTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[11px] font-bold">
                      {m.cefrLevel} · {m.mistakeCount} dəfə səhv
                    </span>
                  </div>
                </div>
                <div className="text-sm font-bold text-[#191c1e]">"{m.questionText}"</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-[#ffdad6]/60 px-3 py-2 text-[#93000a]">
                    <span className="font-bold">❌ Sənin Cavabın:</span> {m.userAnswer}
                  </div>
                  <div className="rounded-xl bg-[#d1fae5] px-3 py-2 text-[#004d33]">
                    <span className="font-bold">✅ Düzgün Cavab:</span> {m.correctAnswer}
                  </div>
                </div>
                <div className="rounded-2xl bg-[#f2f4f6] p-3 text-xs text-[#191c1e] flex items-start gap-2.5">
                  <Bot className="w-4 h-4 text-[#712ae2] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1f108e]">AI Nurdan Teacher İzah Edir:</strong>{' '}
                    {m.explanationAz}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenAiTeacher(m.topicId, m)}
                    className="px-3.5 py-2 rounded-xl bg-[#eaddff] text-[#25005a] text-xs font-bold cursor-pointer"
                  >
                    AI ilə Dərin İzah
                  </button>
                  <button
                    type="button"
                    onClick={() => onRetrySingleMistake(m)}
                    className="tactile-btn-primary px-4 py-2 rounded-xl bg-[#1f108e] text-white text-xs font-bold cursor-pointer"
                  >
                    Təkrar Məşq Et (+15 XP)
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Personal Recommendations */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-[#191c1e]">AI Fərdi Tövsiyələr</h2>
            <span className="text-xs text-[#712ae2] font-bold">Bugünkü Plan</span>
          </div>

          <div className="rounded-3xl bg-white p-5 border border-[#e0e3e5] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[11px] font-bold">
                Zəif Mövzu Təhlili
              </span>
              <TrendingUp className="w-4 h-4 text-[#ba1a1a]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#191c1e]">
                {weakestTopicObj?.title || 'Conditionals'}
              </h3>
              <p className="text-xs text-[#464553] mt-1">
                {weakestTopicObj?.titleAz} mövzusunu möhkəmləndirmək üçün Nurdan Teacher ilə 5 dəqiqəlik sürətli dialoq məşqini tamamla.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenTopic(weakestTopicObj)}
              className="tactile-btn-secondary w-full py-2.5 rounded-xl bg-[#712ae2] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Məşqə Get</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-3xl bg-white p-5 border border-[#e0e3e5] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#d1fae5] text-[#004d33] text-[11px] font-bold">
                Sınağa Hazırsan!
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#004d33]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#191c1e]">
                {strongestTopicObj?.title || 'Articles'}
              </h3>
              <p className="text-xs text-[#464553] mt-1">
                Güclü olduğun bu bölmədə qızıl nişan və yüksək XP toplamaq üçün sınaq rejimini başlat.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenTopic(strongestTopicObj)}
              className="tactile-btn-emerald w-full py-2.5 rounded-xl bg-[#004d33] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Sınağa Başla</span>
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

interface MistakeArchiveViewProps {
  mistakes: MistakeRecord[];
  onRetrySingleMistake: (mistake: MistakeRecord) => void;
  onStartMistakeMarathon: () => void;
  onOpenAiTeacher: (topicId?: string, mistake?: MistakeRecord) => void;
}

export const MistakeArchiveView: React.FC<MistakeArchiveViewProps> = ({
  mistakes,
  onRetrySingleMistake,
  onStartMistakeMarathon,
  onOpenAiTeacher,
}) => {
  const [filter, setFilter] = useState<'unresolved' | 'all' | 'resolved'>('unresolved');

  const filtered = useMemo(() => {
    if (filter === 'unresolved') return mistakes.filter((m) => !m.resolved);
    if (filter === 'resolved') return mistakes.filter((m) => m.resolved);
    return mistakes;
  }, [mistakes, filter]);

  const unresolvedCount = mistakes.filter((m) => !m.resolved).length;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5">
      <div className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#191c1e]">
            Səhvlər Arxivi & Xəta Təhlili
          </h1>
          <p className="text-sm text-[#464553] mt-1">
            Can itkisi yoxdur — hər səhvi Nurdan Teacher izahı ilə öyrənib təkrar düzgün həll etdikdə arxivdən silinir.
          </p>
        </div>
        {unresolvedCount > 0 && (
          <button
            type="button"
            onClick={onStartMistakeMarathon}
            className="tactile-btn-primary px-5 py-3 rounded-2xl bg-[#1f108e] text-white font-display font-bold text-sm flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Səhvlər Marafonu ({Math.min(10, unresolvedCount)})</span>
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'unresolved' as const, label: `Aktiv Səhvlər (${unresolvedCount})` },
          { id: 'resolved' as const, label: `Həll Olunanlar (${mistakes.length - unresolvedCount})` },
          { id: 'all' as const, label: `Hamısı (${mistakes.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors ${
              filter === tab.id
                ? 'bg-[#1f108e] text-white'
                : 'bg-white border border-[#e0e3e5] text-[#464553] hover:bg-[#f2f4f6]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 border border-[#e0e3e5] text-center">
          <CheckCircle2 className="w-12 h-12 text-[#2dc68d] mx-auto mb-3" />
          <div className="font-display font-bold text-lg text-[#191c1e]">
            Bu kateqoriyada xəta qeydi yoxdur
          </div>
          <p className="text-xs text-[#464553] mt-1">
            Davamlı məşq etdikcə çətin suallar burada saxlanılır.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="rounded-3xl bg-white p-5 border border-[#e0e3e5] shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#e2dfff] text-[#1f108e] text-xs font-bold">
                    {m.topicTitle}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#f2f4f6] text-[#464553] text-xs font-mono font-bold">
                    {m.cefrLevel} · {m.mode === 'abituriyent' ? 'Abituriyent' : 'Aptis'}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    m.resolved
                      ? 'bg-[#d1fae5] text-[#004d33]'
                      : 'bg-[#ffdad6] text-[#93000a]'
                  }`}
                >
                  {m.resolved ? '✅ Düzəldilib' : `${m.mistakeCount} dəfə səhv`}
                </span>
              </div>

              <div className="text-base font-bold text-[#191c1e]">{m.questionText}</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-[#ffdad6]/60 p-3 text-[#93000a]">
                  <span className="font-bold">❌ Sənin Cavabın:</span> {m.userAnswer}
                </div>
                <div className="rounded-2xl bg-[#d1fae5] p-3 text-[#004d33]">
                  <span className="font-bold">✅ Düzgün Cavab:</span> {m.correctAnswer}
                </div>
              </div>

              <div className="rounded-2xl bg-[#f2f4f6] p-3.5 text-xs text-[#191c1e] leading-relaxed">
                <strong className="text-[#1f108e]">Nurdan Teacher İzahı:</strong> {m.explanationAz}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAiTeacher(m.topicId, m)}
                  className="px-4 py-2 rounded-xl bg-[#eaddff] text-[#25005a] text-xs font-bold cursor-pointer"
                >
                  AI Müəllimdən Soruş
                </button>
                <button
                  type="button"
                  onClick={() => onRetrySingleMistake(m)}
                  className="tactile-btn-primary px-4 py-2 rounded-xl bg-[#1f108e] text-white text-xs font-bold cursor-pointer"
                >
                  Təkrar Həll Et
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface AnalyticsViewProps {
  analytics: AnalyticsSnapshot;
  topics: GrammarTopic[];
  onOpenTopic: (topic: GrammarTopic) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  topics,
  onOpenTopic,
}) => {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm">
        <h1 className="font-display font-extrabold text-2xl text-[#191c1e]">
          Tədris Analitikası və Performans Hesabatı
        </h1>
        <p className="text-sm text-[#464553] mt-1">
          Həftəlik aktivlik, cavab sürəti, CEFR səviyyələri üzrə mənimsəmə və ən güclü/zəif mövzular.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="rounded-2xl bg-[#f2f4f6] p-4">
            <div className="text-xs text-[#464553]">Ümumi Dəqiqlik</div>
            <div className="font-mono font-extrabold text-2xl text-[#004d33] tabular-nums mt-1">
              {analytics.accuracyPercent}%
            </div>
          </div>
          <div className="rounded-2xl bg-[#f2f4f6] p-4">
            <div className="text-xs text-[#464553]">Cavablanan Suallar</div>
            <div className="font-mono font-extrabold text-2xl text-[#1f108e] tabular-nums mt-1">
              {analytics.totalAnswered}
            </div>
          </div>
          <div className="rounded-2xl bg-[#f2f4f6] p-4">
            <div className="text-xs text-[#464553]">Orta Cavab Müddəti</div>
            <div className="font-mono font-extrabold text-2xl text-[#712ae2] tabular-nums mt-1">
              {analytics.averageResponseSeconds} san
            </div>
          </div>
          <div className="rounded-2xl bg-[#f2f4f6] p-4">
            <div className="text-xs text-[#464553]">Təkrar Gözləyən</div>
            <div className="font-mono font-extrabold text-2xl text-[#191c1e] tabular-nums mt-1">
              {analytics.dueForReviewCount}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Bar Chart */}
      <div className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm">
        <h2 className="font-display font-bold text-lg text-[#191c1e] mb-1">
          Son 7 Günün Aktivliyi
        </h2>
        <p className="text-xs text-[#464553] mb-4">Həll edilən və düzgün cavablanan sual sayı</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#464553' }} />
              <YAxis tick={{ fontSize: 12, fill: '#464553' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '14px',
                  border: '1px solid #e0e3e5',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="solved" name="Cəmi Sual" fill="#c3c0ff" radius={[8, 8, 0, 0]} />
              <Bar dataKey="correct" name="Düzgün" fill="#1f108e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strongest vs Weakest Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-white p-5 border border-[#e0e3e5] shadow-sm">
          <h3 className="font-display font-bold text-base text-[#004d33] mb-3">
            Ən Güclü Mövzuların
          </h3>
          {analytics.strongestTopics.length === 0 ? (
            <p className="text-xs text-[#464553]">Hələ kifayət qədər məlumat toplanmayıb.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {analytics.strongestTopics.map((item) => {
                const topic = topics.find((t) => t.id === item.topicId);
                return (
                  <div
                    key={item.topicId}
                    className="rounded-2xl bg-[#f2f4f6] p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#191c1e]">{item.title}</div>
                      <div className="text-[11px] text-[#464553]">{item.attempts} cəhd</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#004d33] bg-[#d1fae5] px-2.5 py-1 rounded-full">
                        {item.accuracy}%
                      </span>
                      {topic && (
                        <button
                          type="button"
                          onClick={() => onOpenTopic(topic)}
                          className="text-xs font-bold text-[#1f108e] hover:underline cursor-pointer"
                        >
                          Aç
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-5 border border-[#e0e3e5] shadow-sm">
          <h3 className="font-display font-bold text-base text-[#ba1a1a] mb-3">
            Təkmilləşdirilməli Mövzular
          </h3>
          {analytics.weakestTopics.length === 0 ? (
            <p className="text-xs text-[#464553]">Zəif mövzu aşkar edilməyib.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {analytics.weakestTopics.map((item) => {
                const topic = topics.find((t) => t.id === item.topicId);
                return (
                  <div
                    key={item.topicId}
                    className="rounded-2xl bg-[#f2f4f6] p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#191c1e]">{item.title}</div>
                      <div className="text-[11px] text-[#464553]">{item.attempts} cəhd</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#93000a] bg-[#ffdad6] px-2.5 py-1 rounded-full">
                        {item.accuracy}%
                      </span>
                      {topic && (
                        <button
                          type="button"
                          onClick={() => onOpenTopic(topic)}
                          className="px-3 py-1 rounded-xl bg-[#1f108e] text-white text-xs font-bold cursor-pointer"
                        >
                          Məşq Et
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
