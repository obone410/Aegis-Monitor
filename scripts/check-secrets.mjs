import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => !file.endsWith(".png"))
  .filter((file) => file !== "scripts/check-secrets.mjs");

const secretPatterns = [
  { name: "Vercel token", pattern: /vcp_[A-Za-z0-9]{24,}/ },
  { name: "Supabase access token", pattern: /sbp_[A-Za-z0-9]{24,}/ },
  { name: "OpenAI key", pattern: /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/ },
  { name: "Supabase JWT", pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
  { name: "Filled secret assignment", pattern: /(?:TOKEN|SECRET|PRIVATE_KEY|SERVICE_ROLE_KEY)=["']?[^"'\s]+/ }
];

const findings = [];

for (const file of trackedFiles) {
  const content = readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (file === ".env.example" && line.endsWith("=")) {
      return;
    }

    for (const { name, pattern } of secretPatterns) {
      if (pattern.test(line)) {
        findings.push(`${file}:${index + 1} ${name}`);
      }
    }
  });
}

if (findings.length) {
  console.error("Potential committed secrets detected:");
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log("No committed secret patterns detected.");
