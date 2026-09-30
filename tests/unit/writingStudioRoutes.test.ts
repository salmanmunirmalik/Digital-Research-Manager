import {
  parseStudioPath,
  studioPath,
  studioManuscriptPath,
  studioComposePath,
  studioToolPath,
  studioNewPath,
  legacyStudioSearchToLocation,
  STUDIO_ROOT,
  isWritingStudioEditorPath,
} from '../../utils/writingStudioRoutes';

describe('writingStudioRoutes', () => {
  it('parses desk, new, compose, manuscript, tools', () => {
    expect(parseStudioPath(STUDIO_ROOT)).toEqual({ view: 'desk' });
    expect(parseStudioPath(`${STUDIO_ROOT}/new`)).toEqual({ view: 'new' });
    expect(parseStudioPath(`${STUDIO_ROOT}/new/grant`)).toEqual({
      view: 'new',
      docType: 'grant',
    });
    expect(parseStudioPath(`${STUDIO_ROOT}/compose/paper_imrad_journal/s/methods`)).toEqual({
      view: 'compose',
      templateId: 'paper_imrad_journal',
      sectionId: 'methods',
    });
    expect(
      parseStudioPath(`${STUDIO_ROOT}/m/abc-123/s/introduction/view`)
    ).toEqual({
      view: 'manuscript',
      docId: 'abc-123',
      sectionId: 'introduction',
      panel: 'view',
    });
    expect(parseStudioPath(`${STUDIO_ROOT}/tools/generate`)).toEqual({
      view: 'tool',
      toolId: 'generate',
    });
  });

  it('round-trips builders', () => {
    expect(studioNewPath('grant')).toBe(`${STUDIO_ROOT}/new/grant`);
    expect(studioComposePath('t1', 'abstract', 'guide')).toBe(
      `${STUDIO_ROOT}/compose/t1/s/abstract/guide`
    );
    expect(studioManuscriptPath('d1', 'results')).toBe(`${STUDIO_ROOT}/m/d1/s/results`);
    expect(studioToolPath('library')).toBe(`${STUDIO_ROOT}/tools/library`);
    expect(studioPath({ view: 'desk' })).toBe(STUDIO_ROOT);
  });

  it('migrates legacy query links', () => {
    expect(legacyStudioSearchToLocation(STUDIO_ROOT, '?doc=x1&section=methods')).toEqual({
      pathname: `${STUDIO_ROOT}/m/x1/s/methods`,
      search: '',
    });
    expect(legacyStudioSearchToLocation(STUDIO_ROOT, '?flow=library&invite=tok')).toEqual({
      pathname: `${STUDIO_ROOT}/tools/library`,
      search: '?invite=tok',
    });
    expect(legacyStudioSearchToLocation(STUDIO_ROOT, '?type=grant&grantId=g1')).toEqual({
      pathname: `${STUDIO_ROOT}/new/grant`,
      search: '?grantId=g1',
    });
  });

  it('detects immersive editor paths', () => {
    expect(isWritingStudioEditorPath('/writing-studio')).toBe(false);
    expect(isWritingStudioEditorPath('/writing-studio/new')).toBe(false);
    expect(isWritingStudioEditorPath('/writing-studio/new/grant')).toBe(false);
    expect(isWritingStudioEditorPath('/writing-studio/tools/generate')).toBe(false);
    expect(isWritingStudioEditorPath('/writing-studio/compose/paper_imrad_journal')).toBe(true);
    expect(isWritingStudioEditorPath('/writing-studio/compose/t1/s/methods')).toBe(true);
    expect(isWritingStudioEditorPath('/writing-studio/m/abc/s/intro/view')).toBe(true);
  });
});
