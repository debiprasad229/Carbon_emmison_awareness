import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: ['https://ecopulse-802996668281.asia-south2.run.app', 'http://localhost:5173']
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Gemini API Setup
// Use VITE_GEMINI_API_KEY to ensure backwards compatibility with .env during migration
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

// API Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { contents, systemInstruction } = req.body;
    
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Invalid contents format' });
    }
    
    // Initialize model with optional system instructions
    const modelConfig = { model: 'gemini-2.5-flash' };
    if (systemInstruction?.parts?.[0]?.text) {
        modelConfig.systemInstruction = systemInstruction.parts[0].text;
    }
    
    const model = genAI.getGenerativeModel(modelConfig);

    // Format contents for the SDK
    const formattedContents = contents.map(c => ({
      role: c.role === 'model' ? 'model' : 'user',
      parts: c.parts.map(p => ({ text: p.text }))
    }));

    const result = await model.generateContent({ contents: formattedContents });
    const responseText = result.response.text();
    
    res.json({
      candidates: [{
        content: {
          parts: [{ text: responseText }]
        }
      }]
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/scan', async (req, res) => {
  try {
    const { contents } = req.body;
    
    if (!contents || !Array.isArray(contents) || !contents[0]?.parts) {
      return res.status(400).json({ error: 'Invalid contents format' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Format parts for multimodal input
    const formattedParts = contents[0].parts.map(part => {
      if (part.text) return part.text;
      if (part.inlineData) {
        return {
          inlineData: {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType
          }
        };
      }
      return '';
    });

    const result = await model.generateContent(formattedParts);
    const responseText = result.response.text();

    res.json({
      candidates: [{
        content: {
          parts: [{ text: responseText }]
        }
      }]
    });
  } catch (error) {
    console.error('Scan API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Serve static files from the Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for React Router / SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
