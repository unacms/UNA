<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reminders Reminders
 * @ingroup     UnaModules
 *
 * @{
 */

class BxRemindersConfig extends BxBaseModGeneralConfig
{
    protected $_oDb;

    /**
     * Is needed to send system notifications from.
     */
    protected $_iSystemProfileId;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->CNF = array (
            // module icon
            'ICON' => 'bell col-red3',    

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'entries',
            'TABLE_TYPES' => $aModule['db_prefix'] . 'types',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_TITLE' => 'title',
            'FIELD_TEXT' => 'text',
            'FIELD_LINK' => 'link',

            // page URIs
            'URI_VIEW_ENTRY' => '',

            // options
            'PARAM_DELETE_AFTER' => 'bx_reminders_delete_after',
            'PARAM_DELETE_SYSTEM_PROFILE_ID' => 'bx_reminders_system_profile_id',
            'PARAM_DAYS_DELIMITER' => ',',

            // objects
            'OBJECT_CONNECTIONS_FRD' => 'sys_profiles_friends',
            'OBJECT_CONNECTIONS_SBN' => 'sys_profiles_subscriptions',

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_reminders_txt_sample_single',
            	'txt_sample_single_with_article' => '_bx_reminders_txt_sample_single_with_article',
            )
        );

        $this->_aJsClasses = array(
            'main' => 'BxRemindersMain',
        );

        $this->_aJsObjects = array(
            'main' => 'oBxRemindersMain',
        );

        $sPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = array(
            'main' => $sPrefix . '-main',
        );
    }

    public function init(&$oDb) 
    {
        $this->_oDb = &$oDb;

        $this->_iSystemProfileId = (int)getParam($this->CNF['PARAM_DELETE_SYSTEM_PROFILE_ID']);
        if(empty($this->_iSystemProfileId))
            $this->_iSystemProfileId = (int)getParam('sys_profile_bot');
    }

    public function getHtmlIds($sKey = '')
    {
        if(empty($sKey))
            return $this->_aHtmlIds;

        return isset($this->_aHtmlIds[$sKey]) ? $this->_aHtmlIds[$sKey] : '';
    }

    public function getSystemProfileId()
    {
        return $this->_iSystemProfileId;
    }
}

/** @} */
