# Lezgo website

The public website for the Lezgo iOS app, served at **https://lezgo.nathansudiara.com**.

| Path | Page | Used by |
| --- | --- | --- |
| `/` | Landing page | App Store Connect: Marketing URL |
| `/privacy` | Privacy Policy | App Store Connect: Privacy Policy URL |
| `/support` | Support | App Store Connect: Support URL |

It is plain HTML and CSS with no build step. Colors, logo and mascots come from the app's asset catalog in [C5-M3/Lezgo](https://github.com/C5-M3/Lezgo) (`Lezgo/Resources/Assets.xcassets`); the screenshots come from the app's debug screens.

## Run it locally

```bash
python3 -m http.server 8791
```

Then open http://127.0.0.1:8791.

## Deploy

The site is deployed on Vercel. `vercel.json` turns on clean URLs, so `/privacy/index.html` is served at `/privacy`.

```bash
vercel deploy --prod
```

The domain `lezgo.nathansudiara.com` points to Vercel with a DNS record in Cloudflare: type `A`, name `lezgo`, value `76.76.21.21`, proxy status DNS only (grey cloud), so Vercel can issue the HTTPS certificate.

## Keep the privacy policy true

When the app starts sharing new data, update these together:

1. `privacy/index.html` in this repository.
2. `Lezgo/Resources/PrivacyInfo.xcprivacy` in the app repository.
3. The App Privacy answers in App Store Connect.
