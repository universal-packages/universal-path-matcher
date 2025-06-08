import { PathMatcher } from '../PathMatcher'
import { assertEquals, runTest } from '../utils.test'

export async function runWildcardsParamsTests() {
  console.log('🧪 Running Wildcards & Params Tests')

  // Test wildcard functionality
  await runTest('wildcard functionality', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    // Single wildcard
    matcher.addTarget('api/*/data', 'api-data-handler')
    matcher.addTarget('user/*/profile', 'user-profile-handler')

    // Multi-level wildcard
    matcher.addTarget('admin/**', 'admin-handler')
    matcher.addTarget('**/logs', 'logs-handler')
    matcher.addTarget('events/**/error', 'event-error-handler')

    // Global wildcards
    matcher.addTarget('*', 'single-level-handler')
    matcher.addTarget('**', 'global-handler')

    // Test single wildcard
    let results = matcher.match('api/v1/data')
    assertEquals(results.length, 2, 'api/v1/data should match 2 patterns')
    assertEquals(results[0].target, 'api-data-handler', 'First result should be api-data-handler')
    assertEquals(results[1].target, 'global-handler', 'Second result should be global-handler')

    results = matcher.match('user/123/profile')
    assertEquals(results.length, 2, 'user/123/profile should match 2 patterns')
    assertEquals(results[0].target, 'user-profile-handler', 'First result should be user-profile-handler')
    assertEquals(results[1].target, 'global-handler', 'Second result should be global-handler')

    // Test multi-level wildcard
    results = matcher.match('admin/users/list')
    assertEquals(results.length, 2, 'Should match admin and global handlers')
    assertEquals(results[0].target, 'admin-handler', 'First result should be admin-handler')
    assertEquals(results[1].target, 'global-handler', 'Second result should be global-handler')

    results = matcher.match('app/system/logs')
    assertEquals(results.length, 2, 'Should match logs and global handlers')
    assertEquals(results[0].target, 'logs-handler', 'First result should be logs-handler')
    assertEquals(results[1].target, 'global-handler', 'Second result should be global-handler')

    results = matcher.match('events/user/auth/error')
    assertEquals(results.length, 2, 'Should match event-error and global handlers')
    assertEquals(results[0].target, 'event-error-handler', 'First result should be event-error-handler')
    assertEquals(results[1].target, 'global-handler', 'Second result should be global-handler')

    // Test single level match
    results = matcher.match('anything')
    assertEquals(results.length, 2, 'Should match single-level and global handlers')
    assertEquals(results[0].target, 'single-level-handler', 'First result should be single-level-handler')
    assertEquals(results[1].target, 'global-handler', 'Second result should be global-handler')
  })

  // Test parameter functionality
  await runTest('parameter functionality', () => {
    const matcher = new PathMatcher<string>({ useParams: true })

    matcher.addTarget('user/:id', 'user-handler')
    matcher.addTarget('api/:version/users/:userId', 'api-user-handler')
    matcher.addTarget('shop/:store/product/:productId/review/:reviewId', 'review-handler')

    // Test single parameter
    let results = matcher.match('user/123')
    assertEquals(results.length, 1, 'Should match 1 target')
    assertEquals(results[0].target, 'user-handler', 'Should match user-handler')
    assertEquals(results[0].params?.id, '123', 'Should extract id parameter')

    // Test multiple parameters
    results = matcher.match('api/v2/users/user456')
    assertEquals(results.length, 1, 'Should match 1 target')
    assertEquals(results[0].target, 'api-user-handler', 'Should match api-user-handler')
    assertEquals(results[0].params?.version, 'v2', 'Should extract version parameter')
    assertEquals(results[0].params?.userId, 'user456', 'Should extract userId parameter')

    // Test complex parameters
    results = matcher.match('shop/store1/product/prod123/review/rev456')
    assertEquals(results.length, 1, 'Should match 1 target')
    assertEquals(results[0].target, 'review-handler', 'Should match review-handler')
    assertEquals(results[0].params?.store, 'store1', 'Should extract store parameter')
    assertEquals(results[0].params?.productId, 'prod123', 'Should extract productId parameter')
    assertEquals(results[0].params?.reviewId, 'rev456', 'Should extract reviewId parameter')
  })

  // Test combined wildcards and parameters
  await runTest('combined wildcards and parameters', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

    matcher.addTarget('user/:id/*', 'user-wildcard-handler')
    matcher.addTarget('*/users/:userId', 'namespace-user-handler')
    matcher.addTarget('api/:version/**/user/:id/*', 'complex-api-handler')

    // Test user with wildcard
    let results = matcher.match('user/123/profile')
    assertEquals(results.length, 1, 'Should match 1 target')
    assertEquals(results[0].target, 'user-wildcard-handler', 'Should match user-wildcard-handler')
    assertEquals(results[0].params?.id, '123', 'Should extract id parameter')

    // Test namespace users
    results = matcher.match('admin/users/user456')
    assertEquals(results.length, 1, 'Should match 1 target')
    assertEquals(results[0].target, 'namespace-user-handler', 'Should match namespace-user-handler')
    assertEquals(results[0].params?.userId, 'user456', 'Should extract userId parameter')

    // Test complex API pattern
    results = matcher.match('api/v2/auth/middleware/user/user789/data')
    assertEquals(results.length, 1, 'Should match 1 target')
    assertEquals(results[0].target, 'complex-api-handler', 'Should match complex-api-handler')
    assertEquals(results[0].params?.version, 'v2', 'Should extract version parameter')
    assertEquals(results[0].params?.id, 'user789', 'Should extract id parameter')
  })

  // Test pattern-to-pattern matching
  await runTest('pattern-to-pattern matching', () => {
    const matcher = new PathMatcher<string>({ useWildcards: true })

    matcher.addTarget('user/admin/profile', 'admin-profile')
    matcher.addTarget('user/guest/profile', 'guest-profile')
    matcher.addTarget('user/manager/settings', 'manager-settings')
    matcher.addTarget('api/v1/users', 'api-v1-users')
    matcher.addTarget('api/v2/users', 'api-v2-users')

    // Test wildcard input matching multiple patterns
    let results = matcher.match('user/*/profile')
    assertEquals(results.length, 2, 'Should match 2 profiles')
    assertEquals(results[0].target, 'admin-profile', 'First result should be admin-profile')
    assertEquals(results[1].target, 'guest-profile', 'Second result should be guest-profile')

    // Test globstar matching
    results = matcher.match('api/**')
    assertEquals(results.length, 2, 'Should match 2 API endpoints')
    assertEquals(results[0].target, 'api-v1-users', 'First result should be api-v1-users')
    assertEquals(results[1].target, 'api-v2-users', 'Second result should be api-v2-users')
  })

  // Test custom level delimiter
  await runTest('custom level delimiter', () => {
    const matcher = new PathMatcher<string>({ levelDelimiter: '.' })

    matcher.addTarget('user.created', 'user-created-handler')
    matcher.addTarget('user.updated', 'user-updated-handler')

    let results = matcher.match('user.created')
    assertEquals(results.length, 1, 'Should match with custom delimiter')
    assertEquals(results[0].target, 'user-created-handler', 'Should match user-created-handler')

    // Should not match with default delimiter
    results = matcher.match('user/created')
    assertEquals(results.length, 0, 'Should not match with different delimiter')
  })

  await runTest('wildcard for boolean targets', () => {
    const matcher = new PathMatcher<boolean>({ useWildcards: true })

    matcher.addTarget('user/*', true)
    matcher.addTarget('user/admin', false)
    matcher.addTarget('user/guest', false)

    const results1 = matcher.match('user/admin')
    assertEquals(results1.length, 2, 'Should match 2 targets')
    assertEquals(results1[0].target, false, 'Should match user/admin')
    assertEquals(results1[1].target, true, 'Should match user/*')

    const results2 = matcher.match('user/guest')
    assertEquals(results2.length, 2, 'Should match 2 targets')
    assertEquals(results2[0].target, false, 'Should match user/guest')
    assertEquals(results2[1].target, true, 'Should match user/*')

    const results3 = matcher.match('user/*')
    assertEquals(results3.length, 3, 'Should match 3 targets')
    assertEquals(results3[0].target, true, 'Should match user/*')
    assertEquals(results3[1].target, false, 'Should match user/admin')
    assertEquals(results3[2].target, false, 'Should match user/guest')

    const results4 = matcher.match('*')
    assertEquals(results4.length, 0, 'Should not match since is a 1 level wildcard')

    const results5 = matcher.match('**')
    assertEquals(results5.length, 3, 'Should match 3 targets')
    assertEquals(results5[0].target, true, 'Should match user/*')
    assertEquals(results5[1].target, false, 'Should match user/admin')
    assertEquals(results5[2].target, false, 'Should match user/guest')
  })

  await runTest('wildcard for arrow functions', () => {
    const matcher = new PathMatcher<() => void>({ useWildcards: true })

    matcher.addTarget('user/*', () => {})
    matcher.addTarget('user/admin', () => {})
    matcher.addTarget('user/guest', () => {})

    const results1 = matcher.match('user/admin')
    assertEquals(results1.length, 2, 'Should match 2 targets')

    const results2 = matcher.match('user/guest')
    assertEquals(results2.length, 2, 'Should match 2 targets')

    const results3 = matcher.match('user/*')
    assertEquals(results3.length, 3, 'Should match 3 targets')

    const results4 = matcher.match('*')
    assertEquals(results4.length, 0, 'Should not match since is a 1 level wildcard')

    const results5 = matcher.match('**')
    assertEquals(results5.length, 3, 'Should match 3 targets')
  })

  await runTest('wildcard for async arrow functions', () => {
    const matcher = new PathMatcher<() => Promise<void>>({ useWildcards: true })

    matcher.addTarget('user/*', () => Promise.resolve())
    matcher.addTarget('user/admin', () => Promise.resolve())
    matcher.addTarget('user/guest', () => Promise.resolve())

    const results1 = matcher.match('user/admin')
    assertEquals(results1.length, 2, 'Should match 2 targets')

    const results2 = matcher.match('user/guest')
    assertEquals(results2.length, 2, 'Should match 2 targets')

    const results3 = matcher.match('user/*')
    assertEquals(results3.length, 3, 'Should match 3 targets')

    const results4 = matcher.match('*')
    assertEquals(results4.length, 0, 'Should not match since is a 1 level wildcard')

    const results5 = matcher.match('**')
    assertEquals(results5.length, 3, 'Should match 3 targets')
  })

  await runTest('wildcard for named functions', () => {
    const matcher = new PathMatcher<Function>({ useWildcards: true })

    matcher.addTarget('user/*', () => {})
    matcher.addTarget('user/admin', () => {})
    matcher.addTarget('user/guest', () => {})

    const results1 = matcher.match('user/admin')
    assertEquals(results1.length, 2, 'Should match 2 targets')

    const results2 = matcher.match('user/guest')
    assertEquals(results2.length, 2, 'Should match 2 targets')

    const results3 = matcher.match('user/*')
    assertEquals(results3.length, 3, 'Should match 3 targets')

    const results4 = matcher.match('*')
    assertEquals(results4.length, 0, 'Should not match since is a 1 level wildcard')

    const results5 = matcher.match('**')
    assertEquals(results5.length, 3, 'Should match 3 targets')
  })

  await runTest('wildcard for class constructor', () => {
    class TestClass {
      constructor(public value: string) {}
      getValue() {
        return this.value
      }
    }
    class TestClass2 extends TestClass {}
    class TestClass3 extends TestClass {}

    const matcher = new PathMatcher<typeof TestClass>({ useWildcards: true })

    matcher.addTarget('user/*', TestClass)
    matcher.addTarget('user/admin', TestClass2)
    matcher.addTarget('user/guest', TestClass3)

    const results1 = matcher.match('user/admin')
    assertEquals(results1.length, 2, 'Should match 2 targets')
    assertEquals(results1[0].target, TestClass2, 'Should match user/admin')
    assertEquals(results1[1].target, TestClass, 'Should match user/*')

    const results2 = matcher.match('user/guest')
    assertEquals(results2.length, 2, 'Should match 2 targets')
    assertEquals(results2[0].target, TestClass3, 'Should match user/guest')
    assertEquals(results2[1].target, TestClass, 'Should match user/*')

    const results3 = matcher.match('user/*')
    assertEquals(results3.length, 3, 'Should match 3 targets')

    const results4 = matcher.match('*')
    assertEquals(results4.length, 0, 'Should not match since is a 1 level wildcard')

    const results5 = matcher.match('**')
    assertEquals(results5.length, 3, 'Should match 3 targets')
  })

  await runTest('wildcard for class instances', () => {
    class TestClass {
      constructor(public value: string) {}
      getValue() {
        return this.value
      }
    }

    const instance1 = new TestClass('user-wildcard-handler')
    const instance2 = new TestClass('user-admin-handler')
    const instance3 = new TestClass('user-guest-handler')

    const matcher = new PathMatcher<TestClass>({ useWildcards: true })

    matcher.addTarget('user/*', instance1)
    matcher.addTarget('user/admin', instance2)
    matcher.addTarget('user/guest', instance3)

    const results1 = matcher.match('user/admin')
    assertEquals(results1.length, 2, 'Should match 2 targets')
    assertEquals(results1[0].target, instance2, 'Should match user/admin')
    assertEquals(results1[1].target, instance1, 'Should match user/*')

    const results2 = matcher.match('user/guest')
    assertEquals(results2.length, 2, 'Should match 2 targets')
    assertEquals(results2[0].target, instance3, 'Should match user/guest')
    assertEquals(results2[1].target, instance1, 'Should match user/*')

    const results3 = matcher.match('user/*')
    assertEquals(results3.length, 3, 'Should match 3 targets')
    assertEquals(results3[0].target, instance1, 'Should match user/*')
    assertEquals(results3[1].target, instance2, 'Should match user/admin')
    assertEquals(results3[2].target, instance3, 'Should match user/guest')

    const results4 = matcher.match('*')
    assertEquals(results4.length, 0, 'Should not match since is a 1 level wildcard')

    const results5 = matcher.match('**')
    assertEquals(results5.length, 3, 'Should match 3 targets')
    assertEquals(results5[0].target, instance1, 'Should match user/*')
    assertEquals(results5[1].target, instance2, 'Should match user/admin')
    assertEquals(results5[2].target, instance3, 'Should match user/guest')
  })

  await runTest('wildcard for class instances with params', () => {
    const pathMatcher = new PathMatcher<() => any>({ useWildcards: true, levelDelimiter: ':' })

    const captured: string[] = []

    pathMatcher.addTarget('user:admin', () => {
      captured.push('user:admin')
    })
    pathMatcher.addTarget('user:guest', () => {
      captured.push('user:guest')
    })
    pathMatcher.addTarget('user:*', () => {
      captured.push('user:*')
    })

    const results1 = pathMatcher.match('user:admin')
    for (const result of results1) {
      result.target()
    }

    assertEquals(results1.length, 2, 'Should match 2 targets')
    assertEquals(captured[0], 'user:admin', 'Should match user:admin')
    assertEquals(captured[1], 'user:*', 'Should match user:*')

    captured.length = 0

    const results2 = pathMatcher.match('user:guest')
    for (const result of results2) {
      result.target()
    }
    assertEquals(results2.length, 2, 'Should match 2 targets')
    assertEquals(captured[0], 'user:guest', 'Should match user:guest')
    assertEquals(captured[1], 'user:*', 'Should match user:*')

    captured.length = 0

    const results3 = pathMatcher.match('user:*')
    for (const result of results3) {
      result.target()
    }

    assertEquals(results3.length, 3, 'Should match 3 targets')
    assertEquals(captured[0], 'user:admin', 'Should match user:admin')
    assertEquals(captured[1], 'user:guest', 'Should match user:guest')
    assertEquals(captured[2], 'user:*', 'Should match user:*')

    captured.length = 0

    const results4 = pathMatcher.match('*')
    for (const result of results4) {
      result.target()
    }

    assertEquals(results4.length, 0, 'Should not match since is a 1 level wildcard')
  })

  console.log('\n✅ All Wildcards & Params tests completed!')
}
