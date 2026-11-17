import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Build order section 3: stores/pk and stores/global may only share code via src/shared.
      // Breaking this rule fails the build.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/stores/global/*", "@/stores/global"],
              message: "stores/pk must not import from stores/global. Share code through src/shared instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/stores/global/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/stores/pk/*", "@/stores/pk"],
              message: "stores/global must not import from stores/pk. Share code through src/shared instead.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
