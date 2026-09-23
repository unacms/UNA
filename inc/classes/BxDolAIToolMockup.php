<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * `mockup_upsert` tool: the agent saves a NEO mockup JSON tree onto an existing
 * `get_mockup_block` service page block. The tree lives in `sys_pages_blocks_data`
 * (no new table) and is served by system/get_mockup_block/TemplServices as a
 * `mockup` API block, which NEO renders natively (view/row/text/image/icon/button).
 */

use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\ToolProperty;

class BxDolAIToolMockup extends BxDolAITool
{
    const MAX_DEPTH = 24;
    const MAX_JSON = 200000;
    /** sys_pages_blocks_data.data is TEXT: a longer tree is cut off and no longer parses. */
    const MAX_STORED = 65535;

    public function __construct()
    {
        parent::__construct(
            'mockup_upsert',
            'Save a NEO mockup JSON tree onto a get_mockup_block page block (sys_pages_blocks_data). Do not use mysql_write, HTML, or React Native JSX for mockups. Do not touch get_mockup_test (hardcoded demo). '
            . 'Root: {"type":"view","className":"...","children":[...]}. Types: view (column), row (horizontal; already flex-row), text, image, icon, button. Empty view/row/text are dropped. '
            . 'Columns: parent type=row className="gap-4 w-full"; children view with flex-1 or w-1/2 / w-1/3 / w-1/4. NEVER w-full on row children — that stacks cards full-width. 2 cols → w-1/2 or flex-1; 3 → w-1/3 or flex-1; 4 → w-1/4. w-full only on vertical view sections. '
            . 'className: Tailwind already in NEO (gap-2 gap-4 gap-8 w-full w-1/2 w-1/3 w-1/4 flex-1 min-w-0 p-4 rounded-xl border border-border bg-card text-foreground text-muted-foreground text-sm text-lg text-4xl font-semibold font-bold items-center justify-between h-48). No arbitrary-[]. Text color/size/font-* only on text nodes (RN does not cascade). '
            . 'text: field text; one feature line = one text node, not \\n. icon: Lucide name, size default 24. image: display src only (src/medium/small/thumb), never src_orig. button: label required, optional href, style primary|secondary|outline|plain|link|glass. '
            . 'Match screenshot hierarchy/spacing/CTAs; skip video/map/forms as text+button placeholders.'
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty('block_id', PropertyType::INTEGER, 'sys_pages_blocks.id of the get_mockup_block service block', true),
            new ToolProperty('tree_json', PropertyType::STRING, 'JSON object, root type view. Row children: flex-1 or w-1/3, never w-full. Example: {"type":"view","className":"gap-8 w-full","children":[{"type":"row","className":"gap-4 w-full","children":[{"type":"view","className":"w-1/3 p-4 rounded-xl border border-border bg-card gap-4","children":[{"type":"text","className":"text-4xl font-bold text-foreground","text":"Pro"}]}]}]}', true),
            new ToolProperty('dry_run', PropertyType::BOOLEAN, 'If true, validate only and do not save', false),
        ];
    }

    public function __invoke($block_id, $tree_json, $dry_run = false): string
    {
        $iBlockId = (int)$block_id;
        if ($iBlockId <= 0)
            return 'error: block_id is required (sys_pages_blocks.id of the get_mockup_block block)';

        $sJson = is_string($tree_json) ? trim($tree_json) : '';
        if ($sJson === '')
            return 'error: tree_json is required';
        if (strlen($sJson) > self::MAX_JSON)
            return 'error: tree_json is too large';

        $aRaw = json_decode($sJson, true);
        if (!is_array($aRaw))
            return 'error: tree_json is not valid JSON object';

        $aTree = self::normalizeNode($aRaw, 0);
        if (!$aTree)
            return 'error: empty or invalid tree. Root type view with children. Types: view,row,text,image,icon,button.';

        if (!self::isMockupBlock($iBlockId))
            return 'error: block_id ' . $iBlockId . ' is not a get_mockup_block service block';

        $bDry = ($dry_run === true || $dry_run === 1 || $dry_run === '1' || $dry_run === 'true');
        if ($bDry)
            return 'dry_run ok. block_id=' . $iBlockId . ' nodes=' . self::countNodes($aTree);

        $sErr = self::saveTree($iBlockId, $aTree);
        if ($sErr !== '')
            return $sErr;

        return 'saved. block_id=' . $iBlockId . ' nodes=' . self::countNodes($aTree);
    }

    public static function currentBlockId()
    {
        if (!class_exists('BxDolPage'))
            return 0;
        $aProc = BxDolPage::getBlockProcessing();
        return (!empty($aProc['id'])) ? (int)$aProc['id'] : 0;
    }

    public static function isMockupBlock($iBlockId)
    {
        $iBlockId = (int)$iBlockId;
        if ($iBlockId <= 0)
            return false;

        $sContent = BxDolDb::getInstance()->getOne("SELECT `content` FROM `sys_pages_blocks` WHERE `id` = :id AND `type` = 'service' LIMIT 1", [
            'id' => $iBlockId,
        ]);
        $aCall = BxDolService::decodeServiceCall($sContent);
        return is_array($aCall) && ($aCall['module'] ?? '') === 'system' && ($aCall['method'] ?? '') === 'get_mockup_block';
    }

    public static function getTree($iBlockId = 0)
    {
        $iBlockId = (int)$iBlockId;
        if ($iBlockId <= 0)
            $iBlockId = self::currentBlockId();
        if ($iBlockId <= 0)
            return null;

        $oDb = new BxDolPageQuery([]);
        $sData = $oDb->getPageBlockData($iBlockId);
        if (!$sData)
            return null;

        $aRaw = json_decode($sData, true);
        if (!is_array($aRaw))
            return null;

        return self::normalizeNode($aRaw, 0);
    }

    public static function saveTree($iBlockId, array $aTree)
    {
        $iBlockId = (int)$iBlockId;
        if ($iBlockId <= 0)
            return 'error: block_id missing';

        // Unescaped: a non-Latin character costs 2-4 bytes here instead of 6 as \uXXXX.
        $sData = json_encode($aTree, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($sData))
            return 'error: the tree cannot be encoded as JSON';
        if (strlen($sData) > self::MAX_STORED)
            return 'error: the tree is too large to save (' . strlen($sData) . ' bytes, the limit is ' . self::MAX_STORED . '). Simplify it: fewer nodes, shorter texts and class names.';

        $oDb = new BxDolPageQuery([]);
        $b = $oDb->setPageBlockData($iBlockId, 0, '', $sData);
        if ($b === false)
            return 'error: failed to write sys_pages_blocks_data';

        return '';
    }

    public static function normalizeNode($raw, $iDepth)
    {
        $aTypes = ['view' => 1, 'row' => 1, 'text' => 1, 'image' => 1, 'icon' => 1, 'button' => 1];
        $aBtn = [
            'primary' => 'borderedProminent',
            'secondary' => 'bordered',
            'outline' => 'bordered',
            'bordered' => 'bordered',
            'borderedProminent' => 'borderedProminent',
            'plain' => 'plain',
            'link' => 'link',
            'glass' => 'glass',
            'glassProminent' => 'glassProminent',
            'borderless' => 'borderless',
        ];

        if ($iDepth > self::MAX_DEPTH || $raw === null)
            return null;

        if (is_string($raw)) {
            $s = trim($raw);
            if ($s !== '' && ($s[0] === '{' || $s[0] === '[')) {
                $decoded = json_decode($s, true);
                if (is_array($decoded))
                    return self::normalizeNode($decoded, $iDepth);
            }
            return $s !== '' ? ['type' => 'text', 'className' => '', 'text' => $s] : null;
        }
        if (!is_array($raw))
            return null;

        if (isset($raw[0]) && !isset($raw['type'])) {
            $aChildren = [];
            foreach ($raw as $child) {
                $n = self::normalizeNode($child, $iDepth + 1);
                if ($n)
                    $aChildren[] = $n;
            }
            return $aChildren ? ['type' => 'view', 'className' => '', 'children' => $aChildren] : null;
        }

        $sType = isset($raw['type']) ? (string)$raw['type'] : '';
        if ($sType === 'mockup')
            return self::normalizeNode($raw['data'] ?? $raw['content'] ?? $raw['tree'] ?? $raw['node'] ?? null, $iDepth);

        if ($sType === '')
            $sType = (isset($raw['text']) && !isset($raw['children'])) ? 'text' : 'view';
        if (empty($aTypes[$sType]))
            return null;

        $sClass = (isset($raw['className']) && is_string($raw['className'])) ? $raw['className'] : '';
        $aChildrenIn = [];
        if (isset($raw['children']))
            $aChildrenIn = is_array($raw['children']) ? $raw['children'] : [$raw['children']];
        $aChildren = [];
        foreach ($aChildrenIn as $child) {
            $n = self::normalizeNode($child, $iDepth + 1);
            if ($n)
                $aChildren[] = $n;
        }

        if ($sType === 'text') {
            $sText = isset($raw['text']) ? (string)$raw['text'] : '';
            return $sText === '' ? null : ['type' => 'text', 'className' => $sClass, 'text' => $sText];
        }
        if ($sType === 'icon') {
            $sIcon = isset($raw['icon']) ? (string)$raw['icon'] : '';
            if ($sIcon === '')
                return null;
            $iSize = isset($raw['size']) ? (int)$raw['size'] : 24;
            return ['type' => 'icon', 'className' => $sClass, 'icon' => $sIcon, 'size' => $iSize > 0 ? $iSize : 24];
        }
        if ($sType === 'image') {
            $sSrc = self::pickImageSrc($raw);
            if ($sSrc === '')
                return null;
            return ['type' => 'image', 'className' => $sClass, 'src' => $sSrc, 'alt' => isset($raw['alt']) ? (string)$raw['alt'] : ''];
        }
        if ($sType === 'button') {
            $sLabel = (string)($raw['label'] ?? $raw['text'] ?? '');
            if ($sLabel === '')
                return null;
            $sStyleKey = (string)($raw['style'] ?? $raw['variant'] ?? 'primary');
            return [
                'type' => 'button',
                'className' => $sClass,
                'label' => $sLabel,
                'href' => self::safeHref($raw['href'] ?? ''),
                'style' => $aBtn[$sStyleKey] ?? 'borderedProminent',
            ];
        }
        if (!$aChildren)
            return null;

        return ['type' => $sType, 'className' => $sClass, 'children' => $aChildren];
    }

    /**
     * Only relative paths, anchors, http(s) and mailto links; javascript:/data: and the like are dropped.
     */
    protected static function safeHref($mixed)
    {
        $s = is_string($mixed) ? trim($mixed) : '';
        if ($s === '')
            return '';
        if ($s[0] === '/' || $s[0] === '#' || $s[0] === '?')
            return $s;
        if (preg_match('#^(https?://|mailto:)#i', $s))
            return $s;
        return '';
    }

    /**
     * Display src for image node: string src, or UNA image object (src/medium/small/thumb) either
     * directly in the node or nested under `src`. Never src_orig.
     */
    protected static function pickImageSrc(array $raw)
    {
        $aSrc = (isset($raw['src']) && is_array($raw['src'])) ? $raw['src'] : $raw;
        foreach (['src', 'medium', 'small', 'thumb'] as $k) {
            if (!empty($aSrc[$k]) && is_string($aSrc[$k]))
                return $aSrc[$k];
        }
        return '';
    }

    protected static function countNodes(array $aNode)
    {
        $i = 1;
        if (!empty($aNode['children']) && is_array($aNode['children'])) {
            foreach ($aNode['children'] as $child) {
                if (is_array($child))
                    $i += self::countNodes($child);
            }
        }
        return $i;
    }
}
