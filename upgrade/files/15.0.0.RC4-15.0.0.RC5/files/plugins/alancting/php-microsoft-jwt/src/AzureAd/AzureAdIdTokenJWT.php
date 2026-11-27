<?php

namespace Alancting\Microsoft\JWT\AzureAd;

use Alancting\Microsoft\JWT\Base\MicrosoftIdTokenJWT;

class AzureAdIdTokenJWT extends MicrosoftIdTokenJWT
{
    protected function getDefaultAudience()
    {
        return $this->getConfiguration()->getClientId();
    }
}