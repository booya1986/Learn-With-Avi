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
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <button
              onClick={onClose}
              aria-label="Close summary modal"
              className="absolute top-4 start-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="text-center" dir="rtl">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 mb-3">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3
                id="summary-modal-title"
                className="text-xl font-bold text-white"
              >
                סיכום AI מהתמליל
              </h3>
              {videoTitle ? <p className="text-blue-100 text-sm mt-1">{videoTitle}</p> : null}
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
                <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  מנתח את התמליל...
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                  ה-AI קורא את התמליל ומייצר סיכום מותאם אישית
                </p>
                <div className="flex gap-1 mt-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : summaryData ? (
              // Summary content
              <div className="p-6" dir="rtl">
                {/* AI Badge */}
                <div className="flex items-center gap-2 mb-4 text-xs text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  <span>סיכום זה נוצר אוטומטית מתוך התמליל של הסרטון</span>
                </div>

                {/* About Section */}
                <SummarySection
                  icon={BookOpen}
                  iconColor="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  title="על מה הסרטון?"
                >
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {summaryData.about}
                  </p>
                </SummarySection>

                {/* Tools Section */}
                <SummarySection
                  icon={Settings}
                  iconColor="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
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
                  iconColor="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
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
                  iconColor="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                  title="יתרונות"
                >
                  <div className="flex flex-wrap gap-2">
                    {summaryData.benefits.map((benefit, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        {benefit}
                      </span>
                    ))}
                  </div>
                </SummarySection>
              </div>
            ) : null}
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-xl"
              >
                סגור
              </Button>
              <Button
                onClick={handleCopy}
                disabled={isGenerating || !summaryData}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
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
