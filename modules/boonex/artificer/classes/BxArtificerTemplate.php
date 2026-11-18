<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Artificer Artificer template
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxBaseModGeneralTemplate');

class BxArtificerTemplate extends BxBaseModGeneralTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_artificer';

        parent::__construct($oConfig, $oDb);
    }

    public function getIncludeCssJs($sType)
    {
        $sResult = '';

        switch($sType) {
            case 'head':
                $sResult .= $this->getJsCode('utils', [
                    'sColorScheme' => $this->_oConfig->getColorScheme()
                ]);

                $sCss = trim(getParam($this->_oConfig->getName() . '_styles_custom'));
                if(!empty($sCss))
                    $sCss = $this->_wrapInTagCssCode($sCss);

                $sResult .= $sCss;
                break;

            case 'footer':
                // sidebar.js works the application page type's own sidebar (pt_application.html); no other page has its elements.
                if(BxDolTemplate::getInstance()->getPageType() == BX_PAGE_TYPE_APPLICATION) {
                    $sResult .= $this->addJs([
                        'modules/base/template/js/|sidebar.js',
                    ], true);
                }
                break;
        }

        return $sResult;
    }

    public function getHeader()
    {
        return $this->parseHtmlByName('header.html', []);
    }
}

/** @} */
