import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Flame,
  Info,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Swords,
  Timer,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import {
  BadgeDefinition,
  GameType,
  LearningMode,
  MotivationalQuote,
  QuestionItem,
  UserAccount,
} from '../../types/gamify.ts';
import { NurdanAvatar } from '../avatar/NurdanAvatar.tsx';

const GAME_TYPE_LABELS: Record<GameType, string> = {
  multiple_choice: 'Çoxseçimli Test',
  fill_blanks: 'Boşluğu Tamamla',
  sentence_builder: 'Cümlə Qurucusu',
  error_detection: 'Səhvi Tap',
  sentence_transformation: 'Cümlə Çevirmə',
  matching: 'Uyğunlaşdırma',
  speed_challenge: 'Sürət Yarışı',
  grammar_battle: 'Qrammatika Döyüşü',
  true_false: 'Doğru / Yanlış',
  drag_drop: 'Sürüşdür və Yerləşdir',
};

function playFeedbackTone(success: boolean, muted: boolean) {
  if (muted || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = success ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(success ? 523.25 : 220, ctx.currentTime);
    if (success) {
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.14);
    }
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.start();
    osc.stop(ctx.currentTime + 0.23);
  } catch {
    // Ignore audio context restriction
  }
}

interface GameEngineProps {
  questions: QuestionItem[];
  mode: LearningMode;
  titleAz: string;
  subtitleAz?: string;
  timeLimitSeconds?: number;
  onUserUpdated: (user: UserAccount) => void;
  onExit: () => void;
  onSessionCompleted?: (stats: { total: number; correct: number; scorePercent: number }) => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({
  questions,
  mode,
  titleAz,
  subtitleAz,
  timeLimitSeconds,
  onUserUpdated,
  onExit,
  onSessionCompleted,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(25);
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(timeLimitSeconds ?? null);
  const [muted, setMuted] = useState(false);

  // Per-question answer states
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [builtTokens, setBuiltTokens] = useState<Array<{ idx: number; word: string }>>([]);
  const [matchedMap, setMatchedMap] = useState<Record<string, string>>({});
  const [activeLeftId, setActiveLeftId] = useState<string | null>(null);
  const [dragSlotsMap, setDragSlotsMap] = useState<Record<string, string>>({});
  const [activeDragItem, setActiveDragItem] = useState<string | null>(null);

  // Submission & Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanationAz: string;
    commonTrapAz?: string;
    xpEarned: number;
    coinsEarned: number;
  } | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [newBadges, setNewBadges] = useState<BadgeDefinition[]>([]);
  const [quotePopup, setQuotePopup] = useState<MotivationalQuote | null>(null);

  // Session stats + Grammar Battle rival
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [rivalScore, setRivalScore] = useState(0);
  const [playerBattleScore, setPlayerBattleScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const qStartRef = useRef<number>(Date.now());
  const currentQ = questions[currentIndex];

  // Reset per-question UI state when index changes
  useEffect(() => {
    setSelectedOption('');
    setTextInput('');
    setBuiltTokens([]);
    setMatchedMap({});
    setActiveLeftId(null);
    setDragSlotsMap({});
    setActiveDragItem(null);
    setFeedback(null);
    setHintText(null);
    setQuestionTimer(currentQ?.gameType === 'speed_challenge' ? 20 : 30);
    qStartRef.current = Date.now();
  }, [currentIndex, currentQ?.id, currentQ?.gameType]);

  // Timers
  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
      setQuestionTimer((prev) => (prev > 0 ? prev - 1 : 0));
      if (globalTimeLeft !== null) {
        setGlobalTimeLeft((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            setFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(t);
  }, [finished, globalTimeLeft]);

  const shuffledRightPairs = useMemo(() => {
    if (!currentQ?.matchingPairs) return [];
    return [...currentQ.matchingPairs].sort((a, b) => a.right.localeCompare(b.right));
  }, [currentQ]);

  const totalQuestions = questions.length;
  const progressPercent = totalQuestions > 0 ? Math.round(((currentIndex + (feedback ? 1 : 0)) / totalQuestions) * 100) : 0;

  if (!currentQ || totalQuestions === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center shadow-[0_4px_0_0_#d8dadc]">
        <p className="font-display font-bold text-lg text-[#191c1e]">
          Bu filtr üçün hələ sual əlavə edilməyib.
        </p>
        <button
          type="button"
          onClick={onExit}
          className="mt-4 px-6 py-3 rounded-2xl bg-[#1f108e] text-white font-display font-bold tactile-btn-primary"
        >
          Geri Qayıt
        </button>
      </div>
    );
  }

  function composeSubmittedAnswer(): string {
    switch (currentQ.gameType) {
      case 'sentence_builder':
        return builtTokens.map((t) => t.word).join(' ').trim();
      case 'matching':
        return (currentQ.matchingPairs || [])
          .map((p) => `${p.left}->${matchedMap[p.left] || ''}`)
          .join('|');
      case 'drag_drop':
        return (currentQ.dragSlots || [])
          .map((s) => dragSlotsMap[s.id] || '')
          .join('|');
      case 'fill_blanks':
      case 'sentence_transformation':
        return currentQ.options && currentQ.options.length > 0 ? selectedOption : textInput.trim();
      default:
        return selectedOption;
    }
  }

  async function handleVerify() {
    if (feedback || submitting) return;
    const submitted = composeSubmittedAnswer();
    if (!submitted || submitted.replace(/\|/g, '').replace(/->/g, '').trim().length === 0) {
      setHintText('Zəhmət olmasa, yoxlamadan əvvəl cavabınızı seçin və ya tamamlayın.');
      return;
    }

    setSubmitting(true);
    const responseSeconds = Math.max(1, Math.round((Date.now() - qStartRef.current) / 1000));
    const sessionPerfectSoFar = correctCount === answeredCount;

    try {
      const res = await api.submitAnswer({
        questionId: currentQ.id,
        submittedAnswer: submitted,
        mode,
        responseSeconds,
        sessionPerfectSoFar,
      });

      playFeedbackTone(res.isCorrect, muted);
      onUserUpdated(res.user);
      setAnsweredCount((c) => c + 1);
      if (res.isCorrect) {
        setCorrectCount((c) => c + 1);
        setPlayerBattleScore((s) => s + res.xpEarned);
      } else {
        setRivalScore((s) => s + 15);
      }
      if (res.newlyUnlockedBadges.length > 0) {
        setNewBadges((prev) => [...prev, ...res.newlyUnlockedBadges]);
      }
      if (res.motivationalQuote) {
        setQuotePopup(res.motivationalQuote);
      }

      setFeedback({
        isCorrect: res.isCorrect,
        correctAnswer: res.correctAnswer,
        explanationAz: res.explanationAz,
        commonTrapAz: res.commonTrapAz,
        xpEarned: res.xpEarned,
        coinsEarned: res.coinsEarned,
      });
    } catch (err: any) {
      setHintText(err?.message || 'Cavab göndərilmədi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGetHint() {
    if (hintLoading) return;
    setHintLoading(true);
    try {
      const res = await api.aiHint(currentQ.id);
      setHintText(res.hint);
    } catch (err: any) {
      setHintText(err?.message || 'İpucu alına bilmədi.');
    } finally {
      setHintLoading(false);
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= totalQuestions) {
      setFinished(true);
      const finalPercent = Math.round((correctCount / totalQuestions) * 100);
      onSessionCompleted?.({
        total: totalQuestions,
        correct: correctCount,
        scorePercent: finalPercent,
      });
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function formatTimer(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  if (finished) {
    const pct = Math.round((correctCount / totalQuestions) * 100);
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_6px_0_0_#d8dadc] flex flex-col items-center text-center gap-5 max-w-2xl mx-auto">
        <NurdanAvatar mood={pct >= 70 ? 'celebrating' : 'encouraging'} size={108} />
        <div>
          <p className="font-display text-xs font-extrabold uppercase tracking-wider text-[#712ae2]">
            Sessiya Tamamlandı
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#191c1e] mt-1">
            {pct >= 80 ? 'Möhtəşəm Nəticə!' : pct >= 50 ? 'Yaxşı İrəliləyiş!' : 'Təkrar Güc Yaradır!'}
          </h2>
          <p className="text-sm text-[#464553] mt-1">{titleAz}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full">
          <div className="bg-[#f2f4f6] rounded-2xl p-3">
            <div className="font-mono text-2xl font-bold text-[#1f108e] tabular-nums">{pct}%</div>
            <div className="text-xs text-[#464553] mt-0.5">Dəqiqlik</div>
          </div>
          <div className="bg-[#f2f4f6] rounded-2xl p-3">
            <div className="font-mono text-2xl font-bold text-[#004d33] tabular-nums">
              {correctCount}/{totalQuestions}
            </div>
            <div className="text-xs text-[#464553] mt-0.5">Doğru Cavab</div>
          </div>
          <div className="bg-[#f2f4f6] rounded-2xl p-3">
            <div className="font-mono text-2xl font-bold text-[#712ae2] tabular-nums">
              {formatTimer(elapsedSec)}
            </div>
            <div className="text-xs text-[#464553] mt-0.5">Müddət</div>
          </div>
        </div>

        {newBadges.length > 0 && (
          <div className="w-full bg-[#fef3c7] rounded-2xl p-4 text-left">
            <div className="flex items-center gap-2 font-display font-bold text-[#92400e] text-sm">
              <Award className="w-4 h-4" /> Yeni Qazanılan Nişanlar:
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {newBadges.map((b) => (
                <span
                  key={b.id}
                  className="bg-white px-3 py-1 rounded-xl text-xs font-bold text-[#191c1e] shadow-sm"
                >
                  🏅 {b.name} (+{b.xpBonus} XP)
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <button
            type="button"
            onClick={() => {
              setCurrentIndex(0);
              setCorrectCount(0);
              setAnsweredCount(0);
              setElapsedSec(0);
              setFinished(false);
            }}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-[#eceef0] text-[#191c1e] font-display font-bold tactile-btn-neutral"
          >
            Yenidən Məşq Et
          </button>
          <button
            type="button"
            onClick={onExit}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-[#1f108e] text-white font-display font-bold tactile-btn-primary"
          >
            Davam Et
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4 pb-8">
      {/* Top Session HUD Strip */}
      <div className="bg-white rounded-2xl p-3.5 shadow-[0_3px_0_0_#e0e3e5] flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExit}
              className="px-3 py-1.5 rounded-xl bg-[#f2f4f6] text-xs font-bold text-[#464553] hover:bg-[#e6e8ea]"
            >
              ← Çıxış
            </button>
            <div className="font-display font-bold text-sm text-[#191c1e] truncate max-w-[210px] sm:max-w-none">
              {titleAz}
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold tabular-nums">
            <span className="px-2.5 py-1 rounded-full bg-[#f2f4f6] text-[#191c1e]">
              Sual {currentIndex + 1}/{totalQuestions}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#eaddff] text-[#5a00c6] inline-flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" />
              {globalTimeLeft !== null ? formatTimer(globalTimeLeft) : formatTimer(questionTimer)}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#d1fae5] text-[#004d33]">
              +{currentQ.xpValue} XP
            </span>
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="p-1.5 rounded-xl bg-[#f2f4f6] text-[#464553]"
              title={muted ? 'Səsi aç' : 'Səsi bağla'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Stepped Progress Bar */}
        <div className="w-full h-3 bg-[#eceef0] rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#712ae2] to-[#3730a3] rounded-full transition-all duration-300"
            style={{ width: `${Math.max(8, progressPercent)}%` }}
          />
        </div>

        {/* Meta strip: Mode · Game Type · Zero Penalty */}
        <div className="flex items-center justify-between text-xs text-[#464553] pt-0.5">
          <span className="font-semibold">
            {mode === 'abituriyent' ? 'Abituriyent (DİM)' : 'Aptis ESOL'} · {currentQ.cefrLevel} ·{' '}
            <strong className="text-[#712ae2]">{GAME_TYPE_LABELS[currentQ.gameType]}</strong>
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-[#004d33]">
            <ShieldCheck className="w-4 h-4 text-[#2dc68d]" /> Cəzasız Məşq (Can itkisi yoxdur)
          </span>
        </div>
      </div>

      {/* Grammar Battle Rival Score Bar */}
      {currentQ.gameType === 'grammar_battle' && (
        <div className="bg-[#1f108e] text-white rounded-2xl p-3.5 flex items-center justify-between gap-4 shadow-[0_4px_0_0_#0f0069]">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-[#6ffbbe]" />
            <div>
              <div className="text-[11px] uppercase font-bold text-[#c3c0ff]">Qrammatika Döyüşü</div>
              <div className="font-display font-bold text-sm">Sən vs Qrammatik_Bot</div>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-sm font-bold tabular-nums">
            <span className="bg-[#004d33] text-[#6ffbbe] px-3 py-1 rounded-xl">Sən: {playerBattleScore}</span>
            <span className="text-[#c3c0ff]">:</span>
            <span className="bg-white/10 text-white px-3 py-1 rounded-xl">Bot: {rivalScore}</span>
          </div>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_#d8dadc] flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            {subtitleAz && (
              <div className="text-xs font-bold text-[#712ae2] mb-1">{subtitleAz}</div>
            )}
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#191c1e]">
              {currentQ.promptAz}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#f2f4f6] text-[#464553] shrink-0">
            {currentQ.difficulty}
          </span>
        </div>

        {/* Question Body */}
        {currentQ.gameType !== 'error_detection' && (
          <div className="bg-[#f2f4f6] rounded-2xl p-4 text-base sm:text-lg font-medium text-[#191c1e] leading-relaxed">
            {currentQ.questionText}
          </div>
        )}

        {/* 1, 5, 7, 8, 9: Choice-based games (Multiple Choice, Speed Challenge, Grammar Battle, True/False, Choice Fill/Transform) */}
        {(currentQ.gameType === 'multiple_choice' ||
          currentQ.gameType === 'speed_challenge' ||
          currentQ.gameType === 'grammar_battle' ||
          currentQ.gameType === 'true_false' ||
          ((currentQ.gameType === 'fill_blanks' || currentQ.gameType === 'sentence_transformation') &&
            currentQ.options &&
            currentQ.options.length > 0)) && (
          <div
            className={`grid gap-2.5 ${
              currentQ.gameType === 'true_false' ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {(currentQ.options || []).map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrectOpt = feedback && opt === feedback.correctAnswer;
              const isWrongSelected = feedback && isSelected && !feedback.isCorrect;

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={Boolean(feedback)}
                  onClick={() => setSelectedOption(opt)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                    isCorrectOpt
                      ? 'bg-[#6ffbbe]/40 text-[#002113] ring-2 ring-[#004d33] shadow-[0_3px_0_0_#004d33]'
                      : isWrongSelected
                        ? 'bg-[#ffdad6] text-[#93000a] ring-2 ring-[#ba1a1a] animate-shake'
                        : isSelected
                          ? 'bg-[#eaddff] text-[#25005a] ring-2 ring-[#712ae2] shadow-[0_3px_0_0_#712ae2]'
                          : 'bg-[#f2f4f6] text-[#191c1e] hover:bg-[#e6e8ea] shadow-[0_2px_0_0_#d8dadc]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-xl font-display font-bold text-sm flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#712ae2] text-white'
                          : 'bg-[#e0e3e5] text-[#191c1e]'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium text-sm sm:text-base">{opt}</span>
                  </div>
                  {isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-[#004d33] shrink-0" />}
                  {isWrongSelected && <XCircle className="w-5 h-5 text-[#ba1a1a] shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Typed Fill-in-the-blanks / Sentence Transformation when no options array */}
        {(currentQ.gameType === 'fill_blanks' || currentQ.gameType === 'sentence_transformation') &&
          (!currentQ.options || currentQ.options.length === 0) && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-[#464553]">
                Cavabınızı yazın:
              </label>
              <input
                type="text"
                disabled={Boolean(feedback)}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Düzgün qrammatik formanı yazın..."
                className="w-full px-4 py-3.5 rounded-2xl bg-[#f2f4f6] border-2 border-[#c8c4d5] focus:border-[#3730a3] focus:outline-none text-base font-medium"
              />
            </div>
          )}

        {/* 3: Sentence Builder (Exact interactive tactile word chips from screen_60e2f15f.png) */}
        {currentQ.gameType === 'sentence_builder' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#464553]">
                Seçilmiş Cümlə Cavabınız:
              </span>
              {!feedback && (
                <button
                  type="button"
                  onClick={() => setBuiltTokens([])}
                  className="text-xs font-bold text-[#ba1a1a] inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Sıfırla
                </button>
              )}
            </div>

            <div className="min-h-[96px] bg-[#eceef0] rounded-2xl p-3.5 flex flex-wrap content-start gap-2 shadow-inner">
              {builtTokens.length === 0 ? (
                <span className="text-sm text-[#777584] italic m-auto">
                  Aşağıdakı söz bloklarına toxunaraq cümləni bura toplayın...
                </span>
              ) : (
                builtTokens.map((item) => (
                  <button
                    key={item.idx}
                    type="button"
                    disabled={Boolean(feedback)}
                    onClick={() => setBuiltTokens((prev) => prev.filter((p) => p.idx !== item.idx))}
                    className="px-3.5 py-2 rounded-xl bg-[#1f108e] text-white font-display font-bold text-sm shadow-[0_3px_0_0_#0f0069] active:translate-y-0.5 inline-flex items-center gap-1.5"
                  >
                    <span>{item.word}</span>
                    {!feedback && <span className="text-xs opacity-75">✕</span>}
                  </button>
                ))
              )}
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#464553] mb-2">
                Toxun və Əlavə Et:
              </div>
              <div className="flex flex-wrap gap-2">
                {(currentQ.wordTokens || []).map((word, idx) => {
                  const used = builtTokens.some((b) => b.idx === idx);
                  return (
                    <button
                      key={`${word}-${idx}`}
                      type="button"
                      disabled={used || Boolean(feedback)}
                      onClick={() => setBuiltTokens((prev) => [...prev, { idx, word }])}
                      className={`px-3.5 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${
                        used
                          ? 'bg-[#e0e3e5] text-[#777584] opacity-40 cursor-not-allowed'
                          : 'bg-white text-[#1f108e] shadow-[0_3px_0_0_#c8c4d5] active:translate-y-0.5 cursor-pointer border border-[#e0e3e5]'
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4: Error Detection */}
        {currentQ.gameType === 'error_detection' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-[#464553] font-semibold">
              Cümlənin qrammatik səhv olan hissəsinə toxunun:
            </p>
            <div className="flex flex-wrap gap-2.5 bg-[#f2f4f6] p-4 rounded-2xl">
              {(currentQ.segments || []).map((seg, idx) => {
                const isSelected = selectedOption === seg;
                const isCorrectSeg = feedback && seg === feedback.correctAnswer;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={Boolean(feedback)}
                    onClick={() => setSelectedOption(seg)}
                    className={`px-3.5 py-2.5 rounded-xl font-medium text-sm sm:text-base transition-all cursor-pointer ${
                      isCorrectSeg
                        ? 'bg-[#6ffbbe] text-[#002113] ring-2 ring-[#004d33]'
                        : isSelected
                          ? 'bg-[#ffdad6] text-[#93000a] ring-2 ring-[#ba1a1a]'
                          : 'bg-white text-[#191c1e] shadow-[0_2px_0_0_#d8dadc] hover:bg-[#eaddff]'
                    }`}
                  >
                    <span className="text-[11px] font-mono font-bold mr-1.5 text-[#712ae2]">
                      {String.fromCharCode(65 + idx)})
                    </span>
                    <span className="underline decoration-dotted underline-offset-4">{seg}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6: Matching */}
        {currentQ.gameType === 'matching' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-[#464553]">
              <span>Soldan bir ifadə seçin, sonra sağdan uyğununu klikləyin:</span>
              {!feedback && (
                <button
                  type="button"
                  onClick={() => {
                    setMatchedMap({});
                    setActiveLeftId(null);
                  }}
                  className="font-bold text-[#ba1a1a]"
                >
                  Sıfırla
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                {(currentQ.matchingPairs || []).map((pair) => {
                  const isActive = activeLeftId === pair.left;
                  const pairedRight = matchedMap[pair.left];
                  return (
                    <button
                      key={pair.id}
                      type="button"
                      disabled={Boolean(feedback)}
                      onClick={() => setActiveLeftId(pair.left)}
                      className={`p-3 rounded-xl text-left text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-[#712ae2] text-white shadow-[0_3px_0_0_#4c11a8]'
                          : pairedRight
                            ? 'bg-[#e2dfff] text-[#1f108e] border border-[#3730a3]'
                            : 'bg-[#f2f4f6] text-[#191c1e] shadow-[0_2px_0_0_#d8dadc]'
                      }`}
                    >
                      <div>{pair.left}</div>
                      {pairedRight && (
                        <div className="text-xs font-normal mt-0.5 text-[#5a00c6]">
                          → {pairedRight}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-2">
                {shuffledRightPairs.map((pair) => {
                  const isAlreadyUsed = Object.values(matchedMap).includes(pair.right);
                  return (
                    <button
                      key={`r-${pair.id}`}
                      type="button"
                      disabled={Boolean(feedback) || !activeLeftId}
                      onClick={() => {
                        if (!activeLeftId) return;
                        setMatchedMap((prev) => ({ ...prev, [activeLeftId]: pair.right }));
                        setActiveLeftId(null);
                      }}
                      className={`p-3 rounded-xl text-left text-sm font-medium transition-all ${
                        isAlreadyUsed
                          ? 'bg-[#d1fae5] text-[#003421]'
                          : activeLeftId
                            ? 'bg-white border-2 border-dashed border-[#712ae2] hover:bg-[#eaddff]'
                            : 'bg-[#f2f4f6] text-[#464553]'
                      }`}
                    >
                      {pair.right}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 10: Drag & Drop (supports both HTML5 drag-drop AND tap-to-place for touchscreens) */}
        {currentQ.gameType === 'drag_drop' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-[#464553]">
              Sözü boşluğa sürükləyin və ya sözə toxunub uyğun boşluğu seçin:
            </p>
            <div className="flex flex-wrap gap-2">
              {(currentQ.dragItems || []).map((item, idx) => (
                <button
                  key={`${item}-${idx}`}
                  type="button"
                  draggable={!feedback}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item);
                    setActiveDragItem(item);
                  }}
                  onClick={() => setActiveDragItem(item)}
                  className={`px-3.5 py-2 rounded-xl font-display font-bold text-sm cursor-grab active:cursor-grabbing transition-all ${
                    activeDragItem === item
                      ? 'bg-[#712ae2] text-white ring-2 ring-[#25005a]'
                      : 'bg-[#e2dfff] text-[#1f108e] shadow-[0_2px_0_0_#c3c0ff]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(currentQ.dragSlots || []).map((slot) => {
                const filled = dragSlotsMap[slot.id];
                return (
                  <div
                    key={slot.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const item = e.dataTransfer.getData('text/plain') || activeDragItem;
                      if (item && !feedback) {
                        setDragSlotsMap((prev) => ({ ...prev, [slot.id]: item }));
                        setActiveDragItem(null);
                      }
                    }}
                    onClick={() => {
                      if (feedback) return;
                      if (activeDragItem) {
                        setDragSlotsMap((prev) => ({ ...prev, [slot.id]: activeDragItem }));
                        setActiveDragItem(null);
                      } else if (filled) {
                        setDragSlotsMap((prev) => {
                          const next = { ...prev };
                          delete next[slot.id];
                          return next;
                        });
                      }
                    }}
                    className={`p-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                      filled
                        ? 'bg-[#f2f4f6] border-[#3730a3]'
                        : 'bg-white border-[#c8c4d5] hover:border-[#712ae2]'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-[#464553]">{slot.label}</div>
                    <div className="mt-1 font-display font-bold text-base text-[#1f108e]">
                      {filled || 'Buraya buraxın...'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Common Trap Warning */}
        {currentQ.commonTrapAz && (
          <div className="bg-[#f2f4f6] rounded-2xl p-3.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#ba1a1a] mt-0.5 shrink-0" />
            <div className="text-xs text-[#464553] leading-relaxed">
              <strong className="text-[#191c1e] uppercase">Abituriyent / İmtahan Qeydi: </strong>
              {currentQ.commonTrapAz}
            </div>
          </div>
        )}

        {/* Hint Box */}
        {hintText && (
          <div className="bg-[#eaddff] text-[#25005a] rounded-2xl p-3.5 text-sm flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#712ae2] mt-0.5 shrink-0" />
            <div>
              <strong>Nurdan Teacher İpucu: </strong>
              {hintText}
            </div>
          </div>
        )}

        {/* Feedback Box */}
        {feedback && (
          <div
            className={`rounded-2xl p-4 flex flex-col gap-2 ${
              feedback.isCorrect
                ? 'bg-[#6ffbbe]/40 text-[#002113] shadow-[0_3px_0_0_#4edea3]'
                : 'bg-[#eceef0] text-[#191c1e] shadow-[0_3px_0_0_#c8c4d5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-display font-extrabold text-base">
                {feedback.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#004d33]" />
                    <span>Əla! Tamamilə Doğrudur!</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-5 h-5 text-[#712ae2]" />
                    <span>Narahat olma — Can itkisi yoxdur!</span>
                  </>
                )}
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-white text-[#1f108e]">
                +{feedback.xpEarned} XP · +{feedback.coinsEarned} 🪙
              </span>
            </div>
            {!feedback.isCorrect && (
              <p className="text-sm font-bold text-[#004d33]">
                ✅ Düzgün cavab: {feedback.correctAnswer}
              </p>
            )}
            <p className="text-sm leading-relaxed">{feedback.explanationAz}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {!feedback ? (
            <>
              <button
                type="button"
                onClick={handleVerify}
                disabled={submitting}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#004d33] text-[#6ffbbe] font-display font-extrabold text-base tactile-btn-emerald flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                {submitting ? 'Yoxlanılır...' : 'Yoxla'}
              </button>
              <button
                type="button"
                onClick={handleGetHint}
                disabled={hintLoading}
                className="py-3.5 px-5 rounded-2xl bg-[#e6e8ea] text-[#1f108e] font-display font-bold text-sm tactile-btn-neutral inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-[#712ae2]" />
                {hintLoading ? 'Hazırlanır...' : 'AI İpucu Al'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#1f108e] text-white font-display font-extrabold text-base tactile-btn-primary cursor-pointer"
            >
              {currentIndex + 1 >= totalQuestions ? 'Nəticəyə Bax →' : 'Növbəti Sual →'}
            </button>
          )}
        </div>
      </div>

      {/* 10-Question Non-Repeating Motivational Quote Modal */}
      {quotePopup && (
        <div className="fixed inset-0 z-50 bg-[#191c1e]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#3730a3] text-white rounded-3xl p-6 shadow-[0_8px_0_0_#1f108e] flex flex-col gap-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-display font-extrabold uppercase tracking-wider text-[#6ffbbe]">
                10 Sual Tamamlandı · Motivasiya Kartı
              </span>
              <span className="text-xl">🌟</span>
            </div>
            <blockquote className="text-lg font-display font-bold leading-snug italic">
              “{quotePopup.textEn}”
            </blockquote>
            <div className="text-sm font-semibold text-[#c3c0ff]">— {quotePopup.author}</div>
            <div className="bg-white/10 rounded-2xl p-3.5 text-sm text-[#fffbff]">
              {quotePopup.encouragementAz}
            </div>
            <button
              type="button"
              onClick={() => setQuotePopup(null)}
              className="w-full py-3 rounded-2xl bg-[#6ffbbe] text-[#002113] font-display font-extrabold cursor-pointer"
            >
              Davam Et!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
