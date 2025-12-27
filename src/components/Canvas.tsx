// src/components/Canvas.tsx
import React from 'react';
import { TILE_SIZE } from '../constants';

const Canvas: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(to right, #f1f5f9 1px, transparent 1px),
            linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)
          `,
          backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
          backgroundPosition: '0 0',
        }}
      />
    </div>
  );
};

export default Canvas;
