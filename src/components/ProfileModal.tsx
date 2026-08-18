import React, { useState } from 'react';
import { X, User, Copy, Check, ShieldCheck, Sparkles, Coins, Zap } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { translations } from '../utils/translations';
import { sounds } from '../utils/audio';

interface ProfileModalProps {
  isOpen?: boolean;
  onClose: () => void;
  user: UserProfile;
  lang: Language;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen = true,
  onClose,
  user,
  lang,
  onUpdateProfile
}) => {
  const [username, setUsername] = useState(user.username);
  const [robloxUsername, setRobloxUsername] = useState(user.robloxUsername || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [copiedId, setCopiedId] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const t = translations[lang];

  if (isOpen === false) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    sounds.playClick();
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      username: username.trim() || user.username,
      robloxUsername: robloxUsername.trim(),
      avatar: selectedAvatar
    });
    sounds.playSuccess();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-zinc-950">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{t.profile}</h3>
              <p className="text-[11px] text-zinc-500 uppercase tracking-widest">{t.userSettings}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* User ID Badge Card */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-0.5">
                {t.userIdLabel}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-black text-white tracking-wider">
                  {user.id}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {t.activeTag}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyId}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400">{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.copyId}</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Balance Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">{t.availableRobux}</span>
              <div className="text-xl font-mono font-black text-white mt-0.5">
                {user.robuxBalance.toFixed(1)} RBX
              </div>
            </div>
            <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">{t.clicksToday}</span>
              <div className="text-xl font-mono font-black text-zinc-300 mt-0.5">
                {user.clicksToday} ta
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            
            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                {t.selectAvatar}
              </label>
              <div className="flex items-center gap-3">
                {AVATAR_OPTIONS.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setSelectedAvatar(imgUrl); sounds.playClick(); }}
                    className={`relative rounded-xl overflow-hidden border-2 transition ${
                      selectedAvatar === imgUrl
                        ? 'border-white scale-105 shadow-md shadow-white/20'
                        : 'border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="Avatar" className="w-12 h-12 object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                {t.usernameLabel}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white transition"
              />
            </div>

            {/* Roblox Username */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                {t.robloxUsernameLabel}
              </label>
              <input
                type="text"
                value={robloxUsername}
                onChange={(e) => setRobloxUsername(e.target.value)}
                placeholder="Roblox nik (masalan: ProGamer_99)"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white transition"
              />
            </div>

            {saveSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400 font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{t.profileSavedSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-sm shadow-xl active:scale-98 transition"
            >
              {t.saveProfileBtn}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
