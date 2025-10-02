import axios from 'axios';

class AdvancedAIPresentationService {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.baseURL = 'https://api.openai.com/v1';
        this.timeout = 30000;
        
        if (!this.openaiApiKey) {
            console.warn('OpenAI API key not found. AI features will be limited.');
        }
    }

    validateApiKey() {
        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key is required for AI presentation generation');
        }
    }

    async generatePresentationOutline(topic, context = '', slides = 8, audience = 'research') {
        try {
            console.log(`Generating presentation outline for topic: "${topic}"`);
            
            const prompt = `You are an expert presentation designer specializing in ${audience} presentations.

Topic: "${topic}"
Context: "${context}"
Number of slides: ${slides}
Audience: ${audience}

Please create a comprehensive presentation outline with the following structure:
1. Title slide with compelling title and subtitle
2. Agenda/Overview slide
3. Main content slides (${slides - 3} slides) with specific topics
4. Conclusion slide with key takeaways
5. Q&A slide

For each slide, provide:
- A compelling title (max 8 words)
- Detailed content points (3-5 bullet points)
- Suggested visual elements
- Key statistics or data points if relevant

Format the response as JSON with this structure:
{
  "title": "Main presentation title",
  "subtitle": "Compelling subtitle",
  "slides": [
    {
      "id": "slide-1",
      "title": "Slide Title",
      "content": "Detailed content with bullet points",
      "type": "title|content|image|chart",
      "visualSuggestions": ["suggestion1", "suggestion2"],
      "dataPoints": ["statistic1", "statistic2"]
    }
  ],
  "metadata": {
    "estimatedDuration": "15-20 minutes",
    "audienceLevel": "beginner|intermediate|advanced",
    "keyTopics": ["topic1", "topic2", "topic3"]
  }
}

Return only the JSON object, no additional text.`;

            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert presentation designer. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });

            const content = response.data.choices[0].message.content;
            
            // Clean up the response to extract JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from AI');
            }

            const outline = JSON.parse(jsonMatch[0]);
            
            return {
                success: true,
                outline: outline,
                metadata: {
                    topic,
                    context,
                    slides,
                    audience,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('AI outline generation error:', error);
            throw new Error(`Failed to generate presentation outline: ${error.message}`);
        }
    }

    async generateSlideContent(slideTitle, slideContext, slideType = 'content', previousSlides = []) {
        try {
            console.log(`Generating content for slide: "${slideTitle}"`);
            
            const contextInfo = previousSlides.length > 0 
                ? `Previous slides context: ${previousSlides.map(s => s.title).join(', ')}`
                : '';

            const prompt = `You are an expert content creator for ${slideType} slides.

Slide Title: "${slideTitle}"
Slide Context: "${slideContext}"
Slide Type: ${slideType}
${contextInfo}

Please create comprehensive slide content that includes:

1. **Main Content**: Clear, engaging bullet points or paragraphs
2. **Visual Suggestions**: Specific suggestions for images, charts, or diagrams
3. **Data Points**: Relevant statistics, facts, or insights
4. **Call to Action**: If applicable, what the audience should do next

Format the response as JSON:
{
  "content": "Main slide content with bullet points and explanations",
  "visualSuggestions": ["specific image suggestion", "chart type", "diagram idea"],
  "dataPoints": ["relevant statistic", "key fact", "important insight"],
  "callToAction": "What should the audience do next?",
  "speakerNotes": "Additional notes for the presenter"
}

Make the content engaging, informative, and appropriate for a professional presentation.
Return only the JSON object, no additional text.`;

            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert presentation content creator. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });

            const content = response.data.choices[0].message.content;
            
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from AI');
            }

            const slideContent = JSON.parse(jsonMatch[0]);
            
            return {
                success: true,
                slideContent: slideContent,
                metadata: {
                    slideTitle,
                    slideContext,
                    slideType,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('AI slide content generation error:', error);
            throw new Error(`Failed to generate slide content: ${error.message}`);
        }
    }

    async generateFullPresentation(topic, context, slides = 8, theme = 'research-professional', audience = 'research') {
        try {
            console.log(`Generating full presentation for topic: "${topic}"`);
            
            // First generate the outline
            const outlineResult = await this.generatePresentationOutline(topic, context, slides, audience);
            const outline = outlineResult.outline;

            // Then generate detailed content for each slide
            const slidesWithContent = await Promise.all(
                outline.slides.map(async (slide, index) => {
                    try {
                        const contentResult = await this.generateSlideContent(
                            slide.title,
                            slide.content,
                            slide.type,
                            outline.slides.slice(0, index)
                        );
                        
                        return {
                            ...slide,
                            id: `slide-${index + 1}`,
                            order: index + 1,
                            detailedContent: contentResult.slideContent,
                            visualSuggestions: contentResult.slideContent.visualSuggestions || slide.visualSuggestions,
                            dataPoints: contentResult.slideContent.dataPoints || slide.dataPoints,
                            speakerNotes: contentResult.slideContent.speakerNotes
                        };
                    } catch (error) {
                        console.error(`Error generating content for slide ${index + 1}:`, error);
                        // Return the basic slide if content generation fails
                        return {
                            ...slide,
                            id: `slide-${index + 1}`,
                            order: index + 1,
                            detailedContent: {
                                content: slide.content,
                                visualSuggestions: slide.visualSuggestions || [],
                                dataPoints: slide.dataPoints || [],
                                callToAction: '',
                                speakerNotes: ''
                            }
                        };
                    }
                })
            );

            const fullPresentation = {
                title: outline.title,
                subtitle: outline.subtitle,
                slides: slidesWithContent,
                theme: theme,
                metadata: {
                    ...outline.metadata,
                    topic,
                    context,
                    slides,
                    theme,
                    audience,
                    timestamp: new Date().toISOString()
                }
            };

            return {
                success: true,
                presentation: fullPresentation,
                metadata: {
                    topic,
                    context,
                    slides,
                    theme,
                    audience,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Full presentation generation error:', error);
            throw new Error(`Failed to generate full presentation: ${error.message}`);
        }
    }

    async improveSlideContent(slideId, currentContent, feedback, improvementType = 'general') {
        try {
            console.log(`Improving slide content for slide: ${slideId}`);
            
            const prompt = `You are an expert presentation content reviewer and improver.

Current slide content:
Title: "${currentContent.title}"
Content: "${currentContent.content}"
Type: "${currentContent.type || 'content'}"

Improvement feedback:
"${feedback}"

Improvement type: ${improvementType}

Please improve the slide content based on the feedback while maintaining:
- Professional, academic tone
- Clear structure and readability
- Research-appropriate language
- Concise but informative content
- Engagement with the audience

Format the response as JSON with this structure:
{
  "title": "Improved slide title",
  "content": "Improved slide content with better structure and clarity",
  "improvements": "Description of what was improved",
  "visualSuggestions": ["Updated image suggestions"],
  "dataPoints": ["Updated key statistics"],
  "speakerNotes": "Additional notes for the presenter"
}

Return only the JSON object, no additional text.`;

            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert presentation content reviewer for research presentations. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });

            const content = response.data.choices[0].message.content;
            
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from AI');
            }

            const improvedContent = JSON.parse(jsonMatch[0]);
            
            return {
                success: true,
                improvedContent: improvedContent,
                metadata: {
                    slideId,
                    improvementType,
                    feedback,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Slide content improvement error:', error);
            throw new Error(`Failed to improve slide content: ${error.message}`);
        }
    }

    async generateImageSuggestions(slideTitle, slideContent, theme = 'research-professional') {
        try {
            console.log(`Generating image suggestions for slide: "${slideTitle}"`);
            
            const prompt = `You are an expert in visual presentation design.

Slide Title: "${slideTitle}"
Slide Content: "${slideContent}"
Theme: ${theme}

Please suggest 3-5 specific, actionable image ideas that would enhance this slide. Consider:
- Professional, high-quality imagery
- Relevance to the content
- Visual impact and engagement
- Brand consistency with ${theme} theme

Format the response as JSON:
{
  "suggestions": [
    {
      "type": "photograph|illustration|chart|diagram|icon",
      "description": "Detailed description of the image",
      "purpose": "Why this image enhances the slide",
      "searchTerms": ["keyword1", "keyword2", "keyword3"],
      "placement": "left|right|center|background"
    }
  ]
}

Return only the JSON object, no additional text.`;

            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert in visual presentation design. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1500
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });

            const content = response.data.choices[0].message.content;
            
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from AI');
            }

            const imageSuggestions = JSON.parse(jsonMatch[0]);
            
            return {
                success: true,
                imageSuggestions: imageSuggestions,
                metadata: {
                    slideTitle,
                    theme,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Image suggestions generation error:', error);
            throw new Error(`Failed to generate image suggestions: ${error.message}`);
        }
    }

    async getAvailableThemes() {
        // Return predefined themes
        return {
            success: true,
            themes: [
                {
                    id: 'research-professional',
                    name: 'Research Professional',
                    description: 'Clean, professional theme for research presentations',
                    colors: {
                        primary: '#2563eb',
                        secondary: '#64748b',
                        accent: '#0ea5e9',
                        background: '#ffffff',
                        text: '#1e293b'
                    },
                    fonts: {
                        heading: 'Inter',
                        body: 'Inter'
                    }
                },
                {
                    id: 'academic-classic',
                    name: 'Academic Classic',
                    description: 'Traditional academic presentation style',
                    colors: {
                        primary: '#1e40af',
                        secondary: '#6b7280',
                        accent: '#dc2626',
                        background: '#ffffff',
                        text: '#111827'
                    },
                    fonts: {
                        heading: 'Times New Roman',
                        body: 'Times New Roman'
                    }
                },
                {
                    id: 'modern-scientific',
                    name: 'Modern Scientific',
                    description: 'Contemporary design for scientific presentations',
                    colors: {
                        primary: '#7c3aed',
                        secondary: '#059669',
                        accent: '#dc2626',
                        background: '#ffffff',
                        text: '#0f172a'
                    },
                    fonts: {
                        heading: 'Poppins',
                        body: 'Inter'
                    }
                },
                {
                    id: 'lab-meeting',
                    name: 'Lab Meeting',
                    description: 'Casual, collaborative theme for lab meetings',
                    colors: {
                        primary: '#dc2626',
                        secondary: '#f59e0b',
                        accent: '#10b981',
                        background: '#ffffff',
                        text: '#1f2937'
                    },
                    fonts: {
                        heading: 'Inter',
                        body: 'Inter'
                    }
                },
                {
                    id: 'conference',
                    name: 'Conference',
                    description: 'Professional theme for conference presentations',
                    colors: {
                        primary: '#059669',
                        secondary: '#0ea5e9',
                        accent: '#f59e0b',
                        background: '#ffffff',
                        text: '#111827'
                    },
                    fonts: {
                        heading: 'Inter',
                        body: 'Inter'
                    }
                }
            ]
        };
    }
}

export default AdvancedAIPresentationService;
