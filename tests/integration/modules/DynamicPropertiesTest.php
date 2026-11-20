<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * PHP 8.2 deprecates creating a property that the class does not declare. Anonymous Follow's config did it on every
 * page ("Creation of dynamic property BxAnonFollowConfig::$CNF is deprecated").
 */
#[Group('integration')]
class DynamicPropertiesTest extends BxDolIntegrationTestCase
{
    public function testEveryModuleIsMadeWithoutDynamicProperties(): void
    {
        $aDeprecations = [];
        set_error_handler(function ($iErrno, $sError, $sFile, $iLine) use (&$aDeprecations) {
            if (str_contains($sError, 'Creation of dynamic property'))
                $aDeprecations[] = $sError . ' in ' . $sFile . ':' . $iLine;
            return true;
        }, E_DEPRECATED | E_USER_DEPRECATED);

        try {
            foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'all', 'active' => 1]) as $aModule) {
                if ('system' == $aModule['name'])
                    continue;

                unset($GLOBALS['bxDolClasses'][$aModule['class_prefix'] . 'Module']);
                $oModule = BxDolModule::getInstance($aModule['name']);
                if (!$oModule)
                    continue;

                // the module makes these when they are first read
                foreach (['_oConfig', '_oDb', '_oTemplate'] as $sObject) {
                    try {
                        $oModule->$sObject;
                    }
                    catch (Throwable $e) {
                    }
                }
            }
        }
        finally {
            restore_error_handler();
        }

        $this->assertSame([], $aDeprecations);
    }

    /**
     * Properties that are set outside the constructor, so making the object does not show them.
     */
    public function testPropertiesAreDeclared(): void
    {
        $aCore = [
            'BxDolGrid' => ['_tmpOrderField', '_tmpOrderDir'],
            'BxDolWiki' => ['_aPages'],
            'BxDolCaptcha' => ['_error'],
            'BxBaseCmtsGridAdministration' => ['_oSelectedModule'],
        ];
        foreach ($aCore as $sClass => $aProps)
            foreach ($aProps as $sProp)
                $this->assertTrue((new ReflectionClass($sClass))->hasProperty($sProp), $sClass . '::$' . $sProp);

        $aModules = [
            'bx_anon_follow' => ['BxAnonFollowConfig' => ['CNF']],
            'bx_ads' => ['BxAdsSource' => ['_iProfileId']],
            'bx_posts' => ['BxPostsUploaderRecordVideo' => ['_sModule', '_oModule']],
            'bx_reviews' => ['BxReviewsGridVotingOptions' => ['MODULE']],
            'bx_se_migration' => ['BxSEMigTransfers' => ['MODULE', '_oModule'], 'BxSEMigStudioPage' => ['MODULE']],
            'bx_dolphin_migration' => [
                'BxDolMTransfers' => ['MODULE', '_oModule'],
                'BxDolMStudioPage' => ['MODULE'],
                'BxDolMConfig' => ['_bMediaModulesContent'],
                'BxDolMData' => ['_oConfig'],
                'BxDolMForum' => ['_sImageForumFiles'],
            ],
        ];
        foreach ($aModules as $sModule => $aClasses) {
            $aModule = BxDolModuleQuery::getInstance()->getModuleByName($sModule);
            if (empty($aModule) || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
                continue;

            BxDolModule::getInstance($sModule);
            foreach ($aClasses as $sClass => $aProps) {
                if (!class_exists($sClass, false))
                    require_once BX_DIRECTORY_PATH_MODULES . $aModule['path'] . 'classes/' . $sClass . '.php';

                foreach ($aProps as $sProp)
                    $this->assertTrue((new ReflectionClass($sClass))->hasProperty($sProp), $sClass . '::$' . $sProp);
            }
        }
    }
}
