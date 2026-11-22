import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Lightbulb,
  MessageSquare,
  Mic,
  RefreshCw,
  Send,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import {
  AnalyticsSnapshot,
  GrammarTopic,
  MistakeRecord,
  NurdanMood,
  QuestionItem,
  UserAccount,
} from '../../types/gamify.ts';
import { NurdanAvatar } from '../avatar/NurdanAvatar.tsx';

interface NurdanTeacherViewProps {
  user: UserAccount;
  topics: GrammarTopic[];
  analytics: AnalyticsSnapshot;
  initialTopicId?: string;
  initialMistake?: MistakeRecord | null;
  dailyAiUsed: number;
  dailyAiLimit: number;
  onUserUpdated: (user: UserAccount) => void;
  onAiUsedUpdated: (count: number) => void;
  onOpenTopic: (topic: GrammarTopic) => void;
  onStartTopicPractice: (topic: GrammarTopic) => void;
}

export const NurdanTeacherView: React.FC<NurdanTeacherViewProps> = ({
  user,
  topics,
  analytics,
  initialTopicId,
  initialMistake,
  dailyAiUsed,
  dailyAiLimit,
  onUserUpdated,
  onAiUsedUpdated,
  onOpenTopic,
  onStartTopicPractice,
}) => {
  const defaultTopic = useMemo(() => {
    if (initialTopicId) {
      const found = topics.find((t) => t.id === initialTopicId);
      if (found) return found;
    }
    return topics.find((t) => t.cefrLevel === user.currentCefr) || topics[0];
  }, [initialTopicId, topics, user.currentCefr]);

  const [selectedTopicId, setSelectedTopicId] = useState<string>(defaultTopic?.id || '');
  const [mood, setMood] = useState<NurdanMood>(initialMistake ? 'correcting' : 'encouraging');
  const [aiMessage, setAiMessage] = useState<string>(
    initialMistake
      ? `"Əla cəhd idi, ${user.nickname}! Lakin gəl bu sualdakı incə fərqə baxaq: Sən '${initialMistake.userAnswer}' seçdin, amma düzgün cavab '${initialMistake.correctAnswer}' olmalıdır. ${initialMistake.explanationAz}"`
      : ''
  );
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<Array<Partial<QuestionItem>>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'nurdan'; text: string }>>([]);
  const [miniChecked, setMiniChecked] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const selectedTopic = useMemo(
    () => topics.find((t) => t.id === selectedTopicId) || defaultTopic,
    [topics, selectedTopicId, defaultTopic]
  );

  const isBookmarked = selectedTopic ? user.bookmarkedTopics.includes(selectedTopic.id) : false;

  const speakEnglish = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.92;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const speakExplanation = () => {
    if (!selectedTopic) return;
    const text =
      aiMessage ||
      `${selectedTopic.title}. ${selectedTopic.examples[0]?.en || ''}`;
    speakEnglish(text);
  };

  const handleWhyWrong = async () => {
    if (!selectedTopic) return;
    setLoadingAi(true);
    setMood('thinking');
    setAiError('');
    try {
      const res = await api.aiExplain({
        topicId: selectedTopic.id,
        questionText: initialMistake?.questionText || selectedTopic.examples[0]?.en,
        userAnswer: initialMistake?.userAnswer || 'yanlış zaman forması',
        correctAnswer: initialMistake?.correctAnswer || selectedTopic.examples[0]?.en,
      });
      setAiMessage(res.reply);
      onAiUsedUpdated(res.dailyAiUsed);
      setMood('explaining');
    } catch (err: any) {
      setAiError(err?.message || 'İzah alınmadı.');
      setMood('correcting');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleGenerate3Questions = async () => {
    if (!selectedTopic) return;
    setLoadingAi(true);
    setMood('thinking');
    setAiError('');
    try {
      const res = await api.aiGeneratePractice(selectedTopic.id, false);
      setGeneratedQuestions(res.questions || []);
      onAiUsedUpdated(res.dailyAiUsed);
      setMood('celebrating');
    } catch (err: any) {
      setAiError(err?.message || 'Bənzər suallar yaradılmadı.');
      setMood('explaining');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleBookmark = async () => {
    if (!selectedTopic) return;
    try {
      const res = await api.toggleBookmark(selectedTopic.id);
      onUserUpdated(res.user);
      setMood('celebrating');
    } catch {
      // ignore
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || !selectedTopic) return;
    setChatInput('');
    setChatHistory((prev) => [...prev, { role: 'user', text: prompt }]);
    setLoadingAi(true);
    setMood('thinking');
    setAiError('');
    try {
      const res = await api.aiExplain({
        topicId: selectedTopic.id,
        customPrompt: prompt,
      });
      setChatHistory((prev) => [...prev, { role: 'nurdan', text: res.reply }]);
      onAiUsedUpdated(res.dailyAiUsed);
      setMood('explaining');
    } catch (err: any) {
      setAiError(err?.message || 'Sorğu cavablandırıla bilmədi.');
      setMood('correcting');
    } finally {
      setLoadingAi(false);
    }
  };

  const miniOptions = useMemo(() => {
    if (!selectedTopic) return [];
    const example = selectedTopic.examples[0]?.en || 'She has been to Paris three times.';
    return [
      { id: 'A', label: example, correct: true },
      { id: 'B', label: `${selectedTopic.title}: yanlış struktur nümunəsi (tələ variantı)`, correct: false },
    ];
  }, [selectedTopic]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5 pb-8">
      {/* Status Banner */}
      <div className="rounded-2xl bg-[#eceef0] px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1f108e]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2dc68d] animate-pulse" />
          <span>AKTİV AI DƏRSİ · {user.activeMode === 'abituriyent' ? 'DİM TƏHLİLİ' : 'APTIS ESOL'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white text-xs font-mono font-bold text-[#464553]">
            AI Sorğu: {dailyAiUsed}/{dailyAiLimit >= 999 ? '∞' : dailyAiLimit}
          </span>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value as NurdanMood)}
            className="px-3 py-1 rounded-full bg-white border border-[#e0e3e5] text-xs font-bold text-[#191c1e]"
          >
            <option value="welcome">Xoş Gəldin</option>
            <option value="explaining">İzah Rejimi</option>
            <option value="encouraging">Ruhlandırıcı Rejim</option>
            <option value="correcting">Xəta Təhlili</option>
            <option value="celebrating">Təbrik Rejimi</option>
          </select>
        </div>
      </div>

      {/* Nurdan Teacher Hero Card */}
      <section className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <NurdanAvatar mood={mood} size={92} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl text-[#191c1e]">
                  Nurdan Teacher
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#004d33] text-[#6ffbbe] text-xs font-bold">
                  DİM & Aptis Eksperti
                </span>
              </div>
              <p className="text-xs text-[#464553] mt-1">
                Fərdi Qrammatika Təlimçisi və Koç · {selectedTopic?.cefrLevel} Adaptiv · Hazırda Onlayn
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 min-w-[210px]">
            <label className="text-[11px] font-bold text-[#464553]">Mövzu seç:</label>
            <select
              value={selectedTopic?.id || ''}
              onChange={(e) => {
                setSelectedTopicId(e.target.value);
                setAiMessage('');
                setGeneratedQuestions([]);
                setMiniChecked(null);
              }}
              className="rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3 py-2 text-xs font-bold text-[#191c1e]"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.cefrLevel}] {t.title} — {t.titleAz}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Speech Bubble Card */}
        {selectedTopic && (
          <div className="rounded-3xl bg-[#f7f9fb] border border-[#e0e3e5] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-display font-bold text-base text-[#1f108e]">
                <Sparkles className="w-4 h-4 text-[#712ae2]" />
                <span>{selectedTopic.title} — {selectedTopic.titleAz}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#93000a] text-xs font-bold">
                Tipik Xəta Tələsi
              </span>
            </div>

            <div className="text-sm font-bold text-[#1f108e]">
              “Əla irəliləyirsən, {user.nickname}! Gəl bu qaydanın məntiqini aydınlaşdıraq:”
            </div>

            <p className="text-sm text-[#191c1e] leading-relaxed whitespace-pre-line">
              {aiMessage || selectedTopic.explanationAz}
            </p>

            {selectedTopic.commonMistakesAz[0] && (
              <div className="rounded-2xl bg-[#ffdad6]/55 border border-[#ba1a1a]/15 p-3.5 text-xs text-[#93000a] flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Azərbaycanlı tələbələrin ən çox etdiyi səhv:</strong>{' '}
                  {selectedTopic.commonMistakesAz[0]}
                </div>
              </div>
            )}

            {selectedTopic.examples[0] && (
              <div className="rounded-2xl bg-white border border-[#e0e3e5] p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold text-[#004d33] uppercase">
                    ✅ Doğru Nümunə
                  </div>
                  <div className="font-display font-bold text-base text-[#191c1e] mt-0.5">
                    “{selectedTopic.examples[0].en}”
                  </div>
                  <div className="text-xs text-[#464553] mt-0.5">
                    {selectedTopic.examples[0].az}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish(selectedTopic.examples[0].en)}
                  className="w-10 h-10 rounded-full bg-[#eaddff] text-[#712ae2] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#d2bbff]"
                  title="Tələffüzü dinlə"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {aiError && (
          <div className="rounded-2xl bg-[#ffdad6] text-[#93000a] px-4 py-3 text-xs font-bold">
            {aiError}
          </div>
        )}

        {/* 4 Tactile Interactive Action Buttons (matching screen_f48b411b) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#464553]">
            <span>İNTERAKTİV ADDIMLAR</span>
            <span className="text-[#1f108e]">4 Mövcud Seçim</span>
          </div>

          <button
            type="button"
            onClick={speakExplanation}
            className="tactile-btn-primary w-full rounded-2xl bg-[#1f108e] text-white px-4 py-3.5 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <div className="font-display font-bold text-sm">
                  🎙️ Səsli İzahı Dinlə {speaking ? '(Səslənir...)' : ''}
                </div>
                <div className="text-[11px] text-white/80">
                  İngilis nümunə cümləsini canlı tələffüzlə dinlə
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-[#1f108e] text-xs font-bold">
              Dinlə
            </span>
          </button>

          <button
            type="button"
            disabled={loadingAi}
            onClick={handleWhyWrong}
            className="tactile-btn-neutral w-full rounded-2xl bg-[#f7f9fb] border border-[#e0e3e5] px-4 py-3.5 flex items-center justify-between cursor-pointer disabled:opacity-60"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <div className="font-display font-bold text-sm text-[#191c1e]">
                  💡 Niyə bu cavab səhvdir? (AI Dərin İzah)
                </div>
                <div className="text-[11px] text-[#464553]">
                  Səhv variantların və DİM tələlərinin təhlili
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-[#1f108e]">
              {loadingAi ? 'Yazır...' : 'Soruş'}
            </span>
          </button>

          <button
            type="button"
            disabled={loadingAi}
            onClick={handleGenerate3Questions}
            className="tactile-btn-secondary w-full rounded-2xl bg-[#712ae2] text-white px-4 py-3.5 flex items-center justify-between cursor-pointer disabled:opacity-60"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <RefreshCw className={`w-4 h-4 ${loadingAi ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="font-display font-bold text-sm">
                  🔄 Bənzər 3 Sual Yarat
                </div>
                <div className="text-[11px] text-white/80">
                  Nurdan Teacher bu mövzuda 3 yeni məşq sualı hazırlasın
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-[#712ae2] text-xs font-bold">
              Yarat
            </span>
          </button>

          <button
            type="button"
            onClick={handleBookmark}
            className="tactile-btn-neutral w-full rounded-2xl bg-[#f7f9fb] border border-[#e0e3e5] px-4 py-3.5 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#d1fae5] text-[#004d33] flex items-center justify-center">
                {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-display font-bold text-sm text-[#191c1e]">
                  {isBookmarked ? '✅ Qeyd Dəftərində Saxlanılıb' : '📚 Qaydanı Qeyd Dəftərinə Əlavə Et'}
                </div>
                <div className="text-[11px] text-[#464553]">
                  Təkrar etmək üçün şəxsi qrammatika dəftərinə əlavə et
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#d1fae5] text-[#004d33] text-xs font-bold">
              {isBookmarked ? 'Saxlanılıb' : 'Saxla'}
            </span>
          </button>
        </div>

        {/* AI Generated 3 Similar Questions */}
        {generatedQuestions.length > 0 && (
          <div className="rounded-3xl bg-[#eaddff]/35 border border-[#712ae2]/25 p-4 flex flex-col gap-3">
            <div className="font-display font-bold text-sm text-[#25005a]">
              ✨ Nurdan Teacher-in Hazırladığı 3 Bənzər Sual:
            </div>
            {generatedQuestions.map((gq, idx) => (
              <div key={idx} className="rounded-2xl bg-white p-4 border border-[#e0e3e5]">
                <div className="text-xs font-bold text-[#712ae2]">Sual {idx + 1}</div>
                <div className="text-sm font-bold text-[#191c1e] mt-1">{gq.questionText}</div>
                {gq.options && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {gq.options.map((opt) => (
                      <span
                        key={opt}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          opt === gq.correctAnswer
                            ? 'bg-[#d1fae5] text-[#004d33]'
                            : 'bg-[#f2f4f6] text-[#464553]'
                        }`}
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-[#464553] mt-2">
                  <strong>Düzgün cavab:</strong> {gq.correctAnswer} — {gq.explanationAz}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Interactive Chat with Nurdan Teacher */}
      <section className="rounded-3xl bg-white p-5 border border-[#e0e3e5] shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2 font-display font-bold text-base text-[#191c1e]">
          <MessageSquare className="w-5 h-5 text-[#1f108e]" />
          <span>Nurdan Teacher ilə Canlı Sual-Cavab</span>
        </div>

        {chatHistory.length > 0 && (
          <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto p-2 bg-[#f7f9fb] rounded-2xl">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'self-end bg-[#1f108e] text-white'
                    : 'self-start bg-white border border-[#e0e3e5] text-[#191c1e]'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendChat} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Məs: 'since' və 'for' fərqini izah et..."
            className="flex-1 rounded-2xl bg-[#f2f4f6] border border-[#e0e3e5] px-4 py-3 text-sm focus:outline-none focus:border-[#1f108e]"
          />
          <button
            type="submit"
            disabled={loadingAi || !chatInput.trim()}
            className="tactile-btn-primary px-5 py-3 rounded-2xl bg-[#1f108e] text-white font-bold text-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Göndər</span>
          </button>
        </form>
      </section>

      {/* Mini Quick Check */}
      {selectedTopic && (
        <section className="rounded-3xl bg-white p-5 border border-[#e0e3e5] shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="font-display font-bold text-sm text-[#191c1e]">
              🎯 İsti Təkrar: Sürətli Yoxlama
            </div>
            <button
              type="button"
              onClick={() => onStartTopicPractice(selectedTopic)}
              className="text-xs font-bold text-[#1f108e] hover:underline cursor-pointer"
            >
              Tam Məşqi Aç →
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {miniOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMiniChecked(opt.id)}
                className={`p-3.5 rounded-2xl border text-left text-sm font-semibold flex items-center justify-between cursor-pointer ${
                  miniChecked === opt.id
                    ? opt.correct
                      ? 'bg-[#d1fae5] border-[#2dc68d] text-[#003421]'
                      : 'bg-[#ffdad6] border-[#ba1a1a] text-[#93000a]'
                    : 'bg-[#f7f9fb] border-[#e0e3e5]'
                }`}
              >
                <span>
                  <strong className="mr-2">{opt.id})</strong> {opt.label}
                </span>
                {miniChecked === opt.id && opt.correct && <CheckCircle2 className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Weak Point Quick Access */}
      {analytics.weakestTopics.length > 0 && (
        <section className="rounded-3xl bg-white p-5 border border-[#e0e3e5] shadow-sm">
          <div className="font-display font-bold text-base text-[#191c1e] mb-3">
            📊 Fərdi Zəif Nöqtə Analizi
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analytics.weakestTopics.slice(0, 2).map((wt) => {
              const t = topics.find((item) => item.id === wt.topicId);
              return (
                <div key={wt.topicId} className="rounded-2xl bg-[#f2f4f6] p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#191c1e]">{wt.title}</div>
                    <div className="text-xs text-[#ba1a1a] font-bold">{wt.accuracy}% Dəqiqlik</div>
                  </div>
                  {t && (
                    <button
                      type="button"
                      onClick={() => onOpenTopic(t)}
                      className="px-3.5 py-2 rounded-xl bg-[#1f108e] text-white text-xs font-bold cursor-pointer"
                    >
                      Məşqə Başla
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
