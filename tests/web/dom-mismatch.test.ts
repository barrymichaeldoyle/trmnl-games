import { describe, expect, it } from 'vitest'
import { noteDomMismatch, readDomMismatch, routeErrorContext, type DomMismatch } from '../../apps/web/src/lib/domMismatch'

const TEXT = 3
const ELEMENT = 1

type Shape = {
  nodeType: number
  nodeName: string
  parentNode: Shape | null
  childNodes: Shape[]
  id?: string
  classList?: string[]
  textContent?: string | null
}

function element(name: string, options: { id?: string; classList?: string[]; children?: Shape[] } = {}): Shape {
  const node: Shape = { nodeType: ELEMENT, nodeName: name.toUpperCase(), parentNode: null, childNodes: options.children ?? [], id: options.id, classList: options.classList }
  for (const child of node.childNodes) child.parentNode = node
  return node
}

function text(value: string, parent: Shape): Shape {
  const node: Shape = { nodeType: TEXT, nodeName: '#text', parentNode: parent, childNodes: [], textContent: value }
  parent.childNodes.push(node)
  return node
}

describe('DOM insert failures (TRMNL-GAMES-3)', () => {
  it('records where the anchor went, and never the text', () => {
    const parent = element('p', { id: 'hud', classList: ['label-px', 'text-gold-ink', 'sm:border-night'] })
    text('Hero Name Secret', parent)
    const inserted = element('span', { classList: ['block'] })
    const anchor = element('span')
    const elsewhere = element('div', { classList: ['sheet'] })
    elsewhere.childNodes.push(anchor)
    anchor.parentNode = elsewhere
    const error = new DOMException("Failed to execute 'insertBefore' on 'Node'", 'NotFoundError')
    noteDomMismatch(error, parent, inserted, anchor, 'insertBefore', 1_000)

    const detail = readDomMismatch(error, 1_000)
    expect(detail).toMatchObject({
      domOp: 'insertBefore',
      domParent: 'p#hud.label-px.text-gold-ink.sm:border-night',
      domNode: 'span.block',
      domBefore: 'span',
      domBeforeParent: 'div.sheet',
    } satisfies Partial<DomMismatch>)
    expect(detail?.domChildren).toBe('#text(16)')
    expect(JSON.stringify(detail)).not.toContain('Hero Name')
    expect(JSON.stringify(detail)).not.toContain('Secret')
  })

  it('says the anchor is still in the parent when it is', () => {
    const parent = element('div')
    const anchor = element('span')
    parent.childNodes.push(anchor)
    anchor.parentNode = parent
    const error = new DOMException("Failed to execute 'insertBefore' on 'Node'", 'NotFoundError')
    noteDomMismatch(error, parent, element('em'), anchor, 'insertBefore', 2_000)
    expect(readDomMismatch(error, 2_000)?.domBeforeParent).toBe('same')
  })

  it('follows a wrapped insertBefore for two seconds, and ignores an unrelated error', () => {
    const parent = element('section')
    const error = new DOMException("Failed to execute 'insertBefore' on 'Node'", 'NotFoundError')
    noteDomMismatch(error, parent, element('span'), null, 'insertBefore', 5_000)
    const wrapped = new Error(error.message)
    expect(readDomMismatch(wrapped, 6_000)?.domOp).toBe('insertBefore')
    expect(readDomMismatch(wrapped, 8_000)).toBeUndefined()
    expect(readDomMismatch(new TypeError('render failed'), 5_100)).toBeUndefined()
  })

  it('adds a scrubbed component stack beside the node shape', () => {
    const parent = element('p')
    const error = new DOMException("Failed to execute 'insertBefore' on 'Node'", 'NotFoundError')
    noteDomMismatch(error, parent, element('span'), null, 'insertBefore', 9_000)
    const context = routeErrorContext(error, 'at GameScreen https://trmnlgames.com/assets/hero.js?token=secret-token', 9_000)
    expect(context?.componentStack).toBe('at GameScreen https://trmnlgames.com/assets/hero.js')
    expect(context?.domParent).toBe('p')
    expect(context?.domBefore).toBe('null')
    expect(JSON.stringify(context)).not.toContain('secret-token')
  })
})
