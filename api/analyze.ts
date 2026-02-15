import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Test response
  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'API is working!',
      timestamp: new Date().toISOString()
    });
  }

  // Only allow POST for actual analysis
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { scores, age, name, interests, hobbies } = req.body;

    // Validate input
    if (!scores || !age || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields: scores, age, name' 
      });
    }

    // Build the prompt
    const prompt = buildPrompt(scores, age, name, interests, hobbies);

    // Call Claude API
    const claudeApiKey = process.env['CLAUDE_API_KEY'];
    
    if (!claudeApiKey) {
      return res.status(500).json({ 
        error: 'CLAUDE_API_KEY not configured' 
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 0.9,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return res.status(500).json({ 
        error: 'Claude API request failed',
        status: response.status,
        details: errorText
      });
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Clean and parse JSON
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\n?/g, '');
    }

    const analysis = JSON.parse(cleanContent);

    // Return the analysis
    return res.status(200).json(analysis);

  } catch (error) {
    console.error('Error in analyze function:', error);
    return res.status(500).json({ 
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

function buildPrompt(
  scores: any,
  age: number,
  name: string,
  interests?: string,
  hobbies?: string
): string {
  const sortedScores = Object.entries(scores)
    .sort(([, a]: any, [, b]: any) => b - a);
  
  const primaryTrait = sortedScores[0][0];
  const secondaryTrait = sortedScores[1]?.[0] || primaryTrait;

  const interestsSection = interests ? `\n- Interests: ${interests}` : '';
  const hobbiesSection = hobbies ? `\n- Hobbies: ${hobbies}` : '';
  const hasPersonalInfo = interests || hobbies;

  return `You are a creative career counselor and personality analyst. Provide a unique, insightful analysis that goes beyond generic advice.

USER PROFILE:
- Name: ${name}
- Age: ${age}${interestsSection}${hobbiesSection}
- Personality Scores:
${Object.entries(scores).map(([cat, score]) => `  * ${cat}: ${score} points`).join('\n')}
- Primary Trait: ${primaryTrait}
- Secondary Trait: ${secondaryTrait}

TASK: Create a creative, personalized analysis${hasPersonalInfo ? ' that weaves in their specific interests and hobbies' : ''}. Think beyond obvious career paths - suggest unique opportunities that match their personality.

Respond ONLY with valid JSON (no markdown):

{
  "personalityType": "A catchy, creative 2-4 word personality type",
  "description": "3-4 sentences capturing their unique essence${hasPersonalInfo ? ', mentioning their interests/hobbies' : ''}",
  "strengths": ["strength1", "strength2", "strength3", "strength4", "strength5"],
  "careerPaths": [
    {
      "title": "Career title",
      "description": "What this involves",
      "whyGoodFit": "How this aligns with personality${hasPersonalInfo ? ' and interests' : ''}"
    }
  ],
  "bookRecommendations": [
    {
      "title": "Book title",
      "author": "Author name",
      "reason": "Why this resonates${hasPersonalInfo ? ' with their profile' : ''}"
    }
  ],
  "courseRecommendations": [
    {
      "title": "Course name",
      "platform": "Platform name",
      "description": "What they learn",
      "level": "Beginner/Intermediate/Advanced"
    }
  ],
  "summary": "3-4 inspiring sentences celebrating their unique blend of traits and potential"
}

Provide exactly 5 items for each array. Be creative, specific, and insightful!`;
}