#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Get TypeScript errors
let tscOutput
try {
  tscOutput = execSync('npm run type-check 2>&1', { encoding: 'utf8' })
} catch (error) {
  tscOutput = error.stdout || ''
}

// Find all TS6133 errors (unused variables)
const unusedVarErrors = tscOutput
  .split('\n')
  .filter(line => line.includes('TS6133'))
  .filter(line => line.match(/^(app|components|lib|contexts)\//))
  .filter(line => !line.includes('test'))

console.log(`Found ${unusedVarErrors.length} unused variable errors`)

// Common patterns to fix
const fixes = [
  // Unused parameters - prefix with underscore
  {
    pattern: /(\w+): error TS6133: '(\w+)' is declared but its value is never read\./,
    replacement: (filePath, varName) => {
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Try to fix function parameters
      const paramPatterns = [
        new RegExp(`\\b${varName}\\b(?=\\s*[,:)])`, 'g'),  // function parameters
        new RegExp(`\\bconst\\s+${varName}\\b`, 'g'),      // const declarations
        new RegExp(`\\blet\\s+${varName}\\b`, 'g'),        // let declarations
      ]
      
      let newContent = content
      paramPatterns.forEach(pattern => {
        newContent = newContent.replace(pattern, match => {
          if (match.includes('const ') || match.includes('let ')) {
            return match.replace(varName, `_${varName}`)
          }
          return `_${varName}`
        })
      })
      
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent)
        return true
      }
      return false
    }
  }
]

let fixedCount = 0

unusedVarErrors.forEach(errorLine => {
  const match = errorLine.match(/^(.+?)\(\d+,\d+\): error TS6133: '(.+?)' is declared but its value is never read\./)
  if (match) {
    const filePath = match[1]
    const varName = match[2]
    
    // Skip certain common variables that shouldn't be prefixed
    if (['error', 'result', 'data', 'response'].includes(varName)) {
      return
    }
    
    try {
      if (fixes[0].replacement(filePath, varName)) {
        fixedCount++
        console.log(`Fixed unused variable '${varName}' in ${filePath}`)
      }
    } catch (err) {
      console.error(`Error fixing ${filePath}: ${err.message}`)
    }
  }
})

console.log(`Fixed ${fixedCount} unused variable errors`)