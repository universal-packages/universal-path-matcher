import { PathMatcher } from '../PathMatcher'
import { assert, assertEquals, runTest } from '../utils.test'

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

  // Test getTargetsCount method in static mode
  await runTest('getTargetsCount method - no arguments (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.addTarget('api/posts', 'handler2')
    assertEquals(matcher.getTargetsCount(), 2, 'Should return same as targetsCount getter when no arguments')
    assertEquals(matcher.getTargetsCount(), matcher.targetsCount, 'Should match targetsCount getter exactly')
  })

  await runTest('getTargetsCount method - specific matcher (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.addTarget('api/users', 'handler2')
    matcher.addTarget('api/posts', 'handler3')

    assertEquals(matcher.getTargetsCount('api/users'), 2, 'Should return 2 targets for api/users')
    assertEquals(matcher.getTargetsCount('api/posts'), 1, 'Should return 1 target for api/posts')
    assertEquals(matcher.getTargetsCount('api/comments'), 0, 'Should return 0 for non-existent matcher')
  })

  await runTest('getTargetsCount method - empty matcher string (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('', 'root-handler')
    matcher.addTarget('', 'root-handler2')

    assertEquals(matcher.getTargetsCount(''), 2, 'Should count targets for empty matcher string')
    assertEquals(matcher.getTargetsCount('api'), 0, 'Should return 0 for non-existent matcher')
  })

  await runTest('getTargetsCount method - after target removal (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.addTarget('api/users', 'handler2')
    matcher.addTarget('api/posts', 'handler3')

    assertEquals(matcher.getTargetsCount('api/users'), 2, 'Should have 2 targets initially')

    matcher.removeTarget('api/users', 'handler1')
    assertEquals(matcher.getTargetsCount('api/users'), 1, 'Should have 1 target after removal')

    matcher.removeTarget('api/users', 'handler2')
    assertEquals(matcher.getTargetsCount('api/users'), 0, 'Should have 0 targets after removing all')
  })

  await runTest('getTargetsCount method - with limited targets (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTargetOnce('api/temp', 'temp-handler')
    matcher.addTargetMany('api/temp', 2, 'limited-handler')
    matcher.addTarget('api/temp', 'regular-handler')

    assertEquals(matcher.getTargetsCount('api/temp'), 3, 'Should count all target types initially')

    // Match once - should remove once target but keep others
    matcher.match('api/temp')
    assertEquals(matcher.getTargetsCount('api/temp'), 2, 'Should have 2 targets after once target consumed')

    // Match twice more - should remove many target
    matcher.match('api/temp')
    matcher.match('api/temp')
    assertEquals(matcher.getTargetsCount('api/temp'), 1, 'Should have 1 target after limited targets consumed')
  })

  await runTest('getTargetsCount method - with prepended targets (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/data', 'handler1')
    matcher.prependTarget('api/data', 'handler0')
    matcher.addTarget('api/data', 'handler2')

    assertEquals(matcher.getTargetsCount('api/data'), 3, 'Should count prepended targets correctly')
  })

  // Test getTargetsCount method in advanced mode (wildcards)
  await runTest('getTargetsCount method - wildcard mode', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('api/*', 'wildcard-handler1')
    matcher.addTarget('api/*', 'wildcard-handler2')
    matcher.addTarget('admin/**', 'globstar-handler')

    assertEquals(matcher.getTargetsCount(), 3, 'Should return total count when no arguments')
    assertEquals(matcher.getTargetsCount('api/*'), 2, 'Should return 2 targets for api/* matcher')
    assertEquals(matcher.getTargetsCount('admin/**'), 1, 'Should return 1 target for admin/** matcher')
    assertEquals(matcher.getTargetsCount('nonexistent'), 0, 'Should return 0 for non-existent wildcard matcher')
  })

  // Test getTargetsCount method in advanced mode (params)
  await runTest('getTargetsCount method - params mode', () => {
    const matcher = new PathMatcher<string>({ useParams: true })
    matcher.addTarget('user/:id', 'user-handler1')
    matcher.addTarget('user/:id', 'user-handler2')
    matcher.addTarget('api/:version/users/:userId', 'api-handler')

    assertEquals(matcher.getTargetsCount(), 3, 'Should return total count when no arguments')
    assertEquals(matcher.getTargetsCount('user/:id'), 2, 'Should return 2 targets for user/:id matcher')
    assertEquals(matcher.getTargetsCount('api/:version/users/:userId'), 1, 'Should return 1 target for complex param matcher')
    assertEquals(matcher.getTargetsCount('user/:otherId'), 0, 'Should return 0 for different param name')
  })

  // Test getTargetsCount method in combined mode
  await runTest('getTargetsCount method - combined wildcards and params', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })
    matcher.addTarget('user/:id/*', 'user-wildcard1')
    matcher.addTarget('user/:id/*', 'user-wildcard2')
    matcher.addTarget('*/users/:userId', 'namespace-user')
    matcher.addTarget('admin/**', 'admin-all')

    assertEquals(matcher.getTargetsCount(), 4, 'Should return total count for combined mode')
    assertEquals(matcher.getTargetsCount('user/:id/*'), 2, 'Should count combined pattern targets')
    assertEquals(matcher.getTargetsCount('*/users/:userId'), 1, 'Should count wildcard-param pattern')
    assertEquals(matcher.getTargetsCount('admin/**'), 1, 'Should count globstar pattern')
    assertEquals(matcher.getTargetsCount('user/:id'), 0, 'Should return 0 for partial pattern match')
  })

  // Test cross-mode consistency for getTargetsCount
  await runTest('getTargetsCount method - cross-mode consistency', () => {
    // Static mode
    const staticMatcher = new PathMatcher<string>()
    staticMatcher.addTarget('api/users', 'handler1')
    staticMatcher.addTarget('api/users', 'handler2')
    staticMatcher.addTarget('api/posts', 'handler3')

    // Advanced mode with same patterns
    const advancedMatcher = new PathMatcher<string>({ useWildcards: true })
    advancedMatcher.addTarget('api/users', 'handler1')
    advancedMatcher.addTarget('api/users', 'handler2')
    advancedMatcher.addTarget('api/posts', 'handler3')

    assertEquals(staticMatcher.getTargetsCount(), advancedMatcher.getTargetsCount(), 'Total counts should match across modes')
    assertEquals(staticMatcher.getTargetsCount('api/users'), advancedMatcher.getTargetsCount('api/users'), 'Specific matcher counts should match')
    assertEquals(staticMatcher.getTargetsCount('api/posts'), advancedMatcher.getTargetsCount('api/posts'), 'Other matcher counts should match')
    assertEquals(staticMatcher.getTargetsCount('nonexistent'), advancedMatcher.getTargetsCount('nonexistent'), 'Non-existent matcher should return 0 in both modes')
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

  // Test getTargets method in static mode
  await runTest('getTargets method - no arguments (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.addTarget('api/users', 'handler2')
    matcher.addTarget('api/posts', 'handler3')

    const results = matcher.getTargets()
    assertEquals(results.length, 3, 'Should return all targets with their matchers')

    // Check that all targets are included with correct matchers
    const userTargets = results.filter((r) => r.matcher === 'api/users')
    const postTargets = results.filter((r) => r.matcher === 'api/posts')

    assertEquals(userTargets.length, 2, 'Should have 2 user targets')
    assertEquals(postTargets.length, 1, 'Should have 1 post target')

    assert(
      userTargets.some((r) => r.target === 'handler1'),
      'Should contain handler1 for api/users'
    )
    assert(
      userTargets.some((r) => r.target === 'handler2'),
      'Should contain handler2 for api/users'
    )
    assert(
      postTargets.some((r) => r.target === 'handler3'),
      'Should contain handler3 for api/posts'
    )
  })

  await runTest('getTargets method - specific matcher (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.addTarget('api/users', 'handler2')
    matcher.addTarget('api/posts', 'handler3')

    const userTargets = matcher.getTargets('api/users')
    assertEquals(userTargets.length, 2, 'Should return 2 targets for api/users')
    assertEquals(userTargets[0].matcher, 'api/users', 'First result should have correct matcher')
    assertEquals(userTargets[1].matcher, 'api/users', 'Second result should have correct matcher')
    assert(
      userTargets.some((r) => r.target === 'handler1'),
      'Should contain handler1'
    )
    assert(
      userTargets.some((r) => r.target === 'handler2'),
      'Should contain handler2'
    )

    const postTargets = matcher.getTargets('api/posts')
    assertEquals(postTargets.length, 1, 'Should return 1 target for api/posts')
    assertEquals(postTargets[0].matcher, 'api/posts', 'Result should have correct matcher')
    assertEquals(postTargets[0].target, 'handler3', 'Should contain handler3')

    const emptyTargets = matcher.getTargets('api/comments')
    assertEquals(emptyTargets.length, 0, 'Should return empty array for non-existent matcher')
  })

  await runTest('getTargets method - empty matcher string (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('', 'root-handler1')
    matcher.addTarget('', 'root-handler2')
    matcher.addTarget('api', 'api-handler')

    const rootTargets = matcher.getTargets('')
    assertEquals(rootTargets.length, 2, 'Should return 2 targets for empty matcher')
    assertEquals(rootTargets[0].matcher, '', 'Should have empty string matcher')
    assertEquals(rootTargets[1].matcher, '', 'Should have empty string matcher')
    assert(
      rootTargets.some((r) => r.target === 'root-handler1'),
      'Should contain root-handler1'
    )
    assert(
      rootTargets.some((r) => r.target === 'root-handler2'),
      'Should contain root-handler2'
    )
  })

  await runTest('getTargets method - preserve order with prepend (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/data', 'handler1')
    matcher.prependTarget('api/data', 'handler0')
    matcher.addTarget('api/data', 'handler2')

    const targets = matcher.getTargets('api/data')
    assertEquals(targets.length, 3, 'Should return all 3 targets')
    assertEquals(targets[0].target, 'handler0', 'First should be prepended target')
    assertEquals(targets[1].target, 'handler1', 'Second should be original first target')
    assertEquals(targets[2].target, 'handler2', 'Third should be last added target')

    // All should have the same matcher
    targets.forEach((target) => {
      assertEquals(target.matcher, 'api/data', 'All targets should have correct matcher')
    })
  })

  await runTest('getTargets method - after target removal (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler1')
    matcher.addTarget('api/users', 'handler2')
    matcher.addTarget('api/posts', 'handler3')

    // Before removal
    let targets = matcher.getTargets('api/users')
    assertEquals(targets.length, 2, 'Should have 2 targets initially')

    // After removing one target
    matcher.removeTarget('api/users', 'handler1')
    targets = matcher.getTargets('api/users')
    assertEquals(targets.length, 1, 'Should have 1 target after removal')
    assertEquals(targets[0].target, 'handler2', 'Should contain the remaining target')

    // After removing all targets from matcher
    matcher.removeTarget('api/users', 'handler2')
    targets = matcher.getTargets('api/users')
    assertEquals(targets.length, 0, 'Should have no targets after removing all')
  })

  // Test getTargets method in advanced mode (wildcards)
  await runTest('getTargets method - wildcard mode', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('api/*', 'wildcard-handler1')
    matcher.addTarget('api/*', 'wildcard-handler2')
    matcher.addTarget('admin/**', 'globstar-handler')

    // Get all targets
    const allTargets = matcher.getTargets()
    assertEquals(allTargets.length, 3, 'Should return all 3 targets')

    const apiTargets = allTargets.filter((r) => r.matcher === 'api/*')
    const adminTargets = allTargets.filter((r) => r.matcher === 'admin/**')

    assertEquals(apiTargets.length, 2, 'Should have 2 api/* targets')
    assertEquals(adminTargets.length, 1, 'Should have 1 admin/** target')

    // Get specific matcher targets
    const specificApiTargets = matcher.getTargets('api/*')
    assertEquals(specificApiTargets.length, 2, 'Should return 2 targets for api/*')
    assert(
      specificApiTargets.every((r) => r.matcher === 'api/*'),
      'All should have api/* matcher'
    )

    const specificAdminTargets = matcher.getTargets('admin/**')
    assertEquals(specificAdminTargets.length, 1, 'Should return 1 target for admin/**')
    assertEquals(specificAdminTargets[0].matcher, 'admin/**', 'Should have admin/** matcher')
  })

  // Test getTargets method in advanced mode (params)
  await runTest('getTargets method - params mode', () => {
    const matcher = new PathMatcher<string>({ useParams: true })
    matcher.addTarget('user/:id', 'user-handler1')
    matcher.addTarget('user/:id', 'user-handler2')
    matcher.addTarget('api/:version/users/:userId', 'api-handler')

    // Get all targets
    const allTargets = matcher.getTargets()
    assertEquals(allTargets.length, 3, 'Should return all 3 targets')

    // Get specific param matcher targets
    const userTargets = matcher.getTargets('user/:id')
    assertEquals(userTargets.length, 2, 'Should return 2 targets for user/:id')
    assert(
      userTargets.every((r) => r.matcher === 'user/:id'),
      'All should have user/:id matcher'
    )

    const apiTargets = matcher.getTargets('api/:version/users/:userId')
    assertEquals(apiTargets.length, 1, 'Should return 1 target for complex param matcher')
    assertEquals(apiTargets[0].matcher, 'api/:version/users/:userId', 'Should have correct complex matcher')

    // Non-existent param pattern
    const nonExistentTargets = matcher.getTargets('user/:otherId')
    assertEquals(nonExistentTargets.length, 0, 'Should return 0 for different param name')
  })

  // Test getTargets method in combined mode
  await runTest('getTargets method - combined wildcards and params', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })
    matcher.addTarget('user/:id/*', 'user-wildcard1')
    matcher.addTarget('user/:id/*', 'user-wildcard2')
    matcher.addTarget('*/users/:userId', 'namespace-user')
    matcher.addTarget('admin/**', 'admin-all')

    // Get all targets
    const allTargets = matcher.getTargets()
    assertEquals(allTargets.length, 4, 'Should return all 4 targets')

    // Verify different matcher patterns exist
    const matchers = new Set(allTargets.map((r) => r.matcher))
    assertEquals(matchers.size, 3, 'Should have 3 unique matchers')
    assert(matchers.has('user/:id/*'), 'Should include user/:id/* matcher')
    assert(matchers.has('*/users/:userId'), 'Should include */users/:userId matcher')
    assert(matchers.has('admin/**'), 'Should include admin/** matcher')

    // Get specific combined pattern targets
    const userWildcardTargets = matcher.getTargets('user/:id/*')
    assertEquals(userWildcardTargets.length, 2, 'Should return 2 targets for user/:id/*')
    assert(
      userWildcardTargets.every((r) => r.matcher === 'user/:id/*'),
      'All should have user/:id/* matcher'
    )
  })

  // Test cross-mode consistency for getTargets
  await runTest('getTargets method - cross-mode consistency', () => {
    // Static mode
    const staticMatcher = new PathMatcher<string>()
    staticMatcher.addTarget('api/users', 'handler1')
    staticMatcher.addTarget('api/users', 'handler2')
    staticMatcher.addTarget('api/posts', 'handler3')

    // Advanced mode with same patterns
    const advancedMatcher = new PathMatcher<string>({ useWildcards: true })
    advancedMatcher.addTarget('api/users', 'handler1')
    advancedMatcher.addTarget('api/users', 'handler2')
    advancedMatcher.addTarget('api/posts', 'handler3')

    const staticAllTargets = staticMatcher.getTargets()
    const advancedAllTargets = advancedMatcher.getTargets()

    assertEquals(staticAllTargets.length, advancedAllTargets.length, 'Should have same number of targets')

    const staticUserTargets = staticMatcher.getTargets('api/users')
    const advancedUserTargets = advancedMatcher.getTargets('api/users')

    assertEquals(staticUserTargets.length, advancedUserTargets.length, 'Should have same number of user targets')
    assertEquals(staticUserTargets.length, 2, 'Both should have 2 user targets')

    // Check that targets and matchers match
    staticUserTargets.forEach((staticTarget, index) => {
      assertEquals(staticTarget.matcher, advancedUserTargets[index].matcher, 'Matchers should match')
      assertEquals(staticTarget.target, advancedUserTargets[index].target, 'Targets should match')
    })
  })

  await runTest('getTargets method - limited targets behavior', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTargetOnce('api/temp', 'temp-handler')
    matcher.addTargetMany('api/temp', 2, 'limited-handler')
    matcher.addTarget('api/temp', 'regular-handler')

    // Before any matches - should show all targets
    let targets = matcher.getTargets('api/temp')
    assertEquals(targets.length, 3, 'Should show all targets initially')

    // Match once - should remove the once target
    matcher.match('api/temp')
    targets = matcher.getTargets('api/temp')
    assertEquals(targets.length, 2, 'Should have 2 targets after once target consumed')

    // Match twice more - should remove the many target
    matcher.match('api/temp')
    matcher.match('api/temp')
    targets = matcher.getTargets('api/temp')
    assertEquals(targets.length, 1, 'Should have 1 target after limited targets consumed')
    assertEquals(targets[0].target, 'regular-handler', 'Should only have the regular handler remaining')
  })

  // Test getTargets method with array of matchers
  await runTest('getTargets method - array of matchers (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'user-handler1')
    matcher.addTarget('api/users', 'user-handler2')
    matcher.addTarget('api/posts', 'post-handler')
    matcher.addTarget('api/comments', 'comment-handler1')
    matcher.addTarget('api/comments', 'comment-handler2')
    matcher.addTarget('admin/settings', 'admin-handler')

    // Get targets for multiple matchers
    const results = matcher.getTargets(['api/users', 'api/posts', 'api/comments'])
    assertEquals(results.length, 5, 'Should return targets from all specified matchers')

    // Verify results contain all expected targets
    const userTargets = results.filter((r) => r.matcher === 'api/users')
    const postTargets = results.filter((r) => r.matcher === 'api/posts')
    const commentTargets = results.filter((r) => r.matcher === 'api/comments')

    assertEquals(userTargets.length, 2, 'Should have 2 user targets')
    assertEquals(postTargets.length, 1, 'Should have 1 post target')
    assertEquals(commentTargets.length, 2, 'Should have 2 comment targets')

    // Admin target should not be included
    const adminTargets = results.filter((r) => r.matcher === 'admin/settings')
    assertEquals(adminTargets.length, 0, 'Should not include admin targets')
  })

  await runTest('getTargets method - array with non-existent matchers (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'user-handler')
    matcher.addTarget('api/posts', 'post-handler')

    // Mix of existing and non-existing matchers
    const results = matcher.getTargets(['api/users', 'api/nonexistent', 'api/posts', 'other/missing'])
    assertEquals(results.length, 2, 'Should return only targets from existing matchers')

    const matchers = results.map((r) => r.matcher)
    assert(matchers.includes('api/users'), 'Should include api/users')
    assert(matchers.includes('api/posts'), 'Should include api/posts')
    assert(!matchers.includes('api/nonexistent'), 'Should not include non-existent matchers')
    assert(!matchers.includes('other/missing'), 'Should not include missing matchers')
  })

  await runTest('getTargets method - empty array (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'user-handler')
    matcher.addTarget('api/posts', 'post-handler')

    const results = matcher.getTargets([])
    assertEquals(results.length, 0, 'Should return empty array for empty input array')
  })

  await runTest('getTargets method - array with duplicate matchers (static mode)', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'user-handler1')
    matcher.addTarget('api/users', 'user-handler2')
    matcher.addTarget('api/posts', 'post-handler')

    // Array with duplicate matchers
    const results = matcher.getTargets(['api/users', 'api/posts', 'api/users'])
    assertEquals(results.length, 5, 'Should return targets for each occurrence of matcher in array')

    const userTargets = results.filter((r) => r.matcher === 'api/users')
    const postTargets = results.filter((r) => r.matcher === 'api/posts')

    assertEquals(userTargets.length, 4, 'Should have 4 user targets (2 handlers × 2 occurrences)')
    assertEquals(postTargets.length, 1, 'Should have 1 post target')
  })

  await runTest('getTargets method - array of matchers (wildcard mode)', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('api/*', 'api-wildcard1')
    matcher.addTarget('api/*', 'api-wildcard2')
    matcher.addTarget('admin/**', 'admin-globstar')
    matcher.addTarget('user/:id/profile', 'user-profile')

    // Get multiple wildcard patterns
    const results = matcher.getTargets(['api/*', 'admin/**'])
    assertEquals(results.length, 3, 'Should return targets from wildcard matchers')

    const apiTargets = results.filter((r) => r.matcher === 'api/*')
    const adminTargets = results.filter((r) => r.matcher === 'admin/**')

    assertEquals(apiTargets.length, 2, 'Should have 2 api/* targets')
    assertEquals(adminTargets.length, 1, 'Should have 1 admin/** target')

    // User profile should not be included
    assert(!results.some((r) => r.matcher === 'user/:id/profile'), 'Should not include non-requested patterns')
  })

  await runTest('getTargets method - array of matchers (params mode)', () => {
    const matcher = new PathMatcher<string>({ useParams: true })
    matcher.addTarget('user/:id', 'user-handler1')
    matcher.addTarget('user/:id', 'user-handler2')
    matcher.addTarget('api/:version/users/:userId', 'api-user-handler')
    matcher.addTarget('posts/:postId', 'post-handler')

    // Get multiple param patterns
    const results = matcher.getTargets(['user/:id', 'posts/:postId'])
    assertEquals(results.length, 3, 'Should return targets from param matchers')

    const userTargets = results.filter((r) => r.matcher === 'user/:id')
    const postTargets = results.filter((r) => r.matcher === 'posts/:postId')

    assertEquals(userTargets.length, 2, 'Should have 2 user/:id targets')
    assertEquals(postTargets.length, 1, 'Should have 1 posts/:postId target')

    // API handler should not be included
    assert(!results.some((r) => r.matcher === 'api/:version/users/:userId'), 'Should not include non-requested param patterns')
  })

  await runTest('getTargets method - array of matchers (combined mode)', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })
    matcher.addTarget('user/:id/*', 'user-wildcard1')
    matcher.addTarget('user/:id/*', 'user-wildcard2')
    matcher.addTarget('*/users/:userId', 'namespace-user')
    matcher.addTarget('admin/**', 'admin-all')
    matcher.addTarget('static/path', 'static-handler')

    // Mix of different pattern types
    const results = matcher.getTargets(['user/:id/*', 'admin/**', 'static/path'])
    assertEquals(results.length, 4, 'Should return targets from mixed pattern types')

    const userTargets = results.filter((r) => r.matcher === 'user/:id/*')
    const adminTargets = results.filter((r) => r.matcher === 'admin/**')
    const staticTargets = results.filter((r) => r.matcher === 'static/path')

    assertEquals(userTargets.length, 2, 'Should have 2 user/:id/* targets')
    assertEquals(adminTargets.length, 1, 'Should have 1 admin/** target')
    assertEquals(staticTargets.length, 1, 'Should have 1 static/path target')

    // Namespace user should not be included
    assert(!results.some((r) => r.matcher === '*/users/:userId'), 'Should not include non-requested patterns')
  })

  await runTest('getTargets method - array consistency with single calls', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'user-handler1')
    matcher.addTarget('api/users', 'user-handler2')
    matcher.addTarget('api/posts', 'post-handler')
    matcher.addTarget('api/comments', 'comment-handler')

    // Compare array call with individual calls
    const arrayResults = matcher.getTargets(['api/users', 'api/posts'])
    const userResults = matcher.getTargets('api/users')
    const postResults = matcher.getTargets('api/posts')
    const combinedResults = [...userResults, ...postResults]

    assertEquals(arrayResults.length, combinedResults.length, 'Array call should return same count as combined individual calls')

    // Verify each result from array call exists in combined individual calls
    arrayResults.forEach((arrayResult) => {
      const exists = combinedResults.some((combinedResult) => combinedResult.matcher === arrayResult.matcher && combinedResult.target === arrayResult.target)
      assert(exists, `Result ${arrayResult.matcher}:${arrayResult.target} should exist in combined individual calls`)
    })
  })

  await runTest('getTargets method - array preserves order', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('first', 'handler1')
    matcher.addTarget('second', 'handler2')
    matcher.addTarget('third', 'handler3')

    // Request in specific order
    const results = matcher.getTargets(['third', 'first', 'second'])
    assertEquals(results.length, 3, 'Should return all 3 targets')

    // Verify order matches request order
    assertEquals(results[0].matcher, 'third', 'First result should be from third matcher')
    assertEquals(results[1].matcher, 'first', 'Second result should be from first matcher')
    assertEquals(results[2].matcher, 'second', 'Third result should be from second matcher')
  })

  console.log('\n✅ All Getters and Methods tests completed!')
}
