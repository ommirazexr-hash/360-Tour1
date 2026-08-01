# SSL Certificate Placeholder
# Place your SSL certificate files here for HTTPS:
#   fullchain.pem   - SSL certificate chain
#   privkey.pem     - Private key
#
# Obtain free certificates via Let's Encrypt:
#   certbot certonly --standalone -d your-domain.com
#
# Then update docker-compose.yml to mount them:
#   volumes:
#     - ./docker/nginx/ssl:/etc/nginx/ssl:ro
