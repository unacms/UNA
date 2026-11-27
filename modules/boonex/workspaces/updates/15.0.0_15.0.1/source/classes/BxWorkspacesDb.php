<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Workspaces Workspaces
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Workspaces module database queries
 */
class BxWorkspacesDb extends BxBaseModProfileDb
{
    public function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }

    /**
     * Workspace profile of an account in a context. A workspace belongs to the context
     * it is visible to: its allow_view_to is the context profile id, negated.
     * @return int profile id, 0 when the account has none there
     */
    public function getWorkspaceProfileId($iAccountId, $iContextProfileId)
    {
        $CNF = &$this->_oConfig->CNF;

        return (int)$this->getOne("SELECT `p`.`id` FROM `sys_profiles` AS `p` INNER JOIN `" . $CNF['TABLE_ENTRIES'] . "` AS `w` ON `w`.`" . $CNF['FIELD_ID'] . "` = `p`.`content_id` WHERE `p`.`type` = :type AND `p`.`account_id` = :account AND `w`.`" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` = :context ORDER BY `p`.`id` LIMIT 1", [
            'type' => $this->_oConfig->getName(),
            'account' => (int)$iAccountId,
            'context' => (string)(-(int)$iContextProfileId),
        ]);
    }

    /**
     * Add a workspace entry for a context, without the entry form: the member isn't in the
     * context yet when it is made, so the form would refuse its privacy.
     * @return int content id, 0 on failure
     */
    public function insertWorkspace($iAuthorProfileId, $iContextProfileId)
    {
        $CNF = &$this->_oConfig->CNF;

        $sContext = (string)(-(int)$iContextProfileId);
        $iNow = time();
        if(!$this->query("INSERT INTO `" . $CNF['TABLE_ENTRIES'] . "` SET " . $this->arrayToSQL([
            $CNF['FIELD_AUTHOR'] => (int)$iAuthorProfileId,
            $CNF['FIELD_ADDED'] => $iNow,
            $CNF['FIELD_CHANGED'] => $iNow,
            $CNF['FIELD_ALLOW_VIEW_TO'] => $sContext,
            $CNF['FIELD_ALLOW_POST_TO'] => '5', // only the owner posts on its timeline
            $CNF['FIELD_ALLOW_CONTACT_TO'] => $sContext,
            'settings' => '',
        ])))
            return 0;

        return (int)$this->lastId();
    }

    /**
     * Remove a workspace entry that got no profile.
     */
    public function deleteWorkspace($iContentId)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->query("DELETE FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `" . $CNF['FIELD_ID'] . "` = :id", ['id' => (int)$iContentId]);
    }
}

/** @} */
