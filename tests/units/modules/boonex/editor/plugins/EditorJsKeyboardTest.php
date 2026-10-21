<?php

/**
 * The vendored Editor.js 2.25 passes keys pressed outside the editor to the editor's current block. With its
 * first block current from the start, Tab anywhere on the page opened that block's toolbox, whose Flipper then
 * swallowed every Tab. UNA's patch hands such keys to the block only while blocks are selected.
 */
class EditorJsKeyboardTest extends \PHPUnit\Framework\TestCase
{
    public function testKeysOutsideTheEditorReachTheBlockOnlyWhileBlocksAreSelected(): void
    {
        $s = file_get_contents(__DIR__ . '/../../../../../../modules/boonex/editor/plugins/editorjs/editor.js');
        $this->assertNotFalse($s);

        $this->assertStringContainsString('void 0===e||null!==n||!this.Editor.BlockSelection.anyBlockSelected?n||e&&o||(this.Editor.BlockManager.dropPointer(),this.Editor.Toolbar.close()):this.Editor.BlockEvents.keydown(t)', $s, 'UI.defaultBehaviour keeps the patch; re-apply it after an Editor.js upgrade unless the new version no longer opens the toolbox on Tab outside the editor.');
        $this->assertStringContainsString('UNA patch (UI.defaultBehaviour)', $s, 'The file header says what was changed.');
    }
}
