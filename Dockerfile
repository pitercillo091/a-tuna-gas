FROM node:24-alpine
WORKDIR /app
COPY personajes personajes
COPY vehiculos vehiculos
COPY circuitos circuitos
COPY objetos objetos
COPY juego juego
COPY servidor servidor
RUN mkdir -p /datos && chown node:node /datos
USER node
ENV API_ONLY=1 HOST=0.0.0.0 PORT=8783 RANKING_DB=/datos/tiempos.sqlite
EXPOSE 8783
VOLUME ["/datos"]
CMD ["node","servidor/servidor.mjs"]
