<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCoreScripts Scripts
 * @{
 */

/**
 * Switches the engine that renders a grid (sys_objects_grid.engine). Console only: a request
 * from the web gets a 404 and changes nothing.
 *
 *   php scripts/grid_engine.php <object> <engine>
 *
 *   object - grid object name, for example sys_studio_nav_items
 *   engine - ag (AG Grid) or classic (the classic HTML grid)
 *
 * The same in SQL, where the repository's scripts/ folder is not deployed:
 *   UPDATE `sys_objects_grid` SET `engine` = 'ag' WHERE `object` = '<object>';   -- '' for classic
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$GLOBALS['bx_profiler_disable'] = true;
define('BX_DOL_CRON_EXECUTE', '1');

require_once dirname(__DIR__) . '/inc/header.inc.php';
require_once BX_DIRECTORY_PATH_INC . 'design.inc.php';

class BxDolGridEngineCmd
{
    protected $_aEngines = [
        'classic' => '',
        'ag' => 'ag',
    ];

    public function main($aArgs)
    {
        if (count($aArgs) != 2) {
            $this->finish(2, $this->getHelp());
        }

        list($sObject, $sEngine) = $aArgs;

        if (!isset($this->_aEngines[$sEngine])) {
            $this->finish(2, "Unknown engine '" . $sEngine . "'. Use one of: " . implode(', ', array_keys($this->_aEngines)));
        }

        if (!BxDolGridQuery::isGridObject($sObject)) {
            $this->finish(1, "Grid object '" . $sObject . "' not found.");
        }

        if (!BxDolGridQuery::setGridEngine($sObject, $this->_aEngines[$sEngine])) {
            $this->finish(1, "Failed to update grid object '" . $sObject . "'.");
        }

        $this->finish(0, "Grid '" . $sObject . "' now uses the " . $sEngine . " engine.");
    }

    protected function getHelp()
    {
        return "Usage: php scripts/grid_engine.php <object> <engine>\n"
            . "\t object\tGrid object name (sys_objects_grid.object)\n"
            . "\t engine\t" . implode(' or ', array_keys($this->_aEngines));
    }

    protected function finish($iCode, $sMsg)
    {
        echo $sMsg . "\n";
        exit($iCode);
    }
}

(new BxDolGridEngineCmd())->main(array_slice($GLOBALS['argv'], 1));

/** @} */
