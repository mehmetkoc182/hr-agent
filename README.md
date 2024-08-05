# Recruiter AI Agent

A simple job recruiter agent that finds suitable jobs for job seekers.

# Quickstart Guide:

Install dependencies
`npm install`

Create a `.env` file (check `.env.example`) and add your environment variables:
- Make sure to have your OPENAI_API_KEY key
- Make sure to have a path for the database `DATABASE_URL="file:./db.sqlite"` 

Run the service "Default at port 3000"
`npm run dev`

Tools Used:
- External API for job searches (https://jobicy.com/)
- Calculator tool for math operations
- TavilySearch tool for better definition lookups


# TODO:
- Allow the user to view and return to past conversations.
- Dynamic UI based on responses.
- Add a resume upload tool.
- Apply tailwind styles and make it pretty.

# Issues:
- Sometimes it responds with a hallucination and then on the next response it responds to the earlier query
