import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useMotionValue, animate, motion } from 'framer-motion';
import { HIRAGANA, TILE_SIZE, HIRAGANA_GRID, TRAY_GRID_ROWS, GROUP_COLORS } from './constants';
import type { TileData } from './types';
import Menu from './components/Menu';
import Canvas from './components/Canvas';
import Tray from './components/Tray';
import DraggableTile from './components/DraggableTile';
import type { PanInfo } from 'framer-motion';

interface EnhancedTileData extends TileData {
  version: number;
}

const App: React.FC = () => {
  const [tiles, setTiles] = useState<EnhancedTileData[]>(
    HIRAGANA.map((char) => ({
      id: `tile-${char}`, char, x: 0, y: 0, isPlaced: false, initialized: false, version: 0,
    }))
  );

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const [movingIds, setMovingIds] = useState<string[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragInfo, setActiveDragInfo] = useState<{ snapDx: number; snapDy: number; isCollision: boolean } | null>(null);

  const updateHomePositions = useCallback(() => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const trayTopY = (Math.floor(screenH / TILE_SIZE) - TRAY_GRID_ROWS) * TILE_SIZE;
    const trayLeftX = Math.floor((screenW - 10 * TILE_SIZE) / 2 / TILE_SIZE) * TILE_SIZE;

    setTiles((prev) => prev.map((t) => {
      if (t.isPlaced) return t;
      let r = 0, c = 0;
      HIRAGANA_GRID.forEach((row, ri) => {
        const ci = row.indexOf(t.char);
        if (ci !== -1) { r = ri; c = ci; }
      });
      return { ...t, x: trayLeftX + c * TILE_SIZE, y: trayTopY + (r + 1) * TILE_SIZE, initialized: true };
    }));
  }, []);

  useEffect(() => {
    updateHomePositions();
    window.addEventListener('resize', updateHomePositions);
    return () => window.removeEventListener('resize', updateHomePositions);
  }, [updateHomePositions]);

  const checkCollision = (ids: string[], dx: number, dy: number, currentTiles: EnhancedTileData[]) => {
    for (const mid of ids) {
      const t = currentTiles.find(tile => tile.id === mid)!;
      const targetX = t.x + dx;
      const targetY = t.y + dy;
      if (targetY < TILE_SIZE) return true;
      const isOccupied = currentTiles.some(other => 
        !ids.includes(other.id) && other.initialized && other.x === targetX && other.y === targetY
      );
      if (isOccupied) return true;
    }
    return false;
  };

  const handleGroupAction = () => {
    if (selectedIds.size === 0) return;
    setTiles(prev => {
      const selectedTiles = prev.filter(t => selectedIds.has(t.id));
      const groupsInSelection = new Set(selectedTiles.map(t => t.groupId).filter(Boolean));
      if (groupsInSelection.size > 0) {
        return prev.map(t => groupsInSelection.has(t.groupId) ? { ...t, groupId: undefined, version: t.version + 1 } : t);
      } else {
        const newGroupId = `group-${Date.now()}`;
        return prev.map(t => selectedIds.has(t.id) ? { ...t, groupId: newGroupId, version: t.version + 1 } : t);
      }
    });
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleDragStart = (id: string) => {
    if (isSelectionMode) return;
    dragX.stop(); dragY.stop();
    dragX.set(0); dragY.set(0);
    const mainTile = tiles.find(t => t.id === id)!;
    const targets = mainTile.groupId ? tiles.filter(t => t.groupId === mainTile.groupId).map(t => t.id) : [id];
    setMovingIds(targets);
    setActiveDragId(id);
  };

  // L123: 未使用引数 id を _id に変更
  const handleDrag = useCallback((_id: string, info: PanInfo) => {
    if (isSelectionMode) return;
    dragX.set(info.offset.x);
    dragY.set(info.offset.y);
    const snapDx = Math.round(info.offset.x / TILE_SIZE) * TILE_SIZE;
    const snapDy = Math.round(info.offset.y / TILE_SIZE) * TILE_SIZE;
    setActiveDragInfo({ snapDx, snapDy, isCollision: checkCollision(movingIds, snapDx, snapDy, tiles) });
  }, [movingIds, tiles, dragX, dragY, isSelectionMode]);

  // L138: 未使用引数 id を _id に変更
  const handleDragEnd = (_id: string, info: PanInfo) => {
    if (isSelectionMode) return;
    const snapDx = Math.round(info.offset.x / TILE_SIZE) * TILE_SIZE;
    const snapDy = Math.round(info.offset.y / TILE_SIZE) * TILE_SIZE;
    const isCollision = checkCollision(movingIds, snapDx, snapDy, tiles);
    const targetX: number = isCollision ? 0 : snapDx;
    const targetY: number = isCollision ? 0 : snapDy;

    // 型定義のエラーを避けるため config に any を適用
    const config: any = { type: "spring", stiffness: 1000, damping: 50, mass: 0.2 };
    setActiveDragId(null);
    setActiveDragInfo(null);

    // L154-155: animate の呼び出し
    const animX = animate(dragX, targetX, config);
    const animY = animate(dragY, targetY, config);

    Promise.all([animX, animY]).then(() => {
      const screenH = window.innerHeight;
      const trayTopY = (Math.floor(screenH / TILE_SIZE) - TRAY_GRID_ROWS) * TILE_SIZE;
      setTiles(prev => prev.map(t => {
        if (movingIds.includes(t.id)) {
          const nx = t.x + targetX;
          const ny = t.y + targetY;
          return { ...t, x: nx, y: ny, isPlaced: ny < trayTopY, version: t.version + 1 };
        }
        return t;
      }));
      dragX.set(0); dragY.set(0);
      setMovingIds([]);
    });
  };

  const groupBoundaries = useMemo(() => {
    const groups: Record<string, { minX: number; minY: number; maxX: number; maxY: number; colorIndex: number }> = {};
    const existingGroups = Array.from(new Set(tiles.map(t => t.groupId).filter(Boolean)));
    existingGroups.forEach((gid, idx) => {
      const gTiles = tiles.filter(t => t.groupId === gid);
      groups[gid as string] = {
        minX: Math.min(...gTiles.map(t => t.x)),
        minY: Math.min(...gTiles.map(t => t.y)),
        maxX: Math.max(...gTiles.map(t => t.x + TILE_SIZE)),
        maxY: Math.max(...gTiles.map(t => t.y + TILE_SIZE)),
        colorIndex: idx % GROUP_COLORS.length
      };
    });
    return groups;
  }, [tiles]);

  return (
    <div className="fixed inset-0 bg-white overflow-hidden touch-none">
      <div className="relative z-[100]">
        <Menu 
          onReset={() => setTiles(p => p.map(t => ({...t, isPlaced: false, groupId: undefined})))} 
          onSave={() => alert("保存しました")} 
          isSelectionMode={isSelectionMode} 
          onToggleSelectionMode={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }} 
          selectedCount={selectedIds.size} 
          onGroupAction={handleGroupAction}
          hasGroupInSelection={Array.from(selectedIds).some(id => tiles.find(t => t.id === id)?.groupId)} 
        />
      </div>
      <Canvas /><Tray />

      <div className="fixed inset-0 pointer-events-none z-50">
        {Object.entries(groupBoundaries).map(([gid, b]) => {
          const isMoving = movingIds.some(id => tiles.find(t => t.id === id)?.groupId === gid);
          const color = GROUP_COLORS[b.colorIndex];
          return (
            <motion.div key={`boundary-${gid}`} className="absolute border-2 rounded-lg pointer-events-none"
              style={{ left: b.minX-4, top: b.minY-4, width: b.maxX-b.minX+8, height: b.maxY-b.minY+8, borderColor: color.border, backgroundColor: `${color.bg}20`, x: isMoving ? dragX : 0, y: isMoving ? dragY : 0 }}
            />
          );
        })}

        {activeDragId && activeDragInfo && (
          <div className="absolute pointer-events-none">
            {movingIds.map(mid => {
              const t = tiles.find(tile => tile.id === mid)!;
              return (
                <div key={`ghost-${mid}`} className={`absolute border-2 border-dashed rounded ${activeDragInfo.isCollision ? 'bg-red-200/40 border-red-400' : 'bg-slate-200/50 border-slate-300'}`}
                  style={{ width: TILE_SIZE, height: TILE_SIZE, left: t.x + activeDragInfo.snapDx, top: t.y + activeDragInfo.snapDy }} 
                />
              );
            })}
          </div>
        )}

        {tiles.map((tile) => (
          <div key={tile.id} className="pointer-events-auto" style={{ opacity: tile.initialized ? 1 : 0 }}>
            <DraggableTile 
              tile={tile}
              isSelected={selectedIds.has(tile.id)}
              groupColor={tile.groupId ? GROUP_COLORS[groupBoundaries[tile.groupId]?.colorIndex] : undefined}
              dragX={dragX} dragY={dragY}
              isMoving={movingIds.includes(tile.id)}
              onDragStart={() => handleDragStart(tile.id)}
              onDrag={(info) => handleDrag(tile.id, info)}
              onDragEnd={(_, info) => handleDragEnd(tile.id, info)}
              onClick={() => {
                if (!isSelectionMode) return;
                setSelectedIds(prev => {
                  const next = new Set(prev);
                  if (next.has(tile.id)) next.delete(tile.id); else next.add(tile.id);
                  return next;
                });
              }}
              disabled={isSelectionMode}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;