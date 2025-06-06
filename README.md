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
console.log(results) // [{ matcher: 'user/profile', target: 'user-profile-handler' }]
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
removeTarget(matcher: string, target: PathTarget): void
```

Removes a specific target from the specified matcher pattern.

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('api/users', 'handler-1')
matcher.addTarget('api/users', 'handler-2')

matcher.removeTarget('api/users', 'handler-1')

const results = matcher.match('api/users')
console.log(results.length) // 1
console.log(results[0].target) // 'handler-2'
```

#### match

```ts
match(path: string): PathTargetResult<PathTarget>[]
```

Matches a path against all registered patterns and returns matching targets.

```ts
const matcher = new PathMatcher<string>()
matcher.addTarget('user/profile', 'profile-handler')

const results = matcher.match('user/profile')
console.log(results[0])
// { matcher: 'user/profile', target: 'profile-handler' }
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
console.log(matcher.match('admin/users/list')) // Matches 'admin/**'
console.log(matcher.match('app/system/logs')) // Matches '**/logs'
console.log(matcher.match('anything')) // Matches '*' and '**'
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
console.log(results[0].params) // { id: '123' }

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
console.log(results[0].params) // { id: '123' }

const namespaceResults = matcher.match('admin/users/user456')
console.log(namespaceResults[0].params) // { userId: 'user456' }

const complexResults = matcher.match('api/v2/auth/middleware/user/user789/data')
console.log(complexResults[0].params) // { version: 'v2', id: 'user789' }
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

// Dispatch events
function dispatchEvent(eventPath: string, data: any) {
  const handlers = eventMatcher.match(eventPath)
  handlers.forEach(({ target: handler, params }) => {
    handler(data, params)
  })
}

dispatchEvent('user/123/created', { name: 'John' })
// Calls handleUserCreated with params: { id: '123' }
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
  matcher.removeTarget = (pattern: string, target: T) => {
    const oldCount = matcher.targetsCount
    originalRemoveTarget(pattern, target)
    const newCount = matcher.targetsCount
    if (oldCount !== newCount) {
      console.log(`❌ Removed: ${pattern} (Total: ${newCount})`)
    } else {
      console.log(`⚠️ Target not found for removal: ${pattern}`)
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
// ✅ Registered: api/users/:id (Total: 1)
// ✅ Registered: api/* (Total: 2)

const inspection = (monitored as any).inspect()
// 📊 Matcher Inspection:
// Total targets: 2
// Unique matchers: 2
// Registered patterns: ['api/users/:id', 'api/*']
```

## TypeScript

This library is developed in TypeScript and shipped fully typed.

## Contributing

The development of this library happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving this library.

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributing Guide](./CONTRIBUTING.md)

### License

[MIT licensed](./LICENSE).
