# PROGRAD consolidation signatures

Each consolidation is identified by `(ano, semestre, tipo)`, where `tipo` is
`BOLSISTA` or `VOLUNTARIO`. The database enforces this business key. Existing
records are classified as `BOLSISTA` by migration 0070 because the previous PDF
and email flow only generated scholarship results. Do not copy a scholarship
signature into the volunteer record.

The admin page has separate status, request and PDF actions for each modality.
Requesting another link invalidates the previous link for that modality. A signed
record cannot be changed by a normal request; replacing its signature requires
explicit confirmation. Signing uses a conditional UPDATE so concurrent attempts,
expired tokens and replaced tokens cannot overwrite a signature. Uploaded images
must decode as PNG or JPEG, stay under 2 MB and fit the image pixel limit; the
stored image is normalized to PNG.

Volunteer PDFs include approved, undeleted projects with requested volunteer
slots or an existing volunteer vacancy. Scholarship PDFs retain the scholarship
allocation filter. Each renders the corresponding candidate list. An individual
project generation failure aborts the consolidated PDF rather than omitting pages.
The email exporter attaches only the selected modalities, each with its own signature.

## Regression verification

Use a disposable local PostgreSQL database whose name contains `_qa`. Never point
this check at a shared or production database. `pdftotext` is needed to inspect
real generated PDF content.

```sh
DATABASE_URL=postgresql://postgres@127.0.0.1:55435/monitoria_prograd_qa npm run db:push -- --force
PROGRAD_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55435/monitoria_prograd_qa npm run test:prograd
```

The suite uses real PostgreSQL and PDF rendering. Email delivery and selection
fixtures are mocked; browser/HTTP QA must also exercise the actual selection
service and a local SMTP capture. Covered cases include independent signatures,
explicit replacement, concurrent requests/signatures, invalid and expired links,
invalid images, modality-specific email attachments and volunteer-only projects.

## Deployment

Migration `0070_consolidacao_modalidade.sql` must precede the new application.
Back up `consolidacao_prograd_assinatura`, check that no duplicate year/semester
records exist, then apply the migration and record its hash/timestamp in the
Drizzle migration journal in the same transaction. Verify that all existing fields
match the backup and the added modality is `BOLSISTA`. Existing application code
can operate during this additive migration, before any volunteer record is created.

Deploy with `./deploy.sh main`. Verify the running revision, unique index, preserved
backup, modality-specific PDF generation and unauthenticated endpoint protection.
The backup `backup_consolidacao_assinatura_2026_2` from the earlier operational
reset must remain intact. No production signature requests or emails are needed
for deployment verification.

## Pages opened before deployment

The previous single-panel UI did not send `tipo`. Its requests fail before any
signature operation. Missing modality now returns `PRECONDITION_FAILED` with a
Portuguese instruction to reload and choose the appropriate signature section.
Never default a legacy request to either modality: the old request cannot express
which document the user intends to sign. Existing open tabs need one reload.
Next's deployment identity uses `GIT_REV` to version asset requests.

Every HTTP tRPC response includes `x-request-id`. Failed requests log the same ID,
procedure, operation type, error code, authenticated user ID and deployed revision.
This covers input validation failures too. Tokens, signatures, inputs, raw error
messages, cookies and email addresses are excluded. Errors are in application
logs, not `audit_log` or `notificacao_historico`; the latter records email activity.
