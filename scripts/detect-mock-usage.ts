import * as fs from "fs";
import * as path from "path";

type MockHitKind =
  | "path-mock-folder"
  | "path-mock-file"
  | "import-mock"
  | "hardcoded-data-function";

type MockHit = {
  file: string;
  kind: MockHitKind;
  detail: string;
};

type MockUsageReport = {
  generatedAt: string;
  root: string;
  hits: MockHit[];
};

const MOCK_PATH_REGEX = /(\/|\\)(mock|mocks|__mocks__)(\/|\\)/i;
const MOCK_FILE_REGEX = /(mock|fixture|seed)\.(ts|tsx|js|json)$/i;
const IMPORT_MOCK_REGEX =
  /(from\s+["'](?:@\/)?(?:lib\/)?mock[^"']*["'])|(require\(["'].*mock[^"']*["']\))/;
const HARDCODED_DATA_REGEX =
  /(export\s+const\s+\w+\s*=\s*(\[[^\]]*\]|\{[^}]*\}));?/;

function shouldSkipDir(name: string): boolean {
  return ["node_modules", ".next", ".git", ".turbo", "dist", "build"].includes(name);
}

function walkFiles(root: string): string[] {
  const result: string[] = [];

  const visit = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!shouldSkipDir(entry.name)) {
          visit(fullPath);
        }
      } else if (entry.isFile()) {
        if (
          entry.name.endsWith(".ts") ||
          entry.name.endsWith(".tsx") ||
          entry.name.endsWith(".js") ||
          entry.name.endsWith(".json")
        ) {
          result.push(fullPath);
        }
      }
    }
  };

  visit(root);
  return result;
}

function analyzeFile(filePath: string, projectRoot: string): MockHit[] {
  const relative = path.relative(projectRoot, filePath);
  const hits: MockHit[] = [];

  if (MOCK_PATH_REGEX.test(relative)) {
    hits.push({
      file: relative,
      kind: "path-mock-folder",
      detail: "File located in mock-like folder",
    });
  }

  if (MOCK_FILE_REGEX.test(relative)) {
    hits.push({
      file: relative,
      kind: "path-mock-file",
      detail: "File name suggests mock/fixture/seed usage",
    });
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, idx) => {
    if (IMPORT_MOCK_REGEX.test(line)) {
      hits.push({
        file: relative,
        kind: "import-mock",
        detail: `Mock-like import at line ${idx + 1}: ${line.trim()}`,
      });
    }
    if (HARDCODED_DATA_REGEX.test(line) && !relative.includes("supabase")) {
      hits.push({
        file: relative,
        kind: "hardcoded-data-function",
        detail: `Exported constant with large literal at line ${idx + 1}`,
      });
    }
  });

  return hits;
}

function writeReport(report: MockUsageReport): void {
  const outDir = path.join(process.cwd(), "analysis");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const jsonPath = path.join(outDir, "mock-usage-report.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

  const mdLines: string[] = [];
  mdLines.push(`# Mock Usage Report`);
  mdLines.push("");
  mdLines.push(`Generated at: ${report.generatedAt}`);
  mdLines.push("");
  mdLines.push(`Root: \`${report.root}\``);
  mdLines.push("");

  if (!report.hits.length) {
    mdLines.push("No obvious mock usages detected.");
  } else {
    mdLines.push("## Mock-related findings");
    mdLines.push("");
    for (const hit of report.hits) {
      mdLines.push(
        `- **${hit.file}** (${hit.kind}) – ${hit.detail.replace(/\|/g, "\\|")}`
      );
    }
  }
  mdLines.push("");

  const mdPath = path.join(outDir, "mock-usage-report.md");
  fs.writeFileSync(mdPath, mdLines.join("\n"), "utf8");
}

async function main(): Promise<void> {
  try {
    const root = process.cwd();
    const files = walkFiles(root);

    const hits: MockHit[] = [];
    for (const file of files) {
      hits.push(...analyzeFile(file, root));
    }

    const report: MockUsageReport = {
      generatedAt: new Date().toISOString(),
      root,
      hits,
    };

    writeReport(report);
    // eslint-disable-next-line no-console
    console.log(
      `Mock usage analysis complete. Findings written to ./analysis/mock-usage-report.{json,md}`
    );
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to analyze mock usage", err);
    process.exit(1);
  }
}

void main();

