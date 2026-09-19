export function backendConfigured(): boolean {
  return process.env.MED_ASSISTANT_PREVIEW_ONLY !== 'true' && Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}
export function previewEnabled(): boolean {
  return process.env.ENABLE_FICTIONAL_PREVIEW === 'true' ||
    (process.env.NODE_ENV === 'development' && process.env.ENABLE_FICTIONAL_PREVIEW !== 'false');
}
