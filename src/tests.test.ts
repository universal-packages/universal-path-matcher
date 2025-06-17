import { runEdgeCasesTests } from './PathMatcher.test/edge-cases.test'
import { runGettersMethodsTests } from './PathMatcher.test/getters-methods.test'
import { runGlobstarTests } from './PathMatcher.test/globstar.test'
import { runMatchedPathTests } from './PathMatcher.test/matched-path.test'
import { runMatchingTests } from './PathMatcher.test/matching.test'
import { runRemoveTargetsTests } from './PathMatcher.test/remove-targets.test'
import { runWildcardsParamsTests } from './PathMatcher.test/wildcards-params.test'

async function runTests() {
  await runMatchingTests()
  await runWildcardsParamsTests()
  await runRemoveTargetsTests()
  await runGlobstarTests()
  await runGettersMethodsTests()
  await runMatchedPathTests()
  await runEdgeCasesTests()
}

runTests()
