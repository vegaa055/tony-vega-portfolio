## Why from scratch

Everyone reaches for Laravel or Django. I wanted to know what those frameworks are actually solving, so I built the whole thing directly: session handling, CSRF tokens, password hashing, file upload validation, SQL prepared statements, pagination, slug generation, nested comment trees, and voting, all by hand.

## What's in it

- Articles with WYSIWYG authoring (TinyMCE) and image uploads
- Threaded forums with nested replies
- User profiles with avatars and activity history
- Upvote/downvote on articles and comments
- Tag system with tag pages

## What I'd do differently

Use a proper ORM for anything past MVP. Hand-rolled SQL is fine until schema changes start cascading. But I'm glad I did it this way first.
