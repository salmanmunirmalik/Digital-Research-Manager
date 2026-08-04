/**
 * Research Events / Opportunities API
 * Directory of conferences, workshops, exchanges - distinct from personal calendar_events
 */

import { Router } from 'express';
import crypto from 'crypto';
import pool from '../../database/config.js';
import { POSTED_BY_SQL, userDisplayName, nameFromAuthUser } from '../utils/postedBy.js';

const router: Router = Router();

const toJson = (value: unknown) => JSON.stringify(value ?? []);
const parseJson = (value: unknown, fallback: unknown = []) => {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapEvent = (row: any, extras: { isApplied?: boolean; isBookmarked?: boolean } = {}) => ({
  id: row.id,
  createdBy: row.created_by || null,
  postedByName: userDisplayName({
    posted_by_name: row.posted_by_name,
    first_name: row.first_name,
    last_name: row.last_name,
    username: row.username,
  }),
  title: row.title,
  type: row.event_type,
  description: row.description || '',
  organizer: row.organizer || '',
  institution: row.institution || '',
  location: row.location || '',
  country: row.country || '',
  startDate: row.start_date,
  endDate: row.end_date,
  applicationDeadline: row.application_deadline,
  maxParticipants: Number(row.max_participants || 0),
  currentParticipants: Number(row.current_participants || 0),
  cost: Number(row.cost || 0),
  currency: row.currency || 'USD',
  funding: Boolean(row.has_stipend),
  fundingAmount: row.stipend_amount != null ? Number(row.stipend_amount) : undefined,
  requirements: parseJson(row.requirements, []),
  skillsRequired: parseJson(row.skills_required, []),
  benefits: parseJson(row.benefits, []),
  website: row.website || '',
  contactEmail: row.contact_email || '',
  status: row.status || 'upcoming',
  isApplied: Boolean(extras.isApplied),
  isBookmarked: Boolean(extras.isBookmarked),
  rating: 0,
  reviewsCount: 0,
});

// List events
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { type, search, funding } = req.query;

    let query = `
      SELECT e.*,
        COALESCE(
          NULLIF(e.posted_by_name, ''),
          NULLIF(${POSTED_BY_SQL}, ''),
          u.username
        ) AS posted_by_name,
        u.first_name, u.last_name, u.username
      FROM research_events e
      LEFT JOIN users u ON u.id = e.created_by
      WHERE e.is_published = 1
    `;
    const params: any[] = [];

    if (type && type !== 'all') {
      params.push(type);
      query += ` AND e.event_type = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (e.title LIKE $${params.length} OR e.description LIKE $${params.length} OR e.location LIKE $${params.length})`;
    }
    if (funding === 'funded') {
      query += ` AND e.has_stipend = 1`;
    } else if (funding === 'unfunded') {
      query += ` AND e.has_stipend = 0`;
    }

    query += ` ORDER BY e.start_date ASC, e.created_at DESC`;

    const result = await pool.query(query, params);

    let bookmarks = new Set<string>();
    let applications = new Set<string>();
    if (userId && result.rows.length > 0) {
      const ids = result.rows.map((r: any) => r.id);
      const placeholders = ids.map((_: string, i: number) => `$${i + 2}`).join(',');
      const [bm, ap] = await Promise.all([
        pool.query(
          `SELECT event_id FROM research_event_bookmarks WHERE user_id = $1 AND event_id IN (${placeholders})`,
          [userId, ...ids]
        ),
        pool.query(
          `SELECT event_id FROM research_event_applications WHERE user_id = $1 AND event_id IN (${placeholders})`,
          [userId, ...ids]
        ),
      ]);
      bookmarks = new Set(bm.rows.map((r: any) => r.event_id));
      applications = new Set(ap.rows.map((r: any) => r.event_id));
    }

    res.json({
      events: result.rows.map((row: any) =>
        mapEvent(row, {
          isBookmarked: bookmarks.has(row.id),
          isApplied: applications.has(row.id),
        })
      ),
    });
  } catch (error: any) {
    console.error('Error listing research events:', error);
    res.status(500).json({ error: error.message || 'Failed to list events' });
  }
});

// Create event
router.post('/', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      type,
      description,
      organizer,
      institution,
      location,
      country,
      startDate,
      endDate,
      applicationDeadline,
      maxParticipants,
      cost,
      currency,
      funding,
      fundingAmount,
      requirements,
      skillsRequired,
      benefits,
      website,
      contactEmail,
      status,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const id = crypto.randomUUID();
    const posterName = nameFromAuthUser(req.user);
    await pool.query(
      `INSERT INTO research_events (
        id, created_by, posted_by_name, title, event_type, description, organizer, institution,
        location, country, start_date, end_date, application_deadline,
        max_participants, cost, currency, has_stipend, stipend_amount,
        requirements, skills_required, benefits, website, contact_email, status, is_published
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,1
      )`,
      [
        id,
        userId,
        posterName,
        title,
        type || 'conference',
        description || '',
        organizer || '',
        institution || '',
        location || '',
        country || '',
        startDate || null,
        endDate || null,
        applicationDeadline || null,
        maxParticipants || 0,
        cost || 0,
        currency || 'USD',
        funding ? 1 : 0,
        fundingAmount || null,
        toJson(requirements),
        toJson(skillsRequired),
        toJson(benefits),
        website || '',
        contactEmail || '',
        status || 'upcoming',
      ]
    );

    const created = await pool.query(
      `SELECT e.*,
        NULLIF(${POSTED_BY_SQL}, '') AS posted_by_name,
        u.first_name, u.last_name, u.username
       FROM research_events e
       LEFT JOIN users u ON u.id = e.created_by
       WHERE e.id = $1`,
      [id]
    );
    res.status(201).json({ event: mapEvent(created.rows[0]) });
  } catch (error: any) {
    console.error('Error creating research event:', error);
    res.status(500).json({ error: error.message || 'Failed to create event' });
  }
});

// Bookmark / unbookmark
router.post('/:id/bookmark', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const existing = await pool.query(
      `SELECT id FROM research_event_bookmarks WHERE event_id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (existing.rows.length > 0) {
      await pool.query(`DELETE FROM research_event_bookmarks WHERE event_id = $1 AND user_id = $2`, [
        id,
        userId,
      ]);
      return res.json({ bookmarked: false });
    }
    await pool.query(
      `INSERT INTO research_event_bookmarks (id, event_id, user_id) VALUES ($1, $2, $3)`,
      [crypto.randomUUID(), id, userId]
    );
    res.json({ bookmarked: true });
  } catch (error: any) {
    console.error('Error bookmarking event:', error);
    res.status(500).json({ error: 'Failed to bookmark event' });
  }
});

// Apply
router.post('/:id/apply', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const existing = await pool.query(
      `SELECT id FROM research_event_applications WHERE event_id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (existing.rows.length > 0) {
      return res.json({ applied: true });
    }
    await pool.query(
      `INSERT INTO research_event_applications (id, event_id, user_id, status) VALUES ($1, $2, $3, 'applied')`,
      [crypto.randomUUID(), id, userId]
    );
    await pool.query(
      `UPDATE research_events SET current_participants = current_participants + 1 WHERE id = $1`,
      [id]
    );
    res.json({ applied: true });
  } catch (error: any) {
    console.error('Error applying to event:', error);
    res.status(500).json({ error: 'Failed to apply' });
  }
});

// Update
router.put('/:id', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const ownership = await pool.query(
      `SELECT created_by FROM research_events WHERE id = $1`,
      [id]
    );
    if (ownership.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (ownership.rows[0].created_by !== userId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const b = req.body;
    await pool.query(
      `UPDATE research_events SET
        title = COALESCE($1, title),
        event_type = COALESCE($2, event_type),
        description = COALESCE($3, description),
        organizer = COALESCE($4, organizer),
        institution = COALESCE($5, institution),
        location = COALESCE($6, location),
        country = COALESCE($7, country),
        start_date = COALESCE($8, start_date),
        end_date = COALESCE($9, end_date),
        application_deadline = COALESCE($10, application_deadline),
        max_participants = COALESCE($11, max_participants),
        cost = COALESCE($12, cost),
        currency = COALESCE($13, currency),
        has_stipend = COALESCE($14, has_stipend),
        stipend_amount = COALESCE($15, stipend_amount),
        requirements = COALESCE($16, requirements),
        skills_required = COALESCE($17, skills_required),
        benefits = COALESCE($18, benefits),
        website = COALESCE($19, website),
        contact_email = COALESCE($20, contact_email),
        status = COALESCE($21, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $22`,
      [
        b.title ?? null,
        b.type ?? null,
        b.description ?? null,
        b.organizer ?? null,
        b.institution ?? null,
        b.location ?? null,
        b.country ?? null,
        b.startDate ?? null,
        b.endDate ?? null,
        b.applicationDeadline ?? null,
        b.maxParticipants ?? null,
        b.cost ?? null,
        b.currency ?? null,
        b.funding == null ? null : b.funding ? 1 : 0,
        b.fundingAmount ?? null,
        b.requirements != null ? toJson(b.requirements) : null,
        b.skillsRequired != null ? toJson(b.skillsRequired) : null,
        b.benefits != null ? toJson(b.benefits) : null,
        b.website ?? null,
        b.contactEmail ?? null,
        b.status ?? null,
        id,
      ]
    );

    const updated = await pool.query(`SELECT * FROM research_events WHERE id = $1`, [id]);
    res.json({ event: mapEvent(updated.rows[0]) });
  } catch (error: any) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete
router.delete('/:id', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const ownership = await pool.query(
      `SELECT created_by FROM research_events WHERE id = $1`,
      [id]
    );
    if (ownership.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (ownership.rows[0].created_by !== userId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    await pool.query(`DELETE FROM research_events WHERE id = $1`, [id]);
    res.json({ message: 'Event deleted' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
