function formatSeconds(seconds: string) {
  if (+seconds < 60) {
    return `0:${seconds.padStart(2, '0')}`;
  }
  return seconds.toString();
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}



export {formatSeconds, isValidUrl};