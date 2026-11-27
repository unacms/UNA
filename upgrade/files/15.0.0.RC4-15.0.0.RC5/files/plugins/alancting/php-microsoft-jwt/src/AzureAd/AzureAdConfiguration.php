<?php

namespace Alancting\Microsoft\JWT\AzureAd;

use Alancting\Microsoft\JWT\Base\MicrosoftConfiguration;
use \UnexpectedValueException;

/**
 * Doc:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc
 */
class AzureAdConfiguration extends MicrosoftConfiguration
{
    private $basr_url = 'https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration';
    
    private $tenant;
    private $tenant_id;
    
    public function __construct($options = [])
    {
        if (!isset($options['tenant'])) {
            throw new UnexpectedValueException('Missing tenant');
        }
        
        if (!isset($options['tenant_id'])) {
            throw new UnexpectedValueException('Missing tenant_id');
        }

        $this->tenant = $options['tenant'];
        $this->tenant_id = $options['tenant_id'];
       
        $options['config_uri'] = isset($options['config_uri']) ? $options['config_uri'] : $this->getRemoteConfigUri();
        
        parent::__construct($options);
    }

    protected function getDefaultSigningAlgValues()
    {
        return ['RS256'];
    }
    
    public function getTenant()
    {
        return $this->tenant;
    }
    
    public function getTenantId()
    {
        return $this->tenant_id;
    }

    public function getIssuer()
    {
        return $this->replaceTenantId(parent::getIssuer());
    }

    private function getRemoteConfigUri()
    {
        return $this->replaceStr($this->basr_url, 'tenant', $this->tenant);
    }

    private function replaceTenantId($str)
    {
        return $this->replaceStr($str, 'tenantid', $this->tenant_id);
    }
}