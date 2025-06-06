import { PathMatcher } from '../src'

export function combinedFeaturesExample() {
  console.log('🚀 Combined Wildcards & Parameters Example')
  console.log('=' .repeat(50))
  
  const matcher = new PathMatcher<string>({
    useWildcards: true,
    useParams: true
  })
  
  // Add complex patterns combining wildcards and parameters
  matcher.addTarget('user/:id/*', 'user-wildcard-handler')
  matcher.addTarget('*/users/:userId', 'namespace-user-handler')
  matcher.addTarget('api/:version/**/user/:id/*', 'complex-api-handler')
  matcher.addTarget('shop/:store/**/:type/:id', 'shop-resource-handler')
  matcher.addTarget(':namespace/config/**', 'config-handler')
  matcher.addTarget('**/events/:eventType/:id', 'event-handler')
  
  // Test complex scenarios
  const testPaths = [
    'user/123/profile',
    'user/456/settings/advanced',
    'admin/users/user789',
    'public/users/guest123',
    'api/v2/auth/middleware/user/user789/data',
    'api/v1/deep/nested/path/user/abc/info',
    'shop/store1/products/electronics/product/item123',
    'shop/store2/categories/books/subcategory/fiction/product/book456',
    'myapp/config/database/connection',
    'system/config/logging/level',
    'app/events/user-created/evt123',
    'deep/nested/events/order-completed/order456'
  ]
  
  testPaths.forEach(path => {
    const results = matcher.match(path)
    console.log(`Path: "${path}"`)
    if (results.length > 0) {
      results.forEach(result => {
        console.log(`  ✅ Matched: "${result.matcher}" -> ${result.target}`)
        if (result.params && Object.keys(result.params).length > 0) {
          console.log(`     Parameters:`, result.params)
        }
      })
    } else {
      console.log(`  ❌ No matches found`)
    }
    console.log()
  })
  
  // Demonstrate pattern priority and multiple matches
  console.log('⚡ Priority & Multiple Matches:')
  matcher.addTarget('user/:id/profile', 'specific-profile-handler')
  
  const profileResults = matcher.match('user/123/profile')
  console.log(`Path: "user/123/profile" (${profileResults.length} handlers)`)
  profileResults.forEach((result, index) => {
    console.log(`  ${index + 1}. "${result.matcher}" -> ${result.target}`)
    if (result.params) {
      console.log(`     Parameters:`, result.params)
    }
  })
  
  console.log()
} 
