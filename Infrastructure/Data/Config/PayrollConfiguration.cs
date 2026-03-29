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

            // Ensure that each employee has only one payroll record per month and year
            builder.HasIndex(p => new { p.EmployeeId, p.Month, p.Year })
                .IsUnique();

            builder.Property(p => p.Month)
                .IsRequired();

            builder.Property(p => p.Year)
                .IsRequired();

            builder.Property(p => p.PaymentDate)
                .IsRequired();

            builder.Property(p => p.BaseSalary)
                .IsRequired()
                .HasPrecision(18, 2);

            builder.Property(p => p.OvertimePay)
                .IsRequired()
                .HasPrecision(18, 2);

            builder.Property(p => p.Deductions)
                .IsRequired()
                .HasPrecision(18, 2);

            builder.Property(p => p.NetPay)
                .IsRequired()
                .HasPrecision(18, 2);

            builder.Property(p => p.WorkingDaysInMonth)
                .IsRequired();

            builder.Property(p => p.DaysPresent)
                .IsRequired();

            builder.Property(p => p.DaysAbsent)
                .IsRequired();

            builder.Property(p => p.ApprovedLeaveDays)
                .IsRequired();

            builder.HasOne(p => p.Employee)
                .WithMany(e => e.Payrolls)
                .HasForeignKey(p => p.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
