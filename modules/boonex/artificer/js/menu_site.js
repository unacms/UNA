/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Artificer Artificer template
 * @ingroup     UnaModules
 *
 * @{
 */

function BxArtificerMenuMoreAuto(oOptions) {
    BxDolMenuMoreAuto.call(this, oOptions);
}

BxArtificerMenuMoreAuto.prototype = Object.create(BxDolMenuMoreAuto.prototype);
BxArtificerMenuMoreAuto.prototype.constructor = BxArtificerMenuMoreAuto;

/**
 * Toolbar images (the logo) that load later change the space the menu has: BxDolMenuMoreAuto watches its
 * container with a ResizeObserver, so it needs no extra update here.
 */
BxArtificerMenuMoreAuto.prototype.init = function(bForceInit)
{
    BxDolMenuMoreAuto.prototype.init.call(this);
};