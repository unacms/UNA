<?php

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\Before;

define('BX_SKIP_INSTALL_CHECK', 1);

$aPathInfo = pathinfo(__FILE__);
$sHeaderPath = $aPathInfo['dirname'] . '/../inc/header.inc.php';
if (!file_exists($sHeaderPath))
    die("Script is not installed\n");

require_once($sHeaderPath);

class BxDolTestCase extends \PHPUnit\Framework\TestCase
{
    /**
     * @var list<callable>|null
     */
    private $_aExceptionHandlersBackup;

    #[Before]
    protected function bxSnapshotExceptionHandlers(): void
    {
        $this->_aExceptionHandlersBackup = $this->bxActiveExceptionHandlers();
    }

    #[After]
    protected function bxRestoreExceptionHandlers(): void
    {
        if ($this->_aExceptionHandlersBackup === null)
            return;

        foreach ($this->bxActiveExceptionHandlers() as $mixedIgnored)
            restore_exception_handler();

        foreach ($this->_aExceptionHandlersBackup as $mixedHandler)
            set_exception_handler($mixedHandler);

        $this->_aExceptionHandlersBackup = null;
    }

    /**
     * @return list<callable>
     */
    private function bxActiveExceptionHandlers(): array
    {
        $aHandlers = [];

        while (true) {
            $mixedHandler = set_exception_handler(static function (): void {});
            restore_exception_handler();

            if ($mixedHandler === null)
                break;

            $aHandlers[] = $mixedHandler;
            restore_exception_handler();
        }

        $aHandlers = array_reverse($aHandlers);
        foreach ($aHandlers as $mixedHandler)
            set_exception_handler($mixedHandler);

        return $aHandlers;
    }

    protected function bxRequireAntispam()
    {
        bx_import('BxDolModule');
        $oModule = BxDolModule::getInstance('bx_antispam');
        if (!$oModule)
            $this->markTestSkipped('bx_antispam module is not installed.');

        if (!BxDolDb::getInstance()->isTableExists('bx_antispam_dnsbl_rules'))
            $this->markTestSkipped('bx_antispam module is not installed (table bx_antispam_dnsbl_rules is missing).');

        return $oModule;
    }

    protected function bxRequirePosts()
    {
        bx_import('BxDolModule');
        $oModule = BxDolModule::getInstance('bx_posts');
        if (!$oModule)
            $this->markTestSkipped('bx_posts module is not installed.');

        if (!BxDolDb::getInstance()->isTableExists('bx_posts_posts'))
            $this->markTestSkipped('bx_posts module is not installed (table bx_posts_posts is missing).');

        return $oModule;
    }

    protected function bxRequirePersons()
    {
        bx_import('BxDolModule');
        $oModule = BxDolModule::getInstance('bx_persons');
        if (!$oModule)
            $this->markTestSkipped('bx_persons module is not installed.');

        if (!BxDolDb::getInstance()->isTableExists('bx_persons_data'))
            $this->markTestSkipped('bx_persons module is not installed (table bx_persons_data is missing).');

        return $oModule;
    }

    protected function bxCallProtected($o, $sMethod, ...$aArgs)
    {
        $oMethod = new ReflectionMethod($o, $sMethod);
        return $oMethod->invokeArgs($o, $aArgs);
    }

    protected function bxCallProtectedArgs($o, $sMethod, array $aArgs)
    {
        $oMethod = new ReflectionMethod($o, $sMethod);
        return $oMethod->invokeArgs($o, $aArgs);
    }

    protected function bxGetProtected($o, $sProperty, $sClass = null)
    {
        return (new ReflectionProperty($sClass ?: $o, $sProperty))->getValue($o);
    }

    protected function bxSetProtected($o, $sProperty, $mixedValue, $sClass = null)
    {
        (new ReflectionProperty($sClass ?: $o, $sProperty))->setValue($o, $mixedValue);
    }

    protected function bxModuleInstances(BxDolModule $oModule, ?array $aReplace = null): array
    {
        $oProperty = new ReflectionProperty(BxDolModule::class, '_aInstancesStorage');
        $aCurrent = $oProperty->getValue($oModule) ?: [];
        if ($aReplace !== null)
            $oProperty->setValue($oModule, $aReplace);

        return $aCurrent;
    }

    function bxMockGet ($sClass, $aModule = array(), $bDisableContructor = false)
    {
        if ($aModule)
            bx_import(bx_ltrim_str($sClass, $aModule['class_prefix']), $aModule);
        else
            bx_import($sClass);

        if ($bDisableContructor) {
            $GLOBALS['bxDolClasses'][$sClass] = $this->getMockBuilder($sClass)
                ->disableOriginalConstructor()
                ->getMock();
        } else {
            $GLOBALS['bxDolClasses'][$sClass] = $this->createMock($sClass);
        }

        return $GLOBALS['bxDolClasses'][$sClass];
    }

    function bxMockFree (&$o)
    {
        if (!$o)
            return;

        // PHPUnit 12 names doubles MockObject_* / TestStub_*; older versions used Mock_*.
        $sClassName = preg_replace('/^(?:MockObject|TestStub|Mock)_/', '', get_class($o));
        $sClassName = preg_replace('/_[A-Za-z0-9]+$/', '', $sClassName);
        unset($GLOBALS['bxDolClasses'][$sClassName]);
        unset($o);
    }

}

require_once dirname(__FILE__) . '/units/modules/boonex/posts/BxPostsTestCase.php';
require_once dirname(__FILE__) . '/units/modules/boonex/persons/BxPersonsTestCase.php';
