import { PathMatcher } from '../PathMatcher'
import { assertEquals, runTest } from '../utils.test'

export async function runMatchingTests() {
  console.log('🧪 Running Matching Tests')

  // Basic functionality tests
  await runTest('addTarget and match', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('user/created', 'user-created-target')
    matcher.addTarget('user/created', 'user-created-target-2')
    matcher.addTarget('user/updated', 'user-updated-target')
    matcher.addTarget('user/deleted', 'user-deleted-target')

    const userCreated = matcher.match('user/created')
    const userUpdated = matcher.match('user/updated')
    const userDeleted = matcher.match('user/deleted')
    const userNoMatch = matcher.match('user/not-found')

    assertEquals(userCreated.length, 2, 'user/created should return 2 targets')
    assertEquals(userCreated[0].target, 'user-created-target', 'user/created should return user-created-target')
    assertEquals(userCreated[1].target, 'user-created-target-2', 'user/created should return user-created-target-2')
    assertEquals(userUpdated.length, 1, 'user/updated should return 1 target')
    assertEquals(userUpdated[0].target, 'user-updated-target', 'user/updated should return user-updated-target')
    assertEquals(userDeleted.length, 1, 'user/deleted should return 1 target')
    assertEquals(userDeleted[0].target, 'user-deleted-target', 'user/deleted should return user-deleted-target')
    assertEquals(userNoMatch.length, 0, 'user/not-found should return 0 targets')
  })

  // Test addTargetOnce
  await runTest('addTargetOnce functionality', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTargetOnce('one-time/event', 'one-time-handler')
    matcher.addTargetOnce('one-time/event', 'another-one-time-handler')
    matcher.addTargetOnce('one-time/event', 'third-one-time-handler')
    matcher.addTarget('one-time/event', 'permanent-handler')

    // First match should return all handlers
    let results = matcher.match('one-time/event')
    assertEquals(results.length, 4, 'First match should return 4 targets')
    assertEquals(results[0].target, 'one-time-handler', 'First result should be one-time-handler')
    assertEquals(results[1].target, 'another-one-time-handler', 'Second result should be another-one-time-handler')
    assertEquals(results[2].target, 'third-one-time-handler', 'Third result should be third-one-time-handler')
    assertEquals(results[3].target, 'permanent-handler', 'Fourth result should be permanent-handler')

    // Second match should only return permanent handler (all once handlers consumed)
    results = matcher.match('one-time/event')
    assertEquals(results.length, 1, 'Second match should return 1 target')
    assertEquals(results[0].target, 'permanent-handler', 'Result should be permanent-handler')
  })

  // Test addTargetMany
  await runTest('addTargetMany functionality', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTargetMany('limited/resource', 3, 'limited-handler')
    matcher.addTargetMany('limited/resource', 2, 'another-limited-handler') // Add to existing path
    matcher.addTarget('limited/resource', 'permanent-handler')

    // Should work for the first few times, returning all handlers
    for (let i = 0; i < 2; i++) {
      const results = matcher.match('limited/resource')
      assertEquals(results.length, 3, `Match ${i + 1} should return 3 targets`)
      assertEquals(results[0].target, 'limited-handler', `Match ${i + 1} first result should be limited-handler`)
      assertEquals(results[1].target, 'another-limited-handler', `Match ${i + 1} second result should be another-limited-handler`)
      assertEquals(results[2].target, 'permanent-handler', `Match ${i + 1} third result should be permanent-handler`)
    }

    // Third match should only have limited-handler and permanent-handler (another-limited exhausted)
    let results = matcher.match('limited/resource')
    assertEquals(results.length, 2, 'Third match should return 2 targets')
    assertEquals(results[0].target, 'limited-handler', 'First result should be limited-handler')
    assertEquals(results[1].target, 'permanent-handler', 'Second result should be permanent-handler')

    // Fourth match should only return permanent handler (all limited handlers exhausted)
    results = matcher.match('limited/resource')
    assertEquals(results.length, 1, 'Fourth match should return 1 target')
    assertEquals(results[0].target, 'permanent-handler', 'Result should be permanent-handler')
  })

  // Test prepend functionality
  await runTest('prependTarget functionality', () => {
    const matcher = new PathMatcher<string>()
    matcher.prependTarget('api/data', 'priority-handler')
    matcher.prependTarget('api/data', 'highest-priority-handler') // Add to existing path
    matcher.addTarget('api/data', 'normal-handler')
    matcher.addTarget('api/data', 'another-handler')

    const results = matcher.match('api/data')
    assertEquals(results.length, 4, 'Should return 4 targets')
    assertEquals(results[0].target, 'highest-priority-handler', 'First result should be highest-priority-handler')
    assertEquals(results[1].target, 'priority-handler', 'Second result should be priority-handler')
    assertEquals(results[2].target, 'normal-handler', 'Third result should be normal-handler')
    assertEquals(results[3].target, 'another-handler', 'Fourth result should be another-handler')
  })

  // Test prependTargetOnce
  await runTest('prependTargetOnce functionality', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/data', 'normal-handler')
    matcher.prependTargetOnce('api/data', 'one-time-priority')
    matcher.prependTargetOnce('api/data', 'another-one-time-priority') // Add to existing path

    // First match should return all three handlers in priority order
    let results = matcher.match('api/data')
    assertEquals(results.length, 3, 'First match should return 3 targets')
    assertEquals(results[0].target, 'another-one-time-priority', 'First result should be another-one-time-priority')
    assertEquals(results[1].target, 'one-time-priority', 'Second result should be one-time-priority')
    assertEquals(results[2].target, 'normal-handler', 'Third result should be normal-handler')

    // Second match should only return normal handler
    results = matcher.match('api/data')
    assertEquals(results.length, 1, 'Second match should return 1 target')
    assertEquals(results[0].target, 'normal-handler', 'Result should be normal-handler')
  })

  // Test prependTargetMany
  await runTest('prependTargetMany functionality', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/data', 'normal-handler')
    matcher.prependTargetMany('api/data', 2, 'limited-priority')
    matcher.prependTargetMany('api/data', 3, 'another-limited-priority') // Add to existing path

    // First three matches should include all handlers
    for (let i = 0; i < 2; i++) {
      const results = matcher.match('api/data')
      assertEquals(results.length, 3, `Match ${i + 1} should return 3 targets`)
      assertEquals(results[0].target, 'another-limited-priority', `Match ${i + 1} first result should be another-limited-priority`)
      assertEquals(results[1].target, 'limited-priority', `Match ${i + 1} second result should be limited-priority`)
      assertEquals(results[2].target, 'normal-handler', `Match ${i + 1} third result should be normal-handler`)
    }

    // Third match should only have another-limited-priority and normal-handler
    let results = matcher.match('api/data')
    assertEquals(results.length, 2, 'Third match should return 2 targets')
    assertEquals(results[0].target, 'another-limited-priority', 'First result should be another-limited-priority')
    assertEquals(results[1].target, 'normal-handler', 'Second result should be normal-handler')

    // Fourth match should only have normal-handler
    results = matcher.match('api/data')
    assertEquals(results.length, 1, 'Fourth match should return 1 target')
    assertEquals(results[0].target, 'normal-handler', 'Result should be normal-handler')
  })

  // Test removeTarget
  await runTest('removeTarget functionality', () => {
    const matcher = new PathMatcher<string>()
    matcher.addTarget('api/users', 'handler-1')
    matcher.addTarget('api/users', 'handler-2')
    matcher.addTarget('api/users', 'handler-3')

    let results = matcher.match('api/users')
    assertEquals(results.length, 3, 'Should initially return 3 targets')

    matcher.removeTarget('api/users', 'handler-2')
    results = matcher.match('api/users')
    assertEquals(results.length, 2, 'Should return 2 targets after removal')
    assertEquals(results[0].target, 'handler-1', 'First result should be handler-1')
    assertEquals(results[1].target, 'handler-3', 'Second result should be handler-3')

    // Remove non-existent target
    matcher.removeTarget('api/users', 'non-existent')
    results = matcher.match('api/users')
    assertEquals(results.length, 2, 'Should still return 2 targets after removing non-existent')
  })

  console.log('\n✅ All Matching tests completed!')
}
