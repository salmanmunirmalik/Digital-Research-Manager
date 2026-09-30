/**
 * Marketplace directory API - browse & contact only (no deals/orders).
 */
import { Router } from 'express';
import crypto from 'crypto';
import pool from '../../database/config.js';
import {
  parseInterestList,
  softMatchScore,
  buildInterestMatchReasons,
} from '../utils/interestOverlap.js';

const router: Router = Router();

const parseList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const toJsonList = (value: unknown): string => JSON.stringify(parseList(value));

const mapSupplier = (row: any) => ({
  ...row,
  specializations: parseList(row.specializations),
  verified: Boolean(row.verified),
  is_active: Boolean(row.is_active),
  postedByName:
    (row.owner_name && String(row.owner_name).trim()) ||
    row.username ||
    null,
});

const mapProvider = (row: any) => ({
  ...row,
  expertise_areas: parseList(row.expertise_areas),
  techniques: parseList(row.techniques),
  verified: Boolean(row.verified),
  is_active: Boolean(row.is_active),
  postedByName:
    (row.owner_name && String(row.owner_name).trim()) ||
    row.username ||
    null,
});

const mapOffering = (row: any) => ({
  ...row,
  tags: parseList(row.tags),
  is_active: Boolean(row.is_active),
});

const formatDeadline = (value: unknown): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
};

const mapTender = (row: any) => ({
  ...row,
  requirements: parseList(row.requirements),
  deadline: formatDeadline(row.deadline),
  is_active: Boolean(row.is_active),
  postedByName:
    (row.owner_name && String(row.owner_name).trim()) ||
    row.username ||
    null,
});

const requireUser = (req: any, res: any) => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return req.user as { id: string; email?: string };
};

// Directory summary (used by health/QA and clients that hit /api/marketplace)
router.get('/', async (_req, res) => {
  res.json({
    ok: true,
    endpoints: {
      suppliers: '/api/marketplace/suppliers',
      serviceProviders: '/api/marketplace/service-providers',
      tenders: '/api/marketplace/tenders',
    },
  });
});

// ─── Suppliers (public browse) ───────────────────────────────────────────────

router.get('/suppliers', async (req, res) => {
  try {
    const { search, specialization, verified } = req.query;
    let query = `
      SELECT s.*,
        COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), u.username, '') AS owner_name,
        u.username
      FROM marketplace_suppliers s
      LEFT JOIN users u ON u.id = s.user_id
      WHERE s.is_active = 1
    `;
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (
        s.company_name LIKE $${params.length}
        OR s.description LIKE $${params.length}
        OR s.location LIKE $${params.length}
        OR s.specializations LIKE $${params.length}
      )`;
    }
    if (specialization && specialization !== 'all') {
      params.push(`%${specialization}%`);
      query += ` AND s.specializations LIKE $${params.length}`;
    }
    if (verified === 'true' || verified === '1') {
      query += ` AND s.verified = 1`;
    }

    query += ` ORDER BY s.verified DESC, s.company_name ASC`;
    const result = await pool.query(query, params);
    res.json({ suppliers: result.rows.map(mapSupplier) });
  } catch (error: any) {
    console.error('List suppliers error:', error);
    res.status(500).json({ error: error.message || 'Failed to list suppliers' });
  }
});

router.get('/suppliers/me', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const result = await pool.query(
      `SELECT * FROM marketplace_suppliers WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );
    if (result.rows.length === 0) {
      return res.json({ supplier: null });
    }
    const supplier = mapSupplier(result.rows[0]);
    const catalog = await pool.query(
      `SELECT * FROM marketplace_supplier_catalog
       WHERE supplier_id = $1 ORDER BY name ASC`,
      [supplier.id]
    );
    res.json({ supplier, catalog: catalog.rows });
  } catch (error: any) {
    console.error('Get my supplier error:', error);
    res.status(500).json({ error: error.message || 'Failed to load supplier profile' });
  }
});

router.get('/suppliers/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*,
        COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), u.username, '') AS owner_name,
        u.username
       FROM marketplace_suppliers s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.id = $1 AND s.is_active = 1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    const supplier = mapSupplier(result.rows[0]);
    const catalog = await pool.query(
      `SELECT * FROM marketplace_supplier_catalog
       WHERE supplier_id = $1 AND is_active = 1 ORDER BY name ASC`,
      [supplier.id]
    );
    res.json({ supplier, catalog: catalog.rows });
  } catch (error: any) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: error.message || 'Failed to load supplier' });
  }
});

router.post('/suppliers/register', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const {
      company_name,
      contact_email,
      contact_phone,
      website,
      location,
      country,
      description,
      specializations,
    } = req.body || {};

    if (!company_name?.trim() || !contact_email?.trim()) {
      return res.status(400).json({ error: 'Company name and contact email are required' });
    }

    const existing = await pool.query(
      `SELECT id FROM marketplace_suppliers WHERE user_id = $1`,
      [user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'You already have a supplier profile',
        supplierId: existing.rows[0].id,
      });
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO marketplace_suppliers (
        id, user_id, company_name, contact_email, contact_phone, website,
        location, country, description, specializations, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1)`,
      [
        id,
        user.id,
        company_name.trim(),
        contact_email.trim().toLowerCase(),
        contact_phone || null,
        website || null,
        location || null,
        country || null,
        description || null,
        toJsonList(specializations),
      ]
    );

    const created = await pool.query(`SELECT * FROM marketplace_suppliers WHERE id = $1`, [id]);
    res.status(201).json({
      message: 'Supplier profile created',
      supplier: mapSupplier(created.rows[0]),
    });
  } catch (error: any) {
    console.error('Register supplier error:', error);
    res.status(500).json({ error: error.message || 'Failed to register supplier' });
  }
});

router.put('/suppliers/me', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const current = await pool.query(
      `SELECT * FROM marketplace_suppliers WHERE user_id = $1`,
      [user.id]
    );
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const row = current.rows[0];
    const b = req.body || {};
    await pool.query(
      `UPDATE marketplace_suppliers SET
        company_name = $1,
        contact_email = $2,
        contact_phone = $3,
        website = $4,
        location = $5,
        country = $6,
        description = $7,
        specializations = $8,
        is_active = $9,
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $10`,
      [
        (b.company_name ?? row.company_name).trim(),
        (b.contact_email ?? row.contact_email).trim().toLowerCase(),
        b.contact_phone !== undefined ? b.contact_phone : row.contact_phone,
        b.website !== undefined ? b.website : row.website,
        b.location !== undefined ? b.location : row.location,
        b.country !== undefined ? b.country : row.country,
        b.description !== undefined ? b.description : row.description,
        b.specializations !== undefined ? toJsonList(b.specializations) : row.specializations,
        b.is_active === undefined ? row.is_active : b.is_active ? 1 : 0,
        user.id,
      ]
    );

    const updated = await pool.query(
      `SELECT * FROM marketplace_suppliers WHERE user_id = $1`,
      [user.id]
    );
    res.json({ supplier: mapSupplier(updated.rows[0]) });
  } catch (error: any) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: error.message || 'Failed to update supplier' });
  }
});

router.delete('/suppliers/me', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const existing = await pool.query(
      `SELECT id FROM marketplace_suppliers WHERE user_id = $1`,
      [user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier listing not found' });
    }
    const supplierId = existing.rows[0].id;
    await pool.query(`DELETE FROM marketplace_supplier_catalog WHERE supplier_id = $1`, [supplierId]);
    await pool.query(`DELETE FROM marketplace_suppliers WHERE id = $1`, [supplierId]);
    res.json({ message: 'Supplier listing deleted' });
  } catch (error: any) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete supplier' });
  }
});

router.post('/suppliers/me/catalog', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const supplier = await pool.query(
      `SELECT id FROM marketplace_suppliers WHERE user_id = $1`,
      [user.id]
    );
    if (supplier.rows.length === 0) {
      return res.status(404).json({ error: 'Register as a supplier first' });
    }

    const { name, description, category, pricing_note } = req.body || {};
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Catalog item name is required' });
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO marketplace_supplier_catalog
        (id, supplier_id, name, description, category, pricing_note, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,1)`,
      [
        id,
        supplier.rows[0].id,
        name.trim(),
        description || null,
        category || null,
        pricing_note || null,
      ]
    );
    const created = await pool.query(
      `SELECT * FROM marketplace_supplier_catalog WHERE id = $1`,
      [id]
    );
    res.status(201).json({ item: created.rows[0] });
  } catch (error: any) {
    console.error('Add catalog item error:', error);
    res.status(500).json({ error: error.message || 'Failed to add catalog item' });
  }
});

router.put('/suppliers/me/catalog/:itemId', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const owned = await pool.query(
      `SELECT c.id FROM marketplace_supplier_catalog c
       JOIN marketplace_suppliers s ON s.id = c.supplier_id
       WHERE c.id = $1 AND s.user_id = $2`,
      [req.params.itemId, user.id]
    );
    if (owned.rows.length === 0) {
      return res.status(404).json({ error: 'Catalog item not found' });
    }

    const b = req.body || {};
    const current = await pool.query(
      `SELECT * FROM marketplace_supplier_catalog WHERE id = $1`,
      [req.params.itemId]
    );
    const row = current.rows[0];
    await pool.query(
      `UPDATE marketplace_supplier_catalog SET
        name = $1, description = $2, category = $3, pricing_note = $4,
        is_active = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [
        (b.name ?? row.name).trim(),
        b.description !== undefined ? b.description : row.description,
        b.category !== undefined ? b.category : row.category,
        b.pricing_note !== undefined ? b.pricing_note : row.pricing_note,
        b.is_active === undefined ? row.is_active : b.is_active ? 1 : 0,
        req.params.itemId,
      ]
    );
    const updated = await pool.query(
      `SELECT * FROM marketplace_supplier_catalog WHERE id = $1`,
      [req.params.itemId]
    );
    res.json({ item: updated.rows[0] });
  } catch (error: any) {
    console.error('Update catalog item error:', error);
    res.status(500).json({ error: error.message || 'Failed to update catalog item' });
  }
});

router.delete('/suppliers/me/catalog/:itemId', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const owned = await pool.query(
      `SELECT c.id FROM marketplace_supplier_catalog c
       JOIN marketplace_suppliers s ON s.id = c.supplier_id
       WHERE c.id = $1 AND s.user_id = $2`,
      [req.params.itemId, user.id]
    );
    if (owned.rows.length === 0) {
      return res.status(404).json({ error: 'Catalog item not found' });
    }

    await pool.query(`DELETE FROM marketplace_supplier_catalog WHERE id = $1`, [
      req.params.itemId,
    ]);
    res.json({ message: 'Catalog item removed' });
  } catch (error: any) {
    console.error('Delete catalog item error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete catalog item' });
  }
});

// ─── Service providers (public browse) ───────────────────────────────────────

router.get('/service-providers', async (req: any, res) => {
  try {
    const { search, expertise } = req.query;
    let query = `
      SELECT p.*,
        COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), u.username, '') AS owner_name,
        u.username
      FROM marketplace_service_providers p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.is_active = 1
    `;
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (
        p.display_name LIKE $${params.length}
        OR p.bio LIKE $${params.length}
        OR p.institution LIKE $${params.length}
        OR p.expertise_areas LIKE $${params.length}
        OR p.techniques LIKE $${params.length}
      )`;
    }
    if (expertise && expertise !== 'all') {
      params.push(`%${expertise}%`);
      query += ` AND (
        p.expertise_areas LIKE $${params.length}
        OR p.techniques LIKE $${params.length}
      )`;
    }

    query += ` ORDER BY p.verified DESC, p.display_name ASC`;
    const result = await pool.query(query, params);

    let viewerInterests: string[] = [];
    if (req.user?.id) {
      try {
        const me = await pool.query(
          `SELECT research_interests, expertise, specialization FROM users WHERE id = $1 LIMIT 1`,
          [req.user.id]
        );
        const row = me.rows[0];
        if (row) {
          viewerInterests = [
            ...parseInterestList(row.research_interests),
            ...parseInterestList(row.expertise),
            ...(row.specialization ? [String(row.specialization)] : []),
          ];
        }
      } catch {
        viewerInterests = [];
      }
    }

    const providers = result.rows.map((row: any) => {
      const mapped = mapProvider(row);
      const tags = [...(mapped.expertise_areas || []), ...(mapped.techniques || [])];
      const matchScore = softMatchScore(viewerInterests, tags);
      return {
        ...mapped,
        matchScore,
        matchReasons: buildInterestMatchReasons(viewerInterests, tags),
      };
    });

    providers.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if (Number(b.verified) !== Number(a.verified)) return Number(b.verified) - Number(a.verified);
      return String(a.display_name || '').localeCompare(String(b.display_name || ''), undefined, {
        sensitivity: 'base',
      });
    });

    res.json({
      providers,
      viewerHasInterests: viewerInterests.length > 0,
    });
  } catch (error: any) {
    console.error('List service providers error:', error);
    res.status(500).json({ error: error.message || 'Failed to list service providers' });
  }
});

router.get('/service-providers/me', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const result = await pool.query(
      `SELECT * FROM marketplace_service_providers WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );
    if (result.rows.length === 0) {
      return res.json({ provider: null });
    }
    const provider = mapProvider(result.rows[0]);
    const offerings = await pool.query(
      `SELECT * FROM marketplace_service_offerings
       WHERE provider_id = $1 ORDER BY title ASC`,
      [provider.id]
    );
    res.json({ provider, offerings: offerings.rows.map(mapOffering) });
  } catch (error: any) {
    console.error('Get my provider error:', error);
    res.status(500).json({ error: error.message || 'Failed to load provider profile' });
  }
});

router.get('/service-providers/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), u.username, '') AS owner_name,
        u.username
       FROM marketplace_service_providers p
       LEFT JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND p.is_active = 1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service provider not found' });
    }
    const provider = mapProvider(result.rows[0]);
    const offerings = await pool.query(
      `SELECT * FROM marketplace_service_offerings
       WHERE provider_id = $1 AND is_active = 1 ORDER BY title ASC`,
      [provider.id]
    );
    res.json({ provider, offerings: offerings.rows.map(mapOffering) });
  } catch (error: any) {
    console.error('Get service provider error:', error);
    res.status(500).json({ error: error.message || 'Failed to load service provider' });
  }
});

router.post('/service-providers/register', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const {
      display_name,
      contact_email,
      contact_phone,
      website,
      institution,
      location,
      bio,
      expertise_areas,
      techniques,
      pricing_note,
    } = req.body || {};

    if (!display_name?.trim() || !contact_email?.trim()) {
      return res.status(400).json({ error: 'Display name and contact email are required' });
    }

    const existing = await pool.query(
      `SELECT id FROM marketplace_service_providers WHERE user_id = $1`,
      [user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'You already have a service provider profile',
        providerId: existing.rows[0].id,
      });
    }

    const id = crypto.randomUUID();
    let expertiseList = parseList(expertise_areas);
    if (expertiseList.length === 0) {
      const me = await pool.query(
        `SELECT research_interests, expertise FROM users WHERE id = $1 LIMIT 1`,
        [user.id]
      );
      expertiseList = [
        ...new Set(
          [
            ...parseInterestList(me.rows[0]?.research_interests),
            ...parseInterestList(me.rows[0]?.expertise),
          ]
            .map((s) => s.trim())
            .filter(Boolean)
        ),
      ];
    }

    await pool.query(
      `INSERT INTO marketplace_service_providers (
        id, user_id, display_name, contact_email, contact_phone, website,
        institution, location, bio, expertise_areas, techniques, pricing_note, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1)`,
      [
        id,
        user.id,
        display_name.trim(),
        contact_email.trim().toLowerCase(),
        contact_phone || null,
        website || null,
        institution || null,
        location || null,
        bio || null,
        toJsonList(expertiseList),
        toJsonList(techniques),
        pricing_note || null,
      ]
    );

    const created = await pool.query(
      `SELECT * FROM marketplace_service_providers WHERE id = $1`,
      [id]
    );
    res.status(201).json({
      message: 'Service provider profile created',
      provider: mapProvider(created.rows[0]),
    });
  } catch (error: any) {
    console.error('Register service provider error:', error);
    res.status(500).json({ error: error.message || 'Failed to register service provider' });
  }
});

router.put('/service-providers/me', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const current = await pool.query(
      `SELECT * FROM marketplace_service_providers WHERE user_id = $1`,
      [user.id]
    );
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Service provider profile not found' });
    }

    const row = current.rows[0];
    const b = req.body || {};
    await pool.query(
      `UPDATE marketplace_service_providers SET
        display_name = $1,
        contact_email = $2,
        contact_phone = $3,
        website = $4,
        institution = $5,
        location = $6,
        bio = $7,
        expertise_areas = $8,
        techniques = $9,
        pricing_note = $10,
        is_active = $11,
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $12`,
      [
        (b.display_name ?? row.display_name).trim(),
        (b.contact_email ?? row.contact_email).trim().toLowerCase(),
        b.contact_phone !== undefined ? b.contact_phone : row.contact_phone,
        b.website !== undefined ? b.website : row.website,
        b.institution !== undefined ? b.institution : row.institution,
        b.location !== undefined ? b.location : row.location,
        b.bio !== undefined ? b.bio : row.bio,
        b.expertise_areas !== undefined ? toJsonList(b.expertise_areas) : row.expertise_areas,
        b.techniques !== undefined ? toJsonList(b.techniques) : row.techniques,
        b.pricing_note !== undefined ? b.pricing_note : row.pricing_note,
        b.is_active === undefined ? row.is_active : b.is_active ? 1 : 0,
        user.id,
      ]
    );

    const updated = await pool.query(
      `SELECT * FROM marketplace_service_providers WHERE user_id = $1`,
      [user.id]
    );
    res.json({ provider: mapProvider(updated.rows[0]) });
  } catch (error: any) {
    console.error('Update service provider error:', error);
    res.status(500).json({ error: error.message || 'Failed to update service provider' });
  }
});

router.delete('/service-providers/me', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const existing = await pool.query(
      `SELECT id FROM marketplace_service_providers WHERE user_id = $1`,
      [user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Service provider listing not found' });
    }
    const providerId = existing.rows[0].id;
    await pool.query(`DELETE FROM marketplace_service_offerings WHERE provider_id = $1`, [
      providerId,
    ]);
    await pool.query(`DELETE FROM marketplace_service_providers WHERE id = $1`, [providerId]);
    res.json({ message: 'Service provider listing deleted' });
  } catch (error: any) {
    console.error('Delete provider error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete provider' });
  }
});

router.post('/service-providers/me/offerings', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const provider = await pool.query(
      `SELECT id FROM marketplace_service_providers WHERE user_id = $1`,
      [user.id]
    );
    if (provider.rows.length === 0) {
      return res.status(404).json({ error: 'Register as a service provider first' });
    }

    const { title, description, service_type, turnaround_note, pricing_note, tags } =
      req.body || {};
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Offering title is required' });
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO marketplace_service_offerings
        (id, provider_id, title, description, service_type, turnaround_note, pricing_note, tags, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1)`,
      [
        id,
        provider.rows[0].id,
        title.trim(),
        description || null,
        service_type || 'consulting',
        turnaround_note || null,
        pricing_note || null,
        toJsonList(tags),
      ]
    );
    const created = await pool.query(
      `SELECT * FROM marketplace_service_offerings WHERE id = $1`,
      [id]
    );
    res.status(201).json({ offering: mapOffering(created.rows[0]) });
  } catch (error: any) {
    console.error('Add offering error:', error);
    res.status(500).json({ error: error.message || 'Failed to add offering' });
  }
});

router.put('/service-providers/me/offerings/:offeringId', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const owned = await pool.query(
      `SELECT o.id FROM marketplace_service_offerings o
       JOIN marketplace_service_providers p ON p.id = o.provider_id
       WHERE o.id = $1 AND p.user_id = $2`,
      [req.params.offeringId, user.id]
    );
    if (owned.rows.length === 0) {
      return res.status(404).json({ error: 'Offering not found' });
    }

    const b = req.body || {};
    const current = await pool.query(
      `SELECT * FROM marketplace_service_offerings WHERE id = $1`,
      [req.params.offeringId]
    );
    const row = current.rows[0];
    await pool.query(
      `UPDATE marketplace_service_offerings SET
        title = $1, description = $2, service_type = $3,
        turnaround_note = $4, pricing_note = $5, tags = $6,
        is_active = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        (b.title ?? row.title).trim(),
        b.description !== undefined ? b.description : row.description,
        b.service_type !== undefined ? b.service_type : row.service_type,
        b.turnaround_note !== undefined ? b.turnaround_note : row.turnaround_note,
        b.pricing_note !== undefined ? b.pricing_note : row.pricing_note,
        b.tags !== undefined ? toJsonList(b.tags) : row.tags,
        b.is_active === undefined ? row.is_active : b.is_active ? 1 : 0,
        req.params.offeringId,
      ]
    );
    const updated = await pool.query(
      `SELECT * FROM marketplace_service_offerings WHERE id = $1`,
      [req.params.offeringId]
    );
    res.json({ offering: mapOffering(updated.rows[0]) });
  } catch (error: any) {
    console.error('Update offering error:', error);
    res.status(500).json({ error: error.message || 'Failed to update offering' });
  }
});

router.delete('/service-providers/me/offerings/:offeringId', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const owned = await pool.query(
      `SELECT o.id FROM marketplace_service_offerings o
       JOIN marketplace_service_providers p ON p.id = o.provider_id
       WHERE o.id = $1 AND p.user_id = $2`,
      [req.params.offeringId, user.id]
    );
    if (owned.rows.length === 0) {
      return res.status(404).json({ error: 'Offering not found' });
    }

    await pool.query(`DELETE FROM marketplace_service_offerings WHERE id = $1`, [
      req.params.offeringId,
    ]);
    res.json({ message: 'Offering removed' });
  } catch (error: any) {
    console.error('Delete offering error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete offering' });
  }
});

// ─── Tenders / RFPs (public browse) ──────────────────────────────────────────

router.get('/tenders', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = `
      SELECT t.*,
        COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), u.username, '') AS owner_name,
        u.username
      FROM marketplace_tenders t
      LEFT JOIN users u ON u.id = t.user_id
      WHERE t.is_active = 1
    `;
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (
        t.title LIKE $${params.length}
        OR t.description LIKE $${params.length}
        OR t.organization LIKE $${params.length}
        OR t.location LIKE $${params.length}
        OR t.category LIKE $${params.length}
        OR t.requirements LIKE $${params.length}
      )`;
    }
    if (category && category !== 'all') {
      params.push(`%${category}%`);
      query += ` AND t.category LIKE $${params.length}`;
    }

    query += ` ORDER BY
      CASE WHEN t.deadline IS NULL THEN 1 ELSE 0 END,
      t.deadline ASC,
      t.created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ tenders: result.rows.map(mapTender) });
  } catch (error: any) {
    console.error('List tenders error:', error);
    res.status(500).json({ error: error.message || 'Failed to list tenders' });
  }
});

router.get('/tenders/mine', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const result = await pool.query(
      `SELECT t.*,
        COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), u.username, '') AS owner_name,
        u.username
       FROM marketplace_tenders t
       LEFT JOIN users u ON u.id = t.user_id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [user.id]
    );
    res.json({ tenders: result.rows.map(mapTender) });
  } catch (error: any) {
    console.error('Get my tenders error:', error);
    res.status(500).json({ error: error.message || 'Failed to load your tenders' });
  }
});

router.get('/tenders/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*,
        COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), u.username, '') AS owner_name,
        u.username
       FROM marketplace_tenders t
       LEFT JOIN users u ON u.id = t.user_id
       WHERE t.id = $1 AND t.is_active = 1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }
    res.json({ tender: mapTender(result.rows[0]) });
  } catch (error: any) {
    console.error('Get tender error:', error);
    res.status(500).json({ error: error.message || 'Failed to load tender' });
  }
});

router.post('/tenders', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const {
      title,
      organization,
      contact_email,
      contact_phone,
      location,
      country,
      description,
      category,
      budget_note,
      deadline,
      requirements,
    } = req.body || {};

    if (!title?.trim() || !contact_email?.trim()) {
      return res.status(400).json({ error: 'Title and contact email are required' });
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO marketplace_tenders (
        id, user_id, title, organization, contact_email, contact_phone,
        location, country, description, category, budget_note, deadline,
        requirements, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,1)`,
      [
        id,
        user.id,
        title.trim(),
        organization || null,
        contact_email.trim().toLowerCase(),
        contact_phone || null,
        location || null,
        country || null,
        description || null,
        category || null,
        budget_note || null,
        deadline || null,
        toJsonList(requirements),
      ]
    );

    const created = await pool.query(`SELECT * FROM marketplace_tenders WHERE id = $1`, [id]);
    res.status(201).json({
      message: 'Tender posted',
      tender: mapTender(created.rows[0]),
    });
  } catch (error: any) {
    console.error('Create tender error:', error);
    res.status(500).json({ error: error.message || 'Failed to post tender' });
  }
});

router.put('/tenders/:id', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const current = await pool.query(
      `SELECT * FROM marketplace_tenders WHERE id = $1 AND user_id = $2`,
      [req.params.id, user.id]
    );
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    const row = current.rows[0];
    const b = req.body || {};
    await pool.query(
      `UPDATE marketplace_tenders SET
        title = $1,
        organization = $2,
        contact_email = $3,
        contact_phone = $4,
        location = $5,
        country = $6,
        description = $7,
        category = $8,
        budget_note = $9,
        deadline = $10,
        requirements = $11,
        is_active = $12,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 AND user_id = $14`,
      [
        (b.title ?? row.title).trim(),
        b.organization !== undefined ? b.organization : row.organization,
        (b.contact_email ?? row.contact_email).trim().toLowerCase(),
        b.contact_phone !== undefined ? b.contact_phone : row.contact_phone,
        b.location !== undefined ? b.location : row.location,
        b.country !== undefined ? b.country : row.country,
        b.description !== undefined ? b.description : row.description,
        b.category !== undefined ? b.category : row.category,
        b.budget_note !== undefined ? b.budget_note : row.budget_note,
        b.deadline !== undefined ? b.deadline || null : row.deadline,
        b.requirements !== undefined ? toJsonList(b.requirements) : row.requirements,
        b.is_active === undefined ? row.is_active : b.is_active ? 1 : 0,
        req.params.id,
        user.id,
      ]
    );

    const updated = await pool.query(`SELECT * FROM marketplace_tenders WHERE id = $1`, [
      req.params.id,
    ]);
    res.json({ tender: mapTender(updated.rows[0]) });
  } catch (error: any) {
    console.error('Update tender error:', error);
    res.status(500).json({ error: error.message || 'Failed to update tender' });
  }
});

router.delete('/tenders/:id', async (req: any, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const existing = await pool.query(
      `SELECT id FROM marketplace_tenders WHERE id = $1 AND user_id = $2`,
      [req.params.id, user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    await pool.query(`DELETE FROM marketplace_tenders WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Tender deleted' });
  } catch (error: any) {
    console.error('Delete tender error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete tender' });
  }
});

export default router;
