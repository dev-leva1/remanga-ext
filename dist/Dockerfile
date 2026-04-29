FROM nginx:alpine

# Копируем все файлы
COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY script.js /usr/share/nginx/html/script.js
COPY remanga-extension.user.js /usr/share/nginx/html/remanga-extension.user.js
COPY logo.svg /usr/share/nginx/html/logo.svg
COPY robots.txt /usr/share/nginx/html/robots.txt
COPY sitemap.xml /usr/share/nginx/html/sitemap.xml
COPY llms.txt /usr/share/nginx/html/llms.txt
COPY 404.html /usr/share/nginx/html/404.html

# Настройка nginx
RUN echo 'server { \
    listen 80; \
    server_name www.ext.nexee.ru; \
    return 301 https://ext.nexee.ru$request_uri; \
} \
\
server { \
    listen 80; \
    server_name ext.nexee.ru _; \
    root /usr/share/nginx/html; \
    index index.html; \
    error_page 404 /404.html; \
    \
    location / { \
        try_files $uri $uri/ =404; \
    } \
    \
    location = /404.html { \
        internal; \
    } \
    \
    location = /favicon.ico { \
        try_files /logo.svg =404; \
    } \
    \
    location ~ \.user\.js$ { \
        add_header Content-Type "text/javascript; charset=utf-8"; \
        add_header Cache-Control "no-cache, must-revalidate"; \
        add_header Access-Control-Allow-Origin "*"; \
    } \
    \
    location ~ \.(css|js|svg|xml|txt)$ { \
        add_header Cache-Control "public, max-age=3600"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
