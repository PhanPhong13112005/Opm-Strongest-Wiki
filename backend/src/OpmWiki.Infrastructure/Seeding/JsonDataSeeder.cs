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
    private const long SeederAdvisoryLockId = 5715140936559442249;

    public async Task<SeedResult> SeedAsync(CancellationToken cancellationToken = default)
    {
        var dataPath = options.Value.FrontendDataPath;
        var charactersViPath = Path.Combine(dataPath, "characters.json");
        var charactersEnPath = Path.Combine(dataPath, "characters_en.json");
        var eventsPath = Path.Combine(dataPath, "events.json");
        var masteryPath = Path.Combine(dataPath, "mastery.json");
        var insigniasPath = Path.Combine(dataPath, "insignias.json");
        var backgearsPath = Path.Combine(dataPath, "backgear.json");
        var tacticsPath = Path.Combine(dataPath, "tactics.json");

        EnsureFileExists(charactersViPath);
        EnsureFileExists(charactersEnPath);
        EnsureFileExists(eventsPath);
        EnsureFileExists(masteryPath);
        EnsureFileExists(insigniasPath);
        EnsureFileExists(backgearsPath);
        EnsureFileExists(tacticsPath);

        using var charactersVi = await ReadJsonAsync(charactersViPath, cancellationToken);
        using var charactersEn = await ReadJsonAsync(charactersEnPath, cancellationToken);
        using var events = await ReadJsonAsync(eventsPath, cancellationToken);
        using var mastery = await ReadJsonAsync(masteryPath, cancellationToken);
        using var insignias = await ReadJsonAsync(insigniasPath, cancellationToken);
        using var backgears = await ReadJsonAsync(backgearsPath, cancellationToken);
        using var tactics = await ReadJsonAsync(tacticsPath, cancellationToken);

        ValidateSourceData(
            charactersVi.RootElement,
            charactersEn.RootElement,
            events.RootElement,
            mastery.RootElement,
            insignias.RootElement,
            backgears.RootElement,
            tactics.RootElement);

        var englishCharacters = charactersEn.RootElement.EnumerateArray()
            .ToDictionary(x => GetString(x, "id"), x => x, StringComparer.OrdinalIgnoreCase);

        var executionStrategy = dbContext.Database.CreateExecutionStrategy();
        var result = await executionStrategy.ExecuteAsync(async () =>
        {
            IDbContextTransaction? transaction = null;
            try
            {
                transaction = dbContext.Database.IsRelational()
                    ? await dbContext.Database.BeginTransactionAsync(cancellationToken)
                    : null;

                SeedResult attemptResult;
                try
                {
                    if (dbContext.Database.IsNpgsql())
                    {
                        await dbContext.Database.ExecuteSqlInterpolatedAsync(
                            $"SELECT pg_advisory_xact_lock({SeederAdvisoryLockId})",
                            cancellationToken);
                    }

                    var characterCount = await SeedCharactersAsync(
                        charactersVi.RootElement,
                        englishCharacters,
                        cancellationToken);
                    var eventCount = await SeedEventsAsync(events.RootElement, cancellationToken);
                    var masteryTierCount = await SeedMasteryAsync(mastery.RootElement, cancellationToken);
                    var insigniaCount = await SeedInsigniasAsync(insignias.RootElement, cancellationToken);
                    var (backgearCount, backgearSetCount) = await SeedBackgearsAsync(
                        backgears.RootElement,
                        cancellationToken);
                    var (tacticCardCount, tacticFrameCount) = await SeedTacticsAsync(
                        tactics.RootElement,
                        cancellationToken);
                    await dbContext.SaveChangesAsync(cancellationToken);

                    attemptResult = new SeedResult(
                        characterCount,
                        eventCount,
                        masteryTierCount,
                        insigniaCount,
                        backgearCount,
                        backgearSetCount,
                        tacticCardCount,
                        tacticFrameCount);

                    if (transaction is not null)
                        await transaction.CommitAsync(cancellationToken);
                }
                catch (Exception seedException)
                {
                    if (transaction is not null)
                    {
                        try
                        {
                            await transaction.RollbackAsync(CancellationToken.None);
                        }
                        catch (Exception rollbackException)
                        {
                            TryLogRollbackFailure(rollbackException, seedException);
                        }
                    }

                    throw;
                }
                finally
                {
                    dbContext.ChangeTracker.Clear();
                }

                return attemptResult;
            }
            finally
            {
                if (transaction is not null)
                {
                    try
                    {
                        await transaction.DisposeAsync();
                    }
                    catch (Exception disposalException)
                    {
                        TryLogTransactionDisposalFailure(disposalException);
                    }
                }
            }
        });

        TryLogSeedCompleted(result, dataPath);
        return result;
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

            if (!importedIds.Add(id))
                throw new InvalidDataException($"Duplicate character id: '{id}'.");
            if (existingCharacters.ContainsKey(id)) continue;

            var en = englishCharacters.GetValueOrDefault(id, vi);
            var character = new Character { Id = id };
            MapCharacter(character, vi, en);
            AddSkills(character, vi, en);
            AddEffects(character, vi, en);
            dbContext.Characters.Add(character);
        }

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

            if (!importedIds.Add(id))
                throw new InvalidDataException($"Duplicate event id: '{id}'.");
            if (existingEvents.ContainsKey(id)) continue;

            var gameEvent = new GameEvent { Id = id };
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
            dbContext.Events.Add(gameEvent);
        }

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
                if (!importedKeys.Add(key))
                    throw new InvalidDataException($"Duplicate mastery key: '{key}'.");

                if (existing.ContainsKey(key)) continue;

                var masteryTier = new MasteryTier { Category = category.Name, Tier = tier };
                if (source.TryGetProperty("stats", out var stats) && stats.ValueKind == JsonValueKind.Object)
                {
                    masteryTier.Atk = GetInt(stats, "atk");
                    masteryTier.Hp = GetInt(stats, "hp");
                }
                masteryTier.CostsJson = GetRawJson(source, "costs", "{}");
                masteryTier.RequirementsJson = GetRawJson(source, "requirements", "[]");
                dbContext.MasteryTiers.Add(masteryTier);
            }
        }

        return importedKeys.Count;
    }

    private async Task<int> SeedInsigniasAsync(JsonElement root, CancellationToken cancellationToken)
    {
        if (!root.TryGetProperty("guides", out var guidesRoot) || guidesRoot.ValueKind != JsonValueKind.Array)
            throw new InvalidDataException("Insignia data is missing its guides array.");
        if (!root.TryGetProperty("items", out var itemsRoot) || itemsRoot.ValueKind != JsonValueKind.Array)
            throw new InvalidDataException("Insignia data is missing its items array.");

        var existingGuides = await dbContext.InsigniaGuides
            .ToDictionaryAsync(x => x.Id, StringComparer.OrdinalIgnoreCase, cancellationToken);
        var importedGuideIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var source in guidesRoot.EnumerateArray())
        {
            var id = GetString(source, "id");
            if (string.IsNullOrWhiteSpace(id))
                throw new InvalidDataException("An insignia guide is missing its id.");
            if (!importedGuideIds.Add(id))
                throw new InvalidDataException($"Duplicate insignia guide id: '{id}'.");

            if (existingGuides.ContainsKey(id)) continue;

            var guide = new InsigniaGuide { Id = id };
            guide.TitleVi = GetString(source, "titleVi");
            guide.TitleEn = Fallback(GetString(source, "titleEn"), guide.TitleVi);
            guide.DescriptionVi = GetString(source, "descriptionVi");
            guide.DescriptionEn = Fallback(GetString(source, "descriptionEn"), guide.DescriptionVi);
            guide.ImageUrls = GetStringArray(source, "images");
            existingGuides.Add(id, guide);
            dbContext.InsigniaGuides.Add(guide);
        }

        var existingInsignias = await dbContext.Insignias
            .Include(x => x.GuideLinks)
            .ToDictionaryAsync(x => x.Id, StringComparer.OrdinalIgnoreCase, cancellationToken);
        var importedInsigniaIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var source in itemsRoot.EnumerateArray())
        {
            var id = GetString(source, "id");
            var classLevel = GetString(source, "classLevel");
            if (string.IsNullOrWhiteSpace(id))
                throw new InvalidDataException("An insignia is missing its id.");
            if (!importedInsigniaIds.Add(id))
                throw new InvalidDataException($"Duplicate insignia id: '{id}'.");
            if (classLevel is "Other" or "Villain")
                throw new InvalidDataException($"Excluded insignia class found: '{classLevel}'.");

            if (existingInsignias.ContainsKey(id)) continue;

            var insignia = new Insignia { Id = id };
            insignia.ClassLevel = classLevel;
            insignia.NameVi = GetString(source, "nameVi");
            insignia.NameEn = Fallback(GetString(source, "nameEn"), insignia.NameVi);
            insignia.ImageUrl = GetString(source, "imageUrl");
            insignia.SortOrder = GetInt(source, "sortOrder");

            var guideIds = GetStringArray(source, "guideIds");
            var importedLinkGuideIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var existingLinks = insignia.GuideLinks
                .ToDictionary(x => x.GuideId, StringComparer.OrdinalIgnoreCase);
            for (var index = 0; index < guideIds.Length; index++)
            {
                var guideId = guideIds[index];
                if (!importedLinkGuideIds.Add(guideId))
                    throw new InvalidDataException($"Duplicate guide id '{guideId}' in insignia '{id}'.");
                if (!existingGuides.TryGetValue(guideId, out var guide) || !importedGuideIds.Contains(guideId))
                    throw new InvalidDataException($"Insignia '{id}' references unknown guide '{guideId}'.");

                if (!existingLinks.TryGetValue(guideId, out var link))
                {
                    link = new InsigniaGuideLink
                    {
                        InsigniaId = id,
                        GuideId = guideId,
                        Guide = guide,
                    };
                    insignia.GuideLinks.Add(link);
                    existingLinks.Add(guideId, link);
                }
                link.SortOrder = index;
            }

            dbContext.Insignias.Add(insignia);
        }

        return importedInsigniaIds.Count;
    }

    private async Task<(int Backgears, int Sets)> SeedBackgearsAsync(
        JsonElement root,
        CancellationToken cancellationToken)
    {
        if (!root.TryGetProperty("gears", out var gearsRoot) || gearsRoot.ValueKind != JsonValueKind.Array)
            throw new InvalidDataException("Backgear data is missing its gears array.");
        if (!root.TryGetProperty("sets", out var setsRoot) || setsRoot.ValueKind != JsonValueKind.Array)
            throw new InvalidDataException("Backgear data is missing its sets array.");

        var existingGears = await dbContext.Backgears
            .ToDictionaryAsync(x => x.Id, StringComparer.OrdinalIgnoreCase, cancellationToken);
        var importedGearIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var gearIndex = 0;
        foreach (var source in gearsRoot.EnumerateArray())
        {
            var id = GetString(source, "id");
            if (string.IsNullOrWhiteSpace(id))
                throw new InvalidDataException("A backgear is missing its id.");
            if (!importedGearIds.Add(id))
                throw new InvalidDataException($"Duplicate backgear id: '{id}'.");

            if (existingGears.ContainsKey(id))
            {
                gearIndex++;
                continue;
            }

            var gear = new Backgear { Id = id };
            gear.NameVi = GetString(source, "nameVi");
            gear.NameEn = Fallback(GetString(source, "nameEn"), gear.NameVi);
            gear.Theme = GetString(source, "theme");
            gear.RarityVi = GetString(source, "rarityVi");
            gear.RarityEn = Fallback(GetString(source, "rarity"), gear.RarityVi);
            gear.AcquireVi = GetString(source, "acquireVi");
            gear.AcquireEn = Fallback(GetString(source, "acquireEn"), gear.AcquireVi);
            gear.LevelMax = GetInt(source, "levelMax");
            gear.IconUrl = GetString(source, "icon");
            gear.ThumbnailUrl = Fallback(GetString(source, "thumbnail"), gear.IconUrl);
            gear.SeniorIconUrl = Fallback(GetString(source, "seniorIcon"), gear.IconUrl);
            gear.ChangeLevel = GetNullableInt(source, "changeLevel");
            gear.LevelsJson = GetRawJson(source, "levels", "[]");
            gear.SortOrder = gearIndex++;
            dbContext.Backgears.Add(gear);
        }


        var existingSets = await dbContext.BackgearSets
            .ToDictionaryAsync(x => x.Id, StringComparer.OrdinalIgnoreCase, cancellationToken);
        var importedSetIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var setIndex = 0;
        foreach (var source in setsRoot.EnumerateArray())
        {
            var id = GetString(source, "id");
            if (string.IsNullOrWhiteSpace(id))
                throw new InvalidDataException("A backgear set is missing its id.");
            if (!importedSetIds.Add(id))
                throw new InvalidDataException($"Duplicate backgear set id: '{id}'.");

            if (existingSets.ContainsKey(id))
            {
                setIndex++;
                continue;
            }

            var set = new BackgearSet { Id = id };
            set.NameVi = GetString(source, "nameVi");
            set.NameEn = Fallback(GetString(source, "nameEn"), set.NameVi);
            set.RarityVi = GetString(source, "rarityVi");
            set.RarityEn = Fallback(GetString(source, "rarity"), set.RarityVi);
            set.RewardVi = GetString(source, "rewardVi");
            set.RewardEn = Fallback(GetString(source, "rewardEn"), set.RewardVi);
            set.RewardIconUrl = GetString(source, "rewardIcon");
            set.NeedsJson = GetRawJson(source, "needs", "[]");
            set.LevelsJson = GetRawJson(source, "levels", "[]");
            set.SortOrder = setIndex++;
            dbContext.BackgearSets.Add(set);
        }


        return (importedGearIds.Count, importedSetIds.Count);
    }

    private async Task<(int Cards, int Frames)> SeedTacticsAsync(
        JsonElement root,
        CancellationToken cancellationToken)
    {
        if (!root.TryGetProperty("cards", out var cardsRoot) || cardsRoot.ValueKind != JsonValueKind.Array)
            throw new InvalidDataException("Tactic data is missing its cards array.");
        if (!root.TryGetProperty("frames", out var framesRoot) || framesRoot.ValueKind != JsonValueKind.Array)
            throw new InvalidDataException("Tactic data is missing its frames array.");

        var existingCards = await dbContext.TacticCards
            .ToDictionaryAsync(x => x.Id, StringComparer.OrdinalIgnoreCase, cancellationToken);
        var importedCardIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var cardIndex = 0;
        foreach (var source in cardsRoot.EnumerateArray())
        {
            var id = GetString(source, "id");
            if (string.IsNullOrWhiteSpace(id))
                throw new InvalidDataException("A tactic card is missing its id.");
            if (!importedCardIds.Add(id))
                throw new InvalidDataException($"Duplicate tactic card id: '{id}'.");

            if (existingCards.ContainsKey(id))
            {
                cardIndex++;
                continue;
            }

            var card = new TacticCard { Id = id };
            card.NameVi = GetNestedString(source, "name", "vi");
            card.NameEn = Fallback(GetNestedString(source, "name", "en"), card.NameVi);
            card.Icon = GetString(source, "icon");
            card.Count = GetInt(source, "count");
            card.EffectVi = GetNestedString(source, "eff", "vi");
            card.EffectEn = Fallback(GetNestedString(source, "eff", "en"), card.EffectVi);
            card.ScalingJson = GetRawJson(source, "scaling", "{}");
            card.SortOrder = cardIndex++;
            dbContext.TacticCards.Add(card);
        }


        var existingFrames = await dbContext.TacticFrames
            .ToDictionaryAsync(x => x.Id, StringComparer.OrdinalIgnoreCase, cancellationToken);
        var importedFrameIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var frameIndex = 0;
        foreach (var source in framesRoot.EnumerateArray())
        {
            var id = GetString(source, "id");
            if (string.IsNullOrWhiteSpace(id))
                throw new InvalidDataException("A tactic frame is missing its id.");
            if (!importedFrameIds.Add(id))
                throw new InvalidDataException($"Duplicate tactic frame id: '{id}'.");

            if (existingFrames.ContainsKey(id))
            {
                frameIndex++;
                continue;
            }

            var frame = new TacticFrame { Id = id };
            frame.Name = GetString(source, "name");
            frame.Icon = GetString(source, "icon");
            frame.Hp = GetInt(source, "hp");
            frame.Def = GetInt(source, "def");
            frame.ColorClass = GetString(source, "colorClass");
            frame.BorderClass = GetString(source, "borderClass");
            frame.BackgroundClass = GetString(source, "bgClass");
            frame.SortOrder = frameIndex++;
            dbContext.TacticFrames.Add(frame);
        }


        return (importedCardIds.Count, importedFrameIds.Count);
    }

    private static void AddSkills(Character character, JsonElement vi, JsonElement en)
    {
        var viSkills = GetArray(vi, "skills");
        var enSkills = GetArray(en, "skills");
        for (var index = 0; index < viSkills.Length; index++)
        {
            var viSkill = viSkills[index];
            var enSkill = index < enSkills.Length ? enSkills[index] : viSkill;
            var skill = new CharacterSkill { CharacterId = character.Id, SortOrder = index };

            skill.NameVi = GetString(viSkill, "name");
            skill.NameEn = Fallback(GetString(enSkill, "name"), skill.NameVi);
            skill.DescriptionVi = GetString(viSkill, "desc");
            skill.DescriptionEn = Fallback(GetString(enSkill, "desc"), skill.DescriptionVi);
            skill.TypeVi = GetString(viSkill, "type");
            skill.TypeEn = Fallback(GetString(enSkill, "type"), skill.TypeVi);
            skill.IconUrl = GetNullableString(viSkill, "icon") ?? GetNullableString(enSkill, "icon");
            skill.AnimationUrl = GetNullableString(viSkill, "animation") ?? GetNullableString(enSkill, "animation");
            skill.KeepsakeIconUrl = GetNullableString(viSkill, "keepsakeIcon") ?? GetNullableString(enSkill, "keepsakeIcon");
            character.Skills.Add(skill);
        }

    }

    private static void AddEffects(Character character, JsonElement vi, JsonElement en)
    {
        var viEffects = GetArray(vi, "effects");
        var enEffects = GetArray(en, "effects");
        for (var index = 0; index < viEffects.Length; index++)
        {
            var viEffect = viEffects[index];
            var enEffect = index < enEffects.Length ? enEffects[index] : viEffect;
            var effect = new CharacterEffect { CharacterId = character.Id, SortOrder = index };

            effect.TermVi = GetString(viEffect, "term");
            effect.TermEn = Fallback(GetString(enEffect, "term"), effect.TermVi);
            effect.DescriptionVi = GetString(viEffect, "desc");
            effect.DescriptionEn = Fallback(GetString(enEffect, "desc"), effect.DescriptionVi);
            character.Effects.Add(effect);
        }

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

    private static void ValidateSourceData(
        JsonElement charactersVi,
        JsonElement charactersEn,
        JsonElement events,
        JsonElement mastery,
        JsonElement insignias,
        JsonElement backgears,
        JsonElement tactics)
    {
        ValidateUniqueIds(charactersVi, "character");
        ValidateUniqueIds(charactersEn, "English character");
        ValidateUniqueIds(events, "event");
        ValidateMasteryKeys(mastery);
        ValidateNestedUniqueIds(insignias, "guides", "insignia guide");
        ValidateNestedUniqueIds(insignias, "items", "insignia");
        ValidateInsigniaGuideIds(insignias);
        ValidateNestedUniqueIds(backgears, "gears", "backgear");
        ValidateNestedUniqueIds(backgears, "sets", "backgear set");
        ValidateNestedUniqueIds(tactics, "cards", "tactic card");
        ValidateNestedUniqueIds(tactics, "frames", "tactic frame");
    }

    private static void ValidateUniqueIds(JsonElement root, string dataType)
    {
        if (root.ValueKind != JsonValueKind.Array)
            throw new InvalidDataException($"{dataType} data must be an array.");

        var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var source in root.EnumerateArray())
        {
            var id = GetString(source, "id");
            if (string.IsNullOrWhiteSpace(id))
                throw new InvalidDataException($"A {dataType} is missing its id.");
            if (!ids.Add(id))
                throw new InvalidDataException($"Duplicate {dataType} id: '{id}'.");
        }
    }

    private static void ValidateNestedUniqueIds(JsonElement root, string propertyName, string dataType)
    {
        if (!root.TryGetProperty(propertyName, out var items) || items.ValueKind != JsonValueKind.Array)
            throw new InvalidDataException($"{dataType} data is missing its {propertyName} array.");

        ValidateUniqueIds(items, dataType);
    }

    private static void ValidateMasteryKeys(JsonElement root)
    {
        if (!root.TryGetProperty("categories", out var categories) || categories.ValueKind != JsonValueKind.Object)
            throw new InvalidDataException("Mastery data is missing its categories object.");

        var keys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var category in categories.EnumerateObject())
        {
            if (category.Value.ValueKind != JsonValueKind.Array) continue;

            foreach (var source in category.Value.EnumerateArray())
            {
                var key = $"{category.Name}:{GetInt(source, "tier")}";
                if (!keys.Add(key))
                    throw new InvalidDataException($"Duplicate mastery key: '{key}'.");
            }
        }
    }

    private static void ValidateInsigniaGuideIds(JsonElement root)
    {
        if (!root.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array)
            return;

        foreach (var source in items.EnumerateArray())
        {
            var insigniaId = GetString(source, "id");
            var guideIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var guideId in GetStringArray(source, "guideIds"))
            {
                if (!guideIds.Add(guideId))
                    throw new InvalidDataException(
                        $"Duplicate guide id '{guideId}' in insignia '{insigniaId}'.");
            }
        }
    }

    private void TryLogRollbackFailure(Exception rollbackException, Exception seedException)
    {
        try
        {
            logger.LogError(
                rollbackException,
                "Database rollback failed after a seed attempt failed with {SeedExceptionType}.",
                seedException.GetType().Name);
        }
        catch
        {
            // A broken logger must never replace the original seed exception.
        }
    }

    private void TryLogTransactionDisposalFailure(Exception disposalException)
    {
        try
        {
            logger.LogError(disposalException, "Database transaction disposal failed after a seed attempt.");
        }
        catch
        {
            // Transaction cleanup logging must not replace the seed result or exception.
        }
    }

    private void TryLogSeedCompleted(SeedResult result, string dataPath)
    {
        try
        {
            logger.LogInformation(
                "Imported {CharacterCount} characters, {EventCount} events, {MasteryTierCount} mastery tiers, {InsigniaCount} insignias, {BackgearCount} backgears, {BackgearSetCount} backgear sets, {TacticCardCount} tactic cards and {TacticFrameCount} tactic frames from {DataPath}",
                result.Characters,
                result.Events,
                result.MasteryTiers,
                result.Insignias,
                result.Backgears,
                result.BackgearSets,
                result.TacticCards,
                result.TacticFrames,
                dataPath);
        }
        catch
        {
            // The seed is already committed; logging must not trigger a retry.
        }
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

    private static string GetNestedString(JsonElement source, string objectName, string propertyName)
    {
        if (!source.TryGetProperty(objectName, out var nested) || nested.ValueKind != JsonValueKind.Object)
            return string.Empty;
        return GetString(nested, propertyName);
    }

    private static int GetInt(JsonElement source, string propertyName)
    {
        if (!source.TryGetProperty(propertyName, out var property)) return 0;
        return property.TryGetInt32(out var value) ? value : 0;
    }

    private static int? GetNullableInt(JsonElement source, string propertyName)
    {
        if (!source.TryGetProperty(propertyName, out var property)) return null;
        if (property.ValueKind != JsonValueKind.Number) return null;
        return property.TryGetInt32(out var value) ? value : null;
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
