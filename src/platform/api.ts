import { PLATFORM_API_URL } from './config';

// Define the shape of the data the Python backend expects
export interface ProvisionRequest {
  workspace_name: string;
  template: string;
  ttl: string;
}

export async function provisionWorkspace(data: ProvisionRequest) {
  const response = await fetch(`${PLATFORM_API_URL}/provision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data), 
  });
  
  if (!response.ok) {
    throw new Error('Failed to provision workspace');
  }
  return response.json();
}