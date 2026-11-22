import React, { useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import {
  CefrLevelCode,
  GameType,
  GrammarTopic,
  LearningMode,
  PaymentRecord,
  QuestionItem,
  SubscriptionPlanCode,
  SubscriptionPlanConfig,
  UserAccount,
} from '../../types/gamify.ts';

interface AdminPanelViewProps {
  topics: GrammarTopic[];
  initialTab: 'overview' | 'questions' | 'users';
  onTopicsChanged: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  topics,
  initialTab,
  onTopicsChanged,
}) => {
  const [tab, setTab] = useState<'overview' | 'questions' | 'users'>(initialTab);
  const [overview, setOverview] = useState<{
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
  } | null>(null);

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // New Question Form
  const [topicId, setTopicId] = useState(topics[0]?.id || '');
  const [mode, setMode] = useState<LearningMode | 'both'>('both');
  const [gameType, setGameType] = useState<GameType>('multiple_choice');
  const [promptAz, setPromptAz] = useState('Düzgün qrammatik variantı seçin.');
  const [questionText, setQuestionText] = useState('');
  const [optionsRaw, setOptionsRaw] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanationAz, setExplanationAz] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // CSV Import
  const [csvText, setCsvText] = useState('');
  const [csvErrors, setCsvErrors] = useState<Array<{ row: number; reason: string }>>([]);

  // Topic Editor
  const [editingTopicId, setEditingTopicId] = useState(topics[0]?.id || '');
  const [editingExplanation, setEditingExplanation] = useState(topics[0]?.explanationAz || '');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ov, qs] = await Promise.all([api.getAdminOverview(), api.getAdminQuestions()]);
      setOverview(ov);
      setQuestions(qs.questions);
    } catch (e: any) {
      setErr(e?.message || 'Admin məlumatları yüklənmədi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    loadAll();
  }, []);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    try {
      const topic = topics.find((t) => t.id === topicId);
      const options = optionsRaw
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await api.upsertQuestion({
        topicId,
        cefrLevel: (topic?.cefrLevel || 'A1') as CefrLevelCode,
        mode,
        gameType,
        difficulty: topic?.difficulty || 'Orta',
        promptAz,
        questionText,
        options: options.length > 0 ? options : undefined,
        correctAnswer,
        explanationAz,
        isPublished,
      });
      setQuestions((prev) => [res.question, ...prev]);
      setQuestionText('');
      setOptionsRaw('');
      setCorrectAnswer('');
      setExplanationAz('');
      setMsg('Yeni sual bazaya əlavə edildi!');
    } catch (e: any) {
      setErr(e?.message || 'Sual əlavə edilmədi.');
    }
  };

  const handleTogglePublish = async (q: QuestionItem) => {
    try {
      const res = await api.upsertQuestion({ ...q, isPublished: !q.isPublished });
      setQuestions((prev) => prev.map((item) => (item.id === q.id ? res.question : item)));
    } catch (e: any) {
      setErr(e?.message || 'Status dəyişmədi.');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await api.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setMsg('Sual silindi.');
    } catch (e: any) {
      setErr(e?.message || 'Silinmədi.');
    }
  };

  const handleCsvImport = async () => {
    setMsg('');
    setErr('');
    setCsvErrors([]);
    try {
      const report = await api.importQuestionsCsv(csvText);
      setMsg(`${report.importedCount} sual uğurla CSV-dən idxal edildi.`);
      setCsvErrors(report.errors || []);
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || 'CSV idxal xətası.');
    }
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result || ''));
    };
    reader.readAsText(file);
  };

  const handleAiGenerateDrafts = async () => {
    setMsg('');
    setErr('');
    try {
      const res = await api.aiGeneratePractice(topicId, true);
      setMsg(`Nurdan Teacher AI tərəfindən ${res.savedPendingCount} sual qaralama kimi əlavə edildi.`);
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || 'AI generasiya xətası.');
    }
  };

  const handleSaveTopicExplanation = async () => {
    setMsg('');
    setErr('');
    try {
      await api.updateTopic(editingTopicId, { explanationAz: editingExplanation });
      setMsg('Mövzu izahı yeniləndi!');
      onTopicsChanged();
    } catch (e: any) {
      setErr(e?.message || 'Mövzu yenilənmədi.');
    }
  };

  const handleUserPlanChange = async (userId: string, subscriptionPlan: SubscriptionPlanCode) => {
    try {
      await api.adminUpdateUser(userId, { subscriptionPlan });
      setMsg('İstifadəçi planı yeniləndi.');
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || 'Yeniləmə xətası.');
    }
  };

  if (loading && !overview) {
    return <div className="p-8 text-center text-sm text-[#464553]">Admin paneli yüklənir...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5">
      {/* Header + Sub-tabs */}
      <div className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#191c1e] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#712ae2]" />
            GAMIFY Admin İdarəetmə Paneli
          </h1>
          <p className="text-xs text-[#464553] mt-1">
            Kurikulum, sual bazası, CSV idxalı, AI qaralama yoxlanışı, istifadəçilər və abunəlik planları.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#f2f4f6] p-1 rounded-2xl">
          {[
            { id: 'overview' as const, label: 'Ümumi Baxış' },
            { id: 'questions' as const, label: 'Sual & Kurikulum' },
            { id: 'users' as const, label: 'İstifadəçilər & Planlar' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                tab === t.id ? 'bg-[#1f108e] text-white' : 'text-[#464553]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className="rounded-2xl bg-[#d1fae5] text-[#004d33] px-4 py-3 text-xs font-bold">
          {msg}
        </div>
      )}
      {err && (
        <div className="rounded-2xl bg-[#ffdad6] text-[#93000a] px-4 py-3 text-xs font-bold">
          {err}
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {tab === 'overview' && overview && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white p-4 border border-[#e0e3e5]">
              <div className="text-xs text-[#464553]">Qeydiyyatlı Tələbə</div>
              <div className="font-mono font-extrabold text-2xl text-[#1f108e] mt-1">
                {overview.totalUsers}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-[#e0e3e5]">
              <div className="text-xs text-[#464553]">Dərc Olunan Sual</div>
              <div className="font-mono font-extrabold text-2xl text-[#004d33] mt-1">
                {overview.publishedQuestions} / {overview.totalQuestions}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-[#e0e3e5]">
              <div className="text-xs text-[#464553]">Həll Edilən Cavablar</div>
              <div className="font-mono font-extrabold text-2xl text-[#191c1e] mt-1">
                {overview.totalAnswersLogged}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-[#e0e3e5]">
              <div className="text-xs text-[#464553]">AI Sorğu Sayı</div>
              <div className="font-mono font-extrabold text-2xl text-[#712ae2] mt-1">
                {overview.totalAiInteractions}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 border border-[#e0e3e5]">
            <h2 className="font-display font-bold text-base text-[#191c1e] mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#712ae2]" />
              Son Nurdan Teacher AI Sorğuları
            </h2>
            {overview.recentAiLogs.length === 0 ? (
              <p className="text-xs text-[#464553]">Hələ AI log qeydi yoxdur.</p>
            ) : (
              <div className="divide-y divide-[#eceef0] text-xs">
                {overview.recentAiLogs.map((log: any) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-[#eaddff] text-[#25005a] font-bold mr-2">
                        {log.actionType}
                      </span>
                      <span className="font-bold text-[#191c1e]">{log.promptSummary}</span>
                    </div>
                    <span className="text-[#464553] truncate max-w-xs">{log.responsePreview}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUESTIONS & CURRICULUM */}
      {tab === 'questions' && (
        <div className="flex flex-col gap-5">
          {/* Add Question Form */}
          <form
            onSubmit={handleAddQuestion}
            className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm flex flex-col gap-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display font-bold text-lg text-[#191c1e] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#1f108e]" />
                Yeni Sual Əlavə Et
              </h2>
              <button
                type="button"
                onClick={handleAiGenerateDrafts}
                className="px-4 py-2 rounded-xl bg-[#eaddff] text-[#25005a] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seçilmiş Mövzuda AI ilə 3 Qaralama Yarat</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#464553] mb-1">Mövzu</label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3 py-2 text-xs font-bold"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.cefrLevel}] {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#464553] mb-1">Tədris Rejimi</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as LearningMode | 'both')}
                  className="w-full rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3 py-2 text-xs font-bold"
                >
                  <option value="both">Hər ikisi (Abituriyent + Aptis)</option>
                  <option value="abituriyent">Yalnız Abituriyent</option>
                  <option value="aptis">Yalnız Aptis ESOL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#464553] mb-1">Oyun Mexanikası</label>
                <select
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value as GameType)}
                  className="w-full rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3 py-2 text-xs font-bold"
                >
                  <option value="multiple_choice">multiple_choice</option>
                  <option value="fill_blanks">fill_blanks</option>
                  <option value="error_detection">error_detection</option>
                  <option value="sentence_transformation">sentence_transformation</option>
                  <option value="true_false">true_false</option>
                  <option value="speed_challenge">speed_challenge</option>
                  <option value="grammar_battle">grammar_battle</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#464553] mb-1">Tapşırıq Təlimatı (AZ)</label>
                <input
                  type="text"
                  required
                  value={promptAz}
                  onChange={(e) => setPromptAz(e.target.value)}
                  className="w-full rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#464553] mb-1">Düzgün Cavab</label>
                <input
                  type="text"
                  required
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Məs: went"
                  className="w-full rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#464553] mb-1">Sual Mətni (EN)</label>
              <input
                type="text"
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Məs: She ___ to Baku yesterday."
                className="w-full rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#464553] mb-1">
                  Variantlar (| işarəsi ilə ayırın)
                </label>
                <input
                  type="text"
                  value={optionsRaw}
                  onChange={(e) => setOptionsRaw(e.target.value)}
                  placeholder="went | has gone | goes | will go"
                  className="w-full rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#464553] mb-1">Azərbaycanca İzah</label>
                <input
                  type="text"
                  required
                  value={explanationAz}
                  onChange={(e) => setExplanationAz(e.target.value)}
                  placeholder="yesterday zaman zərfi Past Simple tələb edir."
                  className="w-full rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-[#191c1e]">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                <span>Dərhal dərc et</span>
              </label>
              <button
                type="submit"
                className="tactile-btn-primary px-5 py-2.5 rounded-xl bg-[#1f108e] text-white text-xs font-bold cursor-pointer"
              >
                Sualı Yadda Saxla
              </button>
            </div>
          </form>

          {/* CSV Bulk Import */}
          <div className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display font-bold text-base text-[#191c1e] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#004d33]" />
                CSV Kütləvi Sual İdxalı
              </h2>
              <label className="px-3.5 py-2 rounded-xl bg-[#f2f4f6] text-xs font-bold text-[#1f108e] flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>.CSV Faylı Seç</span>
                <input type="file" accept=".csv,text/csv" onChange={handleCsvFileUpload} className="hidden" />
              </label>
            </div>
            <p className="text-[11px] text-[#464553] font-mono">
              Başlıq formatı: topicId,cefrLevel,mode,gameType,promptAz,questionText,options,correctAnswer,explanationAz
            </p>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="topicId,cefrLevel,mode,gameType,promptAz,questionText,options,correctAnswer,explanationAz&#10;a1-articles,A1,both,multiple_choice,Düzgün artiklı seç,I saw ___ elephant.,a|an|the|-,an,Sait səslə başlayan tək sayılan isimdən əvvəl an işlənir."
              className="w-full rounded-2xl bg-[#f2f4f6] border border-[#e0e3e5] p-3 text-xs font-mono"
            />
            {csvErrors.length > 0 && (
              <div className="rounded-xl bg-[#ffdad6] p-3 text-xs text-[#93000a]">
                {csvErrors.map((er, i) => (
                  <div key={i}>Sətir {er.row}: {er.reason}</div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={handleCsvImport}
              className="tactile-btn-emerald self-start px-5 py-2.5 rounded-xl bg-[#004d33] text-white text-xs font-bold cursor-pointer"
            >
              CSV-ni Yoxla və İdxal Et
            </button>
          </div>

          {/* Topic Curriculum Editor */}
          <div className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm flex flex-col gap-3">
            <h2 className="font-display font-bold text-base text-[#191c1e]">
              Kurikulum Mövzu İzahı Redaktoru (DİM Yeniləməsi)
            </h2>
            <select
              value={editingTopicId}
              onChange={(e) => {
                setEditingTopicId(e.target.value);
                const t = topics.find((item) => item.id === e.target.value);
                setEditingExplanation(t?.explanationAz || '');
              }}
              className="rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3 py-2 text-xs font-bold"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.cefrLevel}] {t.title} — {t.titleAz}
                </option>
              ))}
            </select>
            <textarea
              rows={3}
              value={editingExplanation}
              onChange={(e) => setEditingExplanation(e.target.value)}
              className="rounded-2xl bg-[#f2f4f6] border border-[#e0e3e5] p-3 text-xs"
            />
            <button
              type="button"
              onClick={handleSaveTopicExplanation}
              className="tactile-btn-primary self-start px-5 py-2.5 rounded-xl bg-[#1f108e] text-white text-xs font-bold cursor-pointer"
            >
              Mövzunu Yenilə
            </button>
          </div>

          {/* Existing Question Bank List */}
          <div className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm">
            <h2 className="font-display font-bold text-base text-[#191c1e] mb-3">
              Sual Bazası ({questions.length} sual)
            </h2>
            <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-2xl bg-[#f7f9fb] border border-[#e0e3e5] p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
                      <span className="px-2 py-0.5 rounded bg-[#e2dfff] text-[#1f108e]">
                        {q.cefrLevel}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#eceef0] text-[#464553]">
                        {q.gameType}
                      </span>
                      <span className="text-[#464553]">{q.mode}</span>
                    </div>
                    <div className="text-xs font-bold text-[#191c1e] mt-1 truncate">
                      {q.questionText}
                    </div>
                    <div className="text-[11px] text-[#004d33]">Cavab: {q.correctAnswer}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(q)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                        q.isPublished
                          ? 'bg-[#d1fae5] text-[#004d33]'
                          : 'bg-[#fef3c7] text-[#b45309]'
                      }`}
                    >
                      {q.isPublished ? 'Dərc Olunub' : 'Qaralama'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 rounded-xl bg-[#ffdad6] text-[#ba1a1a] cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USERS & PLANS */}
      {tab === 'users' && overview && (
        <div className="flex flex-col gap-5">
          <div className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm">
            <h2 className="font-display font-bold text-lg text-[#191c1e] mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1f108e]" />
              İstifadəçilər və Abunəlik İdarəetməsi
            </h2>
            <div className="divide-y divide-[#eceef0]">
              {overview.users.map((u) => (
                <div
                  key={u.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-sm text-[#191c1e]">
                      {u.nickname}{' '}
                      <span className="text-xs font-normal text-[#464553]">({u.email})</span>
                    </div>
                    <div className="text-xs text-[#464553]">
                      Rol: <strong>{u.role}</strong> · {u.xp} XP · {u.coins} Qızıl · CEFR {u.currentCefr}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.subscriptionPlan}
                      onChange={(e) =>
                        handleUserPlanChange(u.id, e.target.value as SubscriptionPlanCode)
                      }
                      className="rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3 py-1.5 text-xs font-bold"
                    >
                      <option value="FREE">FREE</option>
                      <option value="PREMIUM">PREMIUM</option>
                      <option value="PRO">PRO</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm">
            <h2 className="font-display font-bold text-base text-[#191c1e] mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#004d33]" />
              Abunəlik Planları
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {overview.subscriptionPlans.map((p) => (
                <div key={p.code} className="rounded-2xl bg-[#f7f9fb] border border-[#e0e3e5] p-4">
                  <div className="font-display font-bold text-sm text-[#1f108e]">{p.nameAz}</div>
                  <div className="font-mono font-bold text-lg text-[#191c1e] mt-1">
                    {p.monthlyPriceAzn} AZN/ay · {p.yearlyPriceAzn} AZN/il
                  </div>
                  <div className="text-xs text-[#464553] mt-1">
                    Gündəlik AI: {p.dailyAiLimit >= 999 ? 'Limitsiz' : p.dailyAiLimit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
