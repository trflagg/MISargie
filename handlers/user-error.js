
module.exports = class UserError extends Error {
  constructor(state = [], ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserError);
    }
    // state should be array of format { key, message }
    this.state = state;
    this.name = 'UserError';
  }
}
