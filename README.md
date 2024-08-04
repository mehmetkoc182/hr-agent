# Recruiter AI Agent

A simple job recruiter agent that finds suitable jobs for job seekers.

# Quickstart Guide:

Install dependencies
`npm install`

Add your OPENAI_API_KEY key in the `.env` file, check `.env.example`

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
