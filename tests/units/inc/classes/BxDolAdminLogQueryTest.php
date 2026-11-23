<?php

/**
 * sys_admin_log insert, and masking of secret values before they are stored.
 */
class BxDolAdminLogQueryTest extends BxDolTestCase
{
    public function testMaskHidesSecretValues(): void
    {
        $a = BxDolAdminLog::mask([
            'type' => 'secret',
            'name' => 'sys_smtp_password',
            'value' => 'real-secret',
            'password' => 'p',
            'title' => 'Keep',
        ]);

        $this->assertSame('secret', $a['type']);
        $this->assertSame('********', $a['value']);
        $this->assertSame('********', $a['password']);
        $this->assertSame('Keep', $a['title']);
        $this->assertSame('sys_smtp_password', $a['name']);
    }

    public function testAddStoresTheRow(): void
    {
        if (!BxDolDb::getInstance()->isTableExists('sys_admin_log'))
            $this->markTestSkipped('sys_admin_log is not installed.');

        $iId = BxDolAdminLogQuery::getInstance()->add([
            'added' => 1700000000,
            'profile_id' => 1,
            'source' => 'studio',
            'agent_id' => 0,
            'thread_id' => '',
            'object_type' => 'option',
            'object_id' => 'unit_test_admin_log',
            'action' => 'save',
            'before' => '{"value":"a"}',
            'after' => '{"value":"b"}',
            'ip' => '127.0.0.1',
        ]);

        try {
            $this->assertGreaterThan(0, $iId);
            $a = BxDolAdminLogQuery::getInstance()->getById($iId);
            $this->assertIsArray($a);
            $this->assertSame('option', $a['object_type']);
            $this->assertSame('unit_test_admin_log', $a['object_id']);
            $this->assertSame('save', $a['action']);
            $this->assertSame('{"value":"a"}', $a['before']);
            $this->assertSame('{"value":"b"}', $a['after']);
            $this->assertSame('studio', $a['source']);
            $this->assertSame('127.0.0.1', $a['ip']);
        }
        finally {
            if ($iId > 0)
                BxDolDb::getInstance()->query("DELETE FROM `sys_admin_log` WHERE `id` = :id", ['id' => $iId]);
        }
    }

    public function testRecordMasksASecretOption(): void
    {
        if (!BxDolDb::getInstance()->isTableExists('sys_admin_log'))
            $this->markTestSkipped('sys_admin_log is not installed.');

        $iId = BxDolAdminLog::record([
            'source' => 'studio',
            'object_type' => 'option',
            'object_id' => 'unit_test_admin_log_secret',
            'action' => 'save',
            'before' => ['type' => 'secret', 'value' => 'super-secret'],
            'after' => ['type' => 'secret_text', 'value' => 'new-secret', 'password' => 'hidden'],
        ], true);

        try {
            $this->assertGreaterThan(0, $iId);
            $a = BxDolAdminLogQuery::getInstance()->getById($iId);
            $this->assertStringContainsString('********', $a['before']);
            $this->assertStringNotContainsString('super-secret', $a['before']);
            $this->assertStringNotContainsString('new-secret', $a['after']);
            $this->assertStringNotContainsString('hidden', $a['after']);
            $this->assertStringContainsString('secret', $a['before']);
        }
        finally {
            if ($iId > 0)
                BxDolDb::getInstance()->query("DELETE FROM `sys_admin_log` WHERE `id` = :id", ['id' => $iId]);
        }
    }
}
