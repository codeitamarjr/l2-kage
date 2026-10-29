/** The Kage Pass art: the golden pass ticket (public/assets/kage-pass-ticket.jpg). */
export function PassArt({ className }: { className?: string }) {
    return <img src="/assets/kage-pass-ticket.jpg" alt="" width={1600} height={750} loading="lazy" className={className ? `pass-art ${className}` : 'pass-art'} />;
}

/** "19 Jan 2027" in the visitor's language. */
export function passEnds(ends: string, tag: string): string {
    return new Date(`${ends}T12:00:00`).toLocaleDateString(tag, { day: 'numeric', month: 'short', year: 'numeric' });
}
