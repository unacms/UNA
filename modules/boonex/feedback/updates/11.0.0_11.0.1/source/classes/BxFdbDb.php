<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Feedback Feedback
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module database queries
 */
class BxFdbDb extends BxBaseModGeneralDb
{
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }

    public function getQuestions($aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sWhereClause = $sOrderByClause = $sLimitClause = "";

        $sSelectClause = "`tq`.*";
        switch($aParams['type']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sWhereClause .= " AND `tq`.`id`=:id";
                break;
            
            case 'actual':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'status' => 'active'
                );
                
                $sWhereClause .= " AND `tq`.`status_admin`=:status";
                $sOrderByClause = "`tq`.`added` DESC";
                break;

            case 'all':
            	break;
        }

        if(!empty($aParams['order_by']))
            $sOrderByClause = '`' . $aParams['order_by'] . '` ' . (isset($aParams['order_way']) ? strtoupper($aParams['order_way']) : 'ASC');

        $sOrderByClause = !empty($sOrderByClause) ? " ORDER BY " . $sOrderByClause : $sOrderByClause;
        $sLimitClause = !empty($sLimitClause) ? " LIMIT " . $sLimitClause : $sLimitClause;
        
        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $CNF['TABLE_QUESTIONS'] . "` AS `tq` WHERE 1 " . $sWhereClause . $sOrderByClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function insertQuestion($aParamsSet)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParamsSet))
            return false;

        $sSql = "INSERT INTO `" . $CNF['TABLE_QUESTIONS'] . "` SET " . $this->arrayToSQL($aParamsSet);
        return $this->query($sSql);
    }

    public function updateQuestion($aParamsSet, $aParamsWhere)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParamsSet) || empty($aParamsWhere))
            return false;

        $sSql = "UPDATE `" . $CNF['TABLE_QUESTIONS'] . "` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $this->arrayToSQL($aParamsWhere, " AND ");
        return $this->query($sSql);
    }

    public function deleteQuestion($aParams)
    {
        $CNF = &$this->_oConfig->CNF;

        $sSql = "DELETE FROM `" . $CNF['TABLE_QUESTIONS'] . "` WHERE " . $this->arrayToSQL($aParams, " AND ");
        return $this->query($sSql);
    }

    public function getAnswers($aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

        $sSelectClause = "`ta`.*";
        $sJoinClause = $sWhereClause = $sOrderByClause = "";

        switch($aParams['type']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sWhereClause .= " AND `ta`.`id`=:id";
                break;

            case 'id_for_profile':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['id'],
                    'profile_id' => $aParams['profile_id'],
                );

                $sSelectClause .= ", `tau`.`text` AS `text`, `tau`.`added` AS `added`";
                $sJoinClause = " INNER JOIN `" . $CNF['TABLE_ANSWERS2USERS'] . "` AS `tau` ON `ta`.`id`=`tau`.`answer_id` AND `tau`.`profile_id`=:profile_id";
                $sWhereClause .= " AND `ta`.`id`=:id";
                break;

            case 'ids':
                $aMethod['name'] = 'getAllWithKey';
                $aMethod['params'][1] = 'id';
                
                $sWhereClause .= " AND `ta`.`id` IN (" . $this->implode_escape($aParams['ids']) . ")";
                break;

            case 'question_id_pairs':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'id';
                $aMethod['params'][2] = 'title';
                $aMethod['params'][3] = array(
                    'question_id' => $aParams['question_id']
                );

                $sWhereClause .= " AND `ta`.`question_id`=:question_id";
                break;

            case 'question_id':
                $aMethod['params'][1] = array(
                    'question_id' => $aParams['question_id']
                );

                $sWhereClause .= " AND `ta`.`question_id`=:question_id";
                break;

            case 'question_id_for_profile':
                $aMethod['params'][1] = array(
                    'question_id' => $aParams['question_id'],
                    'profile_id' => $aParams['profile_id'],
                );

                $sSelectClause .= ", `tau`.`added` AS `checked`";
                $sJoinClause = " LEFT JOIN `" . $CNF['TABLE_ANSWERS2USERS'] . "` AS `tau` ON `ta`.`id`=`tau`.`answer_id` AND `tau`.`profile_id`=:profile_id";
                $sWhereClause .= " AND `ta`.`question_id`=:question_id";
                break;

            case 'question_id_max_order':
                $aMethod['name'] = 'getOne';
                $aMethod['params'][1] = array(
                    'question_id' => $aParams['question_id']
                );

                $sSelectClause = "MAX(`ta`.`order`)";
                $sWhereClause .= " AND `ta`.`question_id`=:question_id";
                break;

            case 'answered':
                $aMethod['name'] = 'getOne';
                $aMethod['params'][1] = array(
                    'question_id' => $aParams['question_id'],
                    'profile_id' => $aParams['profile_id'],
                );

                $sSelectClause = "`tau`.`answer_id`";
                $sJoinClause = " INNER JOIN `" . $CNF['TABLE_ANSWERS2USERS'] . "` AS `tau` ON `ta`.`id`=`tau`.`answer_id` AND `tau`.`profile_id`=:profile_id";
                $sWhereClause .= " AND `ta`.`question_id`=:question_id";
                break;

            case 'all':
            	break;
        }

        $sOrderByClause = " ORDER BY " . (isset($aParams['order_by']) ? '`' . $aParams['order_by'] . '`' : '`ta`.`order`');
        $sOrderByClause .= " " . (isset($aParams['order_way']) ? strtoupper($aParams['order_way']) : 'ASC');

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $CNF['TABLE_ANSWERS'] . "` AS `ta`" . $sJoinClause . " WHERE 1 " . $sWhereClause . $sOrderByClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function insertAnswer($aParamsSet)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParamsSet))
            return false;

        $sSql = "INSERT INTO `" . $CNF['TABLE_ANSWERS'] . "` SET " . $this->arrayToSQL($aParamsSet);
        return $this->query($sSql);
    }

    public function updateAnswer($aParamsSet, $aParamsWhere)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParamsSet) || empty($aParamsWhere))
            return false;

        $sSql = "UPDATE `" . $CNF['TABLE_ANSWERS'] . "` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $this->arrayToSQL($aParamsWhere, " AND ");
        return $this->query($sSql);
    }

    public function deleteAnswer($aParams)
    {
        $CNF = &$this->_oConfig->CNF;

        $sSql = "DELETE FROM `" . $CNF['TABLE_ANSWERS'] . "` WHERE " . $this->arrayToSQL($aParams, " AND ");
        return $this->query($sSql);
    }

    public function deleteAnswerById($mixedId)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!is_array($mixedId))
            $mixedId = array($mixedId);

        $sSql = "DELETE FROM `" . $CNF['TABLE_ANSWERS'] . "` WHERE `id` IN (" . $this->implode_escape($mixedId) . ")";
        return $this->query($sSql);
    }

    public function insertAnswer2User($aParamsSet)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParamsSet))
            return false;

        $sSql = "INSERT INTO `" . $CNF['TABLE_ANSWERS2USERS'] . "` SET " . $this->arrayToSQL($aParamsSet);
        return $this->query($sSql);
    }

    public function deleteAnswer2User($aParams)
    {
        $CNF = &$this->_oConfig->CNF;

        $sSql = "DELETE FROM `" . $CNF['TABLE_ANSWERS2USERS'] . "` WHERE " . $this->arrayToSQL($aParams, " AND ");
        return $this->query($sSql);
    }

    public function isAnswer($iQuestionId, $iProfileId)
    {
        $iAnswer = (int)$this->getAnswers(array(
            'type' => 'answered', 
            'question_id' => $iQuestionId, 
            'profile_id' => $iProfileId
        ));

        return $iAnswer > 0 ? $iAnswer : false;
    }

    public function doAnswer($iAnswerId, $iProfileId, $sText = '')
    {
        $CNF = &$this->_oConfig->CNF;

        $bResult = (int)$this->insertAnswer2User(array(
            'answer_id' => $iAnswerId,
            'profile_id' => $iProfileId,
            'text' => $sText,
            'added' => time()
        )) > 0;

        if($bResult)
            $this->query("UPDATE `" . $CNF['TABLE_ANSWERS'] . "` SET `votes`=`votes`+1 WHERE `id`=:id", array('id' => $iAnswerId));

        return $bResult;
    }

    public function undoAnswer($iAnswerId, $iProfileId)
    {
        $CNF = &$this->_oConfig->CNF;

        $bResult = (int)$this->deleteAnswer2User(array(
            'answer_id' => $iAnswerId,
            'profile_id' => $iProfileId
        )) > 0;

        if($bResult)
            $this->query("UPDATE `" . $CNF['TABLE_ANSWERS'] . "` SET `votes`=`votes`-1 WHERE `id`=:id", array('id' => $iAnswerId));

        return $bResult;
    }
}

/** @} */
