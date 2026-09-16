#!/usr/bin/env python3

import sys
import csv
import xml.etree.ElementTree as ET


def convert(xml_file, csv_file):
    root = ET.parse(xml_file).getroot()

    suite = root.find("testsuite")

    if suite is None:
        raise ValueError("No <testsuite> found")

    tests = int(suite.get("tests", 0))
    failures = int(suite.get("failures", 0))
    errors = int(suite.get("errors", 0))
    skipped = int(suite.get("skipped", 0))

    passed = tests - failures - errors - skipped

    with open(csv_file, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Tests", "Passed", "Failed", "Skipped"])
        writer.writerow([tests, passed, failures + errors, skipped])


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input.xml> <output.csv>")
        sys.exit(1)

    convert(sys.argv[1], sys.argv[2])
