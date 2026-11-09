<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Payment Payment
 * @ingroup     UnaModules
 *
 * @{
 */

class BxPaymentDb extends BxBaseModPaymentDb
{
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }

    public function getModulesWithPayments()
    {
    	$sQuery = $this->prepare("SELECT `name` FROM `" . $this->_sPrefix . "modules`");
        return $this->getColumn($sQuery);
    }

    /**
     * Payment details methods
     */
    public function getForm($sPaymentProvider = '')
    {
        $sWhereClause = '';

        if(!empty($sPaymentProvider))
            $sWhereClause .= $this->prepareAsString(" AND `tp`.`name`=?", $sPaymentProvider);
        
        $sQuery = "SELECT
                `tp`.`id` AS `provider_id`,
                `tp`.`name` AS `provider_name`,
                `tp`.`caption` AS `provider_caption`,
                `tp`.`description` AS `provider_description`,
                `tp`.`option_prefix` AS `provider_option_prefix`,
                `tp`.`for_owner_only` AS `provider_for_owner_only`,
                `tp`.`single_seller` AS `provider_single_seller`,
                `tpo`.`id` AS `id`,
                `tpo`.`name` AS `name`,
                `tpo`.`type` AS `type`,
                `tpo`.`value` AS `value`,
                `tpo`.`caption` AS `caption`,
                `tpo`.`description` AS `description`,
                `tpo`.`extra` AS `extra`,
                `tpo`.`check_type` AS `check_type`,
                `tpo`.`check_params` AS `check_params`,
                `tpo`.`check_error` AS `check_error`,
                `tpo`.`extended` AS `extended`
            FROM `" . $this->_sPrefix . "providers` AS `tp`
            LEFT JOIN `" . $this->_sPrefix . "providers_options` AS `tpo` ON `tp`.`id`=`tpo`.`provider_id`
            WHERE `tp`.`active`='1'" . $sWhereClause . "
            ORDER BY `tp`.`order` ASC, `tpo`.`order` ASC";

        return $this->getAll($sQuery);
    }

    public function getProviders($aParams = array())
    {
    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

        $sWhereClause = $sOrderClause = "";
        if(!empty($aParams['type']))
            switch($aParams['type']) {
                case 'by_name':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = array(
                        'name' => $aParams['name']
                    );

                    $sWhereClause = " AND `tp`.`name`=:name";
                    break;

                case 'for_single':
                    $aMethod['name'] = 'getAllWithKey';
                    $aMethod['params'][1] = 'name';

                    $sWhereClause = " AND `tp`.`for_single`='1'";
                    if(!empty($aParams['active'])) 
                        $sWhereClause .= " AND `tp`.`active`='1'";

                    if(isset($aParams['order']) && $aParams['order'] === true)
                        $sOrderClause = "`tp`.`order` ASC";
                    break;

                case 'for_recurring':
                    $aMethod['name'] = 'getAllWithKey';
                    $aMethod['params'][1] = 'name';

                    $sWhereClause = " AND `tp`.`for_recurring`='1'";
                    if(!empty($aParams['active'])) 
                        $sWhereClause .= " AND `tp`.`active`='1'";

                    if(isset($aParams['order']) && $aParams['order'] === true)
                        $sOrderClause = "`tp`.`order` ASC";
                    break;

                case 'all':
                    $aMethod['name'] = 'getAllWithKey';
                    $aMethod['params'][1] = 'name';

                    if(!empty($aParams['active'])) 
                        $sWhereClause = " AND `tp`.`active`='1'";

                    if(isset($aParams['order']) && $aParams['order'] === true)
                        $sOrderClause = "`tp`.`order` ASC";
                    break;
            }

        if(!empty($sOrderClause))
            $sOrderClause = " ORDER BY " . $sOrderClause;
                
        $aMethod['params'][0] = "SELECT
                `tp`.`id` AS `id`,
                `tp`.`name` AS `name`,
                `tp`.`caption` AS `caption`,
                `tp`.`description` AS `description`,
                `tp`.`option_prefix` AS `option_prefix`,
                `tp`.`for_visitor` AS `for_visitor`,
                `tp`.`for_single` AS `for_single`,
                `tp`.`for_recurring` AS `for_recurring`,
                `tp`.`class_name` AS `class_name`,
                `tp`.`class_file` AS `class_file`
            FROM `" . $this->_sPrefix . "providers` AS `tp`
            WHERE 1" . $sWhereClause . $sOrderClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function getOption($aParams)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

        $sSelectClause = "`tpo`.*";
        $sJoinClause = $sWhereClause = "";
        if(!empty($aParams['type']))
	        switch($aParams['type']) {
                    case 'by_pid_and_name':
                        $aMethod['name'] = 'getRow';
                        $aMethod['params'][1] = array(
                            'provider_id' => $aParams['provider_id'],
                            'name' => $aParams['name'],
                        );

                        $sWhereClause = " AND `tpo`.`provider_id`=:provider_id AND `tpo`.`name`=:name";
                        break;
                }

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $this->_sPrefix . "providers_options` AS `tpo` " . $sJoinClause . " WHERE 1" . $sWhereClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function getOptions($iUserId = BX_PAYMENT_EMPTY_ID, $iProviderId = 0)
    {
        $aBinding = [
            'user_id' => $iUserId
        ];

        if($iUserId == BX_PAYMENT_EMPTY_ID && empty($iProviderId))
           return $this->getAll("SELECT `id`, `name`, `type` FROM `" . $this->_sPrefix . "providers_options`");

        $sWhereAddon = "";
        if(!empty($iProviderId)) {
            $aBinding['provider_id'] = $iProviderId;

            $sWhereAddon = " AND `tpo`.`provider_id`=:provider_id";
        }

        $sQuery = "SELECT
               `tpo`.`name` AS `name`,
               `tuv`.`value` AS `value`
            FROM `" . $this->_sPrefix . "providers_options` AS `tpo`
            LEFT JOIN `" . $this->_sPrefix . "user_values` AS `tuv` ON `tpo`.`id`=`tuv`.`option_id`
            WHERE 1" . $sWhereAddon . " AND `tuv`.`user_id`=:user_id ORDER BY `tpo`.`order`";

        return $this->getAllWithKey($sQuery, 'name', $aBinding);
    }

    public function getOptionsByProvider($mixedProvider)
    {
        $aBindings = [
            'provider' => $mixedProvider
        ];

        $sJoinClause = $sWhereClause = '';
        if(!is_numeric($mixedProvider)) {
            $sJoinClause = " LEFT JOIN `" . $this->_sPrefix . "providers` AS `tp` ON `tpo`.`provider_id`=`tp`.`id`";
            $sWhereClause = " AND `tp`.`name`=:provider";
        }
        else
            $sWhereClause = " AND `tpo`.`provider_id`=:provider";

        return $this->getAll("SELECT `tpo`.`id`, `tpo`.`name`, `tpo`.`type` FROM `" . $this->_sPrefix . "providers_options` AS `tpo`" . $sJoinClause . " WHERE 1" . $sWhereClause, $aBindings);
    }

    public function updateOption($iUserId, $iOptionId, $sValue)
    {
        $sQuery = $this->prepare("REPLACE INTO `" . $this->_sPrefix . "user_values` SET `user_id`=?, `option_id`=?, `value`=?", $iUserId, $iOptionId, $sValue);
        return $this->query($sQuery);
    }

    public function getCurrencyExchangeRate($sCode)
    {
        return $this->getOne("SELECT `rate` FROM `" . $this->_sPrefix . "currencies` WHERE `code`=:code LIMIT 1", [
            'code' => $sCode
        ]);
    }

    public function updateCurrencyExchangeRate($sCode, $fRate)
    {
        return $this->query("INSERT INTO `" . $this->_sPrefix . "currencies`(`code`, `rate`) VALUES(:code, :rate) ON DUPLICATE KEY UPDATE `rate`=:rate", [
            'code' => $sCode,
            'rate' => $fRate
        ]);
    }

    public function deleteCurrencyExchangeRate($sCode)
    {
        return $this->query("DELETE FROM `" . $this->_sPrefix . "currencies` WHERE `code`=:code", [
            'code' => $sCode
        ]) !== false;
    }

    /**
     * Shopping cart methods.
     */
    public function getCartItems($iId)
    {
    	$sQuery = $this->prepare("SELECT `items` FROM `" . $this->_sPrefix . "cart` WHERE `client_id`=? LIMIT 1", $iId);
        return $this->getOne($sQuery);
    }

    public function getCartContent($iId)
    {
        $aCart = $this->getRow("SELECT * FROM `" . $this->_sPrefix . "cart` WHERE `client_id`=:client_id LIMIT 1", [
            'client_id' => $iId
        ]);

        if(empty($aCart) || !is_array($aCart))
            $aCart = ['items' => '', 'customs' => []];

        if(!empty($aCart['customs']))
            $aCart['customs'] = is_string($aCart['customs']) ? $this->_oConfig->s2a($aCart['customs'], false) : $aCart['customs'];
        else 
            $aCart['customs'] = [];

        return $aCart;
    }

    public function setCartItems($iId, $sItems, $aCustoms = array())
    {
        $sItems = trim($sItems, ":");
        if(empty($sItems))
            return $this->query("DELETE FROM `" . $this->_sPrefix . "cart` WHERE `client_id`=:client_id LIMIT 1", array(
                'client_id' => $iId
            ));

        return $this->query("REPLACE INTO `" . $this->_sPrefix . "cart` SET `client_id`=:client_id, `items`=:items, `customs`=:customs", array(
            'client_id' => $iId,
            'items' => $sItems,
            'customs' => !empty($aCustoms) && is_array($aCustoms) ? $this->_oConfig->a2s($aCustoms, false) : ''
        ));
    }

    public function getVendorInfoProvidersSingle($iVendorId, $bActiveOnly = false)
    {
        $aParams = ['type' => 'for_single', 'order' => true];
        if($bActiveOnly)
            $aParams['active'] = true;
        
    	return $this->getVendorInfoProviders($iVendorId, $aParams);
    }

    public function getVendorInfoProvidersRecurring($iVendorId, $bActiveOnly = false)
    {
        $aParams = ['type' => 'for_recurring', 'order' => true];
        if($bActiveOnly)
            $aParams['active'] = true;
        
    	return $this->getVendorInfoProviders($iVendorId, $aParams);
    }

    public function getVendorInfoProviders($iVendorId, $aParams = [])
    {
        if(empty($aParams))
            $aParams = ['type' => 'all', 'order' => true];

        $aProviders = $this->getProviders($aParams);
        $aOptions = $this->getOptions($iVendorId);

        $aResult = [];
        foreach($aProviders as $sProvider => $aProvider) {
            if(!isset($aOptions[$aProvider['option_prefix'] . 'active']) || !in_array($aOptions[$aProvider['option_prefix'] . 'active']['value'], ['on', 1]))
                continue;

            if(isset($aOptions[$aProvider['option_prefix'] . 'hidden']) && in_array($aOptions[$aProvider['option_prefix'] . 'hidden']['value'], ['on', 1]))
                continue;

            foreach($aOptions as $sName => $aOption)
                if(strpos($sName, $aProvider['option_prefix']) !== false)
                    $aProvider['options'][$sName] = $aOption;

            $aResult[$sProvider] = $aProvider;
        }

        return $aResult;
    }

    public function getAdminsIds()
    {
        $sQuery = "SELECT 
        		`tp`.`id` AS `id`,
        		`tp`.`type` AS `type`  
        	FROM `sys_profiles` AS `tp` 
        	INNER JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` AND `ta`.`role`&" . BX_DOL_ROLE_ADMIN . " 
        	WHERE 
        		`tp`.`type`<>'system' AND `tp`.`status`='active' 
        	ORDER BY `tp`.`id` ASC";

        $aAdmins = $this->getAllWithKey($sQuery, 'id');
        foreach($aAdmins as $iId => $aAdmin)
            if(!BxDolService::call($aAdmin['type'], 'act_as_profile'))
                unset($aAdmins[$iId]);

        return array_keys($aAdmins);
    }


	/*
     * Pending Orders methods
     */
    public function getOrderPending($aParams)
    {
    	$aMethod = array('name' => 'getRow', 'params' => array(0 => 'query'));

    	$sWhereClause = $sLimitClause = '';
        switch($aParams['type']) {
            case 'id':
            	$aMethod['params'][1] = array(
                	'id' => $aParams['id']
                );

                $sWhereClause = " AND `id`=:id";
                $sLimitClause = " LIMIT 1";
                break;

            case 'order':
            	$aMethod['params'][1] = array(
                	'order' => $aParams['order']
                );

            	$sWhereClause = " AND `order`=:order";
                $sLimitClause = " LIMIT 1";
                break;

            case 'mixed':
                $aMethod['name'] = 'getAll';

                $sWhereClause = ' AND ' . $this->arrayToSQL($aParams['conditions'], ' AND ');
                break;
        }

        $aMethod['params'][0] = "SELECT * FROM `" . $this->_sPrefix . "transactions_pending` WHERE 1 " . $sWhereClause . $sLimitClause;
        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function insertOrderPending($iClientId, $sType, $sProvider, $aCartInfo, $aCustom = [])
    {
        $sItems = "";
        foreach($aCartInfo['items'] as $aItem) {
            $sItems .= $this->_oConfig->descriptorA2S(array($aItem['author_id'], $aItem['module_id'], $aItem['id'], $aItem['quantity'])) . ':';

            if(empty($aItem['addons']) || !is_array($aItem['addons']))
                continue;

            foreach($aItem['addons'] as $sAddon => $aAddon)
                $sItems .= $this->_oConfig->descriptorA2S(array($aAddon['author_id'], $aAddon['module_id'], $aAddon['id'], $aAddon['quantity'])) . ':';
        }

        $sCurrency = $aCartInfo['vendor_currency_code'];
        $sCurrencyDefault = $this->_oConfig->getDefaultCurrencyCode();

        $aData = ['cur_def' => $sCurrencyDefault];
        if(strcmp($sCurrency, $sCurrencyDefault) != 0)
            $aData['cur_rate'] = $this->getCurrencyExchangeRate($sCurrency);

        $aSet = [
            'client_id' => $iClientId,
            'seller_id' => $aCartInfo['vendor_id'],
            'type' => $sType, 
            'provider' => $sProvider,
            'items' => trim($sItems, ':'),
            'customs' => !empty($aCustom) && is_array($aCustom) ? $this->_oConfig->a2s($aCustom, false) : '',
            'amount' => $aCartInfo['items_price'],
            'currency' => $sCurrency,
            'data' => !empty($aData) ? serialize($aData) : ''
        ];

        return (int)$this->query("INSERT INTO `" . $this->_sPrefix . "transactions_pending` SET " . $this->arrayToSQL($aSet) . ", `date`=UNIX_TIMESTAMP()") > 0 ? $this->lastId() : 0;
    }

    public function updateOrderPending($iId, $aValues)
    {
        $sQuery = $this->prepare("UPDATE `" . $this->_sPrefix . "transactions_pending` SET " . $this->arrayToSQL($aValues) . " WHERE `id`=?", $iId);
        return (int)$this->query($sQuery) > 0;
    }

    public function deleteOrderPending($mixedId)
    {
    	if(!is_array($mixedId))
    		$mixedId = array($mixedId);

        return (int)$this->query("DELETE FROM `" . $this->_sPrefix . "transactions_pending` WHERE `id` IN (" . $this->implode_escape($mixedId) . ")") > 0;
    }

    /*
     * Processed Orders
     */
    public function getOrderProcessed($aParams)
    {
    	$aMethod = array('name' => 'getRow', 'params' => array(0 => 'query'));

        $sSelectClause = "`tt`.`id`, `tt`.`license`, `ttp`.`type`, `tt`.`client_id`, `tt`.`seller_id`, `tt`.`author_id`, `tt`.`module_id`, `tt`.`item_id`, `tt`.`item_count`, `tt`.`amount`, `tt`.`date`, `ttp`.`order`, `ttp`.`error_msg`, `ttp`.`provider`";
        $sWhereClause = $sGroupClause = "";

        switch($aParams['type']) {
            case 'id':
            	$aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sWhereClause = " AND `tt`.`id`=:id";
                break;

            case 'new':
                $aMethod['name'] = 'getAll';
                $aMethod['params'][1] = array(
                    'seller_id' => $aParams['seller_id']
                );

                $sWhereClause = " AND `tt`.`seller_id`=:seller_id AND `tt`.`new`='1'";
                break;

            case 'pending_id':
                if(empty($aParams['with_key'])) {
                    $aMethod['name'] = 'getAll';
                    $aMethod['params'][1] = array(
                        'pending_id' => $aParams['pending_id']
                    );
                }
                else {
                    $aMethod['name'] = 'getAllWithKey';
                    $aMethod['params'][1] = $aParams['with_key'];
                    $aMethod['params'][2] = array(
                        'pending_id' => $aParams['pending_id']
                    );
                }

                $sWhereClause = " AND `tt`.`pending_id`=:pending_id";
                break;

            case 'clients':
                $aMethod['name'] = 'getColumn';
                $aMethod['params'][1] = array(
                    'seller_id' => $aParams['seller_id']
                );

                $sSelectClause = "DISTINCT `tt`.`client_id`";
                $sWhereClause = " AND `tt`.`seller_id`=:seller_id";
                break;

            case 'authors':
                $aMethod['name'] = 'getColumn';
                $aMethod['params'][1] = array(
                    'seller_id' => $aParams['seller_id']
                );

                $sSelectClause = "DISTINCT `tt`.`author_id`";
                $sWhereClause = " AND `tt`.`seller_id`=:seller_id";
                break;

            case 'license':
                $aMethod['name'] = 'getAll';
                $aMethod['params'][1] = array(
                    'license' => $aParams['license']
                );

                $sWhereClause = " AND `tt`.`license`=:license";
                break;
            
            case 'income':
                $aMethod['name'] = 'getAll';
                $aMethod['params'][1] = array(
                    'period_start' => $aParams['period_start'],
                    'period_end' => $aParams['period_end']
                );

                $sSelectClause = '`tt`.`author_id` AS `id`, SUM(`tt`.`amount`) AS `amount`';
                $sWhereClause = ' AND `tt`.`date`>=:period_start AND `tt`.`date`<=:period_end';
                $sGroupClause = '`tt`.`author_id`';
                break;

            case 'mixed':
                $aMethod['name'] = 'getAll';

                $sWhereClause = ' AND ' . $this->arrayToSQL($aParams['conditions'], ' AND ');
                break;

        }

        if(!empty($sGroupClause))
            $sGroupClause = ' GROUP BY ' . $sGroupClause;

        $aMethod['params'][0] = "SELECT
                " . $sSelectClause . "
            FROM `" . $this->_sPrefix . "transactions` AS `tt`
            LEFT JOIN `" . $this->_sPrefix . "transactions_pending` AS `ttp` ON `tt`.`pending_id`=`ttp`.`id`
            WHERE 1" . $sWhereClause . $sGroupClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function insertOrderProcessed($aValues)
    {
        return $this->query("INSERT INTO `" . $this->_sPrefix . "transactions` SET " . $this->arrayToSQL($aValues) . ", `date`=UNIX_TIMESTAMP()");
    }

    public function updateOrderProcessed($iId, $aValues)
    {        
        return $this->updateOrdersProcessed($aValues, array('id' => $iId));
    }

    public function updateOrdersProcessed($aValues, $aWhere)
    {
        if(empty($aValues) || !is_array($aValues) || empty($aWhere) || !is_array($aWhere))
            return false;

        return (int)$this->query("UPDATE `" . $this->_sPrefix . "transactions` SET " . $this->arrayToSQL($aValues) . " WHERE " . $this->arrayToSQL($aWhere, ' AND ')) > 0;
    }

    public function deleteOrderProcessed($mixedId)
    {
    	if(!is_array($mixedId))
            $mixedId = array($mixedId);

        return (int)$this->query("DELETE FROM `" . $this->_sPrefix . "transactions` WHERE `id` IN (" . $this->implode_escape($mixedId) . ")") > 0;
    }

    public function getOrderHistory($aParams)
    {
        return $this->getOrderProcessed($aParams);
    }

    /**
     * Processed transactions with their order, a page at a time by transaction id: for
     * reading the whole history in steps (analytics imports past payments this way).
     */
    public function getTransactionsAfter($iAfterId, $iLimit)
    {
        return $this->getAll("SELECT `tt`.`id`, `tt`.`pending_id`, `tt`.`client_id`, `tt`.`seller_id`, `tt`.`author_id`, `tt`.`module_id`, `tt`.`item_id`, `tt`.`item_count`, `tt`.`amount`, `tt`.`currency`, `tt`.`date`, `ttp`.`type`, `ttp`.`provider`, `ttp`.`order`, `ttp`.`currency` AS `pending_currency`, `ttp`.`amount` AS `pending_amount`, `ttp`.`data`
            FROM `" . $this->_sPrefix . "transactions` AS `tt`
            LEFT JOIN `" . $this->_sPrefix . "transactions_pending` AS `ttp` ON `tt`.`pending_id`=`ttp`.`id`
            WHERE `tt`.`id` > :after
            ORDER BY `tt`.`id` ASC
            LIMIT " . max(1, min(5000, (int)$iLimit)), [
            'after' => (int)$iAfterId
        ]);
    }

    /**
     * Subscriptions, active or deleted, with their order, a page at a time by pending order id.
     */
    public function getSubscriptionsAfter($iAfterPendingId, $iLimit, $bDeleted = false)
    {
        $sSelectClause = "`ts`.`pending_id`, `ts`.`subscription_id`, `ts`.`period`, `ts`.`period_unit`, `ts`.`trial`, `ts`.`date_add`, `ts`.`date_next`, `ts`.`status`, `ttp`.`client_id`, `ttp`.`seller_id`, `ttp`.`type`, `ttp`.`provider`, `ttp`.`items`, `ttp`.`amount`, `ttp`.`currency`, `ttp`.`order`, `ttp`.`data`";
        if($bDeleted)
            $sSelectClause .= ", `ts`.`reason`, `ts`.`deleted`";

        return $this->getAll("SELECT " . $sSelectClause . "
            FROM `" . $this->_sPrefix . "subscriptions" . ($bDeleted ? "_deleted" : "") . "` AS `ts`
            LEFT JOIN `" . $this->_sPrefix . "transactions_pending` AS `ttp` ON `ts`.`pending_id`=`ttp`.`id`
            WHERE `ts`.`pending_id` > :after
            ORDER BY `ts`.`pending_id` ASC
            LIMIT " . max(1, min(5000, (int)$iLimit)), [
            'after' => (int)$iAfterPendingId
        ]);
    }

    /*
     * Subscriptions methods
     */
    public function getOrderSubscription($aParams)
    {
        $aResult = $this->getOrderPending($aParams);

        if(($iPendingId = $aParams['id'] ?? 0)) {
            $aSubscription = $this->getSubscription(['type' => 'pending_id', 'pending_id' => $iPendingId]);
            if(!$aSubscription || !is_array($aSubscription))
                $aSubscription = $this->getSubscription(['type' => 'pending_id', 'pending_id' => $iPendingId, 'from_deleted' => true]);

            if($aSubscription && is_array($aSubscription))
                $aResult = array_merge($aResult, [
                    'customer_id' => $aSubscription['customer_id'],
                    'deleted' => $aSubscription['deleted'] ?? false,
                    'deleted_reason' => $aSubscription['reason'] ?? '',
                ]);
        }

        return $aResult;
    }

    public function getSubscription($aParams)
    {
    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

        $sTable = $this->_sPrefix . 'subscriptions';
        if(($sK = 'from_deleted') && isset($aParams[$sK]) && $aParams[$sK])
            $sTable .= '_deleted';

        $sSelectClause = "`ts`.*";
    	$sJoinClause = $sWhereClause = $sLimitClause = '';
        switch($aParams['type']) {
            case 'pending_id':
                $aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = array(
                    'pending_id' => $aParams['pending_id']
                );

                $sWhereClause = " AND `ts`.`pending_id`=:pending_id";
                $sLimitClause = " LIMIT 1";
                break;

            case 'mixed':
                $sWhereClause = " AND " . $this->arrayToSQL($aParams['conditions'], ' AND ');
                break;

            case 'mixed_ext':
                $sSelectClause .= ", `ttp`.`client_id`, `ttp`.`seller_id`, `ttp`.`type`, `ttp`.`provider`, `ttp`.`order`";
                $sJoinClause = "LEFT JOIN `" . $this->_sPrefix . "transactions_pending` AS `ttp` ON `ts`.`pending_id`=`ttp`.`id`";
                $sWhereClause = " AND " . $this->arrayToSQL($aParams['conditions'], ' AND ');
                break;

            case 'time_tracker':
                $aMethod['params'][1] = array(
                    'status_active' => $aParams['status_active'],
                    'status_trial' => $aParams['status_trial'],
                    'status_unpaid' => $aParams['status_unpaid'],
                    'pay_attempts_max' => $aParams['pay_attempts_max'],
                    'pay_attempts_interval' => $aParams['pay_attempts_interval']
                );

                $sSelectClause .= ", `ttp`.`client_id`, `ttp`.`seller_id`, `ttp`.`type`, `ttp`.`provider`, `ttp`.`amount`, `ttp`.`order`";
                $sJoinClause = "LEFT JOIN `" . $this->_sPrefix . "transactions_pending` AS `ttp` ON `ts`.`pending_id`=`ttp`.`id` INNER JOIN `" . $this->_sPrefix . "providers` AS `tp` ON `ttp`.`provider`=`tp`.`name` AND `tp`.`time_tracker`='1'";
                $sWhereClause = " AND `ts`.`date_next`<>0 AND `ts`.`date_next`<=UNIX_TIMESTAMP() AND (`ts`.`status`=:status_active OR `ts`.`status`=:status_trial OR (`ts`.`status`=:status_unpaid AND `ts`.`pay_attempts`<:pay_attempts_max AND DATE_ADD(FROM_UNIXTIME(`ts`.`date_next`), INTERVAL `ts`.`pay_attempts`*:pay_attempts_interval SECOND)<=NOW()))";
                break;
        }

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $sTable . "` AS `ts` " . $sJoinClause . " WHERE 1 " . $sWhereClause . $sLimitClause;
        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function isSubscriptionByPending($iPending)
    {
    	$aSubscription = $this->getSubscription(array(
            'type' => 'pending_id', 
            'pending_id' => $iPending
    	));

    	return !empty($aSubscription) && is_array($aSubscription);
    }

    public function insertSubscription($aValues)
    {
        if(empty($aValues) || !is_array($aValues))
            return false;

        $sSetClause = $this->arrayToSQL($aValues);
        if(empty($aValues['date_add']))
            $sSetClause .= ", `date_add`=UNIX_TIMESTAMP()";

        return (int)$this->query("INSERT INTO `" . $this->_sPrefix . "subscriptions` SET " . $sSetClause) > 0;
    }

    public function updateSubscription($aValues, $aWhere)
    {
        if(empty($aValues) || !is_array($aValues) || empty($aWhere) || !is_array($aWhere))
            return false;

        return (int)$this->query("UPDATE `" . $this->_sPrefix . "subscriptions` SET " . $this->arrayToSQL($aValues) . " WHERE " . $this->arrayToSQL($aWhere, ' AND ')) > 0;
    }

    public function deleteSubscription($mixedId, $sReason)
    {
    	if(!is_array($mixedId))
            $mixedId = array($mixedId);

        //--- Move to deleted subscriptions table.   
    	$sQuery = "INSERT IGNORE INTO `" . $this->_sPrefix . "subscriptions_deleted` SELECT *, :reason AS `reason`, UNIX_TIMESTAMP() AS `deleted` FROM `" . $this->_sPrefix . "subscriptions` WHERE `id` IN (" . $this->implode_escape($mixedId) . ")";
        $this->query($sQuery, array(
            'reason' => $sReason
        ));

        return (int)$this->query("DELETE FROM `" . $this->_sPrefix . "subscriptions` WHERE `id` IN (" . $this->implode_escape($mixedId) . ")") > 0;
    }

    //--- Order Administration ---//
    public function onProfileDelete($iId)
    {
    	$sQuery = $this->prepare("DELETE FROM `" . $this->_sPrefix . "cart` WHERE `client_id`=?", $iId);
    	$this->query($sQuery);

    	$sQuery = $this->prepare("DELETE FROM `" . $this->_sPrefix . "user_values` WHERE `user_id`=?", $iId);
    	$this->query($sQuery);
    }


    /*
     * Commissions methods
     */
    public function getCommissions($aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

        $sSelectClause = "`tc`.*";
        $sWhereClause = $sOrderClause = "";
        if(!empty($aParams['type']))
            switch($aParams['type']) {
                case 'max_order':
                    $aMethod['name'] = 'getOne';
                    $aMethod['params'][1] = array();

                    $sSelectClause = "IFNULL(MAX(`tc`.`order`), 0)";
                    break;

                case 'id':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = array(
                        'id' => $aParams['id']
                    );

                    $sWhereClause = " AND `tc`.`id`=:id";
                    break;

                case 'acl_id':
                    $aMethod['name'] = 'getAll';
                    $aMethod['params'][1] = array(
                        'acl_id' => $aParams['acl_id']
                    );

                    $sWhereClause = " AND (`tc`.`acl_id`=:acl_id OR `tc`.`acl_id`=0)";
                    $sOrderClause = "`tc`.`order` ASC";
                    break;

                case 'all':
                    if(!empty($aParams['active'])) 
                        $sWhereClause = " AND `tc`.`active`='1'";
                    break;
            }

        if(!empty($sOrderClause))
            $sOrderClause = " ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT " . $sSelectClause . "
            FROM `" . $CNF['TABLE_COMMISSIONS'] . "` AS `tc`
            WHERE 1" . $sWhereClause . $sOrderClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function getInvoices($aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

        $sSelectClause = "`ti`.*";
        $sWhereClause = "";
        if(!empty($aParams['type']))
            switch($aParams['type']) {
                case 'index':
                    $aMethod['name'] = 'getOne';
                    $aMethod['params'][1] = array(
                        'commissionaire_id' => $aParams['commissionaire_id'],
                        'committent_id' => $aParams['committent_id'],
                    );

                    $sSelectClause = "COUNT(`ti`.`id`) + 1";
                    $sWhereClause = " AND `ti`.`commissionaire_id`=:commissionaire_id AND `ti`.`committent_id`=:committent_id";
                    break;

                case 'id':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = array(
                        'id' => $aParams['id']
                    );

                    $sWhereClause = " AND `ti`.`id`=:id";
                    break;

                case 'commissionaire_id':
                    $aMethod['params'][1] = array(
                        'commissionaire_id' => $aParams['commissionaire_id']
                    );

                    $sWhereClause = " AND `ti`.`commissionaire_id`=:commissionaire_id";
                    break;

                case 'committent_id':
                    $aMethod['params'][1] = array(
                        'committent_id' => $aParams['committent_id']
                    );

                    $sWhereClause = " AND `ti`.`committent_id`=:committent_id";

                    if(!empty($aParams['period_start'])) {
                        $aMethod['params'][1]['period_start'] = (int)$aParams['period_start'];

                        $sWhereClause .= " AND `ti`.`period_start`=:period_start";
                    }

                    if(!empty($aParams['period_end'])) {
                        $aMethod['params'][1]['period_end'] = (int)$aParams['period_end'];

                        $sWhereClause .= " AND `ti`.`period_end`=:period_end";
                    }
                    break;

                case 'expiring':
                    $aMethod['params'][1] = array(
                        'notify_days' => $this->_oConfig->getInvoiceExpirationNotify(),
                        'status' => BX_PAYMENT_INV_STATUS_UNPAID
                    );

                    $sWhereClause = " AND DATE_SUB(FROM_UNIXTIME(`ti`.`date_due`), INTERVAL :notify_days DAY) < NOW() AND DATE_SUB(FROM_UNIXTIME(`ti`.`date_due`), INTERVAL (:notify_days - 1) DAY) > NOW() AND `ti`.`status`=:status";
                    break;

                case 'overdue':
                    $aMethod['params'][1] = array(
                        'status_unpaid' => BX_PAYMENT_INV_STATUS_UNPAID,
                        'status_overdue' => BX_PAYMENT_INV_STATUS_OVERDUE
                    );

                    $sWhereClause = " AND `ti`.`date_due` < UNIX_TIMESTAMP() AND (`ti`.`status`=:status_unpaid OR (`ti`.`status`=:status_overdue AND `ti`.`ntf_due`='0'))";
                    break;

                case 'status':
                    $aMethod['params'][1] = array(
                        'status' => $aParams['status']
                    );

                    $sWhereClause = " AND `ti`.`status`=:status";
                    
                    if(isset($aParams['count']) && $aParams['count'] === true) {
                        $sSelectClause = "COUNT(`ti`.`id`)";
                        $aMethod['name'] = 'getOne';
                    }

                    if(isset($aParams['committent_id'])) {
                        $aMethod['params'][1]['committent_id'] = $aParams['committent_id'];

                        $sWhereClause .= " AND `ti`.`committent_id`=:committent_id";
                    }
                    break;

                case 'all_count':
                    $sSelectClause = "COUNT(`ti`.`id`)";
                    $aMethod['name'] = 'getOne';
                    break;
                
                case 'all':
                    break;
            }

        $aMethod['params'][0] = "SELECT " . $sSelectClause . "
            FROM `" . $CNF['TABLE_INVOICES'] . "` AS `ti`
            WHERE 1" . $sWhereClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    /**
     * Analytics: commission invoices issued in a period (`to` exclusive) by status and currency.
     */
    public function getAnalyticsInvoices($iFrom, $iTo)
    {
        return $this->getAll("SELECT `status`, `currency`, COUNT(*) AS `count`, SUM(`amount`) AS `amount` FROM `" . $this->_oConfig->CNF['TABLE_INVOICES'] . "` WHERE `date_issue` >= :from AND `date_issue` < :to GROUP BY `status`, `currency`", [
            'from' => (int)$iFrom,
            'to' => (int)$iTo
        ]);
    }

    public function insertInvoice($aValues)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->query("INSERT INTO `" . $CNF['TABLE_INVOICES'] . "` SET " . $this->arrayToSQL($aValues));
    }

    public function updateInvoice($mixedId, $aValues)
    {
        $CNF = &$this->_oConfig->CNF;
        
        if(!is_array($mixedId))
            $mixedId = array($mixedId);

        return (int)$this->query("UPDATE `" . $CNF['TABLE_INVOICES'] . "` SET " . $this->arrayToSQL($aValues) . " WHERE `id` IN (" . $this->implode_escape($mixedId) . ')') > 0;
    }

    public function deleteInvoice($mixedId)
    {
        $CNF = &$this->_oConfig->CNF;

    	if(!is_array($mixedId))
            $mixedId = array($mixedId);

        return (int)$this->query("DELETE FROM `" . $CNF['TABLE_INVOICES'] . "` WHERE `id` IN (" . $this->implode_escape($mixedId) . ")") > 0;
    }
    
    /**
     * For Stripe integration only
     */
    public function getStrpPaymentPending($sSubscriptionId)
    {
        $aResult = $this->getRow("SELECT * FROM `" . $this->_sPrefix . "stripe_payments_pending` WHERE `subscription_id`=:subscription_id", [
            'subscription_id' => $sSubscriptionId
        ]);

        if(!empty($aResult) && is_array($aResult))
            $this->deleteStrpPaymentPending($sSubscriptionId);

        return $aResult;
    }

    public function insertStrpPaymentPending($sSubscriptionId, $fAmount, $sCurrency)
    {
        return $this->query("INSERT IGNORE INTO `" . $this->_sPrefix . "stripe_payments_pending` SET " . $this->arrayToSQL([
            'subscription_id' => $sSubscriptionId,
            'amount' => $fAmount,
            'currency' => $sCurrency
        ])) !== false;
    }

    public function deleteStrpPaymentPending($sSubscriptionId)
    {
        return $this->query("DELETE FROM `" . $this->_sPrefix . "stripe_payments_pending` WHERE `subscription_id`=:subscription_id", [
            'subscription_id' => $sSubscriptionId
        ]) !== false;
    }
}

/** @} */
