import React, { useMemo, useState } from 'react';
import type {
  FloorCompletion,
  FloorScenario,
  PathStep,
  RoleId,
  SkillVerdict,
} from '../../utils/labFloors/types';
import { getScene } from '../../utils/labFloors/registry';
import { mergeSkillVerdicts, saveFloorCompletion } from '../../utils/labFloors/progress';
import DebriefCard from './DebriefCard';

type Props = {
  floor: FloorScenario;
  role: RoleId;
  onExit: () => void;
  onComplete: () => void;
  extraDebriefCta?: React.ReactNode;
};

const ScenarioPlayer: React.FC<Props> = ({
  floor,
  role,
  onExit,
  onComplete,
  extraDebriefCta,
}) => {
  const [sceneId, setSceneId] = useState(floor.startSceneId);
  const [path, setPath] = useState<PathStep[]>([]);
  const [skills, setSkills] = useState<Record<string, SkillVerdict>>({});
  const [pendingConsequence, setPendingConsequence] = useState<{
    text: string;
    nextSceneId: string | null;
    choiceId: string;
  } | null>(null);
  const [done, setDone] = useState(false);
  const [completion, setCompletion] = useState<FloorCompletion | null>(null);

  const scene = useMemo(() => getScene(floor, sceneId), [floor, sceneId]);
  const stepIndex = path.length + (pendingConsequence ? 1 : 0);
  const approxTotal = Math.max(floor.scenes.length, 6);

  const finish = (
    nextPath: PathStep[],
    nextSkills: Record<string, SkillVerdict>
  ) => {
    const progress = saveFloorCompletion(floor.id, role, nextPath, nextSkills);
    setCompletion(progress.completions[floor.id]);
    setDone(true);
    onComplete();
  };

  const choose = (choiceId: string) => {
    if (!scene || pendingConsequence) return;
    const choice = scene.choices.find((c) => c.id === choiceId);
    if (!choice) return;
    const nextSkills = mergeSkillVerdicts(skills, choice.skillDeltas || {});
    setSkills(nextSkills);
    const step = { sceneId: scene.id, choiceId };
    const nextPath = [...path, step];
    setPath(nextPath);

    if (choice.consequence) {
      setPendingConsequence({
        text: choice.consequence,
        nextSceneId: choice.nextSceneId,
        choiceId,
      });
      return;
    }

    if (!choice.nextSceneId) {
      finish(nextPath, nextSkills);
      return;
    }
    setSceneId(choice.nextSceneId);
  };

  const continueAfterConsequence = () => {
    if (!pendingConsequence) return;
    const { nextSceneId } = pendingConsequence;
    setPendingConsequence(null);
    if (!nextSceneId) {
      finish(path, skills);
      return;
    }
    setSceneId(nextSceneId);
  };

  if (done && completion) {
    return (
      <DebriefCard
        floor={floor}
        completion={completion}
        onAgain={() => {
          setSceneId(floor.startSceneId);
          setPath([]);
          setSkills({});
          setPendingConsequence(null);
          setDone(false);
          setCompletion(null);
        }}
        onHub={onExit}
        extraCta={extraDebriefCta}
      />
    );
  }

  if (!scene) {
    return (
      <div className="lf-panel">
        <p className="text-sm text-slate-600">Scene missing. Return to hub.</p>
        <button type="button" className="lf-btn lf-btn-ghost" onClick={onExit}>
          Back
        </button>
      </div>
    );
  }

  const flavor = scene.roleFlavor?.[role];

  return (
    <div className="lf-player">
      <div className="lf-player-top">
        <button type="button" className="lf-link" onClick={onExit}>
          ← Floors
        </button>
        <p className="lf-progress-label">
          {floor.title} · beat {Math.min(stepIndex + 1, approxTotal)}
        </p>
      </div>

      <div className="lf-progress-bar" aria-hidden>
        <span
          style={{
            width: `${Math.min(100, ((stepIndex + 1) / approxTotal) * 100)}%`,
          }}
        />
      </div>

      <article className="lf-scene">
        {scene.title ? <p className="lf-kicker">{scene.title}</p> : null}
        <p className="lf-narration">{scene.narration}</p>
        {flavor ? <p className="lf-flavor">{flavor}</p> : null}

        {pendingConsequence ? (
          <div className="lf-consequence">
            <p className="lf-kicker">What follows</p>
            <p>{pendingConsequence.text}</p>
            <button
              type="button"
              className="lf-btn lf-btn-primary mt-3"
              onClick={continueAfterConsequence}
            >
              Continue
            </button>
          </div>
        ) : (
          <ul className="lf-choices">
            {scene.choices.map((c) => (
              <li key={c.id}>
                <button type="button" className="lf-choice" onClick={() => choose(c.id)}>
                  {c.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
};

export default ScenarioPlayer;
