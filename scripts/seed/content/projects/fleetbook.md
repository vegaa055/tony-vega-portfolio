## Three rewrites on purpose

This project taught me more about architecture than any single build I've done, because I got to solve the same problem three different ways.

**v1: tkinter desktop.** The simplest thing that could work. One user, one machine, SQLite. Fast to build, impossible to share.

**v2: Django.** Multi-user, web-accessible, with auth and admin out of the box. It reminded me how much a mature framework does for free, but also how much overhead it carries when you don't need 80% of it.

**v3: serverless AWS.** Lambda for the API handlers, API Gateway for routing, DynamoDB for the data, S3 for file storage. Cold-start latency, IAM complexity, and vendor lock-in, but also zero idle cost and genuine horizontal scale.
