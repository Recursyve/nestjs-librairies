#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const defaultJsonPath = path.join(repoRoot, "reports/mutation/mutation.json");
const defaultHtmlPath = path.join(repoRoot, "reports/mutation/mutation-report.html");

function loadReport(reportPath) {
    if (reportPath.endsWith(".json")) {
        return JSON.parse(fs.readFileSync(reportPath, "utf8"));
    }

    return parseHtmlReport(fs.readFileSync(reportPath, "utf8"));
}

function parseHtmlReport(html) {
    const marker = "app.report = ";
    const start = html.indexOf(marker);
    if (start === -1) {
        throw new Error("Could not find app.report payload in HTML report");
    }

    const objectLiteral = extractObjectLiteral(html, start + marker.length);
    // Stryker embeds a JS object literal, not strict JSON (unescaped newlines in replacements, undefined, etc.).
    return Function(`"use strict"; return (${objectLiteral});`)();
}

function extractObjectLiteral(source, start) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    let quote = "";

    for (let index = start; index < source.length; index++) {
        const char = source[index];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === "\\") {
                escaped = true;
            } else if (char === quote) {
                inString = false;
            }
            continue;
        }

        if (char === '"' || char === "'") {
            inString = true;
            quote = char;
            continue;
        }

        if (char === "{") {
            depth++;
        } else if (char === "}") {
            depth--;
            if (depth === 0) {
                return source.slice(start, index + 1);
            }
        }
    }

    throw new Error("Could not find end of app.report object literal in HTML report");
}

function countMutants(report) {
    return Object.values(report.files ?? {}).reduce((total, file) => total + (file.mutants?.length ?? 0), 0);
}

function summarize(report) {
    const survivors = [];
    const noCov = [];
    const counts = { Killed: 0, Survived: 0, NoCoverage: 0, Timeout: 0, Ignored: 0, Error: 0 };

    for (const [file, data] of Object.entries(report.files ?? {})) {
        for (const mutant of data.mutants ?? []) {
            counts[mutant.status] = (counts[mutant.status] ?? 0) + 1;

            if (mutant.status === "Survived") {
                survivors.push({
                    file,
                    line: mutant.location.start.line,
                    mutator: mutant.mutatorName,
                    replacement: (mutant.replacement ?? "").slice(0, 60),
                });
            }

            if (mutant.status === "NoCoverage") {
                noCov.push({ file, line: mutant.location.start.line, mutator: mutant.mutatorName });
            }
        }
    }

    const group = (items) =>
        Object.entries(
            items.reduce((acc, item) => {
                acc[item.file] = (acc[item.file] ?? 0) + 1;
                return acc;
            }, {}),
        ).sort((a, b) => b[1] - a[1]);

    return { counts, survivors, noCov, group };
}

function resolveReportPath(argvPath) {
    if (argvPath) {
        return path.resolve(argvPath);
    }

    const hasJson = fs.existsSync(defaultJsonPath);
    const hasHtml = fs.existsSync(defaultHtmlPath);

    if (hasJson && hasHtml) {
        const jsonMutants = countMutants(JSON.parse(fs.readFileSync(defaultJsonPath, "utf8")));
        // Prefer JSON when it looks like the latest full run; fall back to HTML when JSON is stale.
        if (jsonMutants >= 100) {
            return defaultJsonPath;
        }
        return defaultHtmlPath;
    }

    if (hasJson) {
        return defaultJsonPath;
    }

    if (hasHtml) {
        return defaultHtmlPath;
    }

    return defaultJsonPath;
}

const reportPath = resolveReportPath(process.argv[2]);

if (!fs.existsSync(reportPath)) {
    console.error(`Report not found: ${reportPath}`);
    console.error("Run `npm run test:mutation` first, or pass a report path.");
    process.exit(1);
}

const report = loadReport(reportPath);
const { counts, survivors, noCov, group } = summarize(report);

console.log("REPORT", reportPath);
console.log("MUTANTS", countMutants(report));
console.log("METRICS", JSON.stringify(report.testMetrics ?? counts));
console.log("\nSURVIVED_BY_FILE", JSON.stringify(group(survivors), null, 2));
console.log("\nNO_COV_BY_FILE", JSON.stringify(group(noCov), null, 2));
console.log("\nSURVIVORS_SAMPLE", JSON.stringify(survivors.slice(0, 25), null, 2));
