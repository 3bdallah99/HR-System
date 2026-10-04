using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Config
{
    public class SalaryStructureConfiguration : IEntityTypeConfiguration<SalaryStructure>
    {
        public void Configure(EntityTypeBuilder<SalaryStructure> builder)
        {
            builder.ToTable("SalaryStructures");
            builder.HasKey(s => s.Id);

            // One salary structure per employee
            builder.HasIndex(s => s.EmployeeId).IsUnique();

            builder.Property(s => s.BasicSalary).IsRequired().HasPrecision(18, 2);
            builder.Property(s => s.HousingAllowance).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(s => s.TransportationAllowance).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(s => s.MealAllowance).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(s => s.OtherAllowances).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(s => s.OvertimePay).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(s => s.SocialInsurance).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(s => s.TaxAmount).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(s => s.OtherDeductions).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(s => s.LastUpdatedAt).IsRequired();

            builder.HasOne(s => s.Employee)
                   .WithOne(e => e.SalaryStructure)
                   .HasForeignKey<SalaryStructure>(s => s.EmployeeId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
