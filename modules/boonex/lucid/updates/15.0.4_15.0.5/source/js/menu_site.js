/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Lucid Lucid template
 * @ingroup     UnaModules
 *
 * @{
 */

function BxLucidMenuMoreAuto(oOptions) {
    BxDolMenuMoreAuto.call(this, oOptions);
}

BxLucidMenuMoreAuto.prototype = Object.create(BxDolMenuMoreAuto.prototype);
BxLucidMenuMoreAuto.prototype.constructor = BxLucidMenuMoreAuto;

/**
 * Toolbar images (the logo) that load later change the space the menu has: BxDolMenuMoreAuto watches its
 * container with a ResizeObserver, so it needs no extra update here.
 */
BxLucidMenuMoreAuto.prototype.init = function(bForceInit)
{
    BxDolMenuMoreAuto.prototype.init.call(this);
};