<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Tools attached in code. They are not stored on the agent and are not offered
 * in the Studio tool picker, the tools grid, or agent_create.
 * mysql_schema and mysql_select stay visible. mysql_write_safe and mysql_undo do not.
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiAgentTools
{
    /** Every agent. */
    public const ALWAYS = ['chat_buttons', 'chat_title'];

    /** una_operator, in addition to ALWAYS. Hidden from the picker. mysql_write is not included. */
    public const OPERATOR = [
        'agent_create',
        'mockup_upsert',
        'mysql_write_safe',
        'mysql_undo',
        'mysql_schema',
        'mysql_select',
    ];

    public static function typesFor(array $aAgent): array
    {
        $a = self::ALWAYS;
        if (($aAgent['name'] ?? '') === 'una_operator')
            $a = array_merge($a, self::OPERATOR);

        return $a;
    }

    public static function hiddenTypes(): array
    {
        return array_values(array_unique(array_merge(self::ALWAYS, self::OPERATOR)));
    }

    /**
     * Studio tools grid source, with locked types removed.
     */
    public static function excludeHiddenFromSource(string $sSource): string
    {
        if (stripos($sSource, ' WHERE ') === false)
            $sSource .= ' WHERE 1 ';

        return $sSource . ' AND `type` NOT IN (' . BxDolDb::getInstance()->implode_escape(self::hiddenTypes()) . ')';
    }

    /**
     * One active row per type that this agent must have, lowest id.
     *
     * @return int[]
     */
    public static function idsFor(array $aAgent): array
    {
        $aTypes = self::typesFor($aAgent);
        if (!$aTypes)
            return [];

        $aIds = [];
        $aSeen = [];
        foreach ((new BxDolAiQuery())->getActiveToolsByTypes($aTypes) as $aRow) {
            $sType = (string)$aRow['type'];
            if (isset($aSeen[$sType]))
                continue;
            $aSeen[$sType] = true;
            $aIds[] = (int)$aRow['id'];
        }

        return $aIds;
    }

    /**
     * Every row of a locked type, including inactive copies, so a stored id cannot grant one.
     *
     * @return int[]
     */
    public static function hiddenIds(): array
    {
        $aTypes = self::hiddenTypes();
        if (!$aTypes)
            return [];

        return (new BxDolAiQuery())->getToolIdsByTypes($aTypes);
    }

    /**
     * Stored ids minus locked ones, plus the ids this agent always has.
     *
     * @return int[]
     */
    public static function resolveIds(array $aAgent): array
    {
        $aIds = [];
        if (!empty($aAgent['tools'])) {
            foreach (explode(',', (string)$aAgent['tools']) as $sToolId) {
                $iToolId = (int)trim($sToolId);
                if ($iToolId > 0)
                    $aIds[$iToolId] = $iToolId;
            }
        }

        foreach (self::hiddenIds() as $iHidden)
            unset($aIds[$iHidden]);

        foreach (self::idsFor($aAgent) as $iId)
            $aIds[$iId] = $iId;

        return array_values($aIds);
    }

    public static function stripCsv(string $sTools): string
    {
        $sTools = trim($sTools);
        if ($sTools === '')
            return '';

        $aHidden = array_flip(self::hiddenIds());
        $aKeep = [];
        foreach (explode(',', $sTools) as $sId) {
            $iId = (int)trim($sId);
            if ($iId <= 0 || isset($aHidden[$iId]))
                continue;
            $aKeep[$iId] = $iId;
        }

        return implode(',', $aKeep);
    }
}

/** @} */
