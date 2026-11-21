<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * A block header's buttons and tabs (.bx-db-menu) sit at the header's top padding, as far from the block's top edge as
 * from its right one, beside a title with a description too. The base template and Artificer each ship common.css.
 */
class BlockHeaderActionsTest extends BxDolTestCase
{
    public static function files(): array
    {
        return [
            'base' => ['template/css/common.css'],
            'artificer' => ['modules/boonex/artificer/data/template/system/css/common.css'],
        ];
    }

    #[DataProvider('files')]
    public function testMenuSitsAtTheHeadersTopPadding(string $sPath): void
    {
        $s = str_replace("\r\n", "\n", (string)file_get_contents(__DIR__ . '/../../../' . $sPath));

        $this->assertMatchesRegularExpression('/\n\.bx-db-header > \.bx-db-menu \{[^}]*\n    align-self: flex-start;/', $s, $sPath);
    }

    public function testBaseTabsPaddingMovesNothing(): void
    {
        $s = (string)file_get_contents(__DIR__ . '/../../../template/css/common.css');

        $this->assertStringContainsString(".bx-db-header > .bx-db-menu > .bx-db-menu-tab {\n    margin-top: -1px;\n    margin-bottom: -1px;\n}", str_replace("\r\n", "\n", $s));
    }
}
