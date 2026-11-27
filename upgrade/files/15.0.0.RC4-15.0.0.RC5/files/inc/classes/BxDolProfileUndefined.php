<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * When profile is not available (for example profile is deleted) then use this special class.
 *
 * @section example Example of usage
 *
 * @code
 * $oProfile = BxDolProfile::getInstance($iId);
 * if (!$oProfile)
 *     $oProfile = BxDolProfileUndefined::getInstance();
 * @endcode
 */
class BxDolProfileUndefined extends BxDolFactory implements iBxDolSingleton, iBxDolProfile
{
    /**
     * Constructor
     */
    protected function __construct ()
    {
        parent::__construct();
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        $sClass = get_class($this);
        if (isset($GLOBALS['bxDolClasses'][$sClass]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    public static function getInstance()
    {
        $sClass = __CLASS__;
        if(!isset($GLOBALS['bxDolClasses'][$sClass]))
            $GLOBALS['bxDolClasses'][$sClass] = new $sClass();

        return $GLOBALS['bxDolClasses'][$sClass];
    }

    /**
     * Get profile id
     */
    public function id()
    {
        return 0;
    }

    /**
     * Get profile display name
     */
    public function getDisplayName()
    {
        return _t('_uknown');
    }

    /**
     * Get profile url
     */
    public function getUrl()
    {
        return 'javascript:void(0);';
    }

    /**
     * Get profile unit
     */
    public function getUnit($iProfileId = 0, $aParams = array())
    {
        $aSize2Method = array(
            'icon' => 'Icon',
            'thumb' => 'Thumb',
            'ava' => 'Avatar',
            'ava-big' => 'Picture'
        );

        $sTemplate = 'profile_unit.html';
        $sTemplateSize = 'thumb';
        $aTemplateVars = array();
        if(!empty($aParams['template'])) {
            if(is_string($aParams['template']))
                $sTemplate = 'profile_' . $aParams['template'] . '.html';
            else if(is_array($aParams['template'])) {
                if(!empty($aParams['template']['name']))
                    $sTemplate = 'profile_' . $aParams['template']['name'] . '.html';

                if(!empty($aParams['template']['size']))
                    $sTemplateSize = $aParams['template']['size'];

                if(!empty($aParams['template']['vars']))
                    $aTemplateVars = $aParams['template']['vars'];
            }
        }

        if(empty($sTemplateSize) || !isset($aSize2Method[$sTemplateSize]))
            $sTemplateSize = 'thumb';

        if(empty($aTemplateVars) || !is_array($aTemplateVars))
            $aTemplateVars = array();

        return BxDolTemplate::getInstance()->parseHtmlByName($sTemplate, array_merge(array(
            'size' => $sTemplateSize,
            'thumb_url' => $this->{'get' . $aSize2Method[$sTemplateSize]}(),
            'title' => $this->getDisplayName()
        ), $aTemplateVars));
    }

    /**
     * Get profile unit for API calls
     */
    public function getUnitAPI($iProfileId = 0, $aParams = [])
    {
        return [];
    }
    
    /**
     * Get badges
     */
    public function getBadges()
    {
        return "";
    }

    /**
     * Check whether a profile has real image uploaded by user.
     */
    public function hasImage()
    {
        return false;
    }

    /**
     * Get picture url
     */
    public function getPicture()
    {
        return BxDolTemplate::getLetterAvatarUrl($this->getDisplayName(), $this->id());
    }

    /**
     * Get big (2x) avatar url
     */
    public function getAvatarBig()
    {
        return BxDolTemplate::getLetterAvatarUrl($this->getDisplayName(), $this->id());
    }

    /**
     * Get profile avatar
     */
    public function getAvatar()
    {
        return BxDolTemplate::getLetterAvatarUrl($this->getDisplayName(), $this->id());
    }
	
    /**
     * Get profile cover
     */
    public function getCover()
    {
       return BxDolTemplate::getInstance()->getImageUrl('cover.svg');
    }

    /**
     * Get profile thumb
     */
    public function getThumb()
    {
        return BxDolTemplate::getLetterAvatarUrl($this->getDisplayName(), $this->id());
    }

    /**
     * Get profile icon
     */
    public function getIcon()
    {
        return BxDolTemplate::getLetterAvatarUrl($this->getDisplayName(), $this->id());
    }

    /**
     * Get module icon
     */
    public function getIconModule($iProfileId = 0)
    {
        return 'user';
    }

    /**
     * Get profile edit url
     */
    public function getEditUrl()
    {
        return '';
    }

    /**
     * @see iBxDolProfile::checkAllowedProfileView
     */
    public function checkAllowedProfileView($iProfileId = 0)
    {
        return CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * @see iBxDolProfile::checkAllowedProfileContact
     */
    public function checkAllowedProfileContact($iProfileId = 0)
    {
        return _t('_sys_txt_access_denied');
    }

    /**
     * @see iBxDolProfile::checkAllowedPostInProfile
     */
    public function checkAllowedPostInProfile($iProfileId = 0)
    {
        return _t('_sys_txt_access_denied');
    }

    /**
     * Check if profile is active
     */
    public function isActive($iProfileId = false)
    {
        return true;
    }

	/**
     * Is profile online
     */
	public function isOnline($iProfileId = false)
    {
        return false;
    }

    public function getStatus($iProfileId = false)
    {
        return 'active';
    }

    public function getModule($iProfileId = false)
    {
        return 'system';
    }
}

/** @} */
