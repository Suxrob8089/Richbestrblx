import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Bell, 
  Clock, 
  ArrowDownToLine, 
  Globe,
  Youtube,
  Send,
  Menu,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import { translations } from '../utils/translations';
import { sounds } from '../utils/audio';

interface NavbarProps {
  user: UserProfile;
  lang: Language;
  onSetLang: (lang: Language) => void;
  unreadNotifsCount: number;
  activeWithdrawalsCount: number;
  onOpenProfile: () => void;
  onOpenWithdraw: () => void;
  onOpenHistory: () => void;
  onOpenNotifications: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  lang,
  onSetLang,
  unreadNotifsCount,
  activeWithdrawalsCount,
  onOpenProfile,
  onOpenWithdraw,
  onOpenHistory,
  onOpenNotifications,
  onOpenAdmin
}) => {
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const t = translations[lang];

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
    if (next) sounds.playClick();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 text-zinc-100 shadow-xl">
      
      {/* Top Primary Bar */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        
        {/* Left: App Brand & User ID */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div 
            id="brand-logo"
            className="flex items-center gap-2 cursor-pointer group select-none"
            onClick={onOpenProfile}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white text-zinc-950 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform font-black text-lg">
              R
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                  RBX<span className="text-zinc-400 font-light">CLICKER</span>
                </h1>
                <span className="text-[8px] sm:text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  PRO
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono flex items-center gap-1 leading-none mt-0.5">
                <span className="text-zinc-500 uppercase font-bold">ID:</span>
                <span className="text-white font-bold tracking-wider">{user.id}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Center-Right: Core Action Buttons (PROFIL + TARIX + YECHISH) on larger screens */}
        <div className="hidden md:flex items-center gap-2">
          {/* Profile button */}
          <button
            id="btn-nav-profile-desktop"
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-bold transition active:scale-95 cursor-pointer touch-manipulation"
          >
            <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t.profile}</span>
          </button>

          {/* Tarix / 7-Day History button */}
          <button
            id="btn-nav-history-desktop"
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-bold transition active:scale-95 relative cursor-pointer touch-manipulation"
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t.historyBtn || 'Tarix (7 Kun)'}</span>
            {activeWithdrawalsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-zinc-950 font-black text-[10px] rounded-full">
                {activeWithdrawalsCount}
              </span>
            )}
          </button>

          {/* Notifications button */}
          <button
            id="btn-nav-notifs-desktop"
            type="button"
            onClick={onOpenNotifications}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-bold transition active:scale-95 relative cursor-pointer touch-manipulation"
          >
            <Bell className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t.notifications}</span>
            {unreadNotifsCount > 0 && (
              <span className="w-4 h-4 bg-white text-zinc-950 font-black text-[9px] rounded-full flex items-center justify-center">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>

        {/* Center/Right: Quick Balance Pill & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Robux Balance Pill (Click to Withdraw) */}
          <div 
            id="nav-robux-balance"
            role="button"
            tabIndex={0}
            onClick={onOpenWithdraw}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 shadow-sm cursor-pointer transition active:scale-95 touch-manipulation select-none"
            title={`${t.availableRobux}: ${user.robuxBalance.toFixed(1)} RBX`}
          >
            <div className="w-5 h-5 rounded-md bg-white text-zinc-950 font-black text-[10px] sm:text-[11px] flex items-center justify-center shadow-sm">
              R$
            </div>
            <div className="text-right">
              <div className="font-mono font-black text-xs sm:text-sm text-white leading-none">
                {user.robuxBalance.toFixed(1)}
              </div>
              <div className="text-[8px] sm:text-[9px] text-zinc-400 uppercase font-medium leading-tight">
                RBX
              </div>
            </div>
          </div>

          {/* Withdraw CTA Button */}
          <button
            id="btn-nav-withdraw-top"
            type="button"
            onClick={onOpenWithdraw}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer touch-manipulation select-none"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t.withdraw}</span>
          </button>

          {/* YouTube Link */}
          <a
            id="btn-nav-youtube"
            href="https://youtube.com/@richbestrbx?si=LicXoj_ECGS-3lhD"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-900 hover:bg-red-950/40 text-red-500 border border-zinc-800 hover:border-red-500/40 transition flex items-center justify-center shadow-sm"
            title="YouTube: @richbestrbx"
          >
            <Youtube className="w-4 h-4" />
          </a>

          {/* Telegram Link */}
          <a
            id="btn-nav-telegram"
            href="https://t.me/whymee33"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-900 hover:bg-sky-950/40 text-sky-400 border border-zinc-800 hover:border-sky-500/40 transition flex items-center justify-center shadow-sm"
            title="Telegram: @whymee33"
          >
            <Send className="w-4 h-4" />
          </a>

          {/* Language Switcher */}
          <div className="relative">
            <button
              id="btn-nav-lang"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="px-2 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center gap-1 text-[11px] font-bold uppercase transition"
              title="Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 animate-fadeIn">
                <button
                  onClick={() => { onSetLang('uz'); setLangMenuOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-800 ${lang === 'uz' ? 'text-white font-bold' : 'text-zinc-400'}`}
                >
                  <span>🇺🇿 O'zbek</span>
                  {lang === 'uz' && '✓'}
                </button>
                <button
                  onClick={() => { onSetLang('ru'); setLangMenuOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-800 ${lang === 'ru' ? 'text-white font-bold' : 'text-zinc-400'}`}
                >
                  <span>🇷🇺 Русский</span>
                  {lang === 'ru' && '✓'}
                </button>
                <button
                  onClick={() => { onSetLang('en'); setLangMenuOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-800 ${lang === 'en' ? 'text-white font-bold' : 'text-zinc-400'}`}
                >
                  <span>🇬🇧 English</span>
                  {lang === 'en' && '✓'}
                </button>
              </div>
            )}
          </div>

          {/* Discreet Menu / Control Button */}
          <button
            id="btn-nav-menu"
            onClick={onOpenAdmin}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition flex items-center justify-center"
            title="Menu"
          >
            <Menu className="w-4 h-4 stroke-[2.5]" />
          </button>

        </div>
      </div>

      {/* Sub-Navigation Bar: PROFIL + TARIX (7 KUN) + YECHISH + XABARLAR + OVOZ */}
      <div className="bg-zinc-900/70 border-t border-zinc-850 px-3 sm:px-6 py-2 flex items-center justify-between text-xs max-w-6xl mx-auto overflow-x-auto scrollbar-none gap-2">
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Profile Button */}
          <button
            id="btn-subnav-profile"
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white font-bold text-xs transition active:scale-95 shrink-0 cursor-pointer touch-manipulation"
          >
            <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t.profile}</span>
          </button>

          {/* 7-Day History Button */}
          <button
            id="btn-subnav-history"
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white font-bold text-xs transition active:scale-95 shrink-0 cursor-pointer touch-manipulation"
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t.historyBtn || 'Tarix (7 Kun)'}</span>
            {activeWithdrawalsCount > 0 && (
              <span className="w-4 h-4 bg-white text-zinc-950 font-black text-[9px] rounded-full flex items-center justify-center ml-0.5">
                {activeWithdrawalsCount}
              </span>
            )}
          </button>

          {/* Withdraw Button */}
          <button
            id="btn-subnav-withdraw"
            type="button"
            onClick={onOpenWithdraw}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs transition active:scale-95 shadow-sm shrink-0 cursor-pointer touch-manipulation"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t.withdraw}</span>
          </button>

          {/* Notifications Button */}
          <button
            id="btn-subnav-notifications"
            type="button"
            onClick={onOpenNotifications}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white font-bold text-xs transition active:scale-95 shrink-0 cursor-pointer touch-manipulation"
          >
            <Bell className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t.notifications}</span>
            {unreadNotifsCount > 0 && (
              <span className="w-4 h-4 bg-white text-zinc-950 font-black text-[9px] rounded-full flex items-center justify-center ml-0.5">
                {unreadNotifsCount}
              </span>
            )}
          </button>

        </div>

        {/* Sound Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition flex items-center gap-1 text-[11px] font-mono"
            title={soundEnabled ? t.soundOn : t.soundOff}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-600" />}
          </button>
        </div>
      </div>

    </header>
  );
};
