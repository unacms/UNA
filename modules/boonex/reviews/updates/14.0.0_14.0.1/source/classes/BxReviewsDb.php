<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reviews Reviews
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module database queries
 */
class BxReviewsDb extends BxBaseModTextDb
{
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }

    public function getVotingOptionLKey($iOptionId) {
        return $this->getOne("SELECT `lkey` FROM `bx_reviews_voting_options` WHERE `id` = :id", [
            'id' => $iOptionId,
        ]);
    }

    public function getVotingOptions() {
        return $this->getAll("SELECT `id`, `lkey` FROM `bx_reviews_voting_options` ORDER BY `order`");
    }

    public function getReviewedContent($iLimitFrom, $iLimitNum, $sOrderBy = 'avg_rating') {
        $CNF = &$this->_oConfig->CNF;

        if ($sOrderBy != 'avg_rating' && $sOrderBy != 'reviews_num') $sOrderBy = 'avg_rating';

        return $this->getAll("
            SELECT `bx_reviews_reviews`.`{$CNF['FIELD_REVIEWED_PROFILE']}`, AVG(NULLIF(`{$CNF['FIELD_VOTING_AVG']}`, 0)) AS `avg_rating`, COUNT(*) AS `reviews_num`
            FROM `bx_reviews_reviews`
            JOIN `sys_profiles` ON `sys_profiles`.`id` = `bx_reviews_reviews`.`{$CNF['FIELD_ID']}`  
            WHERE `{$CNF['FIELD_REVIEWED_PROFILE']}` > 0 AND `sys_profiles`.`status` = 'active'
            GROUP BY `{$CNF['FIELD_REVIEWED_PROFILE']}`
            ORDER BY `{$sOrderBy}` DESC
            LIMIT :from, :num
        ", [
            'from' => $iLimitFrom,
            'num' => $iLimitNum,
        ]);
    }
}

/** @} */
