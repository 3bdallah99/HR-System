using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Config
{
    public class LeaveRequestConfiguration : IEntityTypeConfiguration<LeaveRequest>
    {
        public void Configure(EntityTypeBuilder<LeaveRequest> builder)
        {
            builder.ToTable("LeaveRequests");

            builder.HasKey(l => l.Id);

            builder.Property(l => l.StartDate)
                .IsRequired();

            builder.Property(l => l.EndDate)
                .IsRequired();
            // The TotalDays property is calculated and should not be mapped to the database
            builder.Ignore(l => l.TotalDays);

            builder.Property(l => l.LeaveType)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(l => l.Status)
                .IsRequired()
                .HasConversion<string>()
                .HasDefaultValue(LeaveStatus.Pending);

            builder.Property(l => l.Reason)
                .HasMaxLength(500);

            builder.Property(l => l.RejectionNote)
                .HasMaxLength(500);

            builder.Property(l => l.RequestedAt)
                .IsRequired()
                .HasDefaultValueSql("GETUTCDATE()");

            builder.Property(l => l.ReviewedAt)
                .IsRequired(false);

            builder.HasOne(l => l.Employee)
                .WithMany(e => e.LeaveRequests)
                .HasForeignKey(l => l.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(l => l.ReviewedBy)
                .WithMany()
                .HasForeignKey(l => l.ReviewedByEmployeeId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
