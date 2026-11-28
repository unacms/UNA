<?php
/**
 * Renders a GitLab Code Quality JSON report (e.g. `phpstan --error-format=gitlab`) as a standalone HTML page.
 *
 * Usage: php scripts/codequality-html.php gl-code-quality-report.json > codeclimate.html
 */

if ($argc < 2 || !is_readable($argv[1])) {
    fwrite(STDERR, "usage: php codequality-html.php <gl-code-quality-report.json>\n");
    exit(2);
}

$contents = file_get_contents($argv[1]);
if ($contents === false) {
    fwrite(STDERR, "error: could not read file: " . $argv[1] . "\n");
    exit(2);
}
$issues = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
if (!is_array($issues)) {
    fwrite(STDERR, "error: expected a JSON array, got " . gettype($issues) . "\n");
    exit(2);
}
$e = static fn($value): string => htmlspecialchars((string)$value, ENT_QUOTES);

$rows = '';
foreach ($issues as $issue) {
    $rows .= sprintf(
        "<tr><td>%s</td><td>%s:%s</td><td>%s</td></tr>\n",
        $e($issue['severity'] ?? ''),
        $e($issue['location']['path'] ?? ''),
        $e($issue['location']['lines']['begin'] ?? ''),
        $e($issue['description'] ?? '')
    );
}
$summary = count($issues) === 0 ? 'No issues found.' : count($issues) . ' issue(s) found.';

echo <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Code Quality Report</title>
<style>
body { font-family: sans-serif; margin: 2rem; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ccc; padding: .4rem .6rem; text-align: left; vertical-align: top; }
th { background: #f3f3f3; }
</style>
</head>
<body>
<h1>Code Quality Report (PHPStan)</h1>
<p>{$e($summary)}</p>
<table>
<thead><tr><th>Severity</th><th>Location</th><th>Description</th></tr></thead>
<tbody>
{$rows}</tbody>
</table>
</body>
</html>

HTML;
