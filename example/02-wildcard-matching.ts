import { PathMatcher } from '../src'

export function wildcardMatchingExample() {
  console.log('🌟 Wildcard Matching Example')
  console.log('=' .repeat(40))
  
  const matcher = new PathMatcher<string>({ useWildcards: true })
  
  // Add wildcard patterns
  matcher.addTarget('api/*/data', 'api-data-handler')
  matcher.addTarget('admin/**', 'admin-handler')
  matcher.addTarget('**/logs', 'logs-handler')
  matcher.addTarget('*', 'single-level-handler')
  matcher.addTarget('**', 'global-handler')
  matcher.addTarget('user/*/settings/*', 'user-settings-handler')
  
  // Test paths
  const testPaths = [
    'api/v1/data',           // Matches 'api/*/data', '*', '**'
    'api/v2/data',           // Matches 'api/*/data', '*', '**'
    'admin/users/list',      // Matches 'admin/**', '**'
    'admin/settings',        // Matches 'admin/**', '**'
    'app/system/logs',       // Matches '**/logs', '**'
    'system/logs',           // Matches '**/logs', '**'
    'logs',                  // Matches '**/logs', '*', '**'
    'anything',              // Matches '*', '**'
    'user/123/settings/ui',  // Matches 'user/*/settings/*', '**'
    'deep/nested/path/logs', // Matches '**/logs', '**'
  ]
  
  testPaths.forEach(path => {
    const results = matcher.match(path)
    console.log(`Path: "${path}"`)
    if (results.length > 0) {
      results.forEach(result => {
        console.log(`  ✅ Matched pattern: "${result.matcher}" -> ${result.target}`)
      })
    } else {
      console.log(`  ❌ No matches found`)
    }
    console.log()
  })
  
  // Demonstrate pattern-to-pattern matching
  console.log('🔍 Pattern-to-Pattern Matching:')
  matcher.addTarget('user/admin/profile', 'admin-profile')
  matcher.addTarget('user/guest/profile', 'guest-profile')
  matcher.addTarget('user/manager/settings', 'manager-settings')
  
  const patternResults = matcher.match('user/*/profile')
  console.log(`Pattern: "user/*/profile" finds ${patternResults.length} matches:`)
  patternResults.forEach(result => {
    console.log(`  ➜ ${result.matcher} -> ${result.target}`)
  })
  
  console.log()
} 
