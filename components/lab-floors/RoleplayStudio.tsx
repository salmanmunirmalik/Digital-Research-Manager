import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '../../utils/apiBase';
import type { RoleplayChatMessage, RoleplayModule } from '../../utils/labFloors/roleplayTypes';
import {
  completeBeatAndAdvance,
  isRoleplayComplete,
  loadRoleplayRun,
  markBeatTurn,
  startRoleplayRun,
} from '../../utils/labFloors/roleplayProgress';
import { getRoleplayBeat, getRoleplayCharacter } from '../../utils/labFloors/roleplayRegistry';

type Props = {
  module: RoleplayModule;
  onExit: () => void;
  onComplete: () => void;
};

const RoleplayStudio: React.FC<Props> = ({ module, onExit, onComplete }) => {
  const [run, setRun] = useState(() => loadRoleplayRun(module.id) || startRoleplayRun(module));
  const beat = useMemo(
    () => getRoleplayBeat(module, run.currentBeatId) || module.beats[0],
    [module, run.currentBeatId]
  );
  const [activeCharacterId, setActiveCharacterId] = useState(beat.primaryCharacterId);
  const [messages, setMessages] = useState<RoleplayChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestAdvance, setSuggestAdvance] = useState(false);
  const [coachWhisper, setCoachWhisper] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDebrief, setShowDebrief] = useState(() => isRoleplayComplete(module, run));
  const [aiReflection, setAiReflection] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const seededBeatRef = useRef<string | null>(null);

  const activeCharacter = getRoleplayCharacter(module, activeCharacterId);
  const turnCount = run.beatProgress[beat.id]?.turnCount || 0;
  const beatIndex = module.beats.findIndex((b) => b.id === beat.id);
  const isLastBeat = beatIndex === module.beats.length - 1;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Seed opening lines when entering a beat
  useEffect(() => {
    if (seededBeatRef.current === beat.id) return;
    seededBeatRef.current = beat.id;
    setActiveCharacterId(beat.primaryCharacterId);
    setSuggestAdvance(false);
    setCoachWhisper(beat.coachingHint);
    setError(null);
    const openerChar = getRoleplayCharacter(module, beat.openingLine.characterId);
    setMessages([
      {
        id: `n-${beat.id}`,
        role: 'narrator',
        content: beat.openingNarration,
      },
      {
        id: `c-${beat.id}-open`,
        role: 'character',
        characterId: beat.openingLine.characterId,
        content: beat.openingLine.text,
      },
    ]);
    if (openerChar) setActiveCharacterId(openerChar.id);
  }, [beat, module]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !activeCharacter) return;

    const userMsg: RoleplayChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    const nextRun = markBeatTurn(run, beat.id);
    setRun(nextRun);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
        characterId: m.characterId,
      }));

      const response = await axios.post(
        '/api/lab-floors/roleplay',
        {
          moduleId: module.id,
          beatId: beat.id,
          characterId: activeCharacter.id,
          message: text,
          history,
          moduleContext: {
            title: module.title,
            beatTitle: beat.title,
            chapter: beat.chapter,
            setting: beat.setting,
            objective: beat.objective,
            characterName: activeCharacter.name,
            characterTitle: activeCharacter.title,
            characterVoice: activeCharacter.voice,
            turnCount: nextRun.beatProgress[beat.id]?.turnCount || 0,
            minTurns: beat.minTurns,
          },
        },
        { headers: getAuthHeaders() }
      );

      const reply = String(response.data?.reply || '…');
      const stage = response.data?.stageDirection
        ? String(response.data.stageDirection)
        : null;
      const whisper = response.data?.coachWhisper
        ? String(response.data.coachWhisper)
        : null;

      setMessages((prev) => {
        const next = [...prev];
        if (stage) {
          next.push({
            id: `n-${Date.now()}`,
            role: 'narrator',
            content: stage,
          });
        }
        next.push({
          id: `c-${Date.now()}`,
          role: 'character',
          characterId: activeCharacter.id,
          content: reply,
          coachWhisper: whisper || undefined,
        });
        return next;
      });

      if (whisper) setCoachWhisper(whisper);
      if (response.data?.suggestAdvance) setSuggestAdvance(true);
      else if ((nextRun.beatProgress[beat.id]?.turnCount || 0) >= beat.minTurns) {
        setSuggestAdvance(true);
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string }; status?: number }; message?: string };
      const msg =
        ax.response?.data?.error ||
        ax.message ||
        'Could not reach the roleplay AI. Check Settings → API keys.';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'narrator',
          content: `(The scene pauses.) ${msg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const advance = async () => {
    const updated = completeBeatAndAdvance(module, run, beat.id);
    setRun(updated);
    seededBeatRef.current = null;

    if (!updated.completedAt && updated.currentBeatId !== beat.id) {
      setSuggestAdvance(false);
      return;
    }

    setShowDebrief(true);
    onComplete();
    try {
      const res = await axios.post(
        '/api/lab-floors/roleplay/debrief',
        {
          moduleTitle: module.title,
          beatSummaries: module.beats.map((b) => ({
            id: b.id,
            title: b.title,
            chapter: b.chapter,
            done: Boolean(updated.beatProgress[b.id]?.completedAt),
          })),
          skills: Array.from(new Set(module.beats.flatMap((b) => b.skills))),
        },
        { headers: getAuthHeaders() }
      );
      if (res.data?.reflection) setAiReflection(String(res.data.reflection));
    } catch {
      /* authored debrief still shows */
    }
  };

  const restart = () => {
    const fresh = startRoleplayRun(module);
    setRun(fresh);
    seededBeatRef.current = null;
    setShowDebrief(false);
    setAiReflection(null);
    setSuggestAdvance(false);
  };

  if (showDebrief) {
    return (
      <div className="lf-roleplay lf-debrief">
        <p className="lf-kicker">Debrief · {module.title}</p>
        <h2 className="lf-debrief-title">Your PhD start — what to take into the real lab</h2>
        <p className="lf-debrief-summary">{module.debrief.summary}</p>
        {aiReflection ? <p className="lf-roleplay-reflection">{aiReflection}</p> : null}
        <div className="lf-skill-row">
          {Object.entries(module.debrief.skillLabels).map(([id, label]) => (
            <span key={id} className="lf-skill is-good">
              <span className="lf-skill-dot" aria-hidden />
              {label}
            </span>
          ))}
        </div>
        <ol className="lf-tips">
          {module.debrief.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
        <div className="lf-debrief-actions">
          <button type="button" className="lf-btn lf-btn-primary" onClick={restart}>
            Replay starter year
          </button>
          <button type="button" className="lf-btn lf-btn-ghost" onClick={onExit}>
            Back to floors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lf-roleplay">
      <div className="lf-roleplay-top">
        <button type="button" className="lf-link" onClick={onExit}>
          ← Floors
        </button>
        <p className="lf-progress-label">
          {module.title} · {beat.chapter} · scene {beatIndex + 1}/{module.beats.length}
        </p>
      </div>

      <div className="lf-roleplay-layout">
        <aside className="lf-roleplay-plan">
          <p className="lf-kicker">Year plan</p>
          <ol className="lf-roleplay-beats">
            {module.beats.map((b, i) => {
              const done = Boolean(run.beatProgress[b.id]?.completedAt);
              const current = b.id === beat.id;
              return (
                <li
                  key={b.id}
                  className={`lf-roleplay-beat ${current ? 'is-current' : ''} ${done ? 'is-done' : ''}`}
                >
                  <span className="lf-roleplay-beat-ch">{b.chapter}</span>
                  <span className="lf-roleplay-beat-title">{b.title}</span>
                  {done ? <span className="lf-badge">Done</span> : null}
                  {current && !done ? <span className="lf-badge is-muted">Now</span> : null}
                  {!current && !done && i > beatIndex ? (
                    <span className="lf-badge is-muted">Later</span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="lf-roleplay-stage">
          <header className="lf-roleplay-scene-head">
            <p className="lf-kicker">{beat.chapter}</p>
            <h2>{beat.title}</h2>
            <p className="lf-roleplay-setting">{beat.setting}</p>
            <p className="lf-roleplay-objective">
              <strong>Practice:</strong> {beat.objective}
            </p>
          </header>

          <div className="lf-roleplay-cast">
            {beat.availableCharacterIds.map((id) => {
              const c = getRoleplayCharacter(module, id);
              if (!c) return null;
              return (
                <button
                  key={id}
                  type="button"
                  className={`lf-roleplay-cast-chip ${activeCharacterId === id ? 'is-active' : ''}`}
                  onClick={() => setActiveCharacterId(id)}
                  title={c.blurb}
                >
                  <span className="lf-roleplay-cast-name">{c.name}</span>
                  <span className="lf-roleplay-cast-title">{c.title}</span>
                </button>
              );
            })}
          </div>

          <div className="lf-roleplay-thread" aria-live="polite">
            {messages.map((m) => {
              if (m.role === 'narrator') {
                return (
                  <p key={m.id} className="lf-roleplay-narrator">
                    {m.content}
                  </p>
                );
              }
              if (m.role === 'user') {
                return (
                  <div key={m.id} className="lf-roleplay-bubble is-you">
                    <span className="lf-roleplay-who">You</span>
                    <p>{m.content}</p>
                  </div>
                );
              }
              const who = getRoleplayCharacter(module, m.characterId || '');
              return (
                <div key={m.id} className="lf-roleplay-bubble is-npc">
                  <span className="lf-roleplay-who">
                    {who?.name || 'Colleague'}
                    {who ? ` · ${who.title}` : ''}
                  </span>
                  <p>{m.content}</p>
                </div>
              );
            })}
            {loading ? (
              <p className="lf-roleplay-narrator">…{activeCharacter?.name || 'They'} are thinking</p>
            ) : null}
            <div ref={endRef} />
          </div>

          {error ? <p className="lf-roleplay-error">{error}</p> : null}

          <div className="lf-roleplay-compose">
            <label className="sr-only" htmlFor="lf-roleplay-input">
              Your reply
            </label>
            <textarea
              id="lf-roleplay-input"
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={`Reply as yourself to ${activeCharacter?.name || 'your colleague'}…`}
              disabled={loading}
            />
            <div className="lf-roleplay-compose-actions">
              <button
                type="button"
                className="lf-btn lf-btn-primary"
                onClick={() => void send()}
                disabled={loading || !input.trim()}
              >
                Say it
              </button>
              {(suggestAdvance || turnCount >= beat.minTurns) && (
                <button type="button" className="lf-btn lf-btn-ghost" onClick={() => void advance()}>
                  {isLastBeat ? 'Finish year & debrief' : 'Continue to next chapter'}
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="lf-roleplay-coach">
          <p className="lf-kicker">Coach note</p>
          <p>{coachWhisper || beat.coachingHint}</p>
          <p className="lf-roleplay-advance-hint">{beat.advanceHint}</p>
          <p className="lf-stamp-line">
            Talking with {activeCharacter?.name} · {turnCount} reply
            {turnCount === 1 ? '' : 's'} this scene
          </p>
        </aside>
      </div>
    </div>
  );
};

export default RoleplayStudio;
