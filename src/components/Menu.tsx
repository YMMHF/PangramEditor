import React from 'react';
import { RotateCcw, Save, MousePointer2, CheckSquare, Group, Ungroup } from 'lucide-react';

interface Props {
  onReset: () => void;
  onSave: () => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedCount: number;
  onGroupAction: () => void;
  hasGroupInSelection: boolean;
}

const Menu: React.FC<Props> = ({ 
  onReset, onSave, isSelectionMode, onToggleSelectionMode, selectedCount, onGroupAction, hasGroupInSelection
}) => {
  return (
    <nav className="h-12 w-full bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm relative z-[200]">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-black bg-slate-800 text-white px-2 py-1 rounded tracking-tighter italic">PANGRAM</h1>
      </div>
      <div className="flex items-center gap-1">
        {isSelectionMode && selectedCount > 0 && (
          <button onClick={onGroupAction} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500 text-white shadow-md hover:bg-orange-600 active:scale-95 transition-all">
            {hasGroupInSelection ? <Ungroup size={14} /> : <Group size={14} />}
            {hasGroupInSelection ? "解除" : "結合"}
          </button>
        )}
        <button onClick={onToggleSelectionMode} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isSelectionMode ? "bg-blue-600 text-white shadow-inner" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
          {isSelectionMode ? <CheckSquare size={14} /> : <MousePointer2 size={14} />}
          {isSelectionMode ? `完了 (${selectedCount})` : "選択"}
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <button onClick={onReset} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors" title="リセット"><RotateCcw size={18} /></button>
        <button onClick={onSave} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors" title="保存"><Save size={18} /></button>
      </div>
    </nav>
  );
};

export default Menu;