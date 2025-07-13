export function secondStringify(seconds: number): string {
	seconds = Math.round(seconds);

  function printZero(input: number): string {
    if (input < 10) return "0" + input;
    return input.toString();
  }

  const days = Math.floor(seconds / 86400);
  const r1 = seconds % 86400;

  const hours = Math.floor(r1 / 3600);
  const r2 = r1 % 3600;

  const minutes = Math.floor(r2 / 60);
  const second = r2 % 60;

  let rstring = `${printZero(minutes)}:${printZero(second)}`;
  if (hours > 0) rstring = hours + ":" + rstring;
  if (days > 0) rstring = `${days} Tag${days > 1 ? "s" : ""} ` + rstring;

  return rstring;
}
