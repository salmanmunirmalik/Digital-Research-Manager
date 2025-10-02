import axios from 'axios';

class AIPresentationService {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.baseURL = 'https://api.openai.com/v1';
        this.timeout = 60000; // 60 seconds timeout for AI generation
    }

    async generatePresentationOutline(topic, context, slides = 8) {
        try {
            console.log(`Generating presentation outline for topic: ${topic}`);
            
            const prompt = `You are an expert presentation designer specializing in research and scientific presentations. 

Create a comprehensive outline for a presentation about: "${topic}"

Context: ${context}

Requirements:
- Create exactly ${slides} slides
- Include a title slide, main content slides, and conclusion
- Each slide should have a clear, engaging title
- Focus on research methodology, findings, and implications
- Use professional, academic language
- Include data visualization suggestions where appropriate

Format the response as a JSON array of slide objects with this structure:
[
  {
    "title": "Slide Title",
    "content": "Brief description of slide content",
    "type": "title|content|conclusion|data"
  }
]

Return only the JSON array, no additional text.`;

            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert presentation designer for research and scientific content. Always respond with valid JSON only.'
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
            
            // Clean up the response to extract JSON
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from AI');
            }

            const outline = JSON.parse(jsonMatch[0]);
            
            console.log(`Generated outline with ${outline.length} slides`);
            return {
                success: true,
                outline: outline
            };

        } catch (error) {
            console.error('Error generating presentation outline:', error);
            
            if (error.response) {
                const errorMessage = error.response.data?.error?.message || 'AI service error';
                throw new Error(`AI Outline Generation failed: ${errorMessage}`);
            } else if (error.request) {
                throw new Error('AI service is unavailable. Please try again later.');
            } else {
                throw new Error(`Outline generation error: ${error.message}`);
            }
        }
    }

    async generateSlideContent(slideTitle, slideContent, slideType, context = '') {
        try {
            console.log(`Generating content for slide: ${slideTitle}`);
            
            const prompt = `You are an expert presentation content creator for research presentations.

Create detailed content for this slide:

Title: "${slideTitle}"
Type: ${slideType}
Content Description: "${slideContent}"
Context: ${context}

Requirements:
- Create engaging, professional content
- Include specific examples and data points where appropriate
- Use bullet points and clear structure
- Include suggestions for images or charts
- Keep content concise but informative
- Use academic language appropriate for research presentations

Format the response as JSON with this structure:
{
  "title": "Enhanced Slide Title",
  "content": "Detailed slide content with bullet points",
  "visualSuggestions": ["Image suggestion 1", "Image suggestion 2"],
  "dataPoints": ["Key statistic 1", "Key statistic 2"],
  "notes": "Speaker notes or additional context"
}

Return only the JSON object, no additional text.`;

            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert presentation content creator for research presentations. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500
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

            const slideData = JSON.parse(jsonMatch[0]);
            
            console.log(`Generated content for slide: ${slideData.title}`);
            return {
                success: true,
                slideData: slideData
            };

        } catch (error) {
            console.error('Error generating slide content:', error);
            
            if (error.response) {
                const errorMessage = error.response.data?.error?.message || 'AI service error';
                throw new Error(`AI Slide Content Generation failed: ${errorMessage}`);
            } else if (error.request) {
                throw new Error('AI service is unavailable. Please try again later.');
            } else {
                throw new Error(`Slide content generation error: ${error.message}`);
            }
        }
    }

    async generateFullPresentation(topic, context, slides = 8, theme = 'research-professional') {
        try {
            console.log(`Generating full presentation: ${topic}`);
            
            // First generate the outline
            const outlineResult = await this.generatePresentationOutline(topic, context, slides);
            if (!outlineResult.success) {
                throw new Error('Failed to generate outline');
            }

            const outline = outlineResult.outline;
            const presentation = {
                title: topic,
                theme: theme,
                slides: [],
                metadata: {
                    generatedAt: new Date().toISOString(),
                    totalSlides: outline.length,
                    context: context
                }
            };

            // Generate content for each slide
            for (let i = 0; i < outline.length; i++) {
                const slideOutline = outline[i];
                const contentResult = await this.generateSlideContent(
                    slideOutline.title,
                    slideOutline.content,
                    slideOutline.type,
                    context
                );

                if (contentResult.success) {
                    presentation.slides.push({
                        id: `slide-${i + 1}`,
                        order: i + 1,
                        ...contentResult.slideData,
                        originalOutline: slideOutline
                    });
                } else {
                    // Fallback to outline content if AI generation fails
                    presentation.slides.push({
                        id: `slide-${i + 1}`,
                        order: i + 1,
                        title: slideOutline.title,
                        content: slideOutline.content,
                        type: slideOutline.type,
                        visualSuggestions: [],
                        dataPoints: [],
                        notes: ''
                    });
                }

                // Add small delay to avoid rate limiting
                if (i < outline.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            console.log(`Generated complete presentation with ${presentation.slides.length} slides`);
            return {
                success: true,
                presentation: presentation
            };

        } catch (error) {
            console.error('Error generating full presentation:', error);
            throw new Error(`Full presentation generation failed: ${error.message}`);
        }
    }

    async improvePresentationContent(presentationId, slideId, feedback, currentContent) {
        try {
            console.log(`Improving presentation content for slide: ${slideId}`);
            
            const prompt = `You are an expert presentation content reviewer and improver for research presentations.

Current slide content:
Title: "${currentContent.title}"
Content: "${currentContent.content}"

Feedback for improvement:
"${feedback}"

Please improve the slide content based on the feedback while maintaining:
- Professional, academic tone
- Clear structure and readability
- Research-appropriate language
- Concise but informative content

Format the response as JSON with this structure:
{
  "title": "Improved slide title",
  "content": "Improved slide content",
  "improvements": "Description of what was improved",
  "visualSuggestions": ["Updated image suggestions"],
  "dataPoints": ["Updated key statistics"]
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
                max_tokens: 1500
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

            const improvedContent = JSON.parse(jsonMatch[0]);
            
            console.log(`Improved content for slide: ${improvedContent.title}`);
            return {
                success: true,
                improvedContent: improvedContent
            };

        } catch (error) {
            console.error('Error improving presentation content:', error);
            
            if (error.response) {
                const errorMessage = error.response.data?.error?.message || 'AI service error';
                throw new Error(`AI Content Improvement failed: ${errorMessage}`);
            } else if (error.request) {
                throw new Error('AI service is unavailable. Please try again later.');
            } else {
                throw new Error(`Content improvement error: ${error.message}`);
            }
        }
    }

    // Utility method to validate API key
    validateApiKey() {
        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.');
        }
        return true;
    }

    // Method to get available themes
    getAvailableThemes() {
        return [
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
                }
            }
        ];
    }
}

export default AIPresentationService;
