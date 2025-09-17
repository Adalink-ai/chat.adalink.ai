// Use first allowed gateway model or fallback to internal model
const getDefaultChatModel = (): string => {
  const allowedModelsEnv = process.env.ALLOWED_MODELS;
  if (allowedModelsEnv && allowedModelsEnv.trim() !== '') {
    const allowedModels = allowedModelsEnv
      .split(',')
      .map((model) => model.trim())
      .filter((model) => model !== '');

    // Return first allowed gateway model
    if (allowedModels.length > 0) {
      return allowedModels[0];
    }
  }

  // Fallback to internal model
  return 'chat-model';
};

export const DEFAULT_CHAT_MODEL: string = getDefaultChatModel();

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Chat model',
    description: 'Primary model for all-purpose chat',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
  },
];
