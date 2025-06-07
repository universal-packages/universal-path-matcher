import { PathMatcher } from '../PathMatcher'
import { assertEquals, runTest } from '../utils.test'

export async function runRemoveTargetsTests() {
  console.log('🧪 Running Remove Targets Tests')

  // Test removeTarget with wildcards
  await runTest('removeTarget with wildcards', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    // Add targets to various wildcard patterns
    matcher.addTarget('api/*/data', 'api-handler-1')
    matcher.addTarget('api/*/data', 'api-handler-2')
    matcher.addTarget('api/*/data', 'api-handler-3')

    // Add targets to globstar patterns
    matcher.addTarget('admin/**', 'admin-handler-1')
    matcher.addTarget('admin/**', 'admin-handler-2')
    matcher.prependTarget('admin/**', 'admin-priority-handler')

    // Add targets to parameter patterns
    matcher.addTarget('user/:id', 'user-handler-1')
    matcher.addTarget('user/:id', 'user-handler-2')

    // Add targets to mixed patterns
    matcher.addTarget('shop/:store/*', 'shop-handler-1')
    matcher.addTarget('shop/:store/*', 'shop-handler-2')

    // Add targets to global patterns
    matcher.addTarget('**', 'global-handler-1')
    matcher.addTarget('**', 'global-handler-2')
    matcher.addTarget('*', 'single-level-handler')

    // Test initial state - single wildcard pattern
    let results = matcher.match('api/v1/data')
    assertEquals(results.length, 5, 'Should initially match api handlers + global handlers')
    assertEquals(results[0].target, 'api-handler-1', 'First result should be api-handler-1')
    assertEquals(results[1].target, 'api-handler-2', 'Second result should be api-handler-2')
    assertEquals(results[2].target, 'api-handler-3', 'Third result should be api-handler-3')

    // Remove one target from single wildcard pattern
    matcher.removeTarget('api/*/data', 'api-handler-2')
    results = matcher.match('api/v1/data')
    assertEquals(results.length, 4, 'Should have one less handler after removal')
    assertEquals(results[0].target, 'api-handler-1', 'First result should be api-handler-1')
    assertEquals(results[1].target, 'api-handler-3', 'Second result should be api-handler-3 (api-handler-2 removed)')
    // Verify api-handler-2 is not in results
    const removedHandlerExists = results.some((r) => r.target === 'api-handler-2')
    assertEquals(removedHandlerExists, false, 'Should not include removed api-handler-2')

    // Test globstar pattern removal
    results = matcher.match('admin/users/list')
    const initialAdminCount = results.length
    assertEquals(results.length, 5, 'Should initially match admin handlers + global handlers')
    assertEquals(results[0].target, 'admin-priority-handler', 'First result should be admin-priority-handler')
    assertEquals(results[1].target, 'admin-handler-1', 'Second result should be admin-handler-1')
    assertEquals(results[2].target, 'admin-handler-2', 'Third result should be admin-handler-2')

    matcher.removeTarget('admin/**', 'admin-handler-1')
    results = matcher.match('admin/users/list')
    assertEquals(results.length, initialAdminCount - 1, 'Should have one less admin handler')
    assertEquals(results[0].target, 'admin-priority-handler', 'First result should still be admin-priority-handler')
    assertEquals(results[1].target, 'admin-handler-2', 'Second result should be admin-handler-2 (admin-handler-1 removed)')
    // Verify admin-handler-1 is not in results
    const removedAdminHandlerExists = results.some((r) => r.target === 'admin-handler-1')
    assertEquals(removedAdminHandlerExists, false, 'Should not include removed admin-handler-1')

    // Test parameter pattern removal
    results = matcher.match('user/123')
    assertEquals(results.length, 4, 'Should match user handlers + global handlers')
    assertEquals(results[0].target, 'user-handler-1', 'First result should be user-handler-1')
    assertEquals(results[1].target, 'user-handler-2', 'Second result should be user-handler-2')

    matcher.removeTarget('user/:id', 'user-handler-1')
    results = matcher.match('user/456')
    assertEquals(results.length, 3, 'Should have one less user handler')
    assertEquals(results[0].target, 'user-handler-2', 'First result should be user-handler-2 (user-handler-1 removed)')
    // Verify user-handler-1 is not in results
    const removedUserHandlerExists = results.some((r) => r.target === 'user-handler-1')
    assertEquals(removedUserHandlerExists, false, 'Should not include removed user-handler-1')

    // Test mixed pattern removal
    results = matcher.match('shop/store1/products')
    assertEquals(results.length, 4, 'Should match shop handlers + global handlers')
    assertEquals(results[0].target, 'shop-handler-1', 'First result should be shop-handler-1')
    assertEquals(results[1].target, 'shop-handler-2', 'Second result should be shop-handler-2')

    matcher.removeTarget('shop/:store/*', 'shop-handler-2')
    results = matcher.match('shop/store2/categories')
    assertEquals(results.length, 3, 'Should have one less shop handler')
    assertEquals(results[0].target, 'shop-handler-1', 'First result should be shop-handler-1 (shop-handler-2 removed)')
    // Verify shop-handler-2 is not in results
    const removedShopHandlerExists = results.some((r) => r.target === 'shop-handler-2')
    assertEquals(removedShopHandlerExists, false, 'Should not include removed shop-handler-2')

    // Test global pattern removal
    results = matcher.match('anything')
    const globalMatches = results.filter((r) => r.target === 'global-handler-1' || r.target === 'global-handler-2' || r.target === 'single-level-handler')
    assertEquals(globalMatches.length, 3, 'Should have all global handlers initially')
    assertEquals(results[0].target, 'single-level-handler', 'First result should be single-level-handler')
    assertEquals(results[1].target, 'global-handler-1', 'Second result should be global-handler-1')
    assertEquals(results[2].target, 'global-handler-2', 'Third result should be global-handler-2')

    matcher.removeTarget('**', 'global-handler-1')
    results = matcher.match('anything/else')
    const newGlobalMatches = results.filter((r) => r.target === 'global-handler-1' || r.target === 'global-handler-2')
    assertEquals(newGlobalMatches.length, 1, 'Should have one global handler after removal')
    assertEquals(results[0].target, 'global-handler-2', 'Should only have global-handler-2 remaining')
    // Verify global-handler-1 is not in results
    const removedGlobalHandlerExists = results.some((r) => r.target === 'global-handler-1')
    assertEquals(removedGlobalHandlerExists, false, 'Should not include removed global-handler-1')

    // Test removing non-existent targets
    matcher.removeTarget('api/*/data', 'non-existent-handler')
    matcher.removeTarget('admin/**', 'another-non-existent')
    matcher.removeTarget('user/:id', 'fake-handler')

    // Verify no changes occurred from non-existent removals
    results = matcher.match('api/v2/data')
    assertEquals(results.length, 3, 'Should have current number of api handlers (after removals)')

    results = matcher.match('admin/config')
    assertEquals(results.length, 3, 'Should have current number of admin handlers (after removals)')

    results = matcher.match('user/789')
    assertEquals(results.length, 2, 'Should have current number of user handlers (after removals)')
  })

  // Test removeTarget with prepended wildcard handlers
  await runTest('removeTarget with prepended wildcard handlers', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    // Add regular and prepended targets
    matcher.addTarget('events/**/error', 'normal-error-handler')
    matcher.addTarget('events/**/error', 'another-error-handler')
    matcher.prependTarget('events/**/error', 'priority-error-handler')
    matcher.prependTargetOnce('events/**/error', 'once-error-handler')
    matcher.prependTargetMany('events/**/error', 2, 'limited-error-handler')

    // Test initial state
    let results = matcher.match('events/user/auth/error')
    assertEquals(results.length, 5, 'Should have all error handlers')

    // Remove a prepended target
    matcher.removeTarget('events/**/error', 'priority-error-handler')
    results = matcher.match('events/system/critical/error')
    assertEquals(results.length, 3, 'Should have one less handler after removing prepended')
    assertEquals(results[0].target, 'limited-error-handler', 'First result should be limited-error-handler')
    assertEquals(results[1].target, 'normal-error-handler', 'Second result should be normal-error-handler')
    assertEquals(results[2].target, 'another-error-handler', 'Third result should be another-error-handler')
    // Verify priority-error-handler is not in results
    const removedPriorityHandlerExists = results.some((r) => r.target === 'priority-error-handler')
    assertEquals(removedPriorityHandlerExists, false, 'Should not include removed priority-error-handler')

    // Remove a normal target
    matcher.removeTarget('events/**/error', 'another-error-handler')
    results = matcher.match('events/app/network/error')
    assertEquals(results.length, 1, 'Should have one less normal handler and consume limited handler')
    assertEquals(results[0].target, 'normal-error-handler', 'Should only have normal-error-handler remaining')
    // Verify another-error-handler is not in results
    const removedAnotherHandlerExists = results.some((r) => r.target === 'another-error-handler')
    assertEquals(removedAnotherHandlerExists, false, 'Should not include removed another-error-handler')
    // Note: Limited handler should be consumed after 2 uses, once handler may be consumed
  })

  // Test removing targets that don't exist
  await runTest('removing non-existent targets', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    matcher.addTarget('test/path', 'existing-handler')

    // Remove non-existent target
    matcher.removeTarget('test/path', 'non-existent')
    matcher.removeTarget('non-existent/path', 'any-target')

    // Should still have the existing handler
    const results = matcher.match('test/path')
    assertEquals(results.length, 1, 'Should still have existing handler')
    assertEquals(results[0].target, 'existing-handler', 'Should match existing-handler')
  })

  // Test remove from non-existent static targets map
  await runTest('remove from non-existent static targets', () => {
    const matcher = new PathMatcher<string>() // No wildcards/params

    // Try to remove from non-existent path
    matcher.removeTarget('non-existent/path', 'any-handler')

    // Should not crash and should work normally
    matcher.addTarget('real/path', 'real-handler')
    const results = matcher.match('real/path')
    assertEquals(results.length, 1, 'Should still work after invalid removal')
  })

  // Test removeTarget with array of matchers
  await runTest('removeTarget with array of matchers', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    // Add targets to multiple matchers
    matcher.addTarget('api/users', 'user-handler')
    matcher.addTarget('api/posts', 'post-handler')
    matcher.addTarget('api/comments', 'comment-handler')
    matcher.addTarget('api/users', 'additional-user-handler')
    matcher.addTarget('api/posts', 'additional-post-handler')
    matcher.addTarget('admin/users', 'admin-user-handler')
    matcher.addTarget('admin/settings', 'admin-settings-handler')

    // Test initial state
    let userResults = matcher.match('api/users')
    let postResults = matcher.match('api/posts')
    let commentResults = matcher.match('api/comments')
    let adminUserResults = matcher.match('admin/users')
    let adminSettingsResults = matcher.match('admin/settings')

    assertEquals(userResults.length, 2, 'Should have 2 user handlers initially')
    assertEquals(postResults.length, 2, 'Should have 2 post handlers initially')
    assertEquals(commentResults.length, 1, 'Should have 1 comment handler initially')
    assertEquals(adminUserResults.length, 1, 'Should have 1 admin user handler initially')
    assertEquals(adminSettingsResults.length, 1, 'Should have 1 admin settings handler initially')

    // Remove a handler from multiple API matchers
    matcher.removeTarget(['api/users', 'api/posts'], 'user-handler')

    userResults = matcher.match('api/users')
    postResults = matcher.match('api/posts')
    assertEquals(userResults.length, 1, 'Should have 1 user handler after removal')
    assertEquals(postResults.length, 2, 'Should still have 2 post handlers (user-handler was not in posts)')
    assertEquals(userResults[0].target, 'additional-user-handler', 'Should only have additional-user-handler')

    // Remove a handler that exists in multiple matchers
    matcher.removeTarget(['api/users', 'api/posts', 'api/comments'], 'additional-user-handler')

    userResults = matcher.match('api/users')
    postResults = matcher.match('api/posts')
    commentResults = matcher.match('api/comments')
    assertEquals(userResults.length, 0, 'Should have no user handlers after removal')
    assertEquals(postResults.length, 2, 'Should still have 2 post handlers')
    assertEquals(commentResults.length, 1, 'Should still have 1 comment handler')

    // Remove from admin matchers
    matcher.removeTarget(['admin/users', 'admin/settings'], 'admin-user-handler')

    adminUserResults = matcher.match('admin/users')
    adminSettingsResults = matcher.match('admin/settings')
    assertEquals(adminUserResults.length, 0, 'Should have no admin user handlers after removal')
    assertEquals(adminSettingsResults.length, 1, 'Should still have admin settings handler')

    // Test removing non-existent target from multiple matchers
    matcher.removeTarget(['api/posts', 'api/comments'], 'non-existent-handler')

    postResults = matcher.match('api/posts')
    commentResults = matcher.match('api/comments')
    assertEquals(postResults.length, 2, 'Should still have 2 post handlers')
    assertEquals(commentResults.length, 1, 'Should still have 1 comment handler')
  })

  // Test removeTarget with array of matchers - static mode
  await runTest('removeTarget with array of matchers - static mode', () => {
    const matcher = new PathMatcher<string>() // Static mode

    // Add targets to multiple matchers
    matcher.addTarget('static/path1', 'handler-1')
    matcher.addTarget('static/path2', 'handler-2')
    matcher.addTarget('static/path3', 'handler-3')
    matcher.addTarget('static/path1', 'duplicate-handler')
    matcher.addTarget('static/path2', 'duplicate-handler')

    // Test initial state
    let path1Results = matcher.match('static/path1')
    let path2Results = matcher.match('static/path2')
    let path3Results = matcher.match('static/path3')

    assertEquals(path1Results.length, 2, 'Should have 2 handlers for path1 initially')
    assertEquals(path2Results.length, 2, 'Should have 2 handlers for path2 initially')
    assertEquals(path3Results.length, 1, 'Should have 1 handler for path3 initially')

    // Remove duplicate handler from multiple paths
    matcher.removeTarget(['static/path1', 'static/path2', 'static/path3'], 'duplicate-handler')

    path1Results = matcher.match('static/path1')
    path2Results = matcher.match('static/path2')
    path3Results = matcher.match('static/path3')

    assertEquals(path1Results.length, 1, 'Should have 1 handler for path1 after removal')
    assertEquals(path2Results.length, 1, 'Should have 1 handler for path2 after removal')
    assertEquals(path3Results.length, 1, 'Should have 1 handler for path3 after removal (unchanged)')
    assertEquals(path1Results[0].target, 'handler-1', 'Should only have handler-1 for path1')
    assertEquals(path2Results[0].target, 'handler-2', 'Should only have handler-2 for path2')
    assertEquals(path3Results[0].target, 'handler-3', 'Should still have handler-3 for path3')
  })

  // Test removeAllTargets method
  await runTest('removeAllTargets method', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    // Add various targets
    matcher.addTarget('api/users/:id', 'user-handler')
    matcher.addTarget('api/posts/*', 'post-handler')
    matcher.addTarget('admin/**', 'admin-handler')
    matcher.prependTarget('logs/**/error', 'error-handler')
    matcher.addTargetOnce('temp/resource', 'temp-handler')
    matcher.addTargetMany('limited/resource', 3, 'limited-handler')

    // Test initial state
    assertEquals(matcher.targetsCount, 6, 'Should have 6 targets initially')
    assertEquals(matcher.matchers.length, 6, 'Should have 6 unique matchers initially')
    assertEquals(matcher.targets.length, 6, 'Should have 6 targets in targets array initially')

    let userResults = matcher.match('api/users/123')
    let postResults = matcher.match('api/posts/new')
    let adminResults = matcher.match('admin/settings')
    let errorResults = matcher.match('logs/app/critical/error')
    let tempResults = matcher.match('temp/resource')
    let limitedResults = matcher.match('limited/resource')

    assertEquals(userResults.length, 1, 'Should match user handler initially')
    assertEquals(postResults.length, 1, 'Should match post handler initially')
    assertEquals(adminResults.length, 1, 'Should match admin handler initially')
    assertEquals(errorResults.length, 1, 'Should match error handler initially')
    assertEquals(tempResults.length, 1, 'Should match temp handler initially')
    assertEquals(limitedResults.length, 1, 'Should match limited handler initially')

    // Remove all targets
    matcher.removeAllTargets()

    // Test after removal
    assertEquals(matcher.targetsCount, 0, 'Should have 0 targets after removeAllTargets')
    assertEquals(matcher.matchers.length, 0, 'Should have 0 matchers after removeAllTargets')
    assertEquals(matcher.targets.length, 0, 'Should have 0 targets in targets array after removeAllTargets')

    userResults = matcher.match('api/users/123')
    postResults = matcher.match('api/posts/new')
    adminResults = matcher.match('admin/settings')
    errorResults = matcher.match('logs/app/critical/error')
    tempResults = matcher.match('temp/resource')
    limitedResults = matcher.match('limited/resource')

    assertEquals(userResults.length, 0, 'Should not match user handler after removal')
    assertEquals(postResults.length, 0, 'Should not match post handler after removal')
    assertEquals(adminResults.length, 0, 'Should not match admin handler after removal')
    assertEquals(errorResults.length, 0, 'Should not match error handler after removal')
    assertEquals(tempResults.length, 0, 'Should not match temp handler after removal')
    assertEquals(limitedResults.length, 0, 'Should not match limited handler after removal')

    // Test that we can add targets again after removeAllTargets
    matcher.addTarget('new/path', 'new-handler')
    const newResults = matcher.match('new/path')
    assertEquals(newResults.length, 1, 'Should be able to add targets after removeAllTargets')
    assertEquals(newResults[0].target, 'new-handler', 'Should match new handler')
    assertEquals(matcher.targetsCount, 1, 'Should have 1 target after adding new one')
  })

  // Test removeAllTargets method - static mode
  await runTest('removeAllTargets method - static mode', () => {
    const matcher = new PathMatcher<string>() // Static mode

    // Add various targets
    matcher.addTarget('static/path1', 'handler-1')
    matcher.addTarget('static/path2', 'handler-2')
    matcher.addTarget('static/path1', 'handler-1-duplicate')
    matcher.prependTarget('static/path3', 'prepended-handler')

    // Test initial state
    assertEquals(matcher.targetsCount, 4, 'Should have 4 targets initially')
    assertEquals(matcher.matchers.length, 3, 'Should have 3 unique matchers initially')
    assertEquals(matcher.targets.length, 4, 'Should have 4 targets in targets array initially')

    let path1Results = matcher.match('static/path1')
    let path2Results = matcher.match('static/path2')
    let path3Results = matcher.match('static/path3')

    assertEquals(path1Results.length, 2, 'Should match 2 handlers for path1 initially')
    assertEquals(path2Results.length, 1, 'Should match 1 handler for path2 initially')
    assertEquals(path3Results.length, 1, 'Should match 1 handler for path3 initially')

    // Remove all targets
    matcher.removeAllTargets()

    // Test after removal
    assertEquals(matcher.targetsCount, 0, 'Should have 0 targets after removeAllTargets')
    assertEquals(matcher.matchers.length, 0, 'Should have 0 matchers after removeAllTargets')
    assertEquals(matcher.targets.length, 0, 'Should have 0 targets in targets array after removeAllTargets')

    path1Results = matcher.match('static/path1')
    path2Results = matcher.match('static/path2')
    path3Results = matcher.match('static/path3')

    assertEquals(path1Results.length, 0, 'Should not match any handlers for path1 after removal')
    assertEquals(path2Results.length, 0, 'Should not match any handlers for path2 after removal')
    assertEquals(path3Results.length, 0, 'Should not match any handlers for path3 after removal')

    // Test that we can add targets again after removeAllTargets
    matcher.addTarget('new/static/path', 'new-static-handler')
    const newResults = matcher.match('new/static/path')
    assertEquals(newResults.length, 1, 'Should be able to add targets after removeAllTargets')
    assertEquals(newResults[0].target, 'new-static-handler', 'Should match new static handler')
    assertEquals(matcher.targetsCount, 1, 'Should have 1 target after adding new one')
  })

  // Test empty array for removeTarget
  await runTest('removeTarget with empty array', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    matcher.addTarget('test/path', 'test-handler')

    // Test with empty array - should do nothing
    matcher.removeTarget([], 'test-handler')

    const results = matcher.match('test/path')
    assertEquals(results.length, 1, 'Should still have the handler after empty array removal')
    assertEquals(results[0].target, 'test-handler', 'Should still match test-handler')
  })

  console.log('\n✅ All Remove Targets tests completed!')
}
