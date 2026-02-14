/**
 * ErrorBoundary - Catch React errors and display fallback UI
 *
 * Wraps components to gracefully handle errors without crashing the entire app.
 * Provides custom fallback UI per section and logs errors for debugging.
 * Automatically captures errors in Sentry for monitoring.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ChatError />}>
 *   <ChatSidebar />
 * </ErrorBoundary>
 * ```
 */
"use client";
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = void 0;
exports.ChatErrorFallback = ChatErrorFallback;
exports.VideoErrorFallback = VideoErrorFallback;
exports.MaterialsErrorFallback = MaterialsErrorFallback;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("@/components/ui/button");
var Sentry = require("@sentry/nextjs");
/**
 * Default error fallback UI
 */
function DefaultErrorFallback(_a) {
    var error = _a.error, section = _a.section, onReset = _a.onReset;
    return (<div className="flex items-center justify-center min-h-[200px] p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
            <lucide_react_1.AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400"/>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {section ? "".concat(section, " Error") : "Something went wrong"}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {(error === null || error === void 0 ? void 0 : error.message) || "An unexpected error occurred"}
        </p>
        <button_1.Button onClick={onReset} variant="outline" className="gap-2">
          <lucide_react_1.RefreshCw className="w-4 h-4"/>
          Try Again
        </button_1.Button>
      </div>
    </div>);
}
/**
 * Error boundary component
 * Catches errors in child component tree and displays fallback UI
 */
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    function ErrorBoundary(props) {
        var _this = _super.call(this, props) || this;
        _this.handleReset = function () {
            // Reset error state
            _this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
            });
        };
        _this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
        return _this;
    }
    ErrorBoundary.getDerivedStateFromError = function (error) {
        // Update state so next render shows fallback UI
        return {
            hasError: true,
            error: error,
        };
    };
    ErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        // Log error details
        var _a = this.props, section = _a.section, onError = _a.onError;
        console.error("[ErrorBoundary".concat(section ? " - ".concat(section) : "", "] Caught error:"), error, errorInfo);
        // Send to Sentry with component context
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack,
                    section: section || 'unknown',
                },
            },
            tags: {
                errorBoundary: section || 'global',
            },
        });
        this.setState({
            errorInfo: errorInfo,
        });
        // Call custom error handler if provided
        onError === null || onError === void 0 ? void 0 : onError(error, errorInfo);
    };
    ErrorBoundary.prototype.render = function () {
        var _a = this.state, hasError = _a.hasError, error = _a.error;
        var _b = this.props, children = _b.children, fallback = _b.fallback, section = _b.section;
        if (hasError) {
            // Render custom fallback if provided
            if (fallback) {
                return fallback;
            }
            // Render default fallback
            return (<DefaultErrorFallback error={error} section={section} onReset={this.handleReset}/>);
        }
        return children;
    };
    return ErrorBoundary;
}(react_1.Component));
exports.ErrorBoundary = ErrorBoundary;
/**
 * Specialized error fallbacks for different sections
 */
function ChatErrorFallback() {
    return (<div className="flex items-center justify-center h-full p-6">
      <div className="text-center">
        <lucide_react_1.AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2"/>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Chat unavailable
        </p>
      </div>
    </div>);
}
function VideoErrorFallback() {
    return (<div className="flex items-center justify-center h-[400px] bg-gray-100 dark:bg-gray-900 rounded-lg">
      <div className="text-center">
        <lucide_react_1.AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2"/>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Video player error
        </p>
      </div>
    </div>);
}
function MaterialsErrorFallback() {
    return (<div className="flex items-center justify-center h-full p-6">
      <div className="text-center">
        <lucide_react_1.AlertTriangle className="w-8 h-8 text-blue-500 mx-auto mb-2"/>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Materials unavailable
        </p>
      </div>
    </div>);
}
