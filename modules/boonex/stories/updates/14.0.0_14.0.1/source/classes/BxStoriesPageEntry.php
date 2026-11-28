<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Stories Stories
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Entry create/edit pages
 */
class BxStoriesPageEntry extends BxBaseModTextPageEntry
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_stories';

        parent::__construct($aObject, $oTemplate);
    }

    public function getCode ()
    {
        return $this->_oTemplate->getJsCode('main') . parent::getCode();
    }

    protected function _getThumbForMetaObject ()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if (!($aMediaList = $this->_oModule->_oDb->getMediaListByContentId($this->_aContentInfo[$CNF['FIELD_ID']])))
            return false;

        $aMedia = array_shift($aMediaList);

        return array('id' => $aMedia['file_id'], 'transcoder' => $CNF['OBJECT_TRANSCODER_COVER']);
    }
}

/** @} */
