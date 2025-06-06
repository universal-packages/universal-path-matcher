import { AdvancedTargetRecord, ParsedMatcher, ParsedSegment, PathMatcherOptions, PathTargetResult, TargetRecord, TrieNode } from './PatchMatcher.types'

export class PathMatcher<PathTarget = any> {
  public readonly options: PathMatcherOptions

  // Optimized storage for static matchers (when wildcards/params are disabled)
  private _targetsMap: Map<string, TargetRecord[]> = new Map()

  // Advanced storage for dynamic matchers (when wildcards/params are enabled)
  private _trie: TrieNode<PathTarget> = this._createTrieNode()
  private _allTargets: AdvancedTargetRecord<PathTarget>[] = []
  private _matchCache: Map<string, PathTargetResult<PathTarget>[]> = new Map()
  private _parseCache: Map<string, ParsedMatcher> = new Map()

  public constructor(options?: PathMatcherOptions) {
    this.options = {
      levelDelimiter: options?.levelDelimiter ?? '/',
      useWildcards: options?.useWildcards ?? false,
      useParams: options?.useParams ?? false
    }
  }

  /**
   * Matches a path against all matchers and returns the targets that matched the path
   * The path can also contain wildcards but not params that only work if useWildcards is true
   * or useParams is true.
   * @param path - The path to match
   * @returns The targets that matched the path
   */
  public match(path: string): PathTargetResult<PathTarget>[] {
    if (!this.options.useWildcards && !this.options.useParams) {
      // Use optimized path for static matching
      const targetRecords = this._targetsMap.get(path)

      if (!targetRecords) return []

      const results: PathTargetResult<PathTarget>[] = []

      for (let i = targetRecords.length - 1; i >= 0; i--) {
        const targetRecord = targetRecords[i]
        if (targetRecord.remainingMatches) {
          targetRecord.remainingMatches--

          if (targetRecord.remainingMatches === 0) {
            targetRecords.splice(i, 1)
          }
        }

        results.push(targetRecord.constantResult!)
      }

      return results.reverse()
    }

    // Advanced matching with wildcards/params
    const sanitizedPath = this.sanitizePathOrMatcher(path)

    // Check if the input path contains wildcards (pattern-to-pattern matching)
    const pathContainsWildcards = this.options.useWildcards && (sanitizedPath.includes('*') || sanitizedPath.includes('**'))

    if (pathContainsWildcards) {
      // Pattern-to-pattern matching: find all registered matchers that would be matched by this wildcard pattern
      return this._matchPatternToPatterns(sanitizedPath)
    }

    // Check cache first
    const cacheKey = sanitizedPath
    if (this._matchCache.has(cacheKey)) {
      const cachedResults = this._matchCache.get(cacheKey)!
      // Handle remaining matches for cached results
      const validResults: PathTargetResult<PathTarget>[] = []

      for (const result of cachedResults) {
        const targetRecord = this._allTargets.find((t) => t.matcher === result.matcher && t.target === result.target)

        if (targetRecord) {
          if (targetRecord.remainingMatches !== undefined) {
            targetRecord.remainingMatches--
            if (targetRecord.remainingMatches === 0) {
              this._removeTargetRecord(targetRecord)
            }
          }
          validResults.push(result)
        }
      }

      return validResults
    }

    const pathSegments = sanitizedPath === '' ? [] : sanitizedPath.split(this.options.levelDelimiter!)
    const results: PathTargetResult<PathTarget>[] = []
    const prependedResults: PathTargetResult<PathTarget>[] = []
    const seenTargets = new Set<string>() // To avoid duplicates

    // Match against trie
    this._matchInTrie(pathSegments, this._trie, {}, results, prependedResults, seenTargets)

    // Handle remaining matches decrementation and removal
    const allResults = [...prependedResults, ...results]
    const finalResults: PathTargetResult<PathTarget>[] = []

    for (const result of allResults) {
      const targetRecord = this._allTargets.find((t) => t.matcher === result.matcher && t.target === result.target)

      if (targetRecord) {
        if (targetRecord.remainingMatches !== undefined) {
          targetRecord.remainingMatches--
          if (targetRecord.remainingMatches === 0) {
            this._removeTargetRecord(targetRecord)
          }
        }
        finalResults.push(result)
      }
    }

    // Cache result (but cache the original results before decrementing)
    this._matchCache.set(cacheKey, [...finalResults])

    return finalResults
  }

  /**
   * Add a target to the matcher if later a path matches the matcher, the target will be included in the result
   * @param matcher - The matcher to add the target to
   * @param target - The target to add
   */
  public addTarget(matcher: string, target: PathTarget): void {
    if (!this.options.useWildcards && !this.options.useParams) {
      // Use optimized path
      const targetRecords = this._targetsMap.get(matcher)

      if (!targetRecords) {
        this._targetsMap.set(matcher, [{ matcher, target, constantResult: { matcher, target } }])
        return
      }

      targetRecords.push({ matcher, target, constantResult: { matcher, target } })
      return
    }

    this._addAdvancedTarget(matcher, target, undefined, false)
  }

  /**
   * Add a target to the matcher if later a path matches the matcher, the target will be included in the result and the target will be removed from the matcher
   * @param matcher - The matcher to add the target to
   * @param target - The target to add
   */
  public addTargetOnce(matcher: string, target: PathTarget): void {
    if (!this.options.useWildcards && !this.options.useParams) {
      const targetRecords = this._targetsMap.get(matcher)

      if (!targetRecords) {
        this._targetsMap.set(matcher, [{ matcher, target, remainingMatches: 1, constantResult: { matcher, target } }])
        return
      }

      targetRecords.push({ matcher, target, remainingMatches: 1, constantResult: { matcher, target } })
      return
    }

    this._addAdvancedTarget(matcher, target, 1, false)
  }

  /**
   * Add a target to the matcher if later a path matches the matcher, the target will be included in the result
   * and the target will be removed from the matcher after the number of times the target can match
   * @param matcher - The matcher to add the target to
   * @param times - The number of times the target can match before being removed from the matcher
   * @param target - The target to add
   */
  public addTargetMany(matcher: string, times: number, target: PathTarget): void {
    if (times <= 0) return

    if (!this.options.useWildcards && !this.options.useParams) {
      const targetRecords = this._targetsMap.get(matcher)

      if (!targetRecords) {
        this._targetsMap.set(matcher, [{ matcher, target, remainingMatches: times, constantResult: { matcher, target } }])
        return
      }

      targetRecords.push({ matcher, target, remainingMatches: times, constantResult: { matcher, target } })
      return
    }

    this._addAdvancedTarget(matcher, target, times, false)
  }

  /**
   * Prepend a target to the matcher - targets added with this method will always appear at the beginning of the result
   * @param matcher - The matcher to prepend the target to
   * @param target - The target to prepend
   */
  public prependTarget(matcher: string, target: PathTarget): void {
    if (!this.options.useWildcards && !this.options.useParams) {
      const targetRecords = this._targetsMap.get(matcher)

      if (!targetRecords) {
        this._targetsMap.set(matcher, [{ matcher, target, constantResult: { matcher, target } }])
        return
      }

      targetRecords.unshift({ matcher, target, constantResult: { matcher, target } })
      return
    }

    this._addAdvancedTarget(matcher, target, undefined, true)
  }

  /**
   * Prepend a target to the matcher - targets added with this method will always appear at the beginning
   * of the result and will be removed after one use
   * @param matcher - The matcher to prepend the target to
   * @param target - The target to prepend
   */
  public prependTargetOnce(matcher: string, target: PathTarget): void {
    if (!this.options.useWildcards && !this.options.useParams) {
      const targetRecords = this._targetsMap.get(matcher)

      if (!targetRecords) {
        this._targetsMap.set(matcher, [{ matcher, target, remainingMatches: 1, constantResult: { matcher, target } }])
        return
      }

      targetRecords.unshift({ matcher, target, remainingMatches: 1, constantResult: { matcher, target } })
      return
    }

    this._addAdvancedTarget(matcher, target, 1, true)
  }

  /**
   * Prepend a target to the matcher - targets added with this method will always appear at the beginning
   * of the result and will be removed after the specified number of uses
   * @param matcher - The matcher to prepend the target to
   * @param times - The number of times the target can match before being removed from the matcher
   * @param target - The target to prepend
   */
  public prependTargetMany(matcher: string, times: number, target: PathTarget): void {
    if (times <= 0) return

    if (!this.options.useWildcards && !this.options.useParams) {
      const targetRecords = this._targetsMap.get(matcher)

      if (!targetRecords) {
        this._targetsMap.set(matcher, [{ matcher, target, remainingMatches: times, constantResult: { matcher, target } }])
        return
      }

      targetRecords.unshift({ matcher, target, remainingMatches: times, constantResult: { matcher, target } })
      return
    }

    this._addAdvancedTarget(matcher, target, times, true)
  }

  /**
   * Remove a target from the matcher
   * @param matcher - The matcher to remove the target from
   * @param target - The target to remove
   */
  public removeTarget(matcher: string, target: PathTarget): void {
    if (!this.options.useWildcards && !this.options.useParams) {
      const targetRecords = this._targetsMap.get(matcher)

      if (!targetRecords) return

      const targetRecordIndex = targetRecords.findIndex((targetRecord) => targetRecord.target === target)

      if (targetRecordIndex === -1) return

      targetRecords.splice(targetRecordIndex, 1)
      return
    }

    // Remove from advanced storage
    const targetIndex = this._allTargets.findIndex((t) => t.matcher === matcher && t.target === target)

    if (targetIndex !== -1) {
      const targetRecord = this._allTargets[targetIndex]
      this._removeTargetRecord(targetRecord)
    }
  }

  /**
   * Sanitize the matcher or path to avoid continuous slashes and first and last slashes
   * it also finds exaggerated wildcards and the global wildcard equivalents
   * @example
   * sanitizePathOrMatcher('/admin//settings//') -> '/admin/settings'
   * sanitizePathOrMatcher('/admin/////settings') -> '/admin/settings'
   * @param matcher - The matcher to sanitize
   * @returns The sanitized matcher
   */
  private sanitizePathOrMatcher(matcher: string): string {
    let resultMatcher = matcher

    while (resultMatcher.includes('//')) resultMatcher = resultMatcher.replace('//', '/')
    if (resultMatcher.startsWith('/')) resultMatcher = resultMatcher.slice(1)
    if (resultMatcher.endsWith('/')) resultMatcher = resultMatcher.slice(0, -1)

    if (this.options.useWildcards) {
      // Handle wildcard equivalencies involving **
      const segments = resultMatcher.split('/')
      const simplifiedSegments: string[] = []

      for (let i = 0; i < segments.length; i++) {
        const current = segments[i]
        const prev = simplifiedSegments[simplifiedSegments.length - 1]

        // Skip redundant ** after **
        if (current === '**' && prev === '**') {
          continue
        }

        // Convert **/* to ** (skip the * after **)
        if (prev === '**' && current === '*') {
          continue
        }

        // Convert */** to ** (replace * before ** with **)
        if (current === '**' && prev === '*') {
          simplifiedSegments[simplifiedSegments.length - 1] = '**'
          continue
        }

        simplifiedSegments.push(current)
      }

      resultMatcher = simplifiedSegments.join('/')
    }

    return resultMatcher
  }

  private _createTrieNode<T = PathTarget>(): TrieNode<T> {
    return {
      staticChildren: new Map(),
      targets: [],
      isEndNode: false
    }
  }

  private _parseMatcher(matcher: string): ParsedMatcher {
    if (this._parseCache.has(matcher)) {
      return this._parseCache.get(matcher)!
    }

    const sanitized = this.sanitizePathOrMatcher(matcher)
    const segments = sanitized === '' ? [] : sanitized.split(this.options.levelDelimiter!)
    const parsedSegments: ParsedSegment[] = []
    let isStatic = true

    for (const segment of segments) {
      if (this.options.useWildcards && segment === '**') {
        parsedSegments.push({ type: 'globstar', value: '**' })
        isStatic = false
      } else if (this.options.useWildcards && segment === '*') {
        parsedSegments.push({ type: 'wildcard', value: '*' })
        isStatic = false
      } else if (this.options.useParams && segment.startsWith(':')) {
        parsedSegments.push({ type: 'param', value: segment.slice(1) })
        isStatic = false
      } else {
        parsedSegments.push({ type: 'static', value: segment })
      }
    }

    const parsed: ParsedMatcher = {
      segments: parsedSegments,
      originalMatcher: matcher,
      isStatic
    }

    this._parseCache.set(matcher, parsed)
    return parsed
  }

  private _addAdvancedTarget(matcher: string, target: PathTarget, remainingMatches?: number, isPrepended: boolean = false): void {
    const parsedMatcher = this._parseMatcher(matcher)

    const targetRecord: AdvancedTargetRecord<PathTarget> = {
      matcher,
      target,
      remainingMatches,
      parsedMatcher,
      isPrepended
    }

    this._allTargets.push(targetRecord)
    this._addToTrie(parsedMatcher.segments, targetRecord, this._trie)
    this._clearMatchCache()
  }

  private _addToTrie(segments: ParsedSegment[], targetRecord: AdvancedTargetRecord<PathTarget>, node: TrieNode<PathTarget>, segmentIndex: number = 0): void {
    if (segmentIndex >= segments.length) {
      node.isEndNode = true
      if (targetRecord.isPrepended) {
        node.targets.unshift(targetRecord)
      } else {
        node.targets.push(targetRecord)
      }
      return
    }

    const segment = segments[segmentIndex]
    let nextNode: TrieNode<PathTarget>

    if (segment.type === 'static') {
      if (!node.staticChildren.has(segment.value)) {
        node.staticChildren.set(segment.value, this._createTrieNode())
      }
      nextNode = node.staticChildren.get(segment.value)!
    } else if (segment.type === 'wildcard') {
      if (!node.wildcardChild) {
        node.wildcardChild = this._createTrieNode()
      }
      nextNode = node.wildcardChild
    } else if (segment.type === 'globstar') {
      // Check if globstar is in different positions
      const isInMiddle = segmentIndex > 0 && segmentIndex < segments.length - 1
      const isAlone = segments.length === 1

      if (isAlone) {
        // ** alone - global wildcard, matches any path
        if (!node.globstarChild) {
          node.globstarChild = this._createTrieNode()
        }
        nextNode = node.globstarChild
      } else if (isInMiddle) {
        // 1/**/event - must match at least one segment in middle
        if (!node.globstarInMiddleChild) {
          node.globstarInMiddleChild = this._createTrieNode()
        }
        nextNode = node.globstarInMiddleChild
      } else {
        // **/event or event/** - needs special handling for minimum path length
        if (!node.globstarChild) {
          node.globstarChild = this._createTrieNode()
        }
        nextNode = node.globstarChild
      }
    } else {
      // param
      if (!node.paramChild) {
        node.paramChild = { node: this._createTrieNode(), paramName: segment.value }
      }
      nextNode = node.paramChild.node
    }

    this._addToTrie(segments, targetRecord, nextNode, segmentIndex + 1)
  }

  private _matchInTrie(
    pathSegments: string[],
    node: TrieNode<PathTarget>,
    params: Record<string, string>,
    results: PathTargetResult<PathTarget>[],
    prependedResults: PathTargetResult<PathTarget>[],
    seenTargets: Set<string>,
    segmentIndex: number = 0
  ): void {
    // If we've consumed all path segments
    if (segmentIndex >= pathSegments.length) {
      if (node.isEndNode) {
        for (const targetRecord of node.targets) {
          // Check if this pattern has minimum path length requirements
          const pattern = targetRecord.parsedMatcher.segments
          const hasGlobstarAtStart = pattern.length > 1 && pattern[0].type === 'globstar'
          const hasGlobstarAtEnd = pattern.length > 1 && pattern[pattern.length - 1].type === 'globstar'

          // If pattern starts or ends with **, require path length > 1
          if ((hasGlobstarAtStart || hasGlobstarAtEnd) && pathSegments.length <= 1) {
            continue // Skip this match
          }

          const targetKey = `${targetRecord.matcher}:${JSON.stringify(targetRecord.target)}:${JSON.stringify(params)}`

          if (!seenTargets.has(targetKey)) {
            seenTargets.add(targetKey)

            const result: PathTargetResult<PathTarget> = {
              matcher: targetRecord.matcher,
              target: targetRecord.target,
              params: Object.keys(params).length > 0 ? { ...params } : undefined
            }

            if (targetRecord.isPrepended) {
              prependedResults.push(result)
            } else {
              results.push(result)
            }
          }
        }
      }
      return
    }

    const currentSegment = pathSegments[segmentIndex]

    // Try static match
    const staticChild = node.staticChildren.get(currentSegment)
    if (staticChild) {
      this._matchInTrie(pathSegments, staticChild, params, results, prependedResults, seenTargets, segmentIndex + 1)
    }

    // Try wildcard match (only matches exactly one segment)
    if (node.wildcardChild) {
      this._matchInTrie(pathSegments, node.wildcardChild, params, results, prependedResults, seenTargets, segmentIndex + 1)
    }

    // Try globstar match (can match zero or more segments)
    if (node.globstarChild) {
      this._matchGlobstar(pathSegments, node.globstarChild, params, results, prependedResults, seenTargets, segmentIndex)
    }

    // Try globstar in middle match (must match at least one segment)
    if (node.globstarInMiddleChild) {
      this._matchGlobstarInMiddle(pathSegments, node.globstarInMiddleChild, params, results, prependedResults, seenTargets, segmentIndex)
    }

    // Try param match (but not if current segment is a wildcard when wildcards are enabled)
    if (node.paramChild && !(this.options.useWildcards && currentSegment === '*')) {
      const newParams = { ...params, [node.paramChild.paramName]: currentSegment }
      this._matchInTrie(pathSegments, node.paramChild.node, newParams, results, prependedResults, seenTargets, segmentIndex + 1)
    }
  }

  private _matchGlobstar(
    pathSegments: string[],
    node: TrieNode<PathTarget>,
    params: Record<string, string>,
    results: PathTargetResult<PathTarget>[],
    prependedResults: PathTargetResult<PathTarget>[],
    seenTargets: Set<string>,
    segmentIndex: number
  ): void {
    // Globstar can match zero or more segments
    // First try matching zero segments (continue with current position)
    this._matchInTrie(pathSegments, node, params, results, prependedResults, seenTargets, segmentIndex)

    // Then try matching one or more segments
    for (let i = segmentIndex + 1; i <= pathSegments.length; i++) {
      this._matchInTrie(pathSegments, node, params, results, prependedResults, seenTargets, i)
    }
  }

  private _matchGlobstarInMiddle(
    pathSegments: string[],
    node: TrieNode<PathTarget>,
    params: Record<string, string>,
    results: PathTargetResult<PathTarget>[],
    prependedResults: PathTargetResult<PathTarget>[],
    seenTargets: Set<string>,
    segmentIndex: number
  ): void {
    // When ** is in the middle of a pattern (like 1/**/event), it must match at least one segment
    for (let i = segmentIndex + 1; i <= pathSegments.length; i++) {
      this._matchInTrie(pathSegments, node, params, results, prependedResults, seenTargets, i)
    }
  }

  private _removeTargetRecord(targetRecord: AdvancedTargetRecord<PathTarget>): void {
    // Remove from _allTargets
    const index = this._allTargets.indexOf(targetRecord)
    if (index !== -1) {
      this._allTargets.splice(index, 1)
    }

    // Rebuild trie without this target
    this._rebuildTrie()
    this._clearMatchCache()
  }

  private _rebuildTrie(): void {
    this._trie = this._createTrieNode()

    for (const targetRecord of this._allTargets) {
      this._addToTrie(targetRecord.parsedMatcher.segments, targetRecord, this._trie)
    }
  }

  private _clearMatchCache(): void {
    this._matchCache.clear()
  }

  /**
   * Matches a wildcard pattern against all registered matchers to find which ones would be matched
   * @param pattern - The wildcard pattern to match against registered matchers
   * @returns The targets whose matchers would be matched by the pattern
   */
  private _matchPatternToPatterns(pattern: string): PathTargetResult<PathTarget>[] {
    const results: PathTargetResult<PathTarget>[] = []
    const prependedResults: PathTargetResult<PathTarget>[] = []
    const seenTargets = new Set<string>()

    // Check advanced matchers
    for (const targetRecord of this._allTargets) {
      if (this._doesPatternMatchMatcher(pattern, targetRecord.matcher)) {
        const targetKey = `${targetRecord.matcher}:${JSON.stringify(targetRecord.target)}:{}`

        if (!seenTargets.has(targetKey)) {
          seenTargets.add(targetKey)

          const result: PathTargetResult<PathTarget> = {
            matcher: targetRecord.matcher,
            target: targetRecord.target,
            params: undefined
          }

          // Handle remaining matches
          if (targetRecord.remainingMatches !== undefined) {
            targetRecord.remainingMatches--
            if (targetRecord.remainingMatches === 0) {
              this._removeTargetRecord(targetRecord)
            }
          }

          if (targetRecord.isPrepended) {
            prependedResults.push(result)
          } else {
            results.push(result)
          }
        }
      }
    }

    return [...prependedResults, ...results]
  }

  /**
   * Checks if a wildcard pattern would match a specific matcher
   * @param pattern - The wildcard pattern (like "user/**")
   * @param matcher - The registered matcher (like "user/create/admin")
   * @returns True if the pattern would match the matcher
   */
  private _doesPatternMatchMatcher(pattern: string, matcher: string): boolean {
    const patternSegments = pattern === '' ? [] : pattern.split(this.options.levelDelimiter!)
    const matcherSegments = matcher === '' ? [] : matcher.split(this.options.levelDelimiter!)

    return this._matchSegments(patternSegments, matcherSegments)
  }

  /**
   * Recursively matches pattern segments against matcher segments
   * @param patternSegments - Segments of the wildcard pattern
   * @param matcherSegments - Segments of the registered matcher
   * @param patternIndex - Current index in pattern segments
   * @param matcherIndex - Current index in matcher segments
   * @returns True if the pattern matches the matcher
   */
  private _matchSegments(patternSegments: string[], matcherSegments: string[], patternIndex: number = 0, matcherIndex: number = 0): boolean {
    // If we've consumed all pattern segments
    if (patternIndex >= patternSegments.length) {
      // Pattern matches if we've also consumed all matcher segments
      return matcherIndex >= matcherSegments.length
    }

    // If we've consumed all matcher segments but still have pattern segments
    if (matcherIndex >= matcherSegments.length) {
      // Only matches if remaining pattern segments are all globstars
      for (let i = patternIndex; i < patternSegments.length; i++) {
        if (patternSegments[i] !== '**') {
          return false
        }
      }
      return true
    }

    const patternSegment = patternSegments[patternIndex]
    const matcherSegment = matcherSegments[matcherIndex]

    if (patternSegment === '**') {
      // Globstar can match zero or more segments
      // Try matching zero segments (skip globstar)
      if (this._matchSegments(patternSegments, matcherSegments, patternIndex + 1, matcherIndex)) {
        return true
      }

      // Try matching one or more segments
      for (let i = matcherIndex + 1; i <= matcherSegments.length; i++) {
        if (this._matchSegments(patternSegments, matcherSegments, patternIndex + 1, i)) {
          return true
        }
      }

      return false
    } else if (patternSegment === '*') {
      // Single wildcard matches exactly one segment
      return this._matchSegments(patternSegments, matcherSegments, patternIndex + 1, matcherIndex + 1)
    } else {
      // Static segment must match exactly
      if (patternSegment === matcherSegment) {
        return this._matchSegments(patternSegments, matcherSegments, patternIndex + 1, matcherIndex + 1)
      } else {
        return false
      }
    }
  }
}
