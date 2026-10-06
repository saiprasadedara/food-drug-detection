import { useState } from 'react';
import { X, Copy, Check, Download, FileJson } from 'lucide-react';

interface JsonViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  title?: string;
}

export default function JsonViewerModal({ isOpen, onClose, data, title = 'Structured Model Inference Payload' }: JsonViewerModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonStr = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `molecular_interaction_payload.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-surface-50 border border-surface-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-100/50">
          <div className="flex items-center gap-2.5">
            <FileJson className="w-5 h-5 text-accent-cyan" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">{title}</h3>
              <span className="text-[10px] font-mono text-text-tertiary">Schema: RFC 8259 Standardized Representation</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-surface-200 hover:bg-surface-300 text-text-primary transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-accent-emerald" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-accent-cyan-dim hover:bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-6 bg-[#06080d] font-mono text-xs text-text-secondary">
          <pre className="leading-relaxed">
            <code>{jsonStr}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
