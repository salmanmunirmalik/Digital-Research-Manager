/**
 * Reference Management Agent
 * Task 68: Find, format, and insert citations
 * 
 * Manages references and citations for research papers:
 * - Finds relevant papers based on content
 * - Formats citations according to style guides
 * - Inserts citations in appropriate locations
 * - Manages reference lists
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';
import { AIProviderFactory } from '../AIProviderFactory.js';
import pool from "../../../database/config.js";

export interface ReferenceManagementInput {
  content?: string; // Paper content or section to add citations to
  topics?: string[]; // Topics to find references for
  existingReferences?: Array<{
    id: string;
    title?: string;
    authors?: string[];
    year?: number;
    journal?: string;
    doi?: string;
    url?: string;
  }>;
  citationStyle?: 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'Nature' | 'Science' | 'Vancouver';
  action?: 'find' | 'format' | 'insert' | 'all'; // What action to perform
  context?: {
    paperTitle?: string;
    researchField?: string;
    keywords?: string[];
  };
  maxReferences?: number; // Maximum number of references to find
}

export interface ReferenceManagementResult {
  success: boolean;
  references: Array<{
    id: string;
    title: string;
    authors: string[];
    year: number;
    journal?: string;
    doi?: string;
    url?: string;
    abstract?: string;
    relevanceScore?: number;
    citations: {
      inText: string; // In-text citation format
      full: string; // Full reference format
      bibliography: string; // Bibliography entry
    };
    inTextLocations?: Array<{
      section: string;
      context: string;
      suggestedPlacement: string;
    }>;
  }>;
  formattedContent?: string; // Content with citations inserted
  bibliography?: string; // Formatted bibliography
  metadata: {
    totalReferences: number;
    citationStyle: string;
    coverage: {
      sectionsWithCitations: number;
      totalSections: number;
    };
  };
}

export class ReferenceManagementAgent extends BaseAgent implements Agent {
  readonly agentType = 'reference_management';
  readonly agentName = 'Reference Management Agent';
  readonly description = 'Finds, formats, and manages references and citations for research papers';
  
  getRequiredContext(): string[] {
    return ['papers', 'notebooks'];
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    
    // Need at least content, topics, or existing references
    if (!input.content && !input.topics && (!input.existingReferences || input.existingReferences.length === 0)) {
      return false;
    }
    
    return true;
  }
  
  async execute(
    input: ReferenceManagementInput,
    context: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      // Validate input
      if (!this.validateInput(input)) {
        return {
          success: false,
          error: 'Invalid input: content, topics, or existing references required',
          content: null
        };
      }
      
      // Get API assignment for paper finding or content writing
      const userId = context.additionalData?.userId || '';
      const apiAssignment = await getApiForTask(userId, 'paper_finding') || 
                           await getApiForTask(userId, 'content_writing');
      
      if (!apiAssignment) {
        return {
          success: false,
          error: 'No API configured for reference management. Please add an API key in Settings.',
          content: null
        };
      }
      
      const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
      const citationStyle = input.citationStyle || 'APA';
      const action = input.action || 'all';
      
      let references: ReferenceManagementResult['references'] = [];
      
      // Find references if needed
      if (action === 'find' || action === 'all') {
        const foundReferences = await this.findReferences(
          input,
          context,
          aiProvider,
          apiAssignment
        );
        references = [...references, ...foundReferences];
      }
      
      // Add existing references
      if (input.existingReferences && input.existingReferences.length > 0) {
        const formattedExisting = await this.formatReferences(
          input.existingReferences,
          citationStyle,
          aiProvider,
          apiAssignment
        );
        references = [...references, ...formattedExisting];
      }
      
      // Remove duplicates
      references = this.removeDuplicateReferences(references);
      
      // Limit to max references
      if (input.maxReferences && references.length > input.maxReferences) {
        references = references
          .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
          .slice(0, input.maxReferences);
      }
      
      // Format citations
      references = await this.formatAllCitations(references, citationStyle, aiProvider, apiAssignment);
      
      // Insert citations into content if provided
      let formattedContent: string | undefined;
      let bibliography: string | undefined;
      
      if (input.content && (action === 'insert' || action === 'all')) {
        const insertionResult = await this.insertCitations(
          input.content,
          references,
          citationStyle,
          aiProvider,
          apiAssignment
        );
        formattedContent = insertionResult.content;
        
        // Generate bibliography
        bibliography = this.generateBibliography(references, citationStyle);
      } else {
        bibliography = this.generateBibliography(references, citationStyle);
      }
      
      // Calculate coverage
      const sections = input.content ? this.extractSections(input.content) : [];
      const sectionsWithCitations = formattedContent 
        ? this.countSectionsWithCitations(formattedContent, sections)
        : 0;
      
      const result: ReferenceManagementResult = {
        success: true,
        references,
        formattedContent,
        bibliography,
        metadata: {
          totalReferences: references.length,
          citationStyle,
          coverage: {
            sectionsWithCitations,
            totalSections: sections.length
          }
        }
      };
      
      return {
        success: true,
        content: result,
        metadata: {
          agentType: this.agentType,
          tokensUsed: 0, // TODO: Track tokens
          duration: 0 // TODO: Track duration
        }
      };
    } catch (error: any) {
      console.error('Error in ReferenceManagementAgent:', error);
      return {
        success: false,
        error: error.message || 'Failed to manage references',
        content: null
      };
    }
  }
  
  /**
   * Find relevant references based on topics or content
   */
  private async findReferences(
    input: ReferenceManagementInput,
    context: AgentContext,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<ReferenceManagementResult['references']> {
    try {
      // First, try to get references from user's paper library
      const userId = context.additionalData?.userId || '';
      let userPapers: any[] = [];
      
      if (userId) {
        const paperResult = await pool.query(
          `SELECT id, title, authors, year, journal, doi, url, abstract
           FROM papers
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 20`,
          [userId]
        );
        userPapers = paperResult.rows;
      }
      
      // Build search query
      const searchTerms = input.topics?.join(', ') || 
                         input.context?.keywords?.join(', ') ||
                         input.content?.substring(0, 200) ||
                         'research';
      
      // Use AI to find and rank relevant papers
      const prompt = `You are a research librarian. Based on the following search terms, suggest relevant academic papers.

Search Terms: ${searchTerms}
${input.context?.researchField ? `Research Field: ${input.context.researchField}` : ''}
${input.context?.paperTitle ? `Paper Title: ${input.context.paperTitle}` : ''}

${userPapers.length > 0 ? `User's Existing Papers:\n${userPapers.map((p, i) => 
  `${i + 1}. ${p.title} (${p.authors || 'Unknown authors'}, ${p.year || 'Unknown year'})`
).join('\n')}` : ''}

Suggest ${input.maxReferences || 10} highly relevant papers that should be cited. For each paper, provide:
- Title
- Authors (as array)
- Year
- Journal/Conference
- DOI (if available)
- Brief relevance explanation

Format as JSON array:
[
  {
    "title": "Paper Title",
    "authors": ["Author1", "Author2"],
    "year": 2024,
    "journal": "Journal Name",
    "doi": "10.xxxx/xxxxx",
    "relevance": "Why this paper is relevant"
  }
]`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert research librarian. Suggest highly relevant academic papers in JSON format.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.3,
        maxTokens: 2000
      });
      
      try {
        const suggestedPapers = JSON.parse(response.content);
        return suggestedPapers.map((paper: any, index: number) => ({
          id: `ref_${Date.now()}_${index}`,
          title: paper.title,
          authors: paper.authors || [],
          year: paper.year || new Date().getFullYear(),
          journal: paper.journal,
          doi: paper.doi,
          url: paper.url,
          abstract: paper.abstract,
          relevanceScore: 0.8 - (index * 0.05), // Decreasing relevance
          citations: {
            inText: '',
            full: '',
            bibliography: ''
          }
        }));
      } catch {
        // If JSON parsing fails, return empty array
        return [];
      }
    } catch (error) {
      console.error('Error finding references:', error);
      return [];
    }
  }
  
  /**
   * Format existing references
   */
  private async formatReferences(
    existingReferences: ReferenceManagementInput['existingReferences'],
    citationStyle: string,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<ReferenceManagementResult['references']> {
    return existingReferences!.map((ref, index) => ({
      id: ref.id || `ref_${Date.now()}_${index}`,
      title: ref.title || 'Untitled',
      authors: ref.authors || [],
      year: ref.year || new Date().getFullYear(),
      journal: ref.journal,
      doi: ref.doi,
      url: ref.url,
      relevanceScore: 0.5,
      citations: {
        inText: '',
        full: '',
        bibliography: ''
      }
    }));
  }
  
  /**
   * Format all citations according to style guide
   */
  private async formatAllCitations(
    references: ReferenceManagementResult['references'],
    citationStyle: string,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<ReferenceManagementResult['references']> {
    try {
      const prompt = `Format the following references according to ${citationStyle} citation style.

References:
${references.map((ref, i) => 
  `${i + 1}. Title: ${ref.title}\n   Authors: ${ref.authors.join(', ')}\n   Year: ${ref.year}\n   Journal: ${ref.journal || 'N/A'}\n   DOI: ${ref.doi || 'N/A'}`
).join('\n\n')}

For each reference, provide:
1. In-text citation (e.g., "Author et al., 2024" or "(Author et al., 2024)")
2. Full citation for reference list
3. Bibliography entry

Format as JSON array matching the input order:
[
  {
    "inText": "In-text citation",
    "full": "Full citation",
    "bibliography": "Bibliography entry"
  }
]`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: `You are an expert in ${citationStyle} citation formatting. Provide accurate, properly formatted citations.` },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.1,
        maxTokens: 2000
      });
      
      try {
        const formatted = JSON.parse(response.content);
        return references.map((ref, index) => ({
          ...ref,
          citations: {
            inText: formatted[index]?.inText || this.generateInTextCitation(ref, citationStyle),
            full: formatted[index]?.full || this.generateFullCitation(ref, citationStyle),
            bibliography: formatted[index]?.bibliography || this.generateBibliographyEntry(ref, citationStyle)
          }
        }));
      } catch {
        // Fallback to manual formatting
        return references.map(ref => ({
          ...ref,
          citations: {
            inText: this.generateInTextCitation(ref, citationStyle),
            full: this.generateFullCitation(ref, citationStyle),
            bibliography: this.generateBibliographyEntry(ref, citationStyle)
          }
        }));
      }
    } catch (error) {
      console.error('Error formatting citations:', error);
      // Fallback to manual formatting
      return references.map(ref => ({
        ...ref,
        citations: {
          inText: this.generateInTextCitation(ref, citationStyle),
          full: this.generateFullCitation(ref, citationStyle),
          bibliography: this.generateBibliographyEntry(ref, citationStyle)
        }
      }));
    }
  }
  
  /**
   * Generate in-text citation
   */
  private generateInTextCitation(ref: ReferenceManagementResult['references'][0], style: string): string {
    const authors = ref.authors;
    if (!authors || authors.length === 0) return `(Unknown, ${ref.year})`;
    
    const firstAuthor = authors[0].split(' ').pop() || authors[0];
    
    switch (style) {
      case 'APA':
        if (authors.length === 1) {
          return `(${firstAuthor}, ${ref.year})`;
        } else if (authors.length === 2) {
          const secondAuthor = authors[1].split(' ').pop() || authors[1];
          return `(${firstAuthor} & ${secondAuthor}, ${ref.year})`;
        } else {
          return `(${firstAuthor} et al., ${ref.year})`;
        }
      
      case 'MLA':
        return `(${firstAuthor} ${ref.year})`;
      
      case 'Chicago':
        return `(${firstAuthor} ${ref.year})`;
      
      case 'IEEE':
        return `[${ref.id}]`;
      
      default:
        return `(${firstAuthor} et al., ${ref.year})`;
    }
  }
  
  /**
   * Generate full citation
   */
  private generateFullCitation(ref: ReferenceManagementResult['references'][0], style: string): string {
    const authors = ref.authors.join(', ');
    const journal = ref.journal ? ` ${ref.journal}` : '';
    const doi = ref.doi ? ` https://doi.org/${ref.doi}` : '';
    
    switch (style) {
      case 'APA':
        return `${authors} (${ref.year}). ${ref.title}.${journal}.${doi}`;
      
      case 'MLA':
        return `${authors}. "${ref.title}."${journal} (${ref.year}).${doi}`;
      
      case 'Chicago':
        return `${authors}. "${ref.title}."${journal} (${ref.year}).${doi}`;
      
      case 'IEEE':
        return `${authors}, "${ref.title},"${journal}, ${ref.year}.${doi}`;
      
      default:
        return `${authors} (${ref.year}). ${ref.title}.${journal}.${doi}`;
    }
  }
  
  /**
   * Generate bibliography entry
   */
  private generateBibliographyEntry(ref: ReferenceManagementResult['references'][0], style: string): string {
    return this.generateFullCitation(ref, style);
  }
  
  /**
   * Insert citations into content
   */
  private async insertCitations(
    content: string,
    references: ReferenceManagementResult['references'],
    citationStyle: string,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<{ content: string; locations: any[] }> {
    try {
      const prompt = `Insert appropriate citations into the following research paper content.

Content:
${content.substring(0, 3000)}

Available References:
${references.map((ref, i) => 
  `${i + 1}. ${ref.title} (${ref.authors.join(', ')}, ${ref.year}) - ${ref.citations.inText}`
).join('\n')}

Citation Style: ${citationStyle}

Insert citations where they are most relevant and appropriate. Use the in-text citation format for each reference.
Return the content with citations inserted in the appropriate locations.

Format: Return the full content with citations inserted, using the in-text citation format.`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: `You are an expert in academic writing. Insert citations naturally and appropriately according to ${citationStyle} style.` },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.3,
        maxTokens: 4000
      });
      
      return {
        content: response.content.trim(),
        locations: []
      };
    } catch (error) {
      console.error('Error inserting citations:', error);
      return { content, locations: [] };
    }
  }
  
  /**
   * Generate bibliography
   */
  private generateBibliography(
    references: ReferenceManagementResult['references'],
    citationStyle: string
  ): string {
    return references
      .map((ref, index) => `${index + 1}. ${ref.citations.bibliography}`)
      .join('\n\n');
  }
  
  /**
   * Remove duplicate references
   */
  private removeDuplicateReferences(
    references: ReferenceManagementResult['references']
  ): ReferenceManagementResult['references'] {
    const seen = new Set<string>();
    return references.filter(ref => {
      const key = `${ref.title}_${ref.authors.join('_')}_${ref.year}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Extract sections from content
   */
  private extractSections(content: string): string[] {
    const sectionPattern = /^(?:#+\s+|##+\s+)?([A-Z][^\n]+)/gm;
    const matches = content.match(sectionPattern);
    return matches || [];
  }
  
  /**
   * Count sections with citations
   */
  private countSectionsWithCitations(content: string, sections: string[]): number {
    // Simple check: count sections that contain citation patterns
    const citationPattern = /\([A-Z][a-z]+(?:\s+et\s+al\.)?,\s+\d{4}\)|\[[\d,]+\]/g;
    let count = 0;
    
    for (const section of sections) {
      const sectionIndex = content.indexOf(section);
      if (sectionIndex !== -1) {
        const sectionEnd = content.indexOf('\n\n', sectionIndex);
        const sectionContent = content.substring(sectionIndex, sectionEnd !== -1 ? sectionEnd : content.length);
        if (citationPattern.test(sectionContent)) {
          count++;
        }
      }
    }
    
    return count;
  }
}

