/**
 * External Databases API Routes
 * Exposes Materials Project and Lens.org integration
 * Based on user suggestions for materials data and current research insights
 */

import { Router } from 'express';
import { scientificDatabaseService } from '../services/externalDatabases.js';

const router = Router();

// ==============================================
// MATERIALS PROJECT INTEGRATION
// ==============================================

// Search materials by formula
router.post('/materials/search-formula', async (req, res) => {
  try {
    const { formula } = req.body;
    
    if (!formula) {
      return res.status(400).json({ error: 'Formula is required' });
    }

    console.log(`🔬 Searching materials by formula: ${formula}`);
    const materials = await scientificDatabaseService.getMaterialsProject().searchByFormula(formula);
    
    res.json({ count: materials.length, materials });
  } catch (error: any) {
    console.error('Error searching materials:', error);
    res.status(500).json({ error: 'Failed to search materials', details: error.message });
  }
});

// Search materials by elements
router.post('/materials/search-elements', async (req, res) => {
  try {
    const { elements, isStable = true } = req.body;
    
    if (!elements || !Array.isArray(elements)) {
      return res.status(400).json({ error: 'Elements array is required' });
    }

    console.log(`🔬 Searching materials by elements: ${elements.join(', ')}`);
    const materials = await scientificDatabaseService.getMaterialsProject().searchByElements(elements, isStable);
    
    res.json({ count: materials.length, materials });
  } catch (error: any) {
    console.error('Error searching materials by elements:', error);
    res.status(500).json({ error: 'Failed to search materials', details: error.message });
  }
});

// Search materials by band gap
router.post('/materials/search-bandgap', async (req, res) => {
  try {
    const { minGap, maxGap } = req.body;
    
    if (minGap === undefined || maxGap === undefined) {
      return res.status(400).json({ error: 'minGap and maxGap are required' });
    }

    console.log(`🔬 Searching materials with band gap: ${minGap}-${maxGap} eV`);
    const materials = await scientificDatabaseService.getMaterialsProject().searchByBandGap(minGap, maxGap);
    
    res.json({ count: materials.length, materials });
  } catch (error: any) {
    console.error('Error searching materials by band gap:', error);
    res.status(500).json({ error: 'Failed to search materials', details: error.message });
  }
});

// Get material by ID
router.get('/materials/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params;
    
    console.log(`🔬 Fetching material: ${materialId}`);
    const material = await scientificDatabaseService.getMaterialsProject().getMaterialById(materialId);
    
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json(material);
  } catch (error: any) {
    console.error('Error fetching material:', error);
    res.status(500).json({ error: 'Failed to fetch material', details: error.message });
  }
});

// ==============================================
// LENS.ORG INTEGRATION
// ==============================================

// Search scholarly works
router.post('/lens/search-papers', async (req, res) => {
  try {
    const { query, limit = 20 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`📖 Searching Lens.org scholarly works: ${query}`);
    const papers = await scientificDatabaseService.getLens().searchScholarship(query, limit);
    
    res.json({ count: papers.length, papers });
  } catch (error: any) {
    console.error('Error searching Lens scholarly works:', error);
    res.status(500).json({ error: 'Failed to search papers', details: error.message });
  }
});

// Search patents
router.post('/lens/search-patents', async (req, res) => {
  try {
    const { query, limit = 20 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`📜 Searching Lens.org patents: ${query}`);
    const patents = await scientificDatabaseService.getLens().searchPatents(query, limit);
    
    res.json({ count: patents.length, patents });
  } catch (error: any) {
    console.error('Error searching patents:', error);
    res.status(500).json({ error: 'Failed to search patents', details: error.message });
  }
});

// Track citations for a DOI
router.post('/lens/track-citations', async (req, res) => {
  try {
    const { doi } = req.body;
    
    if (!doi) {
      return res.status(400).json({ error: 'DOI is required' });
    }

    console.log(`📊 Tracking citations for DOI: ${doi}`);
    const citations = await scientificDatabaseService.getLens().trackCitations(doi);
    
    res.json(citations);
  } catch (error: any) {
    console.error('Error tracking citations:', error);
    res.status(500).json({ error: 'Failed to track citations', details: error.message });
  }
});

// Identify research trends
router.post('/lens/identify-trends', async (req, res) => {
  try {
    const { domain, years = 5 } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Research domain is required' });
    }

    console.log(`📈 Identifying trends in: ${domain} (last ${years} years)`);
    const trends = await scientificDatabaseService.getLens().identifyTrends(domain, years);
    
    res.json(trends);
  } catch (error: any) {
    console.error('Error identifying trends:', error);
    res.status(500).json({ error: 'Failed to identify trends', details: error.message });
  }
});

// ==============================================
// UNIFIED SCIENTIFIC DATABASE SEARCH
// ==============================================

// Search across all databases (Materials + Lens)
router.post('/search-all', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`🌍 Searching all scientific databases: ${query}`);
    const results = await scientificDatabaseService.searchAll(query);
    
    res.json({
      materials: { count: results.materials.length, data: results.materials },
      papers: { count: results.papers.length, data: results.papers },
      patents: { count: results.patents.length, data: results.patents },
      total: results.materials.length + results.papers.length + results.patents.length
    });
  } catch (error: any) {
    console.error('Error searching all databases:', error);
    res.status(500).json({ error: 'Failed to search databases', details: error.message });
  }
});

// Get research insights for a domain
router.post('/research-insights', async (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Research domain is required' });
    }

    console.log(`💡 Getting research insights for: ${domain}`);
    const insights = await scientificDatabaseService.getResearchInsights(domain);
    
    res.json(insights);
  } catch (error: any) {
    console.error('Error getting research insights:', error);
    res.status(500).json({ error: 'Failed to get insights', details: error.message });
  }
});

// Discover materials based on requirements
router.post('/discover-materials', async (req, res) => {
  try {
    const { requirements } = req.body;
    
    if (!requirements) {
      return res.status(400).json({ error: 'Requirements are required' });
    }

    console.log(`🔍 Discovering materials with requirements:`, requirements);
    const materials = await scientificDatabaseService.discoverMaterials(requirements);
    
    res.json({ count: materials.length, materials });
  } catch (error: any) {
    console.error('Error discovering materials:', error);
    res.status(500).json({ error: 'Failed to discover materials', details: error.message });
  }
});

export default router;

