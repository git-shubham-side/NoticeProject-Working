function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

export function readEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  return stripWrappingQuotes(value.trim());
}
