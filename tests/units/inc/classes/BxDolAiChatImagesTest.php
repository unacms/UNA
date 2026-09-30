<?php

/**
 * Chat image URLs: this site and the storage host only.
 */
class BxDolAiChatImagesTest extends \PHPUnit\Framework\TestCase
{
    public function testRejectsOtherHosts()
    {
        $o = new BxDolAiChatImages();
        $this->assertSame('', $o->sanitizeUrl('http://169.254.169.254/latest/meta-data/iam/?x=sys_agents_chat_images'));
        $this->assertSame('', $o->sanitizeUrl('http://10.0.0.5:8080/admin/storage.php'));
        $this->assertSame('', $o->sanitizeUrl('https://evil.test/storage.php?o=sys_agents_chat_images'));
        $this->assertSame('', $o->sanitizeUrl('javascript:alert(1)'));
        $this->assertSame('', $o->sanitizeUrl('file:///etc/passwd'));
    }

    public function testAllowsThisSite()
    {
        $o = new BxDolAiChatImages();
        $aRoot = parse_url(BX_DOL_URL_ROOT);
        $sHost = $aRoot['host'];
        $sPath = '/storage.php?o=sys_agents_chat_images&f=a.jpg';

        $this->assertNotSame('', $o->sanitizeUrl(rtrim(BX_DOL_URL_ROOT, '/') . $sPath));
        $this->assertStringContainsString($sHost, $o->sanitizeUrl($sPath));

        if (!filter_var($sHost, FILTER_VALIDATE_IP)) {
            $sWww = strncmp($sHost, 'www.', 4) === 0 ? substr($sHost, 4) : 'www.' . $sHost;
            $this->assertNotSame('', $o->sanitizeUrl($aRoot['scheme'] . '://' . $sWww . $sPath));
        }

        $this->assertSame('', $o->sanitizeUrl('https://' . $sHost . '.evil.test/storage.php'));
        $this->assertSame('', $o->sanitizeUrl('http://' . $sHost . '@169.254.169.254/storage.php'));
    }

    public function testMaxBytesFollowsStorage()
    {
        $oStorage = BxDolStorage::getObjectInstance('sys_agents_chat_images');
        if (!$oStorage)
            $this->markTestSkipped('Chat images storage is not installed.');

        $iMax = (int)($oStorage->getObjectData()['max_file_size'] ?? 0);
        $this->assertSame($iMax, (new BxDolAiChatImages())->maxBytes());
    }

    public function testAllowsStorageDomain()
    {
        $sDomain = trim((string)getParam('sys_storage_s3_domain'));
        if ($sDomain === '')
            $this->markTestSkipped('Storage domain is not configured.');

        $aDomain = parse_url(preg_match('#://#', $sDomain) ? $sDomain : 'https://' . $sDomain);
        $o = new BxDolAiChatImages();
        $this->assertNotSame('', $o->sanitizeUrl('https://' . $aDomain['host'] . '/sys_agents_chat_images/a.jpg'));
        $this->assertSame('', $o->sanitizeUrl('https://' . $aDomain['host'] . '.evil.test/sys_agents_chat_images/a.jpg'));
    }
}
