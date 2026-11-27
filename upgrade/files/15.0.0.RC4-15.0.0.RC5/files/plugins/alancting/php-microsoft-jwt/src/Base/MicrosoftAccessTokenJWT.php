<?php

namespace Alancting\Microsoft\JWT\Base;

abstract class MicrosoftAccessTokenJWT extends MicrosoftJWT
{
    protected function getIssuer()
    {
        return $this->getConfiguration()->getAccessTokenIssuer();
    }

    protected function getAllowedAlgs()
    {
        return $this->getConfiguration()->getTokenEndpointAuthSigingAlgValuesSupported();
    }
}