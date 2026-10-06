import { useEffect, useState } from 'react';
import { X, Trash2, ExternalLink, Download, Clock, Calendar, CheckCircle } from 'lucide-react';
import { analysisService } from '../services/api';
import { SEVERITY_CONFIG } from '../utils/constants';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (record: any) => void;
}

export default function HistoryDrawer({ isOpen, onClose, onSelectAnalysis }: HistoryDrawerProps) {
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await analysisService.getHistory();
      setHistoryItems(data);
    } catch {
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await analysisService.deleteHistoryItem(id);
    setHistoryItems(historyItems.filter((item) => item.id !== id));
  };

  const handleExport = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(item.result_json, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${item.drug_name}_${item.food_name}_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-surface-50 border-l border-surface-border flex flex-col shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-cyan-dim border border-accent-cyan/20 text-accent-cyan">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Analysis History</h3>
              <p className="text-xs text-text-secondary">Logged molecular interaction screenings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-tertiary hover:text-text-primary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-text-secondary text-sm font-mono">
              Loading historical queries...
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-16 text-center text-text-tertiary">
              <p className="text-sm font-semibold mb-1">No Past Analyses Found</p>
              <p className="text-xs">Run a food × drug screening to populate this log.</p>
            </div>
          ) : (
            historyItems.map((item) => {
              const sev = (item.severity || 'none').toLowerCase();
              const config = SEVERITY_CONFIG[sev as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.none;
              const dateStr = item.created_at
                ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : 'September 2026';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectAnalysis(item.result_json || item);
                    onClose();
                  }}
                  className="p-4 rounded-xl bg-surface-100/70 border border-surface-border hover:border-accent-cyan/30 hover:bg-surface-200/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-bold text-text-primary group-hover:text-accent-cyan transition-colors">
                      {item.drug_name} × {item.food_name}
                    </h4>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${config.bgClass} ${config.textClass} ${config.borderClass}`}>
                      {item.predicted_class || 'CLASS 2'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Calendar className="w-3 h-3 text-text-tertiary" />
                      {dateStr}
                    </span>
                    <span className="font-semibold text-text-primary capitalize">
                      {item.severity} Interaction
                    </span>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-3 pt-2.5 border-t border-surface-border/60 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => handleExport(item, e)}
                      title="Export JSON"
                      className="p-1.5 text-text-tertiary hover:text-accent-cyan rounded hover:bg-surface-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete Entry"
                      className="p-1.5 text-text-tertiary hover:text-accent-red rounded hover:bg-surface-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Load Details"
                      className="text-[11px] font-mono font-medium text-accent-cyan flex items-center gap-1 ml-2"
                    >
                      View
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
