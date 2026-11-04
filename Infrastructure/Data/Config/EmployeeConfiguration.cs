using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Config
{
    public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
    {
        public void Configure(EntityTypeBuilder<Employee> builder)
        {
            builder.HasKey(e => e.Id);
            builder.Property(e => e.Name).HasMaxLength(150).IsRequired();
            builder.Property(e => e.Email).HasMaxLength(150).IsRequired();
            builder.Property(e => e.Phone).HasMaxLength(20);
            builder.Property(e => e.Address).HasMaxLength(500);
            builder.Property(e => e.BadgeNumber).HasMaxLength(50);

            builder.HasIndex(e => e.Email)
                .IsUnique();

            builder.HasIndex(e => e.BadgeNumber);

            // Self-referencing relationship for Manager
            builder.HasOne(e => e.Manager)
                .WithMany()
                .HasForeignKey(e => e.ManagerId)
                .OnDelete(DeleteBehavior.NoAction);

            // Position relationship
            builder.HasOne(e => e.Position)
                .WithMany(p => p.Employees)
                .HasForeignKey(e => e.PositionId)
                .OnDelete(DeleteBehavior.Restrict);

            // Department relationship
            builder.HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
