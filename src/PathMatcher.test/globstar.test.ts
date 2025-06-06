import { assert } from 'console'

import { PathMatcher } from '../PathMatcher'
import { assertEquals, runTest } from '../utils.test'

export async function runGlobstarTests() {
  console.log('🧪 Running Globstar Tests')

  // Test path length requirements for globstar
  await runTest('globstar path length requirements', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    matcher.addTarget('**/event', 'suffix-globstar')
    matcher.addTarget('event/**', 'prefix-globstar')
    matcher.addTarget('middle/**/end', 'middle-globstar')

    // Single segment paths should not match prefix/suffix globstar patterns
    let results = matcher.match('event')
    assertEquals(results.length, 0, 'Single segment should not match **/event or event/**')

    // Multi-segment paths should match
    results = matcher.match('user/event')
    assertEquals(results.length, 1, 'Should match suffix globstar')
    assertEquals(results[0].target, 'suffix-globstar', 'Should match **/event')

    results = matcher.match('event/created')
    assertEquals(results.length, 1, 'Should match prefix globstar')
    assertEquals(results[0].target, 'prefix-globstar', 'Should match event/**')

    results = matcher.match('middle/something/end')
    assertEquals(results.length, 1, 'Should match middle globstar')
    assertEquals(results[0].target, 'middle-globstar', 'Should match middle/**/end')
  })

  // Test globstar in middle patterns
  await runTest('globstar in middle patterns', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    matcher.addTarget('start/**/middle/**/end', 'complex-globstar')
    matcher.addTarget('a/**/b', 'simple-middle-globstar')

    // Test complex globstar pattern
    let results = matcher.match('start/x/y/middle/z/w/end')
    assertEquals(results.length, 1, 'Should match complex globstar')
    assertEquals(results[0].target, 'complex-globstar', 'Should match complex-globstar')

    // Test simple middle globstar
    results = matcher.match('a/x/y/z/b')
    assertEquals(results.length, 1, 'Should match simple middle globstar')
    assertEquals(results[0].target, 'simple-middle-globstar', 'Should match simple-middle-globstar')
  })

  // Test advanced pattern-to-pattern matching
  await runTest('advanced pattern-to-pattern matching', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    matcher.addTarget('user/admin', 'admin-handler')
    matcher.addTarget('user/guest', 'guest-handler')
    matcher.addTarget('admin/settings', 'admin-settings')
    matcher.addTarget('api/v1/users', 'api-v1')
    matcher.addTarget('api/v2/users', 'api-v2')

    // Test pattern with trailing globstars
    let results = matcher.match('user/**')
    assertEquals(results.length, 2, 'Should match user patterns')
    assertEquals(results[0].target, 'admin-handler', 'First result should be admin-handler')
    assertEquals(results[1].target, 'guest-handler', 'Second result should be guest-handler')

    // Test pattern with complex globstar matching
    results = matcher.match('**/users')
    assertEquals(results.length, 2, 'Should match API patterns')
    assertEquals(results[0].target, 'api-v1', 'First result should be api-v1')
    assertEquals(results[1].target, 'api-v2', 'Second result should be api-v2')
  })

  // Test pattern matching edge cases
  await runTest('pattern matching edge cases', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    // Test patterns that end with globstars
    matcher.addTarget('prefix/**', 'prefix-glob')
    matcher.addTarget('**', 'global-glob')
    matcher.addTarget(':param/**', 'param-glob')

    // Test pattern-to-pattern with different segment lengths
    let results = matcher.match('**/**')
    assertEquals(results.length, 3, 'Should match all glob patterns')
    assertEquals(results[0].target, 'prefix-glob', 'First result should be prefix-glob')
    assertEquals(results[1].target, 'global-glob', 'Second result should be global-glob')
    assertEquals(results[2].target, 'param-glob', 'Third result should be param-glob')

    // Test non-empty pattern matching (empty pattern doesn't match ** due to path length requirements)
    results = matcher.match('something')
    assertEquals(results.length, 1, 'Should match global glob pattern')
    assertEquals(results[0].target, 'global-glob', 'First result should be global-glob')
  })

  // Test globstar alone pattern
  await runTest('globstar alone pattern', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    matcher.addTarget('**', 'global-handler')

    // Should match multi-segment paths
    let results = matcher.match('a/b/c')
    assertEquals(results.length, 1, 'Should match multi-segment')
    assertEquals(results[0].target, 'global-handler', 'Should match global-handler')

    // Should match single segment paths
    results = matcher.match('single')
    assertEquals(results.length, 1, 'Should match single segment')
    assertEquals(results[0].target, 'global-handler', 'Should match global-handler')

    // Should NOT match empty paths due to path length requirements
    results = matcher.match('')
    assertEquals(results.length, 0, 'Should not match empty path')
  })

  // Test advanced segment matching edge cases
  await runTest('advanced segment matching edge cases', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    // Test pattern with only globstars at the end
    matcher.addTarget('test/**/**/**', 'multiple-globstars')

    let results = matcher.match('test/a/b/c')
    assertEquals(results.length, 1, 'Should match multiple globstars')
    assertEquals(results[0].target, 'multiple-globstars', 'Should match multiple-globstars')
  })

  // Test parameter match with globstar in middle not set as isInMiddleOfPattern=false
  await runTest('globstar at start and end positions', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    // These should use regular globstar matching, not middle matching
    matcher.addTarget('**/end', 'globstar-start')
    matcher.addTarget('start/**', 'globstar-end')

    let results = matcher.match('a/b/end')
    assertEquals(results.length, 1, 'Should match globstar at start')
    assertEquals(results[0].target, 'globstar-start', 'Should match globstar-start')

    results = matcher.match('start/a/b')
    assertEquals(results.length, 1, 'Should match globstar at end')
    assertEquals(results[0].target, 'globstar-end', 'Should match globstar-end')
  })

  // Test prepending when using wildcards
  await runTest('prepending with wildcards', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    // Test prepending to single wildcard patterns
    matcher.addTarget('api/*/data', 'normal-api-handler')
    matcher.prependTarget('api/*/data', 'priority-api-handler')
    matcher.prependTarget('api/*/data', 'highest-priority-api-handler')

    // Test prepending to globstar patterns
    matcher.addTarget('admin/**', 'normal-admin-handler')
    matcher.prependTargetOnce('admin/**', 'once-admin-handler')
    matcher.prependTargetMany('admin/**', 2, 'limited-admin-handler')

    // Test prepending to mixed patterns
    matcher.addTarget('user/:id/*', 'normal-user-handler')
    matcher.prependTarget('user/:id/*', 'priority-user-handler')

    // Test prepending to global patterns
    matcher.addTarget('**', 'global-handler')
    matcher.prependTargetOnce('**', 'once-global-handler')

    // Test initial state - single wildcard pattern
    let results = matcher.match('api/v1/data')
    assertEquals(results.length, 5, 'Should initially match api handlers + global handlers')

    // Check that all expected handlers are present in order
    assertEquals(results[0].target, 'highest-priority-api-handler', 'First result should be highest-priority-api-handler')
    assertEquals(results[1].target, 'priority-api-handler', 'Second result should be priority-api-handler')
    assertEquals(results[2].target, 'once-global-handler', 'Third result should be once-global-handler')
    assertEquals(results[3].target, 'normal-api-handler', 'Fourth result should be normal-api-handler')
    assertEquals(results[4].target, 'global-handler', 'Fifth result should be global-handler')

    // Check that prepended handlers come before normal handlers for the same pattern
    const apiHandlerIndices = {
      highest: results.findIndex((r) => r.target === 'highest-priority-api-handler'),
      priority: results.findIndex((r) => r.target === 'priority-api-handler'),
      normal: results.findIndex((r) => r.target === 'normal-api-handler')
    }
    assert(apiHandlerIndices.highest < apiHandlerIndices.priority, 'highest-priority should come before priority')
    assert(apiHandlerIndices.priority < apiHandlerIndices.normal, 'priority should come before normal')

    // Test globstar pattern matching with prepended handlers
    results = matcher.match('admin/users/list')
    assertEquals(results.length, 4, 'Should match admin handlers (limited + once + normal) plus global')

    // Check for admin handlers in order
    assertEquals(results[0].target, 'limited-admin-handler', 'First result should be limited-admin-handler')
    assertEquals(results[1].target, 'once-admin-handler', 'Second result should be once-admin-handler')
    assertEquals(results[2].target, 'normal-admin-handler', 'Third result should be normal-admin-handler')
    assertEquals(results[3].target, 'global-handler', 'Fourth result should be global-handler')

    // Check order for admin handlers (prepended should come before normal)
    const adminHandlerIndices = {
      limited: results.findIndex((r) => r.target === 'limited-admin-handler'),
      once: results.findIndex((r) => r.target === 'once-admin-handler'),
      normal: results.findIndex((r) => r.target === 'normal-admin-handler')
    }
    assert(adminHandlerIndices.limited < adminHandlerIndices.normal, 'limited should come before normal')
    assert(adminHandlerIndices.once < adminHandlerIndices.normal, 'once should come before normal')

    // Test parameter + wildcard pattern with prepended handlers
    results = matcher.match('user/123/profile')
    assertEquals(results.length, 3, 'Should match user handlers plus global')
    assertEquals(results[0].target, 'priority-user-handler', 'First result should be priority-user-handler')
    assertEquals(results[1].target, 'normal-user-handler', 'Second result should be normal-user-handler')
    assertEquals(results[2].target, 'global-handler', 'Third result should be global-handler')

    // Check parameter extraction
    const userHandler = results.find((r) => r.target === 'priority-user-handler')
    assertEquals(userHandler?.params?.id, '123', 'Should extract id parameter')

    // Check order for user handlers
    const userHandlerIndices = {
      priority: results.findIndex((r) => r.target === 'priority-user-handler'),
      normal: results.findIndex((r) => r.target === 'normal-user-handler')
    }
    assert(userHandlerIndices.priority < userHandlerIndices.normal, 'priority should come before normal')

    results = matcher.match('events/db/connection/error')
    assertEquals(results.length, 1, 'Should match 1 handler')
    assertEquals(results[0].target, 'global-handler', 'Should match global-handler')

    results = matcher.match('events/cache/timeout/error')
    assertEquals(results.length, 1, 'Should match 1 handler')
    assertEquals(results[0].target, 'global-handler', 'Should match global-handler')
  })

  // Test prepending with complex wildcard patterns
  await runTest('prepending with complex wildcard patterns', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    // Test prepending to patterns with multiple wildcards
    matcher.addTarget('*/api/*/data', 'normal-multi-wildcard')
    matcher.prependTargetMany('*/api/*/data', 3, 'limited-multi-wildcard')
    matcher.prependTarget('*/api/*/data', 'priority-multi-wildcard')

    // Test prepending to patterns with globstars in middle
    matcher.addTarget('events/**/error', 'normal-event-error')
    matcher.prependTargetOnce('events/**/error', 'once-event-error')

    // Test prepending to parameter + globstar patterns
    matcher.addTarget('shop/:store/**', 'normal-shop-handler')
    matcher.prependTarget('shop/:store/**', 'priority-shop-handler')

    // Test multi-wildcard pattern
    let results = matcher.match('v1/api/users/data')
    assertEquals(results.length, 3, 'Should match all multi-wildcard handlers')
    assertEquals(results[0].target, 'priority-multi-wildcard', 'First should be priority-multi-wildcard')
    assertEquals(results[1].target, 'limited-multi-wildcard', 'Second should be limited-multi-wildcard')
    assertEquals(results[2].target, 'normal-multi-wildcard', 'Third should be normal-multi-wildcard')

    // Test globstar in middle pattern
    results = matcher.match('events/user/auth/error')
    assertEquals(results.length, 2, 'Should match event error handlers')
    assertEquals(results[0].target, 'once-event-error', 'First should be once-event-error')
    assertEquals(results[1].target, 'normal-event-error', 'Second should be normal-event-error')

    // Test parameter + globstar pattern
    results = matcher.match('shop/store1/products/category/electronics')
    assertEquals(results.length, 2, 'Should match shop handlers')
    assertEquals(results[0].target, 'priority-shop-handler', 'First should be priority-shop-handler')
    assertEquals(results[1].target, 'normal-shop-handler', 'Second should be normal-shop-handler')
    assertEquals(results[0].params?.store, 'store1', 'Should extract store parameter')

    // Test that once handler is consumed
    results = matcher.match('events/system/critical/error')
    assertEquals(results.length, 1, 'Should consume once handler')
    assertEquals(results[0].target, 'normal-event-error', 'Should be normal-event-error')

    // Test limited handler decrement
    results = matcher.match('v2/api/products/data')
    assertEquals(results.length, 3, 'Should still have all handlers')
    results = matcher.match('v3/api/orders/data')
    assertEquals(results.length, 3, 'Should still have all handlers')
    results = matcher.match('v4/api/reviews/data')
    assertEquals(results.length, 2, 'Should only have priority and normal handlers')
    assertEquals(results[0].target, 'priority-multi-wildcard', 'First should be priority-multi-wildcard')
    assertEquals(results[1].target, 'normal-multi-wildcard', 'Second should be normal-multi-wildcard')
  })

  // Test prepending with pattern-to-pattern matching
  await runTest('prepending with pattern-to-pattern matching', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    // Add some concrete patterns
    matcher.addTarget('user/admin', 'admin-handler')
    matcher.addTarget('user/guest', 'guest-handler')
    matcher.prependTarget('user/admin', 'priority-admin')
    matcher.prependTargetOnce('user/guest', 'once-guest')

    // Add patterns that can match the concrete ones
    matcher.addTarget('user/*', 'wildcard-user-handler')
    matcher.prependTarget('user/*', 'priority-wildcard-user')

    // Test concrete pattern matching
    let results = matcher.match('user/admin')
    assertEquals(results.length, 4, 'Should match admin + wildcard handlers')
    assertEquals(results[0].target, 'priority-admin', 'Second result should be priority-admin')
    assertEquals(results[1].target, 'priority-wildcard-user', 'First result should be priority-wildcard-user')
    assertEquals(results[2].target, 'admin-handler', 'Third result should be admin-handler')
    assertEquals(results[3].target, 'wildcard-user-handler', 'Fourth result should be wildcard-user-handler')

    // Test pattern-to-pattern with prepended handlers
    results = matcher.match('user/*')
    assertEquals(results.length, 5, 'Should match all user patterns')
    assertEquals(results[0].target, 'priority-admin', 'Second result should be priority-admin')
    assertEquals(results[1].target, 'once-guest', 'Fourth result should be once-guest')
    assertEquals(results[2].target, 'priority-wildcard-user', 'First result should be priority-wildcard-user')
    assertEquals(results[3].target, 'admin-handler', 'Third result should be admin-handler')
    assertEquals(results[4].target, 'guest-handler', 'Fifth result should be guest-handler')
  })

  console.log('\n✅ All Globstar tests completed!')
}
