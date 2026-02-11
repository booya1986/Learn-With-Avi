#!/usr/bin/env node

/**
 * Documentation Validation Script
 *
 * Validates that exported functions, classes, and components have TSDoc/JSDoc comments.
 * Enforces documentation standards across the codebase.
 *
 * Usage:
 *   npx tsx scripts/validate-docs.ts
 *   npx tsx scripts/validate-docs.ts --strict  # Fail on warnings
 *   npx tsx scripts/validate-docs.ts --path src/hooks  # Check specific directory
 *
 * Exit Codes:
 *   0 - All checks passed
 *   1 - Missing documentation found
 *
 * @see {@link https://tsdoc.org/} - TSDoc standards
 */

import * as fs from 'fs'
import * as path from 'path'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

interface ValidationError {
  file: string
  line: number
  name: string
  type: 'function' | 'class' | 'interface' | 'type' | 'const'
  severity: 'error' | 'warning'
  message: string
}

interface ValidationStats {
  totalFiles: number
  filesChecked: number
  totalExports: number
  documented: number
  undocumented: number
  errors: ValidationError[]
  warnings: ValidationError[]
}

const stats: ValidationStats = {
  totalFiles: 0,
  filesChecked: 0,
  totalExports: 0,
  documented: 0,
  undocumented: 0,
  errors: [],
  warnings: [],
}

/**
 * Check if a line is inside a JSDoc/TSDoc comment
 */
function isInsideComment(content: string, position: number): boolean {
  const beforePosition = content.substring(0, position)
  const lastCommentStart = beforePosition.lastIndexOf('/**')
  const lastCommentEnd = beforePosition.lastIndexOf('*/')

  return lastCommentStart > lastCommentEnd
}

/**
 * Find the line number for a given position in the content
 */
function getLineNumber(content: string, position: number): number {
  const beforePosition = content.substring(0, position)
  return (beforePosition.match(/\n/g) || []).length + 1
}

/**
 * Check if an export has a JSDoc/TSDoc comment above it
 */
function hasJSDocComment(content: string, exportMatch: RegExpMatchArray): boolean {
  const exportPosition = exportMatch.index!
  const beforeExport = content.substring(0, exportPosition)

  // Look for JSDoc comment immediately before the export (allowing whitespace)
  const jsDocPattern = /\/\*\*[\s\S]*?\*\/\s*$/
  return jsDocPattern.test(beforeExport)
}

/**
 * Extract the JSDoc comment content if it exists
 */
function getJSDocContent(content: string, exportMatch: RegExpMatchArray): string | null {
  const exportPosition = exportMatch.index!
  const beforeExport = content.substring(0, exportPosition)

  const jsDocMatch = beforeExport.match(/\/\*\*([\s\S]*?)\*\/\s*$/)
  return jsDocMatch ? jsDocMatch[1] : null
}

/**
 * Check JSDoc quality (optional - warns if minimal)
 */
function checkJSDocQuality(jsDocContent: string, exportName: string, exportType: string): string | null {
  const trimmed = jsDocContent.trim()

  // Check if it's just a single line with no description
  const lines = trimmed.split('\n').filter(line => line.trim() && !line.trim().startsWith('*'))

  if (lines.length === 0) {
    return `JSDoc comment is empty for ${exportType} "${exportName}"`
  }

  // Check for bare minimum (at least one @param or description)
  const hasDescription = /\*\s+\w+/.test(jsDocContent)
  const hasTags = /@(param|returns|description|example|throws)/.test(jsDocContent)

  if (!hasDescription && !hasTags) {
    return `JSDoc comment for ${exportType} "${exportName}" appears minimal (no description or tags)`
  }

  return null
}

/**
 * Validate a single TypeScript/TSX file
 */
function validateFile(filePath: string, strictMode: boolean): void {
  const content = fs.readFileSync(filePath, 'utf-8')
  const relativePath = path.relative(process.cwd(), filePath)

  stats.filesChecked++

  // Patterns for different export types
  const patterns = [
    {
      regex: /export\s+(async\s+)?function\s+(\w+)/g,
      type: 'function' as const,
    },
    {
      regex: /export\s+const\s+(\w+)\s*[:=]\s*(?:React\.)?(?:FC|memo|forwardRef)/g,
      type: 'const' as const, // React component
    },
    {
      regex: /export\s+const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g,
      type: 'function' as const, // Arrow function
    },
    {
      regex: /export\s+class\s+(\w+)/g,
      type: 'class' as const,
    },
    {
      regex: /export\s+interface\s+(\w+)/g,
      type: 'interface' as const,
    },
    {
      regex: /export\s+type\s+(\w+)/g,
      type: 'type' as const,
    },
  ]

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern.regex)

    for (const match of matches) {
      const exportName = match[2] || match[1] // function name or const name
      const exportType = pattern.type

      stats.totalExports++

      const hasDoc = hasJSDocComment(content, match)

      if (hasDoc) {
        stats.documented++

        // Quality check (warnings only)
        if (strictMode) {
          const jsDocContent = getJSDocContent(content, match)
          if (jsDocContent) {
            const qualityIssue = checkJSDocQuality(jsDocContent, exportName, exportType)
            if (qualityIssue) {
              const lineNumber = getLineNumber(content, match.index!)
              stats.warnings.push({
                file: relativePath,
                line: lineNumber,
                name: exportName,
                type: exportType,
                severity: 'warning',
                message: qualityIssue,
              })
            }
          }
        }
      } else {
        stats.undocumented++

        const lineNumber = getLineNumber(content, match.index!)
        stats.errors.push({
          file: relativePath,
          line: lineNumber,
          name: exportName,
          type: exportType,
          severity: 'error',
          message: `Missing JSDoc comment for exported ${exportType}`,
        })
      }
    }
  }
}

/**
 * Recursively find all TypeScript files in a directory
 */
function findTypeScriptFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // Skip node_modules, .next, dist, etc.
      if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(entry.name)) {
        findTypeScriptFiles(fullPath, files)
      }
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      // Skip test files and declaration files
      if (!/\.(test|spec|d)\.tsx?$/.test(entry.name)) {
        files.push(fullPath)
      }
    }
  }

  return files
}

/**
 * Print validation results
 */
function printResults(strictMode: boolean): void {
  console.log('\n' + colors.cyan + '━'.repeat(70) + colors.reset)
  console.log(colors.cyan + '  Documentation Validation Report' + colors.reset)
  console.log(colors.cyan + '━'.repeat(70) + colors.reset + '\n')

  // Summary statistics
  console.log(colors.blue + '📊 Summary:' + colors.reset)
  console.log(`  Files checked: ${stats.filesChecked}`)
  console.log(`  Total exports: ${stats.totalExports}`)
  console.log(`  Documented: ${colors.green}${stats.documented}${colors.reset} (${Math.round((stats.documented / stats.totalExports) * 100)}%)`)
  console.log(`  Undocumented: ${colors.red}${stats.undocumented}${colors.reset} (${Math.round((stats.undocumented / stats.totalExports) * 100)}%)`)
  console.log()

  // Errors
  if (stats.errors.length > 0) {
    console.log(colors.red + '❌ Missing Documentation (' + stats.errors.length + '):' + colors.reset)

    // Group by file
    const errorsByFile = new Map<string, ValidationError[]>()
    for (const error of stats.errors) {
      if (!errorsByFile.has(error.file)) {
        errorsByFile.set(error.file, [])
      }
      errorsByFile.get(error.file)!.push(error)
    }

    for (const [file, errors] of errorsByFile) {
      console.log(`\n  ${colors.gray}${file}${colors.reset}`)
      for (const error of errors) {
        console.log(`    ${colors.red}${error.line}:${colors.reset} ${error.type} ${colors.yellow}"${error.name}"${colors.reset} - ${error.message}`)
      }
    }
    console.log()
  }

  // Warnings
  if (strictMode && stats.warnings.length > 0) {
    console.log(colors.yellow + '⚠️  Documentation Quality Issues (' + stats.warnings.length + '):' + colors.reset)

    const warningsByFile = new Map<string, ValidationError[]>()
    for (const warning of stats.warnings) {
      if (!warningsByFile.has(warning.file)) {
        warningsByFile.set(warning.file, [])
      }
      warningsByFile.get(warning.file)!.push(warning)
    }

    for (const [file, warnings] of warningsByFile) {
      console.log(`\n  ${colors.gray}${file}${colors.reset}`)
      for (const warning of warnings) {
        console.log(`    ${colors.yellow}${warning.line}:${colors.reset} ${warning.message}`)
      }
    }
    console.log()
  }

  // Final status
  console.log(colors.cyan + '━'.repeat(70) + colors.reset)
  if (stats.errors.length === 0) {
    console.log(colors.green + '✅ All exported items are documented!' + colors.reset)
  } else {
    console.log(colors.red + `❌ Found ${stats.errors.length} undocumented exports` + colors.reset)
  }
  console.log(colors.cyan + '━'.repeat(70) + colors.reset + '\n')
}

/**
 * Main execution
 */
function main(): void {
  const args = process.argv.slice(2)
  const strictMode = args.includes('--strict')
  const pathIndex = args.indexOf('--path')
  const targetPath = pathIndex !== -1 && args[pathIndex + 1]
    ? path.resolve(process.cwd(), args[pathIndex + 1])
    : path.resolve(process.cwd(), 'src')

  console.log(colors.blue + '\n🔍 Starting documentation validation...' + colors.reset)
  console.log(`   Target: ${colors.gray}${path.relative(process.cwd(), targetPath)}${colors.reset}`)
  console.log(`   Mode: ${strictMode ? colors.yellow + 'strict' + colors.reset : 'normal'}`)
  console.log()

  // Find all TypeScript files (handle both file and directory paths)
  let files: string[];
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    files = /\.(ts|tsx)$/.test(targetPath) ? [targetPath] : [];
  } else {
    files = findTypeScriptFiles(targetPath);
  }
  stats.totalFiles = files.length

  console.log(`   Found ${colors.cyan}${files.length}${colors.reset} TypeScript files\n`)

  // Validate each file
  for (const file of files) {
    validateFile(file, strictMode)
  }

  // Print results
  printResults(strictMode)

  // Exit with error code if undocumented exports found
  if (stats.errors.length > 0) {
    process.exit(1)
  }

  if (strictMode && stats.warnings.length > 0) {
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { validateFile, findTypeScriptFiles, ValidationError, ValidationStats }
