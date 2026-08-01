import './setup-env';

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { Server } from 'http';
import { app } from '../app';
import { projectStore } from '../lib/project-store';

let server: Server;
let baseUrl = '';

test.before(async () => {
  // Initialize projectStore after process.env overrides
  projectStore.init();

  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  if (typeof address === 'object' && address !== null) {
    baseUrl = `http://localhost:${address.port}`;
  }
});

test.after(async () => {
  // Wait for any pending debounced writes in projectStore (debounce is 100ms)
  await new Promise((resolve) => setTimeout(resolve, 200));

  await new Promise<void>((resolve) => {
    server.close(() => {
      // Clean up project-test folder
      try {
        fs.rmSync(path.resolve('./project-test'), { recursive: true, force: true });
      } catch (err) {
        console.error('Error cleaning up project-test directory:', err);
      }
      resolve();
    });
  });
});

// Helper for making API requests
async function request(method: string, route: string, body?: any, jwtToken?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  const res = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const status = res.status;
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch (err) {
    // not JSON
  }

  return { status, json, text };
}

// ─── Main Integration Suite ──────────────────────────────────────────────────

test('Full API Integration Suite', async (t) => {
  let token = '';
  let projectId = '';
  let sceneId1 = '';
  let sceneId2 = '';
  let hotspotId = '';

  await t.test('1. Authentication Flow - Login with invalid credentials', async () => {
    const { status, json } = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: 'wrongpassword',
    });
    assert.strictEqual(status, 401);
    assert.strictEqual(json?.success, false);
  });

  await t.test('1. Authentication Flow - Login with valid credentials', async () => {
    const { status, json } = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123',
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.ok(json?.data?.token);
    assert.strictEqual(json?.data?.admin?.username, 'admin');
    token = json.data.token;
  });

  await t.test('1. Authentication Flow - Access /me without token', async () => {
    const { status } = await request('GET', '/api/auth/me');
    assert.strictEqual(status, 401);
  });

  await t.test('1. Authentication Flow - Access /me with valid token', async () => {
    const { status, json } = await request('GET', '/api/auth/me', undefined, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.username, 'admin');
  });

  await t.test('2. Project Flow - Get default project details', async () => {
    const { status, json } = await request('GET', '/api/project', undefined, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.name, 'My Virtual Tour');
    assert.strictEqual(json?.data?.slug, 'my-virtual-tour');
    assert.ok(json?.data?.id);
    projectId = json.data.id;
  });

  await t.test('2. Project Flow - Update project details', async () => {
    const { status, json } = await request('PUT', '/api/project', {
      name: 'San Francisco Penthouse',
      companyName: 'Modern Realty',
      description: 'A luxurious modern penthouse tour',
    }, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.name, 'San Francisco Penthouse');
    assert.strictEqual(json?.data?.slug, 'san-francisco-penthouse');
    assert.strictEqual(json?.data?.companyName, 'Modern Realty');
    assert.strictEqual(json?.data?.description, 'A luxurious modern penthouse tour');
  });

  await t.test('3. Branding Flow - Get default branding', async () => {
    const { status, json } = await request('GET', '/api/project/branding', undefined, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.logoPosition, 'top-left');
  });

  await t.test('3. Branding Flow - Update branding', async () => {
    const { status, json } = await request('PUT', '/api/project/branding', {
      primaryColor: '#ff0000',
      logoPosition: 'bottom-right',
      autoRotate: true,
      autoRotateSpeed: 2.5,
    }, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.primaryColor, '#ff0000');
    assert.strictEqual(json?.data?.logoPosition, 'bottom-right');
    assert.strictEqual(json?.data?.autoRotate, true);
    assert.strictEqual(json?.data?.autoRotateSpeed, 2.5);
  });

  await t.test('4. Scenes Flow - Create scene 1', async () => {
    const { status, json } = await request('POST', '/api/project/scenes', {
      title: 'Living Room',
      description: 'The main entrance and living room area',
    }, token);
    assert.strictEqual(status, 201);
    assert.strictEqual(json?.success, true);
    assert.ok(json?.data?.id);
    assert.strictEqual(json?.data?.title, 'Living Room');
    sceneId1 = json.data.id;
  });

  await t.test('4. Scenes Flow - Create scene 2', async () => {
    const { status, json } = await request('POST', '/api/project/scenes', {
      title: 'Master Bedroom',
      description: 'Spacious master bedroom with view',
    }, token);
    assert.strictEqual(status, 201);
    assert.strictEqual(json?.success, true);
    assert.ok(json?.data?.id);
    assert.strictEqual(json?.data?.title, 'Master Bedroom');
    sceneId2 = json.data.id;
  });

  await t.test('4. Scenes Flow - List scenes', async () => {
    const { status, json } = await request('GET', '/api/project/scenes', undefined, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.length, 2);
    assert.strictEqual(json?.data[0]?.title, 'Living Room');
    assert.strictEqual(json?.data[1]?.title, 'Master Bedroom');
  });

  await t.test('4. Scenes Flow - Update scene', async () => {
    const { status, json } = await request('PUT', `/api/scenes/${sceneId1}`, {
      title: 'Grand Living Room',
      description: 'Living room updated description',
    }, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.title, 'Grand Living Room');
  });

  await t.test('4. Scenes Flow - Update default view', async () => {
    const { status, json } = await request('PATCH', `/api/scenes/${sceneId1}/default-view`, {
      defaultYaw: 1.2,
      defaultPitch: -0.5,
      defaultZoom: 65,
    }, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.defaultYaw, 1.2);
    assert.strictEqual(json?.data?.defaultPitch, -0.5);
    assert.strictEqual(json?.data?.defaultZoom, 65);
  });

  await t.test('4. Scenes Flow - Set start scene', async () => {
    const { status, json } = await request('PATCH', `/api/scenes/${sceneId2}/start`, {}, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.isStartScene, true);
  });

  await t.test('4. Scenes Flow - Reorder scenes', async () => {
    const { status, json } = await request('PATCH', '/api/scenes/reorder', {
      scenes: [
        { id: sceneId2, order: 0 },
        { id: sceneId1, order: 1 },
      ]
    }, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
  });

  await t.test('5. Hotspots Flow - Create hotspot', async () => {
    const { status, json } = await request('POST', `/api/scenes/${sceneId1}/hotspots`, {
      label: 'Go to Bedroom',
      yaw: 2.1,
      pitch: -0.2,
      type: 'SCENE_LINK',
      targetSceneId: sceneId2,
    }, token);
    assert.strictEqual(status, 201);
    assert.strictEqual(json?.success, true);
    assert.ok(json?.data?.id);
    assert.strictEqual(json?.data?.label, 'Go to Bedroom');
    assert.strictEqual(json?.data?.targetSceneId, sceneId2);
    hotspotId = json.data.id;
  });

  await t.test('5. Hotspots Flow - List hotspots', async () => {
    const { status, json } = await request('GET', `/api/scenes/${sceneId1}/hotspots`, undefined, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.length, 1);
    assert.strictEqual(json?.data[0]?.id, hotspotId);
  });

  await t.test('5. Hotspots Flow - Update hotspot', async () => {
    const { status, json } = await request('PUT', `/api/hotspots/${hotspotId}`, {
      label: 'Walk to Bedroom',
      description: 'Enter the master bedroom suite',
    }, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.label, 'Walk to Bedroom');
  });

  await t.test('5. Hotspots Flow - Update hotspot position', async () => {
    const { status, json } = await request('PATCH', `/api/hotspots/${hotspotId}/position`, {
      yaw: 2.5,
      pitch: -0.1,
    }, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.yaw, 2.5);
    assert.strictEqual(json?.data?.pitch, -0.1);
  });

  await t.test('6. Guided Tour Flow - Update steps', async () => {
    const { status, json } = await request('PUT', '/api/project/guided-tour', {
      steps: [
        {
          sceneId: sceneId2,
          order: 0,
          duration: 15,
          narrationTitle: 'Introduction',
          narrationText: 'Welcome to the Master Bedroom tour.',
          targetYaw: 0.0,
          targetPitch: 0.0,
          targetZoom: 50,
        },
        {
          sceneId: sceneId1,
          order: 1,
          duration: 10,
          narrationTitle: 'Living Area',
          narrationText: 'This is the main spacious living space.',
          targetYaw: 1.5,
          targetPitch: -0.2,
          targetZoom: 60,
        }
      ]
    }, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.length, 2);
    assert.strictEqual(json?.data[0]?.sceneId, sceneId2);
    assert.strictEqual(json?.data[1]?.sceneId, sceneId1);
  });

  await t.test('6. Guided Tour Flow - Get steps', async () => {
    const { status, json } = await request('GET', '/api/project/guided-tour', undefined, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.length, 2);
    assert.strictEqual(json?.data[0]?.narrationTitle, 'Introduction');
  });

  await t.test('7. Leads Flow - Submit lead', async () => {
    const { status, json } = await request('POST', '/api/leads', {
      projectId,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      message: 'I am interested in buying this property.',
      source: 'contact_form_hotspot',
    });
    assert.strictEqual(status, 201);
    assert.strictEqual(json?.success, true);
    assert.ok(json?.data?.id);
    assert.strictEqual(json?.data?.name, 'John Doe');
  });

  await t.test('7. Leads Flow - List leads', async () => {
    const { status, json } = await request('GET', '/api/leads', undefined, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.length, 1);
    assert.strictEqual(json?.data[0]?.name, 'John Doe');
  });

  await t.test('8. Viewer Tour Flow - Get public tour by correct slug', async () => {
    const { status, json } = await request('GET', `/api/viewer/san-francisco-penthouse`);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.project?.name, 'San Francisco Penthouse');
    assert.strictEqual(json?.data?.branding?.primaryColor, '#ff0000');
    assert.strictEqual(json?.data?.scenes?.length, 2);
    assert.strictEqual(json?.data?.guidedTour?.length, 2);
  });

  await t.test('8. Viewer Tour Flow - Get public tour by incorrect slug returns 404', async () => {
    const { status } = await request('GET', '/api/viewer/non-existent-slug');
    assert.strictEqual(status, 404);
  });

  await t.test('9. Cleanup - Delete hotspot', async () => {
    const { status } = await request('DELETE', `/api/hotspots/${hotspotId}`, undefined, token);
    assert.strictEqual(status, 204);
  });

  await t.test('9. Cleanup - Confirm hotspot deletion', async () => {
    const { status, json } = await request('GET', `/api/scenes/${sceneId1}/hotspots`, undefined, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.length, 0);
  });

  await t.test('9. Cleanup - Delete scene', async () => {
    const { status } = await request('DELETE', `/api/scenes/${sceneId2}`, undefined, token);
    assert.strictEqual(status, 204);
  });

  await t.test('9. Cleanup - Confirm scene deletion (soft delete)', async () => {
    const { status, json } = await request('GET', '/api/project/scenes', undefined, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(json?.success, true);
    assert.strictEqual(json?.data?.length, 1);
    assert.strictEqual(json?.data[0]?.id, sceneId1);
  });
});
