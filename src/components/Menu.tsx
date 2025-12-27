import React, { useState } from 'react';
import { RotateCcw, Save, FolderOpen, Trash2, MousePointer2, CheckSquare, Group, Ungroup, ChevronDown, Plus } from 'lucide-react';

interface SavedLayout {
  id: string;
  name: string;
  timestamp: number;
}

interface Props {
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
}

const Menu: React.FC<Props> = ({ 
  onReset, onSaveNew, onOverwrite, currentLayoutName, savedLayouts, onLoadLayout, onDeleteLayout,
  isSelectionMode, onToggleSelectionMode, selectedCount, onGroupAction, hasGroupInSelection
}) => {
  const [isListOpen, setIsListOpen] = useState(false);

  return (
    <div className="relative">
      <nav className="h-12 w-full bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm relative z-[210]">
        <div className="flex items-center gap-2 overflow-hidden">
          <h1 className="text-sm font-black bg-slate-800 text-white px-2 py-1 rounded tracking-tighter italic shrink-0">PANGRAM</h1>
          {currentLayoutName && (
            <span className="text-[10px] font-bold text-slate-400 truncate border-l pl-2 border-slate-200">{currentLayoutName}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* 保存済みを開く */}
          <button onClick={() => setIsListOpen(!isListOpen)} className={`p-2 rounded-full transition-colors ${isListOpen ? "bg-slate-100 text-blue-600" : "text-slate-600 hover:bg-slate-100"}`} title="レイアウト一覧">
            <FolderOpen size={18} />
          </button>

          {/* 上書き保存 (現在のレイアウトがある場合のみ) */}
          {currentLayoutName && (
            <button onClick={onOverwrite} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="上書き保存">
              <Save size={18} />
            </button>
          )}

          <div className="w-px h-6 bg-slate-200 mx-1" />
          
          {isSelectionMode && selectedCount > 0 && (
            <button onClick={onGroupAction} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500 text-white shadow-md hover:bg-orange-600 transition-all">
              {hasGroupInSelection ? <Ungroup size={14} /> : <Group size={14} />}
              解除/結合
            </button>
          )}
          
          <button onClick={onToggleSelectionMode} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isSelectionMode ? "bg-blue-600 text-white shadow-inner" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
            {isSelectionMode ? <CheckSquare size={14} /> : <MousePointer2 size={14} />}
            {isSelectionMode ? selectedCount : "選択"}
          </button>
          
          <button onClick={onReset} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors" title="リセット">
            <RotateCcw size={18} />
          </button>
        </div>
      </nav>

      {/* 保存済みレイアウトの一覧パネル */}
      {isListOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-[201]" onClick={() => setIsListOpen(false)} />
          <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-[202] max-h-[50vh] overflow-y-auto p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">保存済みレイアウト</h3>
              <button onClick={onSaveNew} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold shadow-sm hover:bg-blue-700">
                <Plus size={14} /> 新規保存
              </button>
            </div>
            
            <div className="grid gap-2">
              {savedLayouts.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-xs italic">保存されたデータはありません</p>
              ) : (
                savedLayouts.sort((a,b) => b.timestamp - a.timestamp).map(layout => (
                  <div key={layout.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onLoadLayout(layout.id); setIsListOpen(false); }}>
                      <p className="font-bold text-sm text-slate-700 truncate">{layout.name}</p>
                      <p className="text-[10px] text-slate-400">{new Date(layout.timestamp).toLocaleString()}</p>
                    </div>
                    <button onClick={() => onDeleteLayout(layout.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Menu;