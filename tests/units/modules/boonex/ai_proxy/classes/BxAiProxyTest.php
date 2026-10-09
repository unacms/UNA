<?php

/**
 * Master proxy auth and model selection. Loaded without enabling bx_ai_proxy.
 */
class BxAiProxyTest extends \PHPUnit\Framework\TestCase
{
    public static function setUpBeforeClass(): void
    {
        require_once BX_DIRECTORY_PATH_MODULES . 'boonex/ai_proxy/classes/BxAiProxyAuth.php';
        require_once BX_DIRECTORY_PATH_MODULES . 'boonex/ai_proxy/classes/BxAiProxyCompletion.php';
    }

    public function testMatchingKeyAndSecret()
    {
        $sBody = '{"model":"gpt-not-the-studio-model"}';
        $sSecret = 'client-secret';
        $sSign = hash_hmac('sha256', $sBody, $sSecret);
        $bLookup = false;

        $aResult = (new BxAiProxyAuth())->authenticate('site-key', $sSign, $sBody, function (string $sKey) use (&$bLookup, $sSecret) {
            $bLookup = true;
            $this->assertSame('site-key', $sKey);
            return ['client_id' => $sKey, 'client_secret' => $sSecret];
        });

        $this->assertTrue($bLookup);
        $this->assertTrue($aResult['ok']);
        $this->assertSame(200, $aResult['code']);
    }

    public function testWrongSecretIsUnauthorized()
    {
        $sBody = '{"model":"gpt-not-the-studio-model"}';
        $aResult = (new BxAiProxyAuth())->authenticate('site-key', hash_hmac('sha256', $sBody, 'other-secret'), $sBody, function () {
            return ['client_id' => 'site-key', 'client_secret' => 'client-secret'];
        });

        $this->assertFalse($aResult['ok']);
        $this->assertSame(401, $aResult['code']);
    }

    public function testEmptyKeyDoesNotLookUp()
    {
        $bLookup = false;
        $aResult = (new BxAiProxyAuth())->authenticate('', 'sign', '{}', function () use (&$bLookup) {
            $bLookup = true;
            return ['client_secret' => 'client-secret'];
        });

        $this->assertFalse($bLookup);
        $this->assertFalse($aResult['ok']);
        $this->assertSame(401, $aResult['code']);
    }

    public function testRequestModelDoesNotSelectTheProvider()
    {
        $sBodyModel = 'gpt-not-the-studio-model';
        $iSeen = 0;
        $oProvider = new BxAiProxyTestProvider();

        $sJson = (new BxAiProxyCompletion())->run([
            'model' => $sBodyModel,
            'temperature' => 0.2,
            'max_tokens' => 16,
            'top_p' => 0.5,
            'messages' => [
                ['role' => 'user', 'content' => 'hello'],
            ],
            'stream' => false,
        ], 42, function (int $iId) use (&$iSeen, $oProvider) {
            $iSeen = $iId;
            return $oProvider;
        });

        $this->assertSame(42, $iSeen);
        $this->assertFalse($oProvider->saw($sBodyModel));
        $this->assertIsString($sJson);
        $this->assertStringNotContainsString($sBodyModel, $sJson);
    }

    public function testNestedToolSchemaKeepsArrayItemsAndObjectProperties()
    {
        $oProvider = new BxAiProxyTestProvider();
        (new BxAiProxyCompletion())->run([
            'messages' => [
                ['role' => 'user', 'content' => 'search'],
            ],
            'tools' => [[
                'type' => 'function',
                'function' => [
                    'name' => 'content_search',
                    'description' => 'Search content',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'keyword' => [
                                'type' => 'string',
                                'description' => 'The keyword to search for.',
                            ],
                            'sections' => [
                                'type' => 'array',
                                'description' => 'List of sections to search in.',
                                'items' => [
                                    'type' => 'string',
                                    'description' => 'Section name.',
                                ],
                            ],
                            'data' => [
                                'type' => 'array',
                                'description' => 'Fields to write.',
                                'minItems' => 1,
                                'maxItems' => 8,
                                'items' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'name' => ['type' => 'string', 'description' => 'Parameter name'],
                                        'value' => ['type' => 'string', 'description' => 'Parameter value'],
                                    ],
                                    'required' => ['name', 'value'],
                                ],
                            ],
                        ],
                        'required' => ['keyword', 'data'],
                    ],
                ],
            ]],
        ], 7, function () use ($oProvider) {
            return $oProvider;
        });

        $this->assertCount(1, $oProvider->aTools);
        $aMapped = (new NeuronAI\Providers\OpenAI\ToolMapper())->map($oProvider->aTools);
        $aProperties = $aMapped[0]['function']['parameters']['properties'];

        $this->assertSame(['keyword', 'data'], $aMapped[0]['function']['parameters']['required']);
        $this->assertSame('string', $aProperties['sections']['items']['type']);
        $this->assertSame('Section name.', $aProperties['sections']['items']['description']);
        $this->assertSame('object', $aProperties['data']['items']['type']);
        $this->assertSame('string', $aProperties['data']['items']['properties']['name']['type']);
        $this->assertSame(['name', 'value'], $aProperties['data']['items']['required']);
        $this->assertSame(1, $aProperties['data']['minItems']);
        $this->assertSame(8, $aProperties['data']['maxItems']);
    }
}

class BxAiProxyTestProvider implements NeuronAI\Providers\AIProviderInterface
{
    public string $sSystem = '';

    /** @var list<NeuronAI\Chat\Messages\Message> */
    public array $aMessages = [];

    /** @var list<NeuronAI\Tools\ToolInterface> */
    public array $aTools = [];

    public function systemPrompt(?string $prompt): NeuronAI\Providers\AIProviderInterface
    {
        $this->sSystem = (string)$prompt;
        return $this;
    }

    public function setTools(array $tools): NeuronAI\Providers\AIProviderInterface
    {
        $this->aTools = $tools;
        return $this;
    }

    public function messageMapper(): NeuronAI\Providers\MessageMapperInterface
    {
        throw new Exception('unused');
    }

    public function toolPayloadMapper(): NeuronAI\Providers\ToolMapperInterface
    {
        throw new Exception('unused');
    }

    public function chat(NeuronAI\Chat\Messages\Message ...$messages): NeuronAI\Chat\Messages\Message
    {
        $this->aMessages = $messages;
        return new NeuronAI\Chat\Messages\AssistantMessage('ok');
    }

    public function stream(NeuronAI\Chat\Messages\Message ...$messages): Generator
    {
        $this->aMessages = $messages;
        yield new NeuronAI\Chat\Messages\Stream\Chunks\TextChunk('m', 'ok');
        return new NeuronAI\Chat\Messages\AssistantMessage('ok');
    }

    public function structured(array|NeuronAI\Chat\Messages\Message $messages, string $class, array $response_schema): NeuronAI\Chat\Messages\Message
    {
        throw new Exception('unused');
    }

    public function setHttpClient(NeuronAI\HttpClient\HttpClientInterface $client): NeuronAI\Providers\AIProviderInterface
    {
        return $this;
    }

    public function saw(string $sNeedle): bool
    {
        if (str_contains($this->sSystem, $sNeedle))
            return true;

        foreach ($this->aMessages as $oMessage) {
            if (str_contains((string)$oMessage->getContent(), $sNeedle))
                return true;
        }

        foreach ($this->aTools as $oTool) {
            if (str_contains($oTool->getName(), $sNeedle) || str_contains((string)$oTool->getDescription(), $sNeedle))
                return true;
        }

        return false;
    }
}
