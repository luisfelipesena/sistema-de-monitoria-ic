#!/bin/bash

echo "Starting test run for fixed E2E tests..."

# Run only the previously failing tests
npx playwright test \
  chief-signature-workflow.spec.ts:30 \
  edital-publication-workflow.spec.ts:62 \
  professor-template-workflow.spec.ts:82 \
  professor-template-workflow.spec.ts:226 \
  --reporter=list \
  --timeout=20000

echo "Test run completed."