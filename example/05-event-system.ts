import { PathMatcher } from '../src'

interface EventData {
  timestamp: number
  source: string
  data: any
}

interface EventHandler {
  name: string
  handler: (event: EventData, params?: Record<string, string>) => void
}

export function eventSystemExample() {
  console.log('🎪 Event System Example')
  console.log('=' .repeat(40))
  
  const eventMatcher = new PathMatcher<EventHandler>({
    useWildcards: true,
    useParams: true
  })
  
  // Define event handlers
  const handlers = {
    handleUserCreated: (event: EventData, params?: Record<string, string>) => {
      console.log(`  📅 User Created Handler: User ${params?.id} created by ${event.source}`)
    },
    
    handleUserUpdated: (event: EventData, params?: Record<string, string>) => {
      console.log(`  📝 User Updated Handler: User ${params?.id} updated (${event.data.field})`)
    },
    
    handleAdminEvents: (event: EventData, params?: Record<string, string>) => {
      console.log(`  🔐 Admin Event Handler: Admin action detected from ${event.source}`)
    },
    
    handleErrors: (event: EventData, params?: Record<string, string>) => {
      console.log(`  ❌ Error Handler: Error in ${event.source} - ${event.data.message}`)
    },
    
    handleOrderEvents: (event: EventData, params?: Record<string, string>) => {
      console.log(`  🛒 Order Handler: Order ${params?.orderId} ${params?.action} for customer ${params?.customerId}`)
    },
    
    handleSystemEvents: (event: EventData, params?: Record<string, string>) => {
      console.log(`  ⚙️ System Handler: System event from ${params?.service || 'unknown'} service`)
    },
    
    handleAllEvents: (event: EventData, params?: Record<string, string>) => {
      console.log(`  📊 Global Logger: Event logged at ${new Date(event.timestamp).toISOString()}`)
    }
  }
  
  // Register event handlers
  eventMatcher.addTarget('user/:id/created', { name: 'UserCreated', handler: handlers.handleUserCreated })
  eventMatcher.addTarget('user/:id/updated', { name: 'UserUpdated', handler: handlers.handleUserUpdated })
  eventMatcher.addTarget('admin/**', { name: 'AdminEvents', handler: handlers.handleAdminEvents })
  eventMatcher.addTarget('**/error', { name: 'ErrorHandler', handler: handlers.handleErrors })
  eventMatcher.addTarget('order/:customerId/:orderId/:action', { name: 'OrderEvents', handler: handlers.handleOrderEvents })
  eventMatcher.addTarget('system/:service/*', { name: 'SystemEvents', handler: handlers.handleSystemEvents })
  eventMatcher.addTarget('**', { name: 'GlobalLogger', handler: handlers.handleAllEvents })
  
  // Simulate event dispatch function
  function dispatchEvent(eventPath: string, eventData: Partial<EventData>) {
    console.log(`\n🚀 Dispatching event: "${eventPath}"`)
    
    const fullEventData: EventData = {
      timestamp: Date.now(),
      source: 'event-system',
      data: {},
      ...eventData
    }
    
    const matchedHandlers = eventMatcher.match(eventPath)
    console.log(`   Found ${matchedHandlers.length} matching handlers:`)
    
    matchedHandlers.forEach(({ target, params }) => {
      target.handler(fullEventData, params)
    })
  }
  
  // Simulate various events
  console.log('📡 Simulating Events:')
  
  dispatchEvent('user/123/created', {
    source: 'user-service',
    data: { name: 'John Doe', email: 'john@example.com' }
  })
  
  dispatchEvent('user/456/updated', {
    source: 'profile-service',
    data: { field: 'email', oldValue: 'old@example.com', newValue: 'new@example.com' }
  })
  
  dispatchEvent('admin/security/access-granted', {
    source: 'security-service',
    data: { adminId: 'admin123', resource: 'user-database' }
  })
  
  dispatchEvent('order/customer789/order456/completed', {
    source: 'order-service',
    data: { total: 299.99, items: 3 }
  })
  
  dispatchEvent('system/database/connection-lost', {
    source: 'monitoring-service',
    data: { severity: 'high', database: 'primary' }
  })
  
  dispatchEvent('payment/gateway/error', {
    source: 'payment-service',
    data: { message: 'Connection timeout', code: 'TIMEOUT_001' }
  })
  
  dispatchEvent('notification/email/sent', {
    source: 'notification-service',
    data: { recipient: 'user@example.com', subject: 'Welcome!' }
  })
  
  console.log('\n🎯 Event System Benefits:')
  console.log('  • Flexible pattern matching for event routing')
  console.log('  • Parameter extraction from event paths')
  console.log('  • Multiple handlers per event pattern')
  console.log('  • Wildcard support for catch-all handlers')
  console.log('  • Easy to add/remove event handlers dynamically')
  
  console.log()
} 
