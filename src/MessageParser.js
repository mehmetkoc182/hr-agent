// MessageParser starter code
class MessageParser {
    /**
     * @param {any} actionProvider
     * @param {any} state
     */
    constructor(actionProvider, state) {
      this.actionProvider = actionProvider;
      this.state = state;
    }
  
    /**
     * @param {any} message
     */
    parse(message) {
      console.log(message)
    }
  }
  
  export default MessageParser;