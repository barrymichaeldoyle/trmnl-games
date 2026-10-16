import { scrubAnalyticsText } from './analytics'

/**
 * TRMNL-GAMES-3: React's `insertBefore` crash names no component and no node. The router's error
 * screen only receives the exception. This records the element shape at the moment the browser
 * refuses the insert (tags, ids, a few classes, text length — never the text) and, with the
 * component stack from `defaultOnCatch`, gives the next event both sides of the mismatch.
 */

const MARK = Symbol.for('trmnl.domMismatch')
const GUARD = Symbol.for('trmnl.domMismatchGuard')
const ELEMENT = 1
const TEXT = 3
const COMMENT = 8

type DomShape = {
  nodeType: number
  nodeName: string
  parentNode: DomShape | null
  childNodes: ArrayLike<DomShape>
  id?: string
  classList?: ArrayLike<string>
  textContent?: string | null
}

export type DomMismatch = {
  domOp: 'insertBefore' | 'appendChild'
  domParent: string
  domChildren: string
  domNode: string
  domBefore: string
  domBeforeParent: string
}

let recent: { at: number; detail: DomMismatch } | null = null

function idOf(node: DomShape): string {
  const id = node.id
  if (!id || id.length > 32 || /[^A-Za-z0-9_:-]/.test(id)) return ''
  return `#${id}`
}

function classesOf(node: DomShape): string {
  const list = node.classList
  if (!list) return ''
  const names: string[] = []
  for (let i = 0; i < list.length && names.length < 4; i++) {
    const token = list[i] ?? ''
    if (token.length > 0 && token.length <= 40 && !token.includes('@')) names.push(token)
  }
  return names.length > 0 ? `.${names.join('.')}` : ''
}

function describe(node: DomShape | null): string {
  if (!node) return 'null'
  if (node.nodeType === TEXT) {
    const length = node.textContent?.length ?? 0
    return length > 0 ? `#text(${length})` : '#text'
  }
  if (node.nodeType === COMMENT) return '#comment'
  if (node.nodeType !== ELEMENT) return node.nodeName.toLowerCase()
  return `${node.nodeName.toLowerCase()}${idOf(node)}${classesOf(node)}`
}

function chain(node: DomShape | null): string {
  const parts: string[] = []
  let current = node
  for (let depth = 0; depth < 4 && current; depth++) {
    parts.push(describe(current))
    current = current.parentNode
  }
  return parts.join(' < ') || 'null'
}

function childrenOf(node: DomShape): string {
  const shown = Math.min(node.childNodes.length, 8)
  const parts: string[] = []
  for (let i = 0; i < shown; i++) parts.push(describe(node.childNodes[i] ?? null))
  const rest = node.childNodes.length - shown
  if (rest > 0) parts.push(`+${rest}`)
  return parts.join(', ') || 'empty'
}

/** Attaches the insert that the browser rejected. A wrapped copy of the same failure can still be read for two seconds. */
export function noteDomMismatch(error: unknown, parent: DomShape, inserted: DomShape, before: DomShape | null, op: DomMismatch['domOp'], now = Date.now()) {
  const detail: DomMismatch = {
    domOp: op,
    domParent: chain(parent),
    domChildren: childrenOf(parent),
    domNode: describe(inserted),
    domBefore: describe(before),
    domBeforeParent: before === null ? 'null' : before.parentNode === parent ? 'same' : chain(before.parentNode),
  }
  recent = { at: now, detail }
  if (error && typeof error === 'object') Object.defineProperty(error, MARK, { value: detail, enumerable: false })
}

export function readDomMismatch(error: unknown, now = Date.now()): DomMismatch | undefined {
  if (error && typeof error === 'object' && MARK in error) return (error as { [MARK]?: DomMismatch })[MARK]
  if (!recent || now - recent.at > 2_000) return undefined
  const message = error instanceof Error ? `${error.name} ${error.message}` : ''
  if (!/insertBefore|appendChild/.test(message)) return undefined
  return recent.detail
}

/** Component stack plus any DOM mismatch, scrubbed and bounded, for a route error report. */
export function routeErrorContext(error: unknown, componentStack?: string, now = Date.now()): Record<string, string> | undefined {
  const fields: Record<string, string> = {}
  const stack = componentStack?.trim()
  if (stack) fields.componentStack = scrubAnalyticsText(stack).slice(0, 1_500)
  const mismatch = readDomMismatch(error, now)
  if (mismatch) Object.assign(fields, mismatch)
  return Object.keys(fields).length > 0 ? fields : undefined
}

function blame(error: unknown, op: DomMismatch['domOp'], parent: Node, inserted: Node, before: Node | null) {
  if (!(error instanceof DOMException) || (error.name !== 'NotFoundError' && error.name !== 'HierarchyRequestError')) return
  noteDomMismatch(error, parent as unknown as DomShape, inserted as unknown as DomShape, before as unknown as DomShape | null, op)
}

/** Wraps the two DOM inserts React uses while committing, once per page. */
export function installDomMismatchGuard() {
  if (typeof Node === 'undefined' || GUARD in Node.prototype.insertBefore) return
  const insert = Node.prototype.insertBefore
  const append = Node.prototype.appendChild
  function insertBefore<T extends Node>(this: Node, node: T, child: Node | null): T {
    try {
      return insert.call(this, node, child) as T
    } catch (error) {
      try { blame(error, 'insertBefore', this, node, child) } catch { /* the original insert failure is the one to report */ }
      throw error
    }
  }
  function appendChild<T extends Node>(this: Node, node: T): T {
    try {
      return append.call(this, node) as T
    } catch (error) {
      try { blame(error, 'appendChild', this, node, null) } catch { /* the original insert failure is the one to report */ }
      throw error
    }
  }
  Object.defineProperty(insertBefore, GUARD, { value: true })
  Node.prototype.insertBefore = insertBefore
  Node.prototype.appendChild = appendChild
}
