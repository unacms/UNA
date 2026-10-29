<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * BxDolRequest::serviceExists by module name takes the module and its `enabled` flag
 * from the modules list: a service of an enabled module exists, one of an unknown or
 * disabled module doesn't, unless inactive modules are asked for.
 */
#[Group('integration')]
class RequestServiceExistsTest extends BxDolIntegrationTestCase
{
    public function testEnabledAndUnknownModules(): void
    {
        $this->assertTrue(BxDolRequest::serviceExists('system', 'get_menu', 'TemplServices'));
        $this->assertFalse(BxDolRequest::serviceExists('system', 'no_such_service_phpunit', 'TemplServices'));
        $this->assertFalse(BxDolRequest::serviceExists('bx_no_such_module_phpunit', 'get_menu'));
    }

    public function testDisabledModule(): void
    {
        $aModule = BxDolDb::getInstance()->getRow("SELECT `name`, `class_prefix` FROM `sys_modules` WHERE `enabled` = 0 AND `name` <> 'system' ORDER BY `id` LIMIT 1");
        if (empty($aModule))
            $this->markTestSkipped('No module is installed and disabled.');

        $this->assertFalse(BxDolRequest::serviceExists($aModule['name'], 'get_safe_services'));
        $this->assertSame(
            BxDolModuleQuery::getInstance()->isEnabledByName($aModule['name']),
            BxDolRequest::serviceExists($aModule['name'], 'get_safe_services'),
            'The same answer the enabled check gives.'
        );
    }
}
