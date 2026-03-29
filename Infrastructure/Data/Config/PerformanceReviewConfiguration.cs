using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Data.Config
{
    public class PerformanceReviewConfiguration : IEntityTypeConfiguration<PerformanceReviews>
    {
        public void Configure(EntityTypeBuilder<PerformanceReviews> builder)
        {
            builder.ToTable("PerformanceReviews");

            builder.HasKey(p => p.Id);

            builder.Property(p => p.ReviewDate)
                .IsRequired();

            builder.Property(p => p.Rating)
                .IsRequired();

            builder.Property(p => p.Feedback)
                .IsRequired()
                .HasMaxLength(2000);

            builder.Property(p => p.AcknowledgedByEmployee)
                .IsRequired()
                .HasDefaultValue(false);

            builder.Property(p => p.AcknowledgedAt)
                .IsRequired(false);

            // Configure the relationship for Employee
            builder.HasOne(p => p.Employee)
                .WithMany(e => e.PerformanceReviews)
                .HasForeignKey(p => p.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure the relationship for Reviewer (self-referencing to Employee)
            builder.HasOne(p => p.Reviewer)
                .WithMany()
                .HasForeignKey(p => p.ReviewerEmployeeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
