// src/components/Tray.tsx
import React from 'react';
import { TILE_SIZE, TRAY_GRID_ROWS } from '../constants';

const Tray: React.FC = () => {
  const screenH = window.innerHeight;
  const gridRows = Math.floor(screenH / TILE_SIZE);
  const trayTop = (gridRows - TRAY_GRID_ROWS) * TILE_SIZE;

  return (
    <div
      className="fixed bottom-0 w-full bg-slate-50 border-t border-slate-200 pointer-events-none"
      style={{ top: trayTop }}
    >
      <div className="px-4 py-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100">
        ひらがなトレイ
      </div>
    </div>
  );
};

export default Tray;
