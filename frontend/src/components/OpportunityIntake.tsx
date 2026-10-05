import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  MessageSquare,
  Link as LinkIcon,
  Upload,
  Sparkles,
  AlertCircle,
  ArrowRight,
  X,
  Image as ImageIcon,
  FileSpreadsheet,
  Linkedin
} from 'lucide-react';
import { DemoCase } from '../types/investigation';

interface OpportunityIntakeProps {
  onInvestigate: (payload: { text?: string; file?: File; files?: File[]; url?: string; linkedinUrl?: string }) => void;
  isLoading: boolean;
  demos: DemoCase[];
}

export const OpportunityIntake: React.FC<OpportunityIntakeProps> = ({
  onInvestigate,
  isLoading,
  demos
}) => {
  const [activeMode, setActiveMode] = useState<'text' | 'file' | 'url'>('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [linkedinInput, setLinkedinInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate image preview URLs when image files are selected
  useEffect(() => {
    const urls = selectedFiles.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return '';
    });
    setFilePreviewUrls(urls);
    return () => urls.forEach(url => { if (url) URL.revokeObjectURL(url); });
  }, [selectedFiles]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFiles(Array.from(e.target.files));
    }
  };

  const validateAndSetFiles = (files: File[]) => {
    setInputError(null);
    const maxSize = 15 * 1024 * 1024; // 15 MB (matches backend upload limit)

    if (selectedFiles.length + files.length > 5) {
       setInputError('Maximum 5 files allowed.');
       return;
    }

    const acceptedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExts = ['pdf', 'png', 'jpg', 'jpeg', 'txt', 'docx'];

    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > maxSize) {
        setInputError(`File ${file.name} is too large. Maximum supported file size is 15MB.`);
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase();
      // The backend requires a supported extension; browsers may report an empty MIME type, so only reject a MIME type when one is given
      if (!validExts.includes(ext || '') || (file.type && !acceptedTypes.includes(file.type))) {
        setInputError(`Unsupported file format for ${file.name}. Please upload a PDF, Image, DOCX, or TXT.`);
        return;
      }
      validFiles.push(file);
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleLoadDemo = (demo: DemoCase) => {
    setActiveMode('text');
    setTextInput(demo.content);
    setSelectedFiles([]);
    setUrlInput('');
    setInputError(null);
  };

  // Demo screenshot sample generator
  const handleLoadDemoScreenshot = () => {
    setActiveMode('text');
    setTextInput(
      `[WhatsApp Chat Screenshot - HR Recruiter]\n` +
      `Recruiter: Rajesh Sharma (+91 98765 43210)\n` +
      `"Congratulations! You have been directly shortlisted for Google Summer Internship 2026.\n` +
      `Stipend: ₹45,000/month (Remote)\n` +
      `Pay ₹2,999 registration and laptop kit fee within 24 hours to secure your slot.\n` +
      `Send payment screenshot to hr.googleinternships@gmail.com along with your Aadhaar copy."`
    );
    setSelectedFiles([]);
    setUrlInput('');
    setInputError(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInputError(null);

    const linkedinUrl = linkedinInput.trim() || undefined;
    if (linkedinUrl && !/^https?:\/\/([a-z]{2,3}\.|www\.)?linkedin\.com\//i.test(linkedinUrl)) {
      setInputError('The LinkedIn link should look like https://www.linkedin.com/company/<name>');
      return;
    }

    if (activeMode === 'text') {
      if (!textInput.trim()) {
        setInputError('Please paste an opportunity message, email, or offer text.');
        return;
      }
      if (textInput.trim().length < 15) {
        setInputError('Please provide a more complete opportunity text (at least 15 characters).');
        return;
      }
      onInvestigate({ text: textInput.trim(), linkedinUrl });
    } else if (activeMode === 'file') {
      if (selectedFiles.length === 0) {
        setInputError('Please select or drop an opportunity screenshot or PDF document.');
        return;
      }
      onInvestigate({ files: selectedFiles, linkedinUrl });
    } else if (activeMode === 'url') {
      if (!urlInput.trim()) {
        setInputError('Please provide an opportunity URL.');
        return;
      }
      try {
        new URL(urlInput.trim());
      } catch {
        setInputError('Please enter a valid URL including http:// or https://');
        return;
      }
      onInvestigate({ url: urlInput.trim(), linkedinUrl });
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 animate-fadeIn">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-750 shadow-2xl relative overflow-hidden">
        {/* Top Radial Glow */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header (Prompt 4 Section 1) */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-300 text-xs font-mono">
            <span>INTAKE HUB // MULTI-MODAL EVIDENCE INGESTION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
            Investigate an Opportunity
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Paste a message, upload evidence, or analyze an opportunity from a URL.
          </p>
        </div>

        {/* Quick Demo Pre-fills */}
        <div className="mb-6 pb-5 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Curated Test Cases:</span>
            </span>
            <button
              type="button"
              onClick={handleLoadDemoScreenshot}
              className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <ImageIcon className="w-3 h-3" />
              <span>Load Screenshot Demo</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {demos.map((demo) => {
              const isHighRisk = demo.badge === 'HIGH RISK';
              const isLowRisk = demo.badge === 'LOW RISK';
              return (
                <button
                  key={demo.id}
                  onClick={() => handleLoadDemo(demo)}
                  type="button"
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 font-medium ${
                    isHighRisk
                      ? 'bg-rose-950/40 border-rose-800/40 text-rose-300 hover:bg-rose-900/60 hover:border-rose-700'
                      : isLowRisk
                      ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-700'
                      : 'bg-amber-950/40 border-amber-800/40 text-amber-300 hover:bg-amber-900/60 hover:border-amber-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{demo.title.split('(')[0].trim()}</span>
                  <span className="text-[10px] font-mono px-1 rounded bg-black/40 border border-white/10">
                    {demo.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Primary Modes (Prompt 4 Section 1) */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveMode('text');
              setInputError(null);
            }}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-xs font-bold tracking-wide transition-all ${
              activeMode === 'text'
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Paste Text</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('file');
              setInputError(null);
            }}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-xs font-bold tracking-wide transition-all ${
              activeMode === 'file'
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Evidence</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('url');
              setInputError(null);
            }}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-xs font-bold tracking-wide transition-all ${
              activeMode === 'url'
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Analyze URL</span>
          </button>
        </div>

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mode 1: Text */}
          {activeMode === 'text' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Offer Letter, Email Body, WhatsApp Message, or DM Content:</span>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-[11px] text-slate-500">
                    {textInput.length} characters
                  </span>
                  {textInput.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTextInput('')}
                      className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  if (inputError) setInputError(null);
                }}
                rows={7}
                aria-label="Opportunity text"
                placeholder="Paste the suspicious offer letter, internship message, recruiter email, or DM here..."
                className="w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-y leading-relaxed"
              />
            </div>
          )}

          {/* Mode 2: File Upload (PDF, PNG, JPG, DOCX, TXT) */}
          {activeMode === 'file' && (
            <div className="space-y-3">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : selectedFiles.length > 0
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFiles.length > 0 ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex flex-wrap gap-4 justify-center">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex flex-col items-center space-y-2">
                          {filePreviewUrls[idx] ? (
                            <div className="w-16 h-16 rounded-xl border border-emerald-500/40 overflow-hidden bg-slate-950 shadow-md relative group">
                              <img
                                src={filePreviewUrls[idx]}
                                alt="Screenshot preview"
                                className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-6 h-6 text-rose-400" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative w-16 h-16 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group">
                              {file.type === 'application/pdf' ? (
                                <FileText className="w-6 h-6 group-hover:opacity-20 transition-opacity" />
                              ) : (
                                <FileSpreadsheet className="w-6 h-6 group-hover:opacity-20 transition-opacity" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-6 h-6 text-rose-400" />
                              </button>
                            </div>
                          )}
                          <div className="text-center w-24">
                            <div className="font-bold text-[10px] text-slate-100 truncate" title={file.name}>{file.name}</div>
                            <div className="text-[9px] text-slate-400 font-mono truncate">
                              {(file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedFiles.length < 5 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="text-xs text-cyan-400 hover:underline flex items-center space-x-1 mt-2"
                      >
                        <span>+ Add another file (Max 5)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFiles([]);
                      }}
                      className="text-xs text-rose-400 hover:underline flex items-center space-x-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove All Files</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2 text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                      <Upload className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-bold text-slate-200">
                      Drop an opportunity screenshot or document here
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Accepts PDF, PNG, JPG, JPEG, DOCX, TXT (Max 5 files, 15MB ea)
                    </span>
                    <span className="text-xs text-cyan-400 font-mono underline pt-1">
                      Browse files on your device
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode 3: URL */}
          {activeMode === 'url' && (
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Opportunity, Job Board, or Career Portal URL:</label>
              <div className="relative">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  placeholder="https://example-careers.com/jobs/software-internship..."
                  className="w-full p-4 pl-11 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
                <LinkIcon className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                ScamCheck safely inspects URL structure, domain headers, and page content without executing client scripts.
              </p>
            </div>
          )}

          {/* Optional company LinkedIn page for the company credibility & career value check */}
          <div className="space-y-1.5">
            <label htmlFor="intake-linkedin" className="flex items-center space-x-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              <Linkedin className="w-3.5 h-3.5 text-sky-400" />
              <span>Company LinkedIn page (optional)</span>
            </label>
            <input
              id="intake-linkedin"
              type="url"
              value={linkedinInput}
              onChange={(e) => setLinkedinInput(e.target.value)}
              placeholder="https://www.linkedin.com/company/..."
              maxLength={300}
              className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
            />
            <p className="text-[10px] text-slate-500 font-mono">
              Adds a check of the company's credibility and whether this opportunity will actually help your career.
            </p>
          </div>

          {/* Error Banner */}
          {inputError && (
            <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{inputError}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Input content is processed strictly as data with zero instruction execution.
            </span>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>ANALYZING EVIDENCE...</span>
                </>
              ) : (
                <>
                  <span>INVESTIGATE EVIDENCE</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
