<?php

class BxDolStudioAgentsProtectedRecordsAgentsProxy extends BxBaseStudioAgentsAgents
{
    public function deleteRecord($iId)
    {
        return $this->_delete($iId);
    }

    protected function _getAgentObjectById($iId)
    {
        return ['id' => $iId, 'name' => 'una_operator'];
    }
}

class BxDolStudioAgentsProtectedRecordsModelsProxy extends BxBaseStudioAgentsModels
{
    public function deleteRecord($iId)
    {
        return $this->_delete($iId);
    }
}

class BxDolStudioAgentsProtectedRecordsKnowledgeProxy extends BxBaseStudioAgentsVectorStore
{
    public function deleteRecord($iId)
    {
        return $this->_delete($iId);
    }
}

class BxDolStudioAgentsProtectedRecordsTest extends BxDolTestCase
{
    public function testUnaOperatorCannotBeDeletedThroughGridHandler()
    {
        $oGrid = (new ReflectionClass(BxDolStudioAgentsProtectedRecordsAgentsProxy::class))->newInstanceWithoutConstructor();

        $this->assertFalse($oGrid->deleteRecord(1));
        $this->assertSame('', $this->bxCallProtected($oGrid, '_getActionDelete', 'single', 'delete', [], true, false, ['name' => 'una_operator']));
    }

    public function testUnaProxyModelCannotBeDeletedThroughGridHandler()
    {
        $oDb = $this->getMockBuilder(BxDolStudioAgentsQuery::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getModelsBy'])
            ->getMock();
        $oDb->expects($this->once())
            ->method('getModelsBy')
            ->willReturn(['id' => 1, 'type' => 'una-proxy', 'duplicate' => 1]);

        $oGrid = (new ReflectionClass(BxDolStudioAgentsProtectedRecordsModelsProxy::class))->newInstanceWithoutConstructor();
        $this->bxSetProtected($oGrid, '_oDb', $oDb, BxDolStudioGridAgents::class);

        $this->assertFalse($oGrid->deleteRecord(1));
        $this->assertSame('', $this->bxCallProtected($oGrid, '_getActionDelete', 'single', 'delete', [], true, false, ['type' => 'una-proxy', 'duplicate' => 1]));
    }

    public function testUnaProxyKnowledgeCannotBeDeletedThroughGridHandler()
    {
        $oDb = $this->getMockBuilder(BxDolStudioAgentsQuery::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getVectorStoreById'])
            ->getMock();
        $oDb->expects($this->once())
            ->method('getVectorStoreById')
            ->willReturn(['id' => 1, 'type' => 'una-proxy', 'duplicate' => 1]);

        $oGrid = (new ReflectionClass(BxDolStudioAgentsProtectedRecordsKnowledgeProxy::class))->newInstanceWithoutConstructor();
        $this->bxSetProtected($oGrid, '_oDb', $oDb, BxDolStudioGridAgents::class);

        $this->assertFalse($oGrid->deleteRecord(1));
        $this->assertSame('', $this->bxCallProtected($oGrid, '_getActionDelete', 'single', 'delete', [], true, false, ['type' => 'una-proxy', 'duplicate' => 1]));
        $this->assertSame('', $this->bxCallProtected($oGrid, '_getActionAddData', 'single', 'add_data', [], true, false, ['type' => 'una-proxy']));
        $this->assertSame('', $this->bxCallProtected($oGrid, '_getActionDuplicate', 'single', 'duplicate', [], true, false, ['type' => 'una-proxy']));
        $this->assertSame('', $this->bxCallProtected($oGrid, '_getActionEdit', 'single', 'edit', [], true, false, ['type' => 'una-proxy']));
    }
}
