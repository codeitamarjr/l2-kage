# L2J Mobius Essence 10.1 (Samurai Crow) — login server + game server in one image.
# Build context: the repository root (this folder). Pick another chapter with --build-arg CHAPTER=...

# ---------------------------------------------------------------------------
# Build stage: compile the Java sources with Ant (the project requires JDK 27)
# ---------------------------------------------------------------------------
FROM eclipse-temurin:27-jdk AS build

ARG ANT_VERSION=1.10.15
ARG CHAPTER=L2J_Mobius_Essence_10.1_SamuraiCrow

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && curl -fsSL "https://archive.apache.org/dist/ant/binaries/apache-ant-${ANT_VERSION}-bin.tar.gz" | tar -xz -C /opt \
 && ln -s /opt/apache-ant-${ANT_VERSION}/bin/ant /usr/local/bin/ant

WORKDIR /build/src
COPY ${CHAPTER}/ ./

# "jar" compiles and writes the jars to ../build/dist (skips zipping the release).
RUN ant -noinput jar

RUN set -eux; \
    mkdir -p /out; \
    cp -r dist/game dist/login /out/; \
    mkdir -p /out/libs; \
    cp dist/libs/*.jar /out/libs/; \
    rm -f /out/libs/*-sources.jar; \
    cp /build/build/dist/libs/*.jar /out/libs/; \
    mkdir -p /out/game/log /out/login/log /out/game/data/geodata

# ---------------------------------------------------------------------------
# Runtime stage (JDK, not JRE: the game server compiles its scripts at startup)
# ---------------------------------------------------------------------------
FROM eclipse-temurin:27-jdk

COPY --from=build /out/ /opt/l2j/
COPY docker/entrypoint.sh /usr/local/bin/l2j
RUN chmod 755 /usr/local/bin/l2j

# 2106 = login (client), 9014 = login <-> game (internal), 7777 = game (client)
EXPOSE 2106 7777 9014

ENTRYPOINT ["l2j"]
CMD ["game"]
