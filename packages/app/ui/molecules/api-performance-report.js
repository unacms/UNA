import React, { useState, useEffect } from 'react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import Card from 'app/ui/molecules/card';
import { useTranslation } from 'react-i18next';
import { fetcher, fetcherRaw } from 'app/lib/fetcher';
import { useCurrentUser } from 'app/context/user';
import { Platform } from 'react-native';
import { storageGet, storageSet } from 'app/lib/util';
import { appSetting, UNA_URL, APP_URL } from 'app/config';

const API_TESTS = [
    {
        id: 'connection_baseline',
        name: 'Connection Baseline',
        endpoint: '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=login',
        description: 'Minimal API call for connection baseline (lightweight page)',
        fallback: '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=about',
        isBaseline: true
    },
    {
        id: 'db_ping',
        name: 'Database Connection',
        endpoint: '/api.php?r=system/ping_db',
        description: 'Lightweight database connection test (simple SELECT 1)',
        fallback: '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=home'
    },
    {
        id: 'dashboard_stats',
        name: 'Dashboard Stats',
        endpoint: '/api.php?r=system/get_stat_block/TemplDashboardServices',
        description: 'Complex admin dashboard statistics (heavy DB queries)'
    },
    {
        id: 'feed_timeline',
        name: 'Feed Timeline',
        endpoint: '/api.php?r=bx_timeline/browse/&params[]={"params":{"per_page":"10","start":0,"type":"account"}}',
        description: 'User timeline feed (moderate DB load)'
    },
    {
        id: 'profiles_browse',
        name: 'Browse Profiles',
        endpoint: '/api.php?r=bx_persons/browse/&params[]={"params":{"per_page":"10","start":0,"type":"active"}}',
        description: 'Profile browsing (moderate DB queries)'
    },
    {
        id: 'home_page',
        name: 'Home Page',
        endpoint: '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=home',
        description: 'Home page data (multiple DB queries + processing)'
    },
    {
        id: 'about_page',
        name: 'About Page',
        endpoint: '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=about',
        description: 'About page data (light DB load)'
    },
    {
        id: 'contact_page',
        name: 'Contact Page',
        endpoint: '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=contact',
        description: 'Contact page data (light DB load)'
    },
    {
        id: 'friends_browse',
        name: 'Friends Browse',
        endpoint: '/api.php?r=system/browse_friends/&params[]={"params":{"per_page":"10","start":0}}',
        description: 'Friends list (moderate DB queries)',
        fallback: '/api.php?r=bx_persons/browse/&params[]={"params":{"per_page":"5","start":0}}'
    }
];

const STORAGE_KEY = 'api_performance_history';

function getStatusColor(responseTime) {
    if (responseTime < 200) return 'text-green-600 dark:text-green-400';
    if (responseTime < 500) return 'text-yellow-600 dark:text-yellow-400';
    if (responseTime < 1000) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
}

function getStatusIcon(responseTime) {
    if (responseTime < 200) return 'CheckCircle';
    if (responseTime < 500) return 'Clock';
    if (responseTime < 1000) return 'AlertTriangle';
    return 'XCircle';
}

function getStatusText(responseTime) {
    if (responseTime < 200) return 'Excellent';
    if (responseTime < 500) return 'Good';
    if (responseTime < 1000) return 'Slow';
    return 'Very Slow';
}

// Enhanced performance test with detailed timing breakdown
async function enhancedPerformanceTest(test) {
    const USE_PROXY_WEB = appSetting('config', 'use_proxy_web');
    let prefix = UNA_URL;
    if (Platform.OS === 'web' && USE_PROXY_WEB) {
        prefix = APP_URL + "/api";
    }

    let testEndpoint = test.endpoint;
    let usedFallback = false;

    // For database ping test or baseline test, try the primary endpoint first, then fallback
    if (test.fallback && (test.id === 'db_ping' || test.id === 'connection_baseline' || test.id === 'friends_browse')) {
        try {
            const primaryUrl = prefix + test.endpoint + "&lang=en";
            const testResponse = await fetch(primaryUrl, {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache' },
                cache: 'no-store',
                credentials: 'include'
            });
            
            // If we get a successful response, use the primary endpoint
            if (testResponse.ok) {
                testEndpoint = test.endpoint;
            } else {
                // Use fallback for any non-200 response
                testEndpoint = test.fallback;
                usedFallback = true;
            }
        } catch (error) {
            // Use fallback on any error
            testEndpoint = test.fallback;
            usedFallback = true;
        }
    }

    const fullUrl = prefix + testEndpoint + "&lang=en";
    
    // Performance timing markers
    const performanceMarkerStart = `api-test-${test.id}-start`;
    const performanceMarkerEnd = `api-test-${test.id}-end`;
    
    let result = {
        test: test.name,
        endpoint: testEndpoint,
        description: test.description,
        responseTime: 0,
        status: 'pending',
        error: null,
        payloadSize: 0,
        headers: {},
        serverProcessingTime: null,
        usedFallback,
        timingBreakdown: {},
        networkDetails: {}
    };

    try {
        // Clear any existing performance entries for this URL
        if (typeof performance !== 'undefined' && performance.clearResourceTimings) {
            performance.clearResourceTimings();
        }

        // Mark start time
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(performanceMarkerStart);
        }
        
        const startTime = Date.now();
        
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: { 
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            cache: 'no-store',
            credentials: 'include'
        });

        const endTime = Date.now();
        
        // Mark end time
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(performanceMarkerEnd);
        }

        // Get detailed timing information
        let timingDetails = {};
        let networkBreakdown = {};
        
        if (typeof performance !== 'undefined' && Platform.OS === 'web') {
            try {
                // Try to get Resource Timing API data
                const resourceEntries = performance.getEntriesByName(fullUrl, 'resource');
                if (resourceEntries.length > 0) {
                    const timing = resourceEntries[resourceEntries.length - 1]; // Get latest entry
                    
                    timingDetails = {
                        dnsLookup: Math.round(timing.domainLookupEnd - timing.domainLookupStart),
                        tcpConnect: Math.round(timing.connectEnd - timing.connectStart),
                        sslHandshake: timing.secureConnectionStart > 0 ? Math.round(timing.connectEnd - timing.secureConnectionStart) : 0,
                        requestSent: Math.round(timing.requestStart - timing.connectEnd),
                        waitingForResponse: Math.round(timing.responseStart - timing.requestStart),
                        contentDownload: Math.round(timing.responseEnd - timing.responseStart),
                        totalResourceTime: Math.round(timing.responseEnd - timing.startTime),
                        redirectTime: Math.round(timing.redirectEnd - timing.redirectStart)
                    };
                    
                    // Calculate network phases
                    networkBreakdown = {
                        connectionEstablishment: timingDetails.dnsLookup + timingDetails.tcpConnect + timingDetails.sslHandshake,
                        requestProcessing: timingDetails.requestSent + timingDetails.waitingForResponse,
                        responseTransfer: timingDetails.contentDownload,
                        serverThinkTime: timingDetails.waitingForResponse // This is closest to server processing
                    };
                }
            } catch (timingError) {
                console.warn('Could not get detailed timing:', timingError);
            }
        }

        const responseTime = endTime - startTime;
        const data = await response.text();
        
        // Extract headers
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        // Try to extract server processing time from various headers
        let serverProcessingTime = null;
        if (headers['x-runtime']) {
            serverProcessingTime = parseFloat(headers['x-runtime']) * 1000; // Convert to ms
        } else if (headers['x-response-time']) {
            serverProcessingTime = parseFloat(headers['x-response-time']);
        } else if (headers['server-timing']) {
            // Parse Server-Timing header if available
            const serverTiming = headers['server-timing'];
            const match = serverTiming.match(/total;dur=([0-9.]+)/);
            if (match) {
                serverProcessingTime = parseFloat(match[1]);
            }
        }

        // Calculate payload size
        const payloadSize = new Blob([data]).size;

        result = {
            ...result,
            responseTime,
            status: response.ok ? 'success' : 'error',
            error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
            payloadSize,
            headers,
            serverProcessingTime,
            timingBreakdown: timingDetails,
            networkDetails: networkBreakdown,
            httpStatus: response.status,
            contentType: headers['content-type'] || 'unknown'
        };

    } catch (error) {
        const endTime = Date.now();
        result = {
            ...result,
            responseTime: endTime - Date.now(),
            status: 'error',
            error: error.message,
            payloadSize: 0
        };
    }

    return result;
}

// Concurrent test runner
async function runConcurrentTest(test, concurrency = 3) {
    const promises = Array(concurrency).fill().map(() => enhancedPerformanceTest(test));
    const results = await Promise.all(promises);
    
    const avgTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length);
    const minTime = Math.min(...results.map(r => r.responseTime));
    const maxTime = Math.max(...results.map(r => r.responseTime));
    
    return {
        ...results[0], // Take first result as base
        responseTime: avgTime,
        concurrent: {
            concurrency,
            average: avgTime,
            min: minTime,
            max: maxTime,
            variance: maxTime - minTime
        }
    };
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function ApiPerformanceReport() {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const [testResults, setTestResults] = useState({});
    const [isRunning, setIsRunning] = useState(false);
    const [lastRun, setLastRun] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [testHistory, setTestHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [concurrentMode, setConcurrentMode] = useState(false);
    const [concurrencyCount, setConcurrencyCount] = useState(3);
    const [currentTest, setCurrentTest] = useState('');

    // Only show for admin users
    if (!currentUser?.id) {
        return null;
    }

    // Load test history on mount
    useEffect(() => {
        const history = storageGet(STORAGE_KEY, '', true);
        if (history && Array.isArray(history)) {
            setTestHistory(history);
        }
    }, []);

    // Helper functions
    const getStatusEmoji = (responseTime, isError) => {
        if (isError) return '❌';
        if (responseTime < 200) return '🟢';
        if (responseTime < 500) return '🟡';
        if (responseTime < 1000) return '🟠';
        return '🔴';
    };

    const getStatusText = (responseTime) => {
        if (responseTime < 200) return 'Excellent';
        if (responseTime < 500) return 'Good';
        if (responseTime < 1000) return 'Slow';
        return 'Very Slow';
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const runTests = async () => {
        setIsRunning(true);
        setTestResults({});
        
        const results = {};
        
        try {
            if (concurrentMode) {
                // Run concurrent tests for each endpoint individually
                for (const test of API_TESTS) {
                    setCurrentTest(`${test.name} (${concurrencyCount}x concurrent)`);
                    
                    // Create array of promises for concurrent requests
                    const concurrentPromises = Array(concurrencyCount).fill().map(() => 
                        enhancedPerformanceTest(test)
                    );
                    
                    // Run all requests simultaneously
                    const concurrentResults = await Promise.all(concurrentPromises);
                    
                    // Calculate statistics from concurrent results
                    const responseTimes = concurrentResults.map(r => r.responseTime);
                    const successfulResults = concurrentResults.filter(r => r.status === 'success');
                    
                    if (successfulResults.length > 0) {
                        const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
                        const minTime = Math.min(...responseTimes);
                        const maxTime = Math.max(...responseTimes);
                        const variance = responseTimes.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / responseTimes.length;
                        const standardDeviation = Math.sqrt(variance);
                        
                        // Use the result with median response time as the primary result structure
                        responseTimes.sort((a, b) => a - b);
                        const medianIndex = Math.floor(responseTimes.length / 2);
                        const primaryResult = concurrentResults.find(r => r.responseTime === responseTimes[medianIndex]) || concurrentResults[0];
                        
                        // Calculate success rate
                        const successRate = (successfulResults.length / concurrentResults.length) * 100;
                        
                        results[test.id] = {
                            ...primaryResult,
                            responseTime: Math.round(avgTime),
                            concurrentStats: {
                                count: concurrencyCount,
                                average: Math.round(avgTime),
                                median: responseTimes[medianIndex],
                                min: minTime,
                                max: maxTime,
                                variance: Math.round(variance),
                                standardDeviation: Math.round(standardDeviation),
                                successRate: Math.round(successRate),
                                failedRequests: concurrentResults.length - successfulResults.length,
                                throughput: (successfulResults.length / (maxTime / 1000)).toFixed(2) // requests per second
                            }
                        };
                    } else {
                        // All requests failed
                        results[test.id] = {
                            ...concurrentResults[0],
                            concurrentStats: {
                                count: concurrencyCount,
                                successRate: 0,
                                failedRequests: concurrentResults.length
                            }
                        };
                    }
                    
                    setTestResults(prev => ({ ...prev, [test.id]: results[test.id] }));
                    await new Promise(resolve => setTimeout(resolve, 200)); // Brief pause between different endpoints
                }
            } else {
                // Sequential testing
                for (const test of API_TESTS) {
                    setCurrentTest(test.name);
                    const result = await enhancedPerformanceTest(test);
                    results[test.id] = result;
                    setTestResults(prev => ({ ...prev, [test.id]: result }));
                    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between tests
                }
            }
            
            setTestResults(results);
            setLastRun(new Date());
            
            // Save to localStorage for historical tracking
            const historicalData = {
                timestamp: new Date().toISOString(),
                mode: concurrentMode ? 'concurrent' : 'sequential',
                averageTime: Math.round(Object.values(results).reduce((sum, result) => sum + result.responseTime, 0) / Object.values(results).length),
                results: Object.keys(results).reduce((acc, key) => {
                    acc[key] = {
                        responseTime: results[key].responseTime,
                        status: results[key].status,
                        error: results[key].error
                    };
                    return acc;
                }, {})
            };
            
            const history = storageGet('api_performance_history', '') || [];
            history.unshift(historicalData);
            storageSet('api_performance_history', '', history.slice(0, 10)); // Keep last 10 runs
            
        } catch (error) {
            console.error('Test run failed:', error);
        } finally {
            setIsRunning(false);
            setCurrentTest('');
        }
    };

    const clearHistory = () => {
        setTestHistory([]);
        storageSet(STORAGE_KEY, '', [], true);
    };

    const generateLLMReport = () => {
        if (Object.keys(testResults).length === 0) {
            return "No API performance data available. Please run tests first.";
        }

        const timestamp = lastRun.toISOString();
        const averageTime = Math.round(Object.values(testResults).reduce((sum, result) => sum + result.responseTime, 0) / Object.values(testResults).length);
        const baselineResult = testResults['connection_baseline'];
        const baselineTime = baselineResult ? baselineResult.responseTime : null;
        
        let report = `# Enhanced API Performance Report\\n\\n`;
        report += `**Generated:** ${timestamp}\\n`;
        report += `**Test Mode:** ${concurrentMode ? `Concurrent (${concurrencyCount}x simultaneous)` : 'Sequential'}\\n`;
        report += `**Average Response Time:** ${averageTime}ms\\n`;
        if (baselineTime) {
            report += `**Connection Baseline:** ${baselineTime}ms\\n`;
        }
        report += `\\n`;

        // Add concurrent load testing summary if applicable
        const hasConcurrentData = Object.values(testResults).some(result => result.concurrentStats);
        if (hasConcurrentData) {
            report += `## ⚡ Load Testing Summary\\n\\n`;
            report += `**Concurrent Requests:** ${concurrencyCount} simultaneous per endpoint\\n`;
            
            const overallStats = Object.values(testResults)
                .filter(result => result.concurrentStats && result.status === 'success')
                .reduce((acc, result) => {
                    acc.totalRequests += result.concurrentStats.count;
                    acc.successfulRequests += Math.round((result.concurrentStats.successRate / 100) * result.concurrentStats.count);
                    acc.failedRequests += result.concurrentStats.failedRequests || 0;
                    acc.totalThroughput += parseFloat(result.concurrentStats.throughput || 0);
                    return acc;
                }, { totalRequests: 0, successfulRequests: 0, failedRequests: 0, totalThroughput: 0 });
            
            const overallSuccessRate = overallStats.totalRequests > 0 ? 
                (overallStats.successfulRequests / overallStats.totalRequests * 100).toFixed(1) : 0;
            
            report += `**Overall Success Rate:** ${overallSuccessRate}%\\n`;
            report += `**Total Requests:** ${overallStats.totalRequests} (${overallStats.successfulRequests} successful, ${overallStats.failedRequests} failed)\\n`;
            report += `**Combined Throughput:** ${overallStats.totalThroughput.toFixed(2)} req/s\\n\\n`;
            
            // Add performance under load analysis
            report += `**Load Testing Insights:**\\n`;
            Object.entries(testResults).forEach(([testId, result]) => {
                if (result.concurrentStats && result.status === 'success') {
                    const perfDegradation = result.concurrentStats.max - result.concurrentStats.min;
                    const consistencyScore = 100 - (result.concurrentStats.standardDeviation / result.concurrentStats.average * 100);
                    report += `- **${result.test}:** `;
                    if (result.concurrentStats.successRate < 100) {
                        report += `⚠️ ${100 - result.concurrentStats.successRate}% failure rate under load`;
                    } else if (perfDegradation > result.concurrentStats.average * 0.5) {
                        report += `⚠️ High variance (${perfDegradation}ms spread)`;
                    } else if (consistencyScore > 90) {
                        report += `✅ Excellent consistency (${consistencyScore.toFixed(1)}% stable)`;
                    } else {
                        report += `✅ Good performance under load`;
                    }
                    report += `\\n`;
                }
            });
            report += `\\n`;
        }

        // Add baseline analysis section
        if (baselineTime) {
            report += `## 🎯 Baseline Analysis\\n\\n`;
            report += `The **Connection Baseline** (${baselineTime}ms) represents the minimum time for:\\n`;
            report += `- Network latency (client ↔ server)\\n`;
            report += `- Basic API framework overhead\\n`;
            report += `- Minimal processing (no database queries)\\n\\n`;
            
            report += `**Performance Attribution:**\\n`;
            Object.entries(testResults).forEach(([testId, result]) => {
                if (testId !== 'connection_baseline' && result.status === 'success') {
                    const overhead = result.responseTime - baselineTime;
                    const percentOverhead = Math.round((overhead / result.responseTime) * 100);
                    const sign = overhead >= 0 ? '+' : '';
                    report += `- **${result.test}:** ${sign}${overhead}ms overhead (${percentOverhead}% of total time)\\n`;
                }
            });
            report += `\\n`;
        }

        // Add network timing breakdown section
        const hasDetailedTimings = Object.values(testResults).some(result => 
            result.timingBreakdown && Object.keys(result.timingBreakdown).length > 0
        );
        
        if (hasDetailedTimings) {
            report += `## 🌐 Network Timing Analysis\\n\\n`;
            report += `**Detailed Network Breakdown (where available):**\\n\\n`;
            
            Object.entries(testResults).forEach(([testId, result]) => {
                if (result.timingBreakdown && Object.keys(result.timingBreakdown).length > 0) {
                    const timing = result.timingBreakdown;
                    const network = result.networkDetails;
                    
                    report += `### ${result.test}\\n`;
                    report += `- **DNS Lookup:** ${timing.dnsLookup}ms\\n`;
                    report += `- **TCP Connection:** ${timing.tcpConnect}ms\\n`;
                    if (timing.sslHandshake > 0) {
                        report += `- **SSL Handshake:** ${timing.sslHandshake}ms\\n`;
                    }
                    report += `- **Request Sent:** ${timing.requestSent}ms\\n`;
                    report += `- **Server Processing:** ${timing.waitingForResponse}ms\\n`;
                    report += `- **Content Download:** ${timing.contentDownload}ms\\n`;
                    
                    if (network && Object.keys(network).length > 0) {
                        report += `\\n**Network Phases:**\\n`;
                        report += `- **Connection Setup:** ${network.connectionEstablishment}ms\\n`;
                        report += `- **Request Processing:** ${network.requestProcessing}ms\\n`;
                        report += `- **Data Transfer:** ${network.responseTransfer}ms\\n`;
                    }
                    report += `\\n`;
                }
            });
        }

        report += `## Detailed Performance Analysis\\n\\n`;

        // Sort results for consistent output
        const sortedResults = Object.entries(testResults).sort(([,a], [,b]) => {
            if (a.test.includes('Baseline')) return -1;
            if (b.test.includes('Baseline')) return 1;
            return b.responseTime - a.responseTime;
        });

        sortedResults.forEach(([testId, result]) => {
            const emoji = getStatusEmoji(result.responseTime, result.status === 'error');
            const status = result.status === 'error' ? 'ERROR' : getStatusText(result.responseTime);
            const isBaseline = testId === 'connection_baseline';
            
            report += `### ${result.test} ${emoji}${isBaseline ? ' 📍 **BASELINE**' : ''}\\n`;
            report += `- **Endpoint:** \`${result.endpoint}\`\\n`;
            report += `- **Description:** ${result.description}\\n`;
            report += `- **Total Response Time:** ${result.responseTime}ms\\n`;
            report += `- **Status:** ${status}\\n`;
            
            if (result.status === 'success') {
                if (baselineTime && !isBaseline) {
                    const overhead = result.responseTime - baselineTime;
                    const multiplier = (result.responseTime / baselineTime).toFixed(1);
                    const sign = overhead >= 0 ? '+' : '';
                    report += `- **vs Baseline:** ${sign}${overhead}ms (${multiplier}x slower than baseline)\\n`;
                }
                
                // Concurrent Load Testing Statistics
                if (result.concurrentStats) {
                    report += `- **Load Testing (${result.concurrentStats.count}x concurrent):**\\n`;
                    report += `  - **Average Response:** ${result.concurrentStats.average}ms\\n`;
                    report += `  - **Median Response:** ${result.concurrentStats.median}ms\\n`;
                    report += `  - **Response Range:** ${result.concurrentStats.min}ms - ${result.concurrentStats.max}ms (${result.concurrentStats.max - result.concurrentStats.min}ms spread)\\n`;
                    report += `  - **Standard Deviation:** ${result.concurrentStats.standardDeviation}ms (${(result.concurrentStats.standardDeviation / result.concurrentStats.average * 100).toFixed(1)}% of avg)\\n`;
                    report += `  - **Success Rate:** ${result.concurrentStats.successRate}% (${Math.round((result.concurrentStats.successRate / 100) * result.concurrentStats.count)}/${result.concurrentStats.count} requests)\\n`;
                    report += `  - **Throughput:** ${result.concurrentStats.throughput} requests/second\\n`;
                    report += `  - **Variance:** ${result.concurrentStats.variance}ms²\\n`;
                    
                    if (result.concurrentStats.failedRequests > 0) {
                        report += `  - **⚠️ Failed Requests:** ${result.concurrentStats.failedRequests}/${result.concurrentStats.count} (${(100 - result.concurrentStats.successRate).toFixed(1)}% failure rate)\\n`;
                    }
                    
                    // Performance consistency analysis
                    const consistencyScore = 100 - (result.concurrentStats.standardDeviation / result.concurrentStats.average * 100);
                    if (consistencyScore > 95) {
                        report += `  - **✅ Performance:** Excellent consistency (${consistencyScore.toFixed(1)}% stable)\\n`;
                    } else if (consistencyScore > 85) {
                        report += `  - **✅ Performance:** Good consistency (${consistencyScore.toFixed(1)}% stable)\\n`;
                    } else if (consistencyScore > 70) {
                        report += `  - **⚠️ Performance:** Moderate variance (${consistencyScore.toFixed(1)}% stable)\\n`;
                    } else {
                        report += `  - **🔴 Performance:** High variance (${consistencyScore.toFixed(1)}% stable - investigate bottlenecks)\\n`;
                    }
                }
                
                if (result.usedFallback) {
                    report += `- **⚠️ Note:** Used fallback endpoint (${testId === 'db_ping' ? 'ping_db' : testId === 'friends_browse' ? 'browse_friends' : 'primary endpoint'} not available)\\n`;
                }
                
                report += `- **Payload Size:** ${formatBytes(result.payloadSize)}\\n`;
                
                if (result.serverProcessingTime) {
                    const networkOverhead = result.responseTime - result.serverProcessingTime;
                    const serverPercentage = (result.serverProcessingTime / result.responseTime * 100).toFixed(1);
                    const networkPercentage = (networkOverhead / result.responseTime * 100).toFixed(1);
                    report += `- **Server Processing:** ${Math.round(result.serverProcessingTime)}ms (${serverPercentage}% of total)\\n`;
                    report += `- **Network Overhead:** ${Math.round(networkOverhead)}ms (${networkPercentage}% of total)\\n`;
                }
                
                if (result.headers.server) {
                    report += `- **Server:** ${result.headers.server}\\n`;
                }
                
                if (result.contentType) {
                    report += `- **Content Type:** ${result.contentType}\\n`;
                }
                
                // Detailed network timing breakdown
                if (result.timingBreakdown && Object.keys(result.timingBreakdown).length > 0) {
                    const timing = result.timingBreakdown;
                    report += `- **Detailed Network Timing:**\\n`;
                    report += `  - **DNS Lookup:** ${timing.dnsLookup}ms\\n`;
                    report += `  - **TCP Connection:** ${timing.tcpConnect}ms\\n`;
                    if (timing.sslHandshake > 0) {
                        report += `  - **SSL Handshake:** ${timing.sslHandshake}ms\\n`;
                    }
                    report += `  - **Request Sent:** ${timing.requestSent}ms\\n`;
                    report += `  - **Server Wait Time:** ${timing.waitingForResponse}ms\\n`;
                    report += `  - **Content Download:** ${timing.contentDownload}ms\\n`;
                    report += `  - **Total Resource Time:** ${timing.totalResourceTime}ms\\n`;
                    if (timing.redirectTime > 0) {
                        report += `  - **Redirect Time:** ${timing.redirectTime}ms\\n`;
                    }
                    
                    // Network phase analysis
                    if (result.networkDetails && Object.keys(result.networkDetails).length > 0) {
                        const network = result.networkDetails;
                        report += `- **Network Phase Breakdown:**\\n`;
                        report += `  - **Connection Establishment:** ${network.connectionEstablishment}ms (DNS + TCP + SSL)\\n`;
                        report += `  - **Request Processing:** ${network.requestProcessing}ms (Send + Server Think)\\n`;
                        report += `  - **Data Transfer:** ${network.responseTransfer}ms (Download)\\n`;
                        
                        // Performance insights based on network timing
                        if (network.connectionEstablishment > 200) {
                            report += `  - **⚠️ Connection Analysis:** High setup time (${network.connectionEstablishment}ms) - check DNS/network latency\\n`;
                        }
                        if (timing.dnsLookup > 50) {
                            report += `  - **⚠️ DNS Analysis:** Slow DNS resolution (${timing.dnsLookup}ms) - consider DNS optimization\\n`;
                        }
                        if (timing.tcpConnect > 100) {
                            report += `  - **⚠️ TCP Analysis:** High connection time (${timing.tcpConnect}ms) - geographic/network issue\\n`;
                        }
                        if (timing.waitingForResponse > result.responseTime * 0.8) {
                            report += `  - **⚠️ Server Analysis:** Server processing dominates (${timing.waitingForResponse}ms) - backend bottleneck\\n`;
                        }
                    }
                }
            }
            
            if (result.error) {
                report += `- **Error:** ${result.error}\\n`;
            }
            
            report += `\\n`;
        });

        // Add historical comparison
        const history = storageGet('api_performance_history', '') || [];
        if (history.length > 1) {
            report += `## Historical Comparison\\n\\n`;
            report += `**Previous ${Math.min(history.length - 1, 5)} runs:**\\n`;
            for (let i = 1; i < Math.min(history.length, 6); i++) {
                const entry = history[i];
                const diff = averageTime - entry.averageTime;
                const trend = diff > 0 ? '📈' : '📉';
                const sign = diff > 0 ? '+' : '';
                report += `${i}. ${new Date(entry.timestamp).toLocaleString()}: ${entry.averageTime}ms ${trend} (${sign}${diff}ms)\\n`;
            }
            report += `\\n`;
        }

        // Performance guidelines
        report += `## Performance Guidelines\\n\\n`;
        report += `- 🟢 **Excellent:** < 200ms\\n`;
        report += `- 🟡 **Good:** 200-500ms\\n`;
        report += `- 🟠 **Slow:** 500ms-1s\\n`;
        report += `- 🔴 **Very Slow:** > 1s\\n`;
        report += `- ❌ **Error:** Request failed\\n`;
        report += `- 📍 **Baseline:** Connection + framework overhead only\\n\\n`;

        // Enhanced analysis section
        report += `## Enhanced Analysis Points\\n\\n`;
        report += `Please analyze this enhanced API performance data focusing on:\\n`;
        report += `1. **Connection vs Database vs Query bottlenecks** (compare baseline vs DB ping vs complex queries)\\n`;
        report += `2. **Network latency impact** (baseline time indicates pure connection speed)\\n`;
        report += `3. **Database query optimization opportunities** (high overhead vs baseline)\\n`;
        report += `4. **Server processing efficiency** (compare server processing vs total time)\\n`;
        report += `5. **Payload size impact** on response times\\n`;
        if (hasConcurrentData) {
            report += `6. **Load testing results** (concurrent performance, failure rates, throughput limits)\\n`;
            report += `7. **Scalability bottlenecks** (performance degradation under concurrent load)\\n`;
            report += `8. **Consistency analysis** (variance and standard deviation patterns)\\n`;
        }
        report += `${hasConcurrentData ? '9' : '6'}. **Historical trends** and performance regression\\n`;
        
        if (hasDetailedTimings) {
            report += `${hasConcurrentData ? '10' : '7'}. **Network timing bottlenecks** (DNS, TCP, SSL, server processing, transfer)\\n`;
            report += `${hasConcurrentData ? '11' : '8'}. **Connection reuse efficiency** (subsequent requests should have 0ms DNS/TCP times)\\n`;
            report += `${hasConcurrentData ? '12' : '9'}. **Geographic optimization** (DNS and TCP times indicate distance/routing issues)\\n`;
        }

        // Add performance recommendations based on data
        report += `\\n## 🎯 Performance Optimization Recommendations\\n\\n`;
        
        // Analyze baseline performance
        if (baselineTime) {
            if (baselineTime > 500) {
                report += `**🔴 Critical: High Baseline (${baselineTime}ms)**\\n`;
                report += `- This indicates fundamental infrastructure issues\\n`;
                report += `- Consider: Server location, CDN, network routing, hosting provider\\n\\n`;
            } else if (baselineTime > 200) {
                report += `**⚠️ Warning: Elevated Baseline (${baselineTime}ms)**\\n`;
                report += `- Network/infrastructure optimization needed\\n`;
                report += `- Consider: Geographic distribution, DNS optimization\\n\\n`;
            }
        }
        
        // Analyze concurrent performance if available
        if (hasConcurrentData) {
            const failingEndpoints = Object.values(testResults).filter(r => 
                r.concurrentStats && r.concurrentStats.successRate < 100
            );
            
            if (failingEndpoints.length > 0) {
                report += `**🔴 Critical: Load Testing Failures**\\n`;
                failingEndpoints.forEach(result => {
                    report += `- ${result.test}: ${100 - result.concurrentStats.successRate}% failure rate under ${result.concurrentStats.count}x load\\n`;
                });
                report += `- Immediate action required before production scaling\\n\\n`;
            }
            
            const highVarianceEndpoints = Object.values(testResults).filter(r => 
                r.concurrentStats && (r.concurrentStats.standardDeviation / r.concurrentStats.average) > 0.3
            );
            
            if (highVarianceEndpoints.length > 0) {
                report += `**⚠️ Warning: High Performance Variance**\\n`;
                highVarianceEndpoints.forEach(result => {
                    const variancePercent = (result.concurrentStats.standardDeviation / result.concurrentStats.average * 100).toFixed(1);
                    report += `- ${result.test}: ${variancePercent}% variance (${result.concurrentStats.standardDeviation}ms std dev)\\n`;
                });
                report += `- Investigate: Database connection pooling, resource contention, memory issues\\n\\n`;
            }
        }
        
        // Analyze network timing issues
        if (hasDetailedTimings) {
            const dnsIssues = Object.values(testResults).filter(r => 
                r.timingBreakdown && r.timingBreakdown.dnsLookup > 50
            );
            
            if (dnsIssues.length > 0) {
                report += `**⚠️ DNS Optimization Needed**\\n`;
                report += `- Slow DNS resolution detected (>50ms)\\n`;
                report += `- Consider: DNS prefetching, faster DNS provider, DNS caching\\n\\n`;
            }
            
            const tcpIssues = Object.values(testResults).filter(r => 
                r.timingBreakdown && r.timingBreakdown.tcpConnect > 100
            );
            
            if (tcpIssues.length > 0) {
                report += `**⚠️ Network Latency Issues**\\n`;
                report += `- High TCP connection times (>100ms)\\n`;
                report += `- Consider: CDN, geographic server distribution, connection pooling\\n\\n`;
            }
        }

        return report;
    };

    const copyToClipboard = async () => {
        const report = generateLLMReport();
        
        if (Platform.OS === 'web') {
            try {
                await navigator.clipboard.writeText(report);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
            }
        }
    };

    const averageResponseTime = Object.values(testResults).length > 0 
        ? Math.round(Object.values(testResults).reduce((sum, result) => sum + result.responseTime, 0) / Object.values(testResults).length)
        : 0;

    return (
        <View className="p-4">
            <Row className="justify-between items-center mb-4">
                <View>
                    <Text className="text-xl font-semibold text-secondary-foreground ">
                        Enhanced API Performance Report
                    </Text>
                    <Text className="text-sm text-muted-foreground ">
                        Monitor response times with detailed timing analysis
                    </Text>
                </View>
                <Row className="gap-x-2">
                    {testHistory.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            startDecorator="History"
                            title={showHistory ? "Hide History" : "Show History"}
                            onPress={() => setShowHistory(!showHistory)}
                        />
                    )}
                    {Object.keys(testResults).length > 0 && (
                        <Button
                            variant={copySuccess ? "primary" : "outline"}
                            size="sm"
                            startDecorator={copySuccess ? "Check" : "Copy"}
                            title={copySuccess ? "Copied!" : "Copy Report"}
                            onPress={copyToClipboard}
                        />
                    )}
                    <Button
                        variant="primary"
                        size="sm"
                        startDecorator={isRunning ? "RotateCw" : "Play"}
                        title={isRunning ? "Running Tests..." : "Run Tests"}
                        onPress={runTests}
                        disabled={isRunning}
                    />
                </Row>
            </Row>

            {/* Test Options */}
            <View className="mb-4 p-3 bg-background rounded-lg">
                <Row className="justify-between items-center">
                    <View>
                        <Text className="text-sm font-semibold text-secondary-foreground ">
                            Test Options
                        </Text>
                        <Text className="text-xs text-muted-foreground ">
                            Configure how tests are executed
                        </Text>
                    </View>
                    <Row className="gap-x-2">
                        <Button
                            variant={concurrentMode ? "primary" : "outline"}
                            size="sm"
                            title={concurrentMode ? `Concurrent (${concurrencyCount}x)` : "Sequential"}
                            onPress={() => setConcurrentMode(!concurrentMode)}
                        />
                        {concurrentMode && (
                            <Row className="items-center gap-x-2">
                                <Text className="text-sm text-muted-foreground ">
                                    Concurrency:
                                </Text>
                                <Row className="border border-border/60 rounded">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        title=""
                                        startDecorator="Minus"
                                        onPress={() => setConcurrencyCount(Math.max(1, concurrencyCount - 1))}
                                        disabled={isRunning || concurrencyCount <= 1}
                                    />
                                    <Text className="px-3 py-1 text-sm font-semibold min-w-[40px] text-center">
                                        {concurrencyCount}
                                    </Text>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        title=""
                                        startDecorator="Plus"
                                        onPress={() => setConcurrencyCount(Math.min(10, concurrencyCount + 1))}
                                        disabled={isRunning || concurrencyCount >= 10}
                                    />
                                </Row>
                            </Row>
                        )}
                        
                        {testHistory.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                startDecorator="Trash"
                                title="Clear History"
                                onPress={clearHistory}
                            />
                        )}
                    </Row>
                </Row>
            </View>

            {/* Historical Results */}
            {showHistory && testHistory.length > 0 && (
                <View className="mb-4">
                    <Text className="text-lg font-semibold text-secondary-foreground  mb-2">
                        Test History
                    </Text>
                    <View className="grid gap-2">
                        {testHistory.slice(0, 5).map((run, index) => (
                            <Card key={index} padding="p-2">
                                <Row className="justify-between items-center">
                                    <View>
                                        <Text className="text-sm font-semibold text-secondary-foreground ">
                                            {new Date(run.timestamp).toLocaleString()}
                                        </Text>
                                        <Text className="text-xs text-muted-foreground ">
                                            {run.concurrentMode ? 'Concurrent' : 'Sequential'} • {Object.keys(run.results).length} endpoints
                                        </Text>
                                    </View>
                                    <Text className={`text-sm font-semibold ${getStatusColor(run.averageTime)}`}>
                                        {run.averageTime}ms avg
                                    </Text>
                                </Row>
                            </Card>
                        ))}
                    </View>
                </View>
            )}

            {lastRun && (
                <View className="mb-4 p-3 bg-background rounded-lg">
                    <Row className="justify-between items-center">
                        <Text className="text-sm text-muted-foreground ">
                            Last run: {lastRun.toLocaleString()}
                        </Text>
                        {averageResponseTime > 0 && (
                            <Row className="items-center gap-x-2">
                                <Text className="text-sm text-muted-foreground ">
                                    Average:
                                </Text>
                                <Text className={`text-sm font-semibold ${getStatusColor(averageResponseTime)}`}>
                                    {averageResponseTime}ms
                                </Text>
                            </Row>
                        )}
                    </Row>
                </View>
            )}

            <View className="grid gap-3">
                {Object.entries(testResults).map(([testId, result]) => {
                            const emoji = getStatusEmoji(result.responseTime, result.status === 'error');
                            const statusText = result.status === 'error' ? 'ERROR' : getStatusText(result.responseTime);
                            const isBaseline = testId === 'connection_baseline';
                            
                            return (
                                <Card key={testId} padding="p-3 mb-2">
                                    <Row className="justify-between items-start">
                                        <View className="flex-1">
                                            <Row className="items-center mb-1">
                                                <Text className="text-lg font-semibold flex-1">
                                                    {emoji} {result.test}
                                                    {isBaseline && <Text className="text-sm text-blue-600 dark:text-blue-400 ml-2">📍 BASELINE</Text>}
                                                </Text>
                                                <Text className={`text-sm px-2 py-1 rounded ${
                                                    result.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                    result.responseTime < 200 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                    result.responseTime < 500 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                    result.responseTime < 1000 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}>
                                                    {statusText}
                                                </Text>
                                            </Row>
                                            
                                            <Text className="text-sm text-muted-foreground  mb-2">
                                                {result.description}
                                            </Text>
                                            
                                            <Row className="justify-between items-center">
                                                <Text className="text-2xl font-bold">
                                                    {result.responseTime}ms
                                                </Text>
                                                
                                                {!isBaseline && testResults['connection_baseline'] && result.status === 'success' && (
                                                    <Text className="text-sm text-muted-foreground ">
                                                        vs baseline: {result.responseTime - testResults['connection_baseline'].responseTime > 0 ? '+' : ''}
                                                        {result.responseTime - testResults['connection_baseline'].responseTime}ms
                                                    </Text>
                                                )}
                                            </Row>
                                            
                                            {result.error && (
                                                <Text className="text-sm text-red-600 dark:text-red-400 mt-1">
                                                    Error: {result.error}
                                                </Text>
                                            )}
                                            
                                            {result.usedFallback && (
                                                <Text className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                                                    ⚠️ Used fallback endpoint
                                                </Text>
                                            )}
                                            
                                            {/* Concurrent Load Testing Stats */}
                                            {result.concurrentStats && (
                                                <View className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                                    <Text className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-300">
                                                        ⚡ Load Testing Results ({result.concurrentStats.count}x concurrent):
                                                    </Text>
                                                    <View className="grid grid-cols-2 gap-1 text-xs">
                                                        <Text className="text-blue-600 dark:text-blue-400">
                                                            Average: {result.concurrentStats.average}ms
                                                        </Text>
                                                        <Text className="text-blue-600 dark:text-blue-400">
                                                            Median: {result.concurrentStats.median}ms
                                                        </Text>
                                                        <Text className="text-blue-600 dark:text-blue-400">
                                                            Min: {result.concurrentStats.min}ms
                                                        </Text>
                                                        <Text className="text-blue-600 dark:text-blue-400">
                                                            Max: {result.concurrentStats.max}ms
                                                        </Text>
                                                        <Text className="text-blue-600 dark:text-blue-400">
                                                            Success Rate: {result.concurrentStats.successRate}%
                                                        </Text>
                                                        <Text className="text-blue-600 dark:text-blue-400">
                                                            Throughput: {result.concurrentStats.throughput} req/s
                                                        </Text>
                                                        {result.concurrentStats.failedRequests > 0 && (
                                                            <Text className="text-red-600 dark:text-red-400 col-span-2">
                                                                Failed: {result.concurrentStats.failedRequests} requests
                                                            </Text>
                                                        )}
                                                        <Text className="text-blue-600 dark:text-blue-400">
                                                            Std Dev: {result.concurrentStats.standardDeviation}ms
                                                        </Text>
                                                        <Text className="text-blue-600 dark:text-blue-400">
                                                            Variance: {result.concurrentStats.variance}ms²
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                            
                                            {/* Detailed Network Timing */}
                                            {result.timingBreakdown && Object.keys(result.timingBreakdown).length > 0 && (
                                                <View className="mt-3 p-2 bg-background rounded">
                                                    <Text className="text-sm font-semibold mb-2 text-muted-foreground ">
                                                        🌐 Network Timing Breakdown:
                                                    </Text>
                                                    <View className="grid grid-cols-2 gap-1 text-xs">
                                                        <Text className="text-muted-foreground ">
                                                            DNS: {result.timingBreakdown.dnsLookup}ms
                                                        </Text>
                                                        <Text className="text-muted-foreground ">
                                                            TCP: {result.timingBreakdown.tcpConnect}ms
                                                        </Text>
                                                        {result.timingBreakdown.sslHandshake > 0 && (
                                                            <Text className="text-muted-foreground ">
                                                                SSL: {result.timingBreakdown.sslHandshake}ms
                                                            </Text>
                                                        )}
                                                        <Text className="text-muted-foreground ">
                                                            Server: {result.timingBreakdown.waitingForResponse}ms
                                                        </Text>
                                                        <Text className="text-muted-foreground ">
                                                            Download: {result.timingBreakdown.contentDownload}ms
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                            
                                            <View className="mt-2 pt-2 border-t border-default">
                                                <Row className="justify-between text-xs text-muted-foreground ">
                                                    <Text>Payload: {formatBytes(result.payloadSize)}</Text>
                                                    {result.serverProcessingTime && (
                                                        <Text>Server: {Math.round(result.serverProcessingTime)}ms</Text>
                                                    )}
                                                    {result.concurrentStats && (
                                                        <Text>Variance: {result.concurrentStats.variance}ms</Text>
                                                    )}
                                                </Row>
                                            </View>
                                        </View>
                                    </Row>
                                </Card>
                            );
                        })}
            </View>

            {Object.keys(testResults).length > 0 && (
                <View className="mt-4 p-3 bg-red-500 rounded-lg">
                    <Text className="text-sm font-semibold text-secondary-foreground  mb-2">
                        Performance Guidelines:
                    </Text>
                    <View className="space-y-1">
                        <Row className="items-center gap-x-2">
                            <Icon icon="CheckCircle" size={14} className="text-green-600 dark:text-green-400" />
                            <Text className="text-xs text-muted-foreground ">
                                &lt; 200ms - Excellent
                            </Text>
                        </Row>
                        <Row className="items-center gap-x-2">
                            <Icon icon="Clock" size={14} className="text-yellow-600 dark:text-yellow-400" />
                            <Text className="text-xs text-muted-foreground ">
                                200-500ms - Good
                            </Text>
                        </Row>
                        <Row className="items-center gap-x-2">
                            <Icon icon="AlertTriangle" size={14} className="text-orange-600 dark:text-orange-400" />
                            <Text className="text-xs text-muted-foreground ">
                                500ms-1s - Slow
                            </Text>
                        </Row>
                        <Row className="items-center gap-x-2">
                            <Icon icon="XCircle" size={14} className="text-red-600 dark:text-red-400" />
                            <Text className="text-xs text-muted-foreground ">
                                &gt; 1s - Very Slow
                            </Text>
                        </Row>
                    </View>
                </View>
            )}
        </View>
    );
} 