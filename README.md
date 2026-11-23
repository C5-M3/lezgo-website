# Lezgo website

The public website for the Lezgo iOS app, served at **https://joinlezgo.app**. The old address `lezgo.nathansudiara.com` and `www.joinlezgo.app` redirect to it.

| Path | Page | Used by |
| --- | --- | --- |
| `/` | Landing page | App Store Connect: Marketing URL |
| `/privacy` | Privacy Policy | App Store Connect: Privacy Policy URL |
| `/support` | Support | App Store Connect: Support URL |
| `/join?code=897654` | Invite link to a trip | Shared from the app's Trip Room. Opens Lezgo when it is installed (universal link), otherwise shows the room code |
| `/.well-known/apple-app-site-association` | Lists the app IDs that open `/join` links | iOS, when Lezgo is installed |

It is plain HTML and CSS with no build step. `main.js` adds the landing page's scroll motion with [GSAP](https://gsap.com) and [Lenis](https://lenis.darkroom.engineering), saved in `assets/vendor/` (GSAP 3.13.0 with ScrollTrigger and SplitText, Lenis 1.1.18) so the site loads no outside scripts. Every page still works without JavaScript. Colors, logo and mascots come from the app's asset catalog in [C5-M3/Lezgo](https://github.com/C5-M3/Lezgo) (`Lezgo/Resources/Assets.xcassets`); the screenshots come from the app's debug screens.

## Run it locally

```bash
python3 -m http.server 8791
```

Then open http://127.0.0.1:8791.

## Deploy

The site is deployed on Vercel. `vercel.json` turns on clean URLs, so `/privacy/index.html` is served at `/privacy`.

Every push to `main` deploys to production automatically, and every other branch gets a preview URL. The Vercel GitHub App is installed on the C5-M3 organization for this repository only. To deploy by hand:

```bash
vercel deploy --prod
```

The domain `joinlezgo.app` is registered and managed in Cloudflare. Its DNS records point to Vercel, with proxy status DNS only (grey cloud) so Vercel can issue the HTTPS certificate and iOS reads the association file straight from Vercel:

| Type | Name | Value |
| --- | --- | --- |
| `A` | `@` | `216.198.79.1` |
| `CNAME` | `www` | `af6f458d1c02cda4.vercel-dns-017.com` |

## Invite links

The app shares `https://joinlezgo.app/join?code=897654` (ADR 0036 in the app repository). iOS opens Lezgo for that link only when `.well-known/apple-app-site-association` lists the app ID of the installed build. To test the link on your own signing, add `<DEVELOPMENT_TEAM>.<BUNDLE_IDENTIFIER_PREFIX>.Lezgo` to `appIDs`, push, then delete and reinstall the app so iOS reads the file again. Check it at https://joinlezgo.app/.well-known/apple-app-site-association.

## Keep the privacy policy true

When the app starts sharing new data, update these together:

1. `privacy/index.html` in this repository.
2. `Lezgo/Resources/PrivacyInfo.xcprivacy` in the app repository.
3. The App Privacy answers in App Store Connect.
