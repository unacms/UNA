<?php

/**
 * Remote knowledge retrieval signs the raw JSON body and maps master documents.
 */
class BxDolAiRetrievalUnaProxyTest extends BxDolTestCase
{
    public function testSignedBodyMapsDocuments()
    {
        $sSecret = 'client-secret';
        $sSeenBody = '';
        $aSeenHeaders = [];
        $o = new BxDolAiRetrievalUnaProxy('site-key', $sSecret, function (string $sBody, array $aHeaders) use (&$sSeenBody, &$aSeenHeaders) {
            $sSeenBody = $sBody;
            $aSeenHeaders = $aHeaders;
            return [
                'code' => 200,
                'body' => json_encode([
                    'documents' => [[
                        'content' => 'Pages are blocks.',
                        'sourceType' => 'file',
                        'sourceName' => 'pages.md',
                        'score' => 0.82,
                        'embedding' => [0.1, 0.2],
                    ]],
                ]),
            ];
        });

        $aDocuments = $o->retrieve(new NeuronAI\Chat\Messages\UserMessage('how do pages work'));
        $sExpected = BxDolAIUnaProxyHttpClient::encodeBody(['query' => 'how do pages work']);

        $this->assertSame($sExpected, $sSeenBody);
        $this->assertContains('X-Una-Key: site-key', $aSeenHeaders);
        $this->assertContains('X-Una-Sign: ' . BxDolAIUnaProxyHttpClient::sign($sExpected, $sSecret), $aSeenHeaders);
        $this->assertNotContains($sSecret, $aSeenHeaders);
        $this->assertCount(1, $aDocuments);
        $this->assertSame('Pages are blocks.', $aDocuments[0]->getContent());
        $this->assertSame('file', $aDocuments[0]->getSourceType());
        $this->assertSame('pages.md', $aDocuments[0]->getSourceName());
        $this->assertEqualsWithDelta(0.82, $aDocuments[0]->getScore(), 0.0001);
        $this->assertSame([], $aDocuments[0]->getEmbedding());
    }

    public function testFailedResponseReturnsNoDocuments()
    {
        $o = new BxDolAiRetrievalUnaProxy('site-key', 'secret', function () {
            return ['code' => 503, 'body' => ''];
        });

        $this->assertSame([], $o->retrieve(new NeuronAI\Chat\Messages\UserMessage('how do pages work')));
    }

    public function testEmptySecretDoesNotPost()
    {
        $bPosted = false;
        $o = new BxDolAiRetrievalUnaProxy('site-key', '', function () use (&$bPosted) {
            $bPosted = true;
            return ['code' => 200, 'body' => '{"documents":[]}'];
        });

        $this->assertSame([], $o->retrieve(new NeuronAI\Chat\Messages\UserMessage('how do pages work')));
        $this->assertFalse($bPosted);
    }
}
