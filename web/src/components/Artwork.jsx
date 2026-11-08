/**
 * Content artwork. Uses the official poster (posterUrl) when an admin has added one;
 * otherwise draws KELIR's placeholder: a flat palette field with a rising half-disc and the title.
 */
export default function Artwork({ content, shape = 'poster', showTitle = true, className }) {
  const cls = ['art', `art-${shape}`, className].filter(Boolean).join(' ');
  if (content.posterUrl) {
    return (
      <div className={cls}>
        <img src={content.posterUrl} alt="" loading="lazy" decoding="async" />
      </div>
    );
  }
  return (
    <div className={`${cls} art-gen art-${content.art || 'coral'}`} aria-hidden>
      {showTitle && <span className="art-title">{content.title}</span>}
      <span className="art-sun" />
    </div>
  );
}
