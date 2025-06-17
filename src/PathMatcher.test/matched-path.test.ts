import { PathMatcher } from '../PathMatcher'
import { assertEquals, runTest } from '../utils.test'

export async function runMatchedPathTests() {
  console.log('🧪 Running matchedPath Tests')

  // Test matchedPath in static mode (no wildcards/params)
  await runTest('matchedPath in static mode - exact match', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('user/profile', 'profile-handler')

    const results = matcher.match('user/profile')
    assertEquals(results.length, 1, 'Should return 1 result')
    assertEquals(results[0].matcher, 'user/profile', 'Matcher should be user/profile')
    assertEquals(results[0].matchedPath, 'user/profile', 'matchedPath should be the path that was matched')
    assertEquals(results[0].target, 'profile-handler', 'Target should be profile-handler')
  })

  await runTest('matchedPath in static mode - multiple matches', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'users-handler-1')
    matcher.addTarget('api/users', 'users-handler-2')

    const results = matcher.match('api/users')
    assertEquals(results.length, 2, 'Should return 2 results')
    assertEquals(results[0].matchedPath, 'api/users', 'First result matchedPath should be api/users')
    assertEquals(results[1].matchedPath, 'api/users', 'Second result matchedPath should be api/users')
  })

  await runTest('matchedPath in static mode - no match', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('user/profile', 'profile-handler')

    const results = matcher.match('user/settings')
    assertEquals(results.length, 0, 'Should return no results for non-matching path')
  })

  // Test matchedPath with wildcards
  await runTest('matchedPath with single wildcard (*)', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('user/*', 'user-wildcard-handler')

    const results = matcher.match('user/profile')
    assertEquals(results.length, 1, 'Should return 1 result')
    assertEquals(results[0].matcher, 'user/*', 'Matcher should be user/*')
    assertEquals(results[0].matchedPath, 'user/profile', 'matchedPath should be the actual matched path')
    assertEquals(results[0].target, 'user-wildcard-handler', 'Target should be user-wildcard-handler')
  })

  await runTest('matchedPath with single wildcard (*) - multiple segments', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('api/*/details', 'details-handler')

    const results1 = matcher.match('api/users/details')
    assertEquals(results1.length, 1, 'Should return 1 result for users')
    assertEquals(results1[0].matcher, 'api/*/details', 'Matcher should be api/*/details')
    assertEquals(results1[0].matchedPath, 'api/users/details', 'matchedPath should be api/users/details')

    const results2 = matcher.match('api/posts/details')
    assertEquals(results2.length, 1, 'Should return 1 result for posts')
    assertEquals(results2[0].matchedPath, 'api/posts/details', 'matchedPath should be api/posts/details')
  })

  // Test matchedPath with globstar (**)
  await runTest('matchedPath with globstar (**) - simple case', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('**', 'catch-all-handler')

    const results = matcher.match('anything')
    assertEquals(results.length, 1, 'Should return 1 result')
    assertEquals(results[0].matcher, '**', 'Matcher should be **')
    assertEquals(results[0].matchedPath, 'anything', 'matchedPath should be the actual matched path')
    assertEquals(results[0].target, 'catch-all-handler', 'Target should be catch-all-handler')
  })

  await runTest('matchedPath with globstar (**) - multiple segments', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('**', 'catch-all-handler')

    const results = matcher.match('user/profile/settings/advanced')
    assertEquals(results.length, 1, 'Should return 1 result')
    assertEquals(results[0].matcher, '**', 'Matcher should be **')
    assertEquals(results[0].matchedPath, 'user/profile/settings/advanced', 'matchedPath should be the full matched path')
    assertEquals(results[0].target, 'catch-all-handler', 'Target should be catch-all-handler')
  })

  await runTest('matchedPath with globstar (**) - prefix pattern', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('admin/**', 'admin-handler')

    const results1 = matcher.match('admin/users')
    assertEquals(results1.length, 1, 'Should return 1 result for admin/users')
    assertEquals(results1[0].matcher, 'admin/**', 'Matcher should be admin/**')
    assertEquals(results1[0].matchedPath, 'admin/users', 'matchedPath should be admin/users')

    const results2 = matcher.match('admin/settings/security/advanced')
    assertEquals(results2.length, 1, 'Should return 1 result for deep path')
    assertEquals(results2[0].matchedPath, 'admin/settings/security/advanced', 'matchedPath should be the full deep path')
  })

  await runTest('matchedPath with globstar (**) - suffix pattern', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('**/event', 'event-handler')

    const results1 = matcher.match('user/event')
    assertEquals(results1.length, 1, 'Should return 1 result for user/event')
    assertEquals(results1[0].matcher, '**/event', 'Matcher should be **/event')
    assertEquals(results1[0].matchedPath, 'user/event', 'matchedPath should be user/event')

    const results2 = matcher.match('api/v1/users/created/event')
    assertEquals(results2.length, 1, 'Should return 1 result for deep path ending in event')
    assertEquals(results2[0].matchedPath, 'api/v1/users/created/event', 'matchedPath should be the full path')
  })

  await runTest('matchedPath with globstar (**) - middle pattern', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('api/**/users', 'api-users-handler')

    const results1 = matcher.match('api/v1/users')
    assertEquals(results1.length, 1, 'Should return 1 result for api/v1/users')
    assertEquals(results1[0].matcher, 'api/**/users', 'Matcher should be api/**/users')
    assertEquals(results1[0].matchedPath, 'api/v1/users', 'matchedPath should be api/v1/users')

    const results2 = matcher.match('api/v2/internal/beta/users')
    assertEquals(results2.length, 1, 'Should return 1 result for complex middle path')
    assertEquals(results2[0].matchedPath, 'api/v2/internal/beta/users', 'matchedPath should be the full path')
  })

  // Test matchedPath with params
  await runTest('matchedPath with single param', () => {
    const matcher = new PathMatcher<string>({ useParams: true })
    matcher.addTarget('user/:id', 'user-handler')

    const results = matcher.match('user/123')
    assertEquals(results.length, 1, 'Should return 1 result')
    assertEquals(results[0].matcher, 'user/:id', 'Matcher should be user/:id')
    assertEquals(results[0].matchedPath, 'user/123', 'matchedPath should be the actual matched path')
    assertEquals(results[0].target, 'user-handler', 'Target should be user-handler')
    assertEquals(results[0].params?.id, '123', 'Params should contain id: 123')
  })

  await runTest('matchedPath with multiple params', () => {
    const matcher = new PathMatcher<string>({ useParams: true })
    matcher.addTarget('api/:version/users/:userId', 'api-user-handler')

    const results = matcher.match('api/v1/users/456')
    assertEquals(results.length, 1, 'Should return 1 result')
    assertEquals(results[0].matcher, 'api/:version/users/:userId', 'Matcher should be api/:version/users/:userId')
    assertEquals(results[0].matchedPath, 'api/v1/users/456', 'matchedPath should be api/v1/users/456')
    assertEquals(results[0].params?.version, 'v1', 'Params should contain version: v1')
    assertEquals(results[0].params?.userId, '456', 'Params should contain userId: 456')
  })

  // Test matchedPath with combined wildcards and params
  await runTest('matchedPath with wildcards and params combined', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })
    matcher.addTarget('api/:version/*/users/:userId', 'complex-handler')

    const results = matcher.match('api/v2/public/users/789')
    assertEquals(results.length, 1, 'Should return 1 result')
    assertEquals(results[0].matcher, 'api/:version/*/users/:userId', 'Matcher should be api/:version/*/users/:userId')
    assertEquals(results[0].matchedPath, 'api/v2/public/users/789', 'matchedPath should be api/v2/public/users/789')
    assertEquals(results[0].params?.version, 'v2', 'Params should contain version: v2')
    assertEquals(results[0].params?.userId, '789', 'Params should contain userId: 789')
  })

  await runTest('matchedPath with globstar and params', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })
    matcher.addTarget('user/:id/**', 'user-all-handler')

    const results = matcher.match('user/123/profile/settings/advanced')
    assertEquals(results.length, 1, 'Should return 1 result')
    assertEquals(results[0].matcher, 'user/:id/**', 'Matcher should be user/:id/**')
    assertEquals(results[0].matchedPath, 'user/123/profile/settings/advanced', 'matchedPath should be the full matched path')
    assertEquals(results[0].params?.id, '123', 'Params should contain id: 123')
  })

  // Test matchedPath with array matching
  await runTest('matchedPath with array of paths', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('user/*', 'user-handler')
    matcher.addTarget('admin/**', 'admin-handler')

    const results = matcher.match(['user/profile', 'admin/settings/security'])
    assertEquals(results.length, 2, 'Should return 2 results')

    assertEquals(results[0].matcher, 'user/*', 'First result matcher should be user/*')
    assertEquals(results[0].matchedPath, 'user/profile', 'First result matchedPath should be user/profile')

    assertEquals(results[1].matcher, 'admin/**', 'Second result matcher should be admin/**')
    assertEquals(results[1].matchedPath, 'admin/settings/security', 'Second result matchedPath should be admin/settings/security')
  })

  // Test matchedPath with pattern-to-pattern matching
  await runTest('matchedPath with pattern-to-pattern matching', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('user/profile', 'static-handler')
    matcher.addTarget('user/*', 'wildcard-handler')
    matcher.addTarget('admin/**', 'admin-handler')

    // Match using a wildcard pattern
    const results = matcher.match('user/*')

    // Should match both static and wildcard patterns
    assertEquals(results.length, 2, 'Should return 2 results for pattern matching')

    // Note: In pattern-to-pattern matching, matchedPath might be different
    // It should show the original matcher that was registered
    const staticResult = results.find((r) => r.target === 'static-handler')
    const wildcardResult = results.find((r) => r.target === 'wildcard-handler')

    assertEquals(staticResult?.matcher, 'user/profile', 'Static result matcher should be user/profile')
    assertEquals(wildcardResult?.matcher, 'user/*', 'Wildcard result matcher should be user/*')
  })

  // Test matchedPath with limited targets
  await runTest('matchedPath with addTargetOnce', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTargetOnce('user/*', 'once-handler')
    matcher.addTarget('user/*', 'always-handler')

    const results1 = matcher.match('user/profile')
    assertEquals(results1.length, 2, 'First match should return 2 results')
    assertEquals(results1[0].matchedPath, 'user/profile', 'First result matchedPath should be user/profile')
    assertEquals(results1[1].matchedPath, 'user/profile', 'Second result matchedPath should be user/profile')

    const results2 = matcher.match('user/settings')
    assertEquals(results2.length, 1, 'Second match should return 1 result (once handler consumed)')
    assertEquals(results2[0].matchedPath, 'user/settings', 'matchedPath should be user/settings')
  })

  await runTest('matchedPath with addTargetMany', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTargetMany('api/**', 2, 'limited-handler')

    const results1 = matcher.match('api/users/create')
    assertEquals(results1.length, 1, 'First match should return 1 result')
    assertEquals(results1[0].matchedPath, 'api/users/create', 'matchedPath should be api/users/create')

    const results2 = matcher.match('api/posts/update')
    assertEquals(results2.length, 1, 'Second match should return 1 result')
    assertEquals(results2[0].matchedPath, 'api/posts/update', 'matchedPath should be api/posts/update')

    const results3 = matcher.match('api/comments/delete')
    assertEquals(results3.length, 0, 'Third match should return 0 results (handler exhausted)')
  })

  // Test matchedPath with edge cases
  await runTest('matchedPath with empty path', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('', 'root-handler')

    const results = matcher.match('')
    assertEquals(results.length, 1, 'Should return 1 result')
    assertEquals(results[0].matcher, '', 'Matcher should be empty string')
    assertEquals(results[0].matchedPath, '', 'matchedPath should be empty string')
  })

  await runTest('matchedPath with root wildcard', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })
    matcher.addTarget('*', 'single-segment-handler')

    const results = matcher.match('anything')
    assertEquals(results.length, 1, 'Should return 1 result')
    assertEquals(results[0].matcher, '*', 'Matcher should be *')
    assertEquals(results[0].matchedPath, 'anything', 'matchedPath should be anything')
  })

  await runTest('matchedPath with complex mixed patterns', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    matcher.addTarget('api/v1/users/:id', 'v1-user-handler')
    matcher.addTarget('api/*/users/*', 'wildcard-user-handler')
    matcher.addTarget('api/**', 'api-catch-all')

    const results = matcher.match('api/v1/users/123')

    // Should match all three patterns
    assertEquals(results.length, 3, 'Should return 3 results')

    // All should have the same matchedPath
    for (const result of results) {
      assertEquals(result.matchedPath, 'api/v1/users/123', 'All results should have same matchedPath')
    }

    // But different matchers
    const matchers = results.map((r) => r.matcher).sort()
    assertEquals(matchers[0], 'api/**', 'Should include api/**')
    assertEquals(matchers[1], 'api/*/users/*', 'Should include api/*/users/*')
    assertEquals(matchers[2], 'api/v1/users/:id', 'Should include api/v1/users/:id')
  })
}
