using Microsoft.EntityFrameworkCore;
using OpmWiki.Domain.Entities;

namespace OpmWiki.Infrastructure.Persistence;

public sealed class OpmWikiDbContext(DbContextOptions<OpmWikiDbContext> options) : DbContext(options)
{
    public DbSet<Character> Characters => Set<Character>();
    public DbSet<CharacterSkill> CharacterSkills => Set<CharacterSkill>();
    public DbSet<CharacterEffect> CharacterEffects => Set<CharacterEffect>();
    public DbSet<GameEvent> Events => Set<GameEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ConfigureCharacters(modelBuilder);
        ConfigureEvents(modelBuilder);
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
    }
}
