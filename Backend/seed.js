require("dotenv").config();
const bcrypt = require("bcryptjs");
const fs = require("fs/promises");
const mongoose = require("mongoose");
const path = require("path");

const Department = require("./models/Department");
const User = require("./models/User");
require("./models/Admin");
require("./models/Teacher");
require("./models/Student");
const Course = require("./models/Course");
const Module = require("./models/Module");
const Lesson = require("./models/Lesson");
const Quiz = require("./models/Quiz");
const Question = require("./models/Question");
const Choice = require("./models/Choice");
const Inscription = require("./models/Inscription");
const QuizAttempt = require("./models/QuizAttempt");
const Answer = require("./models/Answer");
const PerformanceMetric = require("./models/PerformanceMetric");
const Certificate = require("./models/Certificate");
const LessonProgress = require("./models/LessonProgress");
const Document = require("./models/Document");
const Notification = require("./models/Notification");
const Recommendation = require("./models/Recommendation");
const AuditLog = require("./models/AuditLog");

const DEMO_PASSWORD = "123456";
const DEMO_DOCUMENT_NAME = "eduinsight-demo-learning-guide.txt";
const DEMO_DOCUMENT_CONTENT = [
  "EduInsight demo learning guide",
  "",
  "Use this sample document to test course learning resources.",
  "Sign in as a demo student, open Docs, and download this file.",
  "",
].join("\n");
const seedRecord = async (Model, filter, data) => Model.findOneAndUpdate(
  filter,
  { $setOnInsert: data },
  { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
);
const seedDemoRecord = async (Model, filter, data) => Model.findOneAndUpdate(
  filter,
  { $set: data },
  { returnDocument: "after", upsert: true, runValidators: true }
);
const seedDemoAccount = async (Model, email, data) => {
  const { password, ...profile } = data;
  return Model.findOneAndUpdate(
    { email },
    { $set: { password }, $setOnInsert: profile },
    { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

const seedDatabase = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it to Backend/.env before running npm run seed.");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const password = await bcrypt.hash(DEMO_PASSWORD, 10);
    const department = await seedRecord(Department, { name: "EduInsight Demo Department" }, {
      name: "EduInsight Demo Department",
      description: "Sample department for testing EduInsight workflows.",
    });

    const Admin = User.discriminators.admin;
    const Teacher = User.discriminators.teacher;
    const Student = User.discriminators.student;
    const admin = await seedDemoAccount(Admin, "admin@eduinsight.com", {
      firstName: "Demo",
      lastName: "Admin",
      email: "admin@eduinsight.com",
      password,
      permissions: ["ALL_PERMISSIONS"],
    });
    const teacher = await seedDemoAccount(Teacher, "teacher@eduinsight.com", {
      firstName: "Demo",
      lastName: "Teacher",
      email: "teacher@eduinsight.com",
      password,
      speciality: "Software Development",
      department: department._id,
    });
    const student = await seedDemoAccount(Student, "student@eduinsight.com", {
      firstName: "Demo",
      lastName: "Student",
      email: "student@eduinsight.com",
      password,
      studentCode: "DEMO00001",
      level: "L2",
      group: "DEMO",
      department: department._id,
    });
    const secondStudent = await seedDemoAccount(Student, "student2@eduinsight.com", {
      firstName: "Alex",
      lastName: "Learner",
      email: "student2@eduinsight.com",
      password,
      studentCode: "DEMO00002",
      level: "L1",
      group: "DEMO",
      department: department._id,
    });

    const courseDefinitions = [
      {
        key: "web-development",
        legacyTitle: "Demo Web Development",
        title: "Web Development Foundations",
        description: "Build accessible web pages and interactive user interfaces. Learn semantic HTML, responsive CSS, JavaScript and React components through practical lessons and a final assessment.",
        level: "Beginner",
        status: "completed",
        score: 100,
        modules: [
          {
            title: "Semantic HTML and accessible structure",
            description: "Build the meaningful document structure of a web page.",
            lessons: [
              {
                title: "HTML document structure",
                content: `## What HTML does
HTML describes the meaning and structure of a web page. The browser turns those elements into a tree called the Document Object Model (DOM), which CSS can style and JavaScript can update. Start a document with the doctype declaration, then place page metadata in the head element and visible content in the body element. Set a useful page title and the character encoding so the browser interprets the page correctly.

## Choose elements by meaning
Use the header element for introductory content, nav for a group of navigation links, one main element for the page's central content, section for a distinct topic and footer for closing information. A heading hierarchy gives each topic a clear outline: use an h1 for the page title, then h2 and h3 for nested sections. Prefer these elements to generic containers when they describe the content accurately.

## Example and practice
For a course page, the course title belongs in the main heading, lesson groups can be sections, and the course menu belongs in navigation. Inspect the page outline in your browser's accessibility tools. Practice by sketching the semantic structure of a profile page before adding any colours or layout.`,
              },
              {
                title: "Accessible forms and links",
                content: `## Make controls understandable
Every input needs a visible label associated with it. Give the input an id and set the label's htmlFor to that same value; this gives screen readers a name and lets users click the label to focus the field. Placeholder text is only a hint: it disappears while typing and must not replace a label. Group related controls with fieldset and legend when that improves clarity.

## Links, buttons and images
A link navigates to a destination, while a button performs an action such as saving a form or opening a dialog. Link text should make sense on its own: “Read the HTML lesson” is more helpful than “Click here.” Write concise alt text that conveys the purpose of an informative image. Use alt=\"\" for a purely decorative image so assistive technology can skip it.

## Example and practice
Create a labelled email field, a descriptive link to the next lesson and a Save button. Then navigate the form using only the keyboard. Check that each field can be reached, its label is announced, the focus indicator is visible and validation errors explain how to fix the problem.`,
              },
            ],
          },
          {
            title: "Responsive CSS and layout",
            description: "Arrange content so it works on narrow and wide screens.",
            lessons: [
              {
                title: "The box model and flexible layouts",
                content: `## Understand the box model
Each element is a rectangular box made of content, padding, border and margin. By default, a declared width measures only the content, so padding and borders make the rendered element wider. Applying box-sizing: border-box makes the declared width include padding and borders, which makes sizing easier to predict.

## Pick the right layout tool
Flexbox arranges items along one main direction and is useful for a navigation row or a button group. CSS Grid arranges rows and columns together and works well for a page with a sidebar and content area. Neither tool requires fixed pixel widths; use flexible fractions, percentages and minmax() so space adapts to the viewport.

## Example and practice
Try a two-column course page with grid-template-columns: minmax(0, 1fr) 18rem. Set a max-width on long reading text so lines stay comfortable, and let the columns stack on a narrow screen. Use browser developer tools to inspect an element's box and locate unexpected gaps.`,
              },
              {
                title: "Responsive design and focus",
                content: `## Build a layout that adapts
Responsive design keeps content usable at different viewport sizes. Begin with a narrow-screen layout, then add a media query when the content needs more room. A breakpoint should respond to the layout, not to a particular phone model. Flexible images, percentages, minmax() and max-width usually work better than a large set of fixed widths.

## Keep interaction accessible
Keyboard users need to see which control has focus. Do not remove the browser outline unless you replace it with an equally clear focus style. Text and controls need sufficient contrast, and colour must not be the only signal for an error, status or selected item. Test zooming and keyboard navigation as well as changing the viewport width.

## Example and practice
Open your page at a narrow width and check for horizontal scrolling, clipped buttons or unreadable text. Add one media query to improve the content flow, then tab through every link and button. Confirm that focus remains visible and that status labels still make sense without colour.`,
              },
            ],
          },
          {
            title: "JavaScript and React interfaces",
            description: "Add behaviour and compose reusable interface components.",
            lessons: [
              {
                title: "JavaScript events and application state",
                content: `## Respond to events
JavaScript lets a page respond to events such as a click, a key press or a form submission. Register an event handler for the action you intend to support. For forms, handle the submit event rather than only the click on the submit button; this also covers keyboard submission. Prevent the browser's default form navigation only when your code is ready to handle the data.

## Keep state as the source of truth
Store changing values, such as a selected answer or whether a panel is open, in application state. Update that state when an event happens and render the interface from the new value. Directly changing arbitrary DOM elements can leave the screen out of sync with the data your application uses.

## Example and practice
Build a simple task form: trim the entered text, reject an empty value, add a valid task to a list and clear the input. Show a useful message for invalid input. Split validation and saving into small named functions so each behaviour can be checked independently.`,
              },
              {
                title: "Reusable React components",
                content: `## Compose a page from components
A React component is a function that returns the interface for one part of a page. Break a screen into components when a section has its own purpose or needs reuse. Pass data down through props, and keep state in the component responsible for changing it. Prefer deriving a value from existing props or state over storing a duplicate that can drift out of sync.

## Render lists and connect to external systems
When you render an array, give each item a stable key such as its database id so React can track it between updates. Hooks such as useEffect are for connecting to external systems, for example loading course data when an id changes. Handle loading, success and error states; do not leave a learner looking at an empty page when a request fails.

## Example and practice
Build a CourseCard that receives a course title and description as props, then render several cards from an array with stable keys. Add a loading message and a visible error message to a data-driven screen. The linked video provides an additional React introduction; use the lesson text and your own small component to practise.`,
                VideoUrl: "https://www.youtube.com/watch?v=bMknfKXIFA8",
              },
            ],
          },
        ],
        quizQuestions: [
          {
            statement: "Which HTML element should contain the unique main content of a page?",
            correct: "Use the main element for the page's primary content.",
            incorrect: "Use a footer element for all page content.",
          },
          {
            statement: "What should you do to make a form input understandable to screen-reader users?",
            correct: "Associate the input with a descriptive visible label.",
            incorrect: "Rely on placeholder text as its only label.",
          },
          {
            statement: "Which React practice is best when rendering an array of components?",
            correct: "Give each rendered item a stable key.",
            incorrect: "Use the same fixed id for every item.",
          },
          {
            statement: "When should a button be used instead of a link?",
            correct: "When activating an action rather than navigating to another location.",
            incorrect: "Whenever the text colour should be blue.",
          },
          {
            statement: "What is a good first step when making a layout responsive?",
            correct: "Use flexible sizing and test the content on a narrow screen.",
            incorrect: "Set every element to a fixed desktop width.",
          },
        ],
      },
      {
        key: "database-fundamentals",
        legacyTitle: "Demo Database Fundamentals",
        title: "Database Design and MongoDB",
        description: "Learn how to model application data, choose relationships, query MongoDB safely, and verify that course and assessment records persist correctly.",
        level: "Intermediate",
        status: "active",
        score: 0,
        modules: [
          {
            title: "Data modelling and relationships",
            description: "Represent application entities and their relationships.",
            lessons: [
              {
                title: "Documents, collections and schemas",
                content: `## How MongoDB stores information
MongoDB stores BSON documents in collections. A document is a set of named fields, similar to a JSON object, and a collection groups documents of a related kind. A document commonly has an _id field that uniquely identifies it. For example, an enrolment document can refer to the student and course identifiers it connects.

## Use schemas to keep data reliable
An application schema defines which fields are expected, their types, defaults and validation rules. A required title should not silently be saved as an empty value; a score should stay within its allowed range. Database validation catches invalid records even when a request comes from a different screen or client.

## Example and practice
Sketch a course document with a title, level and teacher id. Decide which fields are required and what types they use. Then sketch a quiz attempt that refers to a student and a quiz. Ask: which fields should be validated, and which records should be referenced rather than copied?`,
              },
              {
                title: "Embedding versus references",
                content: `## Embed data that belongs together
Embedding places related values inside one document. It is useful when child data is small, has a shared lifecycle with its parent and is usually read together. A course may embed a small set of display preferences that only make sense for that course. Reading one document then provides both pieces without another lookup.

## Reference independently managed records
Use references when related records grow large, need their own lifecycle, or are shared by many parents. A student can enrol in many courses and a course can have many students, so an enrolment record can reference both rather than copying their full profiles. References also help avoid repeatedly updating stale copies of the same information.

## Example and practice
Compare two designs for quiz answers. One embeds every answer inside an attempt; the other stores answer records that reference the attempt and question. Consider how many answers an attempt may contain, whether they are read together, and how they are deleted. Choose a design based on actual read and update patterns, not a universal rule.`,
              },
            ],
          },
          {
            title: "Queries and persistence",
            description: "Read and write application records predictably.",
            lessons: [
              {
                title: "Filtering and indexes",
                content: `## Filter to the records you need
A query filter says which documents an operation may read or change. A student-facing progress query should include both the current student's id and the relevant course or lesson; filtering only by an id supplied by the browser can expose someone else's record. Validate ids and request fields before building database operations.

## Use indexes for common queries
An index helps MongoDB find matching documents without scanning the whole collection. Add indexes for fields used frequently in filters and sorts, then confirm the query plan benefits. A unique compound index on student and course can enforce one certificate per course per student even if two requests arrive close together.

## Example and practice
Design a query for one learner's completed lessons in one course. Identify each filter field and consider an index that supports it. Then try inserting the same certificate key twice in a local test database and observe how a unique constraint protects the data.`,
              },
              {
                title: "Safe updates and idempotency",
                content: `## Check permission before writing
Authentication tells the application who is making a request; authorization decides whether that person may change this particular record. Check ownership on every update and delete, not only when loading a form. Accept only fields the user is permitted to edit, and run schema validation when saving changes.

## Make retries safe
Networks can fail after a server saves data but before the client receives the response. A user may then retry the request. An operation is idempotent when repeating it has the same effect as doing it once. Upsert using a stable unique business key for records such as lesson progress, and enforce the key with a unique database index.

## Example and practice
Imagine a certificate request being sent twice after a slow response. Identify the student-course pair as the natural unique key, use it in an upsert, and preserve the first issued certificate rather than creating another. Test a retry and verify that the database still contains one certificate.`,
              },
            ],
          },
          {
            title: "Testing stored data",
            description: "Verify real persistence across application workflows.",
            lessons: [
              {
                title: "Test database writes and reads",
                content: `## Verify persistence end to end
A successful save response is useful, but read the record back to confirm it truly persisted with the correct fields and relationships. Test through the same API a learner or teacher uses. Include cases for missing required values, invalid references, unauthorized writes and a successful retry.

## Keep test data repeatable
Seed sample records with stable identifiers or unique lookup keys. A safe seed updates or inserts only its named fixtures; it does not erase the database or recreate accounts on every run. Run it twice and compare counts to catch duplicate creation.

## Example and practice
Create a course with one module and lesson, then fetch the course player and verify that the lesson appears in the right order. Complete it, reload the player and verify the saved progress. Try a second student's token and confirm that private progress stays private.`,
              },
              {
                title: "Protect multi-user data",
                content: `## Scope private data to its owner
Never trust a student id, role or ownership claim sent by the browser. Read the authenticated user's id from the verified session or token and use it to scope private database queries. When receiving an attempt id, confirm the attempt belongs to the caller before returning results or accepting answers.

## Combine roles with record-level checks
Route-level authorization can say that teachers may manage course content, but the server must also check that the course belongs to that teacher. Administrators may have broader permissions; students should only see their own attempts and the courses in which they are enrolled. Use deny-by-default behaviour when a relationship cannot be verified.

## Example and practice
Sign in as two different demo students. Complete a lesson as one student, then fetch progress with the other student's token. The second account should not see the first learner's completion. Repeat the check for quiz attempts and certificates, and record the expected authorization status for each request.`,
              },
            ],
          },
        ],
        quizQuestions: [
          {
            statement: "When is a referenced document usually preferable to embedding a large child collection?",
            correct: "When the child records have an independent lifecycle or are shared.",
            incorrect: "Whenever two values are displayed on the same page.",
          },
          {
            statement: "Which filter should a student-specific progress query include?",
            correct: "The authenticated student's id.",
            incorrect: "Only the lesson id supplied by the browser.",
          },
          {
            statement: "What does an idempotent upsert help prevent when a request is retried?",
            correct: "Duplicate records for the same unique business key.",
            incorrect: "Schema validation from running.",
          },
          {
            statement: "Why should a query for a student's private records include that student's id?",
            correct: "To scope the results to the authenticated student's own data.",
            incorrect: "To make MongoDB ignore the collection indexes.",
          },
          {
            statement: "Which constraint helps ensure only one certificate is issued per course and student?",
            correct: "A unique database index on the student and course pair.",
            incorrect: "A unique index on the student's display name alone.",
          },
        ],
      },
      {
        key: "learning-analytics",
        legacyTitle: "Demo Learning Analytics",
        title: "Learning Analytics and Assessment",
        description: "Interpret course completion and assessment outcomes, design useful learning measures, and turn observed performance into supportive next steps.",
        level: "Beginner",
        status: "active",
        score: null,
        modules: [
          {
            title: "Learning outcomes and evidence",
            description: "Connect intended learning to observable learner work.",
            lessons: [
              {
                title: "Write measurable learning outcomes",
                content: `## Describe what learners can demonstrate
A learning outcome states what a learner should be able to do after instruction. Use an observable verb such as explain, compare, design, calculate or test. “Understand databases” is difficult to assess; “compare an embedded and referenced data model for a course” tells a learner what success looks like.

## Align teaching and assessment
The lesson, practice task and quiz should all support the same outcome. If the goal is to design a data model, provide an opportunity to model data; a question that only asks learners to recall a term is weak evidence of that skill. Share the outcome before the task so learners know what they are working toward.

## Example and practice
Rewrite “learn responsive web design” as an observable outcome, such as “build a course page that remains usable on narrow and wide screens.” List one practice activity and one way to assess it. Check that each actually demonstrates the skill named in the outcome.`,
              },
              {
                title: "Choose useful evidence",
                content: `## Treat each measure as limited evidence
A quiz score describes performance on that particular assessment under its conditions. It is not a complete description of a learner's knowledge, motivation or potential. A completed lesson shows that a learner marked it complete; unless the system observes more, it does not prove how long the material was studied or whether every idea was mastered.

## Combine signals with care
Completion, attempts and scores can provide useful context together. Define each measure, its time window and the population it covers. Do not infer a cause from a pattern alone: lower scores in one topic may be a reason to investigate the material, not proof that the instructor or learners caused the result.

## Example and practice
Write a short note for an administrator explaining what “average quiz score” does and does not mean. Include how many submitted attempts were counted, and avoid labelling individual students based on one assessment.`,
              },
            ],
          },
          {
            title: "Read performance measures",
            description: "Summarize course and learner results with context.",
            lessons: [
              {
                title: "Averages, rates and sample sizes",
                content: `## Define the calculation
An average is the sum of the included values divided by how many values are included. State whether the unit is a learner, a quiz attempt or a course. If a learner submits several attempts, averaging attempts gives that learner more influence than averaging each learner's latest result.

## Make rates interpretable
A completion rate needs a numerator, a denominator and a time window. For example, “12 of 20 active enrolments completed this course during September” is clearer than “60% complete.” If the denominator is small, one learner can change the percentage substantially.

## Example and practice
Suppose 3 of 5 enrolled learners finished a course this month. Report both 3/5 and 60%, name the month and define which enrolments count. Then consider what happens if the denominator changes to include learners who enrolled yesterday; explain why the definition matters.`,
              },
              {
                title: "Compare progress over time",
                content: `## Make fair comparisons
Compare like with like: use the same definitions, course population and time window for each period. A weekly count of new enrolments is different from the total number of active enrolments. Label the dates and include enough context that a reader can interpret a chart without guessing.

## Separate kinds of activity
Do not treat an opened quiz, an unfinished attempt and a submitted attempt as equivalent. Decide which event the metric measures and apply that definition consistently. Missing data should not silently become zero; explain whether the value means no activity, not measured or unavailable.

## Example and practice
Compare submitted quiz attempts this week and last week. Check that both periods have the same length and that only submitted attempts are counted. If scores changed, describe the observation and propose what to investigate next; do not claim that one change caused the other.`,
              },
            ],
          },
          {
            title: "Assessment feedback and action",
            description: "Use scores to help learners improve and courses improve.",
            lessons: [
              {
                title: "Set a clear mastery threshold",
                content: `## Explain the passing rule in advance
Learners should know what counts as passing before they begin an assessment. A threshold such as 70% needs to be visible on the quiz page and used consistently when calculating the result. The assessment itself should cover the intended learning outcomes fairly, with clear questions and dependable answer keys.

## Use results to guide learning
A threshold is a decision rule, not a measurement of a person's worth or fixed ability. A result below the threshold identifies material to review and skills to practise. Give learners feedback that points to a lesson or practice activity and, when appropriate, a chance to try again.

## Example and practice
Write learner-facing instructions for a quiz with a 70% pass mark and one retake. State how the score is calculated, what happens after a lower score and what achievement earns a certificate. Check that the rule matches the behaviour in the application.`,
              },
              {
                title: "Turn evidence into a next step",
                content: `## Make feedback actionable
Helpful feedback connects evidence to an action. Acknowledge what went well, identify one specific skill to practise, point to the relevant lesson and suggest a manageable next step. “Study more” is vague; “review the lesson on completion rates, then calculate the denominator in the practice example” is something a learner can do.

## Keep recommendations grounded
Use submitted answers and actual lesson material to choose review topics. Do not invent a weakness when there is no evidence, reveal quiz answer keys in feedback, or treat an AI suggestion as a diagnosis. Teachers can use aggregated results to spot a topic that may deserve another explanation.

## Example and practice
Write a short recommendation for a learner who missed questions about sample sizes. Name the concept, point to “Averages, rates and sample sizes,” and give one practice action. Make sure the advice is supportive, specific and possible to complete before a retry.`,
              },
            ],
          },
        ],
        quizQuestions: [
          {
            statement: "What makes a learning outcome measurable?",
            correct: "It describes an observable action such as explain, compare or design.",
            incorrect: "It only says that learners will know the topic.",
          },
          {
            statement: "What should accompany a completion rate in an administrator report?",
            correct: "Its defined denominator and the number of enrollments measured.",
            incorrect: "A claim that the rate proves why learners completed a course.",
          },
          {
            statement: "How should a score below the course mastery threshold be used?",
            correct: "As a prompt for focused practice, feedback and another attempt.",
            incorrect: "As a permanent judgement about the learner's ability.",
          },
          {
            statement: "What context helps a reader interpret a course completion rate?",
            correct: "The observation period and number of enrollments in the denominator.",
            incorrect: "The highest individual score, without a sample size.",
          },
          {
            statement: "What should an actionable recommendation identify?",
            correct: "A specific skill to practise and relevant material to review.",
            incorrect: "A learner's fixed ability based on one attempt.",
          },
        ],
      },
    ];

    const seededCourses = [];
    for (const [index, definition] of courseDefinitions.entries()) {
      const course = await seedDemoRecord(Course, {
        $or: [{ Title: definition.title }, { Title: definition.legacyTitle }],
      }, {
        Title: definition.title,
        Description: definition.description,
        Department: department._id,
        Teacher: teacher._id,
        Duration: `${8 + index * 2} hours`,
        Level: definition.level,
      });
      seededCourses.push({ ...definition, document: course });

      const courseModules = [];
      for (const [moduleIndex, moduleDefinition] of definition.modules.entries()) {
        const module = await seedDemoRecord(Module, { course: course._id, Order: moduleIndex + 1 }, {
          Title: moduleDefinition.title,
          Description: moduleDefinition.description,
          Order: moduleIndex + 1,
          course: course._id,
        });
        courseModules.push(module);
        for (const [lessonIndex, lessonDefinition] of moduleDefinition.lessons.entries()) {
          await seedDemoRecord(Lesson, { module: module._id, Order: lessonIndex + 1 }, {
            Title: lessonDefinition.title,
            Content: lessonDefinition.content,
            VideoUrl: lessonDefinition.VideoUrl,
            Order: lessonIndex + 1,
            module: module._id,
          });
        }
      }
      seededCourses[seededCourses.length - 1].modules = courseModules;

      const quiz = await seedDemoRecord(Quiz, {
        course: course._id,
        $or: [
          { Title: `${definition.title} Checkpoint` },
          { Title: `${definition.legacyTitle} Checkpoint` },
        ],
      }, {
        course: course._id,
        Title: `${definition.title} Checkpoint`,
        Description: `A short assessment for ${definition.title}.`,
        Duration: 15,
        isPublished: true,
        Order: 1,
        isFinal: true,
        createdBy: teacher._id,
      });
      const questions = [];
      for (const [questionIndex, seedQuestion] of definition.quizQuestions.entries()) {
        const questionData = {
          quiz: quiz._id,
          Statement: seedQuestion.statement,
          Type: "MCQ",
          Points: 2,
          Order: questionIndex + 1,
        };
        const question = await Question.findOneAndUpdate(
          { quiz: quiz._id, Order: questionIndex + 1 },
          { $set: questionData },
          { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
        );
        const correctChoice = await seedDemoRecord(Choice, { question: question._id, Order: 1 }, {
          question: question._id,
          Text: seedQuestion.correct,
          isCorrect: true,
          Order: 1,
        });
        const incorrectChoice = await seedDemoRecord(Choice, { question: question._id, Order: 2 }, {
          question: question._id,
          Text: seedQuestion.incorrect,
          isCorrect: false,
          Order: 2,
        });
        questions.push({ question, correctChoice, incorrectChoice });
      }
      seededCourses[seededCourses.length - 1].quiz = quiz;
      seededCourses[seededCourses.length - 1].questions = questions;
    }

    for (const [index, course] of seededCourses.entries()) {
      const enrollment = await seedRecord(Inscription, { student: student._id, course: course.document._id }, {
        student: student._id,
        course: course.document._id,
        status: course.status,
      });
      if (index < 2) {
        const attempt = await seedRecord(QuizAttempt, { student: student._id, quiz: course.quiz._id }, {
          student: student._id,
          quiz: course.quiz._id,
          score: course.score,
          totalQuestions: course.questions.length,
          startedAt: new Date(),
          submittedAt: new Date(),
          duration: 300,
        });
        for (const [questionIndex, item] of course.questions.entries()) {
          const selectedChoice = course.score === 100
            ? item.correctChoice._id
            : item.incorrectChoice._id;
          await seedRecord(Answer, { attempt: attempt._id, question: item.question._id }, {
            attempt: attempt._id,
            question: item.question._id,
            selectedChoice,
            isCorrect: course.score === 100,
            pointsEarned: course.score === 100 ? item.question.Points : 0,
          });
        }
        if (index === 0) {
          for (const module of course.modules) {
            const lessons = await Lesson.find({ module: module._id }).select("_id");
            for (const lesson of lessons) {
              await seedRecord(LessonProgress, {
                student: student._id,
                lesson: lesson._id,
              }, {
                student: student._id,
                course: course.document._id,
                lesson: lesson._id,
                completedAt: new Date(),
              });
            }
          }
        }
      }

      if (index === 1) {
        await seedRecord(Inscription, { student: secondStudent._id, course: course.document._id }, {
          student: secondStudent._id,
          course: course.document._id,
          status: "active",
        });
      }

      await seedRecord(PerformanceMetric, {
        student: student._id,
        course: course.document._id,
        weekName: "Demo Week 1",
      }, {
        student: student._id,
        course: course.document._id,
        weekName: "Demo Week 1",
        quizScoreAverage: course.score ?? 0,
        attendanceRate: course.status === "completed" ? 100 : 75,
      });

      if (enrollment.status === "completed") {
        await seedRecord(Certificate, { student: student._id, course: course.document._id }, {
          student: student._id,
          course: course.document._id,
          certificateCode: `EI-DEMO-${course.key.toUpperCase()}`,
          issuedAt: new Date(),
          score: course.score,
          quizAttempt: await QuizAttempt.findOne({ student: student._id, quiz: course.quiz._id }).then((attempt) => attempt._id),
        });
      }
    }

    const demoDocumentPath = path.join(__dirname, "uploads", "docs", DEMO_DOCUMENT_NAME);
    await fs.mkdir(path.dirname(demoDocumentPath), { recursive: true });
    try {
      await fs.writeFile(demoDocumentPath, DEMO_DOCUMENT_CONTENT, { flag: "wx" });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }

    const documentStat = await fs.stat(demoDocumentPath);
    await seedRecord(Document, { fileName: DEMO_DOCUMENT_NAME }, {
      title: "Demo Course Learning Guide",
      description: "Sample course resource for testing document access and downloads.",
      fileName: DEMO_DOCUMENT_NAME,
      originalName: DEMO_DOCUMENT_NAME,
      mimeType: "text/plain",
      size: documentStat.size,
      course: seededCourses[0].document._id,
      uploadedBy: teacher._id,
      audience: "all",
    });
    await seedRecord(Notification, {
      user: student._id,
      title: "Demo course enrollment",
      type: "enrollment",
    }, {
      user: student._id,
      title: "Demo course enrollment",
      message: "Your EduInsight demo courses are ready to explore.",
      type: "enrollment",
      isRead: false,
    });
    await seedRecord(Recommendation, {
      student: student._id,
      message: "Review the database lesson and retry the checkpoint quiz.",
      type: "practice",
    }, {
      student: student._id,
      message: "Review the database lesson and retry the checkpoint quiz.",
      type: "practice",
      confidenceScore: 0.9,
    });
    await seedRecord(AuditLog, {
      user: admin._id,
      action: "SEED",
      entity: "Course",
      entityId: seededCourses[0].document._id,
    }, {
      user: admin._id,
      action: "SEED",
      entity: "Course",
      entityId: seededCourses[0].document._id,
      ipAddress: "127.0.0.1",
    });

    const seededQuizIds = seededCourses.map((course) => course.quiz._id);
    const courseIds = seededCourses.map((course) => course.document._id);
    const [courseCount, quizCount, moduleCount, lessonCount, questionCount, choiceCount, enrollmentCount, attemptCount, answerCount, metricCount, certificateCount, lessonProgressCount, documentCount, notificationCount, recommendationCount, auditLogCount] = await Promise.all([
    Course.countDocuments({ _id: { $in: courseIds } }),
    Quiz.countDocuments({ course: { $in: courseIds } }),
      Module.countDocuments({ course: { $in: seededCourses.map((course) => course.document._id) } }),
      Lesson.countDocuments({ module: { $in: await Module.find({ course: { $in: seededCourses.map((course) => course.document._id) } }).distinct("_id") } }),
      Question.countDocuments({ quiz: { $in: seededQuizIds } }),
      Choice.countDocuments({ question: { $in: await Question.find({ quiz: { $in: seededQuizIds } }).distinct("_id") } }),
      Inscription.countDocuments({ student: { $in: [student._id, secondStudent._id] } }),
      QuizAttempt.countDocuments({ student: student._id, submittedAt: { $ne: null } }),
      Answer.countDocuments({ attempt: { $in: await QuizAttempt.find({ student: student._id }).distinct("_id") } }),
      PerformanceMetric.countDocuments({ student: student._id }),
      Certificate.countDocuments({ student: student._id }),
      LessonProgress.countDocuments({ student: student._id, course: courseIds[0] }),
      Document.countDocuments({ fileName: DEMO_DOCUMENT_NAME }),
      Notification.countDocuments({ user: student._id, title: "Demo course enrollment" }),
      Recommendation.countDocuments({ student: student._id, type: "practice" }),
      AuditLog.countDocuments({ user: admin._id, action: "SEED", entityId: seededCourses[0].document._id }),
    ]);

    console.log("Demo records are saved in MongoDB. Collections and unrelated user accounts were not deleted or changed.");
    console.log("Demo admin: admin@eduinsight.com");
    console.log("Demo teacher: teacher@eduinsight.com");
    console.log("Demo student: student@eduinsight.com (completed course and certificate)");
    console.log("Demo second student: student2@eduinsight.com");
    console.log(`Password for demo accounts: ${DEMO_PASSWORD}`);
    console.log(`Verified in MongoDB: ${courseCount} courses, ${moduleCount} modules, ${lessonCount} lessons, ${quizCount} quizzes, ${questionCount} questions, ${choiceCount} choices, ${enrollmentCount} enrollments, ${attemptCount} submitted attempts, ${answerCount} answers, ${metricCount} performance metrics, ${lessonProgressCount} completed lesson records, ${documentCount} sample document, ${notificationCount} notification, ${recommendationCount} saved recommendation, ${auditLogCount} audit event and ${certificateCount} certificate(s).`);
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase().catch((error) => {
  console.error("Failed to seed demo data:", error.message);
  process.exitCode = 1;
});
