# AP Assistant — 1,065 Q&A Knowledge Base

This version expands your original browser chatbot with **1,065 natural-language Q&A examples** across greetings, AI, coding, web design, study, productivity, business, science, math, security, travel, finance basics, and more.

## Important: this is not the same as a real AI model

A Q&A knowledge base is useful for common questions, but it does **not** give the browser the general intelligence of ChatGPT. It only matches a user's question to stored examples.

For a real AI assistant that can answer new questions, use:

**Browser → your backend → AI model API**

Never put an AI provider API key directly in `script.js`, `data.js`, or other public frontend files.

## What was changed

- `data.js` now contains 1,065 Q&A variants.
- `knowledge_base.json` contains the same data in an easy-to-edit JSON format.
- `script.js` now actually uses `KNOWLEDGE_BASE` instead of the tiny demo array.
- Matching is more flexible: it uses question phrases, keywords, and word overlap.
- A safer fallback is shown when there is not a strong enough match.
- Your original UI, logo, onboarding, history, and styling are preserved.

## How to add more

Add an object to `data.js` using this shape:

```js
{
  "questions": [
    "What is my new topic?",
    "Explain my new topic",
    "Tell me about my new topic"
  ],
  "keywords": [
    "new topic",
    "my new topic"
  ],
  "answer": "Your answer goes here."
}
```

## Recommended next upgrade

If you want AP Assistant to behave like a real AI:

1. Keep this local knowledge base for common/static answers.
2. Add a backend `/api/ask` endpoint.
3. Send the user's question to the backend.
4. Let the backend call your chosen AI provider.
5. Keep the API key in an environment variable on the server.
6. Add RAG later if you want the assistant to answer from your own documents, business information, services, or website content.
7. Add rate limiting and logging so the public site cannot abuse your AI API.

## Current-data warning

This local file is not a live database. It does not automatically know today's news, weather, prices, laws, sports scores, or newly released information. Use live search/tools or a backend for current information.
