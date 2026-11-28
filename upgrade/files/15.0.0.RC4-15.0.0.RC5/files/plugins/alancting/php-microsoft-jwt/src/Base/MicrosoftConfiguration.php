<?php

namespace Alancting\Microsoft\JWT\Base;

use Alancting\Microsoft\JWT\JWK;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;
use Symfony\Component\Cache\Adapter\RedisAdapter;
use Symfony\Component\Cache\Adapter\MemcachedAdapter;

use \UnexpectedValueException;
use \InvalidArgumentException;

abstract class MicrosoftConfiguration
{
    abstract protected function getDefaultSigningAlgValues();

    const CACHE_KEY_CONFIGS = 'microsoft_jwt.configs_json';
    const CACHE_KEY_JWKS = 'microsoft_jwt.jwks_json';

    const CACHE_NAMESPACE = 'microsoft';
    const CACHE_LIFETIME = 0;

    private $options;
    private $config_uri;

    private $client_id;

    private $authorization_endpoint;
    private $token_endpoint;
    private $userinfo_endpoint;
    private $device_authorization_endpoint;
    private $end_session_endpoint;

    private $jwks_uri;

    private $issuer;
    private $access_token_issuer;

    private $id_token_signing_alg_values_supported;
    private $token_endpoint_auth_signing_alg_values_supported;

    private $jwks;

    private $loaded;
    private $load_error;

    private $cache = false;

    public function __construct($options = [])
    {
        if (!isset($options['config_uri'])) {
            throw new UnexpectedValueException('Missing config_uri');
        }

        if (!isset($options['client_id'])) {
            throw new UnexpectedValueException('Missing client_id');
        }

        if (isset($options['cache'])) {
            if (!is_array($options['cache'])) {
                throw new UnexpectedValueException('Invalid cache configuration');
            }

            if (!array_key_exists('type', $options['cache'])) {
                throw new UnexpectedValueException('Invalid cache configuration');
            }
            
            if (!in_array($options['cache']['type'], ['file', 'redis', 'memcache'])) {
                throw new UnexpectedValueException('Invalid cache type');
            }

            if ($options['cache']['type'] === 'file') {
                if (!array_key_exists('path', $options['cache'])) {
                    throw new UnexpectedValueException('Missing file path');
                }
                
                $directory = $options['cache']['path'];
                $this->cache = new FilesystemAdapter(self::CACHE_NAMESPACE, self::CACHE_LIFETIME, $directory);
            }

            if ($options['cache']['type'] === 'redis') {
                if (!array_key_exists('client', $options['cache'])) {
                    throw new UnexpectedValueException('Missing Redis client');
                }

                if (!is_a($options['cache']['client'], 'Redis') && !is_a($options['cache']['client'], 'Predis\Client')) {
                    throw new UnexpectedValueException('Invalid Redis client, must be Redis or Predis');
                }

                $this->cache = new RedisAdapter($options['cache']['client'], self::CACHE_NAMESPACE, self::CACHE_LIFETIME);
            }
            
            if ($options['cache']['type'] === 'memcache') {
                if (!array_key_exists('client', $options['cache'])) {
                    throw new UnexpectedValueException('Missing Memcached client');
                }

                if (!is_a($options['cache']['client'], 'Memcached')) {
                    throw new UnexpectedValueException('Invalid Memcached client');
                }

                $this->cache = new MemcachedAdapter($options['cache']['client'], self::CACHE_NAMESPACE, self::CACHE_LIFETIME);
            }
        }

        $this->config_uri = $options['config_uri'];
        $this->client_id = $options['client_id'];
        $this->options = $options;
        $this->_load();
    }

    public function getClientId()
    {
        return $this->client_id;
    }

    public function getConfigUri()
    {
        return $this->config_uri;
    }

    public function getJWKs()
    {
        return $this->jwks;
    }

    public function getIdTokenSigingAlgValuesSupported()
    {
        return $this->id_token_signing_alg_values_supported;
    }

    public function getTokenEndpointAuthSigingAlgValuesSupported()
    {
        return $this->token_endpoint_auth_signing_alg_values_supported;
    }

    public function getIssuer()
    {
        return $this->issuer;
    }

    public function getAccessTokenIssuer()
    {
        return $this->access_token_issuer;
    }

    public function getAuthorizationEndpoint()
    {
        return $this->authorization_endpoint;
    }

    public function getTokenEndpoint()
    {
        return $this->token_endpoint;
    }

    public function getUserInfoEndpoint()
    {
        return $this->userinfo_endpoint;
    }

    public function getDeviceAuthEndpoint()
    {
        return $this->device_authorization_endpoint;
    }

    public function getEndSessionEndpoint()
    {
        return $this->end_session_endpoint;
    }

    public function getLoadStatus()
    {
        $result = [
            'status' => $this->loaded,
        ];
        if (!$this->loaded) {
            $result['error'] = $this->load_error;
        }

        return $result;
    }

    protected function replaceStr($str, $key, $value)
    {
        return str_replace('{' . $key . '}', $value, $str);
    }

    private function _load()
    {
        try {
            $this->loaded = false;
            
            if ($this->cache !== false) {
                $cache_item_configs = $this->cache->getItem(self::CACHE_KEY_CONFIGS);
                if (!$cache_item_configs->isHit()) {
                    $cache_item_configs = $this->setCacheFromUrlOrFile(self::CACHE_KEY_CONFIGS, $this->config_uri);
                } else {
                    try {
                        $this->parseOpenIdConfigsFromJson($cache_item_configs->get());
                    } catch (\Exception $e) {
                        $cache_item_configs = $this->setCacheFromUrlOrFile(self::CACHE_KEY_CONFIGS, $this->config_uri);
                    }
                }
                $this->parseOpenIdConfigsFromJson($cache_item_configs->get());
            } else {
                $configs_json = $this->getFromUrlOrFile($this->config_uri);
                $this->parseOpenIdConfigsFromJson($configs_json);
            }
            
            if ($this->cache !== false) {
                $cache_item_jwks = $this->cache->getItem(self::CACHE_KEY_JWKS);
                if (!$cache_item_jwks->isHit()) {
                    $cache_item_jwks = $this->setCacheFromUrlOrFile(self::CACHE_KEY_JWKS, $this->jwks_uri);
                } else {
                    try {
                        $this->jwks = $this->getJwkFromJson($cache_item_jwks->get());
                    } catch (\Exception $e) {
                        $cache_item_jwks = $this->setCacheFromUrlOrFile(self::CACHE_KEY_JWKS, $this->jwks_uri);
                    }
                }
                $this->jwks = $this->getJwkFromJson($cache_item_jwks->get());
            } else {
                $jwks_json = $this->getFromUrlOrFile($this->jwks_uri);
                $this->jwks = $this->getJwkFromJson($jwks_json);
            }

            $this->loaded = true;
        } catch (\Exception $e) {
            $this->load_error = $e->getMessage();
        }
    }

    private function parseOpenIdConfigsFromJson($config_json) 
    {   
        
        try {
            $data = json_decode($config_json, true);
            if (!array_key_exists('authorization_endpoint', $data) || 
                !array_key_exists('token_endpoint', $data) || 
                !array_key_exists('userinfo_endpoint', $data) || 
                !array_key_exists('device_authorization_endpoint', $data) || 
                !array_key_exists('end_session_endpoint', $data) || 
                !array_key_exists('jwks_uri', $data) || 
                !array_key_exists('issuer', $data)) {
                throw new \Exception('Invalid configuration');
            }
            $this->authorization_endpoint = $data['authorization_endpoint'];
            $this->token_endpoint = $data['token_endpoint'];
            $this->userinfo_endpoint = $data['userinfo_endpoint'];
            $this->device_authorization_endpoint = $data['device_authorization_endpoint'];
            $this->end_session_endpoint = $data['end_session_endpoint'];
            $this->jwks_uri = $data['jwks_uri'];
            $this->issuer = $data['issuer'];
            $this->access_token_issuer = (isset($data['access_token_issuer'])) ? $data['access_token_issuer'] : $this->issuer;
            $this->id_token_signing_alg_values_supported = isset($data['id_token_signing_alg_values_supported']) ? $data['id_token_signing_alg_values_supported'] : $this->getDefaultSigningAlgValues();
            $this->token_endpoint_auth_signing_alg_values_supported = isset($data['token_endpoint_auth_signing_alg_values_supported']) ? $data['token_endpoint_auth_signing_alg_values_supported'] : $this->getDefaultSigningAlgValues();
        } catch (\Exception $e) {
            throw new \Exception('Invalid configuration');
        } 
    }

    private function getFromUrlOrFile($uri)
    {
        $targetUri = $uri;
        if (filter_var($uri, FILTER_VALIDATE_URL) === false) {
            $targetUri = realpath($uri) === false ? __DIR__ . $uri : $uri;
            $result = @file_get_contents($targetUri);
        } else {
            $ch = curl_init($uri);
            curl_setopt($ch, CURLOPT_HTTPGET, true);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $result = curl_exec($ch);
            curl_close($ch);
        }

        if ($result === false) {
            throw new \Exception('Configuration not found');
        }

        return $result;
    }

    private function setCacheFromUrlOrFile($key, $uri) {
        $cache_item = $this->cache->getItem($key);
        $data = $this->getFromUrlOrFile($uri);
        $cache_item->set($data);
        $this->cache->save($cache_item);

        return $cache_item;
    }

    private function getJwkFromJson($json) {
        $data = json_decode($json, true);
        return JWK::parseKeySet($data);
    }
}