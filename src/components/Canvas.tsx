import React from 'react';

interface Props {
  tileSize: number;
}

const Canvas: React.FC<Props> = ({ tileSize }) => {
  const trayLeftX = Math.floor((window.innerWidth - 10 * tileSize) / 2);

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #f1f5f9 1px, transparent 1px),
            linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)
          `,
          backgroundSize: `${tileSize}px ${tileSize}px`,
          backgroundPosition: `${trayLeftX}px 0px`, // トレイのX位置に合わせる
        }}
      />
    </div>
  );
};

export default Canvas;