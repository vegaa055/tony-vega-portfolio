Form trigger → Claude generates structured lyrics in JSON → Suno generates the audio → S3 stores the result → the response returns a public URL. A 17-node n8n workflow with error handling and retry logic.

## What it does

A user fills in a form (mood, genre, theme, length). The workflow calls Claude with a structured-output prompt to produce lyrics in a consistent JSON schema (verses, chorus, bridge), hands that to a Suno AI wrapper for audio generation, uploads the finished MP3 to S3, and returns a shareable URL.

## Why n8n

I could have written this as a Flask app in a weekend. I chose n8n deliberately: the whole pipeline has to be legible and editable by someone who doesn't write Python. Visual workflows are the right tool when the operator isn't the builder.
