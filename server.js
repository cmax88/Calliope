// server.js

const express = require('express');
const fetch = require('node-fetch');
const app = express();
require('dotenv').config();

app.use(express.json());
app.use(express.static('.'));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID || 'asst_pgbA3hHpdIXWZaseyOnmwnb4'; // Replace with your assistant ID

if (!OPENAI_API_KEY) {
    console.error('Error: OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable.');
    process.exit(1);
}

if (!ASSISTANT_ID) {
    console.error('Error: Assistant ID is not set. Please set the ASSISTANT_ID environment variable.');
    process.exit(1);
}

// Create a thread
app.post('/createThread', async (req, res) => {
    try {
        const response = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });
        const data = await response.json();
        if (response.ok) {
            res.json(data);
        } else {
            console.error('Error creating thread:', data);
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error('Error in /createThread:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Post a message to a thread
app.post('/threads/:threadId/messages', async (req, res) => {
    const threadId = req.params.threadId;
    const { role, content } = req.body;

    try {
        const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                role,
                content
            })
        });
        const data = await response.json();
        if (response.ok) {
            res.json(data);
        } else {
            console.error('Error posting message:', data);
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error('Error in /threads/:threadId/messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start a run
app.post('/threads/:threadId/runs', async (req, res) => {
    const threadId = req.params.threadId;

    try {
        const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                assistant_id: ASSISTANT_ID
            })
        });
        const data = await response.json();
        if (response.ok) {
            res.json(data);
        } else {
            console.error('Error starting run:', data);
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error('Error in /threads/:threadId/runs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get messages from a thread
app.get('/threads/:threadId/messages', async (req, res) => {
    const threadId = req.params.threadId;

    try {
        const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'GET',
            headers: {
                'OpenAI-Beta': 'assistants=v2',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });
        const data = await response.json();
        if (response.ok) {
            res.json(data);
        } else {
            console.error('Error getting messages:', data);
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error('Error in /threads/:threadId/messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
