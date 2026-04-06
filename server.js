import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = "YOUR_OPENAI_API_KEY";

app.post("/analyze", async (req, res) => {
    const { text } = req.body;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "استخرج الأعراض الطبية فقط من النص وارجع Array JSON بالعربي"
                    },
                    {
                        role: "user",
                        content: text
                    }
                ]
            })
        });

        const data = await response.json();

        const result = JSON.parse(data.choices[0].message.content);

        res.json({ symptoms: result });

    } catch (err) {
        res.status(500).json({ error: "AI Error" });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});