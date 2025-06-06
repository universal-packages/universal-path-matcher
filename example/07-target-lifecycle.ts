import { PathMatcher } from '../src'

export function targetLifecycleExample() {
  console.log('♻️ Target Lifecycle Example')
  console.log('=' .repeat(40))
  
  const matcher = new PathMatcher<string>()
  
  // Basic target addition
  console.log('📝 Basic Target Management:')
  matcher.addTarget('api/data', 'persistent-handler')
  matcher.addTarget('api/data', 'another-handler')
  
  let results = matcher.match('api/data')
  console.log(`Initial match: ${results.length} handlers`)
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.target}`)
  })
  console.log()
  
  // One-time targets
  console.log('⚡ One-Time Targets (addTargetOnce):')
  matcher.addTargetOnce('temp/resource', 'one-time-handler')
  
  console.log('First match:')
  results = matcher.match('temp/resource')
  console.log(`  Found ${results.length} handlers:`, results.map(r => r.target))
  
  console.log('Second match (should be empty):')
  results = matcher.match('temp/resource')
  console.log(`  Found ${results.length} handlers:`, results.map(r => r.target))
  console.log()
  
  // Limited-time targets
  console.log('🔢 Limited-Time Targets (addTargetMany):')
  matcher.addTargetMany('limited/resource', 3, 'limited-handler')
  
  for (let i = 1; i <= 5; i++) {
    results = matcher.match('limited/resource')
    console.log(`Match ${i}: ${results.length} handlers found`)
  }
  console.log()
  
  // Priority targets (prepend)
  console.log('🥇 Priority Targets (prependTarget):')
  matcher.addTarget('priority/test', 'normal-handler-1')
  matcher.addTarget('priority/test', 'normal-handler-2')
  
  console.log('Before prepending:')
  results = matcher.match('priority/test')
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.target}`)
  })
  
  matcher.prependTarget('priority/test', 'priority-handler')
  
  console.log('After prepending:')
  results = matcher.match('priority/test')
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.target}`)
  })
  console.log()
  
  // One-time priority targets
  console.log('⚡🥇 One-Time Priority (prependTargetOnce):')
  matcher.addTarget('urgent/task', 'normal-handler')
  matcher.prependTargetOnce('urgent/task', 'urgent-one-time-handler')
  
  console.log('First urgent match:')
  results = matcher.match('urgent/task')
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.target}`)
  })
  
  console.log('Second urgent match:')
  results = matcher.match('urgent/task')
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.target}`)
  })
  console.log()
  
  // Limited priority targets
  console.log('🔢🥇 Limited Priority (prependTargetMany):')
  matcher.addTarget('vip/service', 'standard-handler')
  matcher.prependTargetMany('vip/service', 2, 'vip-handler')
  
  for (let i = 1; i <= 4; i++) {
    results = matcher.match('vip/service')
    console.log(`VIP Match ${i}:`)
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.target}`)
    })
  }
  console.log()
  
  // Target removal
  console.log('🗑️ Target Removal:')
  matcher.addTarget('cleanup/test', 'handler-1')
  matcher.addTarget('cleanup/test', 'handler-2')
  matcher.addTarget('cleanup/test', 'handler-3')
  
  console.log('Before removal:')
  results = matcher.match('cleanup/test')
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.target}`)
  })
  
  matcher.removeTarget('cleanup/test', 'handler-2')
  
  console.log('After removing handler-2:')
  results = matcher.match('cleanup/test')
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.target}`)
  })
  console.log()
  
  // Complex lifecycle scenario
  console.log('🎭 Complex Lifecycle Scenario:')
  
  // Set up a complex scenario with multiple lifecycle patterns
  matcher.addTarget('complex/workflow', 'base-processor')
  matcher.addTarget('complex/workflow', 'logger')
  
  // Add some temporary high-priority handlers
  matcher.prependTargetMany('complex/workflow', 2, 'startup-validator')
  matcher.prependTargetOnce('complex/workflow', 'initialization-handler')
  
  // Add a temporary fallback
  matcher.addTargetOnce('complex/workflow', 'migration-handler')
  
  console.log('Complex workflow simulation:')
  for (let i = 1; i <= 5; i++) {
    console.log(`\n--- Execution ${i} ---`)
    results = matcher.match('complex/workflow')
    console.log(`Handlers (${results.length}):`)
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.target}`)
    })
  }
  
  console.log('\n🎯 Target Lifecycle Benefits:')
  console.log('  • Temporary handlers for special conditions')
  console.log('  • Priority-based handler execution')
  console.log('  • Automatic cleanup of one-time handlers')
  console.log('  • Flexible handler management')
  console.log('  • Support for complex workflow scenarios')
  console.log('  • Dynamic handler registration/removal')
  
  console.log()
} 
