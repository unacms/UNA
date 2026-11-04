<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Tools\Tool;

class BxDolAITool extends Tool
{
    /**
     * Neuron AI 4.x Tool has no constructor: the identity is declared as properties.
     * Keeps the `parent::__construct($name, $description)` call of every UNA tool.
     */
    public function __construct(string $sName = '', ?string $sDescription = null)
    {
        if ($sName !== '')
            $this->name = $sName;
        $this->description = $sDescription;
    }

    function getContentModules() 
    {
        $a = bx_srv('system', 'modules_list', [true, true], 'TemplServiceContent');
        return implode(', ', $a);
    }

    function convertArrayToKeyValue($data) {
        $result = [];
        
        foreach ($data as $item) {
            if (isset($item['name']) && isset($item['value'])) {
                $result[$item['name']] = $item['value'];
            }
        }
        
        return $result;
    }
}
