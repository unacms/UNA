// Profile listings (people + orgs + connections) render as flush rows on mobile:
// each row is its own rounded card 8px in from the sides; CardList chrome belongs
// to the sm+ grid. Shared by the units (components/units/helpers.js) and the
// list padding (default/functions.js `paddingForList`).
export const FLUSH_LIST_MODULES = new Set(['bx_persons', 'bx_organizations', 'system']);
