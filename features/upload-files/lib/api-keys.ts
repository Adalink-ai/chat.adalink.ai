
/**
 * Mapeia providers para suas respectivas variáveis de ambiente de API key
 */
const PROVIDER_API_KEY_MAP: Record<string, string> = {
  zai: 'ZAI_API_KEY',
  xai: 'XI_API_KEY',
  openai: 'OPENAI_API_KEY',
} as const;

/**
 * Obtém a API key correspondente ao provider
 * @param provider - Nome do provider (zai, xai, openai)
 * @returns API key se encontrada, undefined caso contrário
 */
export function getApiKeyForProvider(provider: string): string | undefined {
  if (!provider) {
    return undefined;
  }

  const normalizedProvider = provider.toLowerCase().trim();
  const envKeyName = PROVIDER_API_KEY_MAP[normalizedProvider];

  if (!envKeyName) {
    console.warn(`[API KEYS] Provider não suportado: ${provider}`);
    return undefined;
  }

  const apiKey = process.env[envKeyName];

  if (!apiKey) {
    console.warn(`[API KEYS] API key não encontrada para provider ${provider} (${envKeyName})`);
    return undefined;
  }

  return apiKey;
}

