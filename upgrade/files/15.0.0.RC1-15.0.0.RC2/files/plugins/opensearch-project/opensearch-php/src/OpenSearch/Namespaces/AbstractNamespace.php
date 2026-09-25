<?php

declare(strict_types=1);

/**
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * OpenSearch PHP client
 *
 * @link      https://github.com/opensearch-project/opensearch-php/
 * @copyright Copyright (c) Elasticsearch B.V (https://www.elastic.co)
 * @license   http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
 * @license   https://www.gnu.org/licenses/lgpl-2.1.html GNU Lesser General Public License, Version 2.1
 *
 * Licensed to Elasticsearch B.V under one or more agreements.
 * Elasticsearch B.V licenses this file to you under the Apache 2.0 License or
 * the GNU Lesser General Public License, Version 2.1, at your option.
 * See the LICENSE file in the project root for more information.
 */

namespace OpenSearch\Namespaces;

use OpenSearch\EndpointFactoryInterface;
use OpenSearch\Endpoints\AbstractEndpoint;
use OpenSearch\LegacyEndpointFactory;
use OpenSearch\LegacyTransportWrapper;
use OpenSearch\Transport;
use OpenSearch\TransportInterface;

abstract class AbstractNamespace
{
    /**
     * @var \OpenSearch\Transport
     *
     * @deprecated in 2.4.0 and will be removed in 3.0.0. Use $httpTransport property instead.
     */
    protected $transport;

    protected TransportInterface $httpTransport;

    protected EndpointFactoryInterface $endpointFactory;

    /**
     * @var callable
     *
     * @deprecated in 2.4.0 and will be removed in 3.0.0. Use $endpointFactory property instead.
     */
    protected $endpoints;

    /**
     * @phpstan-ignore parameter.deprecatedClass
     */
    public function __construct(TransportInterface|Transport $transport, callable|EndpointFactoryInterface $endpointFactory)
    {
        if (!$transport instanceof TransportInterface) {
            @trigger_error('Passing an instance of \OpenSearch\Transport to ' . __METHOD__ . '() is deprecated in 2.4.0 and will be removed in 3.0.0. Pass an instance of \OpenSearch\TransportInterface instead.', E_USER_DEPRECATED);
            // @phpstan-ignore property.deprecated
            $this->transport = $transport;
            // @phpstan-ignore new.deprecatedClass, method.deprecatedClass
            $this->httpTransport = new LegacyTransportWrapper($transport);
        } else {
            $this->httpTransport = $transport;
        }
        if (is_callable($endpointFactory)) {
            @trigger_error('Passing a callable as $endpointFactory param to ' . __METHOD__ . '() is deprecated in 2.4.0 and will be removed in 3.0.0. Pass an instance of \OpenSearch\EndpointFactoryInterface instead.', E_USER_DEPRECATED);
            $endpoints = $endpointFactory;
            // @phpstan-ignore new.deprecatedClass, method.deprecatedClass
            $endpointFactory = new LegacyEndpointFactory($endpointFactory);
        } else {
            $endpoints = function ($c) use ($endpointFactory) {
                @trigger_error('The $endpoints property is deprecated in 2.4.0 and will be removed in 3.0.0.', E_USER_DEPRECATED);
                return $endpointFactory->getEndpoint('OpenSearch\\Endpoints\\' . $c);
            };
        }
        // @phpstan-ignore property.deprecated
        $this->endpoints = $endpoints;
        $this->endpointFactory = $endpointFactory;
    }

    /**
     * @return null|mixed
     */
    public function extractArgument(array &$params, string $arg)
    {
        if (array_key_exists($arg, $params) === true) {
            $val = $params[$arg];
            unset($params[$arg]);
            return $val;
        } else {
            return null;
        }
    }

    protected function performRequest(AbstractEndpoint $endpoint)
    {
        return $this->httpTransport->sendRequest(
            $endpoint->getMethod(),
            $endpoint->getURI(),
            $endpoint->getParams(),
            $endpoint->getBody(),
            $endpoint->getOptions()
        );

    }
}
