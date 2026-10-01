<?php

namespace OpenSearch;

use OpenSearch\Exception\HttpExceptionFactory;
use OpenSearch\Serializers\SerializerInterface;
use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestInterface;

/**
 * Transport that uses PSR-7, PSR-17 and PSR-18 interfaces.
 */
final class HttpTransport implements TransportInterface
{
    public function __construct(
        protected ClientInterface $client,
        protected RequestFactoryInterface $requestFactory,
        protected SerializerInterface $serializer,
    ) {
    }

    /**
     * Create a new request.
     */
    public function createRequest(string $method, string $uri, array $params = [], mixed $body = null, array $headers = []): RequestInterface
    {
        return $this->requestFactory->createRequest($method, $uri, $params, $body, $headers);
    }

    /**
     * {@inheritdoc}
     */
    public function sendRequest(
        string $method,
        string $uri,
        array $params = [],
        mixed $body = null,
        array $headers = [],
    ): iterable|string {
        // @todo Remove support for legacy options in 3.0.0.
        // @phpstan-ignore isset.offset
        if (isset($headers['client']['headers'])) {
            $headers = array_merge($headers, $headers['client']['headers']);
        }
        unset($headers['client']);
        $request = $this->createRequest($method, $uri, $params, $body, $headers);
        $response = $this->client->sendRequest($request);
        $statusCode = $response->getStatusCode();
        $responseBody = $response->getBody()->getContents();
        $responseHeaders = $response->getHeaders();
        $data = $this->serializer->deserialize($responseBody, $responseHeaders);
        // Status code >= 200 < 300 is a success.
        // Status code >= 300 < 400 is a redirect and should be handled by the client.
        if ($statusCode >= 400) {
            // Throw an HTTP exception.
            throw HttpExceptionFactory::create($statusCode, $data);
        }
        return $data;
    }

}
