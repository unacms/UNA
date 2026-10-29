<?php

use PHPUnit\Framework\Attributes\DataProvider;

class BxDolTranscoderSignatureTestDouble extends BxDolTranscoder
{
    public function __construct($aObject)
    {
        parent::__construct($aObject, null);
    }
}

/**
 * Signatures of image_transcoder.php links (no DB).
 */
class BxDolTranscoderSignatureTest extends \PHPUnit\Framework\TestCase
{
    private function transcoder($sObject, $aSourceParams, $sSourceType = 'Storage')
    {
        return new BxDolTranscoderSignatureTestDouble([
            'object' => $sObject,
            'source_type' => $sSourceType,
            'source_params' => $aSourceParams,
        ]);
    }

    public function testSignatureIsValidForItsHandler()
    {
        $o = $this->transcoder('sys_cover', ['object' => 'sys_images']);

        $this->assertMatchesRegularExpression('/^[0-9a-f]{32}$/', $o->getHandlerSignature(17));
        $this->assertTrue($o->isHandlerSignatureValid(17, $o->getHandlerSignature(17)));
        $this->assertTrue($o->isHandlerSignatureValid('17', $o->getHandlerSignature(17)));
    }

    public function testSignatureIsBoundToHandlerAndSource()
    {
        $o = $this->transcoder('sys_cover', ['object' => 'sys_images']);
        $oOtherSource = $this->transcoder('sys_accounts_avatar', ['object' => 'sys_accounts_pictures']);

        $this->assertFalse($o->isHandlerSignatureValid(18, $o->getHandlerSignature(17)));
        $this->assertFalse($oOtherSource->isHandlerSignatureValid(17, $o->getHandlerSignature(17)));
    }

    public function testTranscodersOfOneSourceShareSignature()
    {
        // NEO turns the poster link of an editor video into its mp4 link by swapping `o`
        $oPoster = $this->transcoder('sys_videos_editor_poster', ['object' => 'sys_videos_editor']);
        $oMp4 = $this->transcoder('sys_videos_editor_mp4', ['object' => 'sys_videos_editor']);

        $this->assertTrue($oMp4->isHandlerSignatureValid(5, $oPoster->getHandlerSignature(5)));
    }

    public function testFolderSourceIsBoundToPath()
    {
        $o = $this->transcoder('x_folder', ['path' => 'images/a/'], 'Folder');
        $oOtherPath = $this->transcoder('x_folder2', ['path' => 'images/b/'], 'Folder');

        $this->assertTrue($o->isHandlerSignatureValid('a.png', $o->getHandlerSignature('a.png')));
        $this->assertFalse($oOtherPath->isHandlerSignatureValid('a.png', $o->getHandlerSignature('a.png')));
    }

    #[DataProvider('providerForInvalidSignature')]
    public function testInvalidSignatureIsRejected($mixedHandler, $mixedSignature)
    {
        $o = $this->transcoder('sys_cover', ['object' => 'sys_images']);

        $this->assertFalse($o->isHandlerSignatureValid($mixedHandler, $mixedSignature));
    }

    static public function providerForInvalidSignature()
    {
        return [
            'missing' => [17, false],
            'empty' => [17, ''],
            'null' => [17, null],
            'array' => [17, ['x']],
            'made up' => [17, str_repeat('0', 32)],
        ];
    }

    public function testTruncatedOrChangedSignatureIsRejected()
    {
        $o = $this->transcoder('sys_cover', ['object' => 'sys_images']);
        $s = $o->getHandlerSignature(17);

        $this->assertFalse($o->isHandlerSignatureValid(17, substr($s, 0, 16)));
        $this->assertFalse($o->isHandlerSignatureValid(17, strtoupper($s)));
        $this->assertFalse($o->isHandlerSignatureValid(17, $s . 'a'));
        $this->assertFalse($o->isHandlerSignatureValid([17], $s));
    }
}
