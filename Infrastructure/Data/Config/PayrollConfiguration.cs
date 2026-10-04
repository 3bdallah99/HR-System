using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Config
{
    public class PayrollConfiguration : IEntityTypeConfiguration<Payroll>
    {
        public void Configure(EntityTypeBuilder<Payroll> builder)
        {
            builder.ToTable("Payrolls");
            builder.HasKey(p => p.Id);

            // Ensure one payroll record per employee per month/year
            builder.HasIndex(p => new { p.EmployeeId, p.Month, p.Year }).IsUnique();

            builder.Property(p => p.Month).IsRequired();
            builder.Property(p => p.Year).IsRequired();
            builder.Property(p => p.PaymentDate).IsRequired();

            // Earnings
            builder.Property(p => p.BasicSalary).IsRequired().HasPrecision(18, 2);
            builder.Property(p => p.HousingAllowance).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(p => p.TransportationAllowance).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(p => p.MealAllowance).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(p => p.OtherAllowances).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(p => p.OvertimePay).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(p => p.GrossPay).IsRequired().HasPrecision(18, 2);

            // Deductions
            builder.Property(p => p.AbsenceDeduction).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(p => p.TardinessDeductionMinutes).HasDefaultValue(0);
            builder.Property(p => p.TardinessDeduction).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(p => p.SocialInsurance).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(p => p.TaxAmount).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(p => p.OtherDeductions).HasPrecision(18, 2).HasDefaultValue(0);
            builder.Property(p => p.TotalDeductions).IsRequired().HasPrecision(18, 2);
            builder.Property(p => p.NetPay).IsRequired().HasPrecision(18, 2);

            // Audit
            builder.Property(p => p.WorkingDaysInMonth).IsRequired();
            builder.Property(p => p.DaysPresent).IsRequired();
            builder.Property(p => p.DaysAbsent).IsRequired();
            builder.Property(p => p.ApprovedLeaveDays).IsRequired();
            builder.Property(p => p.TotalLateMinutes).HasDefaultValue(0);

            builder.HasOne(p => p.Employee)
                   .WithMany(e => e.Payrolls)
                   .HasForeignKey(p => p.EmployeeId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
