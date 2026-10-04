import React from 'react';
import type { FloorScenario, LabFloorsProgress, RoleId } from '../../utils/labFloors/types';
import type { RoleplayModule } from '../../utils/labFloors/roleplayTypes';
import { ROLE_OPTIONS } from '../../utils/labFloors/progress';
import {
  AcademicCapIcon,
  BeakerIcon,
  LightBulbIcon,
  UserGroupIcon,
  PuzzleIcon,
} from '../icons';

const ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  'day-one': AcademicCapIcon,
  'idea-studio': LightBulbIcon,
  'bench-plan': BeakerIcon,
  colleagues: UserGroupIcon,
  'skill-sprint': PuzzleIcon,
};

type Props = {
  floors: FloorScenario[];
  progress: LabFloorsProgress;
  role: RoleId;
  onRoleChange: (role: RoleId) => void;
  onStart: (floorId: string) => void;
  roleplayModules?: RoleplayModule[];
  roleplayDoneIds?: string[];
  onStartRoleplay?: (moduleId: string) => void;
};

const FloorsHub: React.FC<Props> = ({
  floors,
  progress,
  role,
  onRoleChange,
  onStart,
  roleplayModules = [],
  roleplayDoneIds = [],
  onStartRoleplay,
}) => {
  const done = Object.keys(progress.completions).length;
  const featured = roleplayModules[0];

  return (
    <div className="lf-hub">
      {featured && onStartRoleplay ? (
        <section className="lf-featured">
          <div>
            <p className="lf-kicker">AI roleplay · you are the PhD student</p>
            <h2>{featured.title}</h2>
            <p>{featured.overview}</p>
            <div className="lf-featured-meta">
              <span className="lf-badge is-muted">~{featured.durationMinutes} min</span>
              <span className="lf-badge is-muted">{featured.beats.length} chapters</span>
              <span className="lf-badge is-muted">{featured.characters.length} AI colleagues</span>
              {roleplayDoneIds.includes(featured.id) ? (
                <span className="lf-badge">Year stamped</span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="lf-btn lf-btn-primary"
            onClick={() => onStartRoleplay(featured.id)}
          >
            {roleplayDoneIds.includes(featured.id) ? 'Re-enter roleplay' : 'Enter PhD Starter Year'}
          </button>
        </section>
      ) : null}

      <section className="lf-role-bar">
        <p className="lf-kicker">Quick floors · choice scenarios</p>
        <p className="lf-role-help">
          Shorter branching cases (no AI). Pick a role lens for framing copy.
        </p>
        <div className="lf-role-chips">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`lf-role-chip ${role === r.id ? 'is-active' : ''}`}
              onClick={() => onRoleChange(r.id)}
            >
              <span className="lf-role-chip-label">{r.label}</span>
              <span className="lf-role-chip-blurb">{r.blurb}</span>
            </button>
          ))}
        </div>
        {done > 0 ? (
          <p className="lf-stamp-line">
            {done} of {floors.length} quick floors stamped
          </p>
        ) : (
          <p className="lf-stamp-line">No quick-floor stamps yet.</p>
        )}
      </section>

      <p className="lf-section-label">Choice floors</p>
      <ul className="lf-floor-grid">
        {floors.map((f) => {
          const Icon = ICONS[f.id] || BeakerIcon;
          const completion = progress.completions[f.id];
          return (
            <li key={f.id} className="lf-floor-card">
              <div className="lf-floor-card-icon">
                <Icon className="h-5 w-5" />
              </div>
              <div className="lf-floor-card-body">
                <div className="lf-floor-card-head">
                  <h3>{f.title}</h3>
                  {completion ? (
                    <span className="lf-badge">Done</span>
                  ) : (
                    <span className="lf-badge is-muted">~{f.durationMinutes} min</span>
                  )}
                </div>
                <p>{f.subtitle}</p>
                <div className="lf-floor-skills">
                  {f.skills.slice(0, 4).map((s) => (
                    <span key={s} className="lf-mini-skill">
                      {f.debrief.skillLabels[s] || s}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="lf-btn lf-btn-primary lf-floor-cta"
                onClick={() => onStart(f.id)}
              >
                {completion ? 'Replay' : 'Enter floor'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default FloorsHub;
