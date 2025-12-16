

import { GoogleGenAI, Type } from "@google/genai";
import { ResultEntry, PrimerPair, RestrictionResult } from '../types';

// Ensure the API key is available as an environment variable.
// In a real Vite/Create React App setup, this would be `import.meta.env.VITE_API_KEY` or `process.env.REACT_APP_API_KEY`
// For this environment, we assume `process.env.API_KEY` is directly available.
const apiKey = process.env.API_KEY;

if (!apiKey) {
    console.error("API key is missing. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

/**
 * Gets troubleshooting advice from the Gemini model for a specific protocol step.
 * @param protocolName The name of the protocol.
 * @param stepDescription The description of the step where the issue occurred.
 * @param userQuery The user's specific problem.
 * @returns A string containing troubleshooting advice.
 */
export const getTroubleshootingAdvice = async (
    protocolName: string,
    stepDescription: string,
    userQuery: string
): Promise<string> => {
    if (!apiKey) {
        throw new Error("API key is not configured.");
    }
    
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are an expert lab research assistant. Your goal is to help scientists troubleshoot experimental problems. 
    Provide concise, practical, and step-by-step advice. Start with the most likely cause first.
    Format your response clearly using bullet points or numbered lists. Do not use markdown formatting like \`\`\`.`;

    const prompt = `
        I am performing a lab experiment and need help.

        Protocol: "${protocolName}"
        Problematic Step: "${stepDescription}"
        
        My issue is: "${userQuery}"

        Please provide potential causes and solutions.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
                topK: 32,
                topP: 1,
            },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
};

/**
 * Gets community-style troubleshooting advice from the Gemini model for the help forum.
 * @param title The title of the help request.
 * @param description The user's detailed problem.
 * @param protocolName The name of the protocol, if relevant.
 * @returns A string containing friendly, initial advice.
 */
export const getCommunityHelpAdvice = async (
    title: string,
    description: string,
    protocolName?: string
): Promise<string> => {
    if (!apiKey) {
        throw new Error("API key is not configured.");
    }
    
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are a helpful and experienced senior researcher in a collaborative, global research community forum. A user has posted a help request.
    Your goal is to provide a friendly, encouraging, and helpful initial response with potential solutions they can try while waiting for more community feedback.
    Start by acknowledging their problem. Then, offer clear, actionable suggestions. Format your response clearly. Do not use markdown.`;

    const prompt = `
        A user posted a new help request in the forum.

        Title: "${title}"
        ${protocolName ? `Relevant Protocol: "${protocolName}"` : ''}
        
        Problem Description: "${description}"

        Please provide a helpful initial response for them.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.6,
                topK: 40,
                topP: 1,
            },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
};

/**
 * Generates an end-of-day summary for a Personal NoteBook entry.
 * @param entryContent A string containing the collated text from the notebook entry.
 * @returns A structured summary string.
 */
export const generateNotebookSummary = async (entryContent: string): Promise<string> => {
    if (!apiKey) {
        throw new Error("API key is not configured.");
    }

    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are a scientific research assistant. Your task is to summarize a day's Personal NoteBook entry.
    Your tone must be professional and concise.
    Structure the output into three sections with these exact titles:
    1. Objective
    2. Key Steps & Observations
    3. Outcome
    Use bullet points within the sections where appropriate for clarity. Do not use markdown formatting like \`\`\` or **.`;

    const prompt = `
        Please summarize the following Personal NoteBook entry:
        ---
        ${entryContent}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.3,
                topK: 32,
                topP: 1,
            },
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
};

/**
 * Compiles multiple summaries into a single report or paper section.
 * @param summaries An array of summary strings to compile.
 * @param format The target output format.
 * @returns A single compiled string.
 */
export const compileSummaries = async (
    summaries: string[],
    format: 'Weekly Report' | 'Paper Section'
): Promise<string> => {
    if (!apiKey) {
        throw new Error("API key is not configured.");
    }
    const model = 'gemini-2.5-flash';

    const systemInstructions = {
        'Weekly Report': `You are a meticulous research assistant compiling a progress report.
        Organize the following daily summaries chronologically into a single, cohesive weekly report.
        Use clear headings for each entry (e.g., "Date: YYYY-MM-DD - Title").
        Summarize the key findings at the end under a "Weekly Conclusion" section.
        Maintain a professional and factual tone. Do not use markdown formatting.`,
        'Paper Section': `You are an expert scientific writer drafting a manuscript.
        Synthesize the following experimental summaries into a coherent narrative for a "Results" section.
        Do not just list the summaries. Weave them together, drawing connections between findings and building a logical story that flows from one experiment to the next.
        Start with initial findings and build towards the main conclusions.
        Focus on the scientific outcomes and their implications.
        The tone should be formal, academic, and suitable for publication. Do not use markdown formatting.`
    };

    const prompt = `
        Please compile the following summaries into a "${format}".

        Summaries to compile:
        ---
        ${summaries.join('\n')}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstructions[format],
                temperature: 0.5,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
};

/**
 * Analyzes a result entry and provides insights, next steps, and potential pitfalls.
 * @param result The ResultEntry object to analyze.
 * @returns An analysis object.
 */
export const analyzeResultData = async (
    result: ResultEntry
): Promise<{ insights: string; nextSteps: string; pitfalls: string; }> => {
    if (!apiKey) {
        throw new Error("API key is not configured.");
    }

    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are a highly experienced Principal Investigator (PI) reviewing a result from a member of your lab.
    Your goal is to provide constructive, insightful, and forward-looking feedback.
    Analyze the provided result and generate a JSON object with three specific keys:
    1.  "insights": What are the one or two most critical conclusions from this data? What is the "so what"? Be direct and concise.
    2.  "nextSteps": Based on these insights, what are the 2-3 most logical and impactful follow-up experiments? Suggest concrete actions.
    3.  "pitfalls": What are potential alternative interpretations, limitations of the current data, or things to be cautious about? Encourage robust science.
    Keep your language professional and encouraging.`;

    const dataPreviewString = JSON.stringify(result.dataPreview, null, 2);

    const prompt = `
        Please analyze the following experimental result:

        Title: "${result.title}"
        Author: "${result.author}"
        Date: "${result.date}"
        Tags: ${result.tags.join(', ')}

        Summary provided by author:
        "${result.summary}"

        Raw Data Preview:
        \`\`\`json
        ${dataPreviewString}
        \`\`\`
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        insights: { type: Type.STRING, description: 'Key conclusions and the main takeaway from the result.' },
                        nextSteps: { type: Type.STRING, description: 'Specific, actionable follow-up experiments or actions.' },
                        pitfalls: { type: Type.STRING, description: 'Alternative interpretations, limitations, or potential issues to consider.' },
                    },
                    required: ["insights", "nextSteps", "pitfalls"],
                },
                temperature: 0.6,
            }
        });

        // The response text is expected to be a JSON string that matches the schema.
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;

    } catch (error) {
        console.error("Error calling Gemini API for analysis:", error);
        throw new Error("Failed to get analysis from the AI model.");
    }
};


/**
 * Designs PCR primers using the Gemini API.
 * @param sequence The DNA template sequence.
 * @param params The design parameters.
 * @returns A promise that resolves to an array of primer pairs.
 */
export const designPrimers = async (
    sequence: string,
    params: { productMin: number, productMax: number, primerMin: number, primerMax: number, tmMin: number, tmMax: number, gcMin: number, gcMax: number }
): Promise<PrimerPair[]> => {
    if (!apiKey) throw new Error("API key is not configured.");

    const model = 'gemini-2.5-flash';
    const systemInstruction = "You are a bioinformatics expert specializing in PCR primer design. Your task is to design 5 optimal PCR primer pairs based on a given DNA sequence and user-defined parameters. Adhere strictly to all parameters. Return the results in a JSON array format matching the provided schema. Do not include any primers that anneal to themselves or each other. Ensure the reverse primer is on the opposite strand.";

    const prompt = `
        DNA Template Sequence:
        \`\`\`
        ${sequence}
        \`\`\`

        Design Parameters:
        - Product size: ${params.productMin}-${params.productMax} bp
        - Primer length: ${params.primerMin}-${params.primerMax} nt
        - Primer Tm: ${params.tmMin}-${params.tmMax} °C
        - Primer GC content: ${params.gcMin}-${params.gcMax}%

        Please design 5 unique and optimal primer pairs based on these criteria.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            forward: {
                                type: Type.OBJECT,
                                properties: {
                                    sequence: { type: Type.STRING },
                                    tm: { type: Type.NUMBER },
                                    gc: { type: Type.NUMBER },
                                    start: { type: Type.INTEGER }
                                },
                                required: ["sequence", "tm", "gc", "start"]
                            },
                            reverse: {
                                type: Type.OBJECT,
                                properties: {
                                    sequence: { type: Type.STRING },
                                    tm: { type: Type.NUMBER },
                                    gc: { type: Type.NUMBER },
                                    start: { type: Type.INTEGER }
                                },
                                required: ["sequence", "tm", "gc", "start"]
                            },
                            productSize: { type: Type.INTEGER }
                        },
                        required: ["forward", "reverse", "productSize"]
                    }
                }
            }
        });
        
        const jsonResponse = JSON.parse(response.text.trim());
        return jsonResponse as PrimerPair[];

    } catch (error) {
        console.error("Error calling Gemini API for primer design:", error);
        throw new Error("Failed to design primers with the AI model.");
    }
};

/**
 * Simulates a restriction digest using the Gemini API.
 * @param sequence The DNA sequence to digest.
 * @param enzymeNames An array of restriction enzyme names.
 * @returns A promise resolving to the restriction digest result.
 */
export const simulateRestrictionDigest = async (
    sequence: string,
    enzymeNames: string[]
): Promise<RestrictionResult> => {
    if (!apiKey) throw new Error("API key is not configured.");

    const model = 'gemini-2.5-flash';
    const systemInstruction = "You are a bioinformatics tool that simulates restriction enzyme digests on DNA sequences. Your task is to identify all 1-based start positions of the recognition sequence for a given list of enzymes and calculate the sizes of the resulting DNA fragments. Assume the DNA is linear. Provide the output in a strict JSON format matching the provided schema.";

    const prompt = `
        DNA Sequence (length ${sequence.length} bp):
        \`\`\`
        ${sequence}
        \`\`\`

        Please digest this linear sequence with the following enzymes:
        ${enzymeNames.join(', ')}

        Calculate all cut site start positions and the resulting fragment sizes.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        cuts: {
                            type: Type.ARRAY,
                            description: "List of enzymes and where they cut.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    enzyme: { type: Type.STRING },
                                    cutPositions: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                                },
                                required: ["enzyme", "cutPositions"]
                            }
                        },
                        fragments: {
                            type: Type.ARRAY,
                            description: "List of resulting fragment sizes in base pairs.",
                            items: { type: Type.INTEGER }
                        }
                    },
                    required: ["cuts", "fragments"]
                }
            }
        });

        const jsonResponse = JSON.parse(response.text.trim());
        return jsonResponse as RestrictionResult;

    } catch (error) {
        console.error("Error calling Gemini API for restriction digest:", error);
        throw new Error("Failed to simulate digest with the AI model.");
    }
};
