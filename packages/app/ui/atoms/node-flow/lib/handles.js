/**
 * Node-handle resolution for NodeFlow edges.
 *
 * Inspired by React Flow's `sourceHandle` / `targetHandle` model: every node
 * exposes a small set of named anchor points on its bounding box (`left`,
 * `right`, `top`, `bottom`, `center`), and an edge picks the source and
 * target handle by name. The actual point in SVG coordinates is computed
 * from the node's center and size.
 *
 * Pure helpers — reusable from any custom variant (registered via
 * `app/customization/node-flow-variants.js`).
 */

/** @typedef {'left'|'right'|'top'|'bottom'|'center'} HandlePosition */

export const HANDLE_POSITIONS = ['left', 'right', 'top', 'bottom', 'center'];

/**
 * Geometry of a single node bubble in SVG space. NodeFlow nodes are circular
 * so a single half-size suffices, but the helper still accepts an optional
 * non-square `halfHeight` for variants that render rectangular bubbles.
 *
 * @typedef {Object} NodeGeometry
 * @property {number} cx                 Center X in SVG coords.
 * @property {number} cy                 Center Y in SVG coords.
 * @property {number} halfWidth          Half the bubble width.
 * @property {number} [halfHeight]       Half the bubble height (defaults to `halfWidth`).
 */

/**
 * Resolve the {x, y} of a handle on a node's bounding box.
 *
 * @param {NodeGeometry} geo
 * @param {HandlePosition} [position='center']
 * @returns {{ x: number, y: number }}
 */
export function handlePoint(geo, position = 'center') {
    const halfH = geo.halfHeight ?? geo.halfWidth;
    switch (position) {
        case 'left':
            return { x: geo.cx - geo.halfWidth, y: geo.cy };
        case 'right':
            return { x: geo.cx + geo.halfWidth, y: geo.cy };
        case 'top':
            return { x: geo.cx, y: geo.cy - halfH };
        case 'bottom':
            return { x: geo.cx, y: geo.cy + halfH };
        case 'center':
        default:
            return { x: geo.cx, y: geo.cy };
    }
}

/**
 * Sensible default handle for an edge endpoint, given the flow's main axis.
 * For horizontal flows: source = right, target = left. For vertical: source
 * = bottom, target = top. Used when an edge omits `sourceHandle` /
 * `targetHandle`.
 *
 * @param {'horizontal'|'vertical'} orientation
 * @param {'source'|'target'} role
 * @returns {HandlePosition}
 */
export function defaultHandleFor(orientation, role) {
    const isHorizontal = orientation !== 'vertical';
    if (role === 'source') return isHorizontal ? 'right' : 'bottom';
    return isHorizontal ? 'left' : 'top';
}

/**
 * Resolve a node reference (id string or numeric index) against a `nodes`
 * array. Returns `{ node, index }` or `null` when nothing matches.
 *
 * @param {string|number} ref
 * @param {Array<{ id?: string|number }>} nodes
 * @returns {{ node: object, index: number } | null}
 */
export function resolveNodeRef(ref, nodes) {
    if (ref == null || !Array.isArray(nodes)) return null;
    if (typeof ref === 'number') {
        return nodes[ref] ? { node: nodes[ref], index: ref } : null;
    }
    const idx = nodes.findIndex((n) => n && n.id === ref);
    if (idx === -1) return null;
    return { node: nodes[idx], index: idx };
}
