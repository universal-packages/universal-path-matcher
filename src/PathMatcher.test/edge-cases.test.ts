import { assert } from 'console'

import { PathMatcher } from '../PathMatcher'
import { assertEquals, runTest } from '../utils.test'

export async function runEdgeCasesTests() {
  console.log('🧪 Running Edge Cases Tests')

  // Test empty paths and edge cases
  await runTest('empty paths and edge cases', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    matcher.addTarget('', 'root-handler')
    matcher.addTarget('**', 'global-handler')

    // Test empty path - only matches exact empty pattern, not ** due to path length requirements
    let results = matcher.match('')
    assertEquals(results.length, 1, 'Should match empty path with root handler only')
    assertEquals(results[0].target, 'root-handler', 'Should match root-handler')

    // Test that ** matches non-empty paths
    results = matcher.match('anything')
    assertEquals(results.length, 1, 'Should match global handler for non-empty paths')
    assertEquals(results[0].target, 'global-handler', 'Should match global-handler for non-empty paths')

    // Test paths with multiple slashes - use separate matcher to avoid ** interference
    const slashMatcher = new PathMatcher<string>({ useWildcards: true })
    slashMatcher.addTarget('admin//settings', 'admin-settings')
    results = slashMatcher.match('admin/settings')
    assertEquals(results.length, 1, 'Should normalize multiple slashes')
    assertEquals(results[0].target, 'admin-settings', 'Should match admin-settings')

    // Test leading and trailing slashes - use separate matcher
    const leadingTrailingMatcher = new PathMatcher<string>({ useWildcards: true })
    leadingTrailingMatcher.addTarget('/api/data/', 'api-data')
    results = leadingTrailingMatcher.match('api/data')
    assertEquals(results.length, 1, 'Should normalize leading/trailing slashes')
    assertEquals(results[0].target, 'api-data', 'Should match api-data')
  })

  // Test wildcard equivalencies
  await runTest('wildcard equivalencies', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    // These should be equivalent to **
    matcher.addTarget('**/**', 'double-globstar')
    matcher.addTarget('**/*', 'globstar-wildcard')
    matcher.addTarget('*/**', 'wildcard-globstar')

    const results = matcher.match('any/path/here')

    // All should match the same paths
    assertEquals(results.length, 3, 'Should match all equivalent patterns')
    assertEquals(results[0].target, 'double-globstar', 'First result should be double-globstar')
    assertEquals(results[1].target, 'globstar-wildcard', 'Second result should be globstar-wildcard')
    assertEquals(results[2].target, 'wildcard-globstar', 'Third result should be wildcard-globstar')
  })

  // Test complex object targets
  await runTest('complex object targets', () => {
    interface Handler {
      name: string
      method: string
      middleware: string[]
    }

    const matcher = new PathMatcher<Handler>({ useWildcards: true, useParams: true })

    const handler1: Handler = { name: 'getUserById', method: 'GET', middleware: ['auth'] }
    const handler2: Handler = { name: 'getAllUsers', method: 'GET', middleware: ['auth', 'admin'] }

    matcher.addTarget('api/users/:id', handler1)
    matcher.addTarget('api/users', handler2)

    const results = matcher.match('api/users/123')
    assertEquals(results.length, 1, 'Should match 1 handler')
    assertEquals(results[0].target.name, 'getUserById', 'Should match getUserById handler')
    assertEquals(results[0].target.method, 'GET', 'Should have GET method')
    assertEquals(results[0].target.middleware.length, 1, 'Should have 1 middleware')
    assertEquals(results[0].params?.id, '123', 'Should extract id parameter')
  })

  // Test performance with many targets
  await runTest('performance with many targets', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    // Add many targets
    for (let i = 0; i < 1000; i++) {
      matcher.addTarget(`pattern${i}/data`, `handler-${i}`)
    }

    matcher.addTarget('test/path', 'target-handler')

    const startTime = Date.now()
    const results = matcher.match('test/path')
    const endTime = Date.now()

    assertEquals(results.length, 1, 'Should find the correct target')
    assertEquals(results[0].target, 'target-handler', 'Should match target-handler')

    // Should be reasonably fast (less than 100ms for 1000 targets)
    const duration = endTime - startTime
    assert(duration < 100, `Matching should be fast, took ${duration}ms`)
  })

  // Test addTargetMany with zero times
  await runTest('addTargetMany with zero times', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTargetMany('test/path', 0, 'zero-times-handler')
    matcher.addTarget('test/path', 'normal-handler')

    const results = matcher.match('test/path')
    assertEquals(results.length, 1, 'Should only return normal handler')
    assertEquals(results[0].target, 'normal-handler', 'Should match normal-handler')
  })

  // Test with very long paths
  await runTest('very long paths', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    const longPath = Array(50).fill('segment').join('/')
    const longPattern = Array(50).fill('*').join('/')
    const longParamPattern = Array(25).fill(':param').concat(Array(25).fill('*')).join('/')

    matcher.addTarget(longPath, 'exact-long-handler')
    matcher.addTarget(longPattern, 'wildcard-long-handler')
    matcher.addTarget(longParamPattern, 'param-long-handler')

    let results = matcher.match(longPath)
    assertEquals(results.length, 3, 'Should match exact, wildcard, and param patterns')
    assertEquals(results[0].target, 'exact-long-handler', 'First result should be exact-long-handler')
    assertEquals(results[1].target, 'wildcard-long-handler', 'Second result should be wildcard-long-handler')
    assertEquals(results[2].target, 'param-long-handler', 'Third result should be param-long-handler')
  })

  // Test mixed delimiter normalization
  await runTest('mixed delimiter edge cases', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    matcher.addTarget('///', 'triple-slash')
    matcher.addTarget('/a/b/', 'leading-trailing')
    matcher.addTarget('a//b', 'multiple-internal')

    let results = matcher.match('')
    assertEquals(results.length, 1, 'Triple slash should normalize to empty and match')
    assertEquals(results[0].target, 'triple-slash', 'Should match triple-slash')

    results = matcher.match('a/b')
    assertEquals(results.length, 2, 'Should match both patterns')
    assertEquals(results[0].target, 'leading-trailing', 'First result should be leading-trailing')
    assertEquals(results[1].target, 'multiple-internal', 'Second result should be multiple-internal')
  })

  // Test caching behavior
  await runTest('caching behavior', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    matcher.addTarget('cached/path', 'cached-handler')
    matcher.addTarget('**/path', 'wildcard-handler')

    // First match should populate cache
    let results1 = matcher.match('cached/path')
    // Second match should use cache
    let results2 = matcher.match('cached/path')

    assertEquals(results1.length, results2.length, 'Cached results should be identical')
    assertEquals(results1[0].target, results2[0].target, 'Cached targets should be identical')
  })

  // Test parameter edge cases
  await runTest('parameter edge cases', () => {
    // Test single parameter value
    const singleMatcher = new PathMatcher<string>({ useParams: true })
    singleMatcher.addTarget(':value', 'single-param-handler')
    let results = singleMatcher.match('testvalue')
    assertEquals(results.length, 1, 'Should match single param')
    assertEquals(results[0].params?.value, 'testvalue', 'Should extract value parameter')

    // Test many parameters
    const manyMatcher = new PathMatcher<string>({ useParams: true })
    manyMatcher.addTarget(':a/:b/:c/:d/:e', 'many-params-handler')
    results = manyMatcher.match('1/2/3/4/5')
    assertEquals(results.length, 1, 'Should match many params')
    assertEquals(results[0].params?.a, '1', 'Should extract param a')
    assertEquals(results[0].params?.b, '2', 'Should extract param b')
    assertEquals(results[0].params?.e, '5', 'Should extract param e')

    // Test mixed static and params
    const mixedMatcher = new PathMatcher<string>({ useParams: true })
    mixedMatcher.addTarget('static/:param/static', 'mixed-handler')
    results = mixedMatcher.match('static/value/static')
    assertEquals(results.length, 1, 'Should match mixed pattern')
    assertEquals(results[0].params?.param, 'value', 'Should extract param value')
  })

  // Test wildcard pattern collision
  await runTest('wildcard pattern collision', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    // These patterns could potentially collide
    matcher.addTarget('*/b/c', 'pattern1')
    matcher.addTarget('a/*/c', 'pattern2')
    matcher.addTarget('a/b/*', 'pattern3')
    matcher.addTarget('**', 'global')

    let results = matcher.match('a/b/c')

    // Should match all patterns
    assertEquals(results.length, 4, 'Should match 4 patterns')
    assertEquals(results[0].target, 'pattern3', 'First result should be pattern3')
    assertEquals(results[1].target, 'pattern2', 'Second result should be pattern2')
    assertEquals(results[2].target, 'pattern1', 'Third result should be pattern1')
    assertEquals(results[3].target, 'global', 'Fourth result should be global')

    results = matcher.match('x/b/c')
    // Should match pattern1 and global
    assertEquals(results.length, 2, 'Should match 2 patterns')
    assertEquals(results[0].target, 'pattern1', 'First result should be pattern1 for x/b/c')
    assertEquals(results[1].target, 'global', 'Second result should be global')
  })

  // Test static path matching (no wildcards/params)
  await runTest('static path matching', () => {
    const matcher = new PathMatcher<string>() // No wildcards or params

    // Test all static methods with multiple additions
    matcher.addTarget('static/path', 'static-handler')
    matcher.addTargetOnce('once/path', 'once-handler')
    matcher.addTargetOnce('once/path', 'another-once-handler') // Add to existing path
    matcher.addTargetMany('many/path', 3, 'many-handler')
    matcher.addTargetMany('many/path', 2, 'another-many-handler') // Add to existing path
    matcher.prependTarget('static/path', 'prepend-handler')
    matcher.prependTarget('static/path', 'highest-prepend-handler') // Add to existing path
    matcher.prependTargetOnce('prepend-once/path', 'prepend-once-handler')
    matcher.prependTargetOnce('prepend-once/path', 'another-prepend-once-handler') // Add to existing path
    matcher.prependTargetMany('prepend-many/path', 2, 'prepend-many-handler')
    matcher.prependTargetMany('prepend-many/path', 3, 'another-prepend-many-handler') // Add to existing path

    // Test static matching
    let results = matcher.match('static/path')
    assertEquals(results.length, 3, 'Should match all handlers')
    assertEquals(results[0].target, 'highest-prepend-handler', 'First should be highest-prepend-handler')
    assertEquals(results[1].target, 'prepend-handler', 'Second should be prepend-handler')
    assertEquals(results[2].target, 'static-handler', 'Third should be static-handler')

    // Test once functionality in static mode (multiple once handlers)
    results = matcher.match('once/path')
    assertEquals(results.length, 2, 'Should match both once handlers')
    assertEquals(results[0].target, 'once-handler', 'First result should be once-handler')
    assertEquals(results[1].target, 'another-once-handler', 'Second result should be another-once-handler')

    // Second call should return nothing
    results = matcher.match('once/path')
    assertEquals(results.length, 0, 'Should not match after once used')

    // Test many functionality in static mode (multiple many handlers)
    for (let i = 0; i < 2; i++) {
      results = matcher.match('many/path')
      assertEquals(results.length, 2, `Many handlers should work ${i + 1} times`)
      assertEquals(results[0].target, 'many-handler', `Match ${i + 1} first result should be many-handler`)
      assertEquals(results[1].target, 'another-many-handler', `Match ${i + 1} second result should be another-many-handler`)
    }

    // Third call should only have many-handler
    results = matcher.match('many/path')
    assertEquals(results.length, 1, 'Should have one handler remaining')
    assertEquals(results[0].target, 'many-handler', 'Should match many-handler')

    // Fourth call should return nothing
    results = matcher.match('many/path')
    assertEquals(results.length, 0, 'Should not match after many uses exhausted')

    // Test prepend once in static mode (multiple prepend once handlers)
    results = matcher.match('prepend-once/path')
    assertEquals(results.length, 2, 'Should match both prepend once handlers')
    assertEquals(results[0].target, 'another-prepend-once-handler', 'First result should be another-prepend-once-handler')
    assertEquals(results[1].target, 'prepend-once-handler', 'Second result should be prepend-once-handler')

    results = matcher.match('prepend-once/path')
    assertEquals(results.length, 0, 'Should not match after prepend once used')

    // Test prepend many in static mode (multiple prepend many handlers)
    for (let i = 0; i < 2; i++) {
      results = matcher.match('prepend-many/path')
      assertEquals(results.length, 2, `Prepend many should work ${i + 1} times`)
      assertEquals(results[0].target, 'another-prepend-many-handler', `Match ${i + 1} first result should be another-prepend-many-handler`)
      assertEquals(results[1].target, 'prepend-many-handler', `Match ${i + 1} second result should be prepend-many-handler`)
    }

    // Third call should only have another-prepend-many-handler
    results = matcher.match('prepend-many/path')
    assertEquals(results.length, 1, 'Should have one prepend handler remaining')
    assertEquals(results[0].target, 'another-prepend-many-handler', 'Should match another-prepend-many-handler')

    results = matcher.match('prepend-many/path')
    assertEquals(results.length, 0, 'Should not match after prepend many exhausted')

    // Test static removeTarget
    matcher.addTarget('remove/test', 'handler1')
    matcher.addTarget('remove/test', 'handler2')
    results = matcher.match('remove/test')
    assertEquals(results.length, 2, 'Should have 2 handlers initially')

    matcher.removeTarget('remove/test', 'handler1')
    results = matcher.match('remove/test')
    assertEquals(results.length, 1, 'Should have 1 handler after removal')
    assertEquals(results[0].target, 'handler2', 'Should match handler2')
  })

  // Test parameter matching with wildcard conflict
  await runTest('parameter matching with wildcard conflict', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    matcher.addTarget(':param/test', 'param-handler')
    matcher.addTarget('*/test', 'wildcard-handler')

    // When path segment is '*', both actually match (the param handler also captures *)
    let results = matcher.match('*/test')
    assertEquals(results.length, 2, 'Both patterns match when segment is *')
    assertEquals(results[0].target, 'param-handler', 'First result should be param-handler')
    assertEquals(results[1].target, 'wildcard-handler', 'Second result should be wildcard-handler')

    // When path segment is normal, both should match
    results = matcher.match('value/test')
    assertEquals(results.length, 2, 'Should match both when segment is not *')
    assertEquals(results[0].target, 'wildcard-handler', 'First result should be wildcard-handler')
    assertEquals(results[1].target, 'param-handler', 'Second result should be param-handler')
  })

  // Test cached results with remaining matches
  await runTest('cached results with remaining matches', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    matcher.addTargetMany('cached/path', 2, 'limited-handler')
    matcher.addTarget('cached/path', 'permanent-handler')

    // First call should cache and return both
    let results = matcher.match('cached/path')
    assertEquals(results.length, 2, 'First call should return both handlers')

    // Second call should use cache but decrement limited handler
    results = matcher.match('cached/path')
    assertEquals(results.length, 2, 'Second call should still return both handlers')

    // Third call should only return permanent handler
    results = matcher.match('cached/path')
    assertEquals(results.length, 1, 'Third call should only return permanent handler')
    assertEquals(results[0].target, 'permanent-handler', 'Should be permanent-handler')
  })

  // Test parse cache reuse
  await runTest('parse cache reuse', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    // Add same pattern multiple times to trigger cache reuse
    matcher.addTarget('user/:id/profile', 'handler1')
    matcher.addTarget('user/:id/profile', 'handler2') // Should reuse parsed pattern
    matcher.addTarget('api/*/data', 'handler3')
    matcher.addTarget('api/*/data', 'handler4') // Should reuse parsed pattern

    let results = matcher.match('user/123/profile')
    assertEquals(results.length, 2, 'Should match both handlers for same pattern')

    results = matcher.match('api/v1/data')
    assertEquals(results.length, 2, 'Should match both handlers for wildcard pattern')
  })

  // Test remaining matches in pattern-to-pattern
  await runTest('remaining matches in pattern-to-pattern', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    matcher.addTargetOnce('specific/path', 'once-handler')
    matcher.addTarget('specific/path', 'regular-handler')

    // First exact match should get both
    let results = matcher.match('specific/path')
    assertEquals(results.length, 2, 'Should match both handlers')

    // Second exact match should only get regular handler
    results = matcher.match('specific/path')
    assertEquals(results.length, 1, 'Should only match regular handler')
    assertEquals(results[0].target, 'regular-handler', 'Should match regular-handler')
  })

  // Test final edge cases for 100% coverage
  await runTest('final edge cases for coverage', () => {
    // Test static mode with early returns
    const staticMatcher = new PathMatcher<string>()

    // Test early return when no target records exist
    staticMatcher.removeTarget('non-existent', 'handler')

    // Test early return in addTargetOnce when no existing records
    staticMatcher.addTargetOnce('new/path', 'handler')

    // Test early return in addTargetMany when no existing records
    staticMatcher.addTargetMany('another/path', 2, 'handler')

    // Test early return in prependTargetOnce when no existing records
    staticMatcher.prependTargetOnce('prepend/path', 'handler')

    // Test early return in prependTargetMany when no existing records
    staticMatcher.prependTargetMany('prepend-many/path', 3, 'handler')

    // Test that they all work
    let results = staticMatcher.match('new/path')
    assertEquals(results.length, 1, 'Should match new path')

    // Test advanced matcher edge cases
    const advancedMatcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    // Test pattern that doesn't match any existing patterns
    results = advancedMatcher.match('non-matching/**')
    assertEquals(results.length, 0, 'Should not match anything')

    // Test parameter pattern that conflicts with wildcard where currentSegment is not '*'
    advancedMatcher.addTarget(':param', 'param-handler')
    advancedMatcher.addTarget('*', 'wildcard-handler')

    results = advancedMatcher.match('normal-value')
    assertEquals(results.length, 2, 'Should match both param and wildcard for normal value')
  })

  // Test missing target record in cached results
  await runTest('missing target record in cached results', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    matcher.addTargetOnce('test/path', 'once-handler')

    // First match should work and remove the target
    let results = matcher.match('test/path')
    assertEquals(results.length, 1, 'Should match once')

    // Manually clear the allTargets to simulate missing target record
    matcher['_allTargets'] = []

    // Second match should use cache but find no target record
    results = matcher.match('test/path')
    assertEquals(results.length, 0, 'Should return empty when target record missing')
  })

  // Test zero times in static mode (addTargetMany edge case)
  await runTest('zero times in static mode', () => {
    const matcher = new PathMatcher<string>() // No wildcards/params

    // Adding with zero times should do nothing
    matcher.addTargetMany('test/path', 0, 'zero-handler')
    matcher.prependTargetMany('test/path', 0, 'zero-prepend-handler')

    const results = matcher.match('test/path')
    assertEquals(results.length, 0, 'Should not match anything when times is 0')
  })

  // Test pattern-to-pattern matching edge cases for 100% coverage
  await runTest('pattern-to-pattern matching edge cases', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    // Test case 1: Pattern that has non-globstar segments after consuming all matcher segments
    matcher.addTarget('short', 'short-handler')
    matcher.addTarget('long/path/here', 'long-handler')

    // Use pattern-to-pattern matching - pass a wildcard as the "path"
    // This will trigger the case where matcherIndex >= matcherSegments.length
    // but patternIndex < patternSegments.length with a non-globstar segment
    let results = matcher.match('short/extra/*') // This is pattern-to-pattern matching
    assertEquals(results.length, 0, 'Should not match when remaining pattern has non-globstar segments')

    // Test case 2: Pattern-to-pattern matching with globstar that matches zero segments
    matcher.addTarget('prefix/suffix', 'direct-handler')
    matcher.addTarget('prefix/**/suffix', 'globstar-handler')

    // Pattern-to-pattern: match a pattern that would match with globstar consuming zero segments
    results = matcher.match('prefix/**/suffix') // This is pattern-to-pattern matching
    assertEquals(results.length, 2, 'Should match both direct and globstar patterns')
    // The order depends on the internal matching algorithm, just verify both are present
    const handlerTargets = results.map((r) => r.target)
    assertEquals(handlerTargets.includes('globstar-handler'), true, 'Should include globstar-handler')
    assertEquals(handlerTargets.includes('direct-handler'), true, 'Should include direct-handler')

    // Test case 3: Pattern-to-pattern matching with parameters
    matcher.addTarget(':param/test', 'param-handler')
    matcher.addTarget('value/test', 'direct-value-handler')

    // Pattern-to-pattern: use parameter pattern as the "path"
    results = matcher.match(':param/test') // This is pattern-to-pattern matching
    assertEquals(results.length, 1, 'Should match parameter pattern in pattern-to-pattern')
    assertEquals(results[0].target, 'param-handler', 'Should match param-handler')

    // Test case 4: Test remaining pattern segments that are all globstars
    matcher.addTarget('base', 'base-handler')

    // Pattern-to-pattern: when pattern has more segments but they're all globstars
    results = matcher.match('base/**/**') // This is pattern-to-pattern matching
    assertEquals(results.length, 1, 'Should match when remaining segments are all globstars')
    assertEquals(results[0].target, 'base-handler', 'Should match base-handler')

    // Test case 5: Test remaining pattern segments that are NOT all globstars (line 668)
    const segmentMatcher = new PathMatcher<string>({ useWildcards: true })
    segmentMatcher.addTarget('short', 'short-handler')

    // Use pattern that has more segments but not all globstars - should NOT match
    results = segmentMatcher.match('short/static/**') // This is pattern-to-pattern matching
    assertEquals(results.length, 0, 'Should not match when remaining pattern has non-globstar segments')

    // Test case 6: Parameter in pattern-to-pattern matching (lines 692-693)
    const paramMatcher = new PathMatcher<string>({ useWildcards: true, useParams: true })
    paramMatcher.addTarget(':param/profile', 'param-profile-handler')

    // Pattern-to-pattern with parameter should trigger lines 692-693
    results = paramMatcher.match(':id/profile') // This is pattern-to-pattern matching
    assertEquals(results.length, 1, 'Should match parameter in pattern-to-pattern')
    assertEquals(results[0].target, 'param-profile-handler', 'Should match param-profile-handler')
  })

  // Test specific pattern-to-pattern matching methods for 100% coverage
  await runTest('pattern-to-pattern matching methods coverage', () => {
    // Test lines 692-693: parameter matching in pattern-to-pattern
    // This is very specific - we need pattern-to-pattern matching where a parameter is matched
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    // Register patterns where one has a parameter and another has a static value
    matcher.addTarget(':param/test', 'param-handler')
    matcher.addTarget('value/test', 'static-handler')

    // The key insight: when we match with a parameter pattern, it goes through
    // _matchPatternToPatterns -> _doesPatternMatchMatcher -> _matchSegments
    // and in _matchSegments, when patternSegment is ':param' and matcherSegment is 'value',
    // it should hit the parameter case at lines 692-693
    let results = matcher.match(':param/test') // This is pattern-to-pattern matching
    assertEquals(results.length, 1, 'Should match the parameter pattern itself')
    assertEquals(results[0].target, 'param-handler', 'Should match param-handler')

    // Another specific test to ensure the parameter logic is triggered
    const simpleParamMatcher = new PathMatcher<string>({ useWildcards: true, useParams: true })
    simpleParamMatcher.addTarget(':id', 'id-handler')
    simpleParamMatcher.addTarget('123', 'static-id-handler')

    // Match with parameter pattern - this triggers pattern-to-pattern matching
    results = simpleParamMatcher.match(':id')
    assertEquals(results.length, 1, 'Should match parameter pattern')
    assertEquals(results[0].target, 'id-handler', 'Should match id-handler')

    // Final verification that our tests work correctly
    const verificationMatcher = new PathMatcher<string>({ useWildcards: true, useParams: true })
    verificationMatcher.addTarget(':param', 'param-handler')
    verificationMatcher.addTarget('static', 'static-handler')

    // Normal parameter matching (not pattern-to-pattern)
    results = verificationMatcher.match('value')
    assertEquals(results.length, 1, 'Normal parameter matching works')
    assertEquals(results[0].target, 'param-handler', 'Should match param-handler')
    assertEquals(results[0].params?.param, 'value', 'Should extract parameter value')
  })

  console.log('\n✅ All Edge Cases tests completed!')
}
