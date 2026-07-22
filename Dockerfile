FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source
COPY backend/OpmWiki.sln backend/
COPY backend/src/OpmWiki.Domain/OpmWiki.Domain.csproj backend/src/OpmWiki.Domain/
COPY backend/src/OpmWiki.Application/OpmWiki.Application.csproj backend/src/OpmWiki.Application/
COPY backend/src/OpmWiki.Infrastructure/OpmWiki.Infrastructure.csproj backend/src/OpmWiki.Infrastructure/
COPY backend/src/OpmWiki.Api/OpmWiki.Api.csproj backend/src/OpmWiki.Api/
RUN dotnet restore backend/src/OpmWiki.Api/OpmWiki.Api.csproj
COPY backend/src/ backend/src/
RUN dotnet publish backend/src/OpmWiki.Api/OpmWiki.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app .
COPY src/data /frontend-data
ENV ASPNETCORE_URLS=http://+:8080 \
    SeedData__FrontendDataPath=/frontend-data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl --fail --silent http://localhost:8080/api/health || exit 1
USER $APP_UID
ENTRYPOINT ["dotnet", "OpmWiki.Api.dll"]
