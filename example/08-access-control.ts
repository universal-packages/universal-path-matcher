import { PathMatcher } from '../src'

interface Permission {
  role: string
  action: string
  condition?: (context: AccessContext) => boolean
}

interface AccessContext {
  userId: string
  userRole: string
  resourceOwnerId?: string
  timestamp: number
  metadata?: Record<string, any>
}

export function accessControlExample() {
  console.log('🔐 Access Control & Permissions Example')
  console.log('=' .repeat(50))
  
  const acl = new PathMatcher<Permission>({
    useWildcards: true,
    useParams: true
  })
  
  // Define permission conditions
  const conditions = {
    isOwner: (context: AccessContext) => {
      return context.userId === context.resourceOwnerId
    },
    
    isBusinessHours: (context: AccessContext) => {
      const hour = new Date(context.timestamp).getHours()
      return hour >= 9 && hour <= 17
    },
    
    hasMetadata: (key: string) => (context: AccessContext) => {
      return !!(context.metadata && context.metadata[key] !== undefined)
    }
  }
  
  // Register permissions with various patterns
  console.log('📋 Registering Permissions:')
  
  // Public resources
  acl.addTarget('public/**', { 
    role: 'guest', 
    action: 'read',
    condition: conditions.isBusinessHours
  })
  
  // User profile access
  acl.addTarget('user/:id/profile', { 
    role: 'user', 
    action: 'read' 
  })
  acl.addTarget('user/:id/profile', { 
    role: 'user', 
    action: 'write',
    condition: conditions.isOwner
  })
  
  // User settings - more restrictive
  acl.addTarget('user/:id/settings/**', { 
    role: 'user', 
    action: 'read',
    condition: conditions.isOwner
  })
  acl.addTarget('user/:id/settings/**', { 
    role: 'user', 
    action: 'write',
    condition: conditions.isOwner
  })
  
  // Admin access
  acl.addTarget('admin/**', { 
    role: 'admin', 
    action: 'all' 
  })
  acl.addTarget('user/**', { 
    role: 'admin', 
    action: 'all' 
  })
  
  // Moderator access
  acl.addTarget('content/:type/:id', { 
    role: 'moderator', 
    action: 'read' 
  })
  acl.addTarget('content/:type/:id', { 
    role: 'moderator', 
    action: 'moderate' 
  })
  
  // Special API access
  acl.addTarget('api/internal/**', { 
    role: 'service', 
    action: 'all',
    condition: conditions.hasMetadata('serviceToken')
  })
  
  // Time-restricted resources
  acl.addTarget('reports/**', { 
    role: 'manager', 
    action: 'read',
    condition: conditions.isBusinessHours
  })
  
  console.log('✅ Permissions registered')
  console.log()
  
  // Access checking function
  function checkAccess(
    resourcePath: string, 
    requestedAction: string, 
    context: AccessContext
  ): { allowed: boolean; reasons: string[] } {
    const permissions = acl.match(resourcePath)
    const reasons: string[] = []
    
    console.log(`🔍 Checking access: ${context.userRole} user "${context.userId}" wants to ${requestedAction} "${resourcePath}"`)
    
    if (permissions.length === 0) {
      reasons.push('No matching permissions found')
      return { allowed: false, reasons }
    }
    
    // Check each permission
    for (const { target: permission, params } of permissions) {
      console.log(`  📋 Checking permission: ${permission.role} can ${permission.action}`)
      
      // Check role match
      const roleMatch = permission.role === context.userRole || permission.role === 'guest'
      if (!roleMatch) {
        console.log(`    ❌ Role mismatch: required "${permission.role}", user has "${context.userRole}"`)
        continue
      }
      
      // Check action match
      const actionMatch = permission.action === requestedAction || permission.action === 'all'
      if (!actionMatch) {
        console.log(`    ❌ Action mismatch: required "${permission.action}", requested "${requestedAction}"`)
        continue
      }
      
      // Check conditions
      if (permission.condition) {
        // Add extracted params to context metadata for condition checking
        const contextWithParams = {
          ...context,
          resourceOwnerId: params?.id || context.resourceOwnerId,
          metadata: { ...context.metadata, params }
        }
        
        if (!permission.condition(contextWithParams)) {
          console.log(`    ❌ Condition failed`)
          continue
        }
      }
      
      console.log(`    ✅ Permission granted`)
      return { allowed: true, reasons: [`Access granted via ${permission.role}:${permission.action} permission`] }
    }
    
    reasons.push('No suitable permissions found')
    return { allowed: false, reasons }
  }
  
  // Test access scenarios
  console.log('🧪 Testing Access Scenarios:')
  
  const testScenarios = [
    {
      name: 'Public content access by guest',
      resourcePath: 'public/documents/guide.pdf',
      action: 'read',
      context: {
        userId: 'guest123',
        userRole: 'guest',
        timestamp: new Date().setHours(14) // 2 PM
      }
    },
    {
      name: 'Public content access after hours',
      resourcePath: 'public/documents/guide.pdf',
      action: 'read',
      context: {
        userId: 'guest123',
        userRole: 'guest',
        timestamp: new Date().setHours(20) // 8 PM
      }
    },
    {
      name: 'User accessing own profile',
      resourcePath: 'user/user123/profile',
      action: 'read',
      context: {
        userId: 'user123',
        userRole: 'user',
        timestamp: Date.now()
      }
    },
    {
      name: 'User editing own profile',
      resourcePath: 'user/user123/profile',
      action: 'write',
      context: {
        userId: 'user123',
        userRole: 'user',
        resourceOwnerId: 'user123',
        timestamp: Date.now()
      }
    },
    {
      name: 'User trying to edit another user profile',
      resourcePath: 'user/user456/profile',
      action: 'write',
      context: {
        userId: 'user123',
        userRole: 'user',
        resourceOwnerId: 'user456',
        timestamp: Date.now()
      }
    },
    {
      name: 'Admin accessing user settings',
      resourcePath: 'user/user123/settings/privacy',
      action: 'write',
      context: {
        userId: 'admin1',
        userRole: 'admin',
        timestamp: Date.now()
      }
    },
    {
      name: 'Moderator reviewing content',
      resourcePath: 'content/post/post123',
      action: 'moderate',
      context: {
        userId: 'mod1',
        userRole: 'moderator',
        timestamp: Date.now()
      }
    },
    {
      name: 'Service accessing internal API',
      resourcePath: 'api/internal/metrics',
      action: 'read',
      context: {
        userId: 'service-worker',
        userRole: 'service',
        timestamp: Date.now(),
        metadata: { serviceToken: 'valid-token-123' }
      }
    },
    {
      name: 'Service accessing internal API without token',
      resourcePath: 'api/internal/metrics',
      action: 'read',
      context: {
        userId: 'service-worker',
        userRole: 'service',
        timestamp: Date.now()
      }
    },
    {
      name: 'Manager accessing reports during business hours',
      resourcePath: 'reports/sales/monthly',
      action: 'read',
      context: {
        userId: 'manager1',
        userRole: 'manager',
        timestamp: new Date().setHours(10) // 10 AM
      }
    }
  ]
  
  testScenarios.forEach((scenario, index) => {
    console.log(`\n--- Test ${index + 1}: ${scenario.name} ---`)
    const result = checkAccess(
      scenario.resourcePath, 
      scenario.action, 
      scenario.context as AccessContext
    )
    
    console.log(`Result: ${result.allowed ? '✅ ALLOWED' : '❌ DENIED'}`)
    if (result.reasons.length > 0) {
      console.log(`Reasons: ${result.reasons.join(', ')}`)
    }
  })
  
  console.log('\n🎯 Access Control Benefits:')
  console.log('  • Fine-grained permission management')
  console.log('  • Role-based access control (RBAC)')
  console.log('  • Parameter-based resource ownership')
  console.log('  • Conditional permissions (time, context)')
  console.log('  • Wildcard patterns for broad permissions')
  console.log('  • Hierarchical permission inheritance')
  console.log('  • Dynamic permission evaluation')
  
  console.log()
} 
