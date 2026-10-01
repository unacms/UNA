<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAIToolFactory extends BxDolFactory
{
    public static function getToolInstance(int $iId):  NeuronAI\Tools\ToolInterface
    {
        if (isset($GLOBALS['bxDolClasses'][__CLASS__ . '_AiAgentTool_' . $iId]))
            return $GLOBALS['bxDolClasses'][__CLASS__ . '_AiAgentTool_' . $iId];

        $a = BxDolAiQuery::getToolObject($iId);
        if (!$a) {
            bx_log('sys_agents', "Tool with id {$iId} not found", BX_LOG_ERR);
            throw new Exception("Tool with id {$iId} not found");
        }

        $aParametersSystem = !empty($a['params']) ? json_decode($a['params'], true) : [];
        $aParametersUser = !empty($a['params_user']) ? json_decode($a['params_user'], true) : [];
        $aParameters = array_merge($aParametersSystem, $aParametersUser);
        
        switch($a['type']) {
            case 'mysql_schema':
                $o = NeuronAI\Tools\Toolkits\MySQL\MySQLSchemaTool::make(
                    pdo: BxDolDb::getInstance()->getLink(),
                    tables: $aParameters['tables'] ?? null
                );
                break;
            case 'mysql_select':
                $o = NeuronAI\Tools\Toolkits\MySQL\MySQLSelectTool::make(
                    pdo: BxDolDb::getInstance()->getLink(),
                );
                break;
            case 'mysql_write':
                $o = NeuronAI\Tools\Toolkits\MySQL\MySQLWriteTool::make(
                    pdo: BxDolDb::getInstance()->getLink(),
                );
                break;

            case 'tavily_web_search':
                $o = NeuronAI\Tools\Toolkits\Tavily\TavilySearchTool::make(
                    key: $aParameters['key'] ?? ''
                );
                break;
            case 'tavily_extract':
                $o = NeuronAI\Tools\Toolkits\Tavily\TavilyExtractTool::make(
                    key: $aParameters['key'] ?? ''
                );
                break;

            case 'jina_web_search':
                $o = NeuronAI\Tools\Toolkits\Jina\JinaWebSearch::make(
                    key: $aParameters['key'] ?? ''
                );
                break;
            case 'jina_url_reader':
                $o = NeuronAI\Tools\Toolkits\Jina\JinaUrlReader::make(
                    key: $aParameters['key'] ?? ''
                );
                break;

            default:
                if (!empty($a['class_name'])) {
                    if (!empty($aObject['class_file']))
                        require_once(BX_DIRECTORY_PATH_ROOT . $aObject['class_file']);
                    $o = $a['class_name']::make();
                }
                else {
                    bx_log('sys_agents', "Tool type {$a['type']} is not supported", BX_LOG_ERR);
                    throw new Exception("Tool type {$a['type']} is not supported");
                }
        }

        $GLOBALS['bxDolClasses'][__CLASS__ . '_AiAgentTool_' . $iId] = $o;

        return $o;
    }
}
