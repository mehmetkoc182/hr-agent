// ActionProvider starter code
  class ActionProvider {
     /**
       * @param {any} createChatBotMessage
       * @param {any} setStateFunc
       * @param {any} createClientMessage
       * @param {any} stateRef
       * @param {any} createCustomMessage
       * @param {any} rest
       */
     constructor(
      createChatBotMessage,
      setStateFunc,
      createClientMessage,
      stateRef,
      createCustomMessage,
      ...rest
    ) {
      this.createChatBotMessage = createChatBotMessage;
      this.setState = setStateFunc;
      this.createClientMessage = createClientMessage;
      this.stateRef = stateRef;
      this.createCustomMessage = createCustomMessage;
    }
  }
  
  export default ActionProvider;