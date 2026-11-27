<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

/**
 * The module's database changes are its migrations, which BxDolStudioUpdater::actionExecuteSql runs.
 */
class BxApiUpdater extends BxDolStudioUpdater
{
    function __construct($aConfig)
    {
        parent::__construct($aConfig);
    }
}
