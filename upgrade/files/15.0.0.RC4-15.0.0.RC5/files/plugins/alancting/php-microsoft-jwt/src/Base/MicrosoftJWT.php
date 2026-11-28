<?php

namespace Alancting\Microsoft\JWT\Base;

use Alancting\Microsoft\JWT\JWT;
use \UnexpectedValueException;

abstract class MicrosoftJWT
{
    private $configuration;
    private $jwt;
    private $payload;

    private $audience;

    abstract protected function getIssuer();
    abstract protected function getAllowedAlgs();
    abstract protected function getDefaultAudience();

    public function __construct($configuration, $token, $audience = false, $allowed_algs = [])
    {
        $this->configuration = $configuration;
        $this->audience = (!$audience) ? $this->getDefaultAudience() : $audience;
        $this->decode($token, $allowed_algs);
    }

    public function isExpired()
    {
        return JWT::isExpired($this->payload);
    }

    public function getPayload()
    {
        return $this->payload;
    }

    public function getJWT()
    {
        return $this->jwt;
    }

    public function get($key)
    {
        return isset($this->getPayload()->{$key}) ? $this->getPayload()->{$key} : false;
    }

    protected function decode($jwt, $allowed_algs)
    {
        $this->jwt = $jwt;

        $payload = JWT::decode(
            $jwt,
            $this->getConfiguration()->getJWKs(),
            array_merge($this->getAllowedAlgs(), $allowed_algs)
        );

        $this->_validateIssuer($payload);
        $this->_validateAudience($payload);

        $this->payload = $payload;
    }

    protected function getConfiguration()
    {
        return $this->configuration;
    }

    private function _validateIssuer($payload)
    {
        if (!isset($payload->iss)) {
            throw new UnexpectedValueException('Missing issuer');
        }
        if ($payload->iss !== $this->getIssuer()) {
            throw new UnexpectedValueException('Invalid issuer: ' . $payload->iss);
        }
    }

    private function _validateAudience($payload)
    {
        if (!isset($payload->aud)) {
            throw new UnexpectedValueException('Missing audience');
        }
        if ($payload->aud !== $this->audience) {
            throw new UnexpectedValueException('Invalid audience: ' . $payload->aud);
        }
    }
}