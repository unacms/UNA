<?php

/**
 * UNA proxy model: HMAC headers, and OpenAI tool_calls chunks parsed as a Neuron tool message.
 */
class BxDolAIProviderUnaProxyTest extends \PHPUnit\Framework\TestCase
{
    public function testMatchingKeyAndSecret()
    {
        $sBody = '{"model":"una-proxy","messages":[{"role":"user","content":"hi"}]}';
        $sSecret = 'right-secret';
        $oClient = new BxDolAIUnaProxyHttpClient('site-key', $sSecret);
        $aHeaders = $oClient->headersForBody($sBody);

        $this->assertSame('site-key', $aHeaders['X-Una-Key']);
        $this->assertSame(hash_hmac('sha256', $sBody, $sSecret), $aHeaders['X-Una-Sign']);
        $this->assertArrayNotHasKey('Authorization', $aHeaders);
        $this->assertNotContains($sSecret, $aHeaders);
    }

    public function testWrongSecretDoesNotMatch()
    {
        $sBody = '{"model":"una-proxy","messages":[{"role":"user","content":"hi"}]}';
        $oClient = new BxDolAIUnaProxyHttpClient('site-key', 'wrong-secret');
        $aHeaders = $oClient->headersForBody($sBody);

        $this->assertNotSame(hash_hmac('sha256', $sBody, 'right-secret'), $aHeaders['X-Una-Sign']);
        $this->assertArrayNotHasKey('Authorization', $aHeaders);
    }

    public function testEmptyKeyDoesNotBuildRequest()
    {
        $oHttp = $this->createMock(NeuronAI\HttpClient\HttpClientInterface::class);
        $oHttp->expects($this->never())->method('request');
        $oHttp->expects($this->never())->method('stream');
        $oHttp->expects($this->never())->method('withBaseUri');
        $oHttp->expects($this->never())->method('withHeaders');

        $this->expectException(Exception::class);
        new BxDolAIProviderUnaProxy('', 'secret', 'una-proxy', $oHttp);
    }

    public function testToolCallChunkBecomesNeuronToolMessage()
    {
        $aLines = [
            'data: ' . json_encode([
                'id' => 'chatcmpl-1',
                'choices' => [[
                    'index' => 0,
                    'delta' => [
                        'tool_calls' => [[
                            'index' => 0,
                            'id' => 'call_1',
                            'type' => 'function',
                            'function' => [
                                'name' => 'content_search',
                                'arguments' => '',
                            ],
                        ]],
                    ],
                ]],
            ]) . "\n",
            'data: ' . json_encode([
                'id' => 'chatcmpl-1',
                'choices' => [[
                    'index' => 0,
                    'delta' => [
                        'tool_calls' => [[
                            'index' => 0,
                            'function' => [
                                'arguments' => '{"keyword":"cats"}',
                            ],
                        ]],
                    ],
                ]],
            ]) . "\n",
            'data: ' . json_encode([
                'id' => 'chatcmpl-1',
                'choices' => [[
                    'index' => 0,
                    'delta' => new stdClass(),
                    'finish_reason' => 'tool_calls',
                ]],
            ]) . "\n",
            "data: [DONE]\n",
        ];

        $oProvider = new BxDolAIProviderUnaProxy(
            'site-key',
            'site-secret',
            'una-proxy',
            new BxDolAIProxyTestHttpClient(new BxDolAIProxyTestStream($aLines))
        );
        $oProvider->setTools([
            NeuronAI\Tools\Tool::make('content_search', 'Search content'),
        ]);

        $oGen = $oProvider->stream(new NeuronAI\Chat\Messages\UserMessage('find cats'));
        foreach ($oGen as $oChunk) {
        }
        $oMessage = $oGen->getReturn();

        $this->assertInstanceOf(NeuronAI\Chat\Messages\ToolCallMessage::class, $oMessage);
        $aTools = $oMessage->getTools();
        $this->assertCount(1, $aTools);
        $this->assertSame('content_search', $aTools[0]->getName());
        $this->assertSame(['keyword' => 'cats'], $aTools[0]->getInputs());
    }
}

class BxDolAIProxyTestStream implements NeuronAI\HttpClient\StreamInterface
{
    private int $iLine = 0;

    public function __construct(private array $aLines)
    {
    }

    public function eof(): bool
    {
        return $this->iLine >= count($this->aLines);
    }

    public function read(int $length): string
    {
        return '';
    }

    public function readLine(): string
    {
        if ($this->eof())
            return '';

        $sLine = $this->aLines[$this->iLine];
        $this->iLine++;
        return $sLine;
    }

    public function close(): void
    {
    }
}

class BxDolAIProxyTestHttpClient implements NeuronAI\HttpClient\HttpClientInterface
{
    public function __construct(private NeuronAI\HttpClient\StreamInterface $oStream)
    {
    }

    public function request(NeuronAI\HttpClient\HttpRequest $request): NeuronAI\HttpClient\HttpResponse
    {
        throw new Exception('request');
    }

    public function stream(NeuronAI\HttpClient\HttpRequest $request): NeuronAI\HttpClient\StreamInterface
    {
        return $this->oStream;
    }

    public function withBaseUri(string $baseUri): NeuronAI\HttpClient\HttpClientInterface
    {
        return $this;
    }

    public function withHeaders(array $headers): NeuronAI\HttpClient\HttpClientInterface
    {
        return $this;
    }

    public function withTimeout(float $timeout): NeuronAI\HttpClient\HttpClientInterface
    {
        return $this;
    }
}
