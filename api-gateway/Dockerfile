# Etapa 1: Construcción (Build)
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Etapa 2: Imagen de ejecución (Runtime)
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# curl para el healthcheck del contenedor
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# wait-for-it para esperar a Redis antes de arrancar (el rate limiter lo necesita)
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["/bin/sh", "-c", \
  "/wait-for-it.sh \"$REDIS_HOST:$REDIS_PORT\" -t 60 -- java -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
