export interface PathMatcherOptions {
  /**
   * The delimiter used to separate levels in the path
   * @default '/'
   */
  levelDelimiter?: string

  /**
   * Whether to use wildcards to match paths
   * like `*` or `**` and in paths like `user/*`
   * @default true
   */
  useWildcards?: boolean

  /**
   * Whether to capture params in the path
   * @default true
   */
  useParams?: boolean
}

export interface TargetRecord<PathTarget = any> {
  matcher: string
  remainingMatches?: number
  target: PathTarget
  constantResult?: PathTargetResult<PathTarget>
}

export interface PathTargetResult<PathTarget = any> {
  matcher: string
  target: PathTarget
  params?: Record<string, string>
}

export interface GetTargetsResult<PathTarget = any> {
  matcher: string
  target: PathTarget
}

// New interfaces for advanced matching
export interface ParsedSegment {
  type: 'static' | 'wildcard' | 'globstar' | 'param'
  value: string // original value for static, param name for param, '*' for wildcard, '**' for globstar
}

export interface ParsedMatcher {
  segments: ParsedSegment[]
  originalMatcher: string
  isStatic: boolean // true if no wildcards or params
}

export interface AdvancedTargetRecord<PathTarget = any> {
  matcher: string
  target: PathTarget
  remainingMatches?: number
  parsedMatcher: ParsedMatcher
  isPrepended: boolean
}

export interface TrieNode<PathTarget = any> {
  staticChildren: Map<string, TrieNode<PathTarget>>
  wildcardChild?: TrieNode<PathTarget>
  globstarChild?: TrieNode<PathTarget>
  globstarInMiddleChild?: TrieNode<PathTarget>
  paramChild?: { node: TrieNode<PathTarget>; paramName: string }
  targets: AdvancedTargetRecord<PathTarget>[]
  isEndNode: boolean
}
