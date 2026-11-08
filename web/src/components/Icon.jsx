// KELIR rounded line icons (24px grid, 2px stroke). The first 15 are the design system's set.
const ICONS = {
 "home": [
  "M4 11.5 12 5l8 6.5",
  "M6 10v9a1 1 0 0 0 1 1h3.5v-5h3v5H17a1 1 0 0 0 1-1v-9"
 ],
 "explore": [
  "M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0",
  "m15.5 8.5-2 5-5 2 2-5z"
 ],
 "watch": [
  "M7 5h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z",
  "M10 9.2v5.6l4.6-2.8z"
 ],
 "collection": [
  "M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z"
 ],
 "profile": [
  "M8.5 8.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0",
  "M5 20a7 7 0 0 1 14 0"
 ],
 "search": [
  "M4.5 11a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0",
  "m16 16 4 4"
 ],
 "heart": [
  "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"
 ],
 "star": [
  "m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"
 ],
 "lock": [
  "M7.5 11h9a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 17.5v-4A2.5 2.5 0 0 1 7.5 11z",
  "M8 11V8a4 4 0 0 1 8 0v3"
 ],
 "play": [
  "M8 5.5v13l10.5-6.5z"
 ],
 "map-pin": [
  "M12 21s6-5.6 6-11a6 6 0 0 0-12 0c0 5.4 6 11 6 11z",
  "M9.8 10a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0"
 ],
 "chevron-right": [
  "m10 6 6 6-6 6"
 ],
 "plus": [
  "M12 5v14M5 12h14"
 ],
 "check": [
  "m5 12.5 4.5 4.5L19 7.5"
 ],
 "alert": [
  "M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0",
  "M12 8v4.5",
  "M12 16h.01"
 ],
 "arrow-left": [
  "M19 12H5",
  "m11 6-6 6 6 6"
 ],
 "close": [
  "M6 6l12 12M18 6 6 18"
 ],
 "pause": [
  "M8 5v14",
  "M16 5v14"
 ],
 "volume": [
  "M4 9.5h3.5L12 6v12l-4.5-3.5H4z",
  "M15.5 9a4 4 0 0 1 0 6",
  "M18 6.5a7.5 7.5 0 0 1 0 11"
 ],
 "volume-off": [
  "M4 9.5h3.5L12 6v12l-4.5-3.5H4z",
  "m16 10 4 4",
  "m20 10-4 4"
 ],
 "fullscreen": [
  "M4 9V5a1 1 0 0 1 1-1h4",
  "M15 4h4a1 1 0 0 1 1 1v4",
  "M20 15v4a1 1 0 0 1-1 1h-4",
  "M9 20H5a1 1 0 0 1-1-1v-4"
 ],
 "fullscreen-exit": [
  "M9 4v4a1 1 0 0 1-1 1H4",
  "M20 9h-4a1 1 0 0 1-1-1V4",
  "M15 20v-4a1 1 0 0 1 1-1h4",
  "M4 15h4a1 1 0 0 1 1 1v4"
 ],
 "skip": [
  "M6 5.5v13l9-6.5z",
  "M18 5v14"
 ],
 "replay": [
  "M4 12a8 8 0 1 0 2.4-5.7",
  "M4 4v4.5h4.5"
 ],
 "eye": [
  "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z",
  "M9.5 12a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0"
 ],
 "edit": [
  "M4 20h4L19 9l-4-4L4 16z",
  "m13.5 6.5 4 4"
 ],
 "trash": [
  "M4 7h16",
  "M9 7V4.5h6V7",
  "M6.5 7l1 13h9l1-13"
 ],
 "logout": [
  "M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4",
  "M10 16l-4-4 4-4",
  "M6 12h10"
 ],
 "settings": [
  "M9.5 12a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0",
  "M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"
 ],
 "sparkle": [
  "M12 3.5 13.9 10.1 20.5 12l-6.6 1.9L12 20.5l-1.9-6.6L3.5 12l6.6-1.9z"
 ],
 "grid": [
  "M4 4h7v7H4z",
  "M13 4h7v7h-7z",
  "M4 13h7v7H4z",
  "M13 13h7v7h-7z"
 ],
 "sun": [
  "M8.5 12a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0",
  "M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"
 ],
 "moon": [
  "M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"
 ],
 "film": [
  "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  "M8 4v16M16 4v16M4 9h4M16 9h4M4 15h4M16 15h4"
 ],
 "music": [
  "M9 18V6l10-2v12",
  "M4 18a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0",
  "M14 16a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0"
 ],
 "list": [
  "M9 6h11M9 12h11M9 18h11",
  "M4.5 6h.01M4.5 12h.01M4.5 18h.01"
 ],
 "filter": [
  "M4 6h16",
  "M7 12h10",
  "M10 18h4"
 ],
 "chevron-left": [
  "m14 6-6 6 6 6"
 ],
 "chevron-down": [
  "m6 10 6 6 6-6"
 ],
 "users": [
  "M6 8.5a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
  "M3 19a6 6 0 0 1 12 0",
  "M15.5 5.6a3 3 0 0 1 0 5.8",
  "M17.5 13.5A6 6 0 0 1 21 19"
 ],
 "message": [
  "M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-5 3.5V6a1 1 0 0 1 1-1z"
 ],
 "receipt": [
  "M6 3.5h12V21l-3-2-3 2-3-2-3 2z",
  "M9 8h6M9 12h6"
 ],
 "external": [
  "M14 4h6v6",
  "M20 4 11 13",
  "M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
 ]
};
const FILLED = new Set(['play', 'skip']);

export default function Icon({ name, size = 24, filled, title, strokeWidth = 2, className, ...rest }) {
  const paths = ICONS[name] || [];
  const fill = filled || FILLED.has(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      className={['icon', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
