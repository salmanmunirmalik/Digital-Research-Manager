/**
 * Redirect into Writing Studio with an optional tool flow.
 * Slides are not a destination — present redirects land on studio desk with a notice.
 */

import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  studioDeskPath,
  studioToolPath,
  withStudioQuery,
  type StudioToolId,
} from '../utils/writingStudioRoutes';

export type StudioFlow = 'library' | 'generate';

export const RedirectToWritingStudio: React.FC<{ flow?: StudioFlow | 'present' }> = ({
  flow,
}) => {
  const [params] = useSearchParams();
  const keep: { invite?: string; notice?: string; cite?: string; grantId?: string } = {};
  const invite = params.get('invite');
  const cite = params.get('cite');
  const grantId = params.get('grantId');
  if (invite) keep.invite = invite;
  if (cite) keep.cite = cite;
  if (grantId) keep.grantId = grantId;

  if (flow === 'present') {
    keep.notice = 'slides';
    return <Navigate to={withStudioQuery(studioDeskPath(), keep)} replace />;
  }

  if (flow === 'library' || flow === 'generate') {
    return (
      <Navigate
        to={withStudioQuery(studioToolPath(flow as StudioToolId), keep)}
        replace
      />
    );
  }

  return <Navigate to={withStudioQuery(studioDeskPath(), keep)} replace />;
};
