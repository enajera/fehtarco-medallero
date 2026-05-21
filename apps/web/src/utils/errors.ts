export function formatError(err: any): string {
  if (!err) return 'Unknown error';
  if (err.response?.data) {
    const data = err.response.data;
    if (typeof data.error === 'string') return data.error;
    if (data.error && typeof data.error === 'object') return data.error.message || JSON.stringify(data.error);
    if (typeof data.message === 'string') return data.message;
    return JSON.stringify(data);
  }
  if (err.message) return err.message;
  try { return JSON.stringify(err); } catch (_e) { return String(err); }
}
