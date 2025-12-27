import React from 'react';
import { TRAY_GRID_ROWS } from '../constants';

interface Props {
  tileSize: number;
  offsets: { trayLeftX: number; trayTopY: number };
}

const Tray: React.FC<Props> = ({ tileSize, offsets }) => {
  return (
    <div 
      className="fixed inset-x-0 bottom-0 bg-slate-50/50 border-t border-slate-200 pointer-events-none"
      style={{ top: offsets.trayTopY }}
    >
      {/* トレイ内のガイド線 */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: `${tileSize}px ${tileSize}px`,
          backgroundPosition: `${offsets.trayLeftX}px 0px`
        }}
      />
    </div>
  );
};

export default Tray;