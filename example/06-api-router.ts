import { PathMatcher } from '../src'

interface Request {
  method: string
  path: string
  headers: Record<string, string>
  body?: any
}

interface Response {
  status: number
  data: any
  headers?: Record<string, string>
}

interface Route {
  method: string
  handler: (req: Request, params?: Record<string, string>) => Response
  middleware?: Array<(req: Request, params?: Record<string, string>) => boolean>
}

export function apiRouterExample() {
  console.log('🌐 API Router Example')
  console.log('=' .repeat(40))
  
  const router = new PathMatcher<Route>({
    useWildcards: true,
    useParams: true
  })
  
  // Define route handlers
  const handlers = {
    getAllUsers: (req: Request) => ({
      status: 200,
      data: { users: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }] }
    }),
    
    getUserById: (req: Request, params?: Record<string, string>) => ({
      status: 200,
      data: { user: { id: params?.id, name: `User ${params?.id}` } }
    }),
    
    createUser: (req: Request) => ({
      status: 201,
      data: { user: { id: 999, ...req.body }, message: 'User created' }
    }),
    
    updateUser: (req: Request, params?: Record<string, string>) => ({
      status: 200,
      data: { user: { id: params?.id, ...req.body }, message: 'User updated' }
    }),
    
    deleteUser: (req: Request, params?: Record<string, string>) => ({
      status: 204,
      data: null
    }),
    
    getApiInfo: (req: Request, params?: Record<string, string>) => ({
      status: 200,
      data: { version: params?.version, endpoints: ['users', 'posts', 'comments'] }
    }),
    
    handleNotFound: (req: Request) => ({
      status: 404,
      data: { error: 'Endpoint not found' }
    }),
    
    authMiddleware: (req: Request) => ({
      status: 401,
      data: { error: 'Authentication required' }
    }),
    
    loggerMiddleware: (req: Request) => ({
      status: 200,
      data: { message: 'Request logged' }
    })
  }
  
  // Define middleware
  const requireAuth = (req: Request, params?: Record<string, string>) => {
    return req.headers.authorization === 'Bearer valid-token'
  }
  
  const logRequest = (req: Request, params?: Record<string, string>) => {
    console.log(`    📝 Middleware: ${req.method} ${req.path}`)
    return true
  }
  
  // Register routes
  router.addTarget('api/:version/users', { 
    method: 'GET', 
    handler: handlers.getAllUsers,
    middleware: [logRequest]
  })
  
  router.addTarget('api/:version/users/:id', { 
    method: 'GET', 
    handler: handlers.getUserById,
    middleware: [logRequest]
  })
  
  router.addTarget('api/:version/users', { 
    method: 'POST', 
    handler: handlers.createUser,
    middleware: [logRequest, requireAuth]
  })
  
  router.addTarget('api/:version/users/:id', { 
    method: 'PUT', 
    handler: handlers.updateUser,
    middleware: [logRequest, requireAuth]
  })
  
  router.addTarget('api/:version/users/:id', { 
    method: 'DELETE', 
    handler: handlers.deleteUser,
    middleware: [logRequest, requireAuth]
  })
  
  router.addTarget('api/:version', { 
    method: 'GET', 
    handler: handlers.getApiInfo,
    middleware: [logRequest]
  })
  
  // Catch-all middleware
  router.addTarget('api/**', { 
    method: 'ALL', 
    handler: handlers.loggerMiddleware,
    middleware: [logRequest]
  })
  
  // Simulate request handling
  function handleRequest(req: Request): Response {
    console.log(`\n🌐 ${req.method} ${req.path}`)
    
    const routes = router.match(req.path)
    const matchingRoutes = routes.filter(({ target }) => 
      target.method === req.method || target.method === 'ALL'
    )
    
    if (matchingRoutes.length === 0) {
      console.log(`  ❌ No matching routes found`)
      return handlers.handleNotFound(req)
    }
    
    // Process middleware and find the best route
    for (const { target: route, params } of matchingRoutes) {
      console.log(`  🎯 Trying route: ${route.method} with params:`, params)
      
      // Run middleware
      if (route.middleware) {
        let middlewarePassed = true
        for (const middleware of route.middleware) {
          if (!middleware(req, params)) {
            console.log(`  🚫 Middleware failed`)
            middlewarePassed = false
            break
          }
        }
        
        if (!middlewarePassed) {
          if (route.method !== 'ALL') { // Don't fail on logging middleware
            return handlers.authMiddleware(req)
          }
          continue
        }
      }
      
      // Execute handler only for exact method matches (not ALL)
      if (route.method === req.method) {
        console.log(`  ✅ Route matched, executing handler`)
        return route.handler(req, params)
      }
    }
    
    return handlers.handleNotFound(req)
  }
  
  // Test various API requests
  console.log('🧪 Testing API Requests:')
  
  const testRequests: Request[] = [
    {
      method: 'GET',
      path: 'api/v1/users',
      headers: {}
    },
    {
      method: 'GET',
      path: 'api/v2/users/123',
      headers: {}
    },
    {
      method: 'POST',
      path: 'api/v1/users',
      headers: { authorization: 'Bearer valid-token' },
      body: { name: 'New User', email: 'new@example.com' }
    },
    {
      method: 'POST',
      path: 'api/v1/users',
      headers: {}, // No auth token
      body: { name: 'Unauthorized User' }
    },
    {
      method: 'PUT',
      path: 'api/v1/users/456',
      headers: { authorization: 'Bearer valid-token' },
      body: { name: 'Updated User' }
    },
    {
      method: 'DELETE',
      path: 'api/v1/users/789',
      headers: { authorization: 'Bearer valid-token' }
    },
    {
      method: 'GET',
      path: 'api/v1',
      headers: {}
    },
    {
      method: 'GET',
      path: 'api/v1/posts',
      headers: {}
    },
    {
      method: 'PATCH',
      path: 'api/v1/users/123',
      headers: {}
    }
  ]
  
  testRequests.forEach(req => {
    const response = handleRequest(req)
    console.log(`    Response: ${response.status}`, response.data)
  })
  
  console.log('\n🎯 API Router Benefits:')
  console.log('  • RESTful route matching with parameters')
  console.log('  • HTTP method-specific handlers')
  console.log('  • Middleware chain execution')
  console.log('  • Wildcard routes for logging/monitoring')
  console.log('  • Flexible route prioritization')
  console.log('  • Parameter extraction from URLs')
  
  console.log()
} 
