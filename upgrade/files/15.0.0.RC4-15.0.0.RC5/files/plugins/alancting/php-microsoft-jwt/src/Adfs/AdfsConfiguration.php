<?php

namespace Alancting\Microsoft\JWT\Adfs;

use Alancting\Microsoft\JWT\Base\MicrosoftConfiguration;
use \UnexpectedValueException;

class AdfsConfiguration extends MicrosoftConfiguration
{
    private $base_url = 'https://{hostname}/adfs/.well-known/openid-configuration';

    private $hostname;

    public function __construct($options = [])
    {
        if (!isset($options['config_uri']) && !isset($options['hostname'])) {
            throw new UnexpectedValueException('Missing hostname');
        }

        if (isset($options['hostname'])) {
            $this->hostname = $options['hostname'];
        }

        $options['config_uri'] = isset($options['config_uri']) ? $options['config_uri'] : $this->getRemoteConfigUri();

        parent::__construct($options);
    }

    protected function getDefaultSigningAlgValues()
    {
        return ['RS256'];
    }

    private function getRemoteConfigUri()
    {
        return $this->replaceStr($this->base_url, 'hostname', $this->hostname);
    }
}