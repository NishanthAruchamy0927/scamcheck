import React from 'react';
import { MultimodalContent } from '../types/investigation';
import {
  FileImage,
  FileText,
  Link as LinkIcon,
  HardDrive,
  Cpu,
  Mail,
  Phone,
  Globe,
  DollarSign
} from 'lucide-react';

interface MultimodalEvidenceViewProps {
  multimodal: MultimodalContent;
}

export const MultimodalEvidenceView: React.FC<MultimodalEvidenceViewProps> = ({ multimodal }) => {
  if (!multimodal || !multimodal.inputs || multimodal.inputs.length === 0) {
    return null;
  }

  const { inputs, content, metadata } = multimodal;
  const { entities } = content;

  // Group entities
  const urls = entities.filter(e => e.type === 'URL' || e.type === 'DOMAIN');
  const emails = entities.filter(e => e.type === 'EMAIL');
  const phones = entities.filter(e => e.type === 'PHONE');
  const payments = entities.filter(e => e.type === 'PAYMENT_REQUEST' || e.type === 'ACCOUNT_NUMBER' || e.type === 'UPI');

  const getSourceIcon = (type: string) => {
    if (type === 'IMAGE') return <FileImage className="w-4 h-4 text-emerald-400" />;
    if (type === 'PDF' || type === 'DOCX') return <FileText className="w-4 h-4 text-blue-400" />;
    if (type === 'URL') return <LinkIcon className="w-4 h-4 text-purple-400" />;
    return <HardDrive className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-800/40 space-y-6 relative overflow-hidden bg-slate-900/40">
      <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-cyan-900/10 blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-950/50 rounded-xl border border-cyan-800/50">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              Multimodal Cyber Intelligence
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
              EVIDENCE EXTRACTION & OCR PIPELINE
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Files Processed</div>
          <div className="font-bold text-slate-200">{inputs.length} Sources</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Processed Sources */}
        <div className="col-span-1 border-r border-slate-800/60 pr-6 space-y-4">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase">Ingested Evidence</div>
          <div className="space-y-2">
            {inputs.map((input, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                {getSourceIcon(input.type)}
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-slate-300 truncate">{input.originalName || 'Input Source'}</span>
                  <span className="text-[9px] font-mono text-slate-500">{input.type}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>OCR Pipeline:</span>
              <span className={metadata.ocrUsed ? 'text-emerald-400 font-bold' : 'text-slate-400'}>{metadata.ocrUsed ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
            {metadata.fileHashes && (
              <div className="flex justify-between">
                <span>Integrity Hash:</span>
                <span className="text-slate-400 truncate w-24 text-right">{metadata.fileHashes[0]}</span>
              </div>
            )}
          </div>
        </div>

        {/* Extracted Entities */}
        <div className="col-span-2 space-y-4">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase">Extracted Indicators of Compromise (IoCs)</div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* URLs */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-1.5 text-purple-400">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold uppercase">Domains / URLs</span>
                </div>
                <span className="text-xs font-bold text-slate-300">{urls.length}</span>
              </div>
              <div className="space-y-1">
                {urls.length > 0 ? urls.map((u, i) => (
                  <div key={i} className="text-[10px] font-mono text-slate-400 truncate">{u.value}</div>
                )) : <div className="text-[10px] text-slate-600 italic">None detected</div>}
              </div>
            </div>

            {/* Emails */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-1.5 text-amber-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold uppercase">Email Addresses</span>
                </div>
                <span className="text-xs font-bold text-slate-300">{emails.length}</span>
              </div>
              <div className="space-y-1">
                {emails.length > 0 ? emails.map((e, i) => (
                  <div key={i} className="text-[10px] font-mono text-slate-400 truncate">{e.value}</div>
                )) : <div className="text-[10px] text-slate-600 italic">None detected</div>}
              </div>
            </div>

            {/* Phones */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-1.5 text-cyan-400">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold uppercase">Phone / WhatsApp</span>
                </div>
                <span className="text-xs font-bold text-slate-300">{phones.length}</span>
              </div>
              <div className="space-y-1">
                {phones.length > 0 ? phones.map((p, i) => (
                  <div key={i} className="text-[10px] font-mono text-slate-400 truncate">{p.value}</div>
                )) : <div className="text-[10px] text-slate-600 italic">None detected</div>}
              </div>
            </div>

            {/* Payments */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-1.5 text-rose-400">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold uppercase">Payment Signals</span>
                </div>
                <span className="text-xs font-bold text-slate-300">{payments.length}</span>
              </div>
              <div className="space-y-1">
                {payments.length > 0 ? payments.map((p, i) => (
                  <div key={i} className="text-[10px] font-mono text-rose-300/80 truncate">{p.value}</div>
                )) : <div className="text-[10px] text-slate-600 italic">None detected</div>}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
