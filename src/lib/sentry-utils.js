"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureApiError = captureApiError;
exports.captureDatabaseError = captureDatabaseError;
exports.captureExternalApiError = captureExternalApiError;
exports.capturePerformanceIssue = capturePerformanceIssue;
exports.captureValidationError = captureValidationError;
exports.setSentryUser = setSentryUser;
exports.clearSentryUser = clearSentryUser;
exports.addSentryBreadcrumb = addSentryBreadcrumb;
exports.captureMetric = captureMetric;
exports.startTransaction = startTransaction;
exports.withSentryErrorTracking = withSentryErrorTracking;
exports.withSentryErrorTrackingSync = withSentryErrorTrackingSync;
var Sentry = require("@sentry/nextjs");
/**
 * Sentry utility functions for error tracking and monitoring
 * Provides consistent error reporting patterns across the application
 */
/**
 * Capture API route errors with context
 * Use in API routes for consistent error handling
 */
function captureApiError(error, routePath, method, additionalContext) {
    var errorObj = error instanceof Error ? error : new Error(String(error));
    Sentry.captureException(errorObj, {
        tags: {
            type: 'api_error',
            route: routePath,
            method: method,
        },
        contexts: {
            api: __assign({ path: routePath, method: method }, additionalContext),
        },
    });
}
/**
 * Capture database operation errors
 * Use when database queries fail
 */
function captureDatabaseError(error, operation, table, additionalContext) {
    var errorObj = error instanceof Error ? error : new Error(String(error));
    Sentry.captureException(errorObj, {
        tags: {
            type: 'database_error',
            operation: operation,
            table: table,
        },
        contexts: {
            database: __assign({ operation: operation, table: table }, additionalContext),
        },
    });
}
/**
 * Capture external service API errors
 * Use when calling third-party APIs (OpenAI, Anthropic, etc.)
 */
function captureExternalApiError(error, service, endpoint, additionalContext) {
    var errorObj = error instanceof Error ? error : new Error(String(error));
    Sentry.captureException(errorObj, {
        tags: {
            type: 'external_api_error',
            service: service,
            endpoint: endpoint,
        },
        contexts: {
            external_api: __assign({ service: service, endpoint: endpoint }, additionalContext),
        },
    });
}
/**
 * Capture performance-related issues
 * Use for tracking slow operations
 */
function capturePerformanceIssue(operation, duration, threshold, additionalContext) {
    if (duration > threshold) {
        Sentry.captureMessage("Performance issue: ".concat(operation, " took ").concat(duration, "ms (threshold: ").concat(threshold, "ms)"), 'warning');
        Sentry.addBreadcrumb({
            category: 'performance',
            message: operation,
            level: 'warning',
            data: __assign({ duration: duration, threshold: threshold, exceeded: true }, additionalContext),
        });
    }
}
/**
 * Capture validation errors
 * Use for input validation failures
 */
function captureValidationError(field, error, value) {
    Sentry.captureMessage("Validation error: ".concat(field, " - ").concat(error), 'info');
    Sentry.addBreadcrumb({
        category: 'validation',
        message: "Invalid ".concat(field),
        level: 'info',
        data: {
            field: field,
            error: error,
            value: value ? String(value).substring(0, 100) : undefined,
        },
    });
}
/**
 * Set user context for better error tracking
 * Call after user authentication
 */
function setSentryUser(userId, email, username) {
    Sentry.setUser({
        id: userId,
        email: email,
        username: username,
    });
}
/**
 * Clear user context on logout
 */
function clearSentryUser() {
    Sentry.setUser(null);
}
/**
 * Add breadcrumb for tracking user actions
 */
function addSentryBreadcrumb(message, category, level, data) {
    if (category === void 0) { category = 'user-action'; }
    if (level === void 0) { level = 'info'; }
    Sentry.addBreadcrumb({
        message: message,
        category: category,
        level: level,
        data: data,
    });
}
/**
 * Capture custom metrics
 * Use for business metrics and tracking
 */
function captureMetric(name, value, tags) {
    Sentry.captureMessage("Metric: ".concat(name, " = ").concat(value), 'info');
    Sentry.addBreadcrumb({
        category: 'metric',
        message: name,
        level: 'info',
        data: __assign({ name: name, value: value }, tags),
    });
}
/**
 * Start a transaction for performance monitoring
 * Returns object with methods to update transaction
 */
function startTransaction(operationName, description) {
    var transaction = Sentry.captureMessage(description, 'info');
    // Use monitoring wrapper as alternative
    var startTime = Date.now();
    return {
        end: function () {
            var duration = Date.now() - startTime;
            Sentry.addBreadcrumb({
                category: 'performance',
                message: "".concat(operationName, ": ").concat(duration, "ms"),
                level: 'info',
                data: {
                    operation: operationName,
                    duration: duration,
                },
            });
        },
        setTag: function (key, value) {
            // Tags can be set via breadcrumb data
        },
        setData: function (key, value) {
            // Data is included in breadcrumb
        },
    };
}
/**
 * Wrap an async function with Sentry error tracking
 */
function withSentryErrorTracking(fn, context) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1, errorObj;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fn()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_1 = _a.sent();
                    errorObj = error_1 instanceof Error ? error_1 : new Error(String(error_1));
                    Sentry.captureException(errorObj, {
                        tags: __assign({ operation: context.operation }, context.tags),
                        contexts: {
                            operation: __assign({ name: context.operation }, context.data),
                        },
                    });
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Wrap a sync function with Sentry error tracking
 */
function withSentryErrorTrackingSync(fn, context) {
    try {
        return fn();
    }
    catch (error) {
        var errorObj = error instanceof Error ? error : new Error(String(error));
        Sentry.captureException(errorObj, {
            tags: __assign({ operation: context.operation }, context.tags),
            contexts: {
                operation: __assign({ name: context.operation }, context.data),
            },
        });
        throw error;
    }
}
