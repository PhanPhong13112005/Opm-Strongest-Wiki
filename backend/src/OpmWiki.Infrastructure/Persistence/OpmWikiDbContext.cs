using Microsoft.EntityFrameworkCore;
using OpmWiki.Domain.Entities;

namespace OpmWiki.Infrastructure.Persistence;

public sealed class OpmWikiDbContext(DbContextOptions<OpmWikiDbContext> options) : DbContext(options)
{
    public DbSet<Character> Characters => Set<Character>();
    public DbSet<CharacterSkill> CharacterSkills => Set<CharacterSkill>();
    public DbSet<CharacterEffect> CharacterEffects => Set<CharacterEffect>();
    public DbSet<GameEvent> Events => Set<GameEvent>();
    public DbSet<MasteryTier> MasteryTiers => Set<MasteryTier>();
    public DbSet<Insignia> Insignias => Set<Insignia>();
    public DbSet<InsigniaGuide> InsigniaGuides => Set<InsigniaGuide>();
    public DbSet<InsigniaGuideLink> InsigniaGuideLinks => Set<InsigniaGuideLink>();
    public DbSet<Backgear> Backgears => Set<Backgear>();
    public DbSet<BackgearSet> BackgearSets => Set<BackgearSet>();
    public DbSet<TacticCard> TacticCards => Set<TacticCard>();
    public DbSet<TacticFrame> TacticFrames => Set<TacticFrame>();
    public DbSet<UserAccount> UserAccounts => Set<UserAccount>();
    public DbSet<EventComment> EventComments => Set<EventComment>();
    public DbSet<ForumTopic> ForumTopics => Set<ForumTopic>();
    public DbSet<ForumPost> ForumPosts => Set<ForumPost>();
    public DbSet<TopUpRequest> TopUpRequests => Set<TopUpRequest>();
    public DbSet<ReleaseScheduleEntry> ReleaseScheduleEntries => Set<ReleaseScheduleEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ConfigureCharacters(modelBuilder);
        ConfigureEvents(modelBuilder);
        ConfigureMastery(modelBuilder);
        ConfigureInsignias(modelBuilder);
        ConfigureBackgears(modelBuilder);
        ConfigureTactics(modelBuilder);
        ConfigureCommunity(modelBuilder);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private static void ConfigureCharacters(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Character>(entity =>
        {
            entity.ToTable("characters");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasMaxLength(80);
            entity.Property(x => x.NameVi).HasMaxLength(200);
            entity.Property(x => x.NameEn).HasMaxLength(200);
            entity.Property(x => x.ImageUrl).HasMaxLength(500);
            entity.Property(x => x.Tier).HasMaxLength(20);
            entity.Property(x => x.TypeVi).HasMaxLength(100);
            entity.Property(x => x.TypeEn).HasMaxLength(100);
            entity.Property(x => x.FactionVi).HasMaxLength(100);
            entity.Property(x => x.FactionEn).HasMaxLength(100);
            entity.Property(x => x.RolesVi).HasColumnType("text[]");
            entity.Property(x => x.RolesEn).HasColumnType("text[]");
            entity.Property(x => x.KeepsakeIcon).HasMaxLength(500);
            entity.Property(x => x.TraitsVi).HasColumnType("text[]");
            entity.Property(x => x.TraitsEn).HasColumnType("text[]");
            entity.Property(x => x.ClassLevel).HasMaxLength(80);
            entity.Property(x => x.ReleaseSea).HasColumnType("date");
            entity.Property(x => x.ReleaseChina).HasColumnType("date");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(x => x.NameVi);
            entity.HasIndex(x => x.NameEn);
            entity.HasIndex(x => new { x.Tier, x.FactionVi, x.TypeVi });

            entity.OwnsOne(x => x.BaseStats, owned =>
            {
                owned.Property(x => x.Atk).HasColumnName("base_atk");
                owned.Property(x => x.Hp).HasColumnName("base_hp");
                owned.Property(x => x.Def).HasColumnName("base_def");
                owned.Property(x => x.Spd).HasColumnName("base_spd");
            });
            entity.OwnsOne(x => x.PvpStats, owned =>
            {
                owned.Property(x => x.Atk).HasColumnName("pvp_atk");
                owned.Property(x => x.Hp).HasColumnName("pvp_hp");
                owned.Property(x => x.Def).HasColumnName("pvp_def");
                owned.Property(x => x.Spd).HasColumnName("pvp_spd");
            });

            entity.HasMany(x => x.Skills)
                .WithOne(x => x.Character)
                .HasForeignKey(x => x.CharacterId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.Effects)
                .WithOne(x => x.Character)
                .HasForeignKey(x => x.CharacterId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CharacterSkill>(entity =>
        {
            entity.ToTable("character_skills");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CharacterId).HasMaxLength(80);
            entity.Property(x => x.NameVi).HasMaxLength(200);
            entity.Property(x => x.NameEn).HasMaxLength(200);
            entity.Property(x => x.TypeVi).HasMaxLength(100);
            entity.Property(x => x.TypeEn).HasMaxLength(100);
            entity.Property(x => x.IconUrl).HasMaxLength(500);
            entity.Property(x => x.AnimationUrl).HasMaxLength(500);
            entity.Property(x => x.KeepsakeIconUrl).HasMaxLength(500);
            entity.HasIndex(x => new { x.CharacterId, x.SortOrder }).IsUnique();
        });

        modelBuilder.Entity<CharacterEffect>(entity =>
        {
            entity.ToTable("character_effects");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CharacterId).HasMaxLength(80);
            entity.Property(x => x.TermVi).HasMaxLength(200);
            entity.Property(x => x.TermEn).HasMaxLength(200);
            entity.HasIndex(x => new { x.CharacterId, x.SortOrder }).IsUnique();
        });
    }

    private static void ConfigureEvents(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<GameEvent>(entity =>
        {
            entity.ToTable("events");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasMaxLength(100);
            entity.Property(x => x.TitleVi).HasMaxLength(300);
            entity.Property(x => x.TitleEn).HasMaxLength(300);
            entity.Property(x => x.Category).HasMaxLength(50);
            entity.Property(x => x.ImageUrl).HasMaxLength(500);
            entity.Property(x => x.DetailImages).HasColumnType("text[]");
            entity.Property(x => x.SectionsJson).HasColumnType("jsonb");
            entity.Property(x => x.StartDate).HasColumnType("date");
            entity.Property(x => x.EndDate).HasColumnType("date");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(x => new { x.StartDate, x.EndDate });
            entity.HasIndex(x => x.Category);
        });
    }

    private static void ConfigureMastery(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MasteryTier>(entity =>
        {
            entity.ToTable("mastery_tiers");
            entity.HasKey(x => new { x.Category, x.Tier });
            entity.Property(x => x.Category).HasMaxLength(20);
            entity.Property(x => x.CostsJson).HasColumnType("jsonb");
            entity.Property(x => x.RequirementsJson).HasColumnType("jsonb");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });
    }

    private static void ConfigureInsignias(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Insignia>(entity =>
        {
            entity.ToTable("insignias");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasMaxLength(80);
            entity.Property(x => x.ClassLevel).HasMaxLength(80);
            entity.Property(x => x.NameVi).HasMaxLength(200);
            entity.Property(x => x.NameEn).HasMaxLength(200);
            entity.Property(x => x.ImageUrl).HasMaxLength(500);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(x => x.ClassLevel).IsUnique();
            entity.HasIndex(x => x.SortOrder).IsUnique();
        });

        modelBuilder.Entity<InsigniaGuide>(entity =>
        {
            entity.ToTable("insignia_guides");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasMaxLength(80);
            entity.Property(x => x.TitleVi).HasMaxLength(200);
            entity.Property(x => x.TitleEn).HasMaxLength(200);
            entity.Property(x => x.ImageUrls).HasColumnType("text[]");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<InsigniaGuideLink>(entity =>
        {
            entity.ToTable("insignia_guide_links");
            entity.HasKey(x => new { x.InsigniaId, x.GuideId });
            entity.Property(x => x.InsigniaId).HasMaxLength(80);
            entity.Property(x => x.GuideId).HasMaxLength(80);
            entity.HasIndex(x => new { x.InsigniaId, x.SortOrder }).IsUnique();
            entity.HasOne(x => x.Insignia)
                .WithMany(x => x.GuideLinks)
                .HasForeignKey(x => x.InsigniaId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Guide)
                .WithMany(x => x.InsigniaLinks)
                .HasForeignKey(x => x.GuideId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureBackgears(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Backgear>(entity =>
        {
            entity.ToTable("backgears");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasMaxLength(80);
            entity.Property(x => x.NameVi).HasMaxLength(200);
            entity.Property(x => x.NameEn).HasMaxLength(200);
            entity.Property(x => x.Theme).HasMaxLength(80);
            entity.Property(x => x.RarityVi).HasMaxLength(100);
            entity.Property(x => x.RarityEn).HasMaxLength(100);
            entity.Property(x => x.IconUrl).HasMaxLength(500);
            entity.Property(x => x.ThumbnailUrl).HasMaxLength(500);
            entity.Property(x => x.SeniorIconUrl).HasMaxLength(500);
            entity.Property(x => x.LevelsJson).HasColumnType("jsonb");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(x => x.SortOrder);
        });

        modelBuilder.Entity<BackgearSet>(entity =>
        {
            entity.ToTable("backgear_sets");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasMaxLength(80);
            entity.Property(x => x.NameVi).HasMaxLength(200);
            entity.Property(x => x.NameEn).HasMaxLength(200);
            entity.Property(x => x.RarityVi).HasMaxLength(100);
            entity.Property(x => x.RarityEn).HasMaxLength(100);
            entity.Property(x => x.RewardIconUrl).HasMaxLength(500);
            entity.Property(x => x.NeedsJson).HasColumnType("jsonb");
            entity.Property(x => x.LevelsJson).HasColumnType("jsonb");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(x => x.SortOrder);
        });
    }

    private static void ConfigureTactics(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TacticCard>(entity =>
        {
            entity.ToTable("tactic_cards");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasMaxLength(80);
            entity.Property(x => x.NameVi).HasMaxLength(200);
            entity.Property(x => x.NameEn).HasMaxLength(200);
            entity.Property(x => x.Icon).HasMaxLength(300);
            entity.Property(x => x.ScalingJson).HasColumnType("jsonb");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(x => x.SortOrder);
        });

        modelBuilder.Entity<TacticFrame>(entity =>
        {
            entity.ToTable("tactic_frames");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasMaxLength(80);
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.Icon).HasMaxLength(300);
            entity.Property(x => x.ColorClass).HasMaxLength(100);
            entity.Property(x => x.BorderClass).HasMaxLength(100);
            entity.Property(x => x.BackgroundClass).HasMaxLength(100);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(x => x.SortOrder);
        });
    }

    private static void ConfigureCommunity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserAccount>(entity =>
        {
            entity.ToTable("user_accounts");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Username).HasMaxLength(30);
            entity.Property(x => x.NormalizedUsername).HasMaxLength(30);
            entity.Property(x => x.DisplayName).HasMaxLength(60);
            entity.Property(x => x.PasswordHash).HasMaxLength(500);
            entity.Property(x => x.Role).HasMaxLength(20);
            entity.Property(x => x.Balance).HasPrecision(18, 2);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(x => x.NormalizedUsername).IsUnique();
            entity.HasIndex(x => x.Role);
        });

        modelBuilder.Entity<EventComment>(entity =>
        {
            entity.ToTable("event_comments");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EventId).HasMaxLength(100);
            entity.Property(x => x.Content).HasMaxLength(1000);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(x => new { x.EventId, x.CreatedAt });
            entity.HasOne<GameEvent>()
                .WithMany()
                .HasForeignKey(x => x.EventId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ForumTopic>(entity =>
        {
            entity.ToTable("forum_topics");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(160);
            entity.Property(x => x.Content).HasMaxLength(5000);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(x => x.UpdatedAt);
            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ForumPost>(entity =>
        {
            entity.ToTable("forum_posts");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Content).HasMaxLength(3000);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(x => new { x.TopicId, x.CreatedAt });
            entity.HasOne(x => x.Topic)
                .WithMany(x => x.Posts)
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TopUpRequest>(entity =>
        {
            entity.ToTable("top_up_requests");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Provider).HasMaxLength(60);
            entity.Property(x => x.ReferenceCode).HasMaxLength(120);
            entity.Property(x => x.Amount).HasPrecision(18, 2);
            entity.Property(x => x.Status).HasMaxLength(20);
            entity.Property(x => x.StaffNote).HasMaxLength(500);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(x => new { x.Status, x.CreatedAt });
            entity.HasIndex(x => new { x.UserId, x.ReferenceCode }).IsUnique();
            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ReviewedBy)
                .WithMany()
                .HasForeignKey(x => x.ReviewedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ReleaseScheduleEntry>(entity =>
        {
            entity.ToTable("release_schedule");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Server).HasMaxLength(10);
            entity.Property(x => x.Date).HasColumnType("date");
            entity.Property(x => x.CharacterId).HasMaxLength(80);
            entity.Property(x => x.BannerImage).HasMaxLength(500);
            entity.Property(x => x.OverrideNameVi).HasMaxLength(200);
            entity.Property(x => x.OverrideNameEn).HasMaxLength(200);
            entity.Property(x => x.OverrideTier).HasMaxLength(20);
            entity.Property(x => x.OverrideFactionVi).HasMaxLength(100);
            entity.Property(x => x.OverrideFactionEn).HasMaxLength(100);
            entity.Property(x => x.OverrideTypeVi).HasMaxLength(100);
            entity.Property(x => x.OverrideTypeEn).HasMaxLength(100);
            entity.Property(x => x.OverrideRoleVi).HasMaxLength(200);
            entity.Property(x => x.OverrideRoleEn).HasMaxLength(200);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(x => new { x.Date, x.Server, x.SortOrder }).IsUnique();

            var seededAt = new DateTimeOffset(2026, 6, 1, 0, 0, 0, TimeSpan.Zero);
            entity.HasData(
                ReleaseSeed(1, "CN", 2026, 6, 1, "100316-urplus", "/Characters/Full_Background/Rover_URplus.png", false, 1, seededAt),
                ReleaseSeed(2, "CN", 2026, 6, 15, "100314-urplus", "/Characters/Full_Background/G5_URplus.png", true, 2, seededAt),
                ReleaseSeed(3, "SEA", 2026, 6, 1, "100312-urplus", "/Characters/Full_Background/Nyan_URplus.png", false, 1, seededAt),
                ReleaseSeed(4, "SEA", 2026, 6, 15, "100029-urplus", "/Characters/Full_Background/Amai_Mask_Urplus.png", true, 2, seededAt),
                ReleaseSeed(5, "CN", 2026, 7, 1, "100013-urplus", "/Characters/Full_Background/ZombIeMan_URplus.png", false, 1, seededAt),
                ReleaseSeed(6, "CN", 2026, 7, 15, "100315-urplus", "/Characters/Full_Background/Bang&Bomb_Urplus.png", true, 2, seededAt),
                ReleaseSeed(7, "SEA", 2026, 7, 1, "100313-urplus", "/Characters/Full_Background/Atomic Samurai_URplus.png", false, 1, seededAt),
                ReleaseSeed(8, "SEA", 2026, 7, 15, "100180-urplus", "/Characters/Full_Background/Tatsumaki_URplus.png", true, 2, seededAt),
                ReleaseSeed(9, "CN", 2026, 8, 1, "unknown", "/Characters/Full_Background/Nhan_Vat_Bi_An.jpg", false, 1, seededAt, "Nhân Vật Bí Ẩn", "Mystery Character", "UR+", "UNKNOWN", "UNKNOWN", "UNKNOWN", "UNKNOWN", "Sức Mạnh Tiềm Ẩn", "Hidden Potential"),
                ReleaseSeed(10, "CN", 2026, 8, 15, "100316-urplus", "/Characters/Full_Background/Rover_URplus.png", true, 2, seededAt),
                ReleaseSeed(11, "SEA", 2026, 8, 1, "100314-urplus", "/Characters/Full_Background/G5_URplus.png", false, 1, seededAt),
                ReleaseSeed(12, "SEA", 2026, 8, 15, "100312-urplus", "/Characters/Full_Background/Nyan_URplus.png", true, 2, seededAt));
        });
    }

    private static ReleaseScheduleEntry ReleaseSeed(
        long id, string server, int year, int month, int day, string characterId, string bannerImage,
        bool isReturn, int sortOrder, DateTimeOffset seededAt,
        string nameVi = "", string nameEn = "", string tier = "", string factionVi = "", string factionEn = "",
        string typeVi = "", string typeEn = "", string roleVi = "", string roleEn = "") => new()
        {
            Id = id,
            Server = server,
            Date = new DateOnly(year, month, day),
            CharacterId = characterId,
            BannerImage = bannerImage,
            IsReturn = isReturn,
            SortOrder = sortOrder,
            OverrideNameVi = nameVi,
            OverrideNameEn = nameEn,
            OverrideTier = tier,
            OverrideFactionVi = factionVi,
            OverrideFactionEn = factionEn,
            OverrideTypeVi = typeVi,
            OverrideTypeEn = typeEn,
            OverrideRoleVi = roleVi,
            OverrideRoleEn = roleEn,
            CreatedAt = seededAt,
            UpdatedAt = seededAt,
        };

    private void UpdateTimestamps()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries<Character>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<GameEvent>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<MasteryTier>())
        {
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<Insignia>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<InsigniaGuide>())
        {
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<Backgear>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<BackgearSet>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<TacticCard>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<TacticFrame>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<UserAccount>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<EventComment>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<ForumTopic>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<ForumPost>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<TopUpRequest>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<ReleaseScheduleEntry>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }
    }
}
