# Backend development data

## Seed demo data

Set `MONGO_URI` in `Backend/.env`, then run:

```sh
npm run seed
```

The seed is additive and safe to rerun. It creates or updates only the named
EduInsight demo fixtures; it does not clear collections or modify other users'
records. It verifies the saved courses, lessons, quizzes, questions, choices,
enrollments, attempts, answers, metrics, a sample downloadable resource, notification,
recommendation, audit event, and certificate before exiting.

Demo accounts created on the first run:

| Role | Email |
| --- | --- |
| Admin | `demo.admin@eduinsight.test` |
| Teacher | `demo.teacher@eduinsight.test` |
| Student with a completed course and certificate | `demo.student@eduinsight.test` |
| Student with an active enrollment | `demo.student2@eduinsight.test` |

The first run sets the password for these new accounts to `DemoEduInsight123!`.
Existing accounts are never reset by the seed. Change demo passwords before
using these accounts anywhere other than local development.

## Certificates

Students receive a persisted certificate when a submitted quiz earns at least
70%. The authenticated student can retrieve their own certificates from
`GET /api/certificates/mine`; the student dashboard's Certificates page lists
and downloads the certificate with its unique certificate ID.
