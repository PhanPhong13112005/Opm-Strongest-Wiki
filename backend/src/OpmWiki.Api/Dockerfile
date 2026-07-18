FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source
COPY OpmWiki.sln ./
COPY src/OpmWiki.Domain/OpmWiki.Domain.csproj src/OpmWiki.Domain/
COPY src/OpmWiki.Application/OpmWiki.Application.csproj src/OpmWiki.Application/
COPY src/OpmWiki.Infrastructure/OpmWiki.Infrastructure.csproj src/OpmWiki.Infrastructure/
COPY src/OpmWiki.Api/OpmWiki.Api.csproj src/OpmWiki.Api/
RUN dotnet restore src/OpmWiki.Api/OpmWiki.Api.csproj
COPY src/ src/
RUN dotnet publish src/OpmWiki.Api/OpmWiki.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "OpmWiki.Api.dll"]
