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

class BxDolAIToolContentSearch extends BxDolAITool
{
    public static function isMemberSafe(): bool
    {
        return true;
    }

    public function __construct()
    {
        parent::__construct(
            'content_search',
            'Search for content items based on a keyword and optional sections. If needed, prepend base URL to links: ' . BX_DOL_URL_ROOT . '. Available sections: ' . self::getSections() . '.',
        );
    }
    
    public static function getSections()
    {
        $aSections = BxDolSearch::getSections();
        return implode(',', array_keys($aSections));
    }
    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'keyword',
                type: PropertyType::STRING,
                description: 'The keyword to search for.',
                required: true
            ),
            new ArrayProperty(
                name: 'sections',
                description: 'List of sections to search in.',
                required: false,
                items: new ToolProperty(
                    name: 'section',
                    type: PropertyType::STRING,
                    description: 'Section name.',
                )
            ),
            new ToolProperty(
                name: 'limit',
                type: PropertyType::INTEGER,
                description: 'The maximum number of results to return. Default is 5.',
                required: false
            )
        ];
    }

    public function __invoke(string $keyword, array $sections, ?int $limit = 5): array
    {
        $a = bx_srv('system', 'search', [$keyword, $sections, $limit], 'TemplServiceContent');
        if (!$a)
            return ["error" => "No content items found"];
        return $a;
    }
}
