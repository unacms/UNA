<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\ToolProperty;

/**
 * `splash_update` tool: the operator agent reads and edits the guest splash of Studio > Designer > Splash.
 * The site page shows the code as it is to every guest, so code with scripts, frames or inline handlers is refused.
 * Each changed option is snapshotted into sys_agents_sql_log, so mysql_undo rolls it back.
 */
class BxDolAIToolSplash extends BxDolAITool
{
    /** The site page. Its code is also the shared code of the apps that have none of their own. */
    public const TARGET_SITE = 'site';

    const MAX_CODE = 262144;

    public function __construct()
    {
        parent::__construct(
            'splash_update',
            'Read or change the guest splash, what guests see on the home page (Studio > Designer > Splash). Call with platform alone to read its state. '
            . 'platform=site is the site page, and its code is the shared code of every app that has no code of its own. platform=web, ios or android is that app. '
            . 'Call with dry_run=true first: it returns a summary and app_code, what the apps get from the code. Show the summary to the person, not the code, unless asked. '
            . 'Scripts, frames, inline event handlers and javascript: links are refused. '
            . 'Each changed option gets one id in log_ids: mysql_undo with log_id rolls one back, scope=session all of this chat.'
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty('platform', PropertyType::STRING, 'site, web, ios or android.', true),
            new ToolProperty('enabled', PropertyType::STRING, 'on or off. Leave out to keep the switch.', false),
            new ToolProperty('code', PropertyType::STRING, 'New HTML and CSS. Leave out to keep the code. For an app, an empty string drops its own code, so it uses the shared code. The site code cannot be empty.', false),
            new ToolProperty('dry_run', PropertyType::BOOLEAN, 'true = validate and return the summary without saving.', false),
        ];
    }

    public function __invoke(string $platform, $enabled = null, $code = null, $dry_run = false): array
    {
        $sTarget = mb_strtolower(trim($platform));
        if ($sTarget !== self::TARGET_SITE && !BxDolSplash::isPlatform($sTarget))
            throw new Exception('platform must be site, web, ios or android.');

        $aValues = $this->_getValues($sTarget, $enabled, $code);
        $bDry = $dry_run === true || $dry_run === 1 || $dry_run === '1' || $dry_run === 'true';

        $oQuery = new BxDolAiQuery();
        $aRows = [];
        $aChanges = [];
        foreach ($aValues as $sOption => $sValue) {
            $aRow = $oQuery->getOptionRowByName($sOption);
            if (!$aRow)
                throw new Exception("Option {$sOption} not found.");
            if ((string)$aRow['value'] === $sValue)
                continue;

            $aRows[$sOption] = $aRow;
            $aChanges[$sOption] = $sValue;
        }

        $aLogIds = [];
        if (!$bDry) {
            $aContext = BxDolAIToolMysqlWrite::currentLogContext();
            foreach ($aChanges as $sOption => $sValue) {
                setParam($sOption, $sValue);

                $aAfter = $oQuery->getOptionRowByName($sOption);
                $aLogIds[] = $oQuery->addSqlLog($aContext, 'update', 'sys_options', 'id', (string)$aRows[$sOption]['id'], "UPDATE sys_options: {$sOption}", json_encode($aRows[$sOption], JSON_UNESCAPED_UNICODE), json_encode($aAfter, JSON_UNESCAPED_UNICODE));
            }
        }

        $aResult = $this->_getState($sTarget, $aValues);
        $aResult['ok'] = 1;
        if ($bDry)
            $aResult['dry_run'] = 1;
        if ($aValues) {
            $aResult['changed'] = array_keys($aChanges);
            $aResult['log_ids'] = $aLogIds;
            $aResult['summary'] = $aChanges ? 'Splash of ' . $sTarget . ': ' . implode(', ', array_keys($aChanges)) : 'Splash of ' . $sTarget . ': nothing to change';
        }

        return $aResult;
    }

    /**
     * Option => new value, from what the tool was given.
     */
    protected function _getValues(string $sTarget, $mixedEnabled, $mixedCode): array
    {
        $bSite = $sTarget === self::TARGET_SITE;
        $aValues = [];

        if ($mixedEnabled !== null && $mixedEnabled !== '') {
            if (is_bool($mixedEnabled))
                $mixedEnabled = $mixedEnabled ? 'on' : 'off';

            $sEnabled = mb_strtolower(trim((string)$mixedEnabled));
            if (!in_array($sEnabled, ['on', 'off'], true))
                throw new Exception('enabled must be on or off.');

            // The site's switch is 'on' or empty, an app's 'on' or 'off' (see BxDolStudioDesigner).
            if ($bSite)
                $aValues['sys_site_splash_enabled'] = $sEnabled === 'on' ? 'on' : '';
            else
                $aValues[BxDolSplash::getOptionEnabled($sTarget)] = $sEnabled;
        }

        if ($mixedCode !== null) {
            $sCode = (string)$mixedCode;
            if ($bSite && trim($sCode) === '')
                throw new Exception('The site code cannot be empty: every app without its own code uses it. Use enabled=off to hide the splash.');
            if (get_mb_len($sCode) > self::MAX_CODE)
                throw new Exception('code is too large.');

            $aUnsafe = BxDolSplash::getInstance()->findUnsafe($sCode);
            if ($aUnsafe)
                throw new Exception('code has what the splash may not have: ' . implode(', ', $aUnsafe) . '.');

            $aValues[$bSite ? 'sys_site_splash_code' : BxDolSplash::getOptionCode($sTarget)] = $sCode;
        }

        return $aValues;
    }

    /**
     * The target's state. $aValues (option => value) stand in for what a dry run has not saved.
     */
    protected function _getState(string $sTarget, array $aValues): array
    {
        $oSplash = BxDolSplash::getInstance();

        $fValue = function ($sOption) use ($aValues) {
            return (string)($aValues[$sOption] ?? getParam($sOption));
        };

        $sShared = $fValue('sys_site_splash_code');
        if ($sTarget === self::TARGET_SITE)
            return [
                'platform' => $sTarget,
                'enabled' => $fValue('sys_site_splash_enabled') === 'on' ? 'on' : 'off',
                'splash_code' => $sShared,
                'app_code' => $oSplash->getCodeForApp($sShared),
            ];

        $sOptionEnabled = BxDolSplash::getOptionEnabled($sTarget);
        $sOwn = $fValue(BxDolSplash::getOptionCode($sTarget));
        $bOwn = trim($sOwn) !== '';

        return [
            'platform' => $sTarget,
            'enabled' => isset($aValues[$sOptionEnabled]) ? $aValues[$sOptionEnabled] : ($oSplash->isEnabledForApp($sTarget) ? 'on' : 'off'),
            'uses_shared_code' => $bOwn ? 0 : 1,
            'splash_code' => $bOwn ? $sOwn : $sShared,
            'app_code' => $oSplash->getCodeForApp($bOwn ? $sOwn : $sShared),
        ];
    }
}

/** @} */
