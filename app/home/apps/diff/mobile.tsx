import { GitDiffViewer } from './GitDiffViewer';
import { DiffAppProps } from '../BaseApp';

export const DiffMobile = ({ workspaceId }: DiffAppProps) => {
  return (
    <div className="absolute inset-0">
      <GitDiffViewer workspaceId={workspaceId} />
    </div>
  );
};