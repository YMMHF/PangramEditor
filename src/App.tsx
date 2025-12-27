import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useMotionValue, animate, motion } from 'framer-motion';
import { HIRAGANA, HIRAGANA_GRID, TRAY_GRID_ROWS, GROUP_COLORS } from './constants';
import type { TileData } from './types';
import Menu from './components/Menu';
import Canvas from './components/Canvas';
import Tray from './components/Tray';
import DraggableTile from './components/DraggableTile';
import type { PanInfo } from 'framer-motion';

interface EnhancedTileData extends TileData {
  version: number;
}

interface SavedLayout {
  id: string;
  name: string;
  tiles: EnhancedTileData[];
  timestamp: number;
}

const LIST_STORAGE_KEY = 'pangram_layouts_v1';

const App: React.FC = () => {
  const [tileSize, setTileSize] = useState(50);
  const [tiles, setTiles] = useState<EnhancedTileData[]>(
    HIRAGANA.map((char) => ({
      id: `tile-${char}`, char, x: 0, y: 0, isPlaced: false, initialized: false, version: 0,
    }))
  );

  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [movingIds, setMovingIds] = useState<string[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragInfo, setActiveDragInfo] = useState<{ snapDx: number; snapDy: number; isCollision: boolean } | null>(null);

  // レイアウト計算（Androidはみ出し対策）
  const updateLayout = useCallback(() => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const newTileSize = Math.min(60, Math.floor(screenW / 11));
    setTileSize(newTileSize);

    const trayTopY = (Math.floor(screenH / newTileSize) - TRAY_GRID_ROWS) * newTileSize;
    const trayLeftX = Math.floor((screenW - 10 * newTileSize) / 2 / newTileSize) * newTileSize;

    setTiles((prev) => prev.map((t) => {
      if (t.isPlaced) return t;
      let r = 0, c = 0;
      HIRAGANA_GRID.forEach((row, ri) => {
        const ci = row.indexOf(t.char);
        if (ci !== -1) { r = ri; c = ci; }
      });
      return { ...t, x: trayLeftX + c * newTileSize, y: trayTopY + (r + 1) * newTileSize, initialized: true };
    }));
  }, []);

  useEffect(() => {
    updateLayout();
    const saved = localStorage.getItem(LIST_STORAGE_KEY);
    if (saved) setSavedLayouts(JSON.parse(saved));
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  // --- 保存・読込 ---
  const saveNew = () => {
    const name = prompt("保存名を入力", `作品 ${savedLayouts.length + 1}`);
    if (!name) return;
    const newLayout = { id: `id-${Date.now()}`, name, tiles, timestamp: Date.now() };
    const newList = [...savedLayouts, newLayout];
    setSavedLayouts(newList);
    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(newList));
    setCurrentLayoutId(newLayout.id);
  };

  const overwrite = () => {
    if (!currentLayoutId) return saveNew();
    const newList = savedLayouts.map(l => l.id === currentLayoutId ? { ...l, tiles, timestamp: Date.now() } : l);
    setSavedLayouts(newList);
    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(newList));
    alert("保存しました");
  };

  const loadLayout = (id: string) => {
    const target = savedLayouts.find(l => l.id === id);
    if (target) { setTiles(target.tiles); setCurrentLayoutId(target.id); setIsSelectionMode(false); }
  };

  const deleteLayout = (id: string) => {
    if (!confirm("削除しますか？")) return;
    const newList = savedLayouts.filter(l => l.id !== id);
    setSavedLayouts(newList);
    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(newList));
  };

  // --- ドラッグ ---
  const checkCollision = (ids: string[], dx: number, dy: number, currentTiles: EnhancedTileData[]) => {
    for (const mid of ids) {
      const t = currentTiles.find(tile => tile.id === mid)!;
      const targetX = t.x + dx;
      const targetY = t.y + dy;
      if (targetY < tileSize) return true;
      const isOccupied = currentTiles.some(other => !ids.includes(other.id) && other.initialized && other.x === targetX && other.y === targetY);
      if (isOccupied) return true;
    }
    return false;
  };

  const handleDragStart = (id: string) => {
    if (isSelectionMode) return;
    dragX.stop(); dragY.stop(); dragX.set(0); dragY.set(0);
    const mainTile = tiles.find(t => t.id === id)!;
    const targets = mainTile.groupId ? tiles.filter(t => t.groupId === mainTile.groupId).map(t => t.id) : [id];
    setMovingIds(targets);
    setActiveDragId(id);
  };

  const handleDrag = useCallback((_id: string, info: PanInfo) => {
    if (isSelectionMode) return;
    dragX.set(info.offset.x);
    dragY.set(info.offset.y);
    const snapDx = Math.round(info.offset.x / tileSize) * tileSize;
    const snapDy = Math.round(info.offset.y / tileSize) * tileSize;
    setActiveDragInfo({ snapDx, snapDy, isCollision: checkCollision(movingIds, snapDx, snapDy, tiles) });
  }, [movingIds, tiles, dragX, dragY, isSelectionMode, tileSize]);

  const handleDragEnd = (_id: string, info: PanInfo) => {
    if (isSelectionMode) return;
    const snapDx = Math.round(info.offset.x / tileSize) * tileSize;
    const snapDy = Math.round(info.offset.y / tileSize) * tileSize;
    const isCollision = checkCollision(movingIds, snapDx, snapDy, tiles);
    const targetX: number = isCollision ? 0 : snapDx;
    const targetY: number = isCollision ? 0 : snapDy;
    const config: any = { type: "spring", stiffness: 1000, damping: 50, mass: 0.2 };
    setActiveDragId(null); setActiveDragInfo(null);

    Promise.all([animate(dragX, targetX, config), animate(dragY, targetY, config)]).then(() => {
      const screenH = window.innerHeight;
      const trayTopY = (Math.floor(screenH / tileSize) - TRAY_GRID_ROWS) * tileSize;
      setTiles(prev => prev.map(t => {
        if (movingIds.includes(t.id)) {
          const nx = t.x + targetX;
          const ny = t.y + targetY;
          return { ...t, x: nx, y: ny, isPlaced: ny < trayTopY, version: t.version + 1 };
        }
        return t;
      }));
      dragX.set(0); dragY.set(0); setMovingIds([]);
    });
  };

  const groupBoundaries = useMemo(() => {
    const groups: Record<string, { minX: number; minY: number; maxX: number; maxY: number; colorIndex: number }> = {};
    const existing = Array.from(new Set(tiles.map(t => t.groupId).filter(Boolean)));
    existing.forEach((gid, idx) => {
      const gTiles = tiles.filter(t => t.groupId === gid);
      groups[gid as string] = {
        minX: Math.min(...gTiles.map(t => t.x)), minY: Math.min(...gTiles.map(t => t.y)),
        maxX: Math.max(...gTiles.map(t => t.x + tileSize)), maxY: Math.max(...gTiles.map(t => t.y + tileSize)),
        colorIndex: idx % GROUP_COLORS.length
      };
    });
    return groups;
  }, [tiles, tileSize]);

  return (
    <div className="fixed inset-0 bg-white overflow-hidden touch-none">
      <div className="relative z-[100]">
        <Menu 
          onReset={() => confirm("リセット？") && updateLayout()} 
          onSaveNew={saveNew} onOverwrite={overwrite}
          currentLayoutName={savedLayouts.find(l => l.id === currentLayoutId)?.name}
          savedLayouts={savedLayouts} onLoadLayout={loadLayout} onDeleteLayout={deleteLayout}
          isSelectionMode={isSelectionMode} 
          onToggleSelectionMode={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }} 
          selectedCount={selectedIds.size} 
          onGroupAction={() => {
            const selected = tiles.filter(t => selectedIds.has(t.id));
            const hasG = new Set(selected.map(t => t.groupId).filter(Boolean));
            setTiles(prev => hasG.size > 0 
              ? prev.map(t => hasG.has(t.groupId) ? { ...t, groupId: undefined, version: t.version + 1 } : t)
              : prev.map(t => selectedIds.has(t.id) ? { ...t, groupId: `g-${Date.now()}`, version: t.version + 1 } : t)
            );
            setSelectedIds(new Set()); setIsSelectionMode(false);
          }}
          hasGroupInSelection={Array.from(selectedIds).some(id => tiles.find(t => t.id === id)?.groupId)} 
        />
      </div>
      <Canvas /><Tray />
      <div className="fixed inset-0 pointer-events-none z-50">
        {Object.entries(groupBoundaries).map(([gid, b]) => {
          const isMoving = movingIds.some(id => tiles.find(t => t.id === id)?.groupId === gid);
          return (
            <motion.div key={`b-${gid}`} className="absolute border-2 rounded-lg"
              style={{ left: b.minX-4, top: b.minY-4, width: b.maxX-b.minX+8, height: b.maxY-b.minY+8, borderColor: GROUP_COLORS[b.colorIndex].border, backgroundColor: `${GROUP_COLORS[b.colorIndex].bg}20`, x: isMoving ? dragX : 0, y: isMoving ? dragY : 0 }}
            />
          );
        })}
        {activeDragId && activeDragInfo && (
          <div className="absolute">
            {movingIds.map(mid => {
              const t = tiles.find(tile => tile.id === mid)!;
              return <div key={`g-${mid}`} className={`absolute border-2 border-dashed rounded ${activeDragInfo.isCollision ? 'bg-red-200/40 border-red-400' : 'bg-slate-200/50 border-slate-300'}`} style={{ width: tileSize, height: tileSize, left: t.x + activeDragInfo.snapDx, top: t.y + activeDragInfo.snapDy }} />;
            })}
          </div>
        )}
        {tiles.map((tile) => (
          <DraggableTile 
            key={tile.id} tile={tile} tileSize={tileSize}
            isSelected={selectedIds.has(tile.id)}
            groupColor={tile.groupId ? GROUP_COLORS[groupBoundaries[tile.groupId]?.colorIndex] : undefined}
            dragX={dragX} dragY={dragY} isMoving={movingIds.includes(tile.id)}
            onDragStart={() => handleDragStart(tile.id)}
            onDrag={(info) => handleDrag(tile.id, info)}
            onDragEnd={(_, info) => handleDragEnd(tile.id, info)}
            onClick={() => isSelectionMode && setSelectedIds(prev => { const n = new Set(prev); if(n.has(tile.id)) n.delete(tile.id); else n.add(tile.id); return n; })}
            disabled={isSelectionMode}
          />
        ))}
      </div>
    </div>
  );
};

export default App;