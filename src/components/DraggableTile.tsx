import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { PanInfo, MotionValue } from 'framer-motion';
import { TILE_SIZE } from '../constants';

interface Props {
  tile: any;
  isSelected?: boolean;
  groupColor?: { border: string; bg: string; text: string };
  dragX: MotionValue<number>; // Appから渡される共通のMotionValue
  dragY: MotionValue<number>;
  isMoving: boolean; // 移動中（リーダーまたはフォロワー）か
  disabled?: boolean;
  onDragStart: () => void;
  onDrag: (info: PanInfo) => void;
  onDragEnd: (event: any, info: PanInfo) => void;
  onClick: () => void;
}

const DraggableTile: React.FC<Props> = ({
  tile,
  isSelected,
  groupColor,
  dragX,
  dragY,
  isMoving,
  disabled,
  onDragStart,
  onDrag,
  onDragEnd,
  onClick,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      drag={!disabled}
      dragMomentum={false}
      dragElastic={0}
      // 【修正】ここから dragX={dragX} などを削除しました
      onDragStart={() => {
        setIsDragging(true);
        onDragStart();
      }}
      onDrag={(_, info) => onDrag(info)}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        onDragEnd(e, info);
      }}
      onTap={onClick}
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        position: 'fixed',
        left: tile.x,
        top: tile.y,
        // 【正しい実装】MotionValueは style の中に書くことで
        // 1. リーダーはドラッグ中にこの値を更新し
        // 2. フォロワーはこの値を参照して同じ分だけ動く
        // という同期が自動的に行われます。
        x: isMoving ? dragX : 0,
        y: isMoving ? dragY : 0,
        backgroundColor: isSelected ? undefined : groupColor?.bg || 'white',
        borderColor: isSelected ? undefined : groupColor?.border || '#cbd5e1',
        color: isSelected ? undefined : groupColor?.text || '#1e293b',
        borderWidth: groupColor ? '2px' : '1px',
        cursor: disabled ? 'pointer' : isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 2000 : isMoving ? 1500 : isSelected ? 100 : 10,
      }}
      whileTap={{ scale: 1.05 }}
      // 吸着が終わった時に確実に中央に戻るための設定
      animate={!isMoving ? { x: 0, y: 0 } : {}}
      transition={{ duration: 0.1 }}
      className={`flex items-center justify-center rounded font-bold text-lg touch-none select-none shadow shadow-slate-400/50 
        ${isSelected ? 'ring-4 ring-blue-300 bg-blue-600 text-white' : ''}
      `}
    >
      {tile.char}
    </motion.div>
  );
};

export default DraggableTile;
