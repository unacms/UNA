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

class BxDolAIToolContentStructure extends BxDolAITool
{
    public static function isMemberSafe(): bool
    {
        return true;
    }

    public function __construct()
    {
        parent::__construct(
            'content_structure',
            'Retrieve the structure of content fields for a given module.',
        );
    }
    
    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'module',
                type: PropertyType::STRING,
                description: 'The module name to retrieve content fields from. Use "system" for site accounts. Use "all" to get fields for all content modules.',
                required: true
            )
        ];
    }

    public function __invoke(string $module): string
    {
        $aContentModules = bx_srv('system', 'modules_list', [true], 'TemplServiceContent');
        $s = $this->formatModulesOutputForLLM($aContentModules);

        $aStructure = bx_srv('system', 'content_modules_fields', [$module], 'TemplServiceContent');
        if (isset($aStructure['code']))
            $s .= "\n\nError: module was not found";
        else
            $s .= "\n" . $this->formatStructureOutputForLLM($aStructure);

        return $s;
    }

    protected function formatModulesOutputForLLM(array $aContentModules): string
    {
        $s = "# All content modules\n\n";

        foreach ($aContentModules as $sModule => $a) {
            $s .= "- **" . $a['title'] . "** (" . $sModule . ")";
            if ($sModule == 'system') {
                $s .= " - system module with site accounts";
            }
            $s .= "\n";
        }
        return $s;
    }

    protected function formatStructureOutputForLLM(array $aStructure): string
    {
        $s = "# Content modules fields structure\n\n";

        foreach ($aStructure as $sModule => $a) {
            if ($sModule == 'bx_timeline') {
                // TODO: timeline is broken with PHP error when trying to get fields
                continue;
            }
            $s .= "## " . $sModule . "\n\n";
            $s .= $a['db_table'] ? "DB table: " . $a['db_table'] . "\n" : "";
            $s .= $a['db_table_fields'] ? "DB table fields: " . implode(', ', $a['db_table_fields']) . "\n" : "";
            $s .= "\n";
            $aMap = ['fields_add' => 'Fields for adding content', 'fields_edit' => 'Fields for editing content'];
            foreach ($aMap as $sKey => $sTitle) {
                if (isset($a[$sKey])) {
                    $s .= "### " . $sTitle . "\n\n";
                    foreach ($a[$sKey] as $sField => $r) {
                        if ($r['type'] == 'custom' || $r['type'] == 'input_set')
                            continue;
                        $s .= "- **" . $r['name'] . "** " . (!empty($r['caption']) ? "(" . $r['caption'] . ")" : "") . (isset($r['required']) && $r['required'] ? " required" : "") . "\n";
                        $s .= "\t- type: " . $r['type'] . "\n";
                        if (isset($r['values']) && is_array($r['values']) && $r['type'] != 'files') {
                            $s .= "\t- values (id:value): " . $this->formatValues($r['values']) . "\n";
                        }
                    }
                }
                $s .= "\n";
            }
        }

        return $s;
    }

    protected function formatValues(array $aValues): string
    {
        $s = "";
        foreach ($aValues as $sKey => $mixedValue) {
            $sValue = $mixedValue;
            if (is_array($mixedValue) && isset($mixedValue['value'])) {
                $sValue = $mixedValue['value'];
                $sKey = $mixedValue['key'];
            }
            $s .= (empty($sKey) ? 'EMPTY' : $sKey) . ":" . $sValue . ",";
        }
        return trim($s, ",");
    }
}
