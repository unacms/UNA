<?php

/**
 * An agent with no knowledge store must not read NeuronAI's embeddings provider.
 * A una-proxy store searches the master and does not need a local embedding model.
 */
class BxDolAiAgentRetrievalTest extends \PHPUnit\Framework\TestCase
{
    public function testAgentWithoutStoreSkipsEmbeddings()
    {
        $o = new BxDolAiAgent(['id' => 1, 'vector_store_id' => 0]);
        $oRetrieval = $o->resolveRetrieval();

        $this->assertInstanceOf(BxDolAiRetrievalNone::class, $oRetrieval);
        $this->assertSame([], $oRetrieval->retrieve(new NeuronAI\Chat\Messages\UserMessage('hello')));
    }

    public function testUnaProxyStoreSkipsEmbeddings()
    {
        $o = new BxDolAiAgent([
            'id' => 1,
            'vector_store_id' => 9,
            'vector_store_type' => 'una-proxy',
        ]);

        $this->assertInstanceOf(BxDolAiRetrievalUnaProxy::class, $o->resolveRetrieval());
    }

    public function testStoreWithoutEmbeddingModelIsRejected()
    {
        $o = new BxDolAiAgent(['id' => 1, 'vector_store_id' => 9]);

        try {
            $o->resolveRetrieval();
            $this->fail('Retrieval must not run without an embedding model');
        } catch (Exception $oException) {
            $this->assertSame('Vector store 9 has no embedding model', $oException->getMessage());
        }
    }

    public function testConfiguredEmbeddingModelUsesSimilarityRetrieval()
    {
        $o = new BxDolAiAgent(['id' => 1, 'vector_store_id' => 0]);
        $o->setEmbeddingsProvider(new BxDolAiAgentRetrievalTestEmbeddings());

        $this->assertInstanceOf(
            NeuronAI\RAG\Retrieval\SimilarityRetrieval::class,
            $o->resolveRetrieval()
        );
    }
}

class BxDolAiAgentRetrievalTestEmbeddings implements NeuronAI\RAG\Embeddings\EmbeddingsProviderInterface
{
    public function embedText(string $text): array
    {
        return [0.0];
    }

    public function embedDocument(NeuronAI\RAG\Document $document): NeuronAI\RAG\Document
    {
        $document->embedding = [0.0];
        return $document;
    }

    public function embedDocuments(array $documents): array
    {
        foreach ($documents as $document)
            $this->embedDocument($document);

        return $documents;
    }
}
