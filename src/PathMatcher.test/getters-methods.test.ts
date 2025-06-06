import { PathMatcher } from '../PathMatcher'
import { assertEquals, runTest, assert } from '../utils.test'

export async function runGettersMethodsTests() {
  console.log('🧪 Running Getters and Methods Tests')

  // Test targetsCount getter in static mode
  await runTest('targetsCount getter - empty matcher', () => {
    const matcher = new PathMatcher<string>()
    assertEquals(matcher.targetsCount, 0, 'Empty matcher should have 0 targets')
  })

  await runTest('targetsCount getter - single target', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('user/profile', 'handler1')
    assertEquals(matcher.targetsCount, 1, 'Matcher with single target should have count 1')
  })

  await runTest('targetsCount getter - multiple targets on same matcher', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.addTarget('api/users', 'handler2')
    assertEquals(matcher.targetsCount, 2, 'Matcher should count all targets on same path')
  })

  await runTest('targetsCount getter - multiple matchers', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.addTarget('api/posts', 'handler2')
    matcher.addTarget('api/users', 'handler3')
    assertEquals(matcher.targetsCount, 3, 'Should count targets across multiple matchers')
  })

  await runTest('targetsCount getter - after removing targets', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.addTarget('api/users', 'handler2')
    assertEquals(matcher.targetsCount, 2, 'Should have 2 targets initially')
    
    matcher.removeTarget('api/users', 'handler1')
    assertEquals(matcher.targetsCount, 1, 'Should have 1 target after removal')
  })

  await runTest('targetsCount getter - targets with limited matches', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTargetOnce('api/temp', 'temp-handler')
    matcher.addTargetMany('api/limited', 2, 'limited-handler')
    assertEquals(matcher.targetsCount, 2, 'Should count limited targets initially')

    // After matching once, the once target should be removed
    matcher.match('api/temp')
    assertEquals(matcher.targetsCount, 1, 'Should have 1 target after once target is consumed')

    // After matching twice, the many target should be removed
    matcher.match('api/limited')
    matcher.match('api/limited')
    assertEquals(matcher.targetsCount, 0, 'Should have 0 targets after all limited targets consumed')
  })

  // Test targets getter in static mode
  await runTest('targets getter - empty matcher', () => {
    const matcher = new PathMatcher<string>()
    assertEquals(matcher.targets.length, 0, 'Empty matcher should return empty targets array')
  })

  await runTest('targets getter - all targets', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.addTarget('api/posts', 'handler2')
    matcher.addTarget('api/users', 'handler3')
    
    const targets = matcher.targets
    assertEquals(targets.length, 3, 'Should return all 3 targets')
    assert(targets.includes('handler1'), 'Should contain handler1')
    assert(targets.includes('handler2'), 'Should contain handler2')
    assert(targets.includes('handler3'), 'Should contain handler3')
  })

  await runTest('targets getter - preserve order with prepend', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.prependTarget('api/users', 'handler0')
    matcher.addTarget('api/users', 'handler2')
    
    const targets = matcher.targets
    assertEquals(targets[0], 'handler0', 'First target should be prepended one')
    assertEquals(targets[1], 'handler1', 'Second target should be original first')
    assertEquals(targets[2], 'handler2', 'Third target should be added last')
  })

  // Test matchers getter in static mode
  await runTest('matchers getter - empty matcher', () => {
    const matcher = new PathMatcher<string>()
    assertEquals(matcher.matchers.length, 0, 'Empty matcher should return empty matchers array')
  })

  await runTest('matchers getter - unique matchers', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.addTarget('api/posts', 'handler2')
    matcher.addTarget('api/users', 'handler3')
    
    const matchers = matcher.matchers
    assertEquals(matchers.length, 2, 'Should return 2 unique matchers')
    assert(matchers.includes('api/users'), 'Should contain api/users matcher')
    assert(matchers.includes('api/posts'), 'Should contain api/posts matcher')
  })

  // Test hasMatchers method in static mode
  await runTest('hasMatchers method - empty array', () => {
    const matcher = new PathMatcher<string>()
    assertEquals(matcher.hasMatchers([]), true, 'Should return true for empty array')
  })

  await runTest('hasMatchers method - non-existent matcher', () => {
    const matcher = new PathMatcher<string>()
    assertEquals(matcher.hasMatchers(['api/users']), false, 'Should return false for non-existent matcher')
  })

  await runTest('hasMatchers method - existing matcher', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    assertEquals(matcher.hasMatchers(['api/users']), true, 'Should return true for existing matcher')
  })

  await runTest('hasMatchers method - all matchers exist', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.addTarget('api/posts', 'handler2')
    assertEquals(matcher.hasMatchers(['api/users', 'api/posts']), true, 'Should return true when all matchers exist')
  })

  await runTest('hasMatchers method - some matchers do not exist', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    assertEquals(matcher.hasMatchers(['api/users', 'api/posts']), false, 'Should return false when some matchers do not exist')
  })

  await runTest('hasMatchers method - matcher with no targets', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.removeTarget('api/users', 'handler1')
    assertEquals(matcher.hasMatchers(['api/users']), false, 'Should return false for matcher with no targets')
  })

  // Test advanced mode with wildcards
  await runTest('targetsCount getter - wildcard matchers', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    assertEquals(matcher.targetsCount, 0, 'Empty wildcard matcher should have 0 targets')
    
    matcher.addTarget('api/*', 'wildcard-handler')
    matcher.addTarget('admin/**', 'globstar-handler')
    assertEquals(matcher.targetsCount, 2, 'Should count wildcard targets correctly')
  })

  await runTest('targets getter - with params enabled', () => {
    const matcher = new PathMatcher<string>({ useParams: true })
    matcher.addTarget('user/:id', 'user-handler')
    matcher.addTarget('api/:version/users', 'api-handler')
    
    const targets = matcher.targets
    assertEquals(targets.length, 2, 'Should return all targets with params')
    assert(targets.includes('user-handler'), 'Should contain user-handler')
    assert(targets.includes('api-handler'), 'Should contain api-handler')
  })

  await runTest('matchers getter - with wildcards', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('api/*', 'handler1')
    matcher.addTarget('admin/**', 'handler2')
    matcher.addTarget('api/*', 'handler3')
    
    const matchers = matcher.matchers
    assertEquals(matchers.length, 2, 'Should return unique wildcard matchers')
    assert(matchers.includes('api/*'), 'Should contain api/* matcher')
    assert(matchers.includes('admin/**'), 'Should contain admin/** matcher')
  })

  await runTest('hasMatchers method - with params', () => {
    const matcher = new PathMatcher<string>({ useParams: true })
    matcher.addTarget('user/:id', 'user-handler')
    matcher.addTarget('api/:version/users/:userId', 'api-handler')
    
    assertEquals(matcher.hasMatchers(['user/:id']), true, 'Should work with parameter matchers')
    assertEquals(matcher.hasMatchers(['user/:id', 'api/:version/users/:userId']), true, 'Should work with multiple parameter matchers')
    assertEquals(matcher.hasMatchers(['user/:id', 'nonexistent']), false, 'Should return false when some parameter matchers do not exist')
  })

  await runTest('combined wildcards and params', () => {
    const matcher = new PathMatcher<string>({ 
      useWildcards: true, 
      useParams: true 
    })
    
    matcher.addTarget('user/:id/*', 'user-wildcard')
    matcher.addTarget('*/users/:userId', 'namespace-user')
    matcher.addTarget('admin/**', 'admin-all')
    
    assertEquals(matcher.targetsCount, 3, 'Should count mixed targets correctly')
    
    const targets = matcher.targets
    assertEquals(targets[0], 'user-wildcard', 'Should preserve order for mixed targets')
    assertEquals(targets[1], 'namespace-user', 'Should preserve order for mixed targets')
    assertEquals(targets[2], 'admin-all', 'Should preserve order for mixed targets')
    
    assertEquals(matcher.matchers.length, 3, 'Should return all unique mixed matchers')
    assertEquals(matcher.hasMatchers(['user/:id/*', 'admin/**']), true, 'Should work with mixed matchers')
    assertEquals(matcher.hasMatchers(['user/:id/*', 'nonexistent']), false, 'Should return false for non-existent mixed matchers')
  })

  // Test cross-mode behavior
  await runTest('cross-mode consistency', () => {
    // Static mode
    const staticMatcher = new PathMatcher<string>()
    staticMatcher.addTarget('api/users', 'handler1')
    staticMatcher.addTarget('api/posts', 'handler2')
    
    // Advanced mode with same patterns
    const advancedMatcher = new PathMatcher<string>({ useWildcards: true })
    advancedMatcher.addTarget('api/users', 'handler1')
    advancedMatcher.addTarget('api/posts', 'handler2')
    
    assertEquals(staticMatcher.targetsCount, advancedMatcher.targetsCount, 'Target counts should match across modes')
    assertEquals(staticMatcher.targets.length, advancedMatcher.targets.length, 'Target arrays should have same length')
    assertEquals(staticMatcher.matchers.length, advancedMatcher.matchers.length, 'Matcher arrays should have same length')
    assertEquals(
      staticMatcher.hasMatchers(['api/users', 'api/posts']), 
      advancedMatcher.hasMatchers(['api/users', 'api/posts']),
      'hasMatchers should work consistently across modes'
    )
  })

  // Test edge cases
  await runTest('prepended targets order and count', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.prependTarget('api/users', 'handler0')
    matcher.addTarget('api/users', 'handler2')
    
    assertEquals(matcher.targetsCount, 3, 'Should count prepended targets correctly')
    const targets = matcher.targets
    assertEquals(targets[0], 'handler0', 'Prepended target should be first')
    assertEquals(targets[1], 'handler1', 'Original target should be in middle')
    assertEquals(targets[2], 'handler2', 'Added target should be last')
  })

  await runTest('empty matcher string handling', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('', 'root-handler')
    
    assertEquals(matcher.targetsCount, 1, 'Should handle empty matcher string')
    assertEquals(matcher.targets[0], 'root-handler', 'Should return root handler for empty matcher')
    assertEquals(matcher.matchers[0], '', 'Should include empty string in matchers')
    assertEquals(matcher.hasMatchers(['']), true, 'Should recognize empty string matcher')
  })

  console.log('\n✅ All Getters and Methods tests completed!')
} 
