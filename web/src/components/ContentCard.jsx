import { Link } from 'react-router-dom';
import Artwork from './Artwork.jsx';
import { Badge, TypeBadge } from './ui.jsx';
import Icon from './Icon.jsx';
import { metaLine, rating, remaining } from '../lib/format.js';

/**
 * Content card from the design system: media first, metadata below.
 * kind: "poster" (2:3), "video" (16:9) or "square" (music covers).
 */
export default function ContentCard({ content, kind, progress, meta, to, showType = true, rank, className }) {
  const shape = kind || (content.type === 'music' ? 'square' : 'poster');
  const href = to || `/title/${content.slug}`;
  const premium = content.access === 'premium';
  return (
    <Link to={href} className={['card', `card-${shape}`, className].filter(Boolean).join(' ')}>
      <div className="card-media">
        <Artwork content={content} shape={shape} />
        <div className="card-badges">
          {showType && <TypeBadge type={content.type} />}
          {premium && shape === 'video' && content.hasFreeEpisode && <Badge tone="neutral">Ep. 1 gratis</Badge>}
        </div>
        {premium && (
          <span className={`card-lock ${shape === 'video' ? 'card-lock-text' : ''}`} title="Premium" aria-label="Premium">
            <Icon name="lock" size={14} />
            {shape === 'video' && <span>Premium</span>}
          </span>
        )}
        {rank && <span className="card-rank" aria-hidden>{rank}</span>}
        {progress && (
          <div className="card-progress" role="progressbar" aria-label="Progres tontonan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.progress * 100)}>
            <span style={{ width: `${Math.max(3, progress.progress * 100)}%` }} />
          </div>
        )}
      </div>
      <div className="card-body">
        <span className="card-title">{content.title}</span>
        <span className="card-meta">
          {progress
            ? `${progress.episode ? `Episode ${progress.episode} · ` : ''}${remaining(progress.remainingSeconds)}`
            : meta || metaLine(content, { withType: false })}
        </span>
        {!progress && content.categories?.includes('budaya') && <Badge tone="budaya" className="card-tag">Budaya</Badge>}
        {!progress && content.ratingCount > 0 && (
          <span className="card-rating">
            <Icon name="star" size={14} filled /> {rating(content.ratingAvg)}
            {content.regionName && <span className="card-region"> · {content.regionName}</span>}
          </span>
        )}
        {!progress && !content.ratingCount && content.regionName && (
          <span className="card-rating card-region"><Icon name="map-pin" size={14} /> {content.regionName}</span>
        )}
      </div>
    </Link>
  );
}

export function CardGrid({ items, kind, className, ...rest }) {
  return (
    <div className={['grid', kind === 'video' ? 'grid-video' : 'grid-poster', className].filter(Boolean).join(' ')}>
      {items.map((c) => (
        <ContentCard key={c.id} content={c} kind={kind} {...rest} />
      ))}
    </div>
  );
}

/** Horizontal scroller used on Home: cards cut at the right edge hint that there is more. */
export function Rail({ items, kind, label, progressFor, ranked }) {
  return (
    <div className={['rail', kind === 'video' ? 'rail-video' : 'rail-poster'].join(' ')} role="list" aria-label={label}>
      {items.map((c, i) => {
        const content = c.content || c;
        return (
          <div role="listitem" key={content.id} className="rail-item">
            <ContentCard
              content={content}
              kind={kind}
              progress={progressFor ? c : undefined}
              rank={ranked ? i + 1 : undefined}
              to={progressFor ? `/play/${content.slug}${c.episode ? `?episode=${c.episode}` : ''}` : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
