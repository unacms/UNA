<?php

declare(strict_types=1);

namespace OpenSearch\Aws;

use Aws\Credentials\CredentialProvider;
use Aws\Credentials\Credentials;
use Aws\Signature\SignatureInterface;
use Aws\Signature\SignatureV4;
use Psr\Http\Client\ClientInterface;
use Psr\Log\LoggerInterface;

/**
 * A factory for creating an HTTP Client that signs requests using AWS credentials.
 */
class SigningClientFactory
{
    /**
     * The allowed AWS services.
     */
    public const ALLOWED_SERVICES = ['es', 'aoss'];

    protected ?\Closure $provider;

    /**
     * @param SignatureInterface|null $signer
     *   The request signer.
     * @param callable|CredentialProvider|null $provider
     *   A credential provider callable. Passing a CredentialProvider instance is
     *   deprecated; use a callable (e.g. the result of CredentialProvider::sso()).
     * @param LoggerInterface|null $logger
     *   The logger.
     */
    public function __construct(
        protected ?SignatureInterface $signer = null,
        callable|CredentialProvider|null $provider = null,
        protected ?LoggerInterface $logger = null,
    ) {
        if ($provider instanceof CredentialProvider) {
            @trigger_error(
                'Passing a CredentialProvider instance to ' . self::class . ' is deprecated and will be removed in a future release. Pass a callable instead, e.g. the result of CredentialProvider::sso() or CredentialProvider::defaultProvider().',
                \E_USER_DEPRECATED,
            );
            $provider = null;
        }

        $this->provider = $provider !== null ? \Closure::fromCallable($provider) : null;
    }

    /**
     * Creates a new signing client.
     *
     * @param ClientInterface $innerClient
     *   The decorated inner HTTP client.
     * @param array<string,mixed> $options
     *   The AWS auth options.
     */
    public function create(ClientInterface $innerClient, array $options): ClientInterface
    {
        if (!isset($options['host'])) {
            throw new \InvalidArgumentException('The host option is required.');
        }

        // Get the credentials.
        $provider = $this->getCredentialProvider($options);

        // Get the signer.
        $signer = $this->getSigner($options);

        return new SigningClientDecorator($innerClient, $provider, $signer, ['host' => $options['host']]);
    }

    /**
     * Gets the credential provider.
     *
     * @param array<string,mixed> $options
     *   The options array.
     */
    protected function getCredentialProvider(array $options): callable
    {
        // Check for a provided credential provider.
        if ($this->provider) {
            return $this->provider;
        }

        // Check for provided access key and secret.
        if (isset($options['credentials'])) {
            return CredentialProvider::fromCredentials(
                new Credentials(
                    $options['credentials']['access_key'] ?? '',
                    $options['credentials']['secret_key'] ?? '',
                    $options['credentials']['session_token'] ?? null,
                )
            );
        }

        // Fallback to the default provider.
        return CredentialProvider::defaultProvider();
    }

    /**
     * Gets the request signer.
     *
     * @param array<string,mixed> $options
     *   The options.
     */
    protected function getSigner(array $options): SignatureInterface
    {
        if ($this->signer) {
            return $this->signer;
        }

        if (!isset($options['region'])) {
            throw new \InvalidArgumentException('The region option is required.');
        }

        $service = $options['service'] ?? 'es';

        if (!in_array($service, self::ALLOWED_SERVICES, true)) {
            throw new \InvalidArgumentException('The service option must be either "es" or "aoss".');
        }

        return new SignatureV4($service, $options['region'], $options);
    }

}
