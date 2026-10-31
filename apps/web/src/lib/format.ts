export type Params = Record<string, string | number>;

/** Replace {name} placeholders. An unknown placeholder is left as written, never dropped. */
export function format(template: string, params: Params = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** 25000 -> "25,000"; 150000 -> "1,50,000" (Indian digit grouping, spec 17). */
export function formatIndianNumber(value: number): string {
  const [whole = '0', fraction] = Math.abs(value).toString().split('.');
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest === '' ? last3 : `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
  return `${value < 0 ? '-' : ''}${grouped}${fraction === undefined ? '' : `.${fraction}`}`;
}
