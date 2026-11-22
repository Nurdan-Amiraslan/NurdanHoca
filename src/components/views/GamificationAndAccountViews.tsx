import React, { useEffect, useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Coins,
  Crown,
  Flame,
  Lock,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Swords,
  Trophy,
  User as UserIcon,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import {
  BadgeDefinition,
  BossChallenge,
  CefrLevelCode,
  DailyChallenge,
  GrammarTopic,
  LeaderboardEntry,
  LearningMode,
  QuestionItem,
  ShopItem,
  SubscriptionPlanCode,
  SubscriptionPlanConfig,
  UserAccount,
} from '../../types/gamify.ts';
import { StudentAvatar } from '../avatar/StudentAvatar.tsx';
import { GameEngine } from '../games/GameEngine.tsx';

// ==================== DAILY CHALLENGE VIEW ====================
interface DailyChallengeViewProps {
  user: UserAccount;
  onUserUpdated: (user: UserAccount) => void;
  onExit: () => void;
}

export const DailyChallengeView: React.FC<DailyChallengeViewProps> = ({
  user,
  onUserUpdated,
  onExit,
}) => {
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [completedToday, setCompletedToday] = useState(false);
  const [started, setStarted] = useState(false);
  const [rewardBanner, setRewardBanner] = useState<string>('');

  useEffect(() => {
    api
      .getDailyChallenge()
      .then((res) => {
        setChallenge(res.challenge);
        setQuestions(res.questions);
        setCompletedToday(res.completedToday);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-sm text-[#464553]">Günün missiyası yüklənir...</div>;
  }

  if (!challenge) return null;

  if (started && questions.length > 0) {
    return (
      <GameEngine
        questions={questions}
        mode={user.activeMode}
        titleAz={challenge.titleAz}
        subtitleAz="Günün Missiyası — +100 XP və +35 Sikkə mükafatı"
        onUserUpdated={onUserUpdated}
        onExit={() => setStarted(false)}
        onSessionCompleted={async () => {
          try {
            const res = await api.completeDailyChallenge();
            onUserUpdated(res.user);
            setCompletedToday(true);
            setRewardBanner(`Təbriklər! Günün missiyası tamamlandı (+${res.xpAdded} XP, +${res.coinsAdded} Qızıl)!`);
          } catch {
            setCompletedToday(true);
          }
        }}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <div className="rounded-3xl bg-gradient-to-br from-[#1f108e] to-[#712ae2] p-6 text-white shadow-md">
        <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
          📅 Günün Missiyası · {challenge.date}
        </span>
        <h1 className="font-display font-extrabold text-3xl mt-3">{challenge.titleAz}</h1>
        <p className="text-sm text-white/85 mt-1">{challenge.descriptionAz}</p>

        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-full bg-white/15">⚡ +{challenge.xpReward} XP</span>
          <span className="px-3 py-1.5 rounded-full bg-white/15">🪙 +{challenge.coinReward} Qızıl</span>
          <span className="px-3 py-1.5 rounded-full bg-white/15">{questions.length} Sual</span>
        </div>

        {rewardBanner && (
          <div className="mt-4 rounded-2xl bg-[#6ffbbe] text-[#003421] p-3 text-sm font-bold">
            {rewardBanner}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="tactile-btn-emerald px-6 py-3 rounded-2xl bg-[#2dc68d] text-[#003421] font-display font-extrabold text-sm cursor-pointer"
          >
            {completedToday ? 'Yenidən Məşq Et' : 'Missiyanı Başlat'}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="px-5 py-3 rounded-2xl bg-white/15 text-white font-bold text-sm cursor-pointer"
          >
            Geri
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== BOSS CHALLENGE VIEW ====================
interface BossChallengeViewProps {
  user: UserAccount;
  initialCefr?: CefrLevelCode;
  onUserUpdated: (user: UserAccount) => void;
}

export const BossChallengeView: React.FC<BossChallengeViewProps> = ({
  user,
  initialCefr,
  onUserUpdated,
}) => {
  const [challenges, setChallenges] = useState<Array<BossChallenge & { questions: QuestionItem[] }>>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [activeBoss, setActiveBoss] = useState<(BossChallenge & { questions: QuestionItem[] }) | null>(null);
  const [resultMsg, setResultMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getBossChallenges()
      .then((res) => {
        setChallenges(res.challenges);
        setCompletedIds(res.completedIds);
        if (initialCefr) {
          const match = res.challenges.find((c) => c.cefrLevel === initialCefr);
          if (match) setActiveBoss(match);
        }
      })
      .finally(() => setLoading(false));
  }, [initialCefr]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-[#464553]">Boss sınaqları yüklənir...</div>;
  }

  if (activeBoss) {
    return (
      <GameEngine
        questions={activeBoss.questions}
        mode={user.activeMode}
        titleAz={`${activeBoss.cefrLevel} Boss: ${activeBoss.titleAz}`}
        subtitleAz={`Keçid balı: ${activeBoss.passPercent}% · Vaxt limiti: ${Math.round(activeBoss.timeLimitSeconds / 60)} dəqiqə`}
        timeLimitSeconds={activeBoss.timeLimitSeconds}
        onUserUpdated={onUserUpdated}
        onExit={() => setActiveBoss(null)}
        onSessionCompleted={async ({ scorePercent }) => {
          const res = await api.completeBossChallenge(activeBoss.id, scorePercent);
          onUserUpdated(res.user);
          if (res.passed) {
            setCompletedIds((prev) => [...new Set([...prev, activeBoss.id])]);
            setResultMsg(
              `🎉 ${activeBoss.cefrLevel} Boss məğlub edildi (${scorePercent}%)! +${res.xpAdded} XP və +${res.coinsAdded} Qızıl qazandınız!`
            );
          } else {
            setResultMsg(
              `Nəticə: ${scorePercent}%. Keçid üçün ${activeBoss.passPercent}% tələb olunur — can itkisi olmadan yenidən cəhd edə bilərsən!`
            );
          }
          setActiveBoss(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5">
      <div className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm">
        <h1 className="font-display font-extrabold text-2xl text-[#191c1e] flex items-center gap-2">
          <Swords className="w-6 h-6 text-[#712ae2]" />
          Unit Boss Sınaqları (A1 – C1)
        </h1>
        <p className="text-sm text-[#464553] mt-1">
          Hər CEFR səviyyəsinin sonunda vaxt məhdudiyyətli böyük sınaqdan keçərək xüsusi nişan və bonus sikkələr qazan.
        </p>
        {resultMsg && (
          <div className="mt-4 rounded-2xl bg-[#e2dfff] text-[#1f108e] p-3.5 text-sm font-bold">
            {resultMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map((boss) => {
          const done = completedIds.includes(boss.id);
          return (
            <div
              key={boss.id}
              className="rounded-3xl bg-[#191c1e] text-white p-5 flex flex-col justify-between gap-4 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-white/15 text-[#6ffbbe] text-xs font-bold">
                    👑 {boss.cefrLevel} BOSS
                  </span>
                  <span className="text-xs font-mono text-white/75">
                    ⏱ {Math.round(boss.timeLimitSeconds / 60)} dəq · {boss.questions.length} sual
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-xl mt-3">{boss.titleAz}</h2>
                <p className="text-xs text-white/80 mt-1">{boss.descriptionAz}</p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-full bg-white/10">⚡ +{boss.xpReward} XP</span>
                <span className="px-2.5 py-1 rounded-full bg-white/10">🪙 +{boss.coinReward} Qızıl</span>
                <span className="px-2.5 py-1 rounded-full bg-white/10">Keçid: {boss.passPercent}%</span>
                {done && (
                  <span className="px-2.5 py-1 rounded-full bg-[#2dc68d] text-[#003421]">
                    ✅ Fəth Edilib
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={boss.questions.length === 0}
                onClick={() => setActiveBoss(boss)}
                className="tactile-btn-secondary w-full py-3 rounded-2xl bg-[#712ae2] text-white font-display font-bold text-sm cursor-pointer disabled:opacity-50"
              >
                {done ? 'Yenidən Meydan Oxu' : 'Boss Döyüşünə Başla'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== LEADERBOARD VIEW ====================
export const LeaderboardView: React.FC<{ currentUser: UserAccount }> = ({ currentUser }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'overall'>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getLeaderboard(period)
      .then((res) => setEntries(res.entries))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <div className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#191c1e] flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#d97706]" />
            Liderlər Cədvəli
          </h1>
          <p className="text-xs text-[#464553] mt-1">
            Məxfilik qorunur — cədvəldə yalnız tələbə ləqəbləri (nickname) göstərilir.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#f2f4f6] p-1 rounded-2xl">
          {[
            { id: 'daily' as const, label: 'Günlük' },
            { id: 'weekly' as const, label: 'Həftəlik' },
            { id: 'monthly' as const, label: 'Aylıq' },
            { id: 'overall' as const, label: 'Ümumi' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPeriod(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                period === t.id ? 'bg-[#1f108e] text-white' : 'text-[#464553]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-[#e0e3e5] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#464553]">Yüklənir...</div>
        ) : (
          <div className="divide-y divide-[#eceef0]">
            {entries.map((entry) => {
              const isMe = entry.userId === currentUser.id;
              return (
                <div
                  key={entry.userId}
                  className={`px-5 py-4 flex items-center justify-between gap-3 ${
                    isMe ? 'bg-[#e2dfff]/45' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-8 h-8 rounded-full font-mono font-extrabold text-sm flex items-center justify-center ${
                        entry.rank === 1
                          ? 'bg-[#fef3c7] text-[#b45309]'
                          : entry.rank === 2
                          ? 'bg-[#e0e3e5] text-[#191c1e]'
                          : entry.rank === 3
                          ? 'bg-[#ffedd5] text-[#c2410c]'
                          : 'bg-[#f2f4f6] text-[#464553]'
                      }`}
                    >
                      {entry.rank}
                    </div>
                    <StudentAvatar
                      accessory={entry.equippedAccessory}
                      size={38}
                      nickname={entry.nickname}
                    />
                    <div>
                      <div className="font-display font-bold text-sm text-[#191c1e]">
                        {entry.nickname} {isMe && <span className="text-[#1f108e]">(Sən)</span>}
                      </div>
                      <div className="text-[11px] text-[#464553]">
                        Səviyyə {entry.level} · CEFR {entry.cefrLevel} ·{' '}
                        {entry.mode === 'abituriyent' ? 'Abituriyent' : 'Aptis'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-mono font-bold text-[#ea580c]">
                      <Flame className="w-3.5 h-3.5" /> {entry.streakDays}g
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#f2f4f6] font-mono font-extrabold text-xs text-[#1f108e] tabular-nums">
                      ⚡ {entry.xp} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== ACHIEVEMENTS & SHOP VIEW ====================
interface AchievementsShopViewProps {
  user: UserAccount;
  earnedBadgeIds: string[];
  badgeDefinitions: BadgeDefinition[];
  onUserUpdated: (user: UserAccount) => void;
}

export const AchievementsShopView: React.FC<AchievementsShopViewProps> = ({
  user,
  earnedBadgeIds,
  badgeDefinitions,
  onUserUpdated,
}) => {
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.getShop().then((res) => setShopItems(res.items));
  }, []);

  const handleBuyOrEquip = async (item: ShopItem) => {
    setErrorMsg('');
    setStatusMsg('');
    const owned = user.unlockedShopItems.includes(item.id);
    try {
      if (!owned) {
        const res = await api.buyShopItem(item.id);
        onUserUpdated(res.user);
        setStatusMsg(`"${item.nameAz}" alındı və geyindirildi!`);
      } else {
        const patch: Partial<UserAccount> =
          item.category === 'outfit'
            ? { equippedOutfit: item.id }
            : item.category === 'accessory'
            ? { equippedAccessory: item.id }
            : { equippedTheme: item.id };
        const res = await api.updateMe(patch);
        onUserUpdated(res.user);
        setStatusMsg(`"${item.nameAz}" aktivləşdirildi!`);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Əməliyyat baş tutmadı.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Badges Grid */}
      <section className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-[#191c1e] flex items-center gap-2">
              <Award className="w-6 h-6 text-[#1f108e]" />
              Nişanlar və Nailiyyətlər ({earnedBadgeIds.length}/{badgeDefinitions.length})
            </h1>
            <p className="text-xs text-[#464553] mt-1">
              Hədəflərə çatdıqca eksklüziv nişanlar, bonus XP və qızıl sikkələr qazan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {badgeDefinitions.map((badge) => {
            const unlocked = earnedBadgeIds.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-2xl p-4 border flex items-start gap-3 ${
                  unlocked
                    ? 'bg-[#f7f9fb] border-[#2dc68d]'
                    : 'bg-[#f2f4f6]/70 border-[#e0e3e5] opacity-75'
                }`}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white font-display font-bold"
                  style={{ backgroundColor: unlocked ? badge.color : '#9ca3af' }}
                >
                  {unlocked ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-sm text-[#191c1e]">
                    {badge.titleAz}
                  </div>
                  <div className="text-xs text-[#464553] mt-0.5">{badge.descriptionAz}</div>
                  <div className="text-[11px] font-mono font-bold text-[#1f108e] mt-1.5">
                    +{badge.xpBonus} XP · +{badge.coinBonus} 🪙
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Virtual Coin Shop */}
      <section className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-[#191c1e] flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#712ae2]" />
              Qızıl Sikkə Mağazası
            </h2>
            <p className="text-xs text-[#464553] mt-1">
              Suallardan qazandığın sikkələrlə avatar geyimləri, aksesuarlar və mövzular aç.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StudentAvatar
              outfit={user.equippedOutfit}
              accessory={user.equippedAccessory}
              size={48}
              nickname={user.nickname}
            />
            <div className="px-4 py-2 rounded-2xl bg-[#fef3c7] text-[#b45309] font-mono font-extrabold text-sm flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              <span>{user.coins} Qızıl</span>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className="mb-4 rounded-2xl bg-[#d1fae5] text-[#004d33] px-4 py-3 text-xs font-bold">
            {statusMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 rounded-2xl bg-[#ffdad6] text-[#93000a] px-4 py-3 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {shopItems.map((item) => {
            const owned = user.unlockedShopItems.includes(item.id);
            const equipped =
              user.equippedOutfit === item.id ||
              user.equippedAccessory === item.id ||
              user.equippedTheme === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-[#f7f9fb] border border-[#e0e3e5] p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-xl border border-black/10 shrink-0"
                      style={{ backgroundColor: item.previewColor }}
                    />
                    <div>
                      <div className="font-display font-bold text-sm text-[#191c1e]">
                        {item.nameAz}
                      </div>
                      <div className="text-[11px] text-[#464553] capitalize">{item.category}</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#b45309]">
                    {item.priceCoins === 0 ? 'Pulsuz' : `${item.priceCoins} 🪙`}
                  </span>
                </div>
                <p className="text-xs text-[#464553]">{item.descriptionAz}</p>
                <button
                  type="button"
                  disabled={equipped}
                  onClick={() => handleBuyOrEquip(item)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                    equipped
                      ? 'bg-[#d1fae5] text-[#004d33]'
                      : owned
                      ? 'bg-[#e2dfff] text-[#1f108e]'
                      : 'tactile-btn-primary bg-[#1f108e] text-white'
                  }`}
                >
                  {equipped
                    ? 'Aktivdir ✓'
                    : owned
                    ? 'Seç və İstifadə Et'
                    : `Al (${item.priceCoins} Qızıl)`}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

// ==================== SUBSCRIPTION VIEW ====================
interface SubscriptionViewProps {
  user: UserAccount;
  plans: SubscriptionPlanConfig[];
  onUserUpdated: (user: UserAccount) => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  user,
  plans,
  onUserUpdated,
}) => {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [notice, setNotice] = useState('');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planCode: SubscriptionPlanCode, activatePreview: boolean) => {
    setLoadingPlan(planCode);
    setNotice('');
    try {
      const res = await api.checkoutSubscription(planCode, cycle, activatePreview);
      onUserUpdated(res.user);
      setNotice(
        activatePreview
          ? `${planCode} planı önizləmə rejimində aktivləşdirildi. (${res.payment.providerNote})`
          : `Ödəniş sorğusu qeydə alındı (#${res.payment.id}). ${res.payment.providerNote}`
      );
    } catch (err: any) {
      setNotice(err?.message || 'Xəta baş verdi.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#191c1e] flex items-center gap-2">
            <Crown className="w-6 h-6 text-[#712ae2]" />
            Abunəlik Planları
          </h1>
          <p className="text-xs text-[#464553] mt-1">
            Cari planınız: <strong className="text-[#1f108e]">{user.subscriptionPlan}</strong>. Ödəniş şlüzü qoşulana qədər önizləmə aktivləşdirməsindən istifadə edə bilərsiniz.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#f2f4f6] p-1 rounded-2xl self-start">
          <button
            type="button"
            onClick={() => setCycle('monthly')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              cycle === 'monthly' ? 'bg-[#1f108e] text-white' : 'text-[#464553]'
            }`}
          >
            Aylıq
          </button>
          <button
            type="button"
            onClick={() => setCycle('yearly')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              cycle === 'yearly' ? 'bg-[#1f108e] text-white' : 'text-[#464553]'
            }`}
          >
            İllik (Endirimli)
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl bg-[#e2dfff] text-[#1f108e] px-4 py-3 text-xs font-bold">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isCurrent = user.subscriptionPlan === plan.code;
          const price = cycle === 'monthly' ? plan.monthlyPriceAzn : plan.yearlyPriceAzn;
          return (
            <div
              key={plan.code}
              className={`rounded-3xl p-6 border flex flex-col justify-between gap-5 ${
                plan.code === 'PREMIUM'
                  ? 'bg-[#1f108e] text-white border-[#1f108e] shadow-lg'
                  : 'bg-white text-[#191c1e] border-[#e0e3e5] shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-display font-extrabold text-lg">{plan.nameAz}</span>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#2dc68d] text-[#003421] text-[11px] font-bold">
                      Aktiv
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1 ${plan.code === 'PREMIUM' ? 'text-white/80' : 'text-[#464553]'}`}>
                  {plan.taglineAz}
                </p>
                <div className="mt-4 font-display font-extrabold text-3xl font-mono tabular-nums">
                  {price === 0 ? '0 AZN' : `${price} AZN`}
                  <span className="text-xs font-sans font-normal opacity-75">
                    /{cycle === 'monthly' ? 'ay' : 'il'}
                  </span>
                </div>

                <ul className="mt-4 flex flex-col gap-2 text-xs">
                  {plan.featuresAz.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 shrink-0 text-[#2dc68d]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={loadingPlan === plan.code}
                  onClick={() => handleSelectPlan(plan.code, true)}
                  className={`w-full py-3 rounded-2xl font-display font-bold text-xs cursor-pointer ${
                    plan.code === 'PREMIUM'
                      ? 'tactile-btn-emerald bg-[#2dc68d] text-[#003421]'
                      : 'tactile-btn-primary bg-[#1f108e] text-white'
                  }`}
                >
                  {isCurrent ? 'Plan Aktivdir' : 'Önizləmə ilə Aktivləşdir'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== PROFILE VIEW ====================
interface ProfileViewProps {
  user: UserAccount;
  topics: GrammarTopic[];
  onUserUpdated: (user: UserAccount) => void;
  onOpenTopic: (topic: GrammarTopic) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  topics,
  onUserUpdated,
  onOpenTopic,
}) => {
  const [nickname, setNickname] = useState(user.nickname);
  const [dailyGoalTarget, setDailyGoalTarget] = useState(user.dailyGoalTarget);
  const [activeMode, setActiveMode] = useState<LearningMode>(user.activeMode);
  const [currentCefr, setCurrentCefr] = useState<CefrLevelCode>(user.currentCefr);
  const [savedMsg, setSavedMsg] = useState('');

  const bookmarkedTopicObjs = topics.filter((t) => user.bookmarkedTopics.includes(t.id));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg('');
    const res = await api.updateMe({
      nickname,
      dailyGoalTarget,
      activeMode,
      currentCefr,
    });
    onUserUpdated(res.user);
    setSavedMsg('Profil məlumatları yadda saxlanıldı!');
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <section className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm flex flex-col sm:flex-row items-center gap-5">
        <StudentAvatar
          outfit={user.equippedOutfit}
          accessory={user.equippedAccessory}
          size={84}
          nickname={user.nickname}
        />
        <div className="text-center sm:text-left">
          <h1 className="font-display font-extrabold text-2xl text-[#191c1e] flex items-center justify-center sm:justify-start gap-2">
            <UserIcon className="w-5 h-5 text-[#1f108e]" />
            {user.nickname}
          </h1>
          <p className="text-xs text-[#464553] mt-1">{user.email}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3 text-xs font-bold">
            <span className="px-3 py-1 rounded-full bg-[#e2dfff] text-[#1f108e]">
              Səviyyə {user.level} · {user.xp} XP
            </span>
            <span className="px-3 py-1 rounded-full bg-[#fef3c7] text-[#b45309]">
              {user.coins} Qızıl
            </span>
            <span className="px-3 py-1 rounded-full bg-[#d1fae5] text-[#004d33]">
              Plan: {user.subscriptionPlan}
            </span>
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm flex flex-col gap-4">
        <h2 className="font-display font-bold text-lg text-[#191c1e]">Tədris Tənzimləmələri</h2>
        {savedMsg && (
          <div className="rounded-2xl bg-[#d1fae5] text-[#004d33] px-4 py-2.5 text-xs font-bold">
            {savedMsg}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#464553] mb-1">Ləqəb (Nickname)</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="w-full rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3.5 py-2.5 text-sm font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#464553] mb-1">Gündəlik Sual Hədəfi</label>
            <input
              type="number"
              min={5}
              max={100}
              value={dailyGoalTarget}
              onChange={(e) => setDailyGoalTarget(Number(e.target.value))}
              className="w-full rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3.5 py-2.5 text-sm font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#464553] mb-1">Aktiv Rejim</label>
            <select
              value={activeMode}
              onChange={(e) => setActiveMode(e.target.value as LearningMode)}
              className="w-full rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3.5 py-2.5 text-sm font-bold"
            >
              <option value="abituriyent">Abituriyent (DİM Qəbul)</option>
              <option value="aptis">Aptis ESOL Hazırlıq</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#464553] mb-1">Cari CEFR Səviyyəsi</label>
            <select
              value={currentCefr}
              onChange={(e) => setCurrentCefr(e.target.value as CefrLevelCode)}
              className="w-full rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] px-3.5 py-2.5 text-sm font-bold"
            >
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="tactile-btn-primary self-start px-6 py-3 rounded-2xl bg-[#1f108e] text-white font-display font-bold text-sm cursor-pointer"
        >
          Yadda Saxla
        </button>
      </form>

      {/* Bookmarked Rules Notebook */}
      <section className="rounded-3xl bg-white p-6 border border-[#e0e3e5] shadow-sm">
        <h2 className="font-display font-bold text-lg text-[#191c1e] mb-3">
          📚 Qeyd Dəftərim ({bookmarkedTopicObjs.length} mövzu)
        </h2>
        {bookmarkedTopicObjs.length === 0 ? (
          <p className="text-xs text-[#464553]">
            Hələ qeyd dəftərinə mövzu əlavə etməmisən. Mövzu izahı səhifəsindən saxlaya bilərsən.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bookmarkedTopicObjs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onOpenTopic(t)}
                className="text-left rounded-2xl bg-[#f2f4f6] hover:bg-[#e2dfff]/60 p-4 transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#1f108e]">{t.cefrLevel}</div>
                <div className="font-display font-bold text-sm text-[#191c1e]">{t.title}</div>
                <div className="text-xs text-[#464553]">{t.titleAz}</div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// ==================== LESSON REGISTRATION INFO PAGE ====================
export const LessonInfoView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <div className="rounded-3xl bg-white p-7 border border-[#e0e3e5] shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-[#e2dfff] text-[#1f108e] text-xs font-bold">
            Dərslərlə Bağlı Məlumat
          </span>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold text-[#464553] hover:text-[#191c1e] cursor-pointer"
          >
            ← Geri qayıt
          </button>
        </div>

        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#191c1e]">
            Nurdan Teacher ilə Canlı & Onlayn Qrammatika Dərsləri
          </h1>
          <p className="text-sm text-[#464553] mt-2 leading-relaxed">
            GAMIFY platformasındakı oyunlaşdırılmış təcrübəni fərdi və ya kiçik qrup dərsləri ilə birləşdirərək Abituriyent (DİM qəbul) və Aptis ESOL imtahanlarına sistemli şəkildə hazırlaşa bilərsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-[#f7f9fb] p-4 border border-[#e0e3e5]">
            <div className="font-display font-bold text-base text-[#1f108e]">
              Abituriyent Hazırlığı (9–11-ci siniflər)
            </div>
            <p className="text-xs text-[#464553] mt-1.5 leading-relaxed">
              Dövlət İmtahan Mərkəzinin proqramına tam uyğun qrammatika, tələ sualların izahı, dinləmə və oxu strategiyaları.
            </p>
          </div>
          <div className="rounded-2xl bg-[#f7f9fb] p-4 border border-[#e0e3e5]">
            <div className="font-display font-bold text-base text-[#004d33]">
              Aptis ESOL Hazırlığı (A1 – C1)
            </div>
            <p className="text-xs text-[#464553] mt-1.5 leading-relaxed">
              CEFR şkalası üzrə Grammar & Vocabulary, Speaking, Writing və Reading bölmələri üzrə orijinal məşq proqramı.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#f2f4f6] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-[#464553]">Qeydiyyat və ətraflı məlumat üçün əlaqə:</div>
            <div className="text-xs text-[#464553] mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#004d33]" />
              <span>Həftəiçi və şənbə günləri · 09:00 – 20:00</span>
            </div>
          </div>
          <a
            href="tel:+994702079919"
            className="tactile-btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#1f108e] text-white font-mono font-bold text-sm"
          >
            <Phone className="w-4 h-4" />
            <span>+994 70 207 99 19</span>
          </a>
        </div>
      </div>
    </div>
  );
};
