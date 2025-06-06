import { basicPathMatchingExample } from './01-basic-path-matching'
import { wildcardMatchingExample } from './02-wildcard-matching'
import { parameterExtractionExample } from './03-parameter-extraction'
import { combinedFeaturesExample } from './04-combined-features'
import { eventSystemExample } from './05-event-system'
import { apiRouterExample } from './06-api-router'
import { targetLifecycleExample } from './07-target-lifecycle'
import { accessControlExample } from './08-access-control'

async function runAllExamples() {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 Universal Path Matcher - Examples Showcase')
  console.log('='.repeat(60) + '\n')
  
  try {
    // Run all examples in sequence
    basicPathMatchingExample()
    wildcardMatchingExample()
    parameterExtractionExample()
    combinedFeaturesExample()
    eventSystemExample()
    apiRouterExample()
    targetLifecycleExample()
    accessControlExample()
    
    console.log('🎉 All examples completed successfully!')
    console.log('='.repeat(60))
  } catch (error) {
    console.error('❌ Error running examples:', error)
  }
}

runAllExamples().catch(console.error)
