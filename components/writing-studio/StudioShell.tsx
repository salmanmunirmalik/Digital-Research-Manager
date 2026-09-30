/**
 * Writing Studio visual shell — DRM slate + teal theme wrapper.
 */

import React from 'react';
import '../../styles/writingStudio.css';

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Nested inside an overlay — no full-page wash */
  nested?: boolean;
  /** Full-viewport immersive editor (no app chrome) */
  immersive?: boolean;
};

const StudioShell: React.FC<Props> = ({
  children,
  className = '',
  nested = false,
  immersive = false,
}) => {
  return (
    <div
      className={`ws-studio ${nested ? 'ws-studio-nested' : ''} ${
        immersive ? 'ws-immersive' : ''
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default StudioShell;
