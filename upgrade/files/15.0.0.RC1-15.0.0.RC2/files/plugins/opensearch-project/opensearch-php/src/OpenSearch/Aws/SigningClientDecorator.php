<?php

namespace OpenSearch\Aws;

use Aws\Credentials\CredentialsInterface;
use Aws\Exception\CredentialsException;
use Aws\Signature\SignatureInterface;
use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Log\LoggerAwareInterface;
use Psr\Log\LoggerAwareTrait;

/**
 * A decorator client that signs requests using the provided AWS credentials and signer.
 */
class SigningClientDecorator implements ClientInterface, LoggerAwareInterface
{
    use LoggerAwareTrait;
    protected CredentialsInterface $credentials;
    protected ?\Closure $credentialProvider = null;

    /**
     * @param ClientInterface $inner The client to decorate.
     * @param callable|CredentialsInterface $credentialProvider The AWS credentials or a callable that returns credentials to use for signing requests.
     * @param SignatureInterface $signer The AWS signer to use for signing requests.
     * @param array $headers Additional headers to add to the request. `Host` is required.
     * @return void
     */
    public function __construct(
        protected ClientInterface $inner,
        callable|CredentialsInterface $credentialProvider,
        protected SignatureInterface $signer,
        protected array $headers = [],
    ) {
        if (is_callable($credentialProvider)) {
            $this->credentialProvider = \Closure::fromCallable($credentialProvider);
        } else {
            @trigger_error('Passing ' . CredentialsInterface::class . ' as the $credentialProvider param in ' . __METHOD__ . '() is deprecated in 2.7.1 and will be removed in 3.0.0. Pass a callable instead.', E_USER_DEPRECATED);
            $this->credentials = $credentialProvider;
        }
    }

    public function sendRequest(RequestInterface $request): ResponseInterface
    {
        foreach ($this->headers as $name => $value) {
            $request = $request->withHeader($name, $value);
        }

        if (empty($request->getHeaderLine('Host'))) {
            throw new \RuntimeException('Missing Host header.');
        }

        if (isset($this->credentialProvider)) {
            try {
                $credentials = ($this->credentialProvider)()->wait();
            } catch (CredentialsException $e) {
                $this->logger?->error('Failed to get AWS credentials: @message', ['@message' => $e->getMessage()]);
                throw $e;
            }
        } else {
            $credentials = $this->credentials;
        }

        $request = $request->withHeader('x-amz-content-sha256', hash('sha256', (string) $request->getBody()));
        $request = $this->signer->signRequest($request, $credentials);
        return $this->inner->sendRequest($request);
    }
}
