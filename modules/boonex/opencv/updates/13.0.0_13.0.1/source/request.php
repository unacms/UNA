<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    OpenCV OpenCV integration
 * @ingroup     UnaModules
 *
 * @{
 */

check_logged();

if ( empty($aRequest) || empty($aRequest[0]) ) {
    BxDolRequest::processAsFile($aModule, $aRequest);
} else {
    BxDolRequest::processAsAction($aModule, $aRequest);
}

/** @} */
