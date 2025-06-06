import { PathMatcher } from '../src'

export function basicPathMatchingExample() {
  console.log('🎯 Basic Path Matching Example')
  console.log('=' .repeat(40))
  
  const matcher = new PathMatcher<string>()
  
  // Add some targets
  matcher.addTarget('user/profile', 'user-profile-handler')
  matcher.addTarget('admin/settings', 'admin-settings-handler')
  matcher.addTarget('api/users', 'api-users-handler')
  matcher.addTarget('api/posts', 'api-posts-handler')
  
  // Test exact matches
  const testPaths = [
    'user/profile',
    'admin/settings',
    'api/users',
    'api/posts',
    'user/settings', // No match
    'unknown/path'   // No match
  ]
  
  testPaths.forEach(path => {
    const results = matcher.match(path)
    console.log(`Path: "${path}"`)
    if (results.length > 0) {
      results.forEach(result => {
        console.log(`  ✅ Matched: "${result.matcher}" -> ${result.target}`)
      })
    } else {
      console.log(`  ❌ No matches found`)
    }
    console.log()
  })
  
  // Demonstrate multiple targets for same pattern
  console.log('📚 Multiple Targets Example:')
  matcher.addTarget('api/data', 'handler-1')
  matcher.addTarget('api/data', 'handler-2')
  matcher.addTarget('api/data', 'handler-3')
  
  const multiResults = matcher.match('api/data')
  console.log(`Path: "api/data" (${multiResults.length} handlers)`)
  multiResults.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.target}`)
  })
  
  console.log()
} 
