/**
 * Networking directory - labs and researchers for discovery (no community posts).
 */
import { Router } from 'express';
import pool from '../../database/config.js';
import { LOOKING_FOR_OPTIONS, parseJsonList } from '../utils/labShowcase.js';
import { loadRelationshipMaps, loadLabRelationshipMaps } from './networkingSocial.js';
import {
  parseInterestList,
  softMatchScore,
  buildInterestMatchReasons,
} from '../utils/interestOverlap.js';

const router: Router = Router();

const parseList = (value: unknown): string[] => {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const raw = String(value).trim();
  if (!raw) return [];
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      /* fall through */
    }
  }
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

/** Parse "City, Region, Country" or "City, Country" into city + country. */
export const parseLocation = (raw?: string | null): { city: string; country: string; display: string } => {
  const display = String(raw || '').trim();
  if (!display) return { city: '', country: '', display: '' };
  const parts = display
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts[0], country: parts[parts.length - 1], display };
  }
  return { city: parts[0] || '', country: '', display };
};

const inferCareerStage = (role?: string | null, position?: string | null): string => {
  const blob = `${role || ''} ${position || ''}`.toLowerCase();
  if (/\b(undergrad|undergraduate|student|phd candidate|graduate student|msc|bsc)\b/.test(blob)) {
    return 'Student';
  }
  if (/\b(postdoc|post-doc|early career|junior|assistant)\b/.test(blob)) {
    return 'Early career';
  }
  if (/\b(associate|mid-career|lecturer|staff scientist)\b/.test(blob)) {
    return 'Mid career';
  }
  if (/\b(professor|principal|director|senior|pi|head of)\b/.test(blob)) {
    return 'Senior';
  }
  if (role === 'admin' || role === 'pi') return 'Senior';
  if (role === 'researcher') return 'Early career';
  return 'Unspecified';
};

const profileCompleteness = (row: any): number => {
  const checks = [
    Boolean(row.bio),
    Boolean(row.location),
    Boolean(row.specialization || row.department),
    Boolean(row.current_institution),
    Boolean(row.current_position),
    parseList(row.expertise).length > 0 || parseInterestList(row.research_interests).length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const loadViewerInterests = async (userId?: string): Promise<string[]> => {
  if (!userId) return [];
  try {
    const result = await pool.query(
      `SELECT research_interests, expertise, specialization FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    if (!result.rows[0]) return [];
    const row = result.rows[0];
    return [
      ...parseInterestList(row.research_interests),
      ...parseInterestList(row.expertise),
      ...(row.specialization ? [String(row.specialization)] : []),
    ];
  } catch {
    return [];
  }
};

let availabilityTableChecked = false;
let hasAvailabilityTable = false;

const ensureAvailabilityTable = async () => {
  if (availabilityTableChecked) return hasAvailabilityTable;
  try {
    const result = await pool.query(
      `SELECT 1 AS ok FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name = 'user_availability' LIMIT 1`
    );
    hasAvailabilityTable = result.rows.length > 0;
  } catch {
    hasAvailabilityTable = false;
  }
  availabilityTableChecked = true;
  return hasAvailabilityTable;
};

const uniqueSorted = (values: string[]) =>
  [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

router.get('/', async (req: any, res) => {
  try {
    const currentUserId = req.user?.id;
    const viewerInterests = await loadViewerInterests(currentUserId);

    const labsResult = await pool.query(
      `SELECT l.*,
        u.first_name AS pi_first_name, u.last_name AS pi_last_name,
        (SELECT COUNT(*) FROM lab_members lm WHERE lm.lab_id = l.id AND lm.is_active = 1) AS member_count
       FROM labs l
       LEFT JOIN users u ON u.id = l.principal_researcher_id
       WHERE COALESCE(l.is_showcased, 0) = 1
       ORDER BY l.showcased_at DESC, l.name ASC
       LIMIT 200`
    );

    let myLabs: any[] = [];
    if (currentUserId) {
      const mine = await pool.query(
        `SELECT l.*, lm.role AS membership_role,
          COALESCE(l.is_showcased, 0) AS is_showcased
         FROM lab_members lm
         JOIN labs l ON l.id = lm.lab_id
         WHERE lm.user_id = $1 AND lm.is_active = 1
           AND lm.role IN ('principal_researcher', 'admin')
         ORDER BY l.name ASC, lm.role ASC`,
        [currentUserId]
      );
      const seen = new Set<string>();
      myLabs = [];
      for (const row of mine.rows) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        myLabs.push({
          id: row.id,
          name: row.name,
          institution: row.institution || '',
          isShowcased: Boolean(Number(row.is_showcased)),
          membershipRole: row.membership_role,
          tagline: row.showcase_tagline || '',
        });
      }
    }

    const withAvailability = await ensureAvailabilityTable();
    const researchersResult = withAvailability
      ? await pool.query(
          `SELECT u.id, u.first_name, u.last_name, u.username, u.role, u.avatar_url,
            u.department, u.specialization, u.bio, u.current_position, u.current_institution,
            u.location, u.expertise, u.research_interests, u.timezone, u.profile_visibility, u.updated_at, u.last_login,
            ua.open_for_collaboration, ua.currently_available, ua.available_as_consultant,
            ua.available_for_workshops, ua.travel_willingness, ua.availability_notes
           FROM users u
           LEFT JOIN user_availability ua ON ua.user_id = u.id
           WHERE u.status = 'active'
             AND (u.profile_visibility IS NULL OR u.profile_visibility IN ('public', 'network', 'lab'))
           ORDER BY u.last_name ASC, u.first_name ASC
           LIMIT 300`
        )
      : await pool.query(
          `SELECT u.id, u.first_name, u.last_name, u.username, u.role, u.avatar_url,
            u.department, u.specialization, u.bio, u.current_position, u.current_institution,
            u.location, u.expertise, u.research_interests, u.timezone, u.profile_visibility, u.updated_at, u.last_login
           FROM users u
           WHERE u.status = 'active'
             AND (u.profile_visibility IS NULL OR u.profile_visibility IN ('public', 'network', 'lab'))
           ORDER BY u.last_name ASC, u.first_name ASC
           LIMIT 300`
        );

    const relationshipMaps = currentUserId
      ? await loadRelationshipMaps(currentUserId)
      : null;
    const labRelationshipMaps = currentUserId
      ? await loadLabRelationshipMaps(currentUserId)
      : null;

    const labs = labsResult.rows.map((lab: any) => {
      const loc = parseLocation(lab.address);
      const areas = parseJsonList(lab.research_areas);
      const lookingFor = parseJsonList(lab.looking_for);
      const field =
        areas[0] ||
        (lab.department && lab.department !== 'General' ? lab.department : '');
      const piName = [lab.pi_first_name, lab.pi_last_name].filter(Boolean).join(' ').trim();
      const membership = labRelationshipMaps?.membershipByLab.get(lab.id);
      const pendingJoinId = labRelationshipMaps?.pendingJoinByLab.get(lab.id) || null;
      const membershipStatus = membership
        ? 'member'
        : pendingJoinId
          ? 'pending'
          : 'none';
      const labTags = uniqueSorted([
        ...areas,
        ...(field ? [field] : []),
        lab.department || '',
      ].filter(Boolean) as string[]);
      const matchScore = softMatchScore(viewerInterests, labTags);
      return {
        id: lab.id,
        name: lab.name,
        institution: lab.institution || '',
        department: lab.department || '',
        description: lab.description || '',
        tagline: lab.showcase_tagline || '',
        website: lab.website_url || '',
        location: loc.display,
        city: loc.city,
        country: loc.country,
        fieldOfResearch: field,
        researchAreas: areas.length
          ? areas
          : field
            ? [field]
            : [],
        lookingFor,
        lookingForLabels: lookingFor.map(
          (id) => LOOKING_FOR_OPTIONS.find((o) => o.id === id)?.label || id
        ),
        memberCount: Number(lab.member_count) || 0,
        foundedYear: lab.established_year || (lab.created_at ? new Date(lab.created_at).getFullYear() : null),
        hasWebsite: Boolean(lab.website_url),
        labType: lab.lab_type || '',
        postedByName: piName,
        principalResearcherId: lab.principal_researcher_id || null,
        showcasedAt: lab.showcased_at,
        isMember: membershipStatus === 'member',
        isFollowing: labRelationshipMaps
          ? labRelationshipMaps.followingLabIds.has(lab.id)
          : false,
        membershipStatus,
        membershipRole: membership?.role || null,
        joinRequestId: pendingJoinId,
        canLeave: Boolean(
          membership &&
            membership.role !== 'principal_researcher' &&
            lab.principal_researcher_id !== currentUserId
        ),
        isOwnLab: Boolean(
          membership && ['principal_researcher', 'admin'].includes(membership.role)
        ),
        matchScore,
        matchReasons: buildInterestMatchReasons(viewerInterests, labTags),
      };
    });

    const researchers = researchersResult.rows
      .filter((row: any) => row.id !== currentUserId)
      .map((row: any) => {
        const loc = parseLocation(row.location);
        const interestTags = parseInterestList(row.research_interests);
        const expertiseTags = parseList(row.expertise);
        const fields = uniqueSorted([
          row.specialization,
          row.department,
          ...expertiseTags,
          ...interestTags,
        ].filter(Boolean) as string[]);
        const openToCollaborate =
          row.open_for_collaboration == null ? true : Boolean(Number(row.open_for_collaboration));
        const currentlyAvailable =
          row.currently_available == null ? true : Boolean(Number(row.currently_available));
        const completeness = profileCompleteness(row);
        const updatedAt = row.updated_at || row.last_login;
        const daysSinceActive = updatedAt
          ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        const matchScore = softMatchScore(viewerInterests, fields);
        return {
          id: row.id,
          firstName: row.first_name || '',
          lastName: row.last_name || '',
          username: row.username || '',
          position: row.current_position || row.role || '',
          institution: row.current_institution || '',
          location: loc.display,
          city: loc.city,
          country: loc.country,
          fieldsOfResearch: fields,
          fieldOfResearch: fields[0] || '',
          researchInterests: interestTags.length ? interestTags : fields,
          bio: row.bio || '',
          profilePicture: row.avatar_url || undefined,
          careerStage: inferCareerStage(row.role, row.current_position),
          openToCollaborate,
          currentlyAvailable,
          availableAsConsultant: Boolean(Number(row.available_as_consultant)),
          availableForWorkshops: Boolean(Number(row.available_for_workshops)),
          travelWillingness: row.travel_willingness || '',
          availabilityNotes: row.availability_notes || '',
          profileCompleteness: completeness,
          recentlyActive: daysSinceActive <= 30,
          timezone: row.timezone || '',
          hasRemoteSignal: Boolean(row.timezone),
          isFollowing: relationshipMaps ? relationshipMaps.followingIds.has(row.id) : false,
          isConnected: relationshipMaps
            ? Boolean(relationshipMaps.connectionByUser.get(row.id)?.isConnected)
            : false,
          connectionStatus: relationshipMaps
            ? relationshipMaps.connectionByUser.get(row.id)?.status || 'none'
            : 'none',
          connectionDirection: relationshipMaps
            ? relationshipMaps.connectionByUser.get(row.id)?.direction || null
            : null,
          connectionId: relationshipMaps
            ? relationshipMaps.connectionByUser.get(row.id)?.connectionId || null
            : null,
          matchScore,
          matchReasons: buildInterestMatchReasons(viewerInterests, fields),
        };
      });

    // Soft-rank by interest overlap, then completeness / name
    labs.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
    researchers.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if (b.profileCompleteness !== a.profileCompleteness) {
        return b.profileCompleteness - a.profileCompleteness;
      }
      return `${a.lastName}${a.firstName}`.localeCompare(
        `${b.lastName}${b.firstName}`,
        undefined,
        { sensitivity: 'base' }
      );
    });

    const filterOptions = {
      countries: uniqueSorted([
        ...labs.map((l) => l.country),
        ...researchers.map((r) => r.country),
      ]),
      cities: uniqueSorted([...labs.map((l) => l.city), ...researchers.map((r) => r.city)]),
      fields: uniqueSorted([
        ...labs.flatMap((l) => l.researchAreas),
        ...researchers.flatMap((r) => r.fieldsOfResearch),
      ]),
      institutions: uniqueSorted([
        ...labs.map((l) => l.institution),
        ...researchers.map((r) => r.institution),
      ]),
      careerStages: uniqueSorted(researchers.map((r) => r.careerStage)),
      lookingFor: LOOKING_FOR_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
    };

    res.json({
      labs,
      researchers,
      myLabs,
      filterOptions,
      viewerHasInterests: viewerInterests.length > 0,
    });
  } catch (error: any) {
    console.error('Error loading networking directory:', error);
    res.status(500).json({ error: error.message || 'Failed to load networking directory' });
  }
});

export default router;
