<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The ACL level names for the comments' member level class are the same for every comments
 * object, so a feed page that builds one comments object per post reads them once.
 */
#[Group('integration')]
class CmtsAclLevelsMemoTest extends BxDolIntegrationTestCase
{
    protected function memo(): ReflectionProperty
    {
        return new ReflectionProperty(BxBaseCmts::class, '_aAclId2NameMemo');
    }

    protected function levelsQueries(callable $fCallback): int
    {
        $oRecorder = new class {
            public array $aQueries = [];
            public function beginQuery($sSql) { $this->aQueries[] = preg_replace('/\s+/', ' ', $sSql); }
            public function __call($sName, $aArgs) { return null; }
        };

        $mixedPrevious = $GLOBALS['bx_profiler'] ?? null;
        $GLOBALS['bx_profiler'] = $oRecorder;
        try {
            $fCallback();
        }
        finally {
            if ($mixedPrevious !== null)
                $GLOBALS['bx_profiler'] = $mixedPrevious;
            else
                unset($GLOBALS['bx_profiler']);
        }

        return count(array_filter($oRecorder->aQueries, fn($s) => stripos($s, 'FROM `sys_acl_levels` AS `tal`') !== false));
    }

    public function testLevelsAreReadOncePerRequest(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $this->markTestSkipped('Timeline is not installed.');

        $this->memo()->setValue(null, []);

        $oFirst = null;
        $iFirst = $this->levelsQueries(function () use (&$oFirst) {
            $oFirst = new BxTemplCmts('bx_timeline', 1);
        });
        $oSecond = null;
        $iSecond = $this->levelsQueries(function () use (&$oSecond) {
            $oSecond = new BxTemplCmts('bx_timeline', 2);
        });

        $this->assertSame(1, $iFirst, 'The first comments object reads the levels.');
        $this->assertSame(0, $iSecond, 'The next one takes them from memory.');

        $aExpected = [];
        foreach (BxDolAcl::getInstance()->getMemberships(false, false, false) as $iAclId => $sAclName)
            $aExpected[$iAclId] = str_replace('_', '-', str_replace('_adm_prm_txt_level_', '', $sAclName));

        $this->assertNotEmpty($aExpected);
        $this->assertSame($aExpected, $this->bxGetProtected($oFirst, '_aAclId2Name', BxBaseCmts::class));
        $this->assertSame($aExpected, $this->bxGetProtected($oSecond, '_aAclId2Name', BxBaseCmts::class));
    }
}
