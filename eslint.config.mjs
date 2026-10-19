import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

/*
 * Architecture boundaries (dependencies point DOWN only):
 *
 *   app (routes)  ->  features  ->  components (organisms -> molecules -> ui)  ->  lib / config
 *
 * - Nothing may deep-import a feature's internals: use its public API (@/features/<name>).
 * - Shared components and lib are lower layers: they never import features or routes.
 * - Features never import routes.
 */
const deepFeatureImport = {
  group: ["@/features/*/*"],
  message: "Import from a feature's public API (@/features/<name>), not its internals.",
};
const noFeatures = {
  group: ["@/features/*"],
  message: "Shared components/lib must not depend on features.",
};
const noRoutes = { group: ["@/app/*"], message: "Lower layers must not depend on routes." };

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: [deepFeatureImport] }] },
  },

  {
    files: ["src/components/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}", "src/config/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [deepFeatureImport, noFeatures, noRoutes] }],
    },
  },

  // Atoms and molecules sit below organisms.
  {
    files: ["src/components/ui/**/*.{ts,tsx}", "src/components/molecules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            deepFeatureImport,
            noFeatures,
            noRoutes,
            {
              group: ["@/components/organisms/*"],
              message: "Atoms/molecules must not import organisms.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            deepFeatureImport,
            noFeatures,
            noRoutes,
            {
              group: ["@/components/organisms/*", "@/components/molecules/*"],
              message: "Atoms (ui) are the lowest UI layer.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: [deepFeatureImport, noRoutes] }] },
  },

  prettier,

  globalIgnores([
    ".next",
    ".next/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);
