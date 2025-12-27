import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { PanInfo, MotionValue } from 'framer-motion';

interface Props {
  tile: any;
  tileSize: number; // ここに追加
  isSelected?: boolean;
  groupColor?: { border: string; bg: string; text: string };
  dragX: MotionValue<number>;
  dragY: MotionValue<number>;
  isMoving: boolean;
  disabled?: boolean;
  onDragStart: () => void;
  onDrag: (info: PanInfo) => void;
  onDragEnd: (event: any, info: PanInfo) => void;
  onClick: () => void;
}

const DraggableTile: React.FC<Props> = ({ 
  tile, tileSize, isSelected, groupColor, dragX, dragY, isMoving, disabled, onDragStart, onDrag, onDragEnd, onClick 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      drag={!disabled}
      dragMomentum={false}
      dragElastic={0}
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
        width: tileSize,
        height: tileSize,
        position: 'fixed', 
        left: tile.x, 
        top: tile.y,
        x: isMoving ? dragX : 0,
        y: isMoving ? dragY : 0,
        backgroundColor: isSelected ? undefined : (groupColor?.bg || "white"),
        borderColor: isSelected ? undefined : (groupColor?.border || "#cbd5e1"),
        color: isSelected ? undefined : (groupColor?.text || "#1e293b"),
        borderWidth: groupColor ? "2px" : "1px",
        cursor: disabled ? "pointer" : (isDragging ? "grabbing" : "grab"),
        zIndex: isDragging ? 2000 : (isMoving ? 1500 : (isSelected ? 100 : 10))
      }}
      whileTap={{ scale: 1.05 }}
      animate={!isMoving ? { x: 0, y: 0 } : {}}
      transition={{ duration: 0.1 }}
      className={`flex items-center justify-center rounded font-bold touch-none select-none shadow shadow-slate-400/50 
        ${isSelected ? "ring-4 ring-blue-300 bg-blue-600 text-white" : ""}
      `}
    >
      <span style={{ fontSize: `${tileSize * 0.45}px` }}>{tile.char}</span>
    </motion.div>
  );
};

export default DraggableTile;