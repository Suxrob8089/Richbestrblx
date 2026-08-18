import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  TrendingUp, 
  Sparkles, 
  ArrowDownToLine, 
  Zap,
  Youtube,
  Send,
  ShieldCheck,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, AdminConfig, Language } from '../types';
import { translations } from '../utils/translations';
import { sounds } from '../utils/audio';

interface ClickerAreaProps {
  user: UserProfile;
  adminConfig: AdminConfig;
  lang: Language;
  onTap: (x?: number, y?: number) => void;
  onOpenWithdraw: () => void;
  onOpenAdmin?: () => void;
}

interface FloatingItem {
  id: number;
  x: number;
  y: number;
  text: string;
}

export const ClickerArea: React.FC<ClickerAreaProps> = ({
  user,
  adminConfig,
  lang,
  onTap,
  onOpenWithdraw,
  onOpenAdmin
}) => {
  const [floatingTexts, setFloatingTexts] = useState<FloatingItem[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const [combo, setCombo] = useState(0);
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapTimeRef = useRef<number>(0);

  const t = translations[lang];
  const maxCap = adminConfig.maxBalanceCap || 10000;
  const isCapped = user.robuxBalance >= maxCap;
  const isOutOfEnergy = user.energy <= 0;

  // Real-time Energy refill countdown (500 clicks / 3 hours)
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      if (user.energy >= user.maxEnergy) {
        setTimeLeftStr('');
        return;
      }
      const diff = Math.max(0, user.nextFullRefillTimestamp - now);
      if (diff <= 0) {
        setTimeLeftStr('00:00');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setTimeLeftStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [user.energy, user.maxEnergy, user.nextFullRefillTimestamp]);

  // Lag-free touch/click handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isOutOfEnergy || isCapped) {
      if (isOutOfEnergy) sounds.playClick(0.5);
      return;
    }

    const now = performance.now();
    lastTapTimeRef.current = now;

    setIsPressed(true);
    sounds.playClick(1.0 + Math.min(0.4, combo * 0.02));

    // Get touch coordinates
    const rect = containerRef.current?.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const x = rect ? clientX - rect.left : 140;
    const y = rect ? clientY - rect.top : 140;

    // Add lightweight floating text
    const newId = now + Math.random();
    const newFloat: FloatingItem = {
      id: newId,
      x: Math.max(20, Math.min((rect?.width || 280) - 40, x + (Math.random() * 24 - 12))),
      y: Math.max(20, Math.min((rect?.height || 280) - 20, y + (Math.random() * 16 - 8))),
      text: `+${(adminConfig.robuxPerClick || 0.5).toFixed(1)} R$`
    };

    setFloatingTexts(prev => {
      const slice = prev.length > 8 ? prev.slice(-7) : prev;
      return [...slice, newFloat];
    });

    // Auto cleanup floating text after animation finishes
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(f => f.id !== newId));
    }, 650);

    // Combo streak tracking
    setCombo(prev => {
      const next = prev + 1;
      if (next % 50 === 0) {
        sounds.playCoin();
        confetti({
          particleCount: 30,
          spread: 60,
          colors: ['#ffffff', '#e4e4e7', '#a1a1aa'],
          origin: {
            x: clientX / window.innerWidth,
            y: clientY / window.innerHeight
          }
        });
      }
      return next;
    });

    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => {
      setCombo(0);
    }, 1200);

    // Trigger instant tap callback
    onTap(clientX, clientY);
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  const energyPercent = Math.min(100, Math.max(0, (user.energy / user.maxEnergy) * 100));

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 select-none touch-optimized">
      
      {/* Broadcast Message Banner */}
      {adminConfig.broadcastMessage && (
        <div className="w-full max-w-lg mb-4 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3 text-xs text-zinc-300 shadow-md">
          <Sparkles className="w-4 h-4 text-white shrink-0" />
          <p className="truncate font-medium">{adminConfig.broadcastMessage}</p>
        </div>
      )}

      {/* Main Robux Balance & Stat Card (Pure White Theme) */}
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden mb-5">
        
        {/* Top energy track */}
        <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
          <div className="h-full bg-white transition-all duration-300" style={{ width: `${energyPercent}%` }}></div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t.availableRobux}</h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 font-mono border border-zinc-800">
              Max: {maxCap.toLocaleString()} R$
            </span>
          </div>
          {combo > 5 && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-zinc-950 font-black text-xs shadow-md animate-pulse">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{combo}x STREAK</span>
            </div>
          )}
        </div>

        {/* Large Balance Display */}
        <div className="flex items-baseline gap-2 mb-4">
          <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white">
            {user.robuxBalance.toFixed(1)}
          </div>
          <div className="text-sm sm:text-base font-bold text-zinc-400 uppercase font-mono">
            ROBUX (R$)
          </div>
        </div>

        {/* Frozen Balance / Razmorozka indicator if any */}
        {user.frozenRobux > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-300" />
              <span className="text-zinc-400">{t.frozenRobux}:</span>
            </div>
            <span className="font-mono font-bold text-white text-sm">
              {user.frozenRobux.toFixed(1)} RBX
            </span>
          </div>
        )}

        {/* Energy Progress Meter */}
        <div className="space-y-1.5 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-zinc-200">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
              <span>{t.energy}</span>
            </div>
            <div className="font-mono text-xs">
              <span className="font-bold text-white">{user.energy}</span>
              <span className="text-zinc-500"> / {user.maxEnergy} {t.clicksLeft}</span>
            </div>
          </div>

          <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-200 ${
                energyPercent > 20 ? 'bg-white' : 'bg-red-500'
              }`}
              style={{ width: `${energyPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5 font-mono">
            <span>{t.rechargeCycle}</span>
            {timeLeftStr && (
              <span className="text-white font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                {timeLeftStr}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Tap Coin with Zero-Lag Touch Performance */}
      <div 
        ref={containerRef}
        id="clicker-button-area"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full cursor-pointer select-none transition-transform duration-75 flex items-center justify-center touch-optimized ${
          isPressed ? 'scale-95' : 'scale-100 hover:scale-[1.02]'
        } ${isOutOfEnergy ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
      >
        {/* Glowing Ambient Halo */}
        <div className="absolute inset-0 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        {/* Outer Metallic Ring */}
        <div className="w-full h-full rounded-full p-3 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 border border-zinc-600/50 shadow-2xl flex items-center justify-center">
          
          {/* Inner Coin Disk */}
          <div className="w-full h-full rounded-full bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-zinc-700/80 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            
            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-full" />
            
            {/* Central Robux Icon */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-black text-4xl sm:text-5xl shadow-xl border-2 border-zinc-200">
              R$
            </div>

            {/* Click Reward Label */}
            <div className="mt-2 text-center">
              <span className="text-xs font-black tracking-widest text-white block uppercase">
                {isOutOfEnergy ? t.outOfEnergy : isCapped ? t.maxBalanceReached : t.tapHere}
              </span>
              <span className="text-[11px] font-mono text-zinc-400 font-bold">
                +{(adminConfig.robuxPerClick || 0.5).toFixed(1)} RBX / TAP
              </span>
            </div>
          </div>
        </div>

        {/* Hardware-Accelerated Floating Numbers */}
        {floatingTexts.map(item => (
          <div
            key={item.id}
            className="absolute font-mono font-black text-base sm:text-lg text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-floatUp pointer-events-none"
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`
            }}
          >
            {item.text}
          </div>
        ))}
      </div>

      {/* Quick Action Button & Details */}
      <div className="w-full max-w-lg mt-6 space-y-3">
        <button
          id="btn-main-withdraw"
          type="button"
          onClick={onOpenWithdraw}
          className="w-full py-4 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-sm shadow-xl active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none"
        >
          <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
          <span>{t.withdrawRbxBtn}</span>
        </button>

        {/* Official Channels & Community Section (YouTube & Telegram) */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-white" />
              {t.socialCommunity}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Rasmiy Linklar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* YouTube Link Card */}
            <a
              href="https://youtube.com/@richbestrbx?si=LicXoj_ECGS-3lhD"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-500/50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600/10 text-red-500 flex items-center justify-center border border-red-600/20">
                  <Youtube className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white group-hover:text-red-400 transition">
                    @richbestrbx
                  </div>
                  <div className="text-[10px] text-zinc-500">YouTube Channel</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition" />
            </a>

            {/* Telegram Link Card */}
            <a
              href="https://t.me/whymee33"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-sky-500/50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white group-hover:text-sky-400 transition">
                    @whymee33
                  </div>
                  <div className="text-[10px] text-zinc-500">Telegram Channel</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
