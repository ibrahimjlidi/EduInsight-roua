# Backend development data

## Seed demo data

Set `MONGO_URI` in `Backend/.env`, then run:

```sh
npm run seed
```

The seed is additive and safe to rerun. It creates or updates only the named
EduInsight demo fixtures; it does not clear collections or modify unrelated
users' records. It verifies the saved courses, lessons, quizzes, questions, choices,
enrollments, attempts, answers, metrics, a sample downloadable resource, notification,
completed lesson records, recommendation, audit event, and certificate before
exiting. The three sample courses contain multiple modules and lessons, course
quizzes, and an optional YouTube lesson video. Re-running the seed updates those
named demo course fixtures without creating duplicate demo courses or resetting
existing accounts.

Demo accounts created on the first run:

| Role | Email |
| --- | --- |
| Admin | `admin@eduinsight.com` |
| Teacher | `teacher@eduinsight.com` |
| Student with a completed course and certificate | `student@eduinsight.com` |
| Student with an active enrollment | `student2@eduinsight.com` |

The seed sets the password for these demo accounts to `123456` on every run.
It only updates the password on an existing account with one of the emails
listed above; other account details and unrelated accounts are left unchanged.
These credentials are for local development only. Change them before using the
accounts in any shared or production environment.

## Account registration

Public registration supports student and teacher accounts. Student codes are
generated automatically; teacher registrations must provide a speciality.
Passwords are hashed before storage and are not included in the registration
response.

## Enforce one active admin

The platform permits only one active admin account. To keep
`admin@eduinsight.com` and deactivate any other admin accounts without deleting
their records, stop the backend and run:

```sh
npm run enforce:single-admin
```

Set `MONGO_URI` in `Backend/.env` first. The command verifies that the selected
admin exists before changing anything, then creates a MongoDB unique index to
prevent a second active admin. Restart the backend afterwards.

## Groq AI configuration

Set `GROQ_API_KEY` in `Backend/.env`. The backend uses `openai/gpt-oss-20b`
by default; set `GROQ_MODEL` to another active Groq model ID only when needed.
Restart the backend after changing either setting. AI provider rejection details
are written to the backend log without returning provider internals to the student.

## Certificates

The demo seed supplies three sample courses with nine modules, 18 text lessons,
three final quizzes, nine questions, and choices. This is starter/demo material,
not a full commercial curriculum; admins and teachers can extend each course
from its **Manage course content** screen, add lesson text and optional video
or PDF links, and attach downloadable course documents in Documents.

Students can track lesson completion in MongoDB and use the course tutor to
summarize or explain the supplied course material. All course lessons must be
completed before a quiz can be taken. Only a score of at least 70% on the
course's final quiz completes the enrollment and issues one persisted
certificate for that student and course; lower scores can be retried.
The authenticated student can retrieve their own certificates from
`GET /api/certificates/mine`; the student dashboard's Certificates page lists
and downloads the certificate with its unique certificate ID.
