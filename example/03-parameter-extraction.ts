import { PathMatcher } from '../src'

export function parameterExtractionExample() {
  console.log('📦 Parameter Extraction Example')
  console.log('=' .repeat(40))
  
  const matcher = new PathMatcher<string>({ useParams: true })
  
  // Add patterns with parameters
  matcher.addTarget('user/:id', 'user-handler')
  matcher.addTarget('api/:version/users/:userId', 'api-user-handler')
  matcher.addTarget('shop/:store/product/:productId/review/:reviewId', 'review-handler')
  matcher.addTarget('blog/:year/:month/:slug', 'blog-post-handler')
  matcher.addTarget('file/:name.:extension', 'file-handler')
  
  // Test paths with parameter extraction
  const testPaths = [
    'user/123',
    'user/john-doe',
    'api/v2/users/user456',
    'api/v1/users/admin',
    'shop/store1/product/prod123/review/rev456',
    'blog/2024/03/my-awesome-post',
    'file/document.pdf',
    'file/image.jpg',
    'user', // Should not match (missing parameter)
    'api/v2/users' // Should not match (missing userId)
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
  
  // Demonstrate parameter validation scenarios
  console.log('🔍 Parameter Edge Cases:')
  
  // Test with empty parameter values
  const edgeCases = [
    'user/',        // Empty parameter
    'user//extra',  // Double slash
    'api//users/123' // Empty version parameter
  ]
  
  edgeCases.forEach(path => {
    const results = matcher.match(path)
    console.log(`Edge case: "${path}" -> ${results.length} matches`)
    results.forEach(result => {
      console.log(`  Parameters:`, result.params)
    })
  })
  
  console.log()
} 
