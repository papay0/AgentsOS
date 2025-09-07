import { GitDiffViewer } from './GitDiffViewer';
import { DiffAppProps } from '../BaseApp';

export const DiffDesktop = ({ workspaceId }: DiffAppProps) => {
  return <GitDiffViewer workspaceId={workspaceId} />;
};