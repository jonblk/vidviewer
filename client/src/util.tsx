function formatSeconds(seconds: string) {
  if (+seconds < 60) {
    return `0:${seconds.padStart(2, '0')}`;
  }
  return seconds.toString();
}

export {formatSeconds};