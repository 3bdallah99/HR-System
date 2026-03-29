using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Config
{
    public class LeaveBalanceConfiguration : IEntityTypeConfiguration<LeaveBalance>
    {
        public void Configure(EntityTypeBuilder<LeaveBalance> builder)
        {
            builder.ToTable("LeaveBalances");

            builder.HasKey(l => l.Id);

            builder.Property(l => l.Year)
                .IsRequired();

            builder.Property(l => l.LeaveType)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(l => l.TotalDays)
                .IsRequired();

            builder.Property(l => l.UsedDays)
                .IsRequired()
                .HasDefaultValue(0);

            // The RemainingDays property is calculated and should not be mapped to the database
            builder.Ignore(l => l.RemainingDays);

            // Ensure that each employee has only one leave balance per year and leave type
            builder.HasIndex(l => new { l.EmployeeId, l.Year, l.LeaveType })
                .IsUnique();

            builder.HasOne(l => l.Employee)
                .WithMany(e => e.LeaveBalances)
                .HasForeignKey(l => l.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
