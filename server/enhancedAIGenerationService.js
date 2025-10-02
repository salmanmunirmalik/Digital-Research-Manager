import axios from 'axios';

class EnhancedAIGenerationService {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.togetherApiKey = process.env.TOGETHER_API_KEY;
        this.openaiBaseURL = 'https://api.openai.com/v1';
        this.togetherBaseURL = 'https://api.together.xyz/v1';
        this.timeout = 30000;
        
        if (!this.openaiApiKey) {
            console.warn('OpenAI API key not found. AI features will be limited.');
        }
        if (!this.togetherApiKey) {
            console.warn('Together API key not found. Image generation will be limited.');
        }
    }

    validateApiKey() {
        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key is required for AI generation');
        }
    }

    async generatePresentationWithImages(topic, context = '', slides = 8, theme = 'research-professional', audience = 'research') {
        try {
            console.log(`Generating presentation with images for topic: "${topic}"`);
            
            // First generate the presentation outline
            const outlineResult = await this.generatePresentationOutline(topic, context, slides, audience);
            const outline = outlineResult.outline;

            // Generate images for each slide
            const slidesWithImages = await Promise.all(
                outline.slides.map(async (slide, index) => {
                    try {
                        // Generate image for the slide
                        const imageResult = await this.generateSlideImage(slide.title, slide.content, theme);
                        
                        return {
                            ...slide,
                            id: `slide-${index + 1}`,
                            order: index + 1,
                            generatedImage: imageResult.imageUrl,
                            imagePrompt: imageResult.prompt,
                            visualSuggestions: imageResult.suggestions || slide.visualSuggestions
                        };
                    } catch (error) {
                        console.error(`Error generating image for slide ${index + 1}:`, error);
                        // Return the basic slide if image generation fails
                        return {
                            ...slide,
                            id: `slide-${index + 1}`,
                            order: index + 1,
                            generatedImage: null,
                            imagePrompt: null,
                            visualSuggestions: slide.visualSuggestions || []
                        };
                    }
                })
            );

            const fullPresentation = {
                title: outline.title,
                subtitle: outline.subtitle,
                slides: slidesWithImages,
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
            console.error('Enhanced presentation generation error:', error);
            throw new Error(`Failed to generate enhanced presentation: ${error.message}`);
        }
    }

    async generateSlideImage(slideTitle, slideContent, theme = 'research-professional') {
        try {
            console.log(`Generating image for slide: "${slideTitle}"`);
            
            if (!this.togetherApiKey) {
                return {
                    imageUrl: null,
                    prompt: null,
                    suggestions: ['Professional image related to the slide content']
                };
            }

            const prompt = `Create a professional, high-quality image for a research presentation slide.

Slide Title: "${slideTitle}"
Slide Content: "${slideContent}"
Theme: ${theme}

The image should be:
- Professional and academic in style
- Relevant to the slide content
- High quality and visually appealing
- Suitable for a research presentation
- Clean and uncluttered design
- Professional color scheme

Style: Professional presentation image, clean design, academic tone, high quality`;

            const response = await axios.post(`${this.togetherBaseURL}/images/generations`, {
                model: 'stabilityai/stable-diffusion-xl-base-1.0',
                prompt: prompt,
                width: 1024,
                height: 768,
                quality: 'standard',
                num_images: 1,
                style: 'natural'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.togetherApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });

            const imageUrl = response.data.data[0].url;
            
            return {
                imageUrl: imageUrl,
                prompt: prompt,
                suggestions: [
                    'Professional presentation image',
                    'Clean academic design',
                    'High-quality visual content'
                ]
            };

        } catch (error) {
            console.error('Image generation error:', error);
            return {
                imageUrl: null,
                prompt: null,
                suggestions: ['Professional image related to the slide content']
            };
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
- Image generation prompts for AI image creation

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
      "dataPoints": ["statistic1", "statistic2"],
      "imagePrompt": "Detailed prompt for AI image generation"
    }
  ],
  "metadata": {
    "estimatedDuration": "15-20 minutes",
    "audienceLevel": "beginner|intermediate|advanced",
    "keyTopics": ["topic1", "topic2", "topic3"]
  }
}

Return only the JSON object, no additional text.`;

            const response = await axios.post(`${this.openaiBaseURL}/chat/completions`, {
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

    async enhanceSlideWithAI(slideTitle, slideContent, enhancementType = 'content') {
        try {
            console.log(`Enhancing slide: "${slideTitle}" with type: ${enhancementType}`);
            
            const prompts = {
                content: `Enhance the content of this presentation slide to make it more engaging and informative:

Title: "${slideTitle}"
Current Content: "${slideContent}"

Please improve the content by:
- Making it more engaging and compelling
- Adding relevant statistics or data points
- Improving clarity and structure
- Making it more audience-focused
- Adding actionable insights

Return the enhanced content in a clear, professional format.`,
                
                visual: `Create visual suggestions for this presentation slide:

Title: "${slideTitle}"
Content: "${slideContent}"

Please suggest:
- Specific image types that would enhance the slide
- Chart or graph suggestions
- Color scheme recommendations
- Layout improvements
- Visual hierarchy suggestions

Return specific, actionable visual recommendations.`,
                
                data: `Analyze and enhance the data presentation for this slide:

Title: "${slideTitle}"
Content: "${slideContent}"

Please suggest:
- Relevant statistics to include
- Data visualization options
- Key metrics to highlight
- Supporting evidence
- Research findings to reference

Return specific data and visualization suggestions.`
            };

            const prompt = prompts[enhancementType] || prompts.content;

            const response = await axios.post(`${this.openaiBaseURL}/chat/completions`, {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert presentation enhancer. Provide clear, actionable suggestions.'
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

            const enhancedContent = response.data.choices[0].message.content;
            
            return {
                success: true,
                enhancedContent: enhancedContent,
                enhancementType: enhancementType,
                metadata: {
                    slideTitle,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Slide enhancement error:', error);
            throw new Error(`Failed to enhance slide: ${error.message}`);
        }
    }

    async generateSlideVariations(slideTitle, slideContent, variationType = 'alternative') {
        try {
            console.log(`Generating ${variationType} variations for slide: "${slideTitle}"`);
            
            const prompts = {
                alternative: `Create 3 alternative versions of this presentation slide:

Title: "${slideTitle}"
Content: "${slideContent}"

Provide 3 different approaches:
1. More technical/detailed version
2. More simplified/accessible version  
3. More visual/data-driven version

For each version, provide the title and content.`,
                
                audience: `Adapt this slide for different audience types:

Title: "${slideTitle}"
Content: "${slideContent}"

Create versions for:
1. Beginner/General audience
2. Intermediate/Professional audience
3. Expert/Academic audience

Adapt the language, depth, and focus for each audience.`,
                
                format: `Reformat this slide content for different presentation styles:

Title: "${slideTitle}"
Content: "${slideContent}"

Create versions for:
1. Conference presentation style
2. Lab meeting style
3. Teaching/educational style

Adapt the tone, structure, and level of detail.`
            };

            const prompt = prompts[variationType] || prompts.alternative;

            const response = await axios.post(`${this.openaiBaseURL}/chat/completions`, {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert presentation designer. Provide clear, structured variations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 2000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });

            const variations = response.data.choices[0].message.content;
            
            return {
                success: true,
                variations: variations,
                variationType: variationType,
                metadata: {
                    slideTitle,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Slide variation generation error:', error);
            throw new Error(`Failed to generate slide variations: ${error.message}`);
        }
    }

    async analyzePresentationQuality(presentation) {
        try {
            console.log(`Analyzing presentation quality for: "${presentation.title}"`);
            
            const prompt = `Analyze this presentation for quality and provide improvement suggestions:

Title: "${presentation.title}"
Theme: "${presentation.theme}"
Number of slides: ${presentation.slides.length}

Slides:
${presentation.slides.map((slide, index) => 
    `${index + 1}. "${slide.title}" - ${slide.content.substring(0, 100)}...`
).join('\n')}

Please analyze and provide:
1. Overall structure assessment
2. Content quality evaluation
3. Visual design suggestions
4. Audience engagement recommendations
5. Specific improvement areas
6. Strengths and weaknesses

Format as JSON:
{
  "overallScore": 85,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvements": ["improvement1", "improvement2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "analysis": "Detailed analysis text"
}

Return only the JSON object.`;

            const response = await axios.post(`${this.openaiBaseURL}/chat/completions`, {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert presentation analyst. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.5,
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

            const analysis = JSON.parse(jsonMatch[0]);
            
            return {
                success: true,
                analysis: analysis,
                metadata: {
                    presentationTitle: presentation.title,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Presentation analysis error:', error);
            throw new Error(`Failed to analyze presentation: ${error.message}`);
        }
    }
}

export default EnhancedAIGenerationService;
