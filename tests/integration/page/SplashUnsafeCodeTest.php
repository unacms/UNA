<?php

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Code an agent may not write into the guest splash (BxDolSplash::findUnsafe): the site serves it to every guest as
 * it is, so what a browser would run is refused, also when libxml reads the code differently.
 */
#[Group('integration')]
class SplashUnsafeCodeTest extends BxDolIntegrationTestCase
{
    #[DataProvider('providerForUnsafe')]
    public function testUnsafeCodeIsRefused(string $sCode)
    {
        $this->assertNotEmpty(BxDolSplash::getInstance()->findUnsafe($sCode));
    }

    static public function providerForUnsafe()
    {
        return [
            'script' => ['<p>Hi</p><script>alert(1)</script>'],
            'iframe' => ['<iframe src="https://example.com"></iframe>'],
            'handler' => ['<img src="x.png" onerror="alert(1)">'],
            'javascript link' => ['<a href="javascript:alert(1)">Go</a>'],
            'encoded javascript link' => ['<a href="java&#115;cript:alert(1)">Go</a>'],
            'srcdoc' => ['<div srcdoc="x"></div>'],
            'noscript differential' => ['<noscript><p title="</noscript><img src=x onerror=alert(1)>"></p></noscript>'],
            'template' => ['<template><p>Hi</p></template>'],
        ];
    }

    #[DataProvider('providerForSafe')]
    public function testSplashCodeIsAccepted(string $sCode)
    {
        $this->assertSame([], BxDolSplash::getInstance()->findUnsafe($sCode));
    }

    static public function providerForSafe()
    {
        return [
            'empty' => [''],
            'markers' => ['<div class="text-center"><h1>{site_title}</h1>__logo__ __login_form__</div>'],
            'styles and links' => ['<style>.hero { color: #333; }</style><p><a href="/create-account">Join</a> to see the online members.</p>'],
            'image' => ['<img src="data:image/png;base64,AAAA" alt="">'],
        ];
    }
}
