<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    MassMailer Mass Mailer
 * @ingroup     UnaModules
 *
 * @{
 */

class BxMassMailerConfig extends BxBaseModTextConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);
        $this->CNF = array (
             // module icon
            'ICON' => 'far envelope col-red2',
            
            // database tables
            'TABLE_CAMPAIGNS' => $aModule['db_prefix'] . 'campaigns',
            'TABLE_SEGMENTS' => $aModule['db_prefix'] . 'segments',
            'TABLE_LETTERS' => $aModule['db_prefix'] . 'letters',
            'TABLE_LINKS' => $aModule['db_prefix'] . 'links',
            'TABLE_UNSUBSCRIBE' => $aModule['db_prefix'] . 'unsubscribe',
            
             // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_TITLE' => 'title',
            'FIELD_SUBJECT' => 'subject',
            'FIELD_FROM_NAME' => 'from_name',
            'FIELD_REPLY_TO' => 'reply_to',
            'FIELD_BODY' => 'body',
            'FIELD_BODY_INFO' => 'body_info',
            'FIELD_EMAIL_LIST' => 'email_list',
            'FIELD_SEGMENTS' => 'segments',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_DATE_SENT' => 'date_sent',
            'FIELD_CAMPAIGN_ID' => 'campaign_id',
            'FIELD_EMAIL' => 'email',
            'FIELD_HASH' => 'hash',
            'FIELD_DATE_SEEN' => 'date_seen',
            'FIELD_DATE_CLICK' => 'date_click',
            'FIELD_LETTER_HASH' => 'letter_hash',
            'FIELD_LINK' => 'link',
            'FIELD_DATE_UNSUBSCRIBED' => 'unsubscribed',
            'FIELD_ACCOUNT_ID' => 'account_id',
            'FIELD_PER_ACCOUNT' => 'is_one_per_account',
            
            // page URIs
            'URI_MANAGE_COMMON' => 'massmailer-campaigns',
            'URI_MANAGE_CAMPAIGNS' => 'massmailer-campaigns',
            'URI_ADD_CAMPAIGN' => 'create-campaign',
            'URI_EDIT_CAMPAIGN' => 'edit-campaign',
            'URI_VIEW_CAMPAIGN' => 'view-campaign',
            'URL_MANAGE_CAMPAIGNS' => 'page.php?i=massmailer-campaigns',

            // some params
            'PARAM_USE_CREATIVE' => true,

            // objects
            'OBJECT_FORM_ENTRY' => 'bx_massmailer',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_massmailer_campaign_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_massmailer_campaign_view',
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_massmailer_campaign_add',
            'OBJECT_MENU_SUBMENU' => 'bx_massmailer_submenu',
            'OBJECT_GRID_CAMPAIGNS' => 'bx_massmailer_campaigns',
            'OBJECT_GRID_LETTERS' => 'bx_massmailer_letters',
        );
        
        $this->_aJsClasses = array(
            'manage_tools' => 'BxMassMailerManageTools',
            'chart' => 'BxMassMailerChart'
        );

        $this->_aJsObjects = array(
            'manage_tools' => 'oBxMassMailerManageTools',
            'chart' => 'oBxMassMailerChart',
        );

        $this->_aGridObjects = array(
            'campaigns' => $this->CNF['OBJECT_GRID_CAMPAIGNS'],
            'letters' => $this->CNF['OBJECT_GRID_LETTERS'],
        );

        $sPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = array_merge($this->_aHtmlIds, [
            'campaign_body' => $sPrefix . '-campaign-body',
        ]);
    }
}

/** @} */
