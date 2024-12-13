export const log = (...params: Array<unknown>) => {
  console.log(`[${new Date().toLocaleTimeString()}]`, ...params);
};
