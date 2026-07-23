import { LogOut } from 'lucide-react';
import type { UserResponse } from '../types';

interface Props {
  user: UserResponse;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: Props) {
  const initial = (user.full_name || user.email).charAt(0).toUpperCase();

  return (
    <header className="border-b border-white/[0.06] bg-surface/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-accent-light font-bold text-xs">GQ</span>
          </div>
          <div>
            <span className="text-sm font-semibold text-white">GoFound <span className="font-normal text-gray-400">Quant Platform</span></span>
            <span className="hidden sm:inline text-[11px] text-gray-600 ml-2">We don't predict markets. We discover opportunities.</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04]">
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-accent-light font-bold text-[10px]">{initial}</span>
            </div>
            <span className="text-xs text-gray-300">{user.email}</span>
          </div>
          <button
            onClick={onLogout}
            className="btn-ghost p-2"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
