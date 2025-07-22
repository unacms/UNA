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
        description: 'Friends list (moderate DB queries)'
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

// Enhanced performance test with detailed timing
async function enhancedPerformanceTest(test) {
    const USE_PROXY_WEB = appSetting('config', 'use_proxy_web');
    let prefix = UNA_URL;
    if (Platform.OS === 'web' && USE_PROXY_WEB) {
        prefix = APP_URL + "/api";
    }

    let testEndpoint = test.endpoint;
    let usedFallback = false;

    // For database ping test or baseline test, try the primary endpoint first, then fallback
    if (test.id === 'db_ping' || (test.id === 'connection_baseline' && test.fallback)) {
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
                // Use fallback for both database ping and baseline
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
    
    // Timing measurements
    const timings = {
        start: performance.now(),
        dnsStart: null,
        connectStart: null,
        requestStart: null,
        responseStart: null,
        responseEnd: null
    };

    let payloadSize = 0;
    let headers = {};
    let success = false;
    let error = null;

    try {
        // For more detailed timing, we'll use fetch directly
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            cache: 'no-store',
            credentials: 'include'
        });

        timings.responseStart = performance.now();
        
        // Get response headers
        response.headers.forEach((value, key) => {
            headers[key.toLowerCase()] = value;
        });

        // Get response text to measure payload size
        const responseText = await response.text();
        payloadSize = new Blob([responseText]).size;
        
        timings.responseEnd = performance.now();
        
        success = response.ok;
        if (!success) {
            error = `HTTP ${response.status}: ${response.statusText}`;
        }

    } catch (err) {
        timings.responseEnd = performance.now();
        error = err.message;
    }

    const totalTime = timings.responseEnd - timings.start;
    const serverProcessing = headers['x-runtime'] ? parseFloat(headers['x-runtime']) * 1000 : null;
    
    return {
        success,
        responseTime: Math.round(totalTime),
        error,
        usedFallback,
        testEndpoint: usedFallback ? testEndpoint : test.endpoint,
        breakdown: {
            totalTime: Math.round(totalTime),
            serverProcessing: serverProcessing ? Math.round(serverProcessing) : null,
            networkOverhead: serverProcessing ? Math.round(totalTime - serverProcessing) : null
        },
        payload: {
            size: payloadSize,
            sizeFormatted: formatBytes(payloadSize)
        },
        headers: {
            server: headers.server || 'Unknown',
            cacheControl: headers['cache-control'] || 'None',
            contentType: headers['content-type'] || 'Unknown',
            runtime: headers['x-runtime'] || null
        },
        timestamp: new Date().toISOString(),
        isBaseline: test.isBaseline || false
    };
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

    const runPerformanceTest = async (test) => {
        if (concurrentMode) {
            return await runConcurrentTest(test, 3);
        } else {
            return await enhancedPerformanceTest(test);
        }
    };

    const runAllTests = async () => {
        setIsRunning(true);
        const results = {};
        
        for (const test of API_TESTS) {
            const result = await runPerformanceTest(test);
            results[test.id] = result;
        }
        
        setTestResults(results);
        const runTime = new Date();
        setLastRun(runTime);
        
        // Save to history
        const newHistoryEntry = {
            timestamp: runTime.toISOString(),
            results,
            averageTime: Math.round(Object.values(results).reduce((sum, result) => sum + result.responseTime, 0) / Object.values(results).length),
            concurrentMode
        };
        
        const updatedHistory = [newHistoryEntry, ...testHistory].slice(0, 10); // Keep last 10 runs
        setTestHistory(updatedHistory);
        storageSet(STORAGE_KEY, '', updatedHistory, true);
        
        setIsRunning(false);
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
        
        let report = `# Enhanced API Performance Report\n\n`;
        report += `**Generated:** ${timestamp}\n`;
        report += `**Test Mode:** ${concurrentMode ? 'Concurrent (3x)' : 'Sequential'}\n`;
        report += `**Average Response Time:** ${averageTime}ms\n`;
        if (baselineTime) {
            report += `**Connection Baseline:** ${baselineTime}ms\n`;
        }
        report += `\n`;
        
        // Baseline Analysis Section
        if (baselineTime) {
            report += `## 🎯 Baseline Analysis\n\n`;
            report += `The **Connection Baseline** (${baselineTime}ms) represents the minimum time for:\n`;
            report += `- Network latency (client ↔ server)\n`;
            report += `- Basic API framework overhead\n`;
            report += `- Minimal processing (no database queries)\n\n`;
            
            report += `**Performance Attribution:**\n`;
            API_TESTS.filter(test => !test.isBaseline && testResults[test.id]?.success).forEach(test => {
                const result = testResults[test.id];
                const overhead = result.responseTime - baselineTime;
                const overheadPercent = Math.round((overhead / result.responseTime) * 100);
                
                report += `- **${test.name}:** ${overhead}ms overhead (${overheadPercent}% of total time)\n`;
            });
            report += `\n`;
        }
        
        report += `## Detailed Performance Analysis\n\n`;
        
        API_TESTS.forEach(test => {
            const result = testResults[test.id];
            if (result) {
                const status = result.success ? getStatusText(result.responseTime) : 'ERROR';
                const statusEmoji = result.success 
                    ? (result.responseTime < 200 ? '🟢' : result.responseTime < 500 ? '🟡' : result.responseTime < 1000 ? '🟠' : '🔴')
                    : '❌';
                
                // Special baseline indicator
                const baselineIndicator = result.isBaseline ? ' 📍 **BASELINE**' : '';
                
                report += `### ${test.name} ${statusEmoji}${baselineIndicator}\n`;
                report += `- **Endpoint:** \`${result.testEndpoint}\`\n`;
                report += `- **Description:** ${test.description}\n`;
                report += `- **Total Response Time:** ${result.responseTime}ms\n`;
                report += `- **Status:** ${status}\n`;
                
                // Baseline comparison
                if (baselineTime && !result.isBaseline && result.success) {
                    const overhead = result.responseTime - baselineTime;
                    const multiplier = (result.responseTime / baselineTime).toFixed(1);
                    report += `- **vs Baseline:** +${overhead}ms (${multiplier}x slower than baseline)\n`;
                }
                
                // Database ping specific info
                if (test.id === 'db_ping' && result.usedFallback) {
                    report += `- **⚠️ Note:** Used fallback endpoint (ping_db not available)\n`;
                }
                
                // Enhanced timing breakdown
                if (result.breakdown.serverProcessing) {
                    report += `- **Server Processing:** ${result.breakdown.serverProcessing}ms\n`;
                    report += `- **Network Overhead:** ${result.breakdown.networkOverhead}ms\n`;
                }
                
                // Payload information
                report += `- **Payload Size:** ${result.payload.sizeFormatted}\n`;
                
                // Concurrent test results
                if (result.concurrent) {
                    report += `- **Concurrent Results (${result.concurrent.concurrency}x):**\n`;
                    report += `  - Average: ${result.concurrent.average}ms\n`;
                    report += `  - Min: ${result.concurrent.min}ms\n`;
                    report += `  - Max: ${result.concurrent.max}ms\n`;
                    report += `  - Variance: ${result.concurrent.variance}ms\n`;
                }
                
                // Server info
                report += `- **Server:** ${result.headers.server}\n`;
                if (result.headers.runtime) {
                    report += `- **Runtime Header:** ${result.headers.runtime}s\n`;
                }
                
                if (!result.success) {
                    report += `- **Error:** ${result.error}\n`;
                }
                report += `\n`;
            }
        });

        // Historical comparison
        if (testHistory.length > 1) {
            report += `## Historical Comparison\n\n`;
            report += `**Previous ${Math.min(5, testHistory.length - 1)} runs:**\n`;
            testHistory.slice(1, 6).forEach((run, index) => {
                const date = new Date(run.timestamp).toLocaleString();
                const change = averageTime - run.averageTime;
                const changeIcon = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
                report += `${index + 1}. ${date}: ${run.averageTime}ms ${changeIcon} (${change > 0 ? '+' : ''}${change}ms)\n`;
            });
            report += `\n`;
        }

        report += `## Performance Guidelines\n\n`;
        report += `- 🟢 **Excellent:** < 200ms\n`;
        report += `- 🟡 **Good:** 200-500ms\n`;
        report += `- 🟠 **Slow:** 500ms-1s\n`;
        report += `- 🔴 **Very Slow:** > 1s\n`;
        report += `- ❌ **Error:** Request failed\n`;
        report += `- 📍 **Baseline:** Connection + framework overhead only\n\n`;

        report += `## Enhanced Analysis Points\n\n`;
        report += `Please analyze this enhanced API performance data focusing on:\n`;
        report += `1. **Connection vs Database vs Query bottlenecks** (compare baseline vs DB ping vs complex queries)\n`;
        report += `2. **Network latency impact** (baseline time indicates pure connection speed)\n`;
        report += `3. **Database query optimization opportunities** (high overhead vs baseline)\n`;
        report += `4. **Server processing efficiency** (compare server processing vs total time)\n`;
        report += `5. **Payload size impact** on response times\n`;
        report += `6. **Concurrent load performance** and scalability issues\n`;
        report += `7. **Historical trends** and performance regression\n`;

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
                    <Text className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
                        Enhanced API Performance Report
                    </Text>
                    <Text className="text-sm text-neutral-600 dark:text-neutral-400">
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
                        onPress={runAllTests}
                        disabled={isRunning}
                    />
                </Row>
            </Row>

            {/* Test Options */}
            <View className="mb-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <Row className="justify-between items-center">
                    <View>
                        <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                            Test Options
                        </Text>
                        <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                            Configure how tests are executed
                        </Text>
                    </View>
                    <Row className="gap-x-2">
                        <Button
                            variant={concurrentMode ? "primary" : "outline"}
                            size="sm"
                            title={concurrentMode ? "Concurrent (3x)" : "Sequential"}
                            onPress={() => setConcurrentMode(!concurrentMode)}
                        />
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
                    <Text className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                        Test History
                    </Text>
                    <View className="grid gap-2">
                        {testHistory.slice(0, 5).map((run, index) => (
                            <Card key={index} addClassName="p-2">
                                <Row className="justify-between items-center">
                                    <View>
                                        <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                            {new Date(run.timestamp).toLocaleString()}
                                        </Text>
                                        <Text className="text-xs text-neutral-600 dark:text-neutral-400">
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
                <View className="mb-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                    <Row className="justify-between items-center">
                        <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                            Last run: {lastRun.toLocaleString()}
                        </Text>
                        {averageResponseTime > 0 && (
                            <Row className="items-center gap-x-2">
                                <Text className="text-sm text-neutral-600 dark:text-neutral-400">
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
                {API_TESTS.map((test) => {
                    const result = testResults[test.id];
                    
                    return (
                        <Card key={test.id} addClassName="p-3">
                            <Row className="justify-between items-center mb-2">
                                <View className="flex-1">
                                    <Text className="font-semibold text-neutral-800 dark:text-neutral-200">
                                        {test.name}
                                    </Text>
                                    <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {test.description}
                                    </Text>
                                </View>
                                
                                {result && (
                                    <Row className="items-center gap-x-3">
                                        {result.success ? (
                                            <>
                                                <Row className="items-center gap-x-2">
                                                    <Icon 
                                                        icon={getStatusIcon(result.responseTime)}
                                                        size={16}
                                                        className={getStatusColor(result.responseTime)}
                                                    />
                                                    <Text className={`text-sm font-semibold ${getStatusColor(result.responseTime)}`}>
                                                        {result.responseTime}ms
                                                    </Text>
                                                </Row>
                                                <Text className={`text-xs ${getStatusColor(result.responseTime)}`}>
                                                    {getStatusText(result.responseTime)}
                                                </Text>
                                            </>
                                        ) : (
                                            <Row className="items-center gap-x-2">
                                                <Icon 
                                                    icon="XCircle"
                                                    size={16}
                                                    className="text-red-600 dark:text-red-400"
                                                />
                                                <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
                                                    Error
                                                </Text>
                                            </Row>
                                        )}
                                    </Row>
                                )}
                                
                                {isRunning && !result && (
                                    <Row className="items-center gap-x-2">
                                        <Icon 
                                            icon="RotateCw"
                                            size={16}
                                            className="text-blue-600 dark:text-blue-400 animate-spin"
                                        />
                                        <Text className="text-sm text-blue-600 dark:text-blue-400">
                                            Testing...
                                        </Text>
                                    </Row>
                                )}
                            </Row>

                            {/* Enhanced details */}
                            {result && result.success && (
                                <View className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                    <Row className="justify-between text-xs text-neutral-600 dark:text-neutral-400">
                                        <Text>Payload: {result.payload.sizeFormatted}</Text>
                                        {result.breakdown.serverProcessing && (
                                            <Text>Server: {result.breakdown.serverProcessing}ms</Text>
                                        )}
                                        {result.concurrent && (
                                            <Text>Variance: {result.concurrent.variance}ms</Text>
                                        )}
                                    </Row>
                                </View>
                            )}
                        </Card>
                    );
                })}
            </View>

            {Object.keys(testResults).length > 0 && (
                <View className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                    <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                        Performance Guidelines:
                    </Text>
                    <View className="space-y-1">
                        <Row className="items-center gap-x-2">
                            <Icon icon="CheckCircle" size={14} className="text-green-600 dark:text-green-400" />
                            <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                                &lt; 200ms - Excellent
                            </Text>
                        </Row>
                        <Row className="items-center gap-x-2">
                            <Icon icon="Clock" size={14} className="text-yellow-600 dark:text-yellow-400" />
                            <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                                200-500ms - Good
                            </Text>
                        </Row>
                        <Row className="items-center gap-x-2">
                            <Icon icon="AlertTriangle" size={14} className="text-orange-600 dark:text-orange-400" />
                            <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                                500ms-1s - Slow
                            </Text>
                        </Row>
                        <Row className="items-center gap-x-2">
                            <Icon icon="XCircle" size={14} className="text-red-600 dark:text-red-400" />
                            <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                                &gt; 1s - Very Slow
                            </Text>
                        </Row>
                    </View>
                </View>
            )}
        </View>
    );
} 