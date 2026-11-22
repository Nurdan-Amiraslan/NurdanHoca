import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Flame,
  Gamepad2,
  Globe,
  GraduationCap,
  Lock,
  Phone,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { CefrLevelCode, LearningMode, SubscriptionPlanConfig, UserAccount } from '../../types/gamify.ts';
import { GamifyLogo } from '../avatar/GamifyLogo.tsx';
import { NurdanAvatar } from '../avatar/NurdanAvatar.tsx';

interface LandingProps {
  plans: SubscriptionPlanConfig[];
  onGoLogin: () => void;
  onGoRegister: () => void;
  onQuickDemo: () => void;
  onGoLessonInfo: () => void;
}

export const LandingView: React.FC<LandingProps> = ({
  plans,
  onGoLogin,
  onGoRegister,
  onQuickDemo,
  onGoLessonInfo,
}) => {
  const [previewAnswer, setPreviewAnswer] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex flex-col">
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-[#f7f9fb]/95 backdrop-blur-md border-b border-[#e0e3e5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <GamifyLogo size={36} />
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#464553]">
            <a href="#rejimler" className="hover:text-[#1f108e] whitespace-nowrap">
              Tədris Rejimləri
            </a>
            <a href="#seviyyeler" className="hover:text-[#1f108e] whitespace-nowrap">
              CEFR A1–C1
            </a>
            <a href="#oyunlar" className="hover:text-[#1f108e] whitespace-nowrap">
              10 Oyun Növü
            </a>
            <a href="#dersler" className="hover:text-[#1f108e] whitespace-nowrap">
              Dərslərlə Bağlı Məlumat
            </a>
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onGoLogin}
              className="px-4 py-2 rounded-xl text-sm font-display font-bold text-[#1f108e] hover:bg-[#e2dfff]/50 whitespace-nowrap cursor-pointer"
            >
              Daxil Ol
            </button>
            <button
              type="button"
              onClick={onGoRegister}
              className="px-5 py-2.5 rounded-2xl bg-[#1f108e] text-white text-sm font-display font-bold tactile-btn-primary whitespace-nowrap cursor-pointer"
            >
              Pulsuz Başla
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="inline-flex items-center gap-2 text-xs font-display font-extrabold uppercase tracking-wider text-[#004d33]">
            <ShieldCheck className="w-4 h-4 text-[#2dc68d]" />
            <span>Can itkisi yoxdur · Abituriyent (DİM) & Aptis ESOL · CEFR A1–C1</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#191c1e] leading-[1.12] tracking-tight">
            İngilis dili qrammatikasını <span className="text-[#1f108e]">Nurdan Teacher</span> ilə oyunla fəth et.
          </h1>

          <p className="text-base sm:text-lg text-[#464553] max-w-2xl leading-relaxed">
            Azərbaycanlı öyrənənlər üçün hazırlanmış 65 mövzulu CEFR A1–C1 xəritəsi, 10 interaktiv qrammatika oyunu, DİM qəbul tələlərinin təhlili və fərdi Səhvlər Arxivi bir platformada.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="button"
              onClick={onQuickDemo}
              className="px-6 py-4 rounded-2xl bg-[#712ae2] text-white font-display font-extrabold text-base tactile-btn-secondary inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Rocket className="w-5 h-5" />
              <span>Sınaq Şagirdi kimi Başla</span>
            </button>
            <button
              type="button"
              onClick={onGoRegister}
              className="px-6 py-4 rounded-2xl bg-white text-[#1f108e] border border-[#c8c4d5] font-display font-bold text-base tactile-btn-neutral inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Qeydiyyatdan Keç</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-5 text-xs font-semibold text-[#464553]">
            <span>65 CEFR Mövzusu (A1–C1)</span>
            <span>·</span>
            <span>10 İnteraktiv Oyun</span>
            <span>·</span>
            <span>Aralıqlı Təkrar & XP</span>
          </div>
        </div>

        {/* Interactive Hero Practice Preview Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-[0_6px_0_0_#d8dadc] border border-[#e0e3e5] flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <NurdanAvatar mood={previewAnswer === 'has been' ? 'celebrating' : previewAnswer ? 'correcting' : 'explaining'} size={72} />
            <div>
              <div className="font-display font-extrabold text-base text-[#1f108e]">Nurdan Teacher AI</div>
              <div className="text-xs text-[#464553]">Canlı DİM & Aptis Qrammatika Yoxlaması</div>
            </div>
          </div>

          <div className="bg-[#f2f4f6] rounded-2xl p-4 text-sm font-semibold text-[#191c1e]">
            “She ______ to Paris three times in her life.”
          </div>

          <div className="grid grid-cols-1 gap-2">
            {[
              { label: 'went (Past Simple)', val: 'went' },
              { label: 'has been (Present Perfect)', val: 'has been' },
              { label: 'was going (Past Continuous)', val: 'was going' },
            ].map((opt) => {
              const selected = previewAnswer === opt.val;
              const isCorrect = opt.val === 'has been';
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setPreviewAnswer(opt.val)}
                  className={`px-4 py-2.5 rounded-xl text-left text-sm font-semibold transition-all cursor-pointer ${
                    selected
                      ? isCorrect
                        ? 'bg-[#6ffbbe]/40 text-[#002113] ring-2 ring-[#004d33]'
                        : 'bg-[#ffdad6] text-[#93000a] ring-2 ring-[#ba1a1a]'
                      : 'bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#191c1e]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {previewAnswer && (
            <div className="text-xs bg-[#e2dfff]/60 text-[#0f0069] rounded-xl p-3 leading-relaxed">
              {previewAnswer === 'has been'
                ? '✅ Əla! Həyat təcrübəsi ("in her life") ifadə edildiyi üçün Present Perfect ("has been") doğrudur.'
                : '💡 İpucu: Cümlədə dəqiq keçmiş zaman zərfi (məs. yesterday) yoxdur, həyat təcrübəsi bildirilir -> "has been".'}
            </div>
          )}
        </div>
      </section>

      {/* Dual Pathway Section */}
      <section id="rejimler" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <div className="text-xs font-display font-extrabold uppercase tracking-wider text-[#712ae2]">
            İki Müstəqil Tədris İstiqaməti
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#191c1e] mt-1">
            Məqsədinə uyğun rejimi seç
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-[0_4px_0_0_#d8dadc] border border-[#e0e3e5] flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#e2dfff] text-[#1f108e] flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-[#1f108e]">DİM 2025 Standartı · A1–B2</div>
                <h3 className="font-display font-extrabold text-xl">ABİTURİYENT REJİMİ</h3>
              </div>
            </div>
            <p className="text-sm text-[#464553] leading-relaxed">
              Universitetə qəbul imtahanlarına hazırlaşan şagirdlər üçün mövzu testləri, səhv aşkarlama, cümlə qurma, cümlə çevirmə və zamanlı sınaqlar.
            </p>
            <div className="text-xs font-semibold text-[#1f108e] pt-1">
              DİM Tələləri · Müqayisəli İzah · Sınaq Hesabatları
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-[0_4px_0_0_#d8dadc] border border-[#e0e3e5] flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#eaddff] text-[#712ae2] flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-[#712ae2]">CEFR A1–C1 · İmtahan Simulyasiyası</div>
                <h3 className="font-display font-extrabold text-xl">APTIS ESOL REJİMİ</h3>
              </div>
            </div>
            <p className="text-sm text-[#464553] leading-relaxed">
              A1-dən C1-ə qədər CEFR uyğun qrammatika məşqləri, kontekstual lüğət-qrammatika tapşırıqları və irəli sintaksis strukturları (orijinal hazırlıq sualları).
            </p>
            <div className="text-xs font-semibold text-[#712ae2] pt-1">
              CEFR A1–C1 · Kollokasiyalar · Rəsmi Üslub & İnversiya
            </div>
          </div>
        </div>
      </section>

      {/* 10 Games + CEFR Overview */}
      <section id="oyunlar" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div id="seviyyeler" className="bg-[#1f108e] text-white rounded-3xl p-6 sm:p-8 shadow-[0_6px_0_0_#0f0069]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="text-xs font-display font-extrabold uppercase tracking-wider text-[#6ffbbe]">
                10 İnteraktiv Oyun Mexanikası
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl mt-1">
                Qrammatikanı əzbərləmə — oynayaraq mənimsə
              </h2>
            </div>
            <div className="text-xs text-[#c3c0ff]">
              Hər 10 sualdan bir ilhamverici sitat · 9 Nişan · Sikkə Mağazası
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              'Çoxseçimli Test',
              'Boşluğu Tamamla',
              'Cümlə Qurucusu',
              'Səhvi Tap',
              'Cümlə Çevirmə',
              'Uyğunlaşdırma',
              'Sürət Yarışı',
              'Qrammatika Döyüşü',
              'Doğru / Yanlış',
              'Sürüşdür & Yerləşdir',
            ].map((name, idx) => (
              <div
                key={name}
                className="bg-white/10 rounded-2xl p-3 text-sm font-display font-bold flex items-center gap-2"
              >
                <span className="font-mono text-xs text-[#6ffbbe]">{String(idx + 1).padStart(2, '0')}</span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="font-display font-extrabold text-2xl text-[#191c1e] mb-5">Abunəlik Planları</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div
              key={p.code}
              className={`rounded-3xl p-6 bg-white border ${
                p.code === 'PREMIUM'
                  ? 'border-[#712ae2] shadow-[0_5px_0_0_#712ae2]'
                  : 'border-[#e0e3e5] shadow-[0_4px_0_0_#d8dadc]'
              } flex flex-col justify-between gap-4`}
            >
              <div>
                <div className="font-display font-extrabold text-lg text-[#1f108e]">{p.nameAz}</div>
                <p className="text-xs text-[#464553] mt-1">{p.taglineAz}</p>
                <div className="mt-4 font-mono text-3xl font-extrabold text-[#191c1e] tabular-nums">
                  {p.monthlyPriceAzn === 0 ? '0 AZN' : `${p.monthlyPriceAzn} AZN`}
                  <span className="text-xs font-sans font-normal text-[#464553]"> / ay</span>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-[#464553]">
                  {p.featuresAz.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#004d33] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={onGoRegister}
                className="w-full py-3 rounded-2xl bg-[#f2f4f6] hover:bg-[#e2dfff] text-[#1f108e] font-display font-bold text-sm cursor-pointer"
              >
                Planla Başla
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Discreet Lesson Registration Info Section */}
      <section id="dersler" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="bg-white rounded-3xl p-6 border border-[#e0e3e5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-lg text-[#191c1e]">
              Dərslərlə bağlı məlumat
            </h3>
            <p className="text-sm text-[#464553] mt-1">
              Canlı Abituriyent və Aptis ESOL dərslərinə qeydiyyat və proqram haqqında ətraflı məlumat üçün əlaqə saxlaya bilərsiniz.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onGoLessonInfo}
              className="px-4 py-2.5 rounded-xl bg-[#f2f4f6] text-sm font-bold text-[#464553] hover:bg-[#e6e8ea] cursor-pointer"
            >
              Ətraflı
            </button>
            <a
              href="tel:+994702079919"
              className="px-4 py-2.5 rounded-xl bg-[#e2dfff] text-[#1f108e] font-mono text-sm font-bold inline-flex items-center gap-2 hover:bg-[#c3c0ff]/50"
            >
              <Phone className="w-4 h-4" />
              <span>+994 70 207 99 19</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e0e3e5] bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#464553]">
          <div className="flex items-center gap-2">
            <GamifyLogo size={26} />
            <span>· Nurdan Teacher İngilis Dili Öyrənmə Platforması</span>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={onGoLessonInfo} className="hover:underline cursor-pointer">
              Dərs Qeydiyyatı Məlumatı
            </button>
            <a href="tel:+994702079919" className="font-mono font-bold text-[#1f108e] hover:underline">
              +994 70 207 99 19
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface AuthViewProps {
  initialTab: 'login' | 'register';
  requiresFirstRunAdminClaim: boolean;
  onSuccess: (user: UserAccount, token: string, nextView?: 'onboarding' | 'dashboard' | 'admin-dashboard') => void;
  onBackLanding: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialTab,
  requiresFirstRunAdminClaim,
  onSuccess,
  onBackLanding,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'admin'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [mode, setMode] = useState<LearningMode>('abituriyent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tab === 'register') {
        const res = await api.register({ email, password, nickname, mode });
        onSuccess(res.user, res.token, 'onboarding');
      } else if (tab === 'login') {
        const res = await api.login({ email, password });
        onSuccess(res.user, res.token, res.user.onboardingCompleted ? 'dashboard' : 'onboarding');
      } else {
        if (requiresFirstRunAdminClaim) {
          const res = await api.claimAdmin({ email: email || 'admin@gamify.az', nickname: nickname || 'Nurdan_Admin', password });
          onSuccess(res.user, res.token, 'admin-dashboard');
        } else {
          const res = await api.loginAdmin({ email: email || 'admin@gamify.az', passcode: password });
          onSuccess(res.user, res.token, 'admin-dashboard');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Əməliyyat zamanı xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.demoLogin();
      onSuccess(res.user, res.token, 'dashboard');
    } catch (err: any) {
      setError(err?.message || 'Sınaq girişi alınmadı.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-[0_6px_0_0_#d8dadc] border border-[#e0e3e5]">
        <div className="flex items-center justify-between mb-6">
          <GamifyLogo size={34} />
          <button
            type="button"
            onClick={onBackLanding}
            className="text-xs font-bold text-[#464553] hover:text-[#1f108e] cursor-pointer"
          >
            ← Ana Səhifə
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 bg-[#f2f4f6] p-1 rounded-2xl mb-5">
          {[
            { id: 'login' as const, label: 'Daxil Ol' },
            { id: 'register' as const, label: 'Qeydiyyat' },
            { id: 'admin' as const, label: 'Admin' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setError(null);
              }}
              className={`py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer ${
                tab === t.id ? 'bg-[#1f108e] text-white shadow-sm' : 'text-[#464553]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'admin' && requiresFirstRunAdminClaim && (
          <div className="mb-4 bg-[#eaddff] text-[#25005a] rounded-2xl p-3.5 text-xs leading-relaxed">
            <strong>İlk Administrator Quraşdırması:</strong> Hələ administrator şifrəsi təyin edilməyib. İlk admin hesabını və şifrəsini yaradaraq paneli aktivləşdirin.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {tab === 'register' && (
            <div>
              <label className="text-xs font-bold text-[#464553] block mb-1">Oyunçu Ləqəbi (Nickname)</label>
              <input
                type="text"
                required
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Məsələn: Aysel_2025"
                className="w-full px-4 py-3 rounded-xl bg-[#f2f4f6] border border-[#c8c4d5] focus:border-[#3730a3] focus:outline-none text-sm"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[#464553] block mb-1">E-poçt Ünvanı</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tab === 'admin' ? 'admin@gamify.az' : 'telebe@example.az'}
              className="w-full px-4 py-3 rounded-xl bg-[#f2f4f6] border border-[#c8c4d5] focus:border-[#3730a3] focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#464553] block mb-1">
              {tab === 'admin' ? 'Administrator Kodu / Şifrəsi' : 'Şifrə'}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ən azı 6 simvol"
              className="w-full px-4 py-3 rounded-xl bg-[#f2f4f6] border border-[#c8c4d5] focus:border-[#3730a3] focus:outline-none text-sm"
            />
          </div>

          {tab === 'register' && (
            <div>
              <label className="text-xs font-bold text-[#464553] block mb-1">İstiqamət</label>
              <div className="grid grid-cols-2 gap-2">
                {(['abituriyent', 'aptis'] as LearningMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`py-2.5 rounded-xl text-xs font-bold border ${
                      mode === m
                        ? 'bg-[#e2dfff] border-[#1f108e] text-[#1f108e]'
                        : 'bg-[#f2f4f6] border-transparent text-[#464553]'
                    }`}
                  >
                    {m === 'abituriyent' ? 'Abituriyent (DİM)' : 'Aptis ESOL'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-[#ffdad6] text-[#93000a] text-xs font-semibold rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#1f108e] text-white font-display font-extrabold text-sm tactile-btn-primary cursor-pointer"
          >
            {loading
              ? 'Yoxlanılır...'
              : tab === 'register'
                ? 'Hesab Yarat'
                : tab === 'admin'
                  ? requiresFirstRunAdminClaim
                    ? 'Admin Hesabını Aktivləşdir'
                    : 'Admin Panelinə Daxil Ol'
                  : 'Daxil Ol'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#e0e3e5]">
          <button
            type="button"
            onClick={handleDemo}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-[#6ffbbe]/40 text-[#002113] font-display font-bold text-sm hover:bg-[#6ffbbe]/60 transition-colors cursor-pointer"
          >
            ⚡ Sınaq Şagirdi (Aysel_2025) kimi Dərhal Başla
          </button>
        </div>
      </div>
    </div>
  );
};

interface ModeSelectProps {
  user: UserAccount;
  onSaveOnboarding: (patch: {
    activeMode: LearningMode;
    nickname: string;
    currentCefr: CefrLevelCode;
    dailyGoalTarget: number;
    onboardingCompleted: boolean;
  }) => Promise<void>;
}

export const ModeSelectOnboardingView: React.FC<ModeSelectProps> = ({ user, onSaveOnboarding }) => {
  const [selectedMode, setSelectedMode] = useState<LearningMode>(user.activeMode);
  const [nickname, setNickname] = useState(user.nickname || 'Abituriyent_2025');
  const [cefr, setCefr] = useState<CefrLevelCode>(user.currentCefr || 'A1');
  const [goal, setGoal] = useState(user.dailyGoalTarget || 20);
  const [saving, setSaving] = useState(false);

  async function handleStart() {
    setSaving(true);
    try {
      await onSaveOnboarding({
        activeMode: selectedMode,
        nickname: nickname.trim() || 'GAMIFY_Learner',
        currentCefr: cefr,
        dailyGoalTarget: goal,
        onboardingCompleted: true,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-4 flex flex-col gap-5">
      <div className="flex flex-col items-center text-center gap-2">
        <GamifyLogo size={54} showText={false} />
        <div className="inline-flex items-center gap-1.5 bg-[#004d33]/10 text-[#004d33] px-3.5 py-1.5 rounded-full text-xs font-display font-extrabold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Məhdudiyyətsiz Təcrübə · Can İtkisi Yoxdur</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl text-[#191c1e]">GAMIFY</h1>
        <p className="text-sm text-[#464553]">İngilis dili qrammatikasını oyunla fəth et!</p>
      </div>

      <div className="flex items-center justify-between text-xs px-1">
        <span className="font-bold text-[#464553]">Tədris istiqamətini seç:</span>
        <span className="font-bold text-[#1f108e]">Rejimi dəyişmək sərbəstdir</span>
      </div>

      {/* Mode Card 1: Abituriyent */}
      <div
        onClick={() => setSelectedMode('abituriyent')}
        className={`relative bg-white rounded-3xl p-5 cursor-pointer transition-all border-2 ${
          selectedMode === 'abituriyent'
            ? 'border-[#1f108e] shadow-[0_5px_0_0_#1f108e]'
            : 'border-[#e0e3e5] opacity-85'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e2dfff] text-[#1f108e] flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase text-[#1f108e]">
                DİM Standartı · A1–B2 Fokus
              </div>
              <h2 className="font-display font-extrabold text-lg text-[#191c1e]">
                ABİTURİYENT REJİMİ
              </h2>
            </div>
          </div>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center ${
              selectedMode === 'abituriyent' ? 'bg-[#1f108e] text-white' : 'bg-[#e6e8ea] text-[#777584]'
            }`}
          >
            <Check className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xs text-[#464553] leading-relaxed mb-3">
          Dövlət İmtahan Mərkəzi (9–11-ci siniflər) qəbul proqramı. Zamanlar, modal fellər, uzlaşma qaydaları və Azərbaycan dili ilə müqayisəli asan izahlar.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#464553]">
          <div className="bg-[#f2f4f6] px-3 py-2 rounded-xl flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-[#1f108e]" /> DİM Sınaq Modeli
          </div>
          <div className="bg-[#f2f4f6] px-3 py-2 rounded-xl flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#712ae2]" /> Sürətli Qrammatika
          </div>
        </div>
      </div>

      {/* Mode Card 2: Aptis ESOL */}
      <div
        onClick={() => setSelectedMode('aptis')}
        className={`relative bg-white rounded-3xl p-5 cursor-pointer transition-all border-2 ${
          selectedMode === 'aptis'
            ? 'border-[#712ae2] shadow-[0_5px_0_0_#712ae2]'
            : 'border-[#e0e3e5] opacity-85'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#eaddff] text-[#712ae2] flex items-center justify-center shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase text-[#712ae2]">
                CEFR A1–C1 · Aptis Hazırlıq
              </div>
              <h2 className="font-display font-extrabold text-lg text-[#191c1e]">
                APTIS ESOL REJİMİ
              </h2>
            </div>
          </div>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center ${
              selectedMode === 'aptis' ? 'bg-[#712ae2] text-white' : 'bg-[#e6e8ea] text-[#777584]'
            }`}
          >
            <Check className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xs text-[#464553] leading-relaxed mb-3">
          CEFR A1–C1 şkalası üzrə kontekstual qrammatika, kollokasiyalar və irəli sintaksis strukturları (orijinal hazırlıq məşqləri).
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#464553]">
          <div className="bg-[#f2f4f6] px-3 py-2 rounded-xl flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#712ae2]" /> 65 Qrammatika Mövzusu
          </div>
          <div className="bg-[#f2f4f6] px-3 py-2 rounded-xl flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#004d33]" /> Lüğət & Kollokasiya
          </div>
        </div>
      </div>

      {/* Nickname & CEFR & Daily Goal */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_3px_0_0_#d8dadc] flex flex-col gap-3">
        <div>
          <label className="text-xs font-bold text-[#191c1e] block mb-1">
            Oyunçu Ləqəbin (Nickname — Liderlər cədvəlində görünür)
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#f2f4f6] px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
            />
            <span className="absolute right-3 top-3 text-xs font-mono text-[#777584] tabular-nums">
              {nickname.length}/20
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#464553] block mb-1">Başlanğıc CEFR</label>
            <select
              value={cefr}
              onChange={(e) => setCefr(e.target.value as CefrLevelCode)}
              className="w-full bg-[#f2f4f6] px-3 py-2.5 rounded-xl text-sm font-bold"
            >
              {(['A1', 'A2', 'B1', 'B2', 'C1'] as CefrLevelCode[]).map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[#464553] block mb-1">Gündəlik Hədəf</label>
            <select
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="w-full bg-[#f2f4f6] px-3 py-2.5 rounded-xl text-sm font-bold"
            >
              <option value={10}>10 sual / gün</option>
              <option value={20}>20 sual / gün</option>
              <option value={30}>30 sual / gün</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={handleStart}
        className="w-full py-4 rounded-2xl bg-[#1f108e] text-white font-display font-extrabold text-base uppercase tracking-wider tactile-btn-primary flex items-center justify-center gap-2 cursor-pointer"
      >
        <Rocket className="w-5 h-5" />
        <span>{saving ? 'Hazırlanır...' : 'Macəraya Başla!'}</span>
      </button>
    </div>
  );
};
