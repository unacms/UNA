import test from 'node:test';
import assert from 'node:assert/strict';
import { withMenuButtonParams } from './menu-button-params.ts';

test('nothing to add returns the params themselves', () => {
    const params = { className: 'x' };
    assert.equal(withMenuButtonParams(params, { button_style: '', button_size: '' }), params);
    assert.equal(withMenuButtonParams(params, null), params);
    assert.deepEqual(withMenuButtonParams(null, undefined), {});
});

test('UNA fills the style and the size a call site does not name', () => {
    assert.deepEqual(withMenuButtonParams({}, { button_style: 'regular', button_size: 'small' }), {
        button_style: 'bordered',
        button_variant: 'bordered',
        button_primary_style: 'borderedProminent',
        button_size: 'small',
    });
    assert.deepEqual(withMenuButtonParams({}, { button_style: 'glass' }), {
        button_style: 'glass',
        button_variant: 'glass',
        button_primary_style: 'glassProminent',
    });
    assert.deepEqual(withMenuButtonParams({}, { button_style: 'plain' }), {
        button_style: 'plain',
        button_variant: 'plain',
        button_primary_style: 'borderedProminent',
    });
});

test('what the call site fixes stays', () => {
    const fixed = { button_style: 'plain', button_size: 'mini' };
    assert.equal(withMenuButtonParams(fixed, { button_style: 'glass', button_size: 'large' }), fixed);

    const legacy = { button_variant: 'secondary' };
    assert.deepEqual(withMenuButtonParams(legacy, { button_style: 'glass', button_size: 'large' }), {
        button_variant: 'secondary',
        button_size: 'large',
    });
});

test('a call site default is used only when UNA is automatic', () => {
    const params = { button_style_default: 'glass', button_size_default: 'regular', className: 'x' };

    assert.deepEqual(withMenuButtonParams(params, { button_style: '', button_size: '' }), {
        className: 'x',
        button_style: 'glass',
        button_primary_style: 'glassProminent',
        button_size: 'regular',
    });
    assert.deepEqual(withMenuButtonParams(params, { button_style: 'regular', button_size: 'large' }), {
        className: 'x',
        button_style: 'bordered',
        button_variant: 'bordered',
        button_primary_style: 'borderedProminent',
        button_size: 'large',
    });
    assert.deepEqual(withMenuButtonParams({ button_style_default: 'bordered' }, null), {
        button_style: 'bordered',
        button_primary_style: 'borderedProminent',
    });
});

test('a fixed value beats a default, and the default keys never stay', () => {
    assert.deepEqual(
        withMenuButtonParams({ button_size: 'sm', button_size_default: 'regular', button_style_default: 'glass' }, { button_size: 'large' }),
        { button_size: 'sm', button_style: 'glass', button_primary_style: 'glassProminent' }
    );
    assert.deepEqual(withMenuButtonParams({ button_style: 'plain', button_style_default: 'glass' }, { button_style: 'glass' }), {
        button_style: 'plain',
    });
});

test('a primary style the call site names stays', () => {
    assert.deepEqual(withMenuButtonParams({ button_primary_style: 'glassProminent' }, { button_style: 'regular' }), {
        button_primary_style: 'glassProminent',
        button_style: 'bordered',
        button_variant: 'bordered',
    });
});

test('values UNA does not have are automatic', () => {
    const params = {};
    assert.equal(withMenuButtonParams(params, { button_style: 'neon', button_size: 'huge' }), params);
    assert.equal(withMenuButtonParams(params, { button_style: 5, button_size: null }), params);
});

test('a default legacy variant is used only when UNA is automatic and no style is named', () => {
    const params = { button_variant_default: 'default', button_size_default: 'small' };

    assert.deepEqual(withMenuButtonParams(params, { button_style: '', button_size: '' }), {
        button_variant: 'default',
        button_size: 'small',
    });
    assert.deepEqual(withMenuButtonParams(params, { button_style: 'glass', button_size: 'large' }), {
        button_style: 'glass',
        button_variant: 'glass',
        button_primary_style: 'glassProminent',
        button_size: 'large',
    });
    assert.deepEqual(withMenuButtonParams({ button_variant_default: 'default', button_style_default: 'plain' }, null), {
        button_style: 'plain',
        button_primary_style: 'borderedProminent',
    });
    assert.deepEqual(withMenuButtonParams({ button_variant: 'link', button_variant_default: 'default' }, { button_style: 'glass' }), {
        button_variant: 'link',
    });
});
