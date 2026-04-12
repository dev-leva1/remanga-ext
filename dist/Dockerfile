FROM nginx:alpine

# Копируем userscript
COPY remanga-extension.user.js /usr/share/nginx/html/remanga-extension.user.js

# Настройка nginx для правильных заголовков
RUN echo 'server { \
    listen 80; \
    server_name _; \
    location / { \
        root /usr/share/nginx/html; \
        add_header Content-Type "text/javascript; charset=utf-8"; \
        add_header Cache-Control "no-cache, must-revalidate"; \
        add_header Access-Control-Allow-Origin "*"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
