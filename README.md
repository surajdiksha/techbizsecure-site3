# TechBiz Secure — GitHub Pages Website

Production-ready static landing site for TechBizSecure.com.

## Upload
Upload the contents of this folder to the root of your GitHub Pages repository:
- `index.html`
- `CNAME`
- `robots.txt`
- `sitemap.xml`
- `css/style.css`
- `js/app.js`
- `assets/favicon.svg`

## GitHub Pages
Repository → Settings → Pages → Deploy from branch → main → `/ (root)`.

Set the Custom domain to `techbizsecure.com`. GitHub can create/maintain the CNAME when configured through Pages; this package also includes it for a branch/root deployment.

After DNS is correct, enable **Enforce HTTPS**.

## DNS
For an apex domain, GitHub documents A records:
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153

For `www`, GitHub documents a CNAME to your GitHub Pages hostname. Follow GitHub's current custom-domain documentation rather than copying an old repository-specific value.

## Contact
The site uses `TBS@TechBizSecure.com` in the footer and contact form. The form is static and opens the visitor's email client; it does not store submissions.

## Before launch
1. Confirm the TBS mailbox is monitored.
2. Add Privacy Policy / Terms when your legal wording is ready.
3. Replace any service claims that do not reflect your actual delivery capability.
4. Add real phone/address/social links only when you want them public.
