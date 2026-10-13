<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Messenger Messenger
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Create/Edit entry form
 */
class BxMessengerFormEntry extends BxBaseModTextFormEntry
{
    public function __construct($aInfo, $oTemplate = false)
    {
        $this->MODULE = 'bx_messenger';
        parent::__construct($aInfo, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;
        if(isset($this->aInputs['submit'])) {
            $this->aInputs['submit']['icon'] = 'contact';
            $this->aInputs['submit']['icon_only'] = true;
            $this->aInputs['submit']['variant'] = 'text';
        }

        if(isset($this->aInputs['message'])) {
            $this->aInputs['message']['autoheight'] = true;
            $this->aInputs['message']['numLines'] = 1;
        }

        $sFieldName = 'files';
    	if(isset($this->aInputs[$sFieldName])) {
           $this->aInputs[$sFieldName]['storage_object'] = $CNF['OBJECT_STORAGE'];
           $this->aInputs[$sFieldName]['uploaders'] = !empty($this->aInputs[$sFieldName]['value']) ? unserialize($this->aInputs[$sFieldName]['value']) : $CNF['OBJECT_UPLOADERS'];

           $this->aInputs[$sFieldName]['images_transcoder'] = $CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW'];
           $this->aInputs[$sFieldName]['storage_private'] = 0;
           $this->aInputs[$sFieldName]['multiple'] = true;
           $this->aInputs[$sFieldName]['content_id'] = 0;
           $this->aInputs[$sFieldName]['ghost_template'] = '';
        }
    }
}

/** @} */
