/**
 * Example: How to access workspace tokens from Firebase
 * 
 * Tokens are now saved at: users/{userId}/agentsOS/workspace/repositories[].tokens
 */

import { UserServiceAdmin } from './user-service-admin';

/**
 * Get tokens for a specific workspace and port
 */
export async function getWorkspaceTokens(userId: string, sandboxId: string, port: number) {
  const userService = UserServiceAdmin.getInstance();
  
  // Get the user's workspace data from Firebase
  const workspace = await userService.getUserWorkspace(userId);
  
  if (!workspace) {
    throw new Error('No workspace found for user');
  }
  
  // Check if this is the right workspace
  if (workspace.sandboxId !== sandboxId) {
    throw new Error('Workspace ID mismatch');
  }
  
  // Find the repository with the matching port
  const repository = workspace.repositories.find(repo => 
    repo.ports.terminal === port || 
    repo.ports.vscode === port || 
    repo.ports.claude === port
  );
  
  if (!repository) {
    throw new Error(`No repository found with port ${port}`);
  }
  
  // Get the token for the specific service
  let token: string | null = null;
  if (repository.tokens) {
    if (repository.ports.terminal === port) {
      token = repository.tokens.terminal;
    } else if (repository.ports.vscode === port) {
      token = repository.tokens.vscode;
    } else if (repository.ports.claude === port) {
      token = repository.tokens.claude;
    }
  }
  
  return {
    token,
    serviceUrls: repository.serviceUrls,
    repositoryName: repository.name
  };
}

/**
 * Get all tokens for a workspace
 */
export async function getAllWorkspaceTokens(userId: string, sandboxId: string) {
  const userService = UserServiceAdmin.getInstance();
  
  // Get workspace from Firebase
  const workspace = await userService.getUserWorkspace(userId);
  
  if (!workspace || workspace.sandboxId !== sandboxId) {
    throw new Error('Workspace not found');
  }
  
  // Extract all tokens from all repositories
  const allTokens = workspace.repositories.map(repo => ({
    repository: repo.name,
    ports: repo.ports,
    urls: repo.serviceUrls,
    tokens: repo.tokens || null
  }));
  
  return allTokens;
}

/**
 * Example usage from the WebSocket proxy
 */
export async function proxyUsageExample() {
  // In your proxy, instead of using Daytona SDK:
  const userId = 'user_xxx'; // Get from auth
  const sandboxId = 'sandbox-xxx';
  const port = 7681; // Terminal port
  
  // Get token from Firebase
  const { token } = await getWorkspaceTokens(userId, sandboxId, port);
  
  // Use token in proxy headers
  const headers = {
    'Authorization': `Bearer ${process.env.DAYTONA_API_KEY}`,
    ...(token && { 'x-daytona-preview-token': token })
  };

  console.log('headers', headers);
  
  // Create WebSocket connection with token
  // const ws = new WebSocket(url, { headers });
}

/**
 * Firebase structure after saving:
 * 
 * users/
 *   {userId}/
 *     agentsOS/
 *       workspace/
 *         sandboxId: "sandbox-xxx"
 *         repositories: [
 *           {
 *             name: "my-project"
 *             ports: { vscode: 8080, terminal: 7681, claude: 7682 }
 *             serviceUrls: {
 *               vscode: "https://8080-sandbox-xxx.proxy.daytona.work"
 *               terminal: "https://7681-sandbox-xxx.proxy.daytona.work"
 *               claude: "https://7682-sandbox-xxx.proxy.daytona.work"
 *             }
 *             tokens: {
 *               vscode: "vg5c0ylmcimr8b_xxx"
 *               terminal: "vg5c0ylmcimr8b_yyy"
 *               claude: "vg5c0ylmcimr8b_zzz"
 *             }
 *           }
 *         ]
 */