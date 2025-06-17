# Path Matcher

[![npm version](https://badge.fury.io/js/@universal-packages%2Fpath-matcher.svg)](https://www.npmjs.com/package/@universal-packages/path-matcher)
[![Testing](https://github.com/universal-packages/universal-path-matcher/actions/workflows/testing.yml/badge.svg)](https://github.com/universal-packages/universal-path-matcher/actions/workflows/testing.yml)
[![codecov](https://codecov.io/gh/universal-packages/universal-path-matcher/branch/main/graph/badge.svg?token=CXPJSN8IGL)](https://codecov.io/gh/universal-packages/universal-path-matcher)

Universal Path Matcher is a powerful and flexible library for matching paths against patterns with support for wildcards, parameters, and complex routing scenarios. It provides an efficient way to register targets against path patterns and retrieve matching targets when given a specific path, making it ideal for routing systems, event handling, and resource matching.

## Installation

```shell
npm install @universal-packages/path-matcher
```

## Usage

## PathMatcher `class`

The `PathMatcher` class provides efficient path pattern matching with support for static paths, wildcards, and parameters. It uses optimized storage strategies based on the features you enable.

```ts
import { PathMatcher } from '@universal-packages/path-matcher'

const matcher = new PathMatcher<string>()
matcher.addTarget('user/profile', 'user-profile-handler')
matcher.addTarget('admin/settings', 'admin-settings-handler')

const results = matcher.match('user/profile')
console.log(results) // [{ matcher: 'user/profile', matchedPath: 'user/profile', target: 'user-profile-handler' }]
```

### Constructor

```ts
new PathMatcher<PathTarget>(options?: PathMatcherOptions)
```

Creates a new PathMatcher instance with optional configuration.

#### PathMatcherOptions

- **`levelDelimiter`**: `string` (default: `'/'`)
  The character used to separate path segments.
- **`useWildcards`**: `boolean` (default: `false`)
  Enable wildcard matching with `*` (single segment) and `**` (multiple segments).
- **`useParams`**: `boolean` (default: `false`)
  Enable parameter extraction with `:paramName` syntax.

### Getters

#### targetsCount

```ts
get targetsCount(): number
```

Returns the total number of registered targets across all matchers.

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('api/users', 'handler1')
matcher.addTarget('api/users', 'handler2')
matcher.addTarget('api/posts', 'handler3')

console.log(matcher.targetsCount) // 3
```

#### targets

```ts
get targets(): PathTarget[]
```

Returns an array of all registered targets in the order they were added (respecting prepend operations).

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('api/users', 'handler1')
matcher.prependTarget('api/users', 'handler0')
matcher.addTarget('api/posts', 'handler2')

console.log(matcher.targets) // ['handler0', 'handler1', 'handler2']
```

#### matchers

```ts
get matchers(): string[]
```

Returns an array of all unique registered matcher patterns.

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('api/users', 'handler1')
matcher.addTarget('api/users', 'handler2')
matcher.addTarget('api/posts', 'handler3')

console.log(matcher.matchers) // ['api/users', 'api/posts']
```

### Instance Methods

#### addTarget

```ts
addTarget(matcher: string, target: PathTarget): void
```

Adds a target that will be returned when a path matches the specified matcher pattern.

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('api/users', 'users-handler')
matcher.addTarget('api/posts', 'posts-handler')

const results = matcher.match('api/users')
console.log(results[0].target) // 'users-handler'
```

#### addTargetOnce

```ts
addTargetOnce(matcher: string, target: PathTarget): void
```

Adds a target that will be returned once when matched, then automatically removed.

```ts
const matcher = new PathMatcher<string>()
matcher.addTargetOnce('one-time/event', 'one-time-handler')

// First match
let results = matcher.match('one-time/event')
console.log(results.length) // 1

// Second match
results = matcher.match('one-time/event')
console.log(results.length) // 0 (target was removed)
```

#### addTargetMany

```ts
addTargetMany(matcher: string, times: number, target: PathTarget): void
```

Adds a target that will be returned a specified number of times before being automatically removed.

```ts
const matcher = new PathMatcher<string>()
matcher.addTargetMany('limited/resource', 3, 'limited-handler')

// Will match 3 times, then be removed
for (let i = 0; i < 5; i++) {
  const results = matcher.match('limited/resource')
  console.log(`Match ${i + 1}: ${results.length} results`)
}
// Output: 1, 1, 1, 0, 0
```

#### prependTarget

```ts
prependTarget(matcher: string, target: PathTarget): void
```

Adds a target that will appear at the beginning of the results list.

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('api/data', 'normal-handler')
matcher.prependTarget('api/data', 'priority-handler')

const results = matcher.match('api/data')
console.log(results[0].target) // 'priority-handler'
console.log(results[1].target) // 'normal-handler'
```

#### prependTargetOnce

```ts
prependTargetOnce(matcher: string, target: PathTarget): void
```

Adds a target that appears first in results and is removed after one use.

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('api/data', 'normal-handler')
matcher.prependTargetOnce('api/data', 'one-time-priority')

// First match
let results = matcher.match('api/data')
console.log(results[0].target) // 'one-time-priority'

// Second match
results = matcher.match('api/data')
console.log(results[0].target) // 'normal-handler'
```

#### prependTargetMany

```ts
prependTargetMany(matcher: string, times: number, target: PathTarget): void
```

Adds a target that appears first in results for a specified number of matches.

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('api/data', 'normal-handler')
matcher.prependTargetMany('api/data', 2, 'limited-priority')

// First two matches include the limited priority target
// After that, only the normal handler remains
```

#### removeTarget

```ts
removeTarget(matcher: string | string[], target: PathTarget): void
```

Removes a specific target from the specified matcher pattern(s). You can pass either a single matcher string or an array of matcher strings to remove the target from multiple patterns at once.

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('api/users', 'handler-1')
matcher.addTarget('api/users', 'handler-2')
matcher.addTarget('api/posts', 'handler-1')
matcher.addTarget('api/comments', 'handler-3')

// Remove from a single matcher
matcher.removeTarget('api/users', 'handler-1')

const userResults = matcher.match('api/users')
console.log(userResults.length) // 1
console.log(userResults[0].target) // 'handler-2'

// Remove from multiple matchers at once
matcher.removeTarget(['api/posts', 'api/comments'], 'handler-1')

const postResults = matcher.match('api/posts')
const commentResults = matcher.match('api/comments')
console.log(postResults.length) // 0 (handler-1 was removed)
console.log(commentResults.length) // 1 (handler-1 didn't exist here, so handler-3 remains)
```

#### removeAllTargets

```ts
removeAllTargets(matchers?: string | string[]): void
```

Removes all targets from all matcher patterns, or removes all targets from specific matcher patterns. When called without arguments, it clears the entire matcher. When called with matcher(s), it removes all targets from only those specific patterns, effectively removing those matchers.

```ts
const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

// Set up various matchers with multiple targets each
matcher.addTarget('api/users/:id', 'user-handler-1')
matcher.addTarget('api/users/:id', 'user-handler-2')
matcher.addTarget('api/posts/*', 'post-handler-1')
matcher.addTarget('api/posts/*', 'post-handler-2')
matcher.addTarget('admin/**', 'admin-handler')
matcher.addTarget('logs/**/error', 'error-handler')

console.log(matcher.targetsCount) // 6
console.log(matcher.matchers.length) // 4

// Remove all targets from a specific matcher
matcher.removeAllTargets('api/users/:id')

console.log(matcher.targetsCount) // 4 (2 user handlers removed)
console.log(matcher.matchers.length) // 3 (user matcher removed)

const userResults = matcher.match('api/users/123')
const postResults = matcher.match('api/posts/new')

console.log(userResults.length) // 0 (no user handlers remain)
console.log(postResults.length) // 2 (post handlers still exist)

// Remove all targets from multiple matchers at once
matcher.removeAllTargets(['api/posts/*', 'logs/**/error'])

console.log(matcher.targetsCount) // 1 (only admin handler remains)
console.log(matcher.matchers) // ['admin/**']

// Remove all targets from all matchers (original behavior)
matcher.removeAllTargets()

console.log(matcher.targetsCount) // 0
console.log(matcher.matchers.length) // 0
console.log(matcher.targets.length) // 0

// All match operations will return empty arrays
const results = matcher.match('admin/anything')
console.log(results.length) // 0

// You can add new targets after clearing
matcher.addTarget('new/path', 'new-handler')
```

#### match

```ts
match(path: string | string[]): PathTargetResult<PathTarget>[]
```

Matches a path or array of paths against all registered patterns and returns matching targets. When an array is provided, all targets that match any of the provided paths are returned.

Each result includes:

- **`matcher`**: The pattern that was registered
- **`matchedPath`**: The actual path that was matched (useful for debugging and logging)
- **`target`**: The registered target
- **`params`**: Extracted parameters (when using parameter patterns)

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('user/profile', 'profile-handler')
matcher.addTarget('user/settings', 'settings-handler')
matcher.addTarget('api/data', 'data-handler')

// Single path matching
const singleResult = matcher.match('user/profile')
console.log(singleResult[0])
// { matcher: 'user/profile', matchedPath: 'user/profile', target: 'profile-handler' }

// Multiple paths matching
const multipleResults = matcher.match(['user/profile', 'user/settings', 'api/data'])
console.log(multipleResults.length) // 3
console.log(multipleResults.map((r) => r.target))
// ['profile-handler', 'settings-handler', 'data-handler']

// Array with non-matching paths (only existing matches are returned)
const partialResults = matcher.match(['user/profile', 'non-existent', 'api/data'])
console.log(partialResults.length) // 2 (only matching paths return results)

// Empty array returns empty results
const emptyResults = matcher.match([])
console.log(emptyResults.length) // 0
```

#### hasMatchers

```ts
hasMatchers(matchers: string[]): boolean
```

Checks if targets have been registered for all provided matcher patterns.

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('api/users', 'handler1')
matcher.addTarget('api/posts', 'handler2')

console.log(matcher.hasMatchers(['api/users'])) // true
console.log(matcher.hasMatchers(['api/users', 'api/posts'])) // true
console.log(matcher.hasMatchers(['api/users', 'api/comments'])) // false
console.log(matcher.hasMatchers([])) // true (empty array always returns true)
```

#### getTargetsCount

```ts
getTargetsCount(matcher?: string): number
```

Returns the number of registered targets for a specific matcher pattern, or the total count if no matcher is specified. When called without arguments, it returns the same value as the `targetsCount` getter.

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('api/users', 'handler1')
matcher.addTarget('api/users', 'handler2')
matcher.addTarget('api/posts', 'handler3')

// Get total count (same as targetsCount getter)
console.log(matcher.getTargetsCount()) // 3

// Get count for specific matcher
console.log(matcher.getTargetsCount('api/users')) // 2
console.log(matcher.getTargetsCount('api/posts')) // 1
console.log(matcher.getTargetsCount('api/comments')) // 0 (non-existent)

// Works with all matcher types
const wildcardMatcher = new PathMatcher<string>({ useWildcards: true, useParams: true })
wildcardMatcher.addTarget('user/:id/*', 'handler1')
wildcardMatcher.addTarget('user/:id/*', 'handler2')
wildcardMatcher.addTarget('admin/**', 'handler3')

console.log(wildcardMatcher.getTargetsCount('user/:id/*')) // 2
console.log(wildcardMatcher.getTargetsCount('admin/**')) // 1
console.log(wildcardMatcher.getTargetsCount()) // 3
```

#### getTargets

```ts
getTargets(matcher?: string | string[]): GetTargetsResult<PathTarget>[]
```

Returns targets registered for specific matcher pattern(s), or all targets with their associated matchers if no matcher is specified. Unlike the `targets` getter, this method returns structured objects containing both the matcher and target information. You can pass either a single matcher string or an array of matcher strings to get targets from multiple patterns at once.

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('api/users', 'handler1')
matcher.addTarget('api/users', 'handler2')
matcher.addTarget('api/posts', 'handler3')

// Get all targets with their matchers
const allTargets = matcher.getTargets()
console.log(allTargets)
// [
//   { matcher: 'api/users', target: 'handler1' },
//   { matcher: 'api/users', target: 'handler2' },
//   { matcher: 'api/posts', target: 'handler3' }
// ]

// Get targets for specific matcher
const userTargets = matcher.getTargets('api/users')
console.log(userTargets)
// [
//   { matcher: 'api/users', target: 'handler1' },
//   { matcher: 'api/users', target: 'handler2' }
// ]

const postTargets = matcher.getTargets('api/posts')
console.log(postTargets) // [{ matcher: 'api/posts', target: 'handler3' }]

const emptyTargets = matcher.getTargets('api/comments')
console.log(emptyTargets) // []

// Works with all matcher types
const advancedMatcher = new PathMatcher<string>({ useWildcards: true, useParams: true })
advancedMatcher.addTarget('user/:id/*', 'user-handler1')
advancedMatcher.addTarget('user/:id/*', 'user-handler2')
advancedMatcher.addTarget('admin/**', 'admin-handler')

const userWildcardTargets = advancedMatcher.getTargets('user/:id/*')
console.log(userWildcardTargets)
// [
//   { matcher: 'user/:id/*', target: 'user-handler1' },
//   { matcher: 'user/:id/*', target: 'user-handler2' }
// ]

// Preserve order (prepended targets appear first)
const orderMatcher = new PathMatcher<string>()
orderMatcher.addTarget('api/data', 'handler1')
orderMatcher.prependTarget('api/data', 'handler0')
orderMatcher.addTarget('api/data', 'handler2')

const orderedTargets = orderMatcher.getTargets('api/data')
console.log(orderedTargets.map((t) => t.target)) // ['handler0', 'handler1', 'handler2']

// Array of matchers - get targets from multiple patterns at once
const multiMatcher = new PathMatcher<string>()
multiMatcher.addTarget('api/users', 'user-handler1')
multiMatcher.addTarget('api/users', 'user-handler2')
multiMatcher.addTarget('api/posts', 'post-handler')
multiMatcher.addTarget('api/comments', 'comment-handler')
multiMatcher.addTarget('admin/settings', 'admin-handler')

const multiResults = multiMatcher.getTargets(['api/users', 'api/posts', 'api/comments'])
console.log(multiResults)
// [
//   { matcher: 'api/users', target: 'user-handler1' },
//   { matcher: 'api/users', target: 'user-handler2' },
//   { matcher: 'api/posts', target: 'post-handler' },
//   { matcher: 'api/comments', target: 'comment-handler' }
// ]

// Array preserves order and handles duplicates
const duplicateResults = multiMatcher.getTargets(['api/posts', 'api/users', 'api/posts'])
console.log(duplicateResults.length) // 4 (post handler appears twice, user handlers once)

// Array with non-existent matchers (silently skipped)
const mixedResults = multiMatcher.getTargets(['api/users', 'api/nonexistent', 'api/posts'])
console.log(mixedResults.length) // 3 (only existing matchers return results)

// Empty array returns empty results
const emptyResults = multiMatcher.getTargets([])
console.log(emptyResults.length) // 0
```

## Wildcard Matching

Enable wildcard support to use flexible pattern matching:

```ts
const matcher = new PathMatcher<string>({ useWildcards: true })

// Single-level wildcard (*)
matcher.addTarget('api/*/data', 'api-data-handler')

// Multi-level wildcard (**)
matcher.addTarget('admin/**', 'admin-handler')
matcher.addTarget('**/logs', 'logs-handler')

// Specific patterns
matcher.addTarget('*', 'single-level-handler')
matcher.addTarget('**', 'global-handler')

// Matching examples
console.log(matcher.match('api/v1/data')) // Matches 'api/*/data'
// Result: [{ matcher: 'api/*/data', matchedPath: 'api/v1/data', target: 'api-data-handler' }]

console.log(matcher.match('admin/users/list')) // Matches 'admin/**'
// Result: [{ matcher: 'admin/**', matchedPath: 'admin/users/list', target: 'admin-handler' }]

console.log(matcher.match('anything')) // Matches '*' and '**'
// Results show matchedPath: 'anything' for both patterns
```

### Wildcard Rules

- **`*`**: Matches exactly one path segment
- **`**`\*\*: Matches zero or more path segments
- **Wildcard Equivalencies**: Patterns like `**/**`, `**/*/event`, and `*/**/*` are automatically simplified
- **Path Length Requirements**: Patterns like `**/event` and `event/**` require minimum path lengths

## Parameter Extraction

Enable parameter support to extract values from paths:

```ts
const matcher = new PathMatcher<string>({ useParams: true })

matcher.addTarget('user/:id', 'user-handler')
matcher.addTarget('api/:version/users/:userId', 'api-user-handler')
matcher.addTarget('shop/:store/product/:productId/review/:reviewId', 'review-handler')

// Parameter extraction
const results = matcher.match('user/123')
console.log(results[0])
// { matcher: 'user/:id', matchedPath: 'user/123', target: 'user-handler', params: { id: '123' } }

const apiResults = matcher.match('api/v2/users/user456')
console.log(apiResults[0].params) // { version: 'v2', userId: 'user456' }

const reviewResults = matcher.match('shop/store1/product/prod123/review/rev456')
console.log(reviewResults[0].params)
// { store: 'store1', productId: 'prod123', reviewId: 'rev456' }
```

## Combined Wildcards and Parameters

Use both wildcards and parameters together for maximum flexibility:

```ts
const matcher = new PathMatcher<string>({
  useWildcards: true,
  useParams: true
})

matcher.addTarget('user/:id/*', 'user-wildcard-handler')
matcher.addTarget('*/users/:userId', 'namespace-user-handler')
matcher.addTarget('api/:version/**/user/:id/*', 'complex-api-handler')

// Combined matching
const results = matcher.match('user/123/profile')
console.log(results[0])
// { matcher: 'user/:id/*', matchedPath: 'user/123/profile', target: 'user-wildcard-handler', params: { id: '123' } }

const namespaceResults = matcher.match('admin/users/user456')
console.log(namespaceResults[0].params) // { userId: 'user456' }

const complexResults = matcher.match('api/v2/auth/middleware/user/user789/data')
console.log(complexResults[0].params) // { version: 'v2', id: 'user789' }
```

## Array Path Matching

The `match` method supports matching multiple paths at once by passing an array of paths. This is useful for batch operations, event handling, and performance optimization.

```ts
const matcher = new PathMatcher<string>({ useWildcards: true, useParams: true })

matcher.addTarget('api/users/:id', 'user-handler')
matcher.addTarget('api/posts/*', 'post-handler')
matcher.addTarget('admin/**', 'admin-handler')
matcher.addTarget('**/logs', 'log-handler')

// Match multiple paths at once
const results = matcher.match(['api/users/123', 'api/posts/new-post', 'admin/settings', 'system/app/logs'])

console.log(results.length) // 4
console.log(results.map((r) => ({ target: r.target, params: r.params })))
// [
//   { target: 'user-handler', params: { id: '123' } },
//   { target: 'post-handler', params: undefined },
//   { target: 'admin-handler', params: undefined },
//   { target: 'log-handler', params: undefined }
// ]

// Paths can match multiple patterns
const overlappingResults = matcher.match(['admin/logs', 'api/users/456'])
// 'admin/logs' matches both 'admin/**' and '**/logs'
console.log(overlappingResults.length) // 3 results
```

### Array Matching Features

- **Preserves Order**: Results maintain the order of input paths
- **Allows Duplicates**: Same path can appear multiple times in the array
- **Handles Non-matches**: Paths that don't match any patterns are silently skipped
- **Limited Target Support**: Works with `addTargetOnce`, `addTargetMany`, and remaining match counts
- **Efficient**: Uses the same optimized matching algorithms as single path matching

```ts
const matcher = new PathMatcher<string>()

// Add limited targets
matcher.addTargetOnce('temp/resource', 'temp-handler')
matcher.addTargetMany('limited/resource', 2, 'limited-handler')

// First match consumes limited targets
const firstMatch = matcher.match(['temp/resource', 'limited/resource'])
console.log(firstMatch.length) // 2

// Second match - temp-handler is exhausted, limited-handler still available
const secondMatch = matcher.match(['temp/resource', 'limited/resource'])
console.log(secondMatch.length) // 1 (only limited-handler)
```

## Pattern-to-Pattern Matching

When wildcards are enabled, you can use wildcard patterns in the input path to match against registered patterns:

```ts
const matcher = new PathMatcher<string>({ useWildcards: true })

matcher.addTarget('user/admin/profile', 'admin-profile')
matcher.addTarget('user/guest/profile', 'guest-profile')
matcher.addTarget('user/manager/settings', 'manager-settings')

// Use wildcards in the input to find matching patterns
const results = matcher.match('user/*/profile')
console.log(results.length) // 2 (matches admin-profile and guest-profile)

// Global pattern matching
const allApiResults = matcher.match('api/**')
// Returns all targets whose matchers start with 'api/'
```

## Advanced Usage Examples

### Inspection and Management

The new getter properties and methods make it easy to inspect and manage your registered patterns:

```ts
const router = new PathMatcher<Function>({ useWildcards: true, useParams: true })

// Register various handlers
router.addTarget('api/users/:id', getUserHandler)
router.addTarget('api/users', getAllUsersHandler)
router.addTarget('admin/**', adminHandler)
router.prependTarget('api/*', authMiddleware)

// Inspect registered matchers and targets
console.log(`Total targets: ${router.targetsCount}`) // Total targets: 4
console.log('Registered matchers:', router.matchers)
// Registered matchers: ['api/users/:id', 'api/users', 'admin/**', 'api/*']

console.log('All targets:', router.targets)
// All targets: [authMiddleware, getUserHandler, getAllUsersHandler, adminHandler]

// Get detailed target counts per matcher
console.log(`Targets for 'api/users/:id': ${router.getTargetsCount('api/users/:id')}`) // 1
console.log(`Targets for 'api/*': ${router.getTargetsCount('api/*')}`) // 1
console.log(`Targets for 'admin/**': ${router.getTargetsCount('admin/**')}`) // 1

// Get detailed targets with their matchers for analysis
const allTargetsWithMatchers = router.getTargets()
console.log('All registered targets with their matchers:')
allTargetsWithMatchers.forEach(({ matcher, target }) => {
  console.log(`  ${matcher} -> ${target.name || target}`)
})

// Get handlers for specific route patterns
const apiHandlers = router.getTargets('api/*')
console.log(`API handlers: ${apiHandlers.length}`)
apiHandlers.forEach(({ target }) => console.log(`  - ${target.name || target}`))

// Get handlers for multiple related patterns at once
const userRelatedHandlers = router.getTargets(['api/users/:id', 'api/users', 'user/*'])
console.log(`User-related handlers: ${userRelatedHandlers.length}`)
userRelatedHandlers.forEach(({ matcher, target }) => {
  console.log(`  ${matcher} -> ${target.name || target}`)
})

// Check if specific matchers exist
const requiredRoutes = ['api/users/:id', 'api/users', 'admin/**']
if (router.hasMatchers(requiredRoutes)) {
  console.log('All required routes are registered')
} else {
  console.log('Some required routes are missing')
}

// Conditional registration
const optionalRoutes = ['api/analytics', 'api/reports']
if (!router.hasMatchers(optionalRoutes)) {
  router.addTarget('api/analytics', analyticsHandler)
  router.addTarget('api/reports', reportsHandler)
  console.log(`Added missing routes. New total: ${router.targetsCount}`)
}

// Monitor handler distribution and add load balancing
function ensureLoadBalancing() {
  const criticalRoutes = ['api/users/:id', 'api/posts/:id', 'api/orders/:id']

  for (const route of criticalRoutes) {
    const currentCount = router.getTargetsCount(route)
    console.log(`Route '${route}' has ${currentCount} handlers`)

    // Add more handlers if route is under-served
    if (currentCount < 2) {
      router.addTarget(route, createLoadBalancedHandler())
      console.log(`Added load balancer to ${route}`)
    }
  }
}

// Audit and analyze route handlers
function auditRouteHandlers() {
  const allTargetsWithMatchers = router.getTargets()

  // Group handlers by matcher for analysis
  const handlersByMatcher = new Map<string, any[]>()

  for (const { matcher, target } of allTargetsWithMatchers) {
    if (!handlersByMatcher.has(matcher)) {
      handlersByMatcher.set(matcher, [])
    }
    handlersByMatcher.get(matcher)!.push(target)
  }

  console.log('Route Handler Analysis:')
  for (const [matcher, handlers] of handlersByMatcher) {
    console.log(`  ${matcher}: ${handlers.length} handler(s)`)
    handlers.forEach((handler, index) => {
      console.log(`    ${index + 1}. ${handler.name || handler}`)
    })
  }

  // Find routes with duplicate handlers
  const duplicateRoutes = Array.from(handlersByMatcher.entries()).filter(([_, handlers]) => handlers.length > 1)

  if (duplicateRoutes.length > 0) {
    console.log('\nRoutes with multiple handlers:')
    duplicateRoutes.forEach(([matcher, handlers]) => {
      console.log(`  ${matcher}: ${handlers.length} handlers`)
    })
  }

  // Analyze specific categories of routes at once
  const apiRoutes = ['api/users/:id', 'api/users', 'api/posts/:id', 'api/posts']
  const adminRoutes = ['admin/users', 'admin/settings', 'admin/logs']

  console.log('\nAPI Routes Analysis:')
  const apiTargets = router.getTargets(apiRoutes)
  console.log(`Total API handlers: ${apiTargets.length}`)

  console.log('\nAdmin Routes Analysis:')
  const adminTargets = router.getTargets(adminRoutes)
  console.log(`Total Admin handlers: ${adminTargets.length}`)
}

// Bulk removal operations
const deprecatedRoutes = ['api/v1/users/:id', 'api/v1/posts/:id']
router.removeTarget(deprecatedRoutes, oldMiddleware)
console.log('Removed old middleware from deprecated routes')

// Complete reset for testing or reconfiguration
router.removeAllTargets()
console.log('Router completely cleared for fresh configuration')
```

### Event System

```ts
const eventMatcher = new PathMatcher<Function>({
  useWildcards: true,
  useParams: true
})

// Register event handlers
eventMatcher.addTarget('user/:id/created', handleUserCreated)
eventMatcher.addTarget('user/:id/updated', handleUserUpdated)
eventMatcher.addTarget('admin/**', handleAdminEvents)
eventMatcher.addTarget('**/error', handleErrors)

// Dispatch single event
function dispatchEvent(eventPath: string, data: any) {
  const handlers = eventMatcher.match(eventPath)
  handlers.forEach(({ target: handler, params }) => {
    handler(data, params)
  })
}

dispatchEvent('user/123/created', { name: 'John' })
// Calls handleUserCreated with params: { id: '123' }

// Dispatch multiple events at once
function dispatchEvents(eventPaths: string[], data: any) {
  const handlers = eventMatcher.match(eventPaths)
  handlers.forEach(({ target: handler, params }) => {
    handler(data, params)
  })
}

dispatchEvents(['user/123/created', 'user/123/updated', 'admin/user/created'], { name: 'John' })
// Calls all matching handlers for all provided event paths
```

### API Router

```ts
interface Route {
  method: string
  handler: Function
}

const router = new PathMatcher<Route>({
  useWildcards: true,
  useParams: true
})

// Register routes
router.addTarget('api/users/:id', {
  method: 'GET',
  handler: getUserById
})
router.addTarget('api/users', {
  method: 'GET',
  handler: getAllUsers
})
router.addTarget('api/**', {
  method: 'ALL',
  handler: apiMiddleware
})

// Route resolution
function handleRequest(path: string, method: string) {
  const routes = router.match(path)
  const matchingRoutes = routes.filter(({ target }) => target.method === method || target.method === 'ALL')

  matchingRoutes.forEach(({ target: route, params }) => {
    route.handler(params)
  })
}
```

### Resource Access Control

```ts
interface Permission {
  role: string
  action: string
}

const acl = new PathMatcher<Permission>({
  useWildcards: true,
  useParams: true
})

// Define permissions
acl.addTarget('user/:id/profile', { role: 'user', action: 'read' })
acl.addTarget('user/:id/**', { role: 'admin', action: 'all' })
acl.addTarget('admin/**', { role: 'admin', action: 'all' })
acl.addTarget('public/**', { role: 'guest', action: 'read' })

// Check permissions
function checkAccess(userRole: string, resourcePath: string, action: string): boolean {
  const permissions = acl.match(resourcePath)
  return permissions.some(({ target }) => (target.role === userRole || target.role === 'guest') && (target.action === action || target.action === 'all'))
}

console.log(checkAccess('user', 'user/123/profile', 'read')) // true
console.log(checkAccess('user', 'admin/settings', 'read')) // false
console.log(checkAccess('admin', 'user/123/settings', 'write')) // true

// Bulk permission management
function revokeUserPermissions(userId: string) {
  const userPaths = [`user/${userId}/profile`, `user/${userId}/settings`, `user/${userId}/data`]
  acl.removeTarget(userPaths, { role: 'user', action: 'read' })
}

// Clear all permissions for maintenance
function maintenanceMode() {
  acl.removeAllTargets()
  acl.addTarget('**', { role: 'admin', action: 'all' })
  console.log('Maintenance mode: Only admin access allowed')
}
```

### Bulk Target Management

```ts
const apiRouter = new PathMatcher<Function>({ useWildcards: true, useParams: true })

// Add various handlers
apiRouter.addTarget('api/v1/users/:id', getUserHandler)
apiRouter.addTarget('api/v2/users/:id', getUserHandlerV2)
apiRouter.addTarget('api/v1/posts/:id', getPostHandler)
apiRouter.addTarget('api/v2/posts/:id', getPostHandlerV2)
apiRouter.addTarget('api/v1/comments/:id', getCommentHandler)

// Add deprecated middleware to multiple routes
const deprecatedPaths = ['api/v1/users/:id', 'api/v1/posts/:id']
apiRouter.addTarget(deprecatedPaths, deprecationMiddleware)

console.log(`Initial routes: ${apiRouter.matchers.length}`) // 5 routes
console.log(`Total handlers: ${apiRouter.targetsCount}`) // 7 handlers

// Remove deprecated middleware from all v1 endpoints at once
function upgradeApiVersion() {
  const v1Endpoints = ['api/v1/users/:id', 'api/v1/posts/:id', 'api/v1/comments/:id']
  apiRouter.removeTarget(v1Endpoints, deprecationMiddleware)
  console.log('Deprecated middleware removed from all v1 endpoints')
}

// Remove all handlers from specific API versions
function deprecateApiVersion(version: string) {
  const versionPatterns = apiRouter.matchers.filter((matcher) => matcher.includes(`api/${version}/`))
  apiRouter.removeAllTargets(versionPatterns)
  console.log(`All ${version} API handlers removed`)
}

// Example: Remove all v1 API handlers while keeping v2
deprecateApiVersion('v1')
console.log(`Routes after v1 removal: ${apiRouter.matchers.length}`) // Only v2 routes remain

// Selective cleanup of specific resource types
function removeResourceHandlers(resourceType: string) {
  const resourcePatterns = apiRouter.matchers.filter((matcher) => matcher.includes(`/${resourceType}/`))
  apiRouter.removeAllTargets(resourcePatterns)
  console.log(`All ${resourceType} handlers removed`)
}

// Example: Remove all user-related endpoints
removeResourceHandlers('users')

// Complete API reset
function resetApi() {
  apiRouter.removeAllTargets()
  console.log('API completely reset, ready for new configuration')

  // Re-initialize with new handlers
  apiRouter.addTarget('api/v3/**', newUniversalHandler)
}

// Partial reset - keep only essential routes
function resetToEssentials() {
  const essentialRoutes = ['api/health', 'api/status', 'api/version']
  const allRoutes = apiRouter.matchers
  const routesToRemove = allRoutes.filter((route) => !essentialRoutes.includes(route))

  apiRouter.removeAllTargets(routesToRemove)
  console.log(`Removed ${routesToRemove.length} non-essential routes`)
  console.log(`Essential routes remaining: ${apiRouter.matchers.length}`)
}

// Batch request processing
function processMultipleRequests(paths: string[]) {
  const allHandlers = apiRouter.match(paths)

  // Group handlers by path for organized processing
  const handlersByPath = new Map<string, Function[]>()

  let pathIndex = 0
  for (const path of paths) {
    const pathHandlers = apiRouter.match(path)
    handlersByPath.set(
      path,
      pathHandlers.map((h) => h.target)
    )
  }

  // Process all paths with their respective handlers
  for (const [path, handlers] of handlersByPath) {
    handlers.forEach((handler) => handler(path))
  }
}
```

### Debugging and Monitoring

Use the inspection features for debugging and monitoring your matcher configurations:

```ts
function createMonitoredMatcher<T>() {
  const matcher = new PathMatcher<T>({ useWildcards: true, useParams: true })

  // Wrapper to log registration activities
  const originalAddTarget = matcher.addTarget.bind(matcher)
  matcher.addTarget = (pattern: string, target: T) => {
    originalAddTarget(pattern, target)
    console.log(`✅ Registered: ${pattern} (Total: ${matcher.targetsCount})`)
  }

  const originalRemoveTarget = matcher.removeTarget.bind(matcher)
  matcher.removeTarget = (pattern: string | string[], target: T) => {
    const oldCount = matcher.targetsCount
    originalRemoveTarget(pattern, target)
    const newCount = matcher.targetsCount
    const removedCount = oldCount - newCount
    if (removedCount > 0) {
      const patterns = Array.isArray(pattern) ? pattern.join(', ') : pattern
      console.log(`❌ Removed from ${removedCount} matcher(s): ${patterns} (Total: ${newCount})`)
    } else {
      const patterns = Array.isArray(pattern) ? pattern.join(', ') : pattern
      console.log(`⚠️ Target not found for removal in: ${patterns}`)
    }
  }

  const originalRemoveAllTargets = matcher.removeAllTargets.bind(matcher)
  matcher.removeAllTargets = (matchers?: string | string[]) => {
    const oldCount = matcher.targetsCount
    const oldMatchers = [...matcher.matchers]

    originalRemoveAllTargets(matchers)

    const newCount = matcher.targetsCount
    const removedCount = oldCount - newCount

    if (!matchers) {
      console.log(`🧹 Cleared all targets (${removedCount} targets removed)`)
    } else {
      const matchersArray = Array.isArray(matchers) ? matchers : [matchers]
      const actuallyRemoved = matchersArray.filter((m) => oldMatchers.includes(m))
      console.log(`🗑️ Removed all targets from ${actuallyRemoved.length} matcher(s): ${actuallyRemoved.join(', ')} (${removedCount} targets removed)`)
    }
  }

  // Add inspection methods
  ;(matcher as any).inspect = () => {
    console.log('\n📊 Matcher Inspection:')
    console.log(`Total targets: ${matcher.targetsCount}`)
    console.log(`Unique matchers: ${matcher.matchers.length}`)
    console.log('Registered patterns:', matcher.matchers)
    return {
      targetsCount: matcher.targetsCount,
      matchers: matcher.matchers,
      targets: matcher.targets
    }
  }

  return matcher
}

// Usage
const monitored = createMonitoredMatcher<string>()
monitored.addTarget('api/users/:id', 'user-handler')
monitored.addTarget('api/*', 'api-middleware')
monitored.addTarget('admin/settings', 'admin-handler')
// ✅ Registered: api/users/:id (Total: 1)
// ✅ Registered: api/* (Total: 2)
// ✅ Registered: admin/settings (Total: 3)

// Remove all targets from specific matchers
monitored.removeAllTargets(['api/users/:id', 'admin/settings'])
// 🗑️ Removed all targets from 2 matcher(s): api/users/:id, admin/settings (2 targets removed)

// Clear everything
monitored.removeAllTargets()
// 🧹 Cleared all targets (1 targets removed)

const inspection = (monitored as any).inspect()
// 📊 Matcher Inspection:
// Total targets: 0
// Unique matchers: 0
// Registered patterns: []
```

## TypeScript

This library is developed in TypeScript and shipped fully typed.

## Contributing

The development of this library happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving this library.

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributing Guide](./CONTRIBUTING.md)

### License

[MIT licensed](./LICENSE).
