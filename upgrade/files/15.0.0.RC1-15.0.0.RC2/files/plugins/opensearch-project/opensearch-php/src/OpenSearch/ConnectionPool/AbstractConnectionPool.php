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

namespace OpenSearch\ConnectionPool;

use OpenSearch\ConnectionPool\Selectors\SelectorInterface;
use OpenSearch\Connections\ConnectionFactoryInterface;
use OpenSearch\Connections\ConnectionInterface;

// @phpstan-ignore classConstant.deprecatedClass
@trigger_error(AbstractConnectionPool::class . ' is deprecated in 2.4.0 and will be removed in 3.0.0.', E_USER_DEPRECATED);

/**
 * @deprecated in 2.4.0 and will be removed in 3.0.0.
 */
abstract class AbstractConnectionPool implements ConnectionPoolInterface
{
    /**
     * Array of connections
     *
     * @var ConnectionInterface[]
     */
    protected $connections;

    /**
     * Array of initial seed connections
     *
     * @var ConnectionInterface[]
     */
    protected $seedConnections;

    /**
     * Selector object, used to select a connection on each request
     *
     * @var SelectorInterface
     */
    protected $selector;

    /**
     * @var array<string, mixed>
     */
    protected $connectionPoolParams;

    /**
     * @var ConnectionFactoryInterface
     */
    protected $connectionFactory;

    /**
     * Constructor
     *
     * @param ConnectionInterface[]      $connections          The Connections to choose from
     * @param SelectorInterface          $selector             A Selector instance to perform the selection logic for the available connections
     * @param ConnectionFactoryInterface $factory              ConnectionFactory instance
     * @param array<string, mixed>       $connectionPoolParams
     */
    public function __construct(array $connections, SelectorInterface $selector, ConnectionFactoryInterface $factory, array $connectionPoolParams)
    {
        if (isset($connectionPoolParams['randomizeHosts']) === true
            && $connectionPoolParams['randomizeHosts'] === true
        ) {
            shuffle($connections);
        }

        $this->connections          = $connections;
        $this->seedConnections      = $connections;
        $this->selector             = $selector;
        $this->connectionPoolParams = $connectionPoolParams;
        $this->connectionFactory    = $factory;
    }

    abstract public function nextConnection(bool $force = false): ConnectionInterface;

    abstract public function scheduleCheck(): void;
}
