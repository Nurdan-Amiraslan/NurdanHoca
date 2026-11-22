import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Bot,
  Crown,
  Flame,
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Phone,
  Shield,
  Sparkles,
  Trophy,
  User as UserIcon,
  X,
  AlertCircle,
  Swords,
} from 'lucide-react';
import { AppView, LearningMode, UserAccount } from '../../types/gamify.ts';
import { GamifyLogo } from '../avatar/GamifyLogo.tsx';
import { StudentAvatar } from '../avatar/StudentAvatar.tsx';

interface AppShellProps {
  user: UserAccount;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onSwitchMode: (mode: LearningMode) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  user,
  currentView,
  onNavigate,
  onSwitchMode,
  onLogout,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ view: AppView; label: string; icon: React.ReactNode; group: 'learn' | 'stats' | 'more' }> = [
    { view: 'dashboard', label: 'İdarə Paneli', icon: <LayoutDashboard className="w-4 h-4" />, group: 'learn' },
    { view: 'map', label: 'Qrammatika Xəritəsi', icon: <Map className="w-4 h-4" />, group: 'learn' },
    { view: 'levels', label: 'CEFR Səviyyələr', icon: <GraduationCap className="w-4 h-4" />, group: 'learn' },
    { view: 'game', label: '10 Oyun Rejimi', icon: <Gamepad2 className="w-4 h-4" />, group: 'learn' },
    { view: 'daily-challenge', label: 'Günün Missiyası', icon: <Sparkles className="w-4 h-4" />, group: 'learn' },
    { view: 'boss-challenge', label: 'Boss Sınaqları', icon: <Swords className="w-4 h-4" />, group: 'learn' },
    { view: 'ai-teacher', label: 'Nurdan Teacher AI', icon: <Bot className="w-4 h-4" />, group: 'learn' },
    { view: 'mistakes', label: 'Səhvlər Arxivi', icon: <AlertCircle className="w-4 h-4" />, group: 'stats' },
    { view: 'analytics', label: 'Analitika', icon: <BarChart3 className="w-4 h-4" />, group: 'stats' },
    { view: 'leaderboard', label: 'Liderlər Cədvəli', icon: <Trophy className="w-4 h-4" />, group: 'stats' },
    { view: 'achievements', label: 'Nişanlar & Mağaza', icon: <Crown className="w-4 h-4" />, group: 'stats' },
    { view: 'subscription', label: 'Abunəlik Planları', icon: <BookOpen className="w-4 h-4" />, group: 'more' },
    { view: 'lesson-info', label: 'Dərslərlə Bağlı Məlumat', icon: <Phone className="w-4 h-4" />, group: 'more' },
    { view: 'profile', label: 'Profilim', icon: <UserIcon className="w-4 h-4" />, group: 'more' },
  ];

  const handleNav = (v: AppView) => {
    onNavigate(v);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb] text-[#191c1e]">
      {/* Fixed Top HUD Header */}
      <header className="sticky top-0 z-40 bg-[#f7f9fb]/95 backdrop-blur-md border-b border-[#e0e3e5]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="lg:hidden p-2 rounded-xl bg-[#eceef0] text-[#191c1e]"
              aria-label="Menyu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button type="button" onClick={() => handleNav('dashboard')} className="cursor-pointer">
              <GamifyLogo size={34} />
            </button>
          </div>

          {/* Mode Toggle + Gamification Stats */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() =>
                onSwitchMode(user.activeMode === 'abituriyent' ? 'aptis' : 'abituriyent')
              }
              className="px-3 py-1.5 rounded-full bg-[#e0e3e5] hover:bg-[#eaddff] text-xs font-display font-extrabold text-[#1f108e] whitespace-nowrap cursor-pointer transition-colors"
              title="Tədris rejimini dəyiş"
            >
              {user.activeMode === 'abituriyent' ? 'Abituriyent ⇄' : 'Aptis ESOL ⇄'}
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f4f6] text-xs font-mono font-bold tabular-nums shadow-[0_2px_0_0_#e0e3e5]">
              <Flame className="w-3.5 h-3.5 text-[#ea580c]" />
              <span>{user.streakDays} Gün</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f2f4f6] text-xs font-mono font-bold text-[#1f108e] tabular-nums shadow-[0_2px_0_0_#e0e3e5]">
              <span>⚡ {user.xp} XP</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f2f4f6] text-xs font-mono font-bold text-[#004d33] tabular-nums shadow-[0_2px_0_0_#e0e3e5]">
              <span>🪙 {user.coins}</span>
            </div>

            <button
              type="button"
              onClick={() => handleNav('profile')}
              className="flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <StudentAvatar
                outfit={user.equippedOutfit}
                accessory={user.equippedAccessory}
                size={34}
                nickname={user.nickname}
              />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-r border-[#e0e3e5] bg-white p-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = currentView === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleNav(item.view)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-[#1f108e] text-white shadow-[0_3px_0_0_#0f0069]'
                      : 'text-[#464553] hover:bg-[#f2f4f6]'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={() => handleNav('admin-dashboard')}
                className={`mt-2 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-bold text-left cursor-pointer ${
                  currentView.startsWith('admin')
                    ? 'bg-[#712ae2] text-white'
                    : 'bg-[#eaddff] text-[#25005a]'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Paneli</span>
              </button>
            )}
          </nav>

          <div className="pt-4 border-t border-[#e0e3e5] flex flex-col gap-2">
            <div className="text-xs text-[#464553] px-2">
              Plan: <strong className="text-[#1f108e]">{user.subscriptionPlan}</strong> · {user.currentCefr}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıxış</span>
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-[#191c1e]/40 backdrop-blur-sm flex">
            <div className="w-72 bg-white h-full p-4 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#e0e3e5]">
                  <GamifyLogo size={30} />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-xl bg-[#f2f4f6]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-col gap-1">
                  {navItems.map((item) => (
                    <button
                      key={item.view}
                      type="button"
                      onClick={() => handleNav(item.view)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-left ${
                        currentView === item.view
                          ? 'bg-[#1f108e] text-white'
                          : 'text-[#464553] hover:bg-[#f2f4f6]'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                  {user.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleNav('admin-dashboard')}
                      className="mt-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold bg-[#eaddff] text-[#25005a]"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin Paneli</span>
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-[#ba1a1a] bg-[#ffdad6]/40"
              >
                <LogOut className="w-4 h-4" />
                <span>Hesabdan Çıx</span>
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 pb-24 lg:pb-10 flex flex-col justify-between gap-8">
          <div>{children}</div>

          {/* Discreet Footer with Exact Contact Number */}
          <footer className="border-t border-[#e0e3e5] pt-5 pb-4 text-xs text-[#464553] flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              © {new Date().getFullYear()} <strong>GAMIFY</strong> · Nurdan Teacher İngilis Dili Qrammatika Platforması
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleNav('lesson-info')}
                className="hover:text-[#1f108e] underline cursor-pointer"
              >
                Dərslərlə bağlı məlumat
              </button>
              <a
                href="tel:+994702079919"
                className="font-mono font-bold text-[#1f108e] hover:underline"
              >
                +994 70 207 99 19
              </a>
            </div>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom 5-Tab Bar (Matching uploaded HTML screens) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e0e3e5] h-16 px-2 flex items-center justify-around">
        {[
          { view: 'map' as AppView, label: 'Xəritə', icon: <Map className="w-5 h-5" /> },
          { view: 'game' as AppView, label: 'Təcrübə', icon: <Swords className="w-5 h-5" /> },
          { view: 'ai-teacher' as AppView, label: 'AI Müəllim', icon: <Bot className="w-5 h-5" /> },
          { view: 'leaderboard' as AppView, label: 'Liderlər', icon: <Trophy className="w-5 h-5" /> },
          { view: 'profile' as AppView, label: 'Profil', icon: <UserIcon className="w-5 h-5" /> },
        ].map((tab) => {
          const active = currentView === tab.view;
          return (
            <button
              key={tab.view}
              type="button"
              onClick={() => handleNav(tab.view)}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
                active ? 'text-[#1f108e] font-bold' : 'text-[#464553]'
              }`}
            >
              {tab.icon}
              <span className="text-[11px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
