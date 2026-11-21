<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCoreSamples Samples
 * @{
 */

/**
 * @page samples
 * @section grid Grid
 */

/**

-- SQL dump of grid object:

INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_mode`, `sorting_fields`, `override_class_name`, `override_class_file`) VALUES
('sample', 'Sql', 'SELECT `ID`, `NickName`, `Email`, `City`, `Status` FROM `sample_grid_data` WHERE `Role` != 3 ', 'sample_grid_data', 'ID', 'Order', '', 5, NULL, 'start', '', 'NickName,City,Headline,DescriptionMe,Tags', 'auto', 'ID,NickName,Email,City', 'BxGridMy', 'samples/BxGridMy.php');

-- SQL dump of grid object fields:

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `order`) VALUES
('sample', 'order', '', '1%', '', 1),
('sample', 'checkbox', 'Select', '2%', '', 2),
('sample', 'ID', 'id', '7%', '', 3),
('sample', 'NickName', 'Username', '20%', '', 4),
('sample', 'Email', 'Email', '20%', '', 5),
('sample', 'actions', 'Actions', '20%', '', 8),
('sample', 'City', 'City', '20%', '', 6),
('sample', 'Status', 'Status', '10%', '', 7);

-- SQL dump of grid object actions:

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `confirm`, `order`) VALUES
('sample', 'bulk', 'delete', '_Delete', 1, 1),
('sample', 'bulk', 'approve', '_Approve', 0, 2),
('sample', 'bulk', 'custom1', '_Custom1', 0, 4),
('sample', 'bulk', 'custom2', '_Custom2', 0, 5),
('sample', 'single', 'delete', '_Delete', 1, 1),
('sample', 'single', 'edit', '_Edit', 0, 2),
('sample', 'independent', 'add', '_Add record', 0, 1),
('sample', 'independent', 'settings', '_Settings', 0, 2);

-- SQL dump of sample data:

CREATE TABLE IF NOT EXISTS `sample_grid_data` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `NickName` varchar(255) NOT NULL DEFAULT '',
  `Email` varchar(255) NOT NULL DEFAULT '',
  `Status` enum('Unconfirmed','Approval','Active','Rejected','Suspended') NOT NULL DEFAULT 'Unconfirmed',
  `Role` tinyint(4) unsigned NOT NULL DEFAULT '1',
  `Sex` varchar(255) NOT NULL DEFAULT '',
  `Headline` varchar(255) NOT NULL,
  `DescriptionMe` text NOT NULL,
  `Country` varchar(255) NOT NULL DEFAULT '',
  `City` varchar(255) NOT NULL,
  `DateOfBirth` date NOT NULL,
  `Tags` varchar(255) NOT NULL DEFAULT '',
  `Order` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `NickName` (`NickName`),
  KEY `Country` (`Country`),
  KEY `DateOfBirth` (`DateOfBirth`),
  FULLTEXT KEY `NickName_2` (`NickName`,`City`,`Headline`,`DescriptionMe`,`Tags`)
);

INSERT INTO `sample_grid_data` VALUES
(1, 'admin', 'dev@example.com', 'Rejected', 3, '', '', '', '', '', '0000-00-00', '', 0),
(43, 'Shmak', 'shamks@gmail.com', 'Active', 1, '', '', '', '', 'Yogurtown', '0000-00-00', '', 1),
(45, 'Rio', 'parrot@blue.bz', 'Active', 1, '', '', '', '', 'Rio', '0000-00-00', '', 9),
(36, 'Master Yoda', 'force@galaxy.sw', 'Active', 1, '', '', '', '', 'Sydney', '0000-00-00', '', 4),
(28, 'petr', 'petr@petrovich.com', 'Active', 1, '', '', '', '', 'Petrovka', '0000-00-00', '', 10),
(35, 'MrTwister', 'mr@twister.com', 'Active', 1, '', '', '', '', 'Mumbai', '0000-00-00', '', 6),
(42, 'kokoko', 'okokok@ok.com', 'Unconfirmed', 1, '', '', '', '', 'Ok', '0000-00-00', '', 10),
(34, 'uno', 'uno@example.com', 'Active', 1, '', '', '', '', 'Sydney', '0000-00-00', '', 9),
(41, 'Super User', 'user@super.co', 'Active', 1, '', '', '', '', 'Seashore', '0000-00-00', '', 2),
(10, 'Andrew5', 'uno5@example.com', 'Active', 1, 'male', 'Unite People!', '<p>This is a demo profile that you may find on <a href="https://una.io/">UNA</a>.<p>UNA mission is to Unite People and thus make the world a better place.</p>', 'AU', 'Castle Hill', '1981-03-31', 'una, community, unite, people', 10),
(47, 'Bimbo', 'bambi@bumba.com', 'Unconfirmed', 1, '', '', '', '', 'Bomba', '0000-00-00', '', 3),
(50, 'X-Man', 'x@man.me', 'Unconfirmed', 1, '', '', '', '', 'Movie City', '0000-00-00', '', 10);

*/

class BxGridMy extends BxTemplGrid
{
    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);
    }

    /**
     * add js file for AJAX form submission
     */
    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addJs('jquery.form.min.js');

        $oForm = new BxTemplFormView(array());
        $oForm->addCssJs();
    }

    /**
     * 'add' action handler
     */
    public function performActionAdd()
    {
        $sAction = 'add';

        $aForm = array(
            'form_attrs' => array(
                'id' => 'sample-add-form',
                'action' => 'grid.php?' . bx_encode_url_params($_GET, array('ids', '_r')), // grid.php is usiversal actions handler file, we need to pass object and action names to it at least, or just all the params to preserve such states like filter and paginate
                'method' => 'post',
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sample_grid_data',
                    'key' => 'ID',
                    'submit_name' => 'do_submit',
                ),
            ),
            'inputs' => array(
                'NickName' => array(
                    'type' => 'text',
                    'name' => 'NickName',
                    'caption' => _t('Username'),
                    'required' => true,
                    'checker' => array(
                        'func' => 'length',
                        'params' => array(1, 150),
                        'error' => _t( 'Username is required' )
                    ),
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'Email' => array(
                    'type' => 'text',
                    'name' => 'Email',
                    'caption' => _t('Email'),
                    'required' => true,
                    'checker' => array(
                        'func' => 'email',
                        'error' => _t( '_Incorrect Email' )
                    ),
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'City' => array(
                    'type' => 'text',
                    'name' => 'City',
                    'caption' => _t('City'),
                    'required' => true,
                    'checker' => array(
                        'func' => 'length',
                        'params' => array(1, 150),
                        'error' => _t( 'City is required' )
                    ),
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),

                'submit' => array(
                    'type' => 'input_set',
                    0 => array (
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_Submit'),
                    ),
                    1 => array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('Close'),
                        'attrs' => array(
                            'onclick' => "$('.bx-popup-active').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ),
                    ),
                ),

            ),
        );

        $oForm = new BxTemplFormView($aForm);
        $oForm->initChecker();

        if ($oForm->isSubmittedAndValid()) { // if form is submitted and all fields are valid

            $iNewId = $oForm->insert (array(), true); // insert record to database
            if ($iNewId)
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iNewId); // if record is successfully added, reload grid and highlight added row
            else
                $aRes = array('msg' => "Error occured"); // if record adding failed, display error message

            echoJson($aRes);

        } else { // if form is not submitted or some fields are invalid, display popup with form

            // we need to use 'transBox' function to properly display 'popup'
            $s = BxTemplFunctions::getInstance()->transBox('', '
                <div class="bx-def-padding bx-def-color-bg-block" style="width:300px;">' . $oForm->getCode() . '</div>
                <script>
                    $(document).ready(function () {
                        $("#sample-add-form").ajaxForm({
                            dataType: "json",
                            beforeSubmit: function (formData, jqForm, options) {
                                bx_loading($("#' . $aForm['form_attrs']['id'] . '"), true);
                            },
                            success: function (data) {
                                $(".bx-popup-active").dolPopupHide();
                                glGrids.' . $this->_sObject . '.processJson(data, "' . $sAction . '");
                            }
                        });
                    });
                </script>');

            echoJson(array('popup' => array('html' => $s, 'options' => array('closeOnOuterClick' => false))));

        }
    }

    /**
     * 'approve' action handler
     */
    public function performActionApprove()
    {
        $iAffected = 0;
        $aIds = bx_get('ids');
        if (!$aIds || !is_array($aIds)) {
            echoJson(array());
            exit;
        }

        $aIdsAffected = array ();
        foreach ($aIds as $mixedId) {
            if (!$this->_approve($mixedId))
                continue;
            $aIdsAffected[] = $mixedId;
            $iAffected++;
        }

        echoJson(array_merge(
                array(
                    'grid' => $this->getCode(false),
                    'blink' => $aIdsAffected,
                    'eval' => 'alert(22)',
                ),
                $iAffected ? array () : array('msg' => "Profile(s) activation failed")
            )
        );
    }

    /**
     * helper funtion for 'approve' action handler
     */
    protected function _approve ($mixedId)
    {
        $oDb = BxDolDb::getInstance();
        $sTable = $this->_aOptions['table'];
        $sFieldId = $this->_aOptions['field_id'];
        $sQuery = $oDb->prepare("UPDATE `{$sTable}` SET `Status` = 'Active' WHERE `{$sFieldId}` = ?", $mixedId);
        return $oDb->query($sQuery);
    }

    /**
     * custom cell look for 'Status' field
     */
    protected function _getCellStatus ($mixedValue, $sKey, $aField, $aRow)
    {
        $sAttr = $this->_convertAttrs(
            $aField, 'attr_cell',
            false,
            isset($aField['width']) ? 'width:' . $aField['width'] : false // add default styles
        );
        return '<td ' . $sAttr . '><span style="background-color:' . ('Active' == $mixedValue ? '#cfc' : '#fcc') . '">' . $mixedValue . '</span></td>';
    }

    /**
     * custom column header look for 'Status' field
     */
    protected function _getCellHeaderStatus ($sKey, $aField)
    {
        $s = parent::_getCellHeaderDefault($sKey, $aField);
        return preg_replace ('/<th(.*?)>(.*?)<\/th>/', '<th$1><img src="' . BxDolTemplate::getInstance()->getImageUrl('acl-standard.png') . '"></th>', $s);
    }

    /**
     * custom behavior for 'custom1' action
     */
    protected function _getActionCustom1 ($sType, $sKey, $a, $isSmall = false)
    {
        $sAttr = $this->_convertAttrs(
            $a, 'attr',
            'bx-btn bx-def-margin-sec-left' . ($isSmall ? ' bx-btn-small' : '') // add default classes
        );
        return '<button ' . $sAttr . ' onclick="$(this).off(); alert(\'default behaviour is overrided, so the action is not performed\');">' . $a['title'] . '</button>';
    }
}

/** @} */
