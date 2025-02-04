/*
Apache License

Copyright 2023 Github.com/Barqawiz/IntelliNode

   Licensed under the Apache License, Version 2.0 (the "License");
*/
const config = require('../../utils/Config2').getInstance();

class ChatGPTMessage {
  constructor(content, role, name = null) {
    this.content = content;
    this.role = role;
    this.name = name;
  }

  isSystemRole() {
    return this.role === "system";
  }
}

class ChatModelInput {
    getChatInput() {return null}
}

class ChatGPTInput extends ChatModelInput {
  constructor(systemMessage, options = {}) {
    super();
    if (systemMessage instanceof ChatGPTMessage && systemMessage.isSystemRole()) {
      this.messages = [systemMessage];
    } else if (typeof systemMessage === "string") {
      this.messages = [new ChatGPTMessage(systemMessage, "system")];
    } else {
      throw new Error(
        "The input type should be system to define the chatbot theme or instructions."
      );
    }
    this.model = options.model || "gpt-3.5-turbo";
    this.temperature = options.temperature || 1;
    this.maxTokens = options.maxTokens || null;
    this.numberOfOutputs = 1;
  }

  addMessage(message) {
    this.messages.push(message);
  }

  addUserMessage(prompt) {
    this.messages.push(new ChatGPTMessage(prompt, "user"));
  }

  addAssistantMessage(prompt) {
    this.messages.push(new ChatGPTMessage(prompt, "assistant"));
  }

  addSystemMessage(prompt) {
    this.messages.push(new ChatGPTMessage(prompt, "system"));
  }

  cleanMessages() {
    if (this.messages.length > 1) {
      const firstMessage = this.messages[0];
      this.messages = [firstMessage];
    }
  }

  deleteLastMessage(message) {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const currentMessage = this.messages[i];
      if (
        currentMessage.content === message.content &&
        currentMessage.role === message.role
      ) {
        this.messages.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  getChatInput() {
    const messages = this.messages.map((message) => {
    if (message.name) {
      return {
        role: message.role,
        name: message.name,
        content: message.content,
      };
    } else {
      return {
        role: message.role,
        content: message.content,
      };
    }});

    const params = {
      model: this.model,
      messages: messages,
      ...this.temperature && { temperature: this.temperature },
      ...this.numberOfOutputs && { n: this.numberOfOutputs },
      ...this.maxTokens && { max_tokens: this.maxTokens },
    };

    return params;
  }
}

class ChatLLamaInput extends ChatModelInput {
  constructor(systemMessage, options = {}) {
    super();
    if (systemMessage instanceof ChatGPTMessage && systemMessage.isSystemRole()) {
      this.system_prompt = systemMessage.content;
    } else if (typeof systemMessage === "string") {
      this.system_prompt = systemMessage;
    } else {
      throw new Error(
        "The input type should be system to define the bot theme or instructions."
      );
    }

    if (!options.model) {
        console.log("warning: send the model name or use the tuned llama inputs (LLamaReplicateInput, LLamaAWSInput)");
    }

    this.model = options.model || "";
    this.version = options.version || "";
    this.temperature = options.temperature || 0.5;
    this.max_new_tokens = options.maxTokens || 500;
    this.top_p = options.top_p || 1;
    this.prompt = options.prompt || "";
    this.repetition_penalty = options.repetition_penalty || 1;
    this.debug = options.debug || false;
  }

  addUserMessage(prompt) {
    if (this.prompt) {
        this.prompt += `\nUser: ${prompt}`;
    } else {
        this.prompt = `User: ${prompt}`;
    }
  }

  addAssistantMessage(prompt) {
    if (this.prompt) {
        this.prompt += `\nAssistant: ${prompt}`;
    } else {
        this.prompt = `Assistant: ${prompt}`;
    }
  }

  cleanMessages() {
    this.prompt = "";
  }

  getChatInput() {
    return {
      model: this.model,
      inputData: {
          input: {
            prompt: this.prompt,
            system_prompt: this.system_prompt,
            max_new_tokens: this.max_new_tokens,
            temperature: this.temperature,
            top_p: this.top_p,
            repetition_penalty: this.repetition_penalty,
            debug: this.debug
          }
      }
    };
  }
}

class LLamaReplicateInput extends ChatLLamaInput {
  constructor(systemMessage, options = {}) {
    options.model = options.model || config.getProperty('models.replicate.llama.13b');
    options.version = options.version;
    super(systemMessage, options);
  }

  getChatInput() {

    if (this.version == null || this.version == "") {
        this.version = config.getProperty(`models.replicate.llama.${this.model}-version`);
    }

    return {
      model: this.model,
      inputData: {
          version: this.version,
          input: {
            prompt: this.prompt,
            system_prompt: this.system_prompt,
            max_new_tokens: this.max_new_tokens,
            temperature: this.temperature,
            top_p: this.top_p,
            repetition_penalty: this.repetition_penalty,
            debug: this.debug
          }
      }
    };
  }
}

class LLamaSageInput extends ChatModelInput {

  constructor(systemMessage, parameters = {}) {
    super();
    if (systemMessage instanceof ChatGPTMessage && systemMessage.isSystemRole()) {
      this.messages = [systemMessage];
    } else if (typeof systemMessage === "string") {
      this.messages = [new ChatGPTMessage(systemMessage, "system")];
    } else {
      throw new Error(
        "The input type should be system to define the chatbot theme or instructions."
      );
    }

    this.parameters = parameters;
  }

  addMessage(message) {
    this.messages.push(message);
  }

  addUserMessage(prompt) {
    this.messages.push(new ChatGPTMessage(prompt, "user"));
  }

  addAssistantMessage(prompt) {
    this.messages.push(new ChatGPTMessage(prompt, "assistant"));
  }

  addSystemMessage(prompt) {
    this.messages.push(new ChatGPTMessage(prompt, "system"));
  }

  cleanMessages() {
    if (this.messages.length > 1) {
      const firstMessage = this.messages[0];
      this.messages = [firstMessage];
    }
  }

  deleteLastMessage(message) {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const currentMessage = this.messages[i];
      if (
        currentMessage.content === message.content &&
        currentMessage.role === message.role
      ) {
        this.messages.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  getChatInput() {
      return {
        parameters: this.parameters,
        inputs: [
          this.messages.map(msg => ({ role: msg.role, content: msg.content }))
        ]
      };
  }
}

module.exports = {
  ChatGPTInput,
  ChatModelInput,
  ChatGPTMessage,
  ChatLLamaInput,
  LLamaSageInput,
  LLamaReplicateInput,

};