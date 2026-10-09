<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Connection objects must not create dynamic properties: on PHP 8.2+ that is an
 * E_DEPRECATED notice, and with display_errors on it is printed into API responses.
 */
class BxBaseConnectionTest extends BxDolTestCase
{
    #[DataProvider('providerForConnectionObjects')]
    public function testGetElementApiCreatesNoDynamicProperty($sObject, $sModule)
    {
        if ($sModule && !BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            $this->markTestSkipped($sModule . ' module is not installed.');

        // getObjectInstance caches the object; a cached one may already hold the property.
        $sKey = 'BxTemplConnection!' . $sObject;
        $mixedCached = $GLOBALS['bxDolClasses'][$sKey] ?? null;
        unset($GLOBALS['bxDolClasses'][$sKey]);

        $aErrors = [];
        set_error_handler(function ($iErrno, $sError) use (&$aErrors) {
            $aErrors[] = $sError;
            return true;
        }, E_DEPRECATED | E_USER_DEPRECATED);

        try {
            $o = BxDolConnection::getObjectInstance($sObject);
            $this->assertInstanceOf(BxBaseConnection::class, $o);

            $o->getElementAPI(1);
        }
        finally {
            restore_error_handler();

            unset($GLOBALS['bxDolClasses'][$sKey]);
            if ($mixedCached !== null)
                $GLOBALS['bxDolClasses'][$sKey] = $mixedCached;
        }

        $this->assertSame([], $aErrors);
        // A class name, not the object: ReflectionClass of an object also sees dynamic properties.
        $this->assertTrue((new ReflectionClass(get_class($o)))->hasProperty('_bApi'));
    }

    static public function providerForConnectionObjects()
    {
        return [
            ['sys_profiles_friends', ''],
            ['sys_profiles_subscriptions', ''],
            ['sys_profiles_relations', ''],
            ['bx_organizations_fans', 'bx_organizations'],
            ['bx_groups_fans', 'bx_groups'],
        ];
    }
}
