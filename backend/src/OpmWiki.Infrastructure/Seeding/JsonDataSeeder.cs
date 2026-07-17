using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpmWiki.Application.Abstractions;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;

namespace OpmWiki.Infrastructure.Seeding;

public sealed class JsonDataSeeder(
    OpmWikiDbContext dbContext,
    IOptions<SeedDataOptions> options,
    ILogger<JsonDataSeeder> logger) : IDataSeeder
{
    public async Task<SeedResult> SeedAsync(CancellationToken cancellationToken = default)
    {
        var dataPath = options.Value.FrontendDataPath;
        var charactersViPath = Path.Combine(dataPath, "characters.json");
        var charactersEnPath = Path.Combine(dataPath, "characters_en.json");
        var eventsPath = Path.Combine(dataPath, "events.json");
        var masteryPath = Path.Combine(dataPath, "mastery.json");

        EnsureFileExists(charactersViPath);
        EnsureFileExists(charactersEnPath);
        EnsureFileExists(eventsPath);
        EnsureFileExists(masteryPath);

        using var charactersVi = await ReadJsonAsync(charactersViPath, cancellationToken);
        using var charactersEn = await ReadJsonAsync(charactersEnPath, cancellationToken);
        using var events = await ReadJsonAsync(eventsPath, cancellationToken);
        using var mastery = await ReadJsonAsync(masteryPath, cancellationToken);

        var englishCharacters = charactersEn.RootElement.EnumerateArray()
            .ToDictionary(x => GetString(x, "id"), x => x, StringComparer.OrdinalIgnoreCase);

        IDbContextTransaction? transaction = null;
        if (dbContext.Database.IsRelational())
            transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var characterCount = await SeedCharactersAsync(
                charactersVi.RootElement,
                englishCharacters,
                cancellationToken);
            var eventCount = await SeedEventsAsync(events.RootElement, cancellationToken);
            var masteryTierCount = await SeedMasteryAsync(mastery.RootElement, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            if (transaction is not null)
                await transaction.CommitAsync(cancellationToken);

            logger.LogInformation(
                "Imported {CharacterCount} characters, {EventCount} events and {MasteryTierCount} mastery tiers from {DataPath}",
                characterCount,
                eventCount,
                masteryTierCount,
                dataPath);
            return new SeedResult(characterCount, eventCount, masteryTierCount);
        }
        catch
        {
            if (transaction is not null)
                await transaction.RollbackAsync(cancellationToken);
            throw;
        }
        finally
        {
            if (transaction is not null)
                await transaction.DisposeAsync();
        }
    }

    private async Task<int> SeedCharactersAsync(
        JsonElement vietnameseRoot,
        IReadOnlyDictionary<string, JsonElement> englishCharacters,
        CancellationToken cancellationToken)
    {
        var existingCharacters = await dbContext.Characters
            .AsSplitQuery()
            .Include(x => x.Skills)
            .Include(x => x.Effects)
            .ToDictionaryAsync(x => x.Id, StringComparer.OrdinalIgnoreCase, cancellationToken);

        var importedIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var vi in vietnameseRoot.EnumerateArray())
        {
            var id = GetString(vi, "id");
            if (string.IsNullOrWhiteSpace(id))
                throw new InvalidDataException("A character is missing its id.");

            importedIds.Add(id);
            var en = englishCharacters.GetValueOrDefault(id, vi);
            if (!existingCharacters.TryGetValue(id, out var character))
            {
                character = new Character { Id = id };
                dbContext.Characters.Add(character);
            }

            MapCharacter(character, vi, en);
            ReplaceSkills(character, vi, en);
            ReplaceEffects(character, vi, en);
        }

        var removedCharacters = existingCharacters.Values
            .Where(x => !importedIds.Contains(x.Id))
            .ToArray();
        if (removedCharacters.Length > 0)
            dbContext.Characters.RemoveRange(removedCharacters);

        return importedIds.Count;
    }

    private async Task<int> SeedEventsAsync(JsonElement eventsRoot, CancellationToken cancellationToken)
    {
        var existingEvents = await dbContext.Events
            .ToDictionaryAsync(x => x.Id, StringComparer.OrdinalIgnoreCase, cancellationToken);
        var importedIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var source in eventsRoot.EnumerateArray())
        {
            var id = GetString(source, "id");
            if (string.IsNullOrWhiteSpace(id))
                throw new InvalidDataException("An event is missing its id.");

            importedIds.Add(id);
            if (!existingEvents.TryGetValue(id, out var gameEvent))
            {
                gameEvent = new GameEvent { Id = id };
                dbContext.Events.Add(gameEvent);
            }

            gameEvent.TitleVi = GetString(source, "titleVi");
            gameEvent.TitleEn = Fallback(GetString(source, "titleEn"), gameEvent.TitleVi);
            gameEvent.DescriptionVi = GetString(source, "descriptionVi");
            gameEvent.DescriptionEn = Fallback(GetString(source, "descriptionEn"), gameEvent.DescriptionVi);
            gameEvent.Category = GetString(source, "category");
            gameEvent.ImageUrl = GetString(source, "imageUrl");
            gameEvent.DetailImages = GetStringArray(source, "detailImages");
            gameEvent.SectionsJson = GetRawJson(source, "sections", "[]");
            gameEvent.StartDate = ParseRequiredDate(GetString(source, "startDate"), id, "startDate");
            gameEvent.EndDate = ParseRequiredDate(GetString(source, "endDate"), id, "endDate");
        }

        var removedEvents = existingEvents.Values.Where(x => !importedIds.Contains(x.Id)).ToArray();
        if (removedEvents.Length > 0)
            dbContext.Events.RemoveRange(removedEvents);

        return importedIds.Count;
    }

    private async Task<int> SeedMasteryAsync(JsonElement masteryRoot, CancellationToken cancellationToken)
    {
        if (!masteryRoot.TryGetProperty("categories", out var categories) || categories.ValueKind != JsonValueKind.Object)
            throw new InvalidDataException("Mastery data is missing its categories object.");

        var existing = await dbContext.MasteryTiers
            .ToDictionaryAsync(x => $"{x.Category}:{x.Tier}", StringComparer.OrdinalIgnoreCase, cancellationToken);
        var importedKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var category in categories.EnumerateObject())
        {
            if (category.Value.ValueKind != JsonValueKind.Array) continue;

            foreach (var source in category.Value.EnumerateArray())
            {
                var tier = GetInt(source, "tier");
                var key = $"{category.Name}:{tier}";
                importedKeys.Add(key);

                if (!existing.TryGetValue(key, out var masteryTier))
                {
                    masteryTier = new MasteryTier { Category = category.Name, Tier = tier };
                    dbContext.MasteryTiers.Add(masteryTier);
                }

                if (source.TryGetProperty("stats", out var stats) && stats.ValueKind == JsonValueKind.Object)
                {
                    masteryTier.Atk = GetInt(stats, "atk");
                    masteryTier.Hp = GetInt(stats, "hp");
                }
                masteryTier.CostsJson = GetRawJson(source, "costs", "{}");
                masteryTier.RequirementsJson = GetRawJson(source, "requirements", "[]");
            }
        }

        var removed = existing.Where(x => !importedKeys.Contains(x.Key)).Select(x => x.Value).ToArray();
        if (removed.Length > 0) dbContext.MasteryTiers.RemoveRange(removed);
        return importedKeys.Count;
    }

    private void ReplaceSkills(Character character, JsonElement vi, JsonElement en)
    {
        var viSkills = GetArray(vi, "skills");
        var enSkills = GetArray(en, "skills");
        var existingSkills = character.Skills.ToDictionary(x => x.SortOrder);
        for (var index = 0; index < viSkills.Length; index++)
        {
            var viSkill = viSkills[index];
            var enSkill = index < enSkills.Length ? enSkills[index] : viSkill;
            if (!existingSkills.TryGetValue(index, out var skill))
            {
                skill = new CharacterSkill { CharacterId = character.Id, SortOrder = index };
                character.Skills.Add(skill);
            }

            skill.NameVi = GetString(viSkill, "name");
            skill.NameEn = Fallback(GetString(enSkill, "name"), skill.NameVi);
            skill.DescriptionVi = GetString(viSkill, "desc");
            skill.DescriptionEn = Fallback(GetString(enSkill, "desc"), skill.DescriptionVi);
            skill.TypeVi = GetString(viSkill, "type");
            skill.TypeEn = Fallback(GetString(enSkill, "type"), skill.TypeVi);
            skill.IconUrl = GetNullableString(viSkill, "icon") ?? GetNullableString(enSkill, "icon");
            skill.AnimationUrl = GetNullableString(viSkill, "animation") ?? GetNullableString(enSkill, "animation");
            skill.KeepsakeIconUrl = GetNullableString(viSkill, "keepsakeIcon") ?? GetNullableString(enSkill, "keepsakeIcon");
        }

        var removedSkills = existingSkills.Values.Where(x => x.SortOrder >= viSkills.Length).ToArray();
        if (removedSkills.Length > 0)
            dbContext.CharacterSkills.RemoveRange(removedSkills);
    }

    private void ReplaceEffects(Character character, JsonElement vi, JsonElement en)
    {
        var viEffects = GetArray(vi, "effects");
        var enEffects = GetArray(en, "effects");
        var existingEffects = character.Effects.ToDictionary(x => x.SortOrder);
        for (var index = 0; index < viEffects.Length; index++)
        {
            var viEffect = viEffects[index];
            var enEffect = index < enEffects.Length ? enEffects[index] : viEffect;
            if (!existingEffects.TryGetValue(index, out var effect))
            {
                effect = new CharacterEffect { CharacterId = character.Id, SortOrder = index };
                character.Effects.Add(effect);
            }

            effect.TermVi = GetString(viEffect, "term");
            effect.TermEn = Fallback(GetString(enEffect, "term"), effect.TermVi);
            effect.DescriptionVi = GetString(viEffect, "desc");
            effect.DescriptionEn = Fallback(GetString(enEffect, "desc"), effect.DescriptionVi);
        }

        var removedEffects = existingEffects.Values.Where(x => x.SortOrder >= viEffects.Length).ToArray();
        if (removedEffects.Length > 0)
            dbContext.CharacterEffects.RemoveRange(removedEffects);
    }

    private static void MapCharacter(Character character, JsonElement vi, JsonElement en)
    {
        character.NameVi = GetString(vi, "name");
        character.NameEn = Fallback(GetString(en, "name"), character.NameVi);
        character.ImageUrl = GetString(vi, "imageURL");
        character.Tier = GetString(vi, "tier");
        character.TypeVi = GetString(vi, "type");
        character.TypeEn = Fallback(GetString(en, "type"), character.TypeVi);
        character.FactionVi = GetString(vi, "faction");
        character.FactionEn = Fallback(GetString(en, "faction"), character.FactionVi);
        character.RolesVi = GetStringArray(vi, "roles");
        character.RolesEn = GetStringArray(en, "roles");
        character.DuyenVi = GetString(vi, "duyen");
        character.DuyenEn = Fallback(GetString(en, "duyen"), character.DuyenVi);
        character.BioVi = GetString(vi, "bio");
        character.BioEn = Fallback(GetString(en, "bio"), character.BioVi);
        character.KeepsakeIcon = GetNullableString(vi, "keepsakeIcon") ?? GetNullableString(en, "keepsakeIcon");
        character.TraitsVi = GetStringArray(vi, "dacTinh");
        character.TraitsEn = GetStringArray(en, "dacTinh");
        character.BondListVi = GetString(vi, "bondList");
        character.BondListEn = Fallback(GetString(en, "bondList"), character.BondListVi);
        character.ClassLevel = GetString(vi, "classLevel");
        character.ReleaseSea = ParseOptionalDate(
            GetNullableString(vi, "releaseSea") ?? GetString(vi, "releaseDate"));
        character.ReleaseChina = ParseOptionalDate(GetString(vi, "releaseTrung"));
        MapStats(character.BaseStats, vi, "baseStats");
        MapStats(character.PvpStats, vi, "pvpStats");
    }

    private static void MapStats(CharacterStats target, JsonElement source, string propertyName)
    {
        if (!source.TryGetProperty(propertyName, out var stats) || stats.ValueKind != JsonValueKind.Object)
        {
            target.Atk = 0;
            target.Hp = 0;
            target.Def = 0;
            target.Spd = 0;
            return;
        }

        target.Atk = GetInt(stats, "atk");
        target.Hp = GetInt(stats, "hp");
        target.Def = GetInt(stats, "def");
        target.Spd = GetInt(stats, "spd");
    }

    private static async Task<JsonDocument> ReadJsonAsync(string path, CancellationToken cancellationToken)
    {
        await using var stream = File.OpenRead(path);
        return await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
    }

    private static void EnsureFileExists(string path)
    {
        if (!File.Exists(path))
            throw new FileNotFoundException($"Seed data file was not found: {path}", path);
    }

    private static string GetString(JsonElement source, string propertyName)
    {
        if (!source.TryGetProperty(propertyName, out var property)) return string.Empty;
        return property.ValueKind == JsonValueKind.String ? property.GetString() ?? string.Empty : string.Empty;
    }

    private static string? GetNullableString(JsonElement source, string propertyName)
    {
        var value = GetString(source, propertyName);
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    private static int GetInt(JsonElement source, string propertyName)
    {
        if (!source.TryGetProperty(propertyName, out var property)) return 0;
        return property.TryGetInt32(out var value) ? value : 0;
    }

    private static string[] GetStringArray(JsonElement source, string propertyName)
    {
        if (!source.TryGetProperty(propertyName, out var property) || property.ValueKind != JsonValueKind.Array)
            return [];
        return property.EnumerateArray()
            .Where(x => x.ValueKind == JsonValueKind.String)
            .Select(x => x.GetString() ?? string.Empty)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToArray();
    }

    private static JsonElement[] GetArray(JsonElement source, string propertyName)
    {
        if (!source.TryGetProperty(propertyName, out var property) || property.ValueKind != JsonValueKind.Array)
            return [];
        return property.EnumerateArray().ToArray();
    }

    private static string GetRawJson(JsonElement source, string propertyName, string fallback)
    {
        if (!source.TryGetProperty(propertyName, out var property)) return fallback;
        return property.GetRawText();
    }

    private static DateOnly ParseRequiredDate(string value, string id, string field)
    {
        return ParseOptionalDate(value)
            ?? throw new InvalidDataException($"Event '{id}' has an invalid {field}: '{value}'.");
    }

    private static DateOnly? ParseOptionalDate(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var formats = new[] { "yyyy-MM-dd", "dd/MM/yyyy", "d/M/yyyy" };
        return DateOnly.TryParseExact(value, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)
            ? date
            : null;
    }

    private static string Fallback(string value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value;
}
