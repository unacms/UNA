<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_MODULE_SYSTEM', 'system');
define('BX_DOL_STUDIO_MODULE_CUSTOM', 'custom');

define('BX_DOL_STUDIO_MODULE_ICON_DEFAULT', 'far lightbulb');

define('BX_DOL_STUDIO_VISIBLE_ALL', 'all');
define('BX_DOL_STUDIO_VISIBLE_SELECTED', 'selected');

class BxDolStudioUtils extends BxDol
{
    function __construct()
    {
        parent::__construct();
    }

    public static function getSystemName($sValue)
    {
        return str_replace(' ', '_', strtolower($sValue));
    }

    public static function getClassName($sValue)
    {
        return bx_gen_method_name($sValue);
    }

    public static function getIconDefault($sType = '')
    {
    	$sIcon = '';

		switch ($sType) {
			case BX_DOL_MODULE_TYPE_MODULE:
				$sIcon = 'cube';
				break;

			case BX_DOL_MODULE_TYPE_LANGUAGE:
				$sIcon = 'language';
				break;

			case BX_DOL_MODULE_TYPE_TEMPLATE:
				$sIcon = 'adjust';
				break;

			default:
				$sIcon = BX_DOL_STUDIO_MODULE_ICON_DEFAULT;
		}

		return $sIcon;
    }
    
    public static function getWidgetIcon($mixedWidget)
    {
        if(!is_array($mixedWidget)) 
            $mixedWidget = BxDolStudioWidgetsQuery::getInstance()->getWidgets(array('type' => 'by_id', 'value' => (int)$mixedWidget));

        $oTemplate = BxDolStudioTemplate::getInstance();

        $sUrl = $oTemplate->getModuleIconUrl($mixedWidget['module'] . '.svg');
        if(empty($sUrl))
            $sUrl = $oTemplate->getIconUrl($mixedWidget['icon']);
        if(empty($sUrl) && ($aModule = BxDolModuleQuery::getInstance()->getModuleByName($mixedWidget['module'])) && is_array($aModule))
            $sUrl = BxDolStudioUtils::getIconDefault($aModule['type']);

        return $sUrl;
    }

    public static function getModuleIcon($mixedModule, $sType = 'menu', $bReturnAsUrl = true)
    {
        $aType2Prefix = array('menu' => 'mi', 'page' => 'pi', 'store' => 'si');

        if(!is_array($mixedModule))
	        $aModule = BxDolModuleQuery::getInstance()->getModuleByName($mixedModule);
        else 
        	$aModule = $mixedModule;

		$sDefaultIcon = self::getIconDefault(isset($aModule['type']) ? $aModule['type'] : '');
        if(empty($aModule))
            return $sDefaultIcon;

        $sModuleIcon = '';
        if(isset($aModule['path']))
			$sModuleIcon = $aModule['name'] . '@modules/' . $aModule['path'] . '|std-' . $aType2Prefix[$sType] . '.png';
		else if(isset($aModule['dir']))
			$sModuleIcon = $aModule['name'] . '@modules/' . $aModule['dir'] . '|std-' . $aType2Prefix[$sType] . '.png';
        $sModuleIconUrl = BxDolStudioTemplate::getInstance()->getIconUrl($sModuleIcon);

        if(empty($sModuleIconUrl)) {
            if(isset($aModule['path']))
    			$sModuleIcon = $aModule['name'] . '@modules/' . $aModule['path'] . '|std-icon.svg';
    		else if(isset($aModule['dir']))
    			$sModuleIcon = $aModule['name'] . '@modules/' . $aModule['dir'] . '|std-icon.svg';
            $sModuleIconUrl = BxDolStudioTemplate::getInstance()->getIconUrl($sModuleIcon);
        }

        return !empty($sModuleIcon) && !empty($sModuleIconUrl) ? ($bReturnAsUrl ? $sModuleIconUrl : $sModuleIcon) : $sDefaultIcon;
    }

	public static function getModuleImage($mixedModule, $sName, $bReturnAsUrl = true)
    {
		$aModule = is_array($mixedModule) ? $mixedModule : BxDolModuleQuery::getInstance()->getModuleByName($mixedModule);
        if(empty($aModule))
            return '';

        $sModuleImage = '';
        if(isset($aModule['path']))
			$sModuleImage = $aModule['name'] . '@modules/' . $aModule['path'] . '|' . $sName;
		else if(isset($aModule['dir']))
			$sModuleImage = $aModule['name'] . '@modules/' . $aModule['dir'] . '|' . $sName;
        $sModuleImageUrl = BxDolStudioTemplate::getInstance()->getImageUrl($sModuleImage);

        return !empty($sModuleImage) && !empty($sModuleImageUrl) ? ($bReturnAsUrl ? $sModuleImageUrl : $sModuleImage) : '';
    }

    public static function getModuleTitle($sName)
    {
        $sTitle = '_adm_txt_module_' . strtolower($sName);

        if(in_array($sName, array(BX_DOL_STUDIO_MODULE_SYSTEM, BX_DOL_STUDIO_MODULE_CUSTOM)))
            return _t($sTitle);

        $aModule = BxDolModuleQuery::getInstance()->getModuleByName($sName);
        if(empty($aModule) || !is_array($aModule))
            return _t($sTitle);
        
        $sTitle = '_' . $aModule['name'];
        $$sTitle = _t($sTitle);
        if(strcmp($sTitle, $$sTitle) !== 0)
            return $$sTitle;

        return $aModule['title'];
    }

    public static function getModules($bShowCustom = true, $bShowSystem = true)
    {
        $aResult = array();

        if($bShowSystem)
            $aResult[BX_DOL_STUDIO_MODULE_SYSTEM] = self::getModuleTitle(BX_DOL_STUDIO_MODULE_SYSTEM);

        if($bShowCustom)
            $aResult[BX_DOL_STUDIO_MODULE_CUSTOM] = self::getModuleTitle(BX_DOL_STUDIO_MODULE_CUSTOM);

        $aModules = BxDolModuleQuery::getInstance()->getModulesBy(array('type' => 'type', 'value' => array(BX_DOL_MODULE_TYPE_MODULE, BX_DOL_MODULE_TYPE_TEMPLATE), 'active' => 1));
        foreach($aModules as $aModule)
            $aResult[$aModule['name']] = $aModule['title'];

        return $aResult;
    }
    public static function getVisibilityTitle($iValue)
    {
        $iCount = self::getVisibilityCount($iValue);

        $sResult = "";
        switch($iCount) {
            case 1:
                $aLevel = BxDolAcl::getInstance()->getMembershipInfo(log($iValue, 2) + 1);
                $sResult = _t($aLevel['name']);
                break;
            case 0:
                $sResult = _t('_adm_prm_txt_visibility_items_nobody');
                break;
            case -1:
                $sResult = _t('_adm_prm_txt_visibility_items_anyone');
                break;
            default:
                $sResult = _t('_adm_prm_txt_visibility_items_n_user_levels', $iCount);
        }

        return $sResult;
    }

    public static function getVisibilityCount(&$iValue)
    {
        $iValue = (int)$iValue;

        $iResult = 0;
        $iCheck = $iValue;
        if($iCheck == 0)
            return $iResult;
        else if($iCheck == BX_DOL_INT_MAX)
            return -1;

        $aLevels = BxDolAcl::getInstance()->getMemberships(false, true);

        $iIndex = 1;
        do {
            if($iCheck & 1) {
                if(array_key_exists($iIndex, $aLevels))
                    $iResult += 1;
                else 
                    $iValue = $iValue ^ (1 << ($iIndex - 1));
            }

            $iIndex += 1;
        } while(($iCheck = $iCheck >> 1) != 0);

        return $iResult;
    }

    public static function getVisibilityValue($sVisibleFor, $aVisibleForLevels)
    {
        if($sVisibleFor == BX_DOL_STUDIO_VISIBLE_ALL)
            return BX_DOL_INT_MAX;

        $iVisibleFor = 0;
        if(is_array($aVisibleForLevels))
            foreach($aVisibleForLevels as $iLevelId)
                $iVisibleFor += pow(2, (int)$iLevelId - 1);

        return $iVisibleFor;
    }

    public static function getVisibilityValues($iValue, &$aValuesAll, &$aValuesSelected)
    {
        if(!is_array($aValuesAll))
            $aValuesAll = array();
        if(!is_array($aValuesSelected))
            $aValuesSelected = array();

        $aLevels = BxDolAcl::getInstance()->getMemberships(false, true);
        foreach($aLevels as $iKey => $sValue) {
            if(((int)$iValue & pow(2, (int)$iKey - 1)) != 0)
                $aValuesSelected[] = $iKey;

            $aValuesAll[$iKey] = _t($sValue);
        }
    }

    public static function addInArray($aInput, $sKey, $aValues, $bAddAfter = true)
    {
        reset($aInput);
        $iInput = count($aInput);
        for($i = 0; $i < $iInput; $i++, next($aInput))
            if(key($aInput) == $sKey)
                break;

		if($bAddAfter)
			$i += 1;

        $aOutput = array_slice($aInput, 0, $i);
        $aOutput = array_merge($aOutput, $aValues);
        $aOutput = array_merge($aOutput, array_slice($aInput, $i));

        return $aOutput;
    }
}

/** @} */
