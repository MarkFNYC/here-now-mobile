export function parseJsonSafe<T = any>(value: string | null | undefined): T | null {
  if (!value) return null;

  const tryParse = (input: string) => {
    try {
      return JSON.parse(input);
    } catch (error) {
      return null;
    }
  };

  if (typeof value !== 'string') return null;

  let parsed = tryParse(value.trim());
  if (parsed) return parsed;

  if (value.startsWith('"') && value.endsWith('"')) {
    const unwrapped = value.slice(1, -1).replace(/\\"/g, '"');
    parsed = tryParse(unwrapped);
    if (parsed) return parsed;
  }

  return null;
}

