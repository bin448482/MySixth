# Certbot Asset Layout

This folder mirrors the paths used in production when issuing Let's Encrypt
certificates:

- `www/` is mounted into the Nginx container at `/var/www/certbot` so that
  HTTP-01 challenges can be served from
  `/.well-known/acme-challenge/<token>`.
- `conf/` is mounted at `/etc/letsencrypt` and will receive the certificate
  material once `certbot certonly ...` is executed on the server.

### Local dry-run

You can verify the workflow without issuing a real certificate:

```bash
# From the repository root
ACME_STAGE=staging ./deploy/certbot/request-cert.sh
```

The `--staging` flag ensures the ACME call uses Let's Encrypt's test endpoint.
Replace it with a production invocation on the actual server.
