import * as React from "react";
import { useEffect, useCallback } from "react";

import {
  X,
  Sparkles,
  Loader2,
  BookOpen,
  Settings,
  BarChart3,
  CheckCircle2,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type SummaryData } from "@/types";

import { SummaryProcessStep } from "./SummaryProcessStep";
import { SummarySection } from "./SummarySection";
import { SummaryToolCard } from "./SummaryToolCard";

/**
 * AI-generated video summary modal
 *
 * Displays a comprehensive summary of a video extracted from its transcript.
 * Shows overview, tools used, process steps, and benefits in structured sections.
 *
 * Features:
 * - Full-screen modal with backdrop
 * - Loading state during AI processing
 * - Copy to clipboard functionality
 * - Keyboard navigation (ESC to close)
 * - Focus trap when open
 * - RTL support for Hebrew content
 *
 * @component
 * @example
 * ```tsx
 * <SummaryModal
 *   isOpen={showSummary}
 *   onClose={() => setShowSummary(false)}
 *   videoTitle="How to build an AI app"
 *   isGenerating={isLoading}
 *   summaryData={data}
 * />
 * ```
 */

export interface SummaryModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when modal should close
   */
  onClose: () => void;
  /**
   * Title of the video being summarized
   */
  videoTitle?: string;
  /**
   * Whether the summary is currently being generated
   */
  isGenerating: boolean;
  /**
   * The generated summary data (null when not yet generated)
   */
  summaryData: SummaryData | null;
}

export const SummaryModal = React.memo<SummaryModalProps>(
  ({ isOpen, onClose, videoTitle, isGenerating, summaryData }) => {
    // Handle ESC key to close modal
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        // Prevent body scroll when modal is open
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }, [isOpen, onClose]);

    // Copy summary to clipboard
    const handleCopy = useCallback(() => {
      if (!summaryData) {return;}

      const summaryText = `
סיכום הסרטון: ${videoTitle || ""}

על מה הסרטון?
${summaryData.about}

כלים:
${summaryData.tools.map((t) => `• ${t.name}: ${t.desc}`).join("\n")}

התהליך:
${summaryData.process.map((p) => `${p.step}. ${p.title}: ${p.desc}`).join("\n")}

יתרונות:
${summaryData.benefits.map((b) => `✓ ${b}`).join("\n")}
      `.trim();

      navigator.clipboard
        .writeText(summaryText)
        .then(() => {
          // Could add a toast notification here
          console.log("Summary copied to clipboard");
        })
        .catch((err) => {
          console.error("Failed to copy summary:", err);
        });
    }, [summaryData, videoTitle]);

    // Don't render if not open
    if (!isOpen) {return null;}

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-modal-title"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-[#141414] border border-green-500/15 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ boxShadow: '0 0 40px rgba(34,197,94,0.08), 0 24px 64px rgba(0,0,0,0.6)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with green gradient */}
          <div className="relative p-6" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.05) 60%, transparent 100%), #161616', borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
            <button
              onClick={onClose}
              aria-label="Close summary modal"
              className="absolute top-4 start-4 p-2 rounded-full bg-white/10 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141414]"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="text-center" dir="rtl">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/25 mb-3" style={{ boxShadow: '0 0 16px rgba(34,197,94,0.2)' }}>
                <Sparkles className="w-7 h-7 text-green-400" />
              </div>
              <h3
                id="summary-modal-title"
                className="text-xl font-bold text-white"
              >
                סיכום AI מהתמליל
              </h3>
              {videoTitle ? <p className="text-green-400/70 text-sm mt-1">{videoTitle}</p> : null}
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="max-h-[50vh]">
            {isGenerating ? (
              // Loading state
              <div
                className="p-12 flex flex-col items-center justify-center"
                dir="rtl"
              >
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4" style={{ boxShadow: '0 0 20px rgba(34,197,94,0.15)' }}>
                  <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  מנתח את התמליל...
                </h4>
                <p className="text-white/50 text-sm text-center">
                  ה-AI קורא את התמליל ומייצר סיכום מותאם אישית
                </p>
                <div className="flex gap-1 mt-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : summaryData ? (
              // Summary content
              <div className="p-6" dir="rtl">
                {/* AI Badge */}
                <div className="flex items-center gap-2 mb-4 text-xs text-green-400/70">
                  <Sparkles className="w-4 h-4 text-green-400" />
                  <span>סיכום זה נוצר אוטומטית מתוך התמליל של הסרטון</span>
                </div>

                {/* About Section */}
                <SummarySection
                  icon={BookOpen}
                  iconColor="bg-green-500/10 border border-green-500/20 text-green-400"
                  title="על מה הסרטון?"
                >
                  <p className="text-white/60 leading-relaxed">
                    {summaryData.about}
                  </p>
                </SummarySection>

                {/* Tools Section */}
                <SummarySection
                  icon={Settings}
                  iconColor="bg-green-500/10 border border-green-500/20 text-green-400"
                  title="כלים שזוהו בתמליל"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {summaryData.tools.map((tool, idx) => (
                      <SummaryToolCard
                        key={idx}
                        name={tool.name}
                        description={tool.desc}
                        colorClassName={tool.color}
                      />
                    ))}
                  </div>
                </SummarySection>

                {/* Process Section */}
                <SummarySection
                  icon={BarChart3}
                  iconColor="bg-amber-500/10 border border-amber-500/20 text-amber-400"
                  title="התהליך"
                >
                  <div className="space-y-3">
                    {summaryData.process.map((item) => (
                      <SummaryProcessStep
                        key={item.step}
                        step={item.step}
                        title={item.title}
                        description={item.desc}
                      />
                    ))}
                  </div>
                </SummarySection>

                {/* Benefits Section */}
                <SummarySection
                  icon={CheckCircle2}
                  iconColor="bg-green-500/10 border border-green-500/20 text-green-400"
                  title="יתרונות"
                >
                  <div className="flex flex-wrap gap-2">
                    {summaryData.benefits.map((benefit, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/8 border border-green-500/20 text-sm text-green-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        {benefit}
                      </span>
                    ))}
                  </div>
                </SummarySection>
              </div>
            ) : null}
          </ScrollArea>

          {/* Footer */}
          <div className="p-4" style={{ borderTop: '1px solid rgba(34,197,94,0.08)', background: 'rgba(0,0,0,0.2)' }}>
            <div className="flex gap-3">
              <Button
                variant="orbyto-secondary"
                onClick={onClose}
                className="flex-1 rounded-xl"
              >
                סגור
              </Button>
              <Button
                variant="orbyto-primary"
                onClick={handleCopy}
                disabled={isGenerating || !summaryData}
                className="flex-1 rounded-xl"
              >
                <Share2 className="w-4 h-4 ms-2" />
                העתק סיכום
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SummaryModal.displayName = "SummaryModal";
