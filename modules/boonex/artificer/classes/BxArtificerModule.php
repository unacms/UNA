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

bx_import ('BxBaseModTemplateModule');

class BxArtificerModule extends BxBaseModTemplateModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function processReplacements($s)
    {
        $a = $this->_oConfig->getReplacements();
        if(empty($a))
            return $s;

        return str_replace(array_keys($a), array_values($a), $s);
    }

    public function serviceGetSafeServices()
    {
        return array_merge(parent::serviceGetSafeServices(), [
            'GetSplashMarker' => '',
        ]);
    }

    public function serviceIncludeCssJs($sType)
    {
        if(BxDolTemplate::getInstance()->getCode() != $this->_oConfig->getUri())
            return '';

        return $this->_oTemplate->getIncludeCssJs($sType);
    }

    public function serviceGetOptionsColorScheme()
    {
        $aOptions = ['auto', 'light_only', 'dark_only'];

        $aResult = [];
        foreach($aOptions as $sOption)
            $aResult[$sOption] = _t('_bx_artificer_stg_cpt_option_color_scheme_' . $sOption);

        return $aResult;
    }

    /**
     * The choices of the "Header width" setting: Designer's, or one width for every layout.
     */
    public function serviceGetOptionsHeaderWidth()
    {
        $aResult = ['' => _t('_bx_artificer_stg_cpt_option_header_designer')];
        foreach(BxDolTemplate::HEADER_WIDTHS as $sOption)
            $aResult[$sOption] = _t('_bx_artificer_stg_cpt_option_header_width_' . $sOption);

        return $aResult;
    }

    /**
     * The choices of the "Main menu alignment" setting: Designer's, or one place for every layout.
     */
    public function serviceGetOptionsHeaderAlign()
    {
        $aResult = ['' => _t('_bx_artificer_stg_cpt_option_header_designer')];
        foreach(BxDolTemplate::HEADER_ALIGNS as $sOption)
            $aResult[$sOption] = _t('_bx_artificer_stg_cpt_option_header_align_' . $sOption);

        return $aResult;
    }

    public function serviceGetSplashMarker($sName)
    {
        $sResult = '';

        switch($sName) {
            case 'header':
                $sResult = $this->_oTemplate->getHeader();
                break;

            case 'members':
                $sResult = '0';
                if($aMembers = BxDolAccountQuery::getInstance()->getAccounts(['type' => 'confirmed']))
                    $sResult = count($aMembers);
                break;

            case 'posts':
                $iPosts = 0;
                $aModules = bx_srv('system', 'get_modules_by_type', ['content']);
                foreach($aModules as $aModule)
                    if(BxDolRequest::serviceExists($aModule['name'], 'get_all'))
                        $iPosts += bx_srv($aModule['name'], 'get_all', [['type' => 'all', 'count' => true]]);
                
                $sResult = $iPosts;
                break;

            case 'comments':
                $sResult = (int)BxDolCmtsQuery::getInfoBy(['type' => 'all', 'count' => true]);
                break;

            case 'login_agreement':
                $oPermalink = BxDolPermalinks::getInstance();
                $sLinkTerms = bx_absolute_url($oPermalink->permalink('page.php?i=terms'));
                $sLinkPrivacy = bx_absolute_url($oPermalink->permalink('page.php?i=privacy'));

                $sResult = _t('_bx_artificer_txt_splash_login_agreement', $sLinkTerms, $sLinkPrivacy);
                break;
        }

        return $sResult;
    }
}

/** @} */
