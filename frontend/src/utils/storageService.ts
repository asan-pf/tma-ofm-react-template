const BUCKET_NAME = 'location-images';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function assertConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
}

function buildObjectPath(folder: 'locations' | 'comments', file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ext.replace(/[^a-z0-9]/gi, '') || 'jpg';
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${folder}/${uniqueId}.${safeExt}`;
}

async function uploadImageToBucket(file: File, folder: 'locations' | 'comments'): Promise<string> {
  assertConfig();


  const baseUrl = String(SUPABASE_URL).replace(/\/$/, '');
  const sanitizedBucket = encodeURIComponent(BUCKET_NAME);
  const path = buildObjectPath(folder, file);
  const encodedPath = encodeURIComponent(path)
    .replace(/%2F/gi, '/');
  const uploadUrl = `${baseUrl}/storage/v1/object/${sanitizedBucket}/${encodedPath}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: String(SUPABASE_ANON_KEY),
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: file,
  });

  if (!response.ok) {
    let errorText: string | undefined;
    try {
      const maybeJson = await response.json();
      errorText = typeof maybeJson?.message === 'string'
        ? maybeJson.message
        : JSON.stringify(maybeJson);
    } catch {
      errorText = await response.text().catch(() => '') || undefined;
    }
    throw new Error(errorText || 'Failed to upload image');
  }

  const encodedPublicPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${baseUrl}/storage/v1/object/public/${sanitizedBucket}/${encodedPublicPath}`;
}

export async function uploadLocationImage(file: File) {
  return uploadImageToBucket(file, 'locations');
}

export async function uploadCommentImage(file: File) {
  return uploadImageToBucket(file, 'comments');
}
