/**
 * Return a higher-resolution version of an avatar URL when the provider serves
 * a small default size. Google (lh3.googleusercontent.com) serves avatars at
 * 96px by default (=s96-c), which looks blurry when displayed large. Bumping the
 * size token requests a sharper image from the same URL.
 */
export function highResAvatar(url?: string | null, size = 512): string | undefined {
  if (!url) return url ?? undefined

  if (url.includes('googleusercontent.com')) {
    // e.g. ...=s96-c  /  ...=s96-c-k-no  ->  ...=s512-c...
    if (/=s\d+/.test(url)) return url.replace(/=s\d+/, `=s${size}`)
    // e.g. ...=w96-h96-c  ->  ...=s512
    if (/=w\d+-h\d+/.test(url)) return url.replace(/=w\d+-h\d+/, `=s${size}`)
    // no size token present — append one
    return `${url}=s${size}-c`
  }

  return url
}
