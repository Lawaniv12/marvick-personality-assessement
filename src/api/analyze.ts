import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { scores, age, name, interests, hobbies } = req.body;

    // Build the prompt
    const prompt = buildPrompt(scores, age, name, interests, hobbies);

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env['CLAUDE_API_KEY']!,
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
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Clean and parse JSON
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    }

    const analysis = JSON.parse(cleanContent);

    // Return the analysis
    return res.status(200).json(analysis);

  } catch (error) {
    console.error('Error in analyze function:', error);
    return res.status(500).json({ 
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
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

  return `You are a professional career counselor. Analyze this personality test result and provide creative, personalized recommendations.

USER PROFILE:
- Name: ${name}
- Age: ${age}${interestsSection}${hobbiesSection}
- Personality Scores:
${Object.entries(scores).map(([cat, score]) => `  * ${cat}: ${score} points`).join('\n')}
- Primary Trait: ${primaryTrait}
- Secondary Trait: ${secondaryTrait}

Respond ONLY with valid JSON (no markdown):

{
  "personalityType": "Creative 2-4 word type",
  "description": "3-4 sentences about their personality",
  "strengths": ["strength1", "strength2", "strength3", "strength4", "strength5"],
  "careerPaths": [
    {
      "title": "Career title",
      "description": "What this involves",
      "whyGoodFit": "Why this fits their personality and interests"
    }
    // 5 careers total
  ],
  "bookRecommendations": [
    {
      "title": "Book title",
      "author": "Author name",
      "reason": "Why this book fits them"
    }
    // 5 books total
  ],
  "courseRecommendations": [
    {
      "title": "Course name",
      "platform": "Platform name",
      "description": "What they'll learn",
      "level": "Beginner/Intermediate/Advanced"
    }
    // 5 courses total
  ],
  "summary": "3-4 inspiring sentences about their potential"
}

Be creative and specific. Reference their interests/hobbies if provided.`;
}