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

  console.log('\n✅ All Remove Targets tests completed!')
}
