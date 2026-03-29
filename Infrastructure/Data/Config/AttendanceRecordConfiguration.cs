using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Config
{
    public class AttendanceRecordConfiguration : IEntityTypeConfiguration<AttendanceRecord>
    {
        public void Configure(EntityTypeBuilder<AttendanceRecord> builder)
        {
            builder.HasKey(ar => ar.Id);
            builder.Property(ar => ar.Date)
           .HasColumnType("date")
                   .IsRequired();
            builder.Property(ar => ar.Status)
                   .IsRequired();
            builder.Property(ar => ar.ClockIn)
                   .IsRequired(false);  
            builder.Property(ar => ar.ClockOut)
                   .IsRequired(false);
            builder.HasIndex(ar => new { ar.EmployeeId, ar.Date })
                    .IsUnique();
            // Employee relationship
            builder.HasOne(ar => ar.Employee)
                   .WithMany(e => e.AttendanceRecords)
                   .HasForeignKey(ar => ar.EmployeeId)
                   .OnDelete(DeleteBehavior.Cascade);   
        }
    }
}
