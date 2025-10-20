/**
 * External Database Integration Service
 * Integrations for Materials Project, Lens.org, and other scientific databases
 * Based on user suggestions for current insights and materials data
 */

import axios from 'axios';

// ==============================================
// MATERIALS PROJECT INTEGRATION
// https://next-gen.materialsproject.org/
// ==============================================

interface Material {
  materialId: string;
  formula: string;
  prettyFormula?: string;
  structure?: any;
  properties?: {
    bandGap?: number;
    density?: number;
    energyPerAtom?: number;
    formationEnergyPerAtom?: number;
    volume?: number;
  };
  symmetry?: {
    crystalSystem?: string;
    spaceGroup?: string;
  };
  stability?: number;
  isStable?: boolean;
  tasks?: string[];
  warnings?: string[];
}

interface MaterialsSearchParams {
  formula?: string;
  elements?: string[];
  nelements?: number;
  bandGapMin?: number;
  bandGapMax?: number;
  isStable?: boolean;
  limit?: number;
}

export class MaterialsProjectService {
  private baseUrl = 'https://api.materialsproject.org';
  private apiKey: string;

  constructor(apiKey?: string) {
    // API key should be stored in environment variables
    this.apiKey = apiKey || process.env.MATERIALS_PROJECT_API_KEY || '';
  }

  /**
   * Search for materials by formula
   */
  async searchByFormula(formula: string): Promise<Material[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/materials/`, {
        headers: {
          'X-API-KEY': this.apiKey
        },
        params: {
          formula: formula,
          _limit: 100
        },
        timeout: 15000
      });

      return this.parseMaterialsResponse(response.data);
    } catch (error: any) {
      console.error('Materials Project API error:', error.message);
      if (error.response?.status === 401) {
        console.error('Materials Project API key is invalid or missing');
      }
      return [];
    }
  }

  /**
   * Search materials by elements
   */
  async searchByElements(elements: string[], isStable: boolean = true): Promise<Material[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/materials/`, {
        headers: {
          'X-API-KEY': this.apiKey
        },
        params: {
          elements: elements.join(','),
          is_stable: isStable,
          _limit: 100
        },
        timeout: 15000
      });

      return this.parseMaterialsResponse(response.data);
    } catch (error: any) {
      console.error('Materials Project search error:', error.message);
      return [];
    }
  }

  /**
   * Get material by Materials Project ID
   */
  async getMaterialById(materialId: string): Promise<Material | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/materials/${materialId}`, {
        headers: {
          'X-API-KEY': this.apiKey
        },
        timeout: 10000
      });

      const materials = this.parseMaterialsResponse(response.data);
      return materials[0] || null;
    } catch (error: any) {
      console.error('Materials Project get material error:', error.message);
      return null;
    }
  }

  /**
   * Search materials with band gap constraints (for semiconductor research)
   */
  async searchByBandGap(minGap: number, maxGap: number): Promise<Material[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/materials/`, {
        headers: {
          'X-API-KEY': this.apiKey
        },
        params: {
          band_gap_min: minGap,
          band_gap_max: maxGap,
          _limit: 100
        },
        timeout: 15000
      });

      return this.parseMaterialsResponse(response.data);
    } catch (error: any) {
      console.error('Materials Project band gap search error:', error.message);
      return [];
    }
  }

  /**
   * Get similar materials based on structure
   */
  async getSimilarMaterials(materialId: string): Promise<Material[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/materials/${materialId}/similar`, {
        headers: {
          'X-API-KEY': this.apiKey
        },
        timeout: 10000
      });

      return this.parseMaterialsResponse(response.data);
    } catch (error: any) {
      console.error('Materials Project similar materials error:', error.message);
      return [];
    }
  }

  private parseMaterialsResponse(data: any): Material[] {
    if (!data || !data.data) return [];

    return data.data.map((item: any) => ({
      materialId: item.material_id,
      formula: item.formula_pretty || item.formula,
      prettyFormula: item.formula_pretty,
      structure: item.structure,
      properties: {
        bandGap: item.band_gap,
        density: item.density,
        energyPerAtom: item.energy_per_atom,
        formationEnergyPerAtom: item.formation_energy_per_atom,
        volume: item.volume
      },
      symmetry: {
        crystalSystem: item.crystal_system,
        spaceGroup: item.space_group
      },
      stability: item.e_above_hull,
      isStable: item.is_stable,
      tasks: item.task_ids,
      warnings: item.warnings
    }));
  }
}

// ==============================================
// LENS.ORG INTEGRATION
// https://www.lens.org/ - For current insights, patents, and scholarship
// ==============================================

interface LensScholarlyWork {
  lensId: string;
  title: string;
  authors: any[];
  abstract?: string;
  year?: number;
  sourceTitle?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmid?: string;
  citationCount?: number;
  references?: string[];
  keywords?: string[];
  fieldsOfStudy?: string[];
}

interface LensPatent {
  lensId: string;
  title: string;
  abstract?: string;
  inventors: any[];
  applicants: any[];
  publicationDate?: string;
  filingDate?: string;
  patentNumber?: string;
  jurisdictions?: string[];
  classifications?: string[];
  citationCount?: number;
  claims?: string[];
}

export class LensService {
  private baseUrl = 'https://api.lens.org';
  private apiToken: string;

  constructor(apiToken?: string) {
    // API token should be stored in environment variables
    this.apiToken = apiToken || process.env.LENS_API_TOKEN || '';
  }

  /**
   * Search scholarly works (papers, articles)
   */
  async searchScholarship(query: string, limit: number = 20): Promise<LensScholarlyWork[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/scholarly/search`,
        {
          query: {
            bool: {
              must: [
                {
                  query_string: {
                    query: query
                  }
                }
              ]
            }
          },
          size: limit,
          sort: [
            {
              year_published: {
                order: 'desc'
              }
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      return this.parseScholarlyResponse(response.data);
    } catch (error: any) {
      console.error('Lens.org scholarship search error:', error.message);
      if (error.response?.status === 401) {
        console.error('Lens.org API token is invalid or missing');
      }
      return [];
    }
  }

  /**
   * Search patents
   */
  async searchPatents(query: string, limit: number = 20): Promise<LensPatent[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/patent/search`,
        {
          query: {
            bool: {
              must: [
                {
                  query_string: {
                    query: query
                  }
                }
              ]
            }
          },
          size: limit,
          sort: [
            {
              date_published: {
                order: 'desc'
              }
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      return this.parsePatentResponse(response.data);
    } catch (error: any) {
      console.error('Lens.org patent search error:', error.message);
      return [];
    }
  }

  /**
   * Track citations for a specific DOI
   */
  async trackCitations(doi: string): Promise<{ citationCount: number; citingWorks: LensScholarlyWork[] }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/scholarly/search`,
        {
          query: {
            bool: {
              must: [
                {
                  match: {
                    'references.doi': doi
                  }
                }
              ]
            }
          },
          size: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      const citingWorks = this.parseScholarlyResponse(response.data);
      
      return {
        citationCount: response.data.total || 0,
        citingWorks: citingWorks
      };
    } catch (error: any) {
      console.error('Lens.org citation tracking error:', error.message);
      return { citationCount: 0, citingWorks: [] };
    }
  }

  /**
   * Identify research trends in a domain
   */
  async identifyTrends(domain: string, years: number = 5): Promise<any> {
    try {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years;

      const response = await axios.post(
        `${this.baseUrl}/scholarly/search`,
        {
          query: {
            bool: {
              must: [
                {
                  query_string: {
                    query: domain
                  }
                },
                {
                  range: {
                    year_published: {
                      gte: startYear,
                      lte: currentYear
                    }
                  }
                }
              ]
            }
          },
          size: 1000,
          aggregations: {
            publications_by_year: {
              date_histogram: {
                field: 'year_published',
                interval: 'year'
              }
            },
            top_authors: {
              terms: {
                field: 'authors.display_name',
                size: 10
              }
            },
            top_institutions: {
              terms: {
                field: 'authors.affiliations.name',
                size: 10
              }
            },
            top_fields: {
              terms: {
                field: 'field_of_study',
                size: 20
              }
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000
        }
      );

      return {
        totalPublications: response.data.total || 0,
        yearlyTrend: response.data.aggregations?.publications_by_year?.buckets || [],
        topAuthors: response.data.aggregations?.top_authors?.buckets || [],
        topInstitutions: response.data.aggregations?.top_institutions?.buckets || [],
        emergingFields: response.data.aggregations?.top_fields?.buckets || []
      };
    } catch (error: any) {
      console.error('Lens.org trends analysis error:', error.message);
      return null;
    }
  }

  /**
   * Get scholarly work by Lens ID
   */
  async getScholarlyWorkById(lensId: string): Promise<LensScholarlyWork | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/scholarly/search`,
        {
          query: {
            bool: {
              must: [
                {
                  match: {
                    lens_id: lensId
                  }
                }
              ]
            }
          },
          size: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const works = this.parseScholarlyResponse(response.data);
      return works[0] || null;
    } catch (error: any) {
      console.error('Lens.org get work error:', error.message);
      return null;
    }
  }

  private parseScholarlyResponse(data: any): LensScholarlyWork[] {
    if (!data || !data.data) return [];

    return data.data.map((item: any) => ({
      lensId: item.lens_id,
      title: item.title,
      authors: item.authors || [],
      abstract: item.abstract,
      year: item.year_published,
      sourceTitle: item.source?.title,
      volume: item.volume,
      issue: item.issue,
      pages: item.start_page && item.end_page ? `${item.start_page}-${item.end_page}` : undefined,
      doi: item.external_ids?.doi,
      pmid: item.external_ids?.pmid,
      citationCount: item.scholarly_citations_count,
      references: item.references?.map((ref: any) => ref.lens_id),
      keywords: item.keywords,
      fieldsOfStudy: item.fields_of_study
    }));
  }

  private parsePatentResponse(data: any): LensPatent[] {
    if (!data || !data.data) return [];

    return data.data.map((item: any) => ({
      lensId: item.lens_id,
      title: item.title,
      abstract: item.abstract,
      inventors: item.inventors || [],
      applicants: item.applicants || [],
      publicationDate: item.date_published,
      filingDate: item.filing_date,
      patentNumber: item.publication_number,
      jurisdictions: item.jurisdictions || [],
      classifications: item.classifications || [],
      citationCount: item.cited_by_patent_count,
      claims: item.claims
    }));
  }
}

// ==============================================
// UNIFIED SCIENTIFIC DATABASE SERVICE
// ==============================================

export class ScientificDatabaseService {
  private materialsProject: MaterialsProjectService;
  private lens: LensService;

  constructor() {
    this.materialsProject = new MaterialsProjectService();
    this.lens = new LensService();
  }

  /**
   * Comprehensive search across all databases
   */
  async searchAll(query: string): Promise<{
    materials: Material[];
    papers: LensScholarlyWork[];
    patents: LensPatent[];
  }> {
    const [materials, papers, patents] = await Promise.allSettled([
      this.materialsProject.searchByFormula(query),
      this.lens.searchScholarship(query, 20),
      this.lens.searchPatents(query, 10)
    ]);

    return {
      materials: materials.status === 'fulfilled' ? materials.value : [],
      papers: papers.status === 'fulfilled' ? papers.value : [],
      patents: patents.status === 'fulfilled' ? patents.value : []
    };
  }

  /**
   * Get research insights for a specific domain
   */
  async getResearchInsights(domain: string): Promise<any> {
    try {
      const trends = await this.lens.identifyTrends(domain, 5);
      const recentPapers = await this.lens.searchScholarship(domain, 10);

      return {
        trends,
        recentPapers,
        summary: this.generateInsightsSummary(trends, recentPapers)
      };
    } catch (error) {
      console.error('Error getting research insights:', error);
      return null;
    }
  }

  /**
   * Materials discovery workflow
   */
  async discoverMaterials(requirements: {
    elements?: string[];
    bandGapRange?: [number, number];
    properties?: string[];
  }): Promise<Material[]> {
    let materials: Material[] = [];

    if (requirements.bandGapRange) {
      materials = await this.materialsProject.searchByBandGap(
        requirements.bandGapRange[0],
        requirements.bandGapRange[1]
      );
    } else if (requirements.elements) {
      materials = await this.materialsProject.searchByElements(requirements.elements);
    }

    return materials;
  }

  private generateInsightsSummary(trends: any, recentPapers: LensScholarlyWork[]): string {
    if (!trends) return 'No insights available';

    const summary = `
Research Insights Summary:
- Total publications (last 5 years): ${trends.totalPublications}
- Recent publications: ${recentPapers.length}
- Leading researchers: ${trends.topAuthors?.slice(0, 5).map((a: any) => a.key).join(', ')}
- Key institutions: ${trends.topInstitutions?.slice(0, 3).map((i: any) => i.key).join(', ')}
- Emerging fields: ${trends.emergingFields?.slice(0, 5).map((f: any) => f.key).join(', ')}
    `.trim();

    return summary;
  }
}

// Export singleton instance
export const scientificDatabaseService = new ScientificDatabaseService();

