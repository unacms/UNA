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
use NeuronAI\Tools\ArrayProperty;
use NeuronAI\Tools\ObjectProperty;

class BxDolAIToolContentUpdate extends BxDolAITool
{
    public static function isMemberSafe(): bool
    {
        return true;
    }

    public static function memberScopedArgs(): array
    {
        return ['profile_id'];
    }

    public function __construct()
    {
        parent::__construct(
            'content_update',
            'Use this tool to update content. Always use "content_structure" tool to get knowledge about content modules fields. Available modules: ' . $this->getContentModules() . '.',
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'module',
                type: PropertyType::STRING,
                description: 'The module name to perform content changes on. Use "system" for site accounts. ',
                required: true
            ),
            new ToolProperty(
                name: 'content_id',
                type: PropertyType::INTEGER,
                description: 'Content ID to update.',
                required: true
            ),
            new ArrayProperty(
                name: 'data',
                description: 'Key-value pairs of data fields to add, where keys match the field names. Never use fields what aren\'t defined in content structure.',
                required: true,
                items: new ObjectProperty(
                    name: 'parameter',
                    properties: [
                        new ToolProperty('name', PropertyType::STRING, 'Parameter name', true),
                        new ToolProperty('value', PropertyType::STRING, 'Parameter value', true),
                    ]
                )
            ),
            new ToolProperty(
                name: 'profile_id',
                type: PropertyType::INTEGER,
                description: 'Author profile ID.',
                required: true
            )
        ];
    }

    public function __invoke(string $module, int $content_id, array $data, int $profile_id): array
    {
        if (($aError = $this->memberContentError($module, $content_id, 'edit')))
            return $aError;

        $iPrevious = $this->actAs($profile_id);

        $a = bx_srv('system', 'update', [$module, $content_id, $this->convertArrayToKeyValue($data)], 'TemplServiceContent');

        $this->endActingAs($iPrevious);

        return $a;
    }
}
