import React from 'react';
import type { FloorCompletion, FloorScenario, SkillVerdict } from '../../utils/labFloors/types';

const VERDICT_STYLE: Record<SkillVerdict, string> = {
  good: 'lf-skill is-good',
  ok: 'lf-skill is-ok',
  miss: 'lf-skill is-miss',
};

const VERDICT_LABEL: Record<SkillVerdict, string> = {
  good: 'Strong',
  ok: 'Mixed',
  miss: 'Practice',
};

type Props = {
  floor: FloorScenario;
  completion: FloorCompletion;
  onAgain: () => void;
  onHub: () => void;
  extraCta?: React.ReactNode;
};

const DebriefCard: React.FC<Props> = ({ floor, completion, onAgain, onHub, extraCta }) => {
  const skills = floor.skills.map((id) => ({
    id,
    label: floor.debrief.skillLabels[id] || id,
    verdict: completion.skillResults[id] || ('ok' as SkillVerdict),
  }));

  return (
    <div className="lf-debrief">
      <p className="lf-kicker">Debrief · {floor.title}</p>
      <h2 className="lf-debrief-title">What to carry into a real lab</h2>
      <p className="lf-debrief-summary">{floor.debrief.summary}</p>

      <div className="lf-skill-row">
        {skills.map((s) => (
          <span key={s.id} className={VERDICT_STYLE[s.verdict]} title={VERDICT_LABEL[s.verdict]}>
            <span className="lf-skill-dot" aria-hidden />
            {s.label}
            <span className="lf-skill-tag">{VERDICT_LABEL[s.verdict]}</span>
          </span>
        ))}
      </div>

      <ol className="lf-tips">
        {floor.debrief.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ol>

      <div className="lf-debrief-actions">
        <button type="button" className="lf-btn lf-btn-primary" onClick={onAgain}>
          Replay this floor
        </button>
        <button type="button" className="lf-btn lf-btn-ghost" onClick={onHub}>
          Back to floors
        </button>
        {extraCta}
      </div>
    </div>
  );
};

export default DebriefCard;
