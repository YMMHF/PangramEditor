import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useMotionValue, animate, motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, 
  Save, 
  FolderOpen, 
  Trash2, 
  MousePointer2, 
  CheckSquare, 
  Group, 
  Ungroup, 
  Plus,
  Download,
  Upload
} from 'lucide-react';
import type { PanInfo, MotionValue } from 'framer-motion';

// --- CONSTANTS ---
const HIRAGANA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん".split("");
const HIRAGANA_GRID = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も"],
  ["や", "", "ゆ", "", "よ"],
  ["ら", "り", "る", "れ", "ろ"],
  ["わ", "", "を", "", "ん"]
];
// Transpose to 10 columns x 5 rows
const TRANSPOSED_GRID: string[][] = Array.from({ length: 5 }, (_, r) => 
  Array.from({ length: 10 }, (_, c) => HIRAGANA_GRID[c][r] || "")
);

const TRAY_GRID_ROWS = 5;
const GROUP_COLORS = [
  { border: "#ef4444", bg: "#fef2f2", text: "#b91c1c" },
  { border: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  { border: "#10b981", bg: "#ecfdf5", text: "#047857" },
  { border: "#f59e0b", bg: "#fffbeb", text: "#b45309" },
  { border: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9" },
  { border: "#ec4899", bg: "#fdf2f8", text: "#be185d" },
];

const STORAGE_KEY = 'pangram_layouts_v2';

// --- TYPES ---
interface TileData {
  id: string;
  char: string;
  x: number;
  y: number;
  isPlaced: boolean;
  initialized: boolean;
  groupId?: string;
  version: number;
}

interface SavedLayout {
  id: string;
  name: string;
  tiles: TileData[];
  timestamp: number;
}

// --- SUB-COMPONENTS ---

const DraggableTile: React.FC<{
  tile: TileData;
  tileSize: number;
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
}> = ({ 
  tile, tileSize, isSelected, groupColor, dragX, dragY, isMoving, disabled, onDragStart, onDrag, onDragEnd, onClick 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      drag={!disabled}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => { setIsDragging(true); onDragStart(); }}
      onDrag={(_, info) => onDrag(info)}
      onDragEnd={(e, info) => { setIsDragging(false); onDragEnd(e, info); }}
      onTap={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        width: tileSize, height: tileSize,
        position: 'fixed', left: tile.x, top: tile.y,
        x: isMoving ? dragX : 0,
        y: isMoving ? dragY : 0,
        backgroundColor: isSelected ? undefined : (groupColor?.bg || "white"),
        borderColor: isSelected ? undefined : (groupColor?.border || "#cbd5e1"),
        color: isSelected ? undefined : (groupColor?.text || "#1e293b"),
        borderWidth: groupColor ? "2px" : "1px",
        cursor: disabled ? "pointer" : (isDragging ? "grabbing" : "grab"),
        zIndex: isDragging ? 2000 : (isMoving ? 1500 : (isSelected ? 100 : 10)),
        touchAction: 'none'
      }}
      whileTap={{ scale: 1.1 }}
      animate={!isMoving ? { x: 0, y: 0 } : {}}
      transition={{ duration: 0.1 }}
      className={`flex items-center justify-center rounded font-bold shadow-md transition-colors
        ${isSelected ? "ring-4 ring-blue-300 bg-blue-600 text-white" : ""}
      `}
    >
      <span style={{ fontSize: `${tileSize * 0.45}px`, pointerEvents: 'none' }}>{tile.char}</span>
    </motion.div>
  );
};

const Menu: React.FC<{
  onReset: () => void;
  onSaveNew: () => void;
  onOverwrite: () => void;
  currentLayoutName?: string;
  savedLayouts: SavedLayout[];
  onLoadLayout: (id: string) => void;
  onDeleteLayout: (id: string) => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedCount: number;
  onGroupAction: () => void;
  hasGroupInSelection: boolean;
}> = ({ 
  onReset, onSaveNew, onOverwrite, currentLayoutName, savedLayouts, onLoadLayout, onDeleteLayout,
  isSelectionMode, onToggleSelectionMode, selectedCount, onGroupAction, hasGroupInSelection
}) => {
  const [isListOpen, setIsListOpen] = useState(false);

  return (
    <div className="relative">
      <nav className="h-12 w-full bg-white border-b border-slate-200 flex items-center justify-between px-3 shadow-sm relative z-[210]">
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <h1 className="text-sm font-black bg-slate-800 text-white px-2 py-1 rounded tracking-tighter italic shrink-0">PANGRAM</h1>
          {currentLayoutName && (
            <span className="text-[10px] font-bold text-slate-400 truncate border-l pl-2 border-slate-200">{currentLayoutName}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={() => setIsListOpen(!isListOpen)} className={`p-2 rounded-full ${isListOpen ? "bg-slate-100 text-blue-600" : "text-slate-600 hover:bg-slate-100"}`} title="一覧">
            <FolderOpen size={18} />
          </button>
          {currentLayoutName && <button onClick={onOverwrite} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="上書き"><Save size={18} /></button>}

          <div className="w-px h-6 bg-slate-200 mx-1" />
          
          <button onClick={onToggleSelectionMode} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isSelectionMode ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
            {isSelectionMode ? <CheckSquare size={14} /> : <MousePointer2 size={14} />}
            {isSelectionMode ? selectedCount : "選択"}
          </button>

          {isSelectionMode && selectedCount > 0 && (
            <button onClick={onGroupAction} className="p-2 bg-orange-500 text-white rounded-full shadow-sm">
              {hasGroupInSelection ? <Ungroup size={16} /> : <Group size={16} />}
            </button>
          )}
          
          <button onClick={onReset} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full" title="リセット"><RotateCcw size={18} /></button>
        </div>
      </nav>

      <AnimatePresence>
        {isListOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 z-[201]" onClick={() => setIsListOpen(false)} />
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-[202] max-h-[60vh] overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Gallery</h3>
                <button onClick={onSaveNew} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold shadow-md hover:bg-blue-700">
                  <Plus size={14} /> 新規保存
                </button>
              </div>
              <div className="grid gap-2">
                {savedLayouts.length === 0 ? <p className="text-center py-10 text-slate-400 text-xs italic">No items found.</p> : 
                  savedLayouts.sort((a,b) => b.timestamp - a.timestamp).map(layout => (
                    <div key={layout.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onLoadLayout(layout.id); setIsListOpen(false); }}>
                        <p className="font-bold text-sm text-slate-700 truncate">{layout.name}</p>
                        <p className="text-[10px] text-slate-400">{new Date(layout.timestamp).toLocaleString()}</p>
                      </div>
                      <button onClick={() => onDeleteLayout(layout.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  ))
                }
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const Canvas: React.FC<{ tileSize: number }> = ({ tileSize }) => {
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
          backgroundPosition: `${trayLeftX}px 0px`,
        }}
      />
    </div>
  );
};

const Tray: React.FC<{ tileSize: number, offsets: { trayLeftX: number; trayTopY: number } }> = ({ tileSize, offsets }) => {
  return (
    <div 
      className="fixed inset-x-0 bottom-0 bg-slate-50/50 border-t border-slate-200 pointer-events-none"
      style={{ top: offsets.trayTopY }}
    >
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

// --- MAIN APP COMPONENT ---

export default function App() {
  const [tileSize, setTileSize] = useState(50);
  const [layoutOffsets, setLayoutOffsets] = useState({ trayLeftX: 0, trayTopY: 0 });
  const [tiles, setTiles] = useState<TileData[]>([]);

  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const [movingIds, setMovingIds] = useState<string[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragInfo, setActiveDragInfo] = useState<{ snapDx: number; snapDy: number; isCollision: boolean } | null>(null);

  // Layout Calculation
  const updateLayout = useCallback(() => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    
    const newTileSize = Math.min(60, Math.floor(screenW / 12));
    setTileSize(newTileSize);

    const trayLeftX = Math.floor((screenW - 10 * newTileSize) / 2);
    const trayTopY = (Math.floor(screenH / newTileSize) - TRAY_GRID_ROWS) * newTileSize;
    
    setLayoutOffsets({ trayLeftX, trayTopY });

    setTiles((prev) => {
      const baseTiles = prev.length > 0 ? prev : HIRAGANA.map((char) => ({
        id: `tile-${char}`, char, x: 0, y: 0, isPlaced: false, initialized: false, version: 0,
      }));

      return baseTiles.map((t) => {
        if (t.isPlaced) return t;
        let r = 0, c = 0;
        TRANSPOSED_GRID.forEach((row, ri) => {
          const ci = row.indexOf(t.char);
          if (ci !== -1) { r = ri; c = ci; }
        });
        return { 
          ...t, 
          x: trayLeftX + c * newTileSize, 
          y: trayTopY + r * newTileSize, 
          initialized: true 
        };
      });
    });
  }, []);

  useEffect(() => {
    updateLayout();
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedLayouts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load layouts", e);
      }
    }
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  // Saving/Loading Logic
  const saveNew = () => {
    const name = prompt("レイアウト名を入力してください", `作品 ${savedLayouts.length + 1}`);
    if (!name) return;
    const newLayout: SavedLayout = {
      id: `layout-${Date.now()}`,
      name,
      tiles,
      timestamp: Date.now()
    };
    const newList = [...savedLayouts, newLayout];
    setSavedLayouts(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    setCurrentLayoutId(newLayout.id);
  };

  const overwrite = () => {
    if (!currentLayoutId) return saveNew();
    const newList = savedLayouts.map(l => 
      l.id === currentLayoutId ? { ...l, tiles, timestamp: Date.now() } : l
    );
    setSavedLayouts(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    alert("上書き保存しました");
  };

  const loadLayout = (id: string) => {
    const target = savedLayouts.find(l => l.id === id);
    if (target) {
      setTiles(target.tiles);
      setCurrentLayoutId(target.id);
      setIsSelectionMode(false);
    }
  };

  const deleteLayout = (id: string) => {
    if (!confirm("このレイアウトを削除しますか？")) return;
    const newList = savedLayouts.filter(l => l.id !== id);
    setSavedLayouts(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    if (currentLayoutId === id) setCurrentLayoutId(null);
  };

  // Collision Detection
  const checkCollision = (ids: string[], dx: number, dy: number, currentTiles: TileData[]) => {
    for (const mid of ids) {
      const t = currentTiles.find(tile => tile.id === mid)!;
      const targetX = t.x + dx;
      const targetY = t.y + dy;
      if (targetY < tileSize) return true;
      const isOccupied = currentTiles.some(other => 
        !ids.includes(other.id) && other.initialized && 
        Math.abs(other.x - targetX) < 1 && Math.abs(other.y - targetY) < 1
      );
      if (isOccupied) return true;
    }
    return false;
  };

  // Drag Events
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
    setActiveDragId(null);
    setActiveDragInfo(null);

    Promise.all([
      animate(dragX, targetX, config),
      animate(dragY, targetY, config)
    ]).then(() => {
      const trayTopY = layoutOffsets.trayTopY;
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
        maxX: Math.max(...gTiles.map(t => t.x + tileSize)),
        maxY: Math.max(...gTiles.map(t => t.y + tileSize)),
        colorIndex: idx % GROUP_COLORS.length
      };
    });
    return groups;
  }, [tiles, tileSize]);

  return (
    <div className="fixed inset-0 bg-white overflow-hidden touch-none selection:bg-none">
      <div className="relative z-[100]">
        <Menu 
          onReset={() => confirm("配置をリセットしますか？") && updateLayout()} 
          onSaveNew={saveNew}
          onOverwrite={overwrite}
          currentLayoutName={savedLayouts.find(l => l.id === currentLayoutId)?.name}
          savedLayouts={savedLayouts}
          onLoadLayout={loadLayout}
          onDeleteLayout={deleteLayout}
          isSelectionMode={isSelectionMode} 
          onToggleSelectionMode={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }} 
          selectedCount={selectedIds.size} 
          onGroupAction={() => {
            const selected = tiles.filter(t => selectedIds.has(t.id));
            const groupsInSelection = new Set(selected.map(t => t.groupId).filter(Boolean));
            setTiles(prev => {
              if (groupsInSelection.size > 0) {
                return prev.map(t => groupsInSelection.has(t.groupId) ? { ...t, groupId: undefined, version: t.version + 1 } : t);
              } else {
                const newGroupId = `group-${Date.now()}`;
                return prev.map(t => selectedIds.has(t.id) ? { ...t, groupId: newGroupId, version: t.version + 1 } : t);
              }
            });
            setSelectedIds(new Set()); setIsSelectionMode(false);
          }}
          hasGroupInSelection={Array.from(selectedIds).some(id => tiles.find(t => t.id === id)?.groupId)} 
        />
      </div>

      <Canvas tileSize={tileSize} />
      <Tray tileSize={tileSize} offsets={layoutOffsets} />

      {/* Group Boundaries (Background) */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {Object.entries(groupBoundaries).map(([gid, b]) => {
          const isMoving = movingIds.some(id => tiles.find(t => t.id === id)?.groupId === gid);
          return (
            <motion.div key={`boundary-${gid}`} className="absolute border-2 rounded-lg"
              style={{ 
                left: b.minX-4, top: b.minY-4, width: b.maxX-b.minX+8, height: b.maxY-b.minY+8, 
                borderColor: GROUP_COLORS[b.colorIndex].border, backgroundColor: `${GROUP_COLORS[b.colorIndex].bg}20`, 
                x: isMoving ? dragX : 0, y: isMoving ? dragY : 0 
              }}
            />
          );
        })}
      </div>

      {/* Snap Ghosts */}
      <div className="fixed inset-0 pointer-events-none z-20">
        {activeDragId && activeDragInfo && (
          <div className="absolute">
            {movingIds.map(mid => {
              const t = tiles.find(tile => tile.id === mid)!;
              return <div key={`ghost-${mid}`} className={`absolute border-2 border-dashed rounded ${activeDragInfo.isCollision ? 'bg-red-200/40 border-red-400' : 'bg-slate-200/50 border-slate-300'}`} style={{ width: tileSize, height: tileSize, left: t.x + activeDragInfo.snapDx, top: t.y + activeDragInfo.snapDy }} />;
            })}
          </div>
        )}
      </div>

      {/* Tiles */}
      {tiles.map((tile) => (
        <DraggableTile 
          key={tile.id} 
          tile={tile} 
          tileSize={tileSize}
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
              if(next.has(tile.id)) next.delete(tile.id); else next.add(tile.id); 
              return next; 
            });
          }}
          disabled={isSelectionMode}
        />
      ))}
    </div>
  );
}