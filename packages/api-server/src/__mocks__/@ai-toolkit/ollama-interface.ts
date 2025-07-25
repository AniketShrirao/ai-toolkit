export class OllamaService {
  async connect() {
    // Mock connection
    return true;
  }

  async generateText(prompt: string, options?: any) {
    // Mock text generation
    return `Mock response for: ${prompt.substring(0, 50)}...`;
  }

  async isAvailable() {
    return true;
  }

  async listModels() {
    return ["llama2", "codellama"];
  }
}
